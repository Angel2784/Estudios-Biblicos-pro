// src/app/api/gemini/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  obtenerExegesis, obtenerComparado, obtenerSermon,
  obtenerRespuestaChat, obtenerArbolPersonajes, obtenerTimeline,
  obtenerExploracionTematica,
  streamGenerateContent, streamChat,
  getExegesisPrompt, getComparadoPrompt, getSermonPrompt,
  type EstiloSermon, type MensajeChat,
} from '@/lib/gemini-server'

const LIMITE_GRATIS = 3
const LIMITE_PREMIUM = 50 // Política de Uso Justo: consultas/día para Premium (admin no tiene tope)
// Con DeepSeek como proveedor principal, el peor caso (50/día todos los días
// del mes = 1500 consultas) cuesta ≈ $1.05 USD/mes, muy por debajo del precio
// del plan Premium — margen seguro incluso con el usuario más activo posible.

// Devuelve la fecha actual en formato YYYY-MM-DD
function getFechaHoy(): string {
  return new Date().toISOString().split('T')[0]
}

// Normaliza un pasaje para usarlo como clave de caché (ej: "  Juan 3:16  " y
// "juan 3:16" deben apuntar al mismo resultado guardado).
function normalizar(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

// Construye la clave de caché para una acción cacheable. 'chat' no se cachea
// porque depende de una conversación única, no de un pasaje fijo.
function claveCache(action: string, params: Record<string, unknown>): string | null {
  switch (action) {
    case 'exegesis':
      return `exegesis:${normalizar(params.pasaje as string)}`
    case 'comparado':
      return `comparado:${normalizar(params.pasaje1 as string)}:${normalizar(params.pasaje2 as string)}`
    case 'sermon':
      return `sermon:${normalizar(params.pasaje as string)}:${params.estilo}`
    case 'personajes':
      return `personajes:${normalizar(params.pasaje as string)}`
    case 'timeline':
      return `timeline:${normalizar(params.pasaje as string)}`
    case 'tematico':
      return `tematico:${normalizar(params.tema as string)}`
    default:
      return null
  }
}

interface Perfil {
  role?: string | null
  premium_hasta?: string | null
  consultas_usadas?: number | null
  fecha_uso?: string | null
}

async function getUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

async function getPerfil(userId: string) {
  const admin = createAdminClient()

  // El perfil se crea automáticamente al registrarse (trigger en Supabase),
  // pero por seguridad lo creamos aquí también si no existiera.
  let { data: perfil } = await admin
    .from('profiles')
    .select('role, premium_hasta, consultas_usadas, fecha_uso')
    .eq('id', userId)
    .single<Perfil>()

  if (!perfil) {
    const { data: nuevo } = await admin
      .from('profiles')
      .insert({ id: userId })
      .select('role, premium_hasta, consultas_usadas, fecha_uso')
      .single<Perfil>()
    perfil = nuevo || {}
  }

  const esAdmin = perfil.role === 'admin'
  const esPremium = !!perfil.premium_hasta && new Date(perfil.premium_hasta) > new Date()

  const hoy = getFechaHoy()
  let consultasUsadas = perfil.consultas_usadas || 0
  if (perfil.fecha_uso !== hoy) {
    consultasUsadas = 0 // Si es un nuevo día, se reinicia el contador a 0
  }

  const limite = esPremium ? LIMITE_PREMIUM : LIMITE_GRATIS
  const restantes = Math.max(0, limite - consultasUsadas)

  return { admin, esAdmin, esPremium, restantes, limite, consultasUsadas, hoy }
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const { esAdmin, esPremium, restantes, limite, consultasUsadas } = await getPerfil(userId)
    if (esAdmin) {
      // Los admin no tienen tope, pero sí queremos ver su conteo REAL (no
      // un -1 que en pantalla no dice nada útil).
      return NextResponse.json({ restantes: -1, limite: -1, esAdmin, esPremium, usadas: consultasUsadas })
    }

    return NextResponse.json({ restantes, limite, esAdmin: false, esPremium, usadas: consultasUsadas })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al consultar estado'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { action, params, userApiKey, stream } = body as { action: string; params: Record<string, unknown>; userApiKey?: string; stream?: boolean }

  try {
    const { admin, esAdmin, esPremium, restantes: restantesActuales, consultasUsadas, hoy, limite } = await getPerfil(userId)

    const usandoKeyPropia = !!userApiKey?.trim()
    // Solo quienes usan su propia API Key quedan totalmente fuera del conteo.
    // Admin sí se cuenta (para ver su número real), pero nunca se bloquea.
    // Premium tiene una Política de Uso Justo de LIMITE_PREMIUM consultas/día.
    const requiereConteo = !usandoKeyPropia
    const requiereLimite = requiereConteo && !esAdmin

    // 1) Se valida el cupo PRIMERO, siempre — incluso si la respuesta terminará
    //    saliendo de la caché. Así un pasaje ya cacheado (ej. "Juan 3:16")
    //    también cuenta contra el límite de consultas del usuario.
    if (requiereLimite && restantesActuales <= 0) {
      const mensaje = esPremium
        ? `Alcanzaste el límite de uso justo de ${LIMITE_PREMIUM} consultas de hoy. Vuelve mañana o escríbenos si necesitas más.`
        : `Alcanzaste tu límite de ${LIMITE_GRATIS} consultas gratis de hoy. Hazte Premium para más consultas diarias.`
      return NextResponse.json(
        { error: mensaje, restantes: 0, limiteAlcanzado: true },
        { status: 429 }
      )
    }

    // 2) Revisamos si esta consulta ya está en caché (mismo pasaje pedido antes
    //    por cualquier usuario). Si existe, la devolvemos sin llamar a la IA,
    //    pero SÍ descontamos el cupo (ya sabemos que tenía cupo disponible).
    const clave = claveCache(action, params)
    if (clave) {
      const { data: cacheado } = await admin
        .from('consultas_cache')
        .select('resultado')
        .eq('clave', clave)
        .single()

      if (cacheado?.resultado) {
        let restantesTrasCache = restantesActuales
        let usadasTrasCache = consultasUsadas
        if (requiereConteo) {
          // Incremento atómico: evita perder conteos si llegan dos
          // peticiones casi al mismo tiempo (p. ej. dos dispositivos).
          const { data: nuevoValor, error: errorRpc } = await admin.rpc('incrementar_consulta', {
            p_user_id: userId,
            p_hoy: hoy,
          })
          if (errorRpc) {
            console.error('incrementar_consulta (cache) falló:', errorRpc)
            return NextResponse.json({ error: `No se pudo registrar el uso: ${errorRpc.message}` }, { status: 500 })
          }
          usadasTrasCache = nuevoValor
          restantesTrasCache = requiereLimite ? Math.max(0, limite - nuevoValor) : -1
        }

        if (stream && typeof cacheado.resultado.texto === 'string') {
          const encoder = new TextEncoder()
          const customStream = new TransformStream()
          const writer = customStream.writable.getWriter()
          ;(async () => {
            try {
              const textoCache = cacheado.resultado.texto as string
              await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk: textoCache })}\n\n`))
              await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true, fullText: textoCache, restantes: restantesTrasCache, usadas: usadasTrasCache, deCache: true })}\n\n`))
            } finally {
              await writer.close()
            }
          })()
          return new Response(customStream.readable, {
            headers: {
              'Content-Type': 'text/event-stream; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform',
              'Connection': 'keep-alive',
            },
          })
        }

        return NextResponse.json({
          ...(cacheado.resultado as Record<string, unknown>),
          restantes: restantesTrasCache,
          usadas: usadasTrasCache,
          deCache: true,
        })
      }
    }

    const apiKey = usandoKeyPropia ? userApiKey!.trim() : process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Servicio no configurado. Falta GEMINI_API_KEY en el servidor.' }, { status: 500 })
    }

    // ─── MODO STREAMING PARA ACCIONES TEXTUALES ─────────────────────────────
    if (stream && (action === 'exegesis' || action === 'comparado' || action === 'sermon' || action === 'chat')) {
      const encoder = new TextEncoder()
      const customStream = new TransformStream()
      const writer = customStream.writable.getWriter()

      ;(async () => {
        let fullText = ''
        try {
          let generator: AsyncGenerator<string, void, unknown>
          if (action === 'exegesis') {
            generator = streamGenerateContent(apiKey, getExegesisPrompt(params.pasaje as string))
          } else if (action === 'comparado') {
            generator = streamGenerateContent(apiKey, getComparadoPrompt(params.pasaje1 as string, params.pasaje2 as string))
          } else if (action === 'sermon') {
            generator = streamGenerateContent(apiKey, getSermonPrompt(params.pasaje as string, params.estilo as EstiloSermon))
          } else {
            generator = streamChat(apiKey, params.pasaje as string, params.textoPasaje as string, params.historial as MensajeChat[])
          }

          for await (const chunk of generator) {
            fullText += chunk
            await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`))
          }

          let restantes = requiereLimite ? restantesActuales - 1 : -1
          let usadas = consultasUsadas
          if (requiereConteo) {
            const { data: nuevoValor, error: errorRpc } = await admin.rpc('incrementar_consulta', {
              p_user_id: userId,
              p_hoy: hoy,
            })
            if (!errorRpc && typeof nuevoValor === 'number') {
              usadas = nuevoValor
              restantes = requiereLimite ? Math.max(0, limite - nuevoValor) : -1
            }
          }

          if (clave && fullText.trim()) {
            await admin
              .from('consultas_cache')
              .upsert({ clave, accion: action, resultado: { texto: fullText } }, { onConflict: 'clave' })
          }

          await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true, fullText, restantes, usadas })}\n\n`))
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Error en generación'
          await writer.write(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
        } finally {
          await writer.close()
        }
      })()

      return new Response(customStream.readable, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      })
    }

    let resultado: Record<string, unknown> = {}

    switch (action) {
      case 'exegesis':
        resultado = { texto: await obtenerExegesis(apiKey, params.pasaje as string) }
        break
      case 'comparado':
        resultado = { texto: await obtenerComparado(apiKey, params.pasaje1 as string, params.pasaje2 as string) }
        break
      case 'sermon':
        resultado = { texto: await obtenerSermon(apiKey, params.pasaje as string, params.estilo as EstiloSermon) }
        break
      case 'chat':
        resultado = { texto: await obtenerRespuestaChat(apiKey, params.pasaje as string, params.textoPasaje as string, params.historial as MensajeChat[]) }
        break
      case 'personajes':
        resultado = { ...(await obtenerArbolPersonajes(apiKey, params.pasaje as string)) }
        break
      case 'timeline':
        resultado = { ...(await obtenerTimeline(apiKey, params.pasaje as string)) }
        break
      case 'tematico':
        resultado = { ...(await obtenerExploracionTematica(apiKey, params.tema as string)) }
        break
      default:
        return NextResponse.json({ error: 'Acción no reconocida.' }, { status: 400 })
    }

    // Persistimos en Supabase el incremento de uso (atómico, evita condiciones
    // de carrera cuando llegan varias peticiones casi al mismo tiempo).
    let restantes = requiereLimite ? restantesActuales - 1 : -1
    let usadas = consultasUsadas
    if (requiereConteo) {
      const { data: nuevoValor, error: errorRpc } = await admin.rpc('incrementar_consulta', {
        p_user_id: userId,
        p_hoy: hoy,
      })
      if (errorRpc) {
        console.error('incrementar_consulta falló:', errorRpc)
        return NextResponse.json({ error: `No se pudo registrar el uso: ${errorRpc.message}` }, { status: 500 })
      }
      usadas = nuevoValor
      restantes = requiereLimite ? Math.max(0, limite - nuevoValor) : -1
    }

    // Guardamos en caché para que futuras consultas del mismo pasaje sean gratis
    if (clave) {
      await admin
        .from('consultas_cache')
        .upsert({ clave, accion: action, resultado }, { onConflict: 'clave' })
    }

    return NextResponse.json({ ...resultado, restantes, usadas })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

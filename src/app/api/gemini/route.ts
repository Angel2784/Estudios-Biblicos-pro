// src/app/api/gemini/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  obtenerExegesis, obtenerComparado, obtenerSermon,
  obtenerRespuestaChat, obtenerArbolPersonajes, obtenerTimeline,
  type EstiloSermon, type MensajeChat,
} from '@/lib/gemini-server'

// ── Límite diario gratis por IP ────────────────────────────────────────────
// ⚠️ Esto vive en memoria: se reinicia en cada "cold start" de la función
// serverless y NO se comparte entre instancias si tienes tráfico alto.
// Para producción real con más usuarios, cambia este Map por Vercel KV
// (Upstash Redis, gratis hasta cierto límite) — es un cambio de 5 líneas.
const usosPorIP = new Map<string, { count: number; resetAt: number }>()
const LIMITE_DIARIO = 8

function getIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

// Consulta el estado SIN gastar una consulta (para mostrar el contador en la UI)
function verEstado(ip: string): { restantes: number } {
  const ahora = Date.now()
  const registro = usosPorIP.get(ip)
  if (!registro || ahora > registro.resetAt) return { restantes: LIMITE_DIARIO }
  return { restantes: Math.max(0, LIMITE_DIARIO - registro.count) }
}

// Consume una consulta del límite diario
function chequearLimite(ip: string): { ok: boolean; restantes: number } {
  const ahora = Date.now()
  const registro = usosPorIP.get(ip)
  if (!registro || ahora > registro.resetAt) {
    usosPorIP.set(ip, { count: 1, resetAt: ahora + 24 * 60 * 60 * 1000 })
    return { ok: true, restantes: LIMITE_DIARIO - 1 }
  }
  if (registro.count >= LIMITE_DIARIO) return { ok: false, restantes: 0 }
  registro.count++
  return { ok: true, restantes: LIMITE_DIARIO - registro.count }
}

// GET /api/gemini → solo consulta el contador, no gasta nada. Usado al cargar la página.
export async function GET(req: NextRequest) {
  const { restantes } = verEstado(getIP(req))
  return NextResponse.json({ restantes, limite: LIMITE_DIARIO })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, params, userApiKey } = body as { action: string; params: Record<string, unknown>; userApiKey?: string }

  const usandoKeyPropia = !!userApiKey?.trim()
  const apiKey = usandoKeyPropia ? userApiKey!.trim() : process.env.GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'Servicio no configurado. Falta GEMINI_API_KEY en el servidor.' }, { status: 500 })
  }

  let restantes = -1 // -1 = key propia, uso ilimitado
  if (!usandoKeyPropia) {
    const ip = getIP(req)
    const resultado = chequearLimite(ip)
    restantes = resultado.restantes
    if (!resultado.ok) {
      return NextResponse.json(
        {
          error: 'Alcanzaste el límite gratis de hoy. Vuelve mañana o conecta tu propia API Key en Ajustes para uso ilimitado, o hazte premium por $14.900 COP/mes.',
          restantes: 0,
          limiteAlcanzado: true,
        },
        { status: 429 }
      )
    }
  }

  try {
    switch (action) {
      case 'exegesis':
        return NextResponse.json({ texto: await obtenerExegesis(apiKey, params.pasaje as string), restantes })
      case 'comparado':
        return NextResponse.json({ texto: await obtenerComparado(apiKey, params.pasaje1 as string, params.pasaje2 as string), restantes })
      case 'sermon':
        return NextResponse.json({ texto: await obtenerSermon(apiKey, params.pasaje as string, params.estilo as EstiloSermon), restantes })
      case 'chat':
        return NextResponse.json({ texto: await obtenerRespuestaChat(apiKey, params.pasaje as string, params.textoPasaje as string, params.historial as MensajeChat[]), restantes })
      case 'personajes':
        return NextResponse.json({ ...(await obtenerArbolPersonajes(apiKey, params.pasaje as string)), restantes })
      case 'timeline':
        return NextResponse.json({ ...(await obtenerTimeline(apiKey, params.pasaje as string)), restantes })
      default:
        return NextResponse.json({ error: 'Acción no reconocida.' }, { status: 400 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

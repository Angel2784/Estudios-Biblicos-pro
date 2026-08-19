// src/app/api/gemini/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import {
  obtenerExegesis, obtenerComparado, obtenerSermon,
  obtenerRespuestaChat, obtenerArbolPersonajes, obtenerTimeline,
  type EstiloSermon, type MensajeChat,
} from '@/lib/gemini-server'

const LIMITE_GRATIS = 3
const PRECIO_MENSUAL = '$14.900 COP/mes'
const PRECIO_ANUAL   = '$149.000 COP/año'

// Devuelve la fecha actual en formato YYYY-MM-DD
function getFechaHoy(): string {
  return new Date().toISOString().split('T')[0]
}

interface UserPublicMeta {
  role?: string
  premiumHasta?: string
}

interface UserPrivateMeta {
  consultasUsadas?: number
  fechaUso?: string
}

async function getPerfil(userId: string) {
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  
  const publicMeta = (user.publicMetadata || {}) as UserPublicMeta
  const privateMeta = (user.privateMetadata || {}) as UserPrivateMeta
  
  const esAdmin = publicMeta.role === 'admin'
  const esPremium = !!publicMeta.premiumHasta && new Date(publicMeta.premiumHasta) > new Date()

  // Conteo de consultas persistido en Clerk
  const hoy = getFechaHoy()
  let consultasUsadas = privateMeta.consultasUsadas || 0
  if (privateMeta.fechaUso !== hoy) {
    consultasUsadas = 0 // Si es un nuevo día, se reinicia el contador a 0
  }

  const restantes = Math.max(0, LIMITE_GRATIS - consultasUsadas)

  return { client, user, esAdmin, esPremium, restantes, consultasUsadas, hoy }
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const { esAdmin, esPremium, restantes } = await getPerfil(userId)
    if (esAdmin || esPremium) {
      return NextResponse.json({ restantes: -1, limite: -1, esAdmin, esPremium })
    }

    return NextResponse.json({ restantes, limite: LIMITE_GRATIS, esAdmin: false, esPremium: false })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al consultar estado'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { action, params, userApiKey } = body as { action: string; params: Record<string, unknown>; userApiKey?: string }

  try {
    const { client, esAdmin, esPremium, restantes: restantesActuales, consultasUsadas, hoy } = await getPerfil(userId)

    const usandoKeyPropia = !!userApiKey?.trim()
    const apiKey = usandoKeyPropia ? userApiKey!.trim() : process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Servicio no configurado. Falta GEMINI_API_KEY en el servidor.' }, { status: 500 })
    }

    let restantes = -1
    const requiereLimite = !usandoKeyPropia && !esAdmin && !esPremium

    if (requiereLimite) {
      if (restantesActuales <= 0) {
        return NextResponse.json(
          { error: `Alcanzaste tu límite de ${LIMITE_GRATIS} consultas gratis de hoy. Hazte Premium para acceso ilimitado.`, restantes: 0, limiteAlcanzado: true },
          { status: 429 }
        )
      }
      restantes = restantesActuales - 1
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
      default:
        return NextResponse.json({ error: 'Acción no reconocida.' }, { status: 400 })
    }

    // Persistimos en Clerk el incremento de uso
    if (requiereLimite) {
      await client.users.updateUserMetadata(userId, {
        privateMetadata: {
          consultasUsadas: consultasUsadas + 1,
          fechaUso: hoy,
        },
      })
    }

    return NextResponse.json({ ...resultado, restantes })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

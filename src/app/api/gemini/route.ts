// src/app/api/gemini/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import {
  obtenerExegesis, obtenerComparado, obtenerSermon,
  obtenerRespuestaChat, obtenerArbolPersonajes, obtenerTimeline,
  type EstiloSermon, type MensajeChat,
} from '@/lib/gemini-server'

// ⚠️ En memoria: se reinicia en cada "cold start". Para más tráfico, usa Vercel KV.
const usosPorUsuario = new Map<string, { count: number; resetAt: number }>()
const LIMITE_GRATIS = 3
const PRECIO_MENSUAL = '$14.900 COP/mes'
const PRECIO_ANUAL   = '$149.000 COP/año'

function chequear(userId: string): { ok: boolean; restantes: number } {
  const ahora = Date.now()
  const registro = usosPorUsuario.get(userId)
  if (!registro || ahora > registro.resetAt) {
    usosPorUsuario.set(userId, { count: 1, resetAt: ahora + 24 * 60 * 60 * 1000 })
    return { ok: true, restantes: LIMITE_GRATIS - 1 }
  }
  if (registro.count >= LIMITE_GRATIS) return { ok: false, restantes: 0 }
  registro.count++
  return { ok: true, restantes: LIMITE_GRATIS - registro.count }
}

function verEstado(userId: string): number {
  const ahora = Date.now()
  const registro = usosPorUsuario.get(userId)
  if (!registro || ahora > registro.resetAt) return LIMITE_GRATIS
  return Math.max(0, LIMITE_GRATIS - registro.count)
}

async function getPerfil(userId: string) {
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const meta = user.publicMetadata as { role?: string; premiumHasta?: string }
  const esAdmin = meta.role === 'admin'
  const esPremium = !!meta.premiumHasta && new Date(meta.premiumHasta) > new Date()
  return { esAdmin, esPremium }
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { esAdmin, esPremium } = await getPerfil(userId)
  if (esAdmin || esPremium) return NextResponse.json({ restantes: -1, limite: -1, esAdmin, esPremium })

  return NextResponse.json({ restantes: verEstado(userId), limite: LIMITE_GRATIS, esAdmin: false, esPremium: false })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { action, params, userApiKey } = body as { action: string; params: Record<string, unknown>; userApiKey?: string }

  const { esAdmin, esPremium } = await getPerfil(userId)

  const usandoKeyPropia = !!userApiKey?.trim()
  const apiKey = usandoKeyPropia ? userApiKey!.trim() : process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Servicio no configurado. Falta GEMINI_API_KEY en el servidor.' }, { status: 500 })
  }

  let restantes = -1
  if (!usandoKeyPropia && !esAdmin && !esPremium) {
    const r = chequear(userId)
    restantes = r.restantes
    if (!r.ok) {
      return NextResponse.json(
        { error: `Alcanzaste tu límite gratis. Hazte premium: ${PRECIO_MENSUAL} o ${PRECIO_ANUAL}.`, restantes: 0, limiteAlcanzado: true },
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

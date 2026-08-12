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

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, params, userApiKey } = body as { action: string; params: Record<string, unknown>; userApiKey?: string }

  // Si el usuario trae su propia key (desde Ajustes), no cuenta contra el límite gratis.
  const usandoKeyPropia = !!userApiKey?.trim()
  const apiKey = usandoKeyPropia ? userApiKey!.trim() : process.env.GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'Servicio no configurado. Falta GEMINI_API_KEY en el servidor.' }, { status: 500 })
  }

  if (!usandoKeyPropia) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { ok } = chequearLimite(ip)
    if (!ok) {
      return NextResponse.json(
        { error: 'Alcanzaste el límite gratis de hoy. Vuelve mañana o conecta tu propia API Key en Ajustes para uso ilimitado.' },
        { status: 429 }
      )
    }
  }

  try {
    switch (action) {
      case 'exegesis':
        return NextResponse.json({ texto: await obtenerExegesis(apiKey, params.pasaje as string) })
      case 'comparado':
        return NextResponse.json({ texto: await obtenerComparado(apiKey, params.pasaje1 as string, params.pasaje2 as string) })
      case 'sermon':
        return NextResponse.json({ texto: await obtenerSermon(apiKey, params.pasaje as string, params.estilo as EstiloSermon) })
      case 'chat':
        return NextResponse.json({ texto: await obtenerRespuestaChat(apiKey, params.pasaje as string, params.textoPasaje as string, params.historial as MensajeChat[]) })
      case 'personajes':
        return NextResponse.json(await obtenerArbolPersonajes(apiKey, params.pasaje as string))
      case 'timeline':
        return NextResponse.json(await obtenerTimeline(apiKey, params.pasaje as string))
      default:
        return NextResponse.json({ error: 'Acción no reconocida.' }, { status: 400 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// src/lib/gemini.ts (cliente)
export type EstiloSermon = 'expositivo' | 'devocional'
export interface MensajeChat { role: 'user' | 'assistant'; content: string }
export interface PersonajeBiblico {
  id: string; nombre: string; emoji: string; rol: string
  descripcionBreve: string; descripcionCompleta: string
  versiculosAparece: string[]; atributos: string[]
  relaciones: { targetId: string; tipo: string }[]
}
export interface ArbolPersonajes { personajes: PersonajeBiblico[]; contexto: string; totalPersonajes: number }
export interface PeriodoBiblico { id: string; nombre: string; color: string; fechaInicio: string; fechaFin: string; descripcion: string }
export interface EventoTimeline {
  id: string; fecha: string; titulo: string; descripcion: string; detalles: string
  tipo: 'principal' | 'contexto' | 'profecia' | 'cumplimiento'; emoji: string
  periodoBiblicoId: string; personajesInvolucrados: string[]; lugarGeografico: string
  referenciasBiblicas: string[]; importanciaTeologica: string
}
export interface Timeline { periodos: PeriodoBiblico[]; eventos: EventoTimeline[]; periodoGeneral: string; contextoHistorico: string }
export interface PasajeTematico { cita: string; explicacion: string }
export interface ExploracionTematica { resumen: string; pasajes: PasajeTematico[]; preguntas: string[] }

export const PRECIO_MENSUAL = '$19.900 COP/mes'
export const PRECIO_ANUAL = '$199.000 COP/año (ahorra 2 meses)'

let restantesCallback: ((restantes: number) => void) | null = null
export function onRestantesChange(cb: (restantes: number) => void) { restantesCallback = cb }

let usadasCallback: ((usadas: number) => void) | null = null
export function onUsadasChange(cb: (usadas: number) => void) { usadasCallback = cb }

async function llamarAPI<T extends { restantes?: number; usadas?: number }>(action: string, params: Record<string, unknown>, userApiKey?: string): Promise<T> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, params, userApiKey: userApiKey || undefined }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  if (typeof data.restantes === 'number' && restantesCallback) restantesCallback(data.restantes)
  if (typeof data.usadas === 'number' && usadasCallback) usadasCallback(data.usadas)
  return data as T
}

export type StreamChunkCallback = (chunk: string, fullText: string) => void

export async function llamarAPIStream(
  action: string,
  params: Record<string, unknown>,
  onChunk: StreamChunkCallback,
  userApiKey?: string
): Promise<string> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, params, userApiKey: userApiKey || undefined, stream: true }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: `Error ${res.status}` }))
    throw new Error(data.error || `Error ${res.status}`)
  }

  const reader = res.body?.getReader()
  if (!reader) {
    throw new Error('El navegador no soporta streaming.')
  }

  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue
        const dataStr = trimmed.slice(5).trim()
        try {
          const parsed = JSON.parse(dataStr)
          if (parsed.error) throw new Error(parsed.error)
          if (parsed.chunk) {
            fullText += parsed.chunk
            onChunk(parsed.chunk, fullText)
          }
          if (parsed.done) {
            if (typeof parsed.restantes === 'number' && restantesCallback) restantesCallback(parsed.restantes)
            if (typeof parsed.usadas === 'number' && usadasCallback) usadasCallback(parsed.usadas)
            if (parsed.fullText) fullText = parsed.fullText
          }
        } catch (e: unknown) {
          if (e instanceof Error && e.message && !e.message.includes('JSON')) throw e
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return fullText
}

export const obtenerExegesisStream = (apiKey: string, pasaje: string, onChunk: StreamChunkCallback) =>
  llamarAPIStream('exegesis', { pasaje }, onChunk, apiKey)

export const obtenerComparadoStream = (apiKey: string, pasaje1: string, pasaje2: string, onChunk: StreamChunkCallback) =>
  llamarAPIStream('comparado', { pasaje1, pasaje2 }, onChunk, apiKey)

export const obtenerSermonStream = (apiKey: string, pasaje: string, estilo: EstiloSermon, onChunk: StreamChunkCallback) =>
  llamarAPIStream('sermon', { pasaje, estilo }, onChunk, apiKey)

export const obtenerRespuestaChatStream = (apiKey: string, pasaje: string, textoPasaje: string, historial: MensajeChat[], onChunk: StreamChunkCallback) =>
  llamarAPIStream('chat', { pasaje, textoPasaje, historial }, onChunk, apiKey)

export async function consultarLimite(): Promise<{ restantes: number; limite: number; esAdmin?: boolean; esPremium?: boolean; usadas?: number }> {
  const res = await fetch('/api/gemini')
  return res.json()
}

export const obtenerExegesis = async (apiKey: string, pasaje: string) =>
  (await llamarAPI<{ texto: string; restantes?: number }>('exegesis', { pasaje }, apiKey)).texto

export const obtenerComparado = async (apiKey: string, pasaje1: string, pasaje2: string) =>
  (await llamarAPI<{ texto: string; restantes?: number }>('comparado', { pasaje1, pasaje2 }, apiKey)).texto

export const obtenerSermon = async (apiKey: string, pasaje: string, estilo: EstiloSermon) =>
  (await llamarAPI<{ texto: string; restantes?: number }>('sermon', { pasaje, estilo }, apiKey)).texto

export const obtenerRespuestaChat = async (apiKey: string, pasaje: string, textoPasaje: string, historial: MensajeChat[]) =>
  (await llamarAPI<{ texto: string; restantes?: number }>('chat', { pasaje, textoPasaje, historial }, apiKey)).texto

export const obtenerArbolPersonajes = async (apiKey: string, pasaje: string) =>
  llamarAPI<ArbolPersonajes & { restantes?: number }>('personajes', { pasaje }, apiKey)

export const obtenerTimeline = async (apiKey: string, pasaje: string) =>
  llamarAPI<Timeline & { restantes?: number }>('timeline', { pasaje }, apiKey)

export const obtenerExploracionTematica = async (apiKey: string, tema: string) =>
  llamarAPI<ExploracionTematica & { restantes?: number }>('tematico', { tema }, apiKey)

export async function testApiKey(apiKey: string): Promise<{ ok: boolean; model: string; error?: string }> {
  try {
    await obtenerExegesis(apiKey, 'Juan 3:16')
    return { ok: true, model: 'gemini' }
  } catch (err) {
    return { ok: false, model: '', error: err instanceof Error ? err.message : 'Error' }
  }
}

// src/lib/gemini.ts (cliente — sustituye al archivo original)
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

async function llamarAPI<T>(action: string, params: Record<string, unknown>, userApiKey?: string): Promise<T> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, params, userApiKey: userApiKey || undefined }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data as T
}

// apiKey aquí es OPCIONAL: solo se usa si el usuario conectó su propia key en Ajustes.
// Si va vacío (''), el backend usa la key compartida del servidor.
export const obtenerExegesis = async (apiKey: string, pasaje: string) =>
  (await llamarAPI<{ texto: string }>('exegesis', { pasaje }, apiKey)).texto

export const obtenerComparado = async (apiKey: string, pasaje1: string, pasaje2: string) =>
  (await llamarAPI<{ texto: string }>('comparado', { pasaje1, pasaje2 }, apiKey)).texto

export const obtenerSermon = async (apiKey: string, pasaje: string, estilo: EstiloSermon) =>
  (await llamarAPI<{ texto: string }>('sermon', { pasaje, estilo }, apiKey)).texto

export const obtenerRespuestaChat = async (apiKey: string, pasaje: string, textoPasaje: string, historial: MensajeChat[]) =>
  (await llamarAPI<{ texto: string }>('chat', { pasaje, textoPasaje, historial }, apiKey)).texto

export const obtenerArbolPersonajes = async (apiKey: string, pasaje: string) =>
  llamarAPI<ArbolPersonajes>('personajes', { pasaje }, apiKey)

export const obtenerTimeline = async (apiKey: string, pasaje: string) =>
  llamarAPI<Timeline>('timeline', { pasaje }, apiKey)

// testApiKey ya no es necesario para el flujo principal, pero lo dejamos
// para el botón de "probar mi propia key" en Ajustes.
export async function testApiKey(apiKey: string): Promise<{ ok: boolean; model: string; error?: string }> {
  try {
    await obtenerExegesis(apiKey, 'Juan 3:16')
    return { ok: true, model: 'gemini' }
  } catch (err) {
    return { ok: false, model: '', error: err instanceof Error ? err.message : 'Error' }
  }
}

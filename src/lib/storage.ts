// src/lib/storage.ts

export interface Anotacion {
  id: string
  fragmento: string
  hex: string
  color: string
  nota: string
  fecha: string
}

export interface EstudioGuardado {
  cita: string
  texto: string
  fecha: string
  anotaciones: Anotacion[]
}

const PREFIX = 'ebp_'

// ── API Key ──────────────────────────────────────────────────────────────────
export const getApiKey = (): string =>
  (typeof window !== 'undefined' ? localStorage.getItem(`${PREFIX}apikey`) : null) || ''
export const setApiKey = (key: string) =>
  typeof window !== 'undefined' && localStorage.setItem(`${PREFIX}apikey`, key)

// ── Estudios guardados ────────────────────────────────────────────────────────
export const getEstudios = (): EstudioGuardado[] => {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(`${PREFIX}estudios`) || '[]') }
  catch { return [] }
}

export const guardarEstudio = (estudio: EstudioGuardado) => {
  if (typeof window === 'undefined') return
  const estudios = getEstudios()
  const idx = estudios.findIndex(e => e.cita === estudio.cita)
  if (idx >= 0) estudios[idx] = estudio
  else estudios.unshift(estudio)
  localStorage.setItem(`${PREFIX}estudios`, JSON.stringify(estudios))
}

export const eliminarEstudio = (cita: string) => {
  if (typeof window === 'undefined') return
  const estudios = getEstudios().filter(e => e.cita !== cita)
  localStorage.setItem(`${PREFIX}estudios`, JSON.stringify(estudios))
}

// ── Anotaciones ───────────────────────────────────────────────────────────────
export const getAnotaciones = (cita: string): Anotacion[] => {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(`${PREFIX}an_${cita}`) || '[]') }
  catch { return [] }
}

export const guardarAnotaciones = (cita: string, anotaciones: Anotacion[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${PREFIX}an_${cita}`, JSON.stringify(anotaciones))
}

// ── Comparados guardados ──────────────────────────────────────────────────────
export const getComparados = (): EstudioGuardado[] => {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(`${PREFIX}comparados`) || '[]') }
  catch { return [] }
}

export const guardarComparado = (estudio: EstudioGuardado) => {
  if (typeof window === 'undefined') return
  const lista = getComparados()
  const idx = lista.findIndex(e => e.cita === estudio.cita)
  if (idx >= 0) lista[idx] = estudio
  else lista.unshift(estudio)
  localStorage.setItem(`${PREFIX}comparados`, JSON.stringify(lista))
}

// ── Exportar biblioteca como JSON ─────────────────────────────────────────────
export const exportarBiblioteca = () => {
  if (typeof window === 'undefined') return
  const data = {
    estudios: getEstudios(),
    comparados: getComparados(),
    exportado: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `biblioteca_biblica_${new Date().toLocaleDateString('es')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

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
  anotaciones?: Anotacion[]
}

export interface SermonGuardado {
  cita: string
  texto: string
  fecha: string
  estilo: string
}

export interface HistorialItem {
  id: string
  tipo: 'estudio' | 'comparado' | 'sermon'
  cita: string
  texto: string
  fecha: string
  extra?: string
}

let usuarioId: string | null = null
export const setUsuarioActual = (id: string | null) => { 
  usuarioId = id 
  notificarCambio()
}

const PREFIX = () => `ebp_${usuarioId ?? 'anon'}_`

const notificarCambio = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('ebp_storage_updated'))
  }
}

// ── API Key ──────────────────────────────────────────────────────────────────
export const getApiKey = (): string =>
  (typeof window !== 'undefined' ? localStorage.getItem(`${PREFIX()}apikey`) : null) || ''
export const setApiKey = (key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${PREFIX()}apikey`, key)
    notificarCambio()
  }
}

// ── 🕒 HISTORIAL (Registro automático de consultas) ───────────────────────────
export const getHistorial = (): HistorialItem[] => {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(`${PREFIX()}historial`) || '[]') }
  catch { return [] }
}

export const agregarAlHistorial = (item: Omit<HistorialItem, 'id'>) => {
  if (typeof window === 'undefined') return
  const historial = getHistorial()
  const nuevoItem: HistorialItem = {
    ...item,
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  }
  // Eliminar duplicados previos de la misma cita para no saturar
  const filtrado = historial.filter(h => !(h.tipo === item.tipo && h.cita.toLowerCase() === item.cita.toLowerCase() && h.extra === item.extra))
  filtrado.unshift(nuevoItem)
  localStorage.setItem(`${PREFIX()}historial`, JSON.stringify(filtrado.slice(0, 50))) // Guardar hasta 50
  notificarCambio()
}

export const eliminarDelHistorial = (id: string) => {
  if (typeof window === 'undefined') return
  const filtrado = getHistorial().filter(h => h.id !== id)
  localStorage.setItem(`${PREFIX()}historial`, JSON.stringify(filtrado))
  notificarCambio()
}

// ── 📚 BIBLIOTECA: Estudios guardados manualmente ─────────────────────────────
export const getEstudios = (): EstudioGuardado[] => {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(`${PREFIX()}estudios`) || '[]') }
  catch { return [] }
}
export const guardarEstudio = (estudio: EstudioGuardado) => {
  if (typeof window === 'undefined') return
  const estudios = getEstudios()
  const idx = estudios.findIndex(e => e.cita.toLowerCase() === estudio.cita.toLowerCase())
  if (idx >= 0) estudios[idx] = estudio
  else estudios.unshift(estudio)
  localStorage.setItem(`${PREFIX()}estudios`, JSON.stringify(estudios))
  notificarCambio()
}
export const eliminarEstudio = (cita: string) => {
  if (typeof window === 'undefined') return
  const estudios = getEstudios().filter(e => e.cita !== cita)
  localStorage.setItem(`${PREFIX()}estudios`, JSON.stringify(estudios))
  notificarCambio()
}

// ── Anotaciones ──────────────────────────────────────────────────────────────
export const getAnotaciones = (cita: string): Anotacion[] => {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(`${PREFIX()}an_${cita}`) || '[]') }
  catch { return [] }
}
export const guardarAnotaciones = (cita: string, anotaciones: Anotacion[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${PREFIX()}an_${cita}`, JSON.stringify(anotaciones))
  notificarCambio()
}

// ── 📚 BIBLIOTECA: Comparados guardados manualmente ───────────────────────────
export const getComparados = (): EstudioGuardado[] => {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(`${PREFIX()}comparados`) || '[]') }
  catch { return [] }
}
export const guardarComparado = (estudio: EstudioGuardado) => {
  if (typeof window === 'undefined') return
  const lista = getComparados()
  const idx = lista.findIndex(e => e.cita.toLowerCase() === estudio.cita.toLowerCase())
  if (idx >= 0) lista[idx] = estudio
  else lista.unshift(estudio)
  localStorage.setItem(`${PREFIX()}comparados`, JSON.stringify(lista))
  notificarCambio()
}

// ── 📚 BIBLIOTECA: Sermones guardados manualmente ─────────────────────────────
export const getSermones = (): SermonGuardado[] => {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(`${PREFIX()}sermones`) || '[]') }
  catch { return [] }
}
export const guardarSermon = (sermon: SermonGuardado) => {
  if (typeof window === 'undefined') return
  const lista = getSermones()
  const idx = lista.findIndex(s => s.cita.toLowerCase() === sermon.cita.toLowerCase() && s.estilo === sermon.estilo)
  if (idx >= 0) lista[idx] = sermon
  else lista.unshift(sermon)
  localStorage.setItem(`${PREFIX()}sermones`, JSON.stringify(lista))
  notificarCambio()
}
export const eliminarSermon = (cita: string, estilo: string) => {
  if (typeof window === 'undefined') return
  const lista = getSermones().filter(s => !(s.cita === cita && s.estilo === estilo))
  localStorage.setItem(`${PREFIX()}sermones`, JSON.stringify(lista))
  notificarCambio()
}

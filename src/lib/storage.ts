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

// ── Helpers de serialización ──────────────────────────────────────────────────

/**
 * Replacer para JSON.stringify:
 * Convierte el campo "texto" de string a array de líneas
 * para que el JSON exportado sea legible verticalmente.
 */
const replacerExport = (_key: string, value: unknown): unknown => {
  if (_key === 'texto' && typeof value === 'string') {
    return value.split('\n')
  }
  return value
}

/**
 * Normaliza un estudio al importarlo:
 * Si "texto" viene como array de líneas (exportación legible),
 * lo une de nuevo en un string con saltos de línea.
 */
const normalizarEstudio = (e: EstudioGuardado & { texto: string | string[] }): EstudioGuardado => ({
  ...e,
  texto: Array.isArray(e.texto) ? e.texto.join('\n') : e.texto,
})

// ── Exportar biblioteca como JSON ─────────────────────────────────────────────
export const exportarBiblioteca = () => {
  if (typeof window === 'undefined') return

  const data = {
    estudios: getEstudios(),
    comparados: getComparados(),
    exportado: new Date().toISOString(),
  }

  // ✅ replacerExport convierte "texto" en array de líneas → JSON vertical y legible
  const blob = new Blob([JSON.stringify(data, replacerExport, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `biblioteca_biblica_${new Date().toLocaleDateString('es')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Importar biblioteca desde JSON ────────────────────────────────────────────
export const importarBiblioteca = (jsonString: string): boolean => {
  if (typeof window === 'undefined') return false
  try {
    const data = JSON.parse(jsonString)

    // Normalizar estudios (texto puede ser array o string según versión del export)
    if (Array.isArray(data.estudios)) {
      const estudiosExistentes = getEstudios()
      const citasExistentes = new Set(estudiosExistentes.map((e) => e.cita))
      const nuevos = (data.estudios as (EstudioGuardado & { texto: string | string[] })[])
        .map(normalizarEstudio)
        .filter((e) => !citasExistentes.has(e.cita))
      const merged = [...nuevos, ...estudiosExistentes]
      localStorage.setItem(`${PREFIX}estudios`, JSON.stringify(merged))
    }

    if (Array.isArray(data.comparados)) {
      const comparadosExistentes = getComparados()
      const citasExistentes = new Set(comparadosExistentes.map((e) => e.cita))
      const nuevos = (data.comparados as (EstudioGuardado & { texto: string | string[] })[])
        .map(normalizarEstudio)
        .filter((e) => !citasExistentes.has(e.cita))
      const merged = [...nuevos, ...comparadosExistentes]
      localStorage.setItem(`${PREFIX}comparados`, JSON.stringify(merged))
    }

    return true
  } catch {
    return false
  }
}

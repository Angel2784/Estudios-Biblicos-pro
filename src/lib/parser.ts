// src/lib/parser.ts

const PATRON_BIBLICO = /(\b(?:[123]\s+)?(?:[A-ZÁÉÍÓÚ][a-záéíóúA-ZÁÉÍÓÚ]+))\s+(\d+:\d+(?:-\d+)?)/g
const URL_BASE = 'https://www.biblegateway.com/passage/?search={libro}+{pasaje}&version=RVR1960'

export function convertirEnlacesBiblicos(texto: string): string {
  return texto.replace(PATRON_BIBLICO, (_, libro, pasaje) => {
    const url = URL_BASE
      .replace('{libro}', encodeURIComponent(libro))
      .replace('{pasaje}', encodeURIComponent(pasaje))
    return `<a href="${url}" target="_blank" rel="noopener" class="bible-link">${libro} ${pasaje}</a>`
  })
}

// Palabras clave temáticas para identificar de forma 100% precisa cada sección real del estudio
const PALABRAS_CLAVE_SECCION: Record<number, string[]> = {
  1: ['texto', 'pasaje', 'lectura', 'biblico', 'bíblico', 'versiones'],
  2: ['referencia', 'cruzad', 'paralel', 'pasajes', 'relacionad'],
  3: ['lingüístic', 'linguistic', 'idioma', 'original', 'hebreo', 'griego', 'arameo', 'palabra', 'léxic', 'lexic', 'morfolog'],
  4: ['contexto', 'históric', 'historic', 'cultural', 'autor', 'destinatario', 'fecha', 'trasfondo'],
  5: ['exégesis', 'exegesis', 'análisis', 'analisis', 'versículo', 'versiculo', 'desarrollo', 'estudio'],
  6: ['reino', 'teología', 'teologia', 'cristocéntric', 'cristocentric', 'mesiánic', 'mesianic', 'doctrina'],
  7: ['aplicación', 'aplicacion', 'práctica', 'practica', 'pastoral', 'vida', 'personal', 'actual'],
  8: ['versión', 'version', 'versiones', 'traducción', 'traduccion', 'comparación', 'comparacion'],
  9: ['cronología', 'cronologia', 'tiempo', 'temporal', 'época', 'epoca', 'fechas', 'periodo'],
  10: ['geografía', 'geografia', 'mapa', 'lugar', 'lugares', 'ubicación', 'ubicacion', 'territorio'],
  11: ['conclusión', 'conclusion', 'resumen', 'síntesis', 'sintesis', 'cierre', 'final'],
  12: ['reflexión', 'reflexion', 'pregunta', 'preguntas', 'devocional', 'meditaci', 'estudio grupal'],
  13: ['recurso', 'recursos', 'bibliografía', 'bibliografia', 'comentario', 'comentarios', 'fuentes', 'lecturas']
}

function esEncabezadoSeccion(linea: string, num: number): boolean {
  const l = linea.trim()
  if (!l) return false

  // Debe empezar con formato de título: # 1, ## 1, **1., 1., 1), etc.
  const regexNumero = new RegExp(`^(?:#{1,6}\\s*)?(?:\\*{1,2})?\\s*${num}(?:[.)\\s:\\-–]|\\*\\*|\\s*\\.)`, 'i')
  if (!regexNumero.test(l)) return false

  // Normalizar texto para comparar palabras clave sin acentos
  const lower = l.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  const keywords = PALABRAS_CLAVE_SECCION[num] || []
  const tienePalabraClave = keywords.some(k => lower.includes(k.normalize("NFD").replace(/[\u0300-\u036f]/g, "")))

  // Si tiene formato de título Markdown (# o **) y no es una cita larga
  const esMarkdownHeader = /^#{1,6}\s*\d+/.test(l) || /^\*\*\s*\d+[.)]/.test(l)

  return tienePalabraClave || (esMarkdownHeader && l.length < 90)
}

export function extraerSeccion(texto: string, numInicio: number, numFin?: number): string {
  const lineas = texto.split('\n')
  let inicioIdx: number | null = null
  let finIdx = lineas.length

  for (let i = 0; i < lineas.length; i++) {
    if (inicioIdx === null && esEncabezadoSeccion(lineas[i], numInicio)) {
      inicioIdx = i
      continue
    }
    if (inicioIdx !== null) {
      if (numFin && esEncabezadoSeccion(lineas[i], numFin)) {
        finIdx = i
        break
      }
      if (!numFin && /^(?:#{1,6}\s*)?(?:\*{1,2})?\s*([1-9]\d?)[.)\s]/.test(lineas[i])) {
        const match = lineas[i].match(/^(?:#{1,6}\s*)?(?:\*{1,2})?\s*([1-9]\d?)[.)\s]/)
        if (match) {
          const sigNum = parseInt(match[1], 10)
          if (sigNum > numInicio && esEncabezadoSeccion(lineas[i], sigNum)) {
            finIdx = i
            break
          }
        }
      }
    }
  }

  if (inicioIdx !== null) return lineas.slice(inicioIdx, finIdx).join('\n').trim()
  return '⚠️ Sección no disponible.'
}

// ─── Lista de lugares bíblicos conocidos ──────
const LUGARES_BIBLICOS: string[] = [
  'Jerusalén', 'Jerusalem', 'Belén', 'Bethlehem', 'Nazaret', 'Nazareth',
  'Capernaum', 'Cafarnaúm', 'Cafarnaum', 'Jericó', 'Jericho',
  'Samaria', 'Galilea', 'Judea', 'Judá',
  'Monte Sinaí', 'Sinaí', 'Sinai',
  'Monte Sión', 'Sión', 'Zion',
  'Monte Carmelo', 'Carmelo',
  'Monte de los Olivos', 'Getsemaní', 'Gethsemane',
  'Templo de Jerusalén', 'Templo de Salomón',
  'Mar de Galilea', 'Lago de Genesaret', 'Tiberíades',
  'Mar Muerto', 'Río Jordán', 'Jordán',
  'Nínive', 'Nineveh', 'Babilonia', 'Babylon',
  'Ur de los Caldeos', 'Ur',
  'Egipto', 'Egypt',
  'Canaán', 'Canaan',
  'Damasco', 'Damascus',
  'Antioquía', 'Antioch',
  'Corinto', 'Corinth',
  'Éfeso', 'Ephesus',
  'Filipo', 'Filipos', 'Philippi',
  'Tesalónica', 'Thessalonica',
  'Roma', 'Rome',
  'Alejandría', 'Alexandria',
  'Tiro', 'Tyre', 'Sidón', 'Sidon',
  'Betel', 'Bethel',
  'Hebrón', 'Hebron',
  'Beerseba', 'Beersheba',
  'Gaza', 'Ascalón', 'Ashdod',
  'Mesopotamia', 'Persia',
  'Grecia', 'Greece', 'Macedonia',
  'Patmos'
]

export function extraerLugarGeografico(texto: string): string | null {
  const matchMarcador = texto.match(/\[\[(.+?)\]\]/)
  if (matchMarcador) return matchMarcador[1].trim()

  const seccionGeo = extraerSeccion(texto, 10, 11)
  const fuente = seccionGeo !== '⚠️ Sección no disponible.' ? seccionGeo : texto

  for (const lugar of LUGARES_BIBLICOS) {
    const regex = new RegExp(`\\b${lugar}\\b`, 'i')
    if (regex.test(fuente)) return lugar
  }

  const patronesContexto = [
    /(?:ubicad[ao]|situad[ao]|localizad[ao])\s+en\s+([A-ZÁÉÍÓÚ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚ][a-záéíóúñ]+)?)/i,
    /(?:ciudad\s+de|región\s+de|valle\s+de|monte\s+de|lago\s+de|mar\s+de|río\s+de)\s+([A-ZÁÉÍÓÚ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚ][a-záéíóúñ]+)?)/i,
    /(?:en\s+la\s+ciudad\s+de|en\s+la\s+región\s+de)\s+([A-ZÁÉÍÓÚ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚ][a-záéíóúñ]+)?)/i,
    /\ben\s+([A-ZÁÉÍÓÚ][a-záéíóúñ]{3,})\b/
  ]

  for (const patron of patronesContexto) {
    const m = fuente.match(patron)
    if (m && m[1]) {
      const candidato = m[1].trim()
      const palabrasComunes = ['Este', 'Esta', 'Esto', 'Dios', 'Cristo', 'Jesús', 'Israel', 'Pablo', 'Juan', 'Moisés']
      if (!palabrasComunes.includes(candidato)) return candidato
    }
  }

  return null
}

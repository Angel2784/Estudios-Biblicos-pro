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

export function extraerSeccion(texto: string, numInicio: number, numFin?: number): string {
  const lineas = texto.split('\n')
  let inicioIdx: number | null = null
  let finIdx = lineas.length

  // Cubre todos los formatos que Gemini puede generar:
  // "1. Título"  "1) Título"  "## 1. Título"  "**1. Título**"  "# 1 Título"
  const makePatron = (n: number) =>
    new RegExp(`^\\s*(?:#{1,6}\\s*)?(?:\\*{1,2})?\\s*${n}[.)\\s]`)

  const patronInicio = makePatron(numInicio)
  const patronFin    = numFin ? makePatron(numFin) : null

  for (let i = 0; i < lineas.length; i++) {
    if (inicioIdx === null && patronInicio.test(lineas[i])) {
      inicioIdx = i
      continue
    }
    if (inicioIdx !== null && patronFin && patronFin.test(lineas[i])) {
      finIdx = i
      break
    }
  }

  if (inicioIdx !== null) return lineas.slice(inicioIdx, finIdx).join('\n').trim()
  return '⚠️ Sección no disponible.'
}

// ─── Lista de lugares bíblicos conocidos (orden: más específico primero) ──────
const LUGARES_BIBLICOS: string[] = [
  // Israel / Palestina
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
  'Patmos',
]

/**
 * Extrae el lugar geográfico principal del texto del estudio.
 * Estrategia:
 *   1. Busca el marcador explícito [[NombreLugar]] (si Gemini lo genera)
 *   2. Extrae la sección 10 (Geografía) y busca menciones de lugares bíblicos conocidos
 *   3. Busca patrones lingüísticos como "situado en X", "ciudad de X", etc.
 *   4. Busca en el texto completo como último recurso
 */
export function extraerLugarGeografico(texto: string): string | null {
  // 1. Marcador explícito [[Lugar]]
  const matchMarcador = texto.match(/\[\[(.+?)\]\]/)
  if (matchMarcador) return matchMarcador[1].trim()

  // 2. Extraer texto de sección Geografía (sección 10)
  const seccionGeo = extraerSeccion(texto, 10, 11)
  const fuente = seccionGeo !== '⚠️ Sección no disponible.' ? seccionGeo : texto

  // 3. Buscar lugares bíblicos conocidos en la sección
  for (const lugar of LUGARES_BIBLICOS) {
    const regex = new RegExp(`\\b${lugar}\\b`, 'i')
    if (regex.test(fuente)) return lugar
  }

  // 4. Patrones lingüísticos: "ubicado/a en X", "ciudad de X", "región de X"
  const patronesContexto = [
    /(?:ubicad[ao]|situad[ao]|localizad[ao])\s+en\s+([A-ZÁÉÍÓÚ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚ][a-záéíóúñ]+)?)/i,
    /(?:ciudad\s+de|región\s+de|valle\s+de|monte\s+de|lago\s+de|mar\s+de|río\s+de)\s+([A-ZÁÉÍÓÚ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚ][a-záéíóúñ]+)?)/i,
    /(?:en\s+la\s+ciudad\s+de|en\s+la\s+región\s+de)\s+([A-ZÁÉÍÓÚ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚ][a-záéíóúñ]+)?)/i,
    /\ben\s+([A-ZÁÉÍÓÚ][a-záéíóúñ]{3,})\b/,
  ]

  for (const patron of patronesContexto) {
    const m = fuente.match(patron)
    if (m && m[1]) {
      const candidato = m[1].trim()
      // Descartar palabras comunes que no son lugares
      const palabrasComunes = ['Este', 'Esta', 'Esto', 'Dios', 'Cristo', 'Jesús', 'Israel', 'Pablo', 'Juan', 'Moisés']
      if (!palabrasComunes.includes(candidato)) return candidato
    }
  }

  return null
}

export function markdownToHtml(texto: string): string {
  return texto
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^#{1,3}\s+(.+)$/gm, '<h3 class="section-title">$1</h3>')
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])(.+)$/gm, '$1')
}

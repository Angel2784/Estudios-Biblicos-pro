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

  const patronInicio = new RegExp(`^[\\s#*]*${numInicio}[.)\\s]`)
  const patronFin = numFin ? new RegExp(`^[\\s#*]*${numFin}[.)\\s]`) : null

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

export function extraerLugarGeografico(texto: string): string | null {
  const match = texto.match(/\[\[(.+?)\]\]/)
  return match ? match[1] : null
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

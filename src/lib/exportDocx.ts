import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ShadingType,
  PageBreak,
} from 'docx'
import { saveAs } from 'file-saver'
import type { EstudioGuardado } from './storage'

const SECTION_LABELS: Record<number, string> = {
  1:  '📖 Texto Bíblico',
  2:  '🔗 Referencias Cruzadas',
  3:  '🔡 Análisis Lingüístico',
  4:  '🏛️ Contexto Histórico-Cultural',
  5:  '🔍 Exégesis Versículo a Versículo',
  6:  '👑 Teología del Reino',
  7:  '💡 Aplicación Práctica',
  8:  '⚖️ Comparación de Versiones',
  9:  '📅 Cronología Bíblica',
  10: '🗺️ Geografía Bíblica',
  11: '🏁 Conclusión',
  12: '❓ Preguntas de Reflexión',
  13: '📚 Recursos Adicionales',
}

/** Convierte el texto de un estudio en párrafos Word */
function buildStudyParagraphs(cita: string, texto: string, fecha: string): Paragraph[] {
  const children: Paragraph[] = []

  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'ESTUDIO BÍBLICO PRO', bold: true, size: 36, color: '1e3a5f' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Exégesis Académica', size: 26, color: '7a6230', italics: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: cita, bold: true, size: 32, color: 'b8860b' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: fecha, size: 20, color: '888888' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      border: { bottom: { color: 'b8860b', style: BorderStyle.SINGLE, size: 6 } },
    }),
  )

  for (const raw of texto.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    const secMatch = line.match(/^##\s*(\d+)(.*)/)
    if (secMatch) {
      const label = SECTION_LABELS[parseInt(secMatch[1])] ?? `Sección ${secMatch[1]}`
      children.push(new Paragraph({
        children: [new TextRun({ text: label, bold: true, size: 28, color: '1e3a5f' })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 500, after: 200 },
        shading: { type: ShadingType.SOLID, color: 'eef3fa', fill: 'eef3fa' },
        border: { left: { color: 'b8860b', style: BorderStyle.SINGLE, size: 12 } },
      }))
      continue
    }

    const boldMatch = line.match(/^\*\*(.+)\*\*$/)
    if (boldMatch) {
      children.push(new Paragraph({
        children: [new TextRun({ text: boldMatch[1], bold: true, size: 22, color: '1e3a5f' })],
        spacing: { before: 200, after: 80 },
      }))
      continue
    }

    if (line.includes('**')) {
      const parts = line.split(/\*\*/)
      children.push(new Paragraph({
        children: parts.map((p, i) => new TextRun({ text: p, bold: i % 2 === 1, size: 22 })),
        spacing: { after: 120 },
        alignment: AlignmentType.JUSTIFIED,
      }))
      continue
    }

    if (/^[-•]\s+/.test(line)) {
      children.push(new Paragraph({
        children: [new TextRun({ text: line.replace(/^[-•]\s+/, '• '), size: 22 })],
        spacing: { after: 80 },
        indent: { left: 400 },
      }))
      continue
    }

    children.push(new Paragraph({
      children: [new TextRun({ text: line, size: 22 })],
      spacing: { after: 120 },
      alignment: AlignmentType.JUSTIFIED,
    }))
  }

  children.push(new Paragraph({
    children: [new TextRun({ text: 'Generado por Estudio Bíblico Pro', size: 18, color: 'aaaaaa', italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 600 },
    border: { top: { color: 'b8860b', style: BorderStyle.SINGLE, size: 4 } },
  }))

  return children
}

/** Construye el Blob .docx sin descargarlo (para guardar con File System API) */
export async function construirDocxBlob(cita: string, texto: string): Promise<Blob> {
  const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  const doc = new Document({
    creator: 'Estudio Bíblico Pro',
    title: `Exégesis: ${cita}`,
    sections: [{ children: buildStudyParagraphs(cita, texto, fecha) }],
  })
  return Packer.toBlob(doc)
}

/** Descarga un único estudio como .docx */
export async function exportarComoWord(cita: string, texto: string): Promise<void> {
  const blob = await construirDocxBlob(cita, texto)
  saveAs(blob, `Exegesis_${cita.replace(/[:\s]/g, '_')}.docx`)
}

/**
 * Exporta TODOS los estudios de la biblioteca como un único .docx,
 * cada estudio separado por salto de página.
 */
export async function exportarBibliotecaWord(estudios: EstudioGuardado[]): Promise<void> {
  if (estudios.length === 0) return

  const allParagraphs: Paragraph[] = []

  estudios.forEach((e, idx) => {
    const fecha = new Date(e.fecha).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
    const parrafos = buildStudyParagraphs(e.cita, e.texto, fecha)
    allParagraphs.push(...parrafos)

    if (idx < estudios.length - 1) {
      allParagraphs.push(new Paragraph({ children: [new PageBreak()] }))
    }
  })

  const doc = new Document({
    creator: 'Estudio Bíblico Pro',
    title: 'Biblioteca Bíblica Completa',
    sections: [{ children: allParagraphs }],
  })

  const blob = await Packer.toBlob(doc)
  const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-')
  saveAs(blob, `Biblioteca_Biblica_${fecha}.docx`)
}

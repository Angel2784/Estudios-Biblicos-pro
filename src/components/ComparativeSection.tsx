'use client'
import { useState } from 'react'
import { GitCompare, Download, Library, ChevronDown, ChevronUp, X } from 'lucide-react'
import AnnotationReader from './AnnotationReader'
import { extraerSeccion, convertirEnlacesBiblicos } from '@/lib/parser'
import { guardarComparado } from '@/lib/storage'
import { exportarComoWord } from '@/lib/exportDocx'
import ChatPanel from './ChatPanel'

const TABS_COMP = [
  { label: '📋 Todo' },
  { label: '📖 Textos',        seccion: 1 },
  { label: '🤝 Similitudes',  seccion: 2 },
  { label: '↔️ Diferencias',  seccion: 3 },
  { label: '🏛️ Contexto',      seccion: 4 },
  { label: '🔡 Lingüística',  seccion: 5 },
  { label: '📈 Progresión',    seccion: 6 },
  { label: '⚡ Tensiones',    seccion: 7 },
  { label: '🧩 Síntesis',      seccion: 8 },
  { label: '💡 Aplicación',    seccion: 9 },
  { label: '🏁 Conclusión',    seccion: 10 },
]

interface Props {
  cita1: string
  cita2: string
  texto: string
  onRemove: () => void
  apiKey: string
}

export default function ComparativeSection({ cita1, cita2, texto, onRemove, apiKey }: Props) {
  const [expanded, setExpanded]       = useState(true)
  const [saved, setSaved]             = useState(false)
  const [downloading, setDownloading] = useState(false)
  const citaKey = `${cita1} vs ${cita2}`

  // ── Tabs con orden arrastrable ──────────────────────────────────────────────
  const [tabOrder, setTabOrder]           = useState(() => TABS_COMP.map((_, i) => i))
  const [activeOrigIdx, setActiveOrigIdx] = useState(0)
  const [dragTabIdx, setDragTabIdx]       = useState<number | null>(null)
  const [dragOverTabIdx, setDragOverTabIdx] = useState<number | null>(null)

  const handleTabDragStart = (origIdx: number) => setDragTabIdx(origIdx)
  const handleTabDragOver  = (e: React.DragEvent, origIdx: number) => {
    e.preventDefault()
    setDragOverTabIdx(origIdx)
  }
  const handleTabDrop = (targetOrigIdx: number) => {
    if (dragTabIdx === null || dragTabIdx === targetOrigIdx) return
    setTabOrder(prev => {
      const next    = [...prev]
      const fromPos = next.indexOf(dragTabIdx)
      const toPos   = next.indexOf(targetOrigIdx)
      next.splice(fromPos, 1)
      next.splice(toPos, 0, dragTabIdx)
      return next
    })
    setDragTabIdx(null)
    setDragOverTabIdx(null)
  }

  const handleSave = () => {
    guardarComparado({ cita: citaKey, texto, fecha: new Date().toISOString(), anotaciones: [] })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleDownload = async () => {
    setDownloading(true)
    try { await exportarComoWord(citaKey, texto) }
    finally { setDownloading(false) }
  }

  const getSeccionTexto = (origIdx: number): string => {
    const tab = TABS_COMP[origIdx]
    if (!tab.seccion) return texto
    return extraerSeccion(texto, tab.seccion, tab.seccion + 1)
  }

  return (
    <div className="card mt-4" style={{ animation: 'slideUp 0.4s ease-out', borderColor: 'var(--gold-dim)' }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: 'var(--gold-dim)' }}>
            <GitCompare size={18} style={{ color: 'var(--gold)' }} />
          </div>
          <div>
            <h2 className="font-semibold text-base" style={{ color: 'var(--gold)' }}>
              {cita1} <span style={{ color: 'var(--text-dim)' }}>vs</span> {cita2}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Estudio comparativo</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize: 12, padding: '7px 12px' }} onClick={handleSave}>
            <Library size={13} />
            {saved ? '✅ Guardado' : 'Guardar'}
          </button>
          <button
            className="btn-secondary"
            style={{ fontSize: 12, padding: '7px 12px', opacity: downloading ? 0.7 : 1 }}
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download size={13} />
            {downloading ? 'Generando...' : 'Descargar .docx'}
          </button>
          <button onClick={() => setExpanded(!expanded)} className="btn-secondary" style={{ padding: '7px 10px' }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {/* ── X para cerrar esta tarjeta ── */}
          <button
            onClick={onRemove}
            className="btn-secondary"
            style={{ padding: '7px 10px' }}
            title="Cerrar este estudio comparado"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="mt-5" style={{ animation: 'slideUp 0.3s ease-out' }}>

          {/* Tab bar — arrastrable */}
          <div className="tab-bar" style={{ flexWrap: 'wrap' }}>
            {tabOrder.map(origIdx => {
              const tab        = TABS_COMP[origIdx]
              const isDragging = dragTabIdx === origIdx
              const isDragOver = dragOverTabIdx === origIdx
              return (
                <button
                  key={origIdx}
                  draggable
                  onDragStart={() => handleTabDragStart(origIdx)}
                  onDragOver={e => handleTabDragOver(e, origIdx)}
                  onDrop={() => handleTabDrop(origIdx)}
                  onDragEnd={() => { setDragTabIdx(null); setDragOverTabIdx(null) }}
                  className={`tab-btn ${activeOrigIdx === origIdx ? 'active' : ''}`}
                  onClick={() => setActiveOrigIdx(origIdx)}
                  style={{
                    opacity:    isDragging ? 0.4 : 1,
                    outline:    isDragOver ? '2px solid var(--gold)' : 'none',
                    cursor:     'grab',
                    userSelect: 'none',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="tab-panel">
            {activeOrigIdx === 0 ? (
              <AnnotationReader texto={texto} cita={citaKey} />
            ) : (
              <div
                className="prose-biblical"
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    const seccionTexto = getSeccionTexto(activeOrigIdx)
                    return convertirEnlacesBiblicos(seccionTexto).replace(/\n/g, '<br/>')
                  })()
                }}
              />
            )}
          </div>
        </div>
      )}
      {/* ── Chat con el pasaje corregido a cita1 ── */}
      <ChatPanel cita={citaKey} textoPasaje={texto} apiKey={apiKey} />

    </div>
  )
}

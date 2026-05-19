'use client'
import { useState } from 'react'
import { BookMarked, Download, Library, ChevronDown, ChevronUp, X } from 'lucide-react'
import AnnotationReader from './AnnotationReader'
import { extraerSeccion } from '@/lib/parser'
import { guardarEstudio } from '@/lib/storage'
import { exportarComoWord } from '@/lib/exportDocx'
import type { EstiloSermon } from '@/lib/gemini'

const TABS_SERMON = [
  { label: '📋 Todo' },
  { label: '✝️ Introducción',   seccion: 1 },
  { label: '📌 Punto 1',        seccion: 2 },
  { label: '📌 Punto 2',        seccion: 3 },
  { label: '📌 Punto 3',        seccion: 4 },
  { label: '🖼️ Ilustraciones',  seccion: 5 },
  { label: '💡 Aplicación',     seccion: 6 },
  { label: '🎯 Conclusión',     seccion: 7 },
  { label: '🙏 Oración',        seccion: 8 },
]

const ESTILO_LABEL: Record<EstiloSermon, string> = {
  expositivo: '📖 Sermón expositivo',
  devocional: '🌅 Devocional',
  homilia:    '⛪ Homilía',
}

interface Props {
  cita:   string
  texto:  string
  estilo: EstiloSermon
  onRemove: () => void
}

export default function SermonSection({ cita, texto, estilo, onRemove }: Props) {
  const [expanded, setExpanded]       = useState(true)
  const [saved, setSaved]             = useState(false)
  const [downloading, setDownloading] = useState(false)

  const [tabOrder, setTabOrder]             = useState(() => TABS_SERMON.map((_, i) => i))
  const [activeOrigIdx, setActiveOrigIdx]   = useState(0)
  const [dragTabIdx, setDragTabIdx]         = useState<number | null>(null)
  const [dragOverTabIdx, setDragOverTabIdx] = useState<number | null>(null)

  const handleTabDragStart = (i: number) => setDragTabIdx(i)
  const handleTabDragOver  = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverTabIdx(i) }
  const handleTabDrop = (to: number) => {
    if (dragTabIdx === null || dragTabIdx === to) return
    setTabOrder(prev => {
      const next = [...prev]
      const from = next.indexOf(dragTabIdx)
      next.splice(from, 1); next.splice(next.indexOf(to), 0, dragTabIdx)
      return next
    })
    setDragTabIdx(null); setDragOverTabIdx(null)
  }

  const handleSave = () => {
    guardarEstudio({ cita: `Sermón: ${cita}`, texto, fecha: new Date().toISOString(), anotaciones: [] })
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const handleDownload = async () => {
    setDownloading(true)
    try { await exportarComoWord(`Sermón - ${cita}`, texto) }
    finally { setDownloading(false) }
  }

  const getSeccionTexto = (origIdx: number): string => {
    const tab = TABS_SERMON[origIdx]
    if (!tab.seccion) return texto
    return extraerSeccion(texto, tab.seccion, tab.seccion + 1)
  }

  return (
    <div className="card mt-4" style={{
      animation: 'slideUp 0.4s ease-out',
      borderColor: '#4a3070',
      borderWidth: 1,
      borderStyle: 'solid',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: '#2d1f4e' }}>
            <BookMarked size={18} style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <h2 className="font-semibold text-base" style={{ color: '#a78bfa' }}>
              {ESTILO_LABEL[estilo]}: {cita}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {texto.split(' ').length.toLocaleString()} palabras generadas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize: 12, padding: '7px 12px' }} onClick={handleSave}>
            <Library size={13} />{saved ? '✅ Guardado' : 'Guardar'}
          </button>
          <button
            className="btn-secondary"
            style={{ fontSize: 12, padding: '7px 12px', opacity: downloading ? 0.7 : 1 }}
            onClick={handleDownload} disabled={downloading}
          >
            <Download size={13} />{downloading ? 'Generando...' : 'Descargar .docx'}
          </button>
          <button onClick={() => setExpanded(!expanded)} className="btn-secondary" style={{ padding: '7px 10px' }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button onClick={onRemove} className="btn-secondary" style={{ padding: '7px 10px' }} title="Cerrar">
            <X size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-5" style={{ animation: 'slideUp 0.3s ease-out' }}>
          {/* Tabs arrastrables */}
          <div className="tab-bar" style={{ flexWrap: 'wrap' }}>
            {tabOrder.map(origIdx => {
              const tab = TABS_SERMON[origIdx]
              return (
                <button
                  key={origIdx} draggable
                  onDragStart={() => handleTabDragStart(origIdx)}
                  onDragOver={e => handleTabDragOver(e, origIdx)}
                  onDrop={() => handleTabDrop(origIdx)}
                  onDragEnd={() => { setDragTabIdx(null); setDragOverTabIdx(null) }}
                  className={`tab-btn ${activeOrigIdx === origIdx ? 'active' : ''}`}
                  onClick={() => setActiveOrigIdx(origIdx)}
                  style={{
                    opacity:    dragTabIdx === origIdx ? 0.4 : 1,
                    outline:    dragOverTabIdx === origIdx ? '2px solid #a78bfa' : 'none',
                    cursor:     'grab', userSelect: 'none',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="tab-panel">
            <AnnotationReader key={activeOrigIdx} texto={getSeccionTexto(activeOrigIdx)} cita={`Sermón: ${cita}`} />
          </div>
        </div>
      )}
    </div>
  )
}

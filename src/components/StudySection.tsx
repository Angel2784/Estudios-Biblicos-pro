'use client'
import { useState } from 'react'
import { BookOpen, Download, Library, ChevronDown, ChevronUp, MapPin, ExternalLink, X, GripVertical } from 'lucide-react'
import AnnotationReader from './AnnotationReader'
import { extraerSeccion, extraerLugarGeografico } from '@/lib/parser'
import { guardarEstudio } from '@/lib/storage'
import { exportarComoWord } from '@/lib/exportDocx'
import ChatPanel from './ChatPanel'

const TABS_EXEGESIS = [
  { label: '📋 Todo' },
  { label: '📖 Texto',       seccion: 1 },
  { label: '🔗 Referencias', seccion: 2 },
  { label: '🔡 Lingüística', seccion: 3 },
  { label: '🏛️ Contexto',    seccion: 4 },
  { label: '🔍 Exégesis',    seccion: 5 },
  { label: '👑 Reino',       seccion: 6 },
  { label: '💡 Aplicación',  seccion: 7 },
  { label: '⚖️ Versiones',   seccion: 8 },
  { label: '📅 Cronología',  seccion: 9 },
  { label: '🗺️ Geografía',   seccion: 10 },
  { label: '🏁 Conclusión',  seccion: 11 },
  { label: '❓ Reflexión',   seccion: 12 },
  { label: '📚 Recursos',    seccion: 13 },
]

interface Props {
  cita: string
  texto: string
  onClear: () => void
  apiKey: string
}

export default function StudySection({ cita, texto, onClear, apiKey }: Props) {
  const [expanded, setExpanded]       = useState(true)
  const [saved, setSaved]             = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [mapError, setMapError]       = useState(false)

  // ── Tabs con orden arrastrable ──────────────────────────────────────────────
  const [tabOrder, setTabOrder]         = useState(() => TABS_EXEGESIS.map((_, i) => i))
  const [activeOrigIdx, setActiveOrigIdx] = useState(0)
  const [dragTabIdx, setDragTabIdx]     = useState<number | null>(null)
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

  const lugar       = extraerLugarGeografico(texto)
  const mapEmbedUrl = lugar
    ? `https://maps.google.com/maps?q=${encodeURIComponent(lugar + ' ancient biblical')}&t=&z=8&ie=UTF8&iwloc=&output=embed`
    : null
  const mapDirectUrl = lugar
    ? `https://www.google.com/maps/search/${encodeURIComponent(lugar)}`
    : null

  const handleSave = () => {
    guardarEstudio({ cita, texto, fecha: new Date().toISOString(), anotaciones: [] })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleDownload = async () => {
    setDownloading(true)
    try { await exportarComoWord(cita, texto) }
    finally { setDownloading(false) }
  }

  const getSeccionTexto = (origIdx: number): string => {
    const tab = TABS_EXEGESIS[origIdx]
    if (!tab.seccion) return texto
    return extraerSeccion(texto, tab.seccion, tab.seccion + 1)
  }

  return (
    <div className="card mt-4" style={{ animation: 'slideUp 0.4s ease-out' }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: 'var(--gold-dim)' }}>
            <BookOpen size={18} style={{ color: 'var(--gold)' }} />
          </div>
          <div>
            <h2 className="font-semibold text-base" style={{ color: 'var(--gold)' }}>
              Exégesis: {cita}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {texto.split(' ').length.toLocaleString()} palabras generadas
            </p>
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
            onClick={onClear}
            className="btn-secondary"
            style={{ padding: '7px 10px' }}
            title="Cerrar este estudio"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-5" style={{ animation: 'slideUp 0.3s ease-out' }}>

          {/* Tab bar — arrastrable */}
          <div className="tab-bar" style={{ flexWrap: 'wrap' }}>
            {tabOrder.map(origIdx => {
              const tab = TABS_EXEGESIS[origIdx]
              const isDragging  = dragTabIdx === origIdx
              const isDragOver  = dragOverTabIdx === origIdx
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

          {/* Contenido */}
          <div className="tab-panel">
            {activeOrigIdx === 10 ? (
              <div>
                <AnnotationReader texto={getSeccionTexto(10)} cita={cita} />
                {lugar ? (
                  <div className="mt-5 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--navy-border)' }}>
                    <div className="flex items-center justify-between px-4 py-3"
                      style={{ background: 'var(--navy-card)', borderBottom: '1px solid var(--navy-border)' }}>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} style={{ color: 'var(--gold)' }} />
                        <span className="font-medium text-sm" style={{ color: 'var(--gold)' }}>{lugar}</span>
                        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>· Ubicación bíblica</span>
                      </div>
                      <a href={mapDirectUrl!} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: 'var(--gold-dim)', color: 'var(--gold)', textDecoration: 'none' }}>
                        <ExternalLink size={11} /> Abrir en Maps
                      </a>
                    </div>
                    {!mapError ? (
                      <iframe src={mapEmbedUrl!} title={`Mapa bíblico: ${lugar}`} loading="lazy"
                        onError={() => setMapError(true)}
                        style={{ width: '100%', height: '380px', border: 'none', display: 'block' }}
                        referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 py-10"
                        style={{ background: 'var(--navy-card)', minHeight: 200 }}>
                        <MapPin size={32} style={{ color: 'var(--gold)', opacity: 0.6 }} />
                        <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                          El mapa no se puede mostrar en este navegador.<br />
                          Haz clic abajo para verlo en Google Maps.
                        </p>
                        <a href={mapDirectUrl!} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm"
                          style={{ background: 'var(--gold)', color: '#0a1628', textDecoration: 'none' }}>
                          <ExternalLink size={14} /> Ver {lugar} en Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm" style={{ color: 'var(--text-dim)' }}>
                    📍 No se detectó una ubicación geográfica específica en este pasaje.
                  </p>
                )}
              </div>
            ) : (
              <AnnotationReader key={activeOrigIdx} texto={getSeccionTexto(activeOrigIdx)} cita={cita} />
            )}
          </div>
        </div>
      )}
      {/* ── Chat con el pasaje ── */}
      <ChatPanel cita={cita} textoPasaje={texto} apiKey={apiKey} />

    </div>
  )
}
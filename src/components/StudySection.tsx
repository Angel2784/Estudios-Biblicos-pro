'use client'
import { useState } from 'react'
import { BookOpen, Download, Library, ChevronDown, ChevronUp, Loader2, MapPin } from 'lucide-react'
import TabPanel from './TabPanel'
import AnnotationReader from './AnnotationReader'
import { extraerSeccion, extraerLugarGeografico, convertirEnlacesBiblicos } from '@/lib/parser'
import { guardarEstudio } from '@/lib/storage'

const TABS_EXEGESIS = [
  { label: '📋 Todo' },
  { label: '📖 Texto', seccion: 1 },
  { label: '🔗 Referencias', seccion: 2 },
  { label: '🔡 Lingüística', seccion: 3 },
  { label: '🏛️ Contexto', seccion: 4 },
  { label: '🔍 Exégesis', seccion: 5 },
  { label: '👑 Reino', seccion: 6 },
  { label: '💡 Aplicación', seccion: 7 },
  { label: '⚖️ Versiones', seccion: 8 },
  { label: '📅 Cronología', seccion: 9 },
  { label: '🗺️ Geografía', seccion: 10 },
  { label: '🏁 Conclusión', seccion: 11 },
  { label: '❓ Reflexión', seccion: 12 },
  { label: '📚 Recursos', seccion: 13 },
]

interface Props {
  cita: string
  texto: string
  onClear: () => void
}

export default function StudySection({ cita, texto, onClear }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  const lugar = extraerLugarGeografico(texto)
  const mapUrl = lugar
    ? `https://www.google.com/maps?q=${encodeURIComponent(lugar)}&output=embed`
    : null

  const handleSave = () => {
    guardarEstudio({ cita, texto, fecha: new Date().toISOString(), anotaciones: [] })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleDownload = () => {
    const blob = new Blob([`ESTUDIO BÍBLICO PRO\n${'='.repeat(50)}\n\nCita: ${cita}\nFecha: ${new Date().toLocaleDateString('es-ES')}\n\n${texto}`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Exegesis_${cita.replace(/:/g, '_').replace(/ /g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
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
          <button className="btn-secondary" style={{ fontSize: 12, padding: '7px 12px' }} onClick={handleDownload}>
            <Download size={13} /> Word
          </button>
          <button onClick={() => setExpanded(!expanded)} className="btn-secondary" style={{ padding: '7px 10px' }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Collapsible content */}
      {expanded && (
        <div className="mt-5" style={{ animation: 'slideUp 0.3s ease-out' }}>
          {/* Tab bar */}
          <div className="tab-bar">
            {TABS_EXEGESIS.map((tab, i) => (
              <button
                key={i}
                className={`tab-btn ${activeTab === i ? 'active' : ''}`}
                onClick={() => setActiveTab(i)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="tab-panel">
            {activeTab === 0 ? (
              /* Pestaña TODO: usa el lector con anotaciones */
              <AnnotationReader texto={texto} cita={cita} />
            ) : activeTab === 10 ? (
              /* Pestaña GEOGRAFÍA: texto + mapa */
              <div>
                <div
                  className="prose-biblical"
                  dangerouslySetInnerHTML={{
                    __html: extraerSeccion(texto, 10, 11).replace(/\n/g, '<br/>')
                  }}
                />
                {mapUrl ? (
                  <div className="map-container mt-4">
                    <div className="flex items-center gap-2 p-3" style={{ background: 'var(--navy-card)', borderBottom: '1px solid var(--navy-border)' }}>
                      <MapPin size={14} style={{ color: 'var(--gold)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{lugar}</span>
                    </div>
                    <iframe src={mapUrl} title={`Mapa de ${lugar}`} loading="lazy" />
                  </div>
                ) : (
                  <p className="mt-4 text-sm" style={{ color: 'var(--text-dim)' }}>
                    📍 No se detectó ubicación geográfica en este pasaje.
                  </p>
                )}
              </div>
            ) : (
              /* Resto de pestañas: texto simple */
              <div
                className="prose-biblical"
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    const tab = TABS_EXEGESIS[activeTab]
                    if (!tab.seccion) return ''
                    const siguiente = TABS_EXEGESIS[activeTab + 1]?.seccion
                    return convertirEnlacesBiblicos(extraerSeccion(texto, tab.seccion, siguiente)).replace(/\n/g, '<br/>')
                  })()
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

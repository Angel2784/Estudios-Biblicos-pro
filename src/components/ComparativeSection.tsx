'use client'
import { useState } from 'react'
import { GitCompare, Download, Library, ChevronDown, ChevronUp } from 'lucide-react'
import AnnotationReader from './AnnotationReader'
import { extraerSeccion, convertirEnlacesBiblicos } from '@/lib/parser'
import { guardarComparado } from '@/lib/storage'

const TABS_COMP = [
  { label: '📋 Todo' },
  { label: '📖 Textos', seccion: 1 },
  { label: '🤝 Similitudes', seccion: 2 },
  { label: '↔️ Diferencias', seccion: 3 },
  { label: '🏛️ Contexto', seccion: 4 },
  { label: '🔡 Lingüística', seccion: 5 },
  { label: '📈 Progresión', seccion: 6 },
  { label: '⚡ Tensiones', seccion: 7 },
  { label: '🧩 Síntesis', seccion: 8 },
  { label: '💡 Aplicación', seccion: 9 },
  { label: '🏁 Conclusión', seccion: 10 },
]

interface Props {
  cita1: string
  cita2: string
  texto: string
}

export default function ComparativeSection({ cita1, cita2, texto }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const citaKey = `${cita1} vs ${cita2}`

  const handleSave = () => {
    guardarComparado({ cita: citaKey, texto, fecha: new Date().toISOString(), anotaciones: [] })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleDownload = () => {
    const blob = new Blob(
      [`ESTUDIO COMPARADO\n${'='.repeat(50)}\n\n${cita1} vs ${cita2}\nFecha: ${new Date().toLocaleDateString('es-ES')}\n\n${texto}`],
      { type: 'text/plain;charset=utf-8' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Comparado_${cita1.replace(/[:\s]/g, '_')}_vs_${cita2.replace(/[:\s]/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
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
          <button className="btn-secondary" style={{ fontSize: 12, padding: '7px 12px' }} onClick={handleDownload}>
            <Download size={13} /> Descargar
          </button>
          <button onClick={() => setExpanded(!expanded)} className="btn-secondary" style={{ padding: '7px 10px' }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="mt-5" style={{ animation: 'slideUp 0.3s ease-out' }}>
          {/* Tab bar */}
          <div className="tab-bar">
            {TABS_COMP.map((tab, i) => (
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
              <AnnotationReader texto={texto} cita={citaKey} />
            ) : (
              <div
                className="prose-biblical"
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    const tab = TABS_COMP[activeTab]
                    if (!tab.seccion) return ''
                    const siguiente = TABS_COMP[activeTab + 1]?.seccion
                    return convertirEnlacesBiblicos(
                      extraerSeccion(texto, tab.seccion, siguiente)
                    ).replace(/\n/g, '<br/>')
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

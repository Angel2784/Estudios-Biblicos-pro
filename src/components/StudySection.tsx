'use client'
import { useState } from 'react'
import { BookOpen, Download, Library, ChevronDown, ChevronUp, MapPin, ExternalLink, X } from 'lucide-react'
import AnnotationReader from './AnnotationReader'
import { extraerSeccion, extraerLugarGeografico } from '@/lib/parser'
import { guardarEstudio } from '@/lib/storage'
import { exportarComoWord } from '@/lib/exportDocx'
import ChatPanel from './ChatPanel'
import {
  obtenerArbolPersonajes, obtenerTimeline,
  type ArbolPersonajes, type Timeline
} from '@/lib/gemini'

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
  { label: '👥 Personajes' },   // índice 14
  { label: '⏱️ Línea de Tiempo' }, // índice 15
]

interface Props {
  cita: string
  texto: string
  onClear: () => void
  apiKey: string
}

// ─── Árbol de personajes visual ───────────────────────────────────────────────
function ArbolView({ cita, apiKey }: { cita: string; apiKey: string }) {
  const [data, setData]       = useState<ArbolPersonajes | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [activo, setActivo]   = useState<string | null>(null)

  const cargar = async () => {
    setLoading(true); setError('')
    try {
      const result = await obtenerArbolPersonajes(apiKey, cita)
      setData(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally { setLoading(false) }
  }

  if (!data && !loading) return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div style={{ fontSize: 48 }}>👥</div>
      <p className="text-sm text-center" style={{ color: 'var(--text-secondary)', maxWidth: 300 }}>
        Genera un árbol visual con los personajes del pasaje y sus relaciones
      </p>
      {error && <p className="text-xs px-3 py-2 rounded" style={{ color: '#ef4444', background: '#7f1d1d33' }}>⚠️ {error}</p>}
      <button className="btn-primary" onClick={cargar}>
        👥 Generar árbol de personajes
      </button>
    </div>
  )

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="flex gap-1">
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%', background: 'var(--gold)',
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Identificando personajes...</p>
    </div>
  )

  if (!data) return null

  const personaje = activo ? data.personajes.find(p => p.id === activo) : null

  return (
    <div>
      <p className="text-xs mb-4" style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
        {data.contexto}
      </p>

      {/* Grid de personajes */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        {data.personajes.map(p => {
          const isActive = activo === p.id
          const tieneRelaciones = p.relaciones.length > 0
          return (
            <button
              key={p.id}
              onClick={() => setActivo(isActive ? null : p.id)}
              style={{
                background: isActive ? 'var(--gold-dim)' : 'var(--navy)',
                border: `2px solid ${isActive ? 'var(--gold)' : 'var(--navy-border)'}`,
                borderRadius: 12,
                padding: '10px 14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                minWidth: 120,
                maxWidth: 160,
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>
                {p.nombre === 'Dios' || p.nombre === 'Dios Padre' ? '✝️' :
                 p.nombre === 'Jesús' || p.nombre === 'Cristo' || p.nombre === 'Jesucristo' ? '👑' :
                 tieneRelaciones ? '👤' : '👤'}
              </div>
              <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 13, fontFamily: 'Crimson Pro, serif' }}>
                {p.nombre}
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2, lineHeight: 1.3 }}>
                {p.descripcion}
              </div>
              {tieneRelaciones && (
                <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {p.relaciones.map((r, i) => (
                    <span key={i} style={{
                      fontSize: 9, background: '#1e3a5f', color: '#60a5fa',
                      padding: '1px 5px', borderRadius: 10,
                    }}>
                      {r.tipo} {data.personajes.find(x => x.id === r.targetId)?.nombre ?? r.targetId}
                    </span>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Panel de detalle del personaje seleccionado */}
      {personaje && (
        <div style={{
          background: 'var(--navy)', border: '1px solid var(--gold)',
          borderRadius: 12, padding: '14px 18px',
          animation: 'slideUp 0.2s ease-out',
        }}>
          <div className="flex items-center justify-between mb-2">
            <h3 style={{ color: 'var(--gold)', fontFamily: 'Crimson Pro, serif', fontSize: 16, fontWeight: 700 }}>
              {personaje.nombre}
            </h3>
            <button onClick={() => setActivo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
              <X size={14} />
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>{personaje.descripcion}</p>
          {personaje.relaciones.length > 0 && (
            <div>
              <p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 6 }}>Relaciones:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {personaje.relaciones.map((r, i) => {
                  const target = data.personajes.find(x => x.id === r.targetId)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 600 }}>{personaje.nombre}</span>
                      <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>→ {r.tipo} →</span>
                      <span style={{ color: 'var(--text-primary)', fontSize: 12 }}>{target?.nombre ?? r.targetId}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        className="btn-secondary mt-4"
        style={{ fontSize: 11, padding: '5px 12px' }}
        onClick={() => { setData(null); setActivo(null) }}
      >
        🔄 Regenerar
      </button>
    </div>
  )
}

// ─── Línea de tiempo visual ───────────────────────────────────────────────────
function TimelineView({ cita, apiKey }: { cita: string; apiKey: string }) {
  const [data, setData]       = useState<Timeline | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [activo, setActivo]   = useState<string | null>(null)

  const cargar = async () => {
    setLoading(true); setError('')
    try {
      const result = await obtenerTimeline(apiKey, cita)
      setData(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally { setLoading(false) }
  }

  if (!data && !loading) return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div style={{ fontSize: 48 }}>⏱️</div>
      <p className="text-sm text-center" style={{ color: 'var(--text-secondary)', maxWidth: 300 }}>
        Genera una línea de tiempo con los eventos históricos del pasaje
      </p>
      {error && <p className="text-xs px-3 py-2 rounded" style={{ color: '#ef4444', background: '#7f1d1d33' }}>⚠️ {error}</p>}
      <button className="btn-primary" onClick={cargar}>
        ⏱️ Generar línea de tiempo
      </button>
    </div>
  )

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="flex gap-1">
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%', background: 'var(--gold)',
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Construyendo línea de tiempo...</p>
    </div>
  )

  if (!data) return null

  const colorTipo = {
    principal: 'var(--gold)',
    contexto: '#60a5fa',
    profecia: '#a78bfa',
  }

  const eventoActivo = activo ? data.eventos.find(e => e.id === activo) : null

  return (
    <div>
      <p className="text-xs mb-6" style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
        📅 {data.periodoGeneral}
      </p>

      {/* Leyenda */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {[
          { tipo: 'principal', label: 'Evento principal', color: 'var(--gold)' },
          { tipo: 'contexto',  label: 'Contexto histórico', color: '#60a5fa' },
          { tipo: 'profecia',  label: 'Profecía / Cumplimiento', color: '#a78bfa' },
        ].map(l => (
          <div key={l.tipo} className="flex items-center gap-1">
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Línea de tiempo vertical */}
      <div style={{ position: 'relative', paddingLeft: 32 }}>
        {/* Línea vertical */}
        <div style={{
          position: 'absolute', left: 10, top: 8, bottom: 8,
          width: 2, background: 'var(--navy-border)',
        }} />

        {data.eventos.map((ev, i) => {
          const color = colorTipo[ev.tipo] ?? 'var(--gold)'
          const isActive = activo === ev.id
          return (
            <div
              key={ev.id}
              style={{ position: 'relative', marginBottom: i < data.eventos.length - 1 ? 24 : 0 }}
            >
              {/* Punto en la línea */}
              <div style={{
                position: 'absolute', left: -28, top: 4,
                width: 14, height: 14, borderRadius: '50%',
                background: isActive ? color : 'var(--navy-card)',
                border: `2px solid ${color}`,
                transition: 'background 0.2s',
                zIndex: 1,
              }} />

              {/* Tarjeta del evento */}
              <button
                onClick={() => setActivo(isActive ? null : ev.id)}
                style={{
                  width: '100%', textAlign: 'left',
                  background: isActive ? 'var(--navy)' : 'var(--navy-card)',
                  border: `1px solid ${isActive ? color : 'var(--navy-border)'}`,
                  borderRadius: 10, padding: '10px 14px',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: 10, color, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                    {ev.fecha}
                  </span>
                  <span style={{
                    fontSize: 9, padding: '1px 6px', borderRadius: 10,
                    background: `${color}22`, color,
                  }}>
                    {ev.tipo}
                  </span>
                </div>
                <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, fontFamily: 'Crimson Pro, serif', margin: 0 }}>
                  {ev.titulo}
                </p>
                {isActive && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
                    {ev.descripcion}
                  </p>
                )}
              </button>
            </div>
          )
        })}
      </div>

      <button
        className="btn-secondary mt-6"
        style={{ fontSize: 11, padding: '5px 12px' }}
        onClick={() => { setData(null); setActivo(null) }}
      >
        🔄 Regenerar
      </button>
    </div>
  )
}

// ─── StudySection principal ───────────────────────────────────────────────────
export default function StudySection({ cita, texto, onClear, apiKey }: Props) {
  const [expanded, setExpanded]       = useState(true)
  const [saved, setSaved]             = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [mapError, setMapError]       = useState(false)

  const [tabOrder, setTabOrder]             = useState(() => TABS_EXEGESIS.map((_, i) => i))
  const [activeOrigIdx, setActiveOrigIdx]   = useState(0)
  const [dragTabIdx, setDragTabIdx]         = useState<number | null>(null)
  const [dragOverTabIdx, setDragOverTabIdx] = useState<number | null>(null)

  const handleTabDragStart = (origIdx: number) => setDragTabIdx(origIdx)
  const handleTabDragOver  = (e: React.DragEvent, origIdx: number) => { e.preventDefault(); setDragOverTabIdx(origIdx) }
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
    setDragTabIdx(null); setDragOverTabIdx(null)
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
    setSaved(true); setTimeout(() => setSaved(false), 2500)
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

  const renderContenido = () => {
    // Pestaña Personajes (índice 14)
    if (activeOrigIdx === 14) {
      return <ArbolView cita={cita} apiKey={apiKey} />
    }
    // Pestaña Línea de Tiempo (índice 15)
    if (activeOrigIdx === 15) {
      return <TimelineView cita={cita} apiKey={apiKey} />
    }
    // Pestaña Geografía (índice 10)
    if (activeOrigIdx === 10) {
      return (
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
      )
    }
    // Resto de pestañas normales
    return <AnnotationReader key={activeOrigIdx} texto={getSeccionTexto(activeOrigIdx)} cita={cita} />
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
          <button onClick={onClear} className="btn-secondary" style={{ padding: '7px 10px' }} title="Cerrar este estudio">
            <X size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-5" style={{ animation: 'slideUp 0.3s ease-out' }}>

          {/* Tab bar */}
          <div className="tab-bar" style={{ flexWrap: 'wrap' }}>
            {tabOrder.map(origIdx => {
              const tab = TABS_EXEGESIS[origIdx]
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

          {/* Contenido de la pestaña */}
          <div className="tab-panel">
            {renderContenido()}
          </div>
        </div>
      )}

      {/* Chat con el pasaje */}
      <ChatPanel cita={cita} textoPasaje={texto} apiKey={apiKey} />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}

// src/components/StudySection.tsx
'use client'
import { useState, useRef } from 'react'
import {
  BookOpen, Download, Library, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  MapPin, ExternalLink, X, Copy, Check, LayoutGrid, FileText, Link2, Languages,
  Landmark, SearchCode, Crown, Lightbulb, Scale, CalendarClock, Compass,
  FlagTriangleRight, HelpCircle, BookMarked, Users, Clock3, RotateCcw, AlertCircle, CalendarDays
} from 'lucide-react'
import AnnotationReader from './AnnotationReader'
import { extraerSeccion, extraerLugarGeografico } from '@/lib/parser'
import { guardarEstudio } from '@/lib/storage'
import { exportarComoWord } from '@/lib/exportDocx'
import ChatPanel from './ChatPanel'
import TimelineViewer from './TimelineViewer'
import CharacterNetworkViewer from './CharacterNetworkViewer'
import {
  obtenerArbolPersonajes, obtenerTimeline,
  type ArbolPersonajes, type Timeline, type PersonajeBiblico
} from '@/lib/gemini'

const TABS_EXEGESIS = [
  { label: 'Todo',        Icon: LayoutGrid },
  { label: 'Texto',       seccion: 1,  Icon: FileText },
  { label: 'Referencias', seccion: 2,  Icon: Link2 },
  { label: 'Lingüística', seccion: 3,  Icon: Languages },
  { label: 'Contexto',    seccion: 4,  Icon: Landmark },
  { label: 'Exégesis',    seccion: 5,  Icon: SearchCode },
  { label: 'Reino',       seccion: 6,  Icon: Crown },
  { label: 'Aplicación',  seccion: 7,  Icon: Lightbulb },
  { label: 'Versiones',   seccion: 8,  Icon: Scale },
  { label: 'Cronología',  seccion: 9,  Icon: CalendarClock },
  { label: 'Geografía',   seccion: 10, Icon: Compass },
  { label: 'Conclusión',  seccion: 11, Icon: FlagTriangleRight },
  { label: 'Reflexión',   seccion: 12, Icon: HelpCircle },
  { label: 'Recursos',    seccion: 13, Icon: BookMarked },
  { label: 'Personajes',      Icon: Users },
  { label: 'Línea de tiempo', Icon: Clock3 },
]

interface Props { cita: string; texto: string; onClear: () => void; apiKey: string }

// ════════════════════════════════════════════════════════════════════════════
// ÁRBOL DE PERSONAJES
// ════════════════════════════════════════════════════════════════════════════
function ArbolView({ cita, apiKey }: { cita: string; apiKey: string }) {
  const [data, setData]       = useState<ArbolPersonajes | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const cargar = async () => {
    setLoading(true); setError('')
    try { setData(await obtenerArbolPersonajes(apiKey, cita)) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  if (!data && !loading) return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div style={{ fontSize: 44, color: 'var(--gold)', opacity: 0.5 }}><Users size={44} /></div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', maxWidth: 360 }}>
        Analiza todos los personajes que intervienen en el pasaje, con su historia bíblica, atributos y red interactiva de relaciones
      </p>
      {error && <p className="text-xs px-3 py-2 rounded flex items-center gap-1" style={{ color: '#ef4444', background: '#7f1d1d33' }}><AlertCircle size={13} />{error}</p>}
      <button className="btn-primary inline-flex items-center gap-1" onClick={cargar}><Users size={15} />Analizar personajes</button>
    </div>
  )

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="flex gap-1">
        {[0,1,2].map(i => <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:'var(--gold)', animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Identificando personajes y relaciones del pasaje...</p>
    </div>
  )

  if (!data) return null
  return <CharacterNetworkViewer data={data} cita={cita} />
}

// ════════════════════════════════════════════════════════════════════════════
// LÍNEA DE TIEMPO
// ════════════════════════════════════════════════════════════════════════════
function TimelineView({ cita, apiKey }: { cita: string; apiKey: string }) {
  const [data, setData]       = useState<Timeline | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const cargar = async () => {
    setLoading(true); setError('')
    try { setData(await obtenerTimeline(apiKey, cita)) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  if (!data && !loading) return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div style={{ color: 'var(--gold)', opacity: 0.5 }}><CalendarDays size={44} /></div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', maxWidth: 360 }}>
        Genera un mapa histórico interactivo completo con los períodos bíblicos, eventos clave y profecías
      </p>
      {error && <p className="text-xs px-3 py-2 rounded flex items-center gap-1" style={{ color: '#ef4444', background: '#7f1d1d33' }}><AlertCircle size={13} />{error}</p>}
      <button className="btn-primary inline-flex items-center gap-1" onClick={cargar}><CalendarDays size={15} />Generar línea de tiempo</button>
    </div>
  )

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="flex gap-1">
        {[0,1,2].map(i => <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:'var(--gold)', animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Construyendo mapa histórico y eventos...</p>
    </div>
  )

  if (!data) return null
  return <TimelineViewer timeline={data} cita={cita} />
}

// ════════════════════════════════════════════════════════════════════════════
// STUDY SECTION PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function StudySection({ cita, texto, onClear, apiKey }: Props) {
  const [expanded, setExpanded]         = useState(true)
  const [saved, setSaved]               = useState(false)
  const [copied, setCopied]             = useState(false)
  const [downloading, setDownloading]   = useState(false)
  const [mapError, setMapError]         = useState(false)
  const [tabOrder, setTabOrder]         = useState(() => TABS_EXEGESIS.map((_, i) => i))
  const [activeOrigIdx, setActiveOrigIdx] = useState(0)
  const [dragTabIdx, setDragTabIdx]     = useState<number | null>(null)
  const [dragOverTabIdx, setDragOverTabIdx] = useState<number | null>(null)

  const tabsContainerRef = useRef<HTMLDivElement>(null)

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250
      tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const handleTabDragStart = (i: number) => setDragTabIdx(i)
  const handleTabDragOver  = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverTabIdx(i) }
  const handleTabDrop = (target: number) => {
    if (dragTabIdx === null || dragTabIdx === target) return
    setTabOrder(prev => {
      const next = [...prev]
      const from = next.indexOf(dragTabIdx)
      const to   = next.indexOf(target)
      next.splice(from, 1)
      next.splice(to, 0, dragTabIdx)
      return next
    })
    setDragTabIdx(null)
    setDragOverTabIdx(null)
  }

  const lugar = extraerLugarGeografico(texto)
  const mapEmbedUrl  = lugar ? `https://maps.google.com/maps?q=${encodeURIComponent(lugar + ' ancient biblical')}&t=&z=8&ie=UTF8&iwloc=&output=embed` : null
  const mapDirectUrl = lugar ? `https://www.google.com/maps/search/${encodeURIComponent(lugar)}` : null

  const handleSave = () => {
    guardarEstudio({ cita, texto, fecha: new Date().toISOString(), anotaciones: [] })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Error al copiar:', e)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try { await exportarComoWord(cita, texto) }
    finally { setDownloading(false) }
  }

  const getSeccionTexto = (origIdx: number) => {
    const tab = TABS_EXEGESIS[origIdx]
    if (!tab.seccion) return texto
    return extraerSeccion(texto, tab.seccion, tab.seccion + 1)
  }

  const renderContenido = () => {
    if (activeOrigIdx === 14) return <ArbolView cita={cita} apiKey={apiKey} />
    if (activeOrigIdx === 15) return <TimelineView cita={cita} apiKey={apiKey} />
    if (!texto) {
      return (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-[#d4a029] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#f5cf6d] font-medium animate-pulse">Generando exégesis en tiempo real...</p>
          <p className="text-xs text-gray-400">Analizando contexto histórico, gramática original y teología...</p>
        </div>
      )
    }
    if (activeOrigIdx === 10) return (
      <div>
        <AnnotationReader texto={getSeccionTexto(10)} cita={cita} />
        {lugar && (
          <div className="mt-5 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--navy-border)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--navy-card)', borderBottom: '1px solid var(--navy-border)' }}>
              <div className="flex items-center gap-2">
                <MapPin size={14} style={{ color: 'var(--gold)' }} />
                <span style={{ color: 'var(--gold)', fontSize: 14, fontWeight: 500 }}>{lugar}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>· Ubicación bíblica</span>
              </div>
              <a href={mapDirectUrl!} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, padding:'5px 10px', borderRadius:8, background:'var(--gold-dim)', color:'var(--gold)', textDecoration:'none' }}>
                <ExternalLink size={11} /> Abrir en Maps
              </a>
            </div>
            {!mapError ? (
              <iframe src={mapEmbedUrl!} title={`Mapa bíblico: ${lugar}`} loading="lazy" onError={() => setMapError(true)} style={{ width:'100%', height:380, border:'none', display:'block' }} referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'40px 20px', background:'var(--navy-card)' }}>
                <MapPin size={32} style={{ color:'var(--gold)', opacity:0.6 }} />
                <p style={{ color:'var(--text-secondary)', fontSize:13, textAlign:'center' }}>El mapa no se puede mostrar. Ábrelo en Google Maps.</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
    return <AnnotationReader key={activeOrigIdx} texto={getSeccionTexto(activeOrigIdx)} cita={cita} />
  }

  return (
    <div className="card mt-4" style={{ animation: 'slideUp 0.4s ease-out' }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div style={{ padding:8, borderRadius:8, background:'var(--gold-dim)' }}>
            <BookOpen size={18} style={{ color:'var(--gold)' }} />
          </div>
          <div>
            <h2 style={{ color:'var(--gold)', fontWeight:600, fontSize:15, margin:0 }}>Exégesis: {cita}</h2>
            <p style={{ color:'var(--text-dim)', fontSize:11, margin:0 }}>{texto ? `${texto.trim().split(/\s+/).length.toLocaleString()} palabras generadas` : 'Iniciando análisis exegético...'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize:12, padding:'7px 12px' }} onClick={handleCopy}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copiado' : 'Copiar todo'}
          </button>
          <button className="btn-secondary" style={{ fontSize:12, padding:'7px 12px' }} onClick={handleSave}>
            <Library size={13} />{saved ? <span className="inline-flex items-center gap-1"><Check size={12} />Guardado</span> : 'Guardar'}
          </button>
          <button className="btn-secondary" style={{ fontSize:12, padding:'7px 12px', opacity: downloading ? 0.7 : 1 }} onClick={handleDownload} disabled={downloading}>
            <Download size={13} />{downloading ? 'Generando...' : 'Descargar .docx'}
          </button>
          <button className="btn-secondary" style={{ padding:'7px 10px' }} onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
          <button className="btn-secondary" style={{ padding:'7px 10px' }} onClick={onClear} title="Cerrar">
            <X size={16}/>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-5" style={{ animation:'slideUp 0.3s ease-out' }}>
          
          {/* BARRA DE BOTONES DESLIZABLE Y REORDENABLE */}
          <div className="relative flex items-center mb-4">
            {/* Flecha Scroll Izquierda */}
            <button
              onClick={() => scrollTabs('left')}
              className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg bg-[#151a26] border border-[#202738] text-gray-400 hover:text-[#f5cf6d] hover:border-[#f5cf6d]/40 shrink-0 mr-1.5 z-10 transition-all cursor-pointer"
              title="Desplazar botones a la izquierda"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Contenedor Scrollable */}
            <div
              ref={tabsContainerRef}
              className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 w-full select-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {tabOrder.map(origIdx => {
                const tab = TABS_EXEGESIS[origIdx]
                const Icon = tab.Icon
                const isActive = activeOrigIdx === origIdx
                return (
                  <button
                    key={origIdx}
                    draggable
                    onDragStart={() => handleTabDragStart(origIdx)}
                    onDragOver={e => handleTabDragOver(e, origIdx)}
                    onDrop={() => handleTabDrop(origIdx)}
                    onDragEnd={() => { setDragTabIdx(null); setDragOverTabIdx(null) }}
                    className={`tab-btn inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                      isActive ? 'active' : ''
                    }`}
                    onClick={() => setActiveOrigIdx(origIdx)}
                    style={{
                      opacity: dragTabIdx === origIdx ? 0.4 : 1,
                      outline: dragOverTabIdx === origIdx ? '2px solid var(--gold)' : 'none',
                      cursor: 'grab'
                    }}
                    title="Arrastra para reordenar según tu preferencia"
                  >
                    <Icon size={13} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Flecha Scroll Derecha */}
            <button
              onClick={() => scrollTabs('right')}
              className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg bg-[#151a26] border border-[#202738] text-gray-400 hover:text-[#f5cf6d] hover:border-[#f5cf6d]/40 shrink-0 ml-1.5 z-10 transition-all cursor-pointer"
              title="Desplazar botones a la derecha"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Panel con el contenido de la sección seleccionada */}
          <div className="tab-panel">{renderContenido()}</div>
        </div>
      )}

      <ChatPanel cita={cita} textoPasaje={texto} apiKey={apiKey} />

      <style>{`@keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
    </div>
  )
}

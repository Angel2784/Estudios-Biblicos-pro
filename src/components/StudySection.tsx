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
  type ArbolPersonajes, type Timeline, type PersonajeBiblico
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
  { label: '👥 Personajes' },        // índice 14
  { label: '⏱️ Línea de Tiempo' },   // índice 15
]

interface Props { cita: string; texto: string; onClear: () => void; apiKey: string }

// ════════════════════════════════════════════════════════════════════════════
// ÁRBOL DE PERSONAJES
// ════════════════════════════════════════════════════════════════════════════
function ArbolView({ cita, apiKey }: { cita: string; apiKey: string }) {
  const [data, setData]           = useState<ArbolPersonajes | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [activo, setActivo]       = useState<PersonajeBiblico | null>(null)
  const [vista, setVista]         = useState<'lista' | 'arbol'>('lista')

  const cargar = async () => {
    setLoading(true); setError('')
    try { setData(await obtenerArbolPersonajes(apiKey, cita)) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  const rolColor: Record<string, string> = {
    'Protagonista':   'var(--gold)',
    'Figura Divina':  '#a78bfa',
    'Antagonista':    '#ef4444',
    'Discípulo':      '#60a5fa',
    'Testigo':        '#4ade80',
    'Profeta':        '#fb923c',
    'Grupo':          '#94a3b8',
    'Mencionado':     '#64748b',
  }

  if (!data && !loading) return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div style={{ fontSize: 52 }}>👥</div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', maxWidth: 320 }}>
        Analiza todos los personajes que intervienen en el pasaje, con su historia bíblica, rol y relaciones
      </p>
      {error && <p className="text-xs px-3 py-2 rounded" style={{ color: '#ef4444', background: '#7f1d1d33' }}>⚠️ {error}</p>}
      <button className="btn-primary" onClick={cargar}>👥 Analizar personajes</button>
    </div>
  )

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="flex gap-1">
        {[0,1,2].map(i => <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:'var(--gold)', animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Identificando personajes del pasaje...</p>
    </div>
  )

  if (!data) return null

  return (
    <div>
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <p style={{ color: 'var(--text-dim)', fontSize: 12, fontStyle: 'italic', maxWidth: 500 }}>{data.contexto}</p>
          <p style={{ color: 'var(--gold)', fontSize: 11, marginTop: 4 }}>
            {data.totalPersonajes} personaje{data.totalPersonajes !== 1 ? 's' : ''} identificados
          </p>
        </div>
        {/* Toggle vista */}
        <div style={{ display:'flex', gap:4, background:'var(--navy)', borderRadius:10, padding:4 }}>
          {(['lista','arbol'] as const).map(v => (
            <button key={v} onClick={() => setVista(v)}
              style={{
                padding:'5px 12px', borderRadius:8, border:'none', cursor:'pointer', fontSize:11,
                background: vista === v ? 'var(--gold)' : 'transparent',
                color: vista === v ? 'var(--navy-card)' : 'var(--text-dim)',
                fontWeight: vista === v ? 700 : 400, transition:'all 0.2s',
              }}>
              {v === 'lista' ? '📋 Lista' : '🔗 Árbol'}
            </button>
          ))}
        </div>
      </div>

      {/* ── VISTA LISTA ── */}
      {vista === 'lista' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {data.personajes.map(p => {
            const isActive = activo?.id === p.id
            const rc = rolColor[p.rol] ?? 'var(--text-dim)'
            return (
              <div key={p.id}
                style={{
                  background: isActive ? 'var(--navy)' : 'var(--navy-card)',
                  border: `1px solid ${isActive ? 'var(--gold)' : 'var(--navy-border)'}`,
                  borderRadius:12, overflow:'hidden', transition:'all 0.2s',
                }}>
                {/* Fila resumen — siempre visible */}
                <button
                  onClick={() => setActivo(isActive ? null : p)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}
                >
                  <div style={{ fontSize:28, flexShrink:0 }}>{p.emoji}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ color:'var(--gold)', fontFamily:'Crimson Pro, serif', fontSize:15, fontWeight:700 }}>{p.nombre}</span>
                      <span style={{ fontSize:10, padding:'1px 8px', borderRadius:20, background:`${rc}22`, color:rc, fontWeight:600 }}>{p.rol}</span>
                    </div>
                    <p style={{ color:'var(--text-secondary)', fontSize:12, margin:'2px 0 0', lineHeight:1.4 }}>{p.descripcionBreve}</p>
                    {/* Atributos */}
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:5 }}>
                      {p.atributos.map(a => (
                        <span key={a} style={{ fontSize:10, padding:'1px 7px', borderRadius:10, background:'var(--navy-hover)', color:'var(--text-dim)' }}>{a}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ color:'var(--text-dim)', fontSize:12, flexShrink:0 }}>{isActive ? '▲' : '▼'}</div>
                </button>

                {/* Detalle expandido */}
                {isActive && (
                  <div style={{ padding:'0 16px 16px', borderTop:'1px solid var(--navy-border)', animation:'slideUp 0.2s ease-out' }}>
                    <p style={{ color:'var(--text-primary)', fontSize:13, lineHeight:1.7, marginTop:12, fontFamily:'Crimson Pro, serif' }}>
                      {p.descripcionCompleta}
                    </p>

                    <div style={{ display:'flex', gap:16, marginTop:12, flexWrap:'wrap' }}>
                      {/* Versículos */}
                      {p.versiculosAparece.length > 0 && (
                        <div>
                          <p style={{ color:'var(--text-dim)', fontSize:10, marginBottom:4 }}>APARECE EN</p>
                          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                            {p.versiculosAparece.map(v => (
                              <a key={v} href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(v)}&version=RVR1960`}
                                target="_blank" rel="noopener noreferrer"
                                style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'var(--gold-dim)', color:'var(--gold)', textDecoration:'none', fontWeight:600 }}>
                                {v}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Relaciones */}
                      {p.relaciones.length > 0 && (
                        <div>
                          <p style={{ color:'var(--text-dim)', fontSize:10, marginBottom:4 }}>RELACIONES</p>
                          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                            {p.relaciones.map((r, i) => {
                              const target = data.personajes.find(x => x.id === r.targetId)
                              return (
                                <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                                  <span style={{ color:'var(--gold)', fontSize:12 }}>{p.nombre}</span>
                                  <span style={{ color:'var(--text-dim)', fontSize:11 }}>→ {r.tipo} →</span>
                                  <span style={{ color:'var(--text-primary)', fontSize:12 }}>{target?.nombre ?? r.targetId}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── VISTA ÁRBOL ── */}
      {vista === 'arbol' && (
        <div style={{ overflowX:'auto', paddingBottom:8 }}>
          <div style={{ minWidth: Math.max(500, data.personajes.length * 130), position:'relative' }}>
            {/* SVG para las líneas de relación */}
            <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }}>
              {data.personajes.flatMap(p =>
                p.relaciones.map((r, ri) => {
                  const fromIdx = data.personajes.findIndex(x => x.id === p.id)
                  const toIdx   = data.personajes.findIndex(x => x.id === r.targetId)
                  if (fromIdx === -1 || toIdx === -1) return null
                  const cardW = 120, gap = 16
                  const x1 = fromIdx * (cardW + gap) + cardW / 2
                  const x2 = toIdx   * (cardW + gap) + cardW / 2
                  const y1 = 90, y2 = 90
                  const cy = 130
                  return (
                    <g key={`${p.id}-${r.targetId}-${ri}`}>
                      <path d={`M${x1},${y1} C${x1},${cy} ${x2},${cy} ${x2},${y2}`}
                        fill="none" stroke="var(--gold)" strokeWidth={1.5} strokeOpacity={0.4} strokeDasharray="4 3" />
                      <text x={(x1+x2)/2} y={cy+4} textAnchor="middle"
                        style={{ fontSize:9, fill:'#94a3b8' }}>{r.tipo}</text>
                    </g>
                  )
                })
              )}
            </svg>

            {/* Tarjetas de personajes en fila */}
            <div style={{ display:'flex', gap:16, position:'relative', zIndex:1, padding:'8px 4px 140px' }}>
              {data.personajes.map(p => {
                const isActive = activo?.id === p.id
                const rc = rolColor[p.rol] ?? 'var(--text-dim)'
                return (
                  <button key={p.id} onClick={() => setActivo(isActive ? null : p)}
                    style={{
                      width:120, flexShrink:0, background: isActive ? 'var(--navy)' : 'var(--navy-card)',
                      border:`2px solid ${isActive ? 'var(--gold)' : 'var(--navy-border)'}`,
                      borderRadius:12, padding:'12px 8px', cursor:'pointer', textAlign:'center',
                      transition:'all 0.2s',
                    }}>
                    <div style={{ fontSize:30 }}>{p.emoji}</div>
                    <div style={{ color:'var(--gold)', fontFamily:'Crimson Pro, serif', fontSize:13, fontWeight:700, marginTop:4, lineHeight:1.2 }}>{p.nombre}</div>
                    <div style={{ fontSize:9, padding:'2px 6px', borderRadius:10, background:`${rc}22`, color:rc, marginTop:4, display:'inline-block' }}>{p.rol}</div>
                  </button>
                )
              })}
            </div>

            {/* Panel detalle en árbol */}
            {activo && (
              <div style={{ background:'var(--navy)', border:'1px solid var(--gold)', borderRadius:12, padding:'14px 18px', marginTop:8, animation:'slideUp 0.2s ease-out' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <span style={{ fontSize:28 }}>{activo.emoji}</span>
                    <div>
                      <h3 style={{ color:'var(--gold)', fontFamily:'Crimson Pro, serif', fontSize:16, fontWeight:700, margin:0 }}>{activo.nombre}</h3>
                      <p style={{ color:'var(--text-secondary)', fontSize:12, margin:0 }}>{activo.descripcionBreve}</p>
                    </div>
                  </div>
                  <button onClick={() => setActivo(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)' }}><X size={14}/></button>
                </div>
                <p style={{ color:'var(--text-primary)', fontSize:13, lineHeight:1.7, marginTop:10, fontFamily:'Crimson Pro, serif' }}>{activo.descripcionCompleta}</p>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:8 }}>
                  {activo.versiculosAparece.map(v => (
                    <a key={v} href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(v)}&version=RVR1960`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'var(--gold-dim)', color:'var(--gold)', textDecoration:'none' }}>
                      {v}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <button className="btn-secondary mt-4" style={{ fontSize:11, padding:'5px 12px' }}
        onClick={() => { setData(null); setActivo(null) }}>🔄 Regenerar</button>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// LÍNEA DE TIEMPO
// ════════════════════════════════════════════════════════════════════════════
function TimelineView({ cita, apiKey }: { cita: string; apiKey: string }) {
  const [data, setData]         = useState<Timeline | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [activo, setActivo]     = useState<string | null>(null)
  const [filtroPeriodo, setFiltroPeriodo] = useState<string | null>(null)

  const cargar = async () => {
    setLoading(true); setError('')
    try { setData(await obtenerTimeline(apiKey, cita)) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  if (!data && !loading) return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div style={{ fontSize:52 }}>🗓️</div>
      <p style={{ color:'var(--text-secondary)', fontSize:14, textAlign:'center', maxWidth:320 }}>
        Genera un mapa histórico completo con los períodos bíblicos y eventos clave relacionados con el pasaje
      </p>
      {error && <p className="text-xs px-3 py-2 rounded" style={{ color:'#ef4444', background:'#7f1d1d33' }}>⚠️ {error}</p>}
      <button className="btn-primary" onClick={cargar}>🗓️ Generar línea de tiempo</button>
    </div>
  )

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="flex gap-1">
        {[0,1,2].map(i => <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:'var(--gold)', animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
      </div>
      <p style={{ color:'var(--text-dim)', fontSize:13 }}>Construyendo mapa histórico...</p>
    </div>
  )

  if (!data) return null

  const tipoColor: Record<string, string> = {
    principal:    'var(--gold)',
    contexto:     '#60a5fa',
    profecia:     '#a78bfa',
    cumplimiento: '#4ade80',
  }
  const tipoLabel: Record<string, string> = {
    principal: 'Evento central', contexto: 'Contexto', profecia: 'Profecía', cumplimiento: 'Cumplimiento',
  }

  const eventosFiltrados = filtroPeriodo
    ? data.eventos.filter(e => e.periodoBiblicoId === filtroPeriodo)
    : data.eventos

  return (
    <div>
      {/* Período general y contexto */}
      <div style={{ background:'var(--navy)', border:'1px solid var(--navy-border)', borderRadius:12, padding:'14px 18px', marginBottom:20 }}>
        <p style={{ color:'var(--gold)', fontWeight:700, fontSize:14, marginBottom:6 }}>📅 {data.periodoGeneral}</p>
        <p style={{ color:'var(--text-secondary)', fontSize:13, lineHeight:1.7 }}>{data.contextoHistorico}</p>
      </div>

      {/* ── Mapa de períodos bíblicos (horizontal) ── */}
      {data.periodos.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <p style={{ color:'var(--text-dim)', fontSize:11, marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>
            Períodos Bíblicos
          </p>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {data.periodos.map(per => {
              const isActive = filtroPeriodo === per.id
              return (
                <button key={per.id}
                  onClick={() => setFiltroPeriodo(isActive ? null : per.id)}
                  title={per.descripcion}
                  style={{
                    padding:'6px 12px', borderRadius:20, border:`2px solid ${isActive ? per.color : 'transparent'}`,
                    background: isActive ? `${per.color}33` : `${per.color}18`,
                    cursor:'pointer', transition:'all 0.2s',
                  }}>
                  <span style={{ color: per.color, fontSize:11, fontWeight: isActive ? 700 : 500 }}>{per.nombre}</span>
                  <span style={{ color:'var(--text-dim)', fontSize:10, marginLeft:4 }}>{per.fechaInicio}–{per.fechaFin}</span>
                </button>
              )
            })}
            {filtroPeriodo && (
              <button onClick={() => setFiltroPeriodo(null)}
                style={{ padding:'6px 10px', borderRadius:20, background:'var(--navy-hover)', border:'none', cursor:'pointer', color:'var(--text-dim)', fontSize:11 }}>
                ✕ Ver todos
              </button>
            )}
          </div>
        </div>
      )}

      {/* Leyenda tipos */}
      <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
        {Object.entries(tipoLabel).map(([tipo, label]) => (
          <div key={tipo} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background: tipoColor[tipo] }} />
            <span style={{ fontSize:11, color:'var(--text-dim)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Eventos: línea de tiempo horizontal con scroll ── */}
      <div style={{ overflowX:'auto', paddingBottom:8 }}>
        <div style={{ display:'flex', gap:0, minWidth: eventosFiltrados.length * 220, position:'relative' }}>
          {/* Línea horizontal */}
          <div style={{ position:'absolute', top:32, left:20, right:20, height:2, background:'var(--navy-border)', zIndex:0 }} />

          {eventosFiltrados.map((ev, i) => {
            const color = tipoColor[ev.tipo] ?? 'var(--gold)'
            const periodo = data.periodos.find(p => p.id === ev.periodoBiblicoId)
            const isActive = activo === ev.id
            return (
              <div key={ev.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', width:220, flexShrink:0, position:'relative', zIndex:1 }}>
                {/* Punto + conector */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:12 }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{ev.emoji}</div>
                  <div style={{
                    width:16, height:16, borderRadius:'50%', border:`3px solid ${color}`,
                    background: isActive ? color : 'var(--navy-card)',
                    transition:'background 0.2s', cursor:'pointer',
                  }} onClick={() => setActivo(isActive ? null : ev.id)} />
                  {/* Fecha debajo del punto */}
                  <span style={{ fontSize:10, color, fontWeight:700, marginTop:4, fontFamily:'JetBrains Mono, monospace', whiteSpace:'nowrap' }}>
                    {ev.fecha}
                  </span>
                </div>

                {/* Tarjeta del evento */}
                <div style={{ width:200, margin:'0 10px' }}>
                  <button
                    onClick={() => setActivo(isActive ? null : ev.id)}
                    style={{
                      width:'100%', textAlign:'left', background: isActive ? 'var(--navy)' : 'var(--navy-card)',
                      border:`1px solid ${isActive ? color : 'var(--navy-border)'}`,
                      borderRadius:10, padding:'10px 12px', cursor:'pointer', transition:'all 0.2s',
                    }}>
                    {/* Badge período */}
                    {periodo && (
                      <span style={{ fontSize:9, padding:'1px 6px', borderRadius:10, background:`${periodo.color}22`, color:periodo.color, display:'inline-block', marginBottom:5 }}>
                        {periodo.nombre}
                      </span>
                    )}
                    {/* Badge tipo */}
                    <span style={{ fontSize:9, padding:'1px 6px', borderRadius:10, background:`${color}22`, color, display:'inline-block', marginBottom:5, marginLeft:4 }}>
                      {tipoLabel[ev.tipo]}
                    </span>
                    <p style={{ color:'var(--text-primary)', fontSize:13, fontWeight:700, fontFamily:'Crimson Pro, serif', margin:'0 0 4px' }}>
                      {ev.titulo}
                    </p>
                    <p style={{ color:'var(--text-secondary)', fontSize:11, lineHeight:1.5, margin:0 }}>
                      {ev.descripcion}
                    </p>
                    {ev.lugarGeografico && (
                      <p style={{ color:'var(--text-dim)', fontSize:10, marginTop:5 }}>📍 {ev.lugarGeografico}</p>
                    )}
                  </button>

                  {/* Panel expandido */}
                  {isActive && (
                    <div style={{ background:'var(--navy)', border:`1px solid ${color}`, borderTop:'none', borderRadius:'0 0 10px 10px', padding:'10px 12px', animation:'slideUp 0.2s ease-out' }}>
                      <p style={{ color:'var(--text-primary)', fontSize:12, lineHeight:1.65, margin:'0 0 8px', fontFamily:'Crimson Pro, serif' }}>
                        {ev.detalles}
                      </p>
                      {ev.importanciaTeologica && (
                        <div style={{ background:'var(--gold-dim)', borderRadius:8, padding:'6px 10px', marginBottom:8 }}>
                          <p style={{ color:'var(--gold)', fontSize:10, fontWeight:700, margin:'0 0 2px' }}>IMPORTANCIA TEOLÓGICA</p>
                          <p style={{ color:'var(--text-primary)', fontSize:11, margin:0, lineHeight:1.5 }}>{ev.importanciaTeologica}</p>
                        </div>
                      )}
                      {ev.personajesInvolucrados.length > 0 && (
                        <p style={{ color:'var(--text-dim)', fontSize:10, margin:'0 0 4px' }}>
                          👤 {ev.personajesInvolucrados.join(', ')}
                        </p>
                      )}
                      {ev.referenciasBiblicas.length > 0 && (
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          {ev.referenciasBiblicas.map(v => (
                            <a key={v} href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(v)}&version=RVR1960`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ fontSize:10, padding:'1px 7px', borderRadius:10, background:'var(--gold-dim)', color:'var(--gold)', textDecoration:'none' }}>
                              {v}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <p style={{ color:'var(--text-dim)', fontSize:11, marginTop:12, textAlign:'center' }}>
        ← Desliza para ver todos los eventos →
      </p>

      <button className="btn-secondary mt-4" style={{ fontSize:11, padding:'5px 12px' }}
        onClick={() => { setData(null); setActivo(null); setFiltroPeriodo(null) }}>🔄 Regenerar</button>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// STUDY SECTION PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function StudySection({ cita, texto, onClear, apiKey }: Props) {
  const [expanded, setExpanded]           = useState(true)
  const [saved, setSaved]                 = useState(false)
  const [downloading, setDownloading]     = useState(false)
  const [mapError, setMapError]           = useState(false)
  const [tabOrder, setTabOrder]           = useState(() => TABS_EXEGESIS.map((_, i) => i))
  const [activeOrigIdx, setActiveOrigIdx] = useState(0)
  const [dragTabIdx, setDragTabIdx]       = useState<number | null>(null)
  const [dragOverTabIdx, setDragOverTabIdx] = useState<number | null>(null)

  const handleTabDragStart = (i: number) => setDragTabIdx(i)
  const handleTabDragOver  = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverTabIdx(i) }
  const handleTabDrop = (target: number) => {
    if (dragTabIdx === null || dragTabIdx === target) return
    setTabOrder(prev => {
      const next = [...prev]
      const from = next.indexOf(dragTabIdx)
      const to   = next.indexOf(target)
      next.splice(from, 1); next.splice(to, 0, dragTabIdx)
      return next
    })
    setDragTabIdx(null); setDragOverTabIdx(null)
  }

  const lugar        = extraerLugarGeografico(texto)
  const mapEmbedUrl  = lugar ? `https://maps.google.com/maps?q=${encodeURIComponent(lugar + ' ancient biblical')}&t=&z=8&ie=UTF8&iwloc=&output=embed` : null
  const mapDirectUrl = lugar ? `https://www.google.com/maps/search/${encodeURIComponent(lugar)}` : null

  const handleSave = () => {
    guardarEstudio({ cita, texto, fecha: new Date().toISOString(), anotaciones: [] })
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }
  const handleDownload = async () => {
    setDownloading(true)
    try { await exportarComoWord(cita, texto) } finally { setDownloading(false) }
  }
  const getSeccionTexto = (origIdx: number) => {
    const tab = TABS_EXEGESIS[origIdx]
    if (!tab.seccion) return texto
    return extraerSeccion(texto, tab.seccion, tab.seccion + 1)
  }

  const renderContenido = () => {
    if (activeOrigIdx === 14) return <ArbolView cita={cita} apiKey={apiKey} />
    if (activeOrigIdx === 15) return <TimelineView cita={cita} apiKey={apiKey} />
    if (activeOrigIdx === 10) return (
      <div>
        <AnnotationReader texto={getSeccionTexto(10)} cita={cita} />
        {lugar ? (
          <div className="mt-5 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--navy-border)' }}>
            <div className="flex items-center justify-between px-4 py-3"
              style={{ background: 'var(--navy-card)', borderBottom: '1px solid var(--navy-border)' }}>
              <div className="flex items-center gap-2">
                <MapPin size={14} style={{ color: 'var(--gold)' }} />
                <span style={{ color: 'var(--gold)', fontSize: 14, fontWeight: 500 }}>{lugar}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>· Ubicación bíblica</span>
              </div>
              <a href={mapDirectUrl!} target="_blank" rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, padding:'5px 10px', borderRadius:8, background:'var(--gold-dim)', color:'var(--gold)', textDecoration:'none' }}>
                <ExternalLink size={11} /> Abrir en Maps
              </a>
            </div>
            {!mapError ? (
              <iframe src={mapEmbedUrl!} title={`Mapa bíblico: ${lugar}`} loading="lazy"
                onError={() => setMapError(true)}
                style={{ width:'100%', height:380, border:'none', display:'block' }}
                referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'40px 20px', background:'var(--navy-card)' }}>
                <MapPin size={32} style={{ color:'var(--gold)', opacity:0.6 }} />
                <p style={{ color:'var(--text-secondary)', fontSize:13, textAlign:'center' }}>
                  El mapa no se puede mostrar. Ábrelo en Google Maps.
                </p>
                <a href={mapDirectUrl!} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:8, background:'var(--gold)', color:'#0a1628', textDecoration:'none', fontWeight:700, fontSize:13 }}>
                  <ExternalLink size={14} /> Ver {lugar} en Google Maps
                </a>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color:'var(--text-dim)', fontSize:13, marginTop:12 }}>📍 No se detectó una ubicación geográfica específica.</p>
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
            <p style={{ color:'var(--text-dim)', fontSize:11, margin:0 }}>{texto.split(' ').length.toLocaleString()} palabras generadas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize:12, padding:'7px 12px' }} onClick={handleSave}>
            <Library size={13} />{saved ? '✅ Guardado' : 'Guardar'}
          </button>
          <button className="btn-secondary" style={{ fontSize:12, padding:'7px 12px', opacity: downloading ? 0.7 : 1 }}
            onClick={handleDownload} disabled={downloading}>
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
          <div className="tab-bar" style={{ flexWrap:'wrap' }}>
            {tabOrder.map(origIdx => {
              const tab = TABS_EXEGESIS[origIdx]
              return (
                <button key={origIdx} draggable
                  onDragStart={() => handleTabDragStart(origIdx)}
                  onDragOver={e => handleTabDragOver(e, origIdx)}
                  onDrop={() => handleTabDrop(origIdx)}
                  onDragEnd={() => { setDragTabIdx(null); setDragOverTabIdx(null) }}
                  className={`tab-btn ${activeOrigIdx === origIdx ? 'active' : ''}`}
                  onClick={() => setActiveOrigIdx(origIdx)}
                  style={{ opacity: dragTabIdx === origIdx ? 0.4 : 1, outline: dragOverTabIdx === origIdx ? '2px solid var(--gold)' : 'none', cursor:'grab', userSelect:'none' }}>
                  {tab.label}
                </button>
              )
            })}
          </div>
          <div className="tab-panel">{renderContenido()}</div>
        </div>
      )}

      <ChatPanel cita={cita} textoPasaje={texto} apiKey={apiKey} />

      <style>{`@keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
    </div>
  )
}

'use client'
import { useState, useEffect, useRef } from 'react'
import { Library, Settings, Flame, Search, X, BookMarked } from 'lucide-react'
import ApiKeySetup from '@/components/ApiKeySetup'
import StudySection from '@/components/StudySection'
import ComparativeSection from '@/components/ComparativeSection'
import SermonSection from '@/components/SermonSection'
import LibrarySidebar from '@/components/LibrarySidebar'
import { obtenerExegesis, obtenerComparado, obtenerSermon, type EstiloSermon } from '@/lib/gemini'
import { getApiKey, setApiKey, type EstudioGuardado } from '@/lib/storage'

interface StudyResult  { id: string; cita: string; texto: string }
interface CompResult   { id: string; cita1: string; cita2: string; texto: string }
interface SermonResult { id: string; cita: string; texto: string; estilo: EstiloSermon }

const EJEMPLOS       = ['Juan 3:16', 'Salmos 23:1-6', 'Romanos 8:28', 'Filipenses 4:13']
const COMP_EJEMPLOS  = [['Juan 3:16', 'Romanos 5:8'], ['Salmos 23', 'Juan 10:11'], ['Gálatas 2:20', 'Filipenses 1:21']]
const SERMON_EJEMPLOS = ['Juan 3:16', 'Mateo 5:1-12', 'Salmos 23', 'Romanos 8:28']

let _uid = 0
const uid = () => String(++_uid)

function reorder<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next
}

export default function HomePage() {
  const [apiKey, setApiKeyState]     = useState<string | null>(null)
  const [loading, setLoading]        = useState(true)

  // Exégesis
  const [citaInput, setCitaInput]    = useState('')
  const [estudiando, setEstudiando]  = useState(false)
  const [errorExeg, setErrorExeg]    = useState('')
  const [estudios, setEstudios]      = useState<StudyResult[]>([])

  // Comparado
  const [cita1, setCita1]            = useState('')
  const [cita2, setCita2]            = useState('')
  const [comparando, setComparando]  = useState(false)
  const [errorComp, setErrorComp]    = useState('')
  const [comparados, setComparados]  = useState<CompResult[]>([])

  // Sermón
  const [citaSermon, setCitaSermon]      = useState('')
  const [estiloSermon, setEstiloSermon]  = useState<EstiloSermon>('expositivo')
  const [generando, setGenerando]        = useState(false)
  const [errorSermon, setErrorSermon]    = useState('')
  const [sermones, setSermones]          = useState<SermonResult[]>([])

  const [showLibrary, setShowLibrary]    = useState(false)
  const [showSettings, setShowSettings]  = useState(false)

  // Drag refs
  const dragEstudio   = useRef<number | null>(null)
  const dragComparado = useRef<number | null>(null)
  const dragSermon    = useRef<number | null>(null)

  useEffect(() => { const key = getApiKey(); if (key) setApiKeyState(key); setLoading(false) }, [])

  const handleSaveKey = (key: string) => { setApiKey(key); setApiKeyState(key) }

  const handleStudy = async () => {
    if (!citaInput.trim() || !apiKey) return
    setEstudiando(true); setErrorExeg('')
    try {
      const texto = await obtenerExegesis(apiKey, citaInput.trim())
      setEstudios(prev => [{ id: uid(), cita: citaInput.trim(), texto }, ...prev]); setCitaInput('')
    } catch (e: unknown) { setErrorExeg(e instanceof Error ? e.message : 'Error desconocido') }
    finally { setEstudiando(false) }
  }

  const handleCompare = async () => {
    if (!cita1.trim() || !cita2.trim() || !apiKey) return
    setComparando(true); setErrorComp('')
    try {
      const texto = await obtenerComparado(apiKey, cita1.trim(), cita2.trim())
      setComparados(prev => [{ id: uid(), cita1: cita1.trim(), cita2: cita2.trim(), texto }, ...prev])
      setCita1(''); setCita2('')
    } catch (e: unknown) { setErrorComp(e instanceof Error ? e.message : 'Error desconocido') }
    finally { setComparando(false) }
  }

  const handleSermon = async () => {
    if (!citaSermon.trim() || !apiKey) return
    setGenerando(true); setErrorSermon('')
    try {
      const texto = await obtenerSermon(apiKey, citaSermon.trim(), estiloSermon)
      setSermones(prev => [{ id: uid(), cita: citaSermon.trim(), texto, estilo: estiloSermon }, ...prev])
      setCitaSermon('')
    } catch (e: unknown) { setErrorSermon(e instanceof Error ? e.message : 'Error desconocido') }
    finally { setGenerando(false) }
  }

  const handleSelectEstudio = (estudio: EstudioGuardado) => {
    setEstudios(prev => [{ id: uid(), cita: estudio.cita, texto: estudio.texto }, ...prev]); setShowLibrary(false)
  }
  const handleSelectComparado = (estudio: EstudioGuardado) => {
    const parts = estudio.cita.split(' vs ')
    setComparados(prev => [{ id: uid(), cita1: parts[0]||'', cita2: parts[1]||'', texto: estudio.texto }, ...prev])
    setShowLibrary(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-4xl" style={{ animation: 'spin 1s linear infinite' }}>⟳</div></div>
  if (!apiKey) return <ApiKeySetup onSave={handleSaveKey} />

  return (
    <div className="min-h-screen" style={{ background: 'var(--navy)' }}>

      {/* NAV */}
      <nav style={{ background: 'var(--navy-card)', borderBottom: '1px solid var(--navy-border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📜</span>
            <div>
              <h1 className="font-bold text-base leading-tight" style={{ color: 'var(--gold)', fontFamily: 'Crimson Pro, serif' }}>Estudio Bíblico Pro</h1>
              <p className="text-xs hidden sm:block" style={{ color: 'var(--text-dim)' }}>Exégesis académica</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" style={{ padding: '7px 10px' }} onClick={() => setShowLibrary(!showLibrary)}>
              <Library size={16} /><span className="hidden sm:inline text-xs">Biblioteca</span>
            </button>
            <button className="btn-secondary" style={{ padding: '7px 10px' }} onClick={() => setShowSettings(!showSettings)}>
              <Settings size={16} />
            </button>
          </div>
        </div>
      </nav>

      {showSettings && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="card flex items-center justify-between gap-4 flex-wrap" style={{ animation: 'slideUp 0.3s ease-out' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>🔑 API Key activa</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>{apiKey.substring(0, 8)}{'•'.repeat(20)}</p>
            </div>
            <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => { setApiKey(''); setApiKeyState(null) }}>
              <X size={13} /> Cambiar API Key
            </button>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">

        {/* ── SECCIÓN 1: EXÉGESIS ── */}
        <section>
          <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'Crimson Pro, serif' }}>📖 Estudio Bíblico Pro</h2>
          <div className="card">
            <div className="flex gap-3 flex-col sm:flex-row">
              <input className="input-field flex-1" placeholder="Referencia bíblica (ej: Juan 3:16)"
                value={citaInput} onChange={e => setCitaInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStudy()} disabled={estudiando} />
              <button className="btn-primary whitespace-nowrap" onClick={handleStudy} disabled={estudiando || !citaInput.trim()}>
                {estudiando ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Analizando...</> : <><Flame size={16} /> Estudiar</>}
              </button>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {EJEMPLOS.map(ej => <button key={ej} className="tab-btn" style={{ fontSize: 11 }} onClick={() => setCitaInput(ej)}>{ej}</button>)}
            </div>
            {errorExeg && <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: '#7f1d1d33', color: '#ef4444', border: '1px solid #7f1d1d' }}>⚠️ {errorExeg}</div>}
            {estudiando && <div className="mt-4 space-y-3">{[90,70,80].map((w,i) => <div key={i} className="shimmer rounded-lg" style={{ height:16, width:`${w}%` }} />)}<p className="text-xs" style={{ color: 'var(--text-dim)' }}>✨ Generando exégesis académica...</p></div>}
          </div>
          {estudios.map((e, i) => (
            <div key={e.id} draggable onDragStart={() => { dragEstudio.current = i }} onDragOver={ev => ev.preventDefault()} onDrop={() => { if (dragEstudio.current !== null) { setEstudios(p => reorder(p, dragEstudio.current!, i)); dragEstudio.current = null } }} style={{ cursor: 'grab' }}>
              <StudySection cita={e.cita} texto={e.texto} apiKey={apiKey!} onClear={() => setEstudios(prev => prev.filter(x => x.id !== e.id))} />
            </div>
          ))}
        </section>

        {/* ── SECCIÓN 2: COMPARADO ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-bold text-lg" style={{ fontFamily: 'Crimson Pro, serif' }}>⚖️ Estudio Comparado</h2>
            <span style={{ background: 'var(--gold)', color: 'var(--navy-card)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>NUEVO</span>
          </div>
          <div className="card">
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Compara dos pasajes con análisis teológico profundo</p>
            <div className="flex gap-3 flex-col sm:flex-row">
              <input className="input-field flex-1" placeholder="Pasaje A (ej: Juan 3:16)" value={cita1} onChange={e => setCita1(e.target.value)} disabled={comparando} />
              <input className="input-field flex-1" placeholder="Pasaje B (ej: Romanos 5:8)" value={cita2} onChange={e => setCita2(e.target.value)} disabled={comparando} onKeyDown={e => e.key === 'Enter' && handleCompare()} />
              <button className="btn-primary whitespace-nowrap" onClick={handleCompare} disabled={comparando || !cita1.trim() || !cita2.trim()}>
                {comparando ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Comparando...</> : <><Search size={15} /> Comparar</>}
              </button>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {COMP_EJEMPLOS.map(([c1,c2]) => <button key={`${c1}-${c2}`} className="tab-btn" style={{ fontSize: 11 }} onClick={() => { setCita1(c1); setCita2(c2) }}>{c1} vs {c2}</button>)}
            </div>
            {errorComp && <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: '#7f1d1d33', color: '#ef4444', border: '1px solid #7f1d1d' }}>⚠️ {errorComp}</div>}
            {comparando && <div className="mt-4 space-y-3">{[85,65,75].map((w,i) => <div key={i} className="shimmer rounded-lg" style={{ height:16, width:`${w}%` }} />)}<p className="text-xs" style={{ color: 'var(--text-dim)' }}>🔍 Generando análisis comparativo...</p></div>}
          </div>
          {comparados.map((c, i) => (
            <div key={c.id} draggable onDragStart={() => { dragComparado.current = i }} onDragOver={ev => ev.preventDefault()} onDrop={() => { if (dragComparado.current !== null) { setComparados(p => reorder(p, dragComparado.current!, i)); dragComparado.current = null } }} style={{ cursor: 'grab' }}>
              <ComparativeSection cita1={c.cita1} cita2={c.cita2} texto={c.texto} apiKey={apiKey!} onRemove={() => setComparados(prev => prev.filter(x => x.id !== c.id))} />
            </div>
          ))}
        </section>

        {/* ── SECCIÓN 3: SERMÓN / DEVOCIONAL ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-bold text-lg" style={{ fontFamily: 'Crimson Pro, serif' }}>📝 Sermón / Devocional</h2>
            <span style={{ background: '#7c3aed', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>IA</span>
          </div>
          <div className="card">
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Genera un sermón expositivo, devocional o homilía basado en un pasaje</p>

            {/* Selector de estilo */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {([['expositivo','📖 Sermón expositivo'],['devocional','🌅 Devocional breve']] as [EstiloSermon,string][]).map(([val,label]) => (
                <button key={val} onClick={() => setEstiloSermon(val)}
                  className="tab-btn"
                  style={{ fontSize: 12, outline: estiloSermon === val ? '2px solid #a78bfa' : 'none', color: estiloSermon === val ? '#a78bfa' : undefined }}>
                  {label}
                </button>
              ))}
            </div>

            <div className="flex gap-3 flex-col sm:flex-row">
              <input className="input-field flex-1" placeholder="Pasaje bíblico (ej: Juan 3:16)"
                value={citaSermon} onChange={e => setCitaSermon(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSermon()} disabled={generando} />
              <button className="btn-primary whitespace-nowrap" onClick={handleSermon} disabled={generando || !citaSermon.trim()}
                style={{ background: generando ? undefined : 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
                {generando ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Generando...</> : <><BookMarked size={16} /> Generar</>}
              </button>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {SERMON_EJEMPLOS.map(ej => <button key={ej} className="tab-btn" style={{ fontSize: 11 }} onClick={() => setCitaSermon(ej)}>{ej}</button>)}
            </div>
            {errorSermon && <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: '#7f1d1d33', color: '#ef4444', border: '1px solid #7f1d1d' }}>⚠️ {errorSermon}</div>}
            {generando && <div className="mt-4 space-y-3">{[85,65,75].map((w,i) => <div key={i} className="shimmer rounded-lg" style={{ height:16, width:`${w}%` }} />)}<p className="text-xs" style={{ color: 'var(--text-dim)' }}>✍️ Preparando el mensaje...</p></div>}
          </div>
          {sermones.map((s, i) => (
            <div key={s.id} draggable onDragStart={() => { dragSermon.current = i }} onDragOver={ev => ev.preventDefault()} onDrop={() => { if (dragSermon.current !== null) { setSermones(p => reorder(p, dragSermon.current!, i)); dragSermon.current = null } }} style={{ cursor: 'grab' }}>
              <SermonSection cita={s.cita} texto={s.texto} estilo={s.estilo} onRemove={() => setSermones(prev => prev.filter(x => x.id !== s.id))} />
            </div>
          ))}
        </section>

      </main>

      {showLibrary && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setShowLibrary(false)} />
          <LibrarySidebar onSelectEstudio={handleSelectEstudio} onSelectComparado={handleSelectComparado} onClose={() => setShowLibrary(false)} />
        </>
      )}

      <footer className="text-center py-8 mt-8" style={{ borderTop: '1px solid var(--navy-border)', color: 'var(--text-dim)', fontSize: 12 }}>
        <p>📜 Estudio Bíblico Pro</p>
        <p className="mt-1">Powered by Google Gemini · Tu API Key nunca sale de tu dispositivo</p>
      </footer>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

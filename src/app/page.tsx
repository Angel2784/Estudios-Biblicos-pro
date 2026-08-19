'use client'
import { useState, useEffect, useRef } from 'react'
import { Settings, X } from 'lucide-react'
import { UserButton, useUser, SignInButton } from '@clerk/nextjs'
import ApiKeySetup from '@/components/ApiKeySetup'
import StudySection from '@/components/StudySection'
import ComparativeSection from '@/components/ComparativeSection'
import SermonSection from '@/components/SermonSection'
import LibrarySidebar from '@/components/LibrarySidebar'
import { obtenerExegesis, obtenerComparado, obtenerSermon, type EstiloSermon, consultarLimite, onRestantesChange, PRECIO_MENSUAL, PRECIO_ANUAL } from '@/lib/gemini'
import { getApiKey, setApiKey, type EstudioGuardado } from '@/lib/storage'

interface StudyResult  { id: string; cita: string; texto: string }
interface CompResult   { id: string; cita1: string; cita2: string; texto: string }
interface SermonResult { id: string; cita: string; texto: string; estilo: EstiloSermon }

const EJEMPLOS        = ['Juan 3:16', 'Salmos 23:1-6', 'Romanos 8:28', 'Filipenses 4:13']
const COMP_EJEMPLOS   = [['Juan 3:16', 'Romanos 5:8'], ['Salmos 23', 'Juan 10:11'], ['Gálatas 2:20', 'Filipenses 1:21']]
const SERMON_EJEMPLOS = ['Juan 3:16', 'Mateo 5:1-12', 'Salmos 23', 'Romanos 8:28']

let _uid = 0
const uid = () => String(++_uid)

function reorder<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next
}

export default function HomePage() {
  const { isSignedIn } = useUser()
  const [apiKey, setApiKeyState]     = useState<string>('')
  const [loading, setLoading]        = useState(true)
  const [showApiKeySetup, setShowApiKeySetup] = useState(false)
  const [restantes, setRestantes]    = useState<number | null>(null)
  const [esAdmin, setEsAdmin]        = useState(false)
  const [esPremium, setEsPremium]    = useState(false)

  const [citaInput, setCitaInput]    = useState('')
  const [estudiando, setEstudiando]  = useState(false)
  const [errorExeg, setErrorExeg]    = useState('')
  const [estudios, setEstudios]      = useState<StudyResult[]>([])

  const [cita1, setCita1]            = useState('')
  const [cita2, setCita2]            = useState('')
  const [comparando, setComparando]  = useState(false)
  const [errorComp, setErrorComp]    = useState('')
  const [comparados, setComparados]  = useState<CompResult[]>([])

  const [citaSermon, setCitaSermon]      = useState('')
  const [estiloSermon, setEstiloSermon]  = useState<EstiloSermon>('expositivo')
  const [generando, setGenerando]        = useState(false)
  const [errorSermon, setErrorSermon]    = useState('')
  const [sermones, setSermones]          = useState<SermonResult[]>([])

  const [showLibrary, setShowLibrary]    = useState(false)
  const [showSettings, setShowSettings]  = useState(false)

  const dragEstudio   = useRef<number | null>(null)
  const dragComparado = useRef<number | null>(null)
  const dragSermon    = useRef<number | null>(null)

  useEffect(() => { const key = getApiKey(); if (key) setApiKeyState(key); setLoading(false) }, [])
  useEffect(() => { onRestantesChange(setRestantes) }, [])
  useEffect(() => {
    consultarLimite().then(d => {
      setRestantes(d.restantes)
      setEsAdmin(!!d.esAdmin)
      setEsPremium(!!d.esPremium)
    })
  }, [])

  const handleSaveKey = (key: string) => { setApiKey(key); setApiKeyState(key); setShowApiKeySetup(false) }
  const handleRemoveKey = () => { setApiKey(''); setApiKeyState('') }

  const handleStudy = async () => {
    if (!citaInput.trim()) return
    setEstudiando(true); setErrorExeg('')
    try {
      const texto = await obtenerExegesis(apiKey, citaInput.trim())
      setEstudios(prev => [{ id: uid(), cita: citaInput.trim(), texto }, ...prev]); setCitaInput('')
    } catch (e: unknown) { setErrorExeg(e instanceof Error ? e.message : 'Error desconocido') }
    finally { setEstudiando(false) }
  }

  const handleCompare = async () => {
    if (!cita1.trim() || !cita2.trim()) return
    setComparando(true); setErrorComp('')
    try {
      const texto = await obtenerComparado(apiKey, cita1.trim(), cita2.trim())
      setComparados(prev => [{ id: uid(), cita1: cita1.trim(), cita2: cita2.trim(), texto }, ...prev])
      setCita1(''); setCita2('')
    } catch (e: unknown) { setErrorComp(e instanceof Error ? e.message : 'Error desconocido') }
    finally { setComparando(false) }
  }

  const handleSermon = async () => {
    if (!citaSermon.trim()) return
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-transparent"><div className="text-4xl text-amber-300" style={{ animation: 'spin 1s linear infinite' }}>⟳</div></div>
  if (showApiKeySetup) return <ApiKeySetup onSave={handleSaveKey} />

  const sinLimite = esAdmin || esPremium || !!apiKey

  return (
    <div className="min-h-screen bg-transparent">

      {/* ── BARRA SUPERIOR ── */}
      <nav className="sticky top-0 z-50 bg-[#080b12]/80 backdrop-blur-xl border-b border-amber-500/20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="header-brand-title m-0">
              Estudio Bíblico Pro
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            {!sinLimite && restantes !== null && (
              <span className="pill text-xs px-3 py-1">
                {restantes > 0 ? `${restantes} consultas gratis hoy` : 'Límite alcanzado'}
              </span>
            )}
            {esAdmin && <span className="pill text-xs px-3 py-1 text-amber-300 border-amber-400/50 shadow-[0_0_10px_rgba(255,193,7,0.3)]">Admin</span>}
            {esPremium && <span className="pill text-xs px-3 py-1 text-amber-300 border-amber-400/50 shadow-[0_0_10px_rgba(255,193,7,0.3)]">Premium</span>}
            
            <button className="btn-glass" onClick={() => setShowLibrary(!showLibrary)}>
              <span className="text-xs">Biblioteca</span>
            </button>
            <button className="btn-glass p-2" onClick={() => setShowSettings(!showSettings)}>
              <Settings size={15} />
            </button>

            {isSignedIn ? (
              <UserButton afterSignOutUrl="/sign-in" />
            ) : (
              <SignInButton mode="modal">
                <button className="btn-gold text-xs px-4 py-2">
                  Iniciar sesión
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </nav>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {/* ── 1. ESTUDIO BÍBLICO ── */}
        <section>
          <h2 className="section-title mb-3">Estudio Bíblico</h2>
          <div className="card">
            <div className="flex gap-3 flex-col sm:flex-row items-center">
              <input 
                className="input-gold flex-1" 
                placeholder="Referencia bíblica (ej: Juan 3:16)"
                value={citaInput} 
                onChange={e => setCitaInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStudy()} 
                disabled={estudiando} 
              />
              <button 
                className={`btn-gold w-full sm:w-auto ${citaInput.trim() ? 'active' : ''}`}
                onClick={handleStudy} 
                disabled={estudiando}
              >
                {estudiando ? (
                  <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Analizando...</>
                ) : (
                  <>Estudiar</>
                )}
              </button>
            </div>
            
            <div className="flex gap-2.5 mt-4 flex-wrap">
              {EJEMPLOS.map((ej, index) => (
                <button 
                  key={ej} 
                  className={`pill ${index === 0 ? 'pill-active-blue' : ''}`} 
                  onClick={() => setCitaInput(ej)}
                >
                  {ej}
                </button>
              ))}
            </div>

            {errorExeg && <div className="mt-3 p-3 rounded-xl text-xs bg-red-950/40 text-red-400 border border-red-800/60">{errorExeg}</div>}
            {estudiando && <div className="mt-4 space-y-3">{[90,70,80].map((w,i) => <div key={i} className="shimmer rounded-lg" style={{ height:16, width:`${w}%` }} />)}<p className="text-xs text-amber-200/90">Generando exégesis académica...</p></div>}
          </div>

          {estudios.map((e, i) => (
            <div key={e.id} draggable onDragStart={() => { dragEstudio.current = i }} onDragOver={ev => ev.preventDefault()} onDrop={() => { if (dragEstudio.current !== null) { setEstudios(p => reorder(p, dragEstudio.current!, i)); dragEstudio.current = null } }} style={{ cursor: 'grab' }}>
              <StudySection cita={e.cita} texto={e.texto} apiKey={apiKey} onClear={() => setEstudios(prev => prev.filter(x => x.id !== e.id))} />
            </div>
          ))}
        </section>

        {/* ── 2. ESTUDIO COMPARADO ── */}
        <section>
          <h2 className="section-title mb-3">Estudio Comparado</h2>
          <div className="card">
            <p className="text-sm mb-4 text-slate-300">Compara dos pasajes con análisis teológico profundo</p>
            <div className="flex gap-3 flex-col sm:flex-row items-center">
              <input 
                className="input-subtle flex-1" 
                placeholder="Pasaje A (ej: Juan 3:16)" 
                value={cita1} 
                onChange={e => setCita1(e.target.value)} 
                disabled={comparando} 
              />
              <input 
                className="input-subtle flex-1" 
                placeholder="Pasaje B (ej: Romanos 5:8)" 
                value={cita2} 
                onChange={e => setCita2(e.target.value)} 
                disabled={comparando} 
                onKeyDown={e => e.key === 'Enter' && handleCompare()} 
              />
              <button 
                className={`btn-gold w-full sm:w-auto ${(cita1.trim() && cita2.trim()) ? 'active' : ''}`}
                onClick={handleCompare} 
                disabled={comparando}
              >
                {comparando ? (
                  <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Comparando...</>
                ) : (
                  <>Comparar</>
                )}
              </button>
            </div>
            
            <div className="flex gap-2.5 mt-4 flex-wrap">
              {COMP_EJEMPLOS.map(([c1,c2]) => (
                <button 
                  key={`${c1}-${c2}`} 
                  className="pill" 
                  onClick={() => { setCita1(c1); setCita2(c2) }}
                >
                  {c1} vs {c2}
                </button>
              ))}
            </div>

            {errorComp && <div className="mt-3 p-3 rounded-xl text-xs bg-red-950/40 text-red-400 border border-red-800/60">{errorComp}</div>}
            {comparando && <div className="mt-4 space-y-3">{[85,65,75].map((w,i) => <div key={i} className="shimmer rounded-lg" style={{ height:16, width:`${w}%` }} />)}<p className="text-xs text-amber-200/90">Generando análisis comparativo...</p></div>}
          </div>

          {comparados.map((c, i) => (
            <div key={c.id} draggable onDragStart={() => { dragComparado.current = i }} onDragOver={ev => ev.preventDefault()} onDrop={() => { if (dragComparado.current !== null) { setComparados(p => reorder(p, dragComparado.current!, i)); dragComparado.current = null } }} style={{ cursor: 'grab' }}>
              <ComparativeSection cita1={c.cita1} cita2={c.cita2} texto={c.texto} apiKey={apiKey} onRemove={() => setComparados(prev => prev.filter(x => x.id !== c.id))} />
            </div>
          ))}
        </section>

        {/* ── 3. SERMÓN / DEVOCIONAL ── */}
        <section>
          <h2 className="section-title mb-3">Sermón / Devocional</h2>
          <div className="card">
            <p className="text-sm mb-4 text-slate-300">Genera un sermón expositivo o devocional basado en un pasaje</p>

            <div className="flex gap-2.5 mb-4 flex-wrap">
              {([['expositivo','Sermón expositivo'],['devocional','Devocional breve']] as [EstiloSermon,string][]).map(([val,label]) => (
                <button 
                  key={val} 
                  onClick={() => setEstiloSermon(val)}
                  className={`pill ${estiloSermon === val ? 'pill-active-purple' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex gap-3 flex-col sm:flex-row items-center">
              <input 
                className="input-subtle flex-1" 
                placeholder="Pasaje bíblico (ej: Juan 3:16)"
                value={citaSermon} 
                onChange={e => setCitaSermon(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSermon()} 
                disabled={generando} 
              />
              <button 
                className={`btn-gold w-full sm:w-auto ${citaSermon.trim() ? 'active' : ''}`}
                onClick={handleSermon} 
                disabled={generando}
              >
                {generando ? (
                  <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Generando...</>
                ) : (
                  <>Generar</>
                )}
              </button>
            </div>

            <div className="flex gap-2.5 mt-4 flex-wrap">
              {SERMON_EJEMPLOS.map(ej => (
                <button 
                  key={ej} 
                  className="pill" 
                  onClick={() => setCitaSermon(ej)}
                >
                  {ej}
                </button>
              ))}
            </div>

            {errorSermon && <div className="mt-3 p-3 rounded-xl text-xs bg-red-950/40 text-red-400 border border-red-800/60">{errorSermon}</div>}
            {generando && <div className="mt-4 space-y-3">{[85,65,75].map((w,i) => <div key={i} className="shimmer rounded-lg" style={{ height:16, width:`${w}%` }} />)}<p className="text-xs text-amber-200/90">Preparando el mensaje...</p></div>}
          </div>

          {sermones.map((s, i) => (
            <div key={s.id} draggable onDragStart={() => { dragSermon.current = i }} onDragOver={ev => ev.preventDefault()} onDrop={() => { if (dragSermon.current !== null) { setSermones(p => reorder(p, dragSermon.current!, i)); dragSermon.current = null } }} style={{ cursor: 'grab' }}>
              <SermonSection cita={s.cita} texto={s.texto} estilo={s.estilo} onRemove={() => setSermones(prev => prev.filter(x => x.id !== s.id))} />
            </div>
          ))}
        </section>

      </main>

      {/* Sidebar de Biblioteca */}
      {showLibrary && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 999 }} onClick={() => setShowLibrary(false)} />
          <LibrarySidebar onSelectEstudio={handleSelectEstudio} onSelectComparado={handleSelectComparado} onClose={() => setShowLibrary(false)} />
        </>
      )}

      {/* ── FOOTER CON COPYRIGHT ── */}
      <footer className="text-center py-8 mt-12 border-t border-amber-500/20 text-slate-400 text-xs">
        <p className="text-amber-200/80 font-medium">
          © {new Date().getFullYear()} Estudio Bíblico Pro · Todos los derechos reservados.
        </p>
      </footer>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

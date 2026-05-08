'use client'
import { useState, useEffect } from 'react'
import { Library, Settings, Flame, Search, Zap, X } from 'lucide-react'
import ApiKeySetup from '@/components/ApiKeySetup'
import StudySection from '@/components/StudySection'
import ComparativeSection from '@/components/ComparativeSection'
import LibrarySidebar from '@/components/LibrarySidebar'
import { obtenerExegesis, obtenerComparado } from '@/lib/gemini'
import { getApiKey, setApiKey, type EstudioGuardado } from '@/lib/storage'

interface StudyResult { cita: string; texto: string }
interface CompResult { cita1: string; cita2: string; texto: string }

const EJEMPLOS_RAPIDOS = ['Juan 3:16', 'Salmos 23:1-6', 'Romanos 8:28', 'Filipenses 4:13']
const COMP_RAPIDOS = [['Juan 3:16', 'Romanos 5:8'], ['Salmos 23', 'Juan 10:11'], ['Gálatas 2:20', 'Filipenses 1:21']]

export default function HomePage() {
  const [apiKey, setApiKeyState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Exégesis
  const [citaInput, setCitaInput] = useState('')
  const [estudyando, setEstudyando] = useState(false)
  const [errorExeg, setErrorExeg] = useState('')
  const [estudios, setEstudios] = useState<StudyResult[]>([])

  // Comparado
  const [cita1, setCita1] = useState('')
  const [cita2, setCita2] = useState('')
  const [comparando, setComparando] = useState(false)
  const [errorComp, setErrorComp] = useState('')
  const [comparados, setComparados] = useState<CompResult[]>([])

  // UI
  const [showLibrary, setShowLibrary] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const key = getApiKey()
    if (key) setApiKeyState(key)
    setLoading(false)
  }, [])

  const handleSaveKey = (key: string) => {
    setApiKey(key)
    setApiKeyState(key)
  }

  const handleStudy = async () => {
    if (!citaInput.trim() || !apiKey) return
    setEstudyando(true); setErrorExeg('')
    try {
      const texto = await obtenerExegesis(apiKey, citaInput.trim())
      setEstudios(prev => [{ cita: citaInput.trim(), texto }, ...prev])
      setCitaInput('')
    } catch (e: any) {
      setErrorExeg(e.message || 'Error desconocido')
    } finally { setEstudyando(false) }
  }

  const handleCompare = async () => {
    if (!cita1.trim() || !cita2.trim() || !apiKey) return
    setComparando(true); setErrorComp('')
    try {
      const texto = await obtenerComparado(apiKey, cita1.trim(), cita2.trim())
      setComparados(prev => [{ cita1: cita1.trim(), cita2: cita2.trim(), texto }, ...prev])
      setCita1(''); setCita2('')
    } catch (e: any) {
      setErrorComp(e.message || 'Error desconocido')
    } finally { setComparando(false) }
  }

  const handleSelectFromLibrary = (estudio: EstudioGuardado) => {
    setEstudios(prev => [{ cita: estudio.cita, texto: estudio.texto }, ...prev])
    setShowLibrary(false)
  }

  const handleSelectComparadoFromLibrary = (estudio: EstudioGuardado) => {
    const [c1, , c2] = estudio.cita.split(' ')
    setComparados(prev => [{ cita1: c1, cita2: c2, texto: estudio.texto }, ...prev])
    setShowLibrary(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-4xl animate-spin">⟳</div>
    </div>
  )

  if (!apiKey) return <ApiKeySetup onSave={handleSaveKey} />

  return (
    <div className="min-h-screen" style={{ background: 'var(--navy)' }}>

      {/* ── TOP NAV ── */}
      <nav style={{
        background: 'var(--navy-card)', borderBottom: '1px solid var(--navy-border)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📜</span>
            <div>
              <h1 className="font-bold text-base leading-tight" style={{ color: 'var(--gold)', fontFamily: 'Crimson Pro, serif' }}>
                Estudio Bíblico Pro
              </h1>
              <p className="text-xs hidden sm:block" style={{ color: 'var(--text-dim)' }}>Exégesis académica con IA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" style={{ padding: '7px 10px' }} onClick={() => setShowLibrary(!showLibrary)}>
              <Library size={16} />
              <span className="hidden sm:inline text-xs">Biblioteca</span>
            </button>
            <button className="btn-secondary" style={{ padding: '7px 10px' }} onClick={() => setShowSettings(!showSettings)}>
              <Settings size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── SETTINGS PANEL ── */}
      {showSettings && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="card flex items-center justify-between gap-4 flex-wrap" style={{ animation: 'slideUp 0.3s ease-out' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>🔑 API Key activa</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                {apiKey.substring(0, 8)}{'•'.repeat(20)}
              </p>
            </div>
            <button className="btn-secondary" style={{ fontSize: 12 }}
              onClick={() => { setApiKey(''); setApiKeyState(null) }}>
              <X size={13} /> Cambiar API Key
            </button>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">

        {/* ══ SECCIÓN 1: ESTUDIO BÍBLICO PRO ══ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookIcon />
            <h2 className="font-bold text-lg" style={{ fontFamily: 'Crimson Pro, serif', color: 'var(--text-primary)' }}>
              📖 Estudio Bíblico Pro
            </h2>
          </div>

          <div className="card">
            <div className="flex gap-3 flex-col sm:flex-row">
              <input
                className="input-field flex-1"
                placeholder="Referencia bíblica (ej: Juan 3:16, Salmos 23:1-6)"
                value={citaInput}
                onChange={e => setCitaInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStudy()}
                disabled={estudyando}
              />
              <button
                className="btn-primary whitespace-nowrap"
                onClick={handleStudy}
                disabled={estudyando || !citaInput.trim()}
              >
                {estudyando
                  ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Analizando...</>
                  : <><Flame size={16} /> Estudiar</>
                }
              </button>
            </div>

            {/* Quick examples */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {EJEMPLOS_RAPIDOS.map(ej => (
                <button key={ej} className="tab-btn" style={{ fontSize: 11 }}
                  onClick={() => setCitaInput(ej)}>
                  {ej}
                </button>
              ))}
            </div>

            {errorExeg && (
              <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: '#7f1d1d33', color: '#ef4444', border: '1px solid #7f1d1d' }}>
                ⚠️ {errorExeg}
              </div>
            )}

            {/* Loading state */}
            {estudyando && (
              <div className="mt-4 space-y-3">
                {[90, 70, 80].map((w, i) => (
                  <div key={i} className="shimmer rounded-lg" style={{ height: 16, width: `${w}%` }} />
                ))}
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  ✨ Generando exégesis académica...
                </p>
              </div>
            )}
          </div>

          {/* Results */}
          {estudios.map((e, i) => (
            <StudySection
              key={`${e.cita}-${i}`}
              cita={e.cita}
              texto={e.texto}
              onClear={() => setEstudios(prev => prev.filter((_, idx) => idx !== i))}
            />
          ))}
        </section>

        {/* ══ SECCIÓN 2: ESTUDIO COMPARADO ══ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-bold text-lg" style={{ fontFamily: 'Crimson Pro, serif', color: 'var(--text-primary)' }}>
              ⚖️ Estudio Comparado
            </h2>
            <span style={{
              background: 'var(--gold)', color: 'var(--navy-card)',
              fontSize: 10, fontWeight: 700, padding: '2px 8px',
              borderRadius: 20, letterSpacing: 1,
            }}>NUEVO</span>
          </div>

          <div className="card">
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Compara dos pasajes con análisis teológico profundo
            </p>
            <div className="flex gap-3 flex-col sm:flex-row">
              <input className="input-field flex-1" placeholder="Pasaje A (ej: Juan 3:16)"
                value={cita1} onChange={e => setCita1(e.target.value)} disabled={comparando} />
              <input className="input-field flex-1" placeholder="Pasaje B (ej: Romanos 5:8)"
                value={cita2} onChange={e => setCita2(e.target.value)} disabled={comparando}
                onKeyDown={e => e.key === 'Enter' && handleCompare()} />
              <button className="btn-primary whitespace-nowrap" onClick={handleCompare}
                disabled={comparando || !cita1.trim() || !cita2.trim()}>
                {comparando
                  ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Comparando...</>
                  : <><Search size={15} /> Comparar</>
                }
              </button>
            </div>

            {/* Quick comparisons */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {COMP_RAPIDOS.map(([c1, c2]) => (
                <button key={`${c1}-${c2}`} className="tab-btn" style={{ fontSize: 11 }}
                  onClick={() => { setCita1(c1); setCita2(c2) }}>
                  {c1} vs {c2}
                </button>
              ))}
            </div>

            {errorComp && (
              <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: '#7f1d1d33', color: '#ef4444', border: '1px solid #7f1d1d' }}>
                ⚠️ {errorComp}
              </div>
            )}

            {comparando && (
              <div className="mt-4 space-y-3">
                {[85, 65, 75].map((w, i) => (
                  <div key={i} className="shimmer rounded-lg" style={{ height: 16, width: `${w}%` }} />
                ))}
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  🔍 Generando análisis comparativo...
                </p>
              </div>
            )}
          </div>

          {/* Comparative results */}
          {comparados.map((c, i) => (
            <ComparativeSection
              key={`${c.cita1}-${c.cita2}-${i}`}
              cita1={c.cita1}
              cita2={c.cita2}
              texto={c.texto}
            />
          ))}
        </section>

      </main>

      {/* ── LIBRARY SIDEBAR ── */}
      {showLibrary && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
            onClick={() => setShowLibrary(false)} />
          <LibrarySidebar
            onSelectEstudio={handleSelectFromLibrary}
            onSelectComparado={handleSelectComparadoFromLibrary}
            onClose={() => setShowLibrary(false)}
          />
        </>
      )}

      {/* ── FOOTER ── */}
      <footer className="text-center py-8 mt-8" style={{ borderTop: '1px solid var(--navy-border)', color: 'var(--text-dim)', fontSize: 12 }}>
        <p>📜 Estudio Bíblico Pro · Gratuito para todos</p>
        <p className="mt-1">Powered by Google Gemini · Tu API Key nunca sale de tu dispositivo</p>
      </footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

function BookIcon() {
  return null
}

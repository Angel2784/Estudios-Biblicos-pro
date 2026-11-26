// src/app/page.tsx
'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { BookOpen, Sparkles, Mic, Scale, CalendarDays, Users } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

// Componentes de Layout V2
import Sidebar, { TabType } from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import Footer from '@/components/layout/Footer'
import HeroBanner from '@/components/dashboard/HeroBanner'
import QuickActionCards from '@/components/dashboard/QuickActionCards'
import RecentStudies from '@/components/dashboard/RecentStudies'
import HistorialView from '@/components/dashboard/HistorialView'
import StatisticsWidget from '@/components/dashboard/StatisticsWidget'
import PremiumFeatureBanner from '@/components/dashboard/PremiumFeatureBanner'

// Componentes funcionales existentes y visualizaciones
import StudySection from '@/components/StudySection'
import ComparativeSection from '@/components/ComparativeSection'
import SermonSection from '@/components/SermonSection'
import LibrarySidebar from '@/components/LibrarySidebar'
import SettingsModal from '@/components/SettingsModal'
import PremiumModal from '@/components/PremiumModal'
import ThematicModal from '@/components/ThematicModal'
import TimelineViewer from '@/components/TimelineViewer'
import CharacterNetworkViewer from '@/components/CharacterNetworkViewer'

import {
  obtenerExegesisStream,
  obtenerComparadoStream,
  obtenerSermonStream,
  obtenerTimeline,
  obtenerArbolPersonajes,
  type EstiloSermon,
  type Timeline,
  type ArbolPersonajes,
  consultarLimite,
  onRestantesChange,
  onUsadasChange
} from '@/lib/gemini'

import {
  getApiKey,
  setUsuarioActual,
  agregarAlHistorial,
  type EstudioGuardado,
  type SermonGuardado,
  type HistorialItem
} from '@/lib/storage'

interface StudyResult  { id: string; cita: string; texto: string }
interface CompResult   { id: string; cita1: string; cita2: string; texto: string }
interface SermonResult { id: string; cita: string; texto: string; estilo: EstiloSermon }

const EJEMPLOS = ['Juan 3:16', 'Salmo 23', 'Romanos 8:28', 'Génesis 1:1']
const COMP_EJEMPLOS = [['Juan 3:16', 'Romanos 5:8'], ['Salmos 23', 'Juan 10:11'], ['Gálatas 2:20', 'Filipenses 1:21']]

let _uid = 0
const uid = () => String(++_uid)

export default function HomePage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('inicio')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  // Estados de Búsqueda Temática con IA
  const [thematicTopic, setThematicTopic] = useState('')
  const [showThematicModal, setShowThematicModal] = useState(false)

  const [restantes, setRestantes] = useState<number | null>(null)
  const [usadas, setUsadas] = useState<number | null>(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [esPremium, setEsPremium] = useState(false)
  const [apiKey, setApiKey] = useState('')

  // Estados de Estudio Bíblico
  const [citaInput, setCitaInput] = useState('')
  const [estudiando, setEstudiando] = useState(false)
  const [errorExeg, setErrorExeg] = useState('')
  const [estudios, setEstudios] = useState<StudyResult[]>([])

  // Estados de Comparación
  const [cita1, setCita1] = useState('')
  const [cita2, setCita2] = useState('')
  const [comparando, setComparando] = useState(false)
  const [errorComp, setErrorComp] = useState('')
  const [comparados, setComparados] = useState<CompResult[]>([])

  // Estados de Sermones
  const [citaSermon, setCitaSermon] = useState('')
  const [estiloSermon, setEstiloSermon] = useState<EstiloSermon>('expositivo')
  const [generandoSermon, setGenerandoSermon] = useState(false)
  const [errorSermon, setErrorSermon] = useState('')
  const [sermones, setSermones] = useState<SermonResult[]>([])

  // Estados de Línea de Tiempo
  const [citaTimeline, setCitaTimeline] = useState('')
  const [generandoTimeline, setGenerandoTimeline] = useState(false)
  const [errorTimeline, setErrorTimeline] = useState('')
  const [timelineData, setTimelineData] = useState<{ cita: string; data: Timeline } | null>(null)

  // Estados de Personajes Bíblicos
  const [citaPersonajes, setCitaPersonajes] = useState('')
  const [generandoPersonajes, setGenerandoPersonajes] = useState(false)
  const [errorPersonajes, setErrorPersonajes] = useState('')
  const [personajesData, setPersonajesData] = useState<{ cita: string; data: ArbolPersonajes } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setUsuarioActual(data.user?.id ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setUsuarioActual(session?.user?.id ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    const key = getApiKey()
    if (key) setApiKey(key)
    onRestantesChange(setRestantes)
    onUsadasChange(setUsadas)
    consultarLimite().then(d => {
      setRestantes(d.restantes)
      setUsadas(d.usadas ?? null)
      setEsAdmin(!!d.esAdmin)
      setEsPremium(!!d.esPremium)
    })

    const onFocus = () => {
      consultarLimite().then(d => {
        setRestantes(d.restantes)
        setUsadas(d.usadas ?? null)
        setEsAdmin(!!d.esAdmin)
        setEsPremium(!!d.esPremium)
      })
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [user])

  const checkErrorLimite = (err: unknown) => {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    if (msg.toLowerCase().includes('límite') || msg.toLowerCase().includes('premium') || msg.includes('429')) {
      setShowPremiumModal(true)
    }
    return msg
  }

  const checkUserAuth = () => {
    if (!user) {
      window.location.href = '/sign-in'
      return false
    }
    return true
  }

  // 1. Generar estudio (con streaming en tiempo real y registro en Historial)
  const handleStudy = async (citaParaEstudiar?: string) => {
    const targetCita = (citaParaEstudiar || citaInput).trim()
    if (!targetCita) return
    if (!checkUserAuth()) return
    setEstudiando(true)
    setErrorExeg('')

    const studyId = uid()
    // Mostramos la tarjeta de estudio inmediatamente para que el texto fluya en vivo
    setEstudios(prev => [{ id: studyId, cita: targetCita, texto: '' }, ...prev])

    try {
      let acumulado = ''
      const textoFinal = await obtenerExegesisStream(apiKey, targetCita, (_chunk, full) => {
        acumulado = full
        setEstudios(prev => prev.map(e => e.id === studyId ? { ...e, texto: full } : e))
      })

      // Se registra automáticamente en el HISTORIAL
      agregarAlHistorial({
        tipo: 'estudio',
        cita: targetCita,
        texto: acumulado || textoFinal,
        fecha: new Date().toISOString()
      })

      if (!citaParaEstudiar) setCitaInput('')
    } catch (err: unknown) {
      setEstudios(prev => prev.filter(e => e.id !== studyId || e.texto.length > 0))
      setErrorExeg(checkErrorLimite(err))
    } finally {
      setEstudiando(false)
    }
  }

  const handleStudyFromInicio = (cita?: string) => {
    setActiveTab('estudio')
    handleStudy(cita)
  }

  // 2. Generar comparación (con streaming en tiempo real)
  const handleCompare = async (c1?: string, c2?: string) => {
    const target1 = (c1 || cita1).trim()
    const target2 = (c2 || cita2).trim()
    if (!target1 || !target2) return
    if (!checkUserAuth()) return
    setComparando(true)
    setErrorComp('')

    const compId = uid()
    const citaCombinada = `${target1} vs ${target2}`
    setComparados(prev => [{ id: compId, cita1: target1, cita2: target2, texto: '' }, ...prev])

    try {
      let acumulado = ''
      const textoFinal = await obtenerComparadoStream(apiKey, target1, target2, (_chunk, full) => {
        acumulado = full
        setComparados(prev => prev.map(e => e.id === compId ? { ...e, texto: full } : e))
      })

      // Se registra automáticamente en el HISTORIAL
      agregarAlHistorial({
        tipo: 'comparado',
        cita: citaCombinada,
        texto: acumulado || textoFinal,
        fecha: new Date().toISOString()
      })

      if (!c1) { setCita1(''); setCita2('') }
    } catch (err: unknown) {
      setComparados(prev => prev.filter(e => e.id !== compId || e.texto.length > 0))
      setErrorComp(checkErrorLimite(err))
    } finally {
      setComparando(false)
    }
  }

  // 3. Generar sermón (con streaming en tiempo real)
  const handleSermon = async (citaParam?: string) => {
    const targetCita = (citaParam || citaSermon).trim()
    if (!targetCita) return
    if (!checkUserAuth()) return
    setGenerandoSermon(true)
    setErrorSermon('')

    const sermonId = uid()
    setSermones(prev => [{ id: sermonId, cita: targetCita, texto: '', estilo: estiloSermon }, ...prev])

    try {
      let acumulado = ''
      const textoFinal = await obtenerSermonStream(apiKey, targetCita, estiloSermon, (_chunk, full) => {
        acumulado = full
        setSermones(prev => prev.map(e => e.id === sermonId ? { ...e, texto: full } : e))
      })

      // Se registra automáticamente en el HISTORIAL
      agregarAlHistorial({
        tipo: 'sermon',
        cita: targetCita,
        texto: acumulado || textoFinal,
        fecha: new Date().toISOString(),
        extra: estiloSermon
      })

      if (!citaParam) setCitaSermon('')
    } catch (err: unknown) {
      setSermones(prev => prev.filter(e => e.id !== sermonId || e.texto.length > 0))
      setErrorSermon(checkErrorLimite(err))
    } finally {
      setGenerandoSermon(false)
    }
  }

  // 4. Generar Línea de Tiempo interactiva
  const handleTimeline = async (citaParam?: string) => {
    const target = (citaParam || citaTimeline).trim()
    if (!target) return
    if (!checkUserAuth()) return
    setGenerandoTimeline(true)
    setErrorTimeline('')
    try {
      const res = await obtenerTimeline(apiKey, target)
      setTimelineData({ cita: target, data: res })
      if (!citaParam) setCitaTimeline('')
    } catch (err: unknown) {
      setErrorTimeline(checkErrorLimite(err))
    } finally {
      setGenerandoTimeline(false)
    }
  }

  // 5. Generar Red de Personajes Bíblicos
  const handlePersonajes = async (citaParam?: string) => {
    const target = (citaParam || citaPersonajes).trim()
    if (!target) return
    if (!checkUserAuth()) return
    setGenerandoPersonajes(true)
    setErrorPersonajes('')
    try {
      const res = await obtenerArbolPersonajes(apiKey, target)
      setPersonajesData({ cita: target, data: res })
      if (!citaParam) setCitaPersonajes('')
    } catch (err: unknown) {
      setErrorPersonajes(checkErrorLimite(err))
    } finally {
      setGenerandoPersonajes(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-gray-100">
      <Topbar
        user={user}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenPremium={() => setShowPremiumModal(true)}
        restantes={restantes}
        usadas={usadas}
        esPremium={esPremium}
        esAdmin={esAdmin}
        onSelectSavedStudy={(estudio) => {
          setEstudios(prev => [{ id: uid(), cita: estudio.cita, texto: estudio.texto }, ...prev])
          setActiveTab('estudio')
        }}
        onGenerateStudy={(citaOTema) => {
          setCitaInput(citaOTema)
          handleStudyFromInicio(citaOTema)
        }}
        onThematicSearch={(topic) => {
          setThematicTopic(topic)
          setShowThematicModal(true)
        }}
      />

      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={() => setShowSettings(true)}
        onOpenPremium={() => setShowPremiumModal(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        esPremium={esPremium}
      />

      <div className="lg:pl-64 pt-16 flex flex-col min-h-screen">
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">

          {/* VISTA: INICIO */}
          {activeTab === 'inicio' && (
            <>
              <HeroBanner />
              <QuickActionCards onSelectTab={setActiveTab} />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                  <div className="p-6 rounded-2xl bg-[#111520] border border-[#202738] shadow-lg">
                    <div className="flex items-center gap-2.5 mb-2">
                      <BookOpen className="w-5 h-5 text-[#d4a029]" />
                      <h2 className="font-semibold text-lg text-white">Estudio Bíblico</h2>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">Explora la Palabra de Dios con profundidad</p>

                    <label className="block text-xs font-medium text-gray-300 mb-2">
                      Versículo o referencia bíblica
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Ej: Juan 3:16, Salmo 23, Génesis 1:1"
                        value={citaInput}
                        onChange={(e) => setCitaInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleStudyFromInicio()}
                        className="flex-1 px-4 py-3 bg-[#171c2b] border border-[#262f44] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#d4a029]/60 focus:ring-1 focus:ring-[#d4a029]"
                      />
                      <button
                        onClick={() => handleStudyFromInicio()}
                        disabled={estudiando}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#e0b042] to-[#b3831b] text-black font-semibold text-sm hover:brightness-110 active:scale-98 transition-all shadow-md shadow-[#d4a029]/20 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                      >
                        {estudiando ? (
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Generar Estudio</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <span className="text-xs text-gray-500">Ejemplos:</span>
                      {EJEMPLOS.map((ej) => (
                        <button
                          key={ej}
                          onClick={() => {
                            setCitaInput(ej)
                            handleStudyFromInicio(ej)
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#171c2b] hover:bg-[#22293d] border border-[#242c3f] text-xs text-gray-300 transition-colors"
                        >
                          {ej}
                        </button>
                      ))}
                    </div>

                    {errorExeg && (
                      <p className="mt-3 text-xs text-red-400 bg-red-950/30 p-3 rounded-xl border border-red-900/40">
                        {errorExeg}
                      </p>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <RecentStudies
                    onSelectTab={setActiveTab}
                    onSelectStudy={(cita) => {
                      setCitaInput(cita)
                      handleStudyFromInicio(cita)
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                  <PremiumFeatureBanner
                    onOpenPremium={() => setShowPremiumModal(true)}
                    esPremium={esPremium}
                  />
                </div>
                <div className="lg:col-span-4">
                  <StatisticsWidget />
                </div>
              </div>
            </>
          )}

          {/* VISTA: ESTUDIO BÍBLICO */}
          {activeTab === 'estudio' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#111520] border border-[#202738] shadow-lg">
                <div className="flex items-center gap-2.5 mb-2">
                  <BookOpen className="w-5 h-5 text-[#d4a029]" />
                  <h2 className="font-semibold text-lg text-white">Estudio Bíblico</h2>
                </div>
                <p className="text-xs text-gray-400 mb-4">Explora la Palabra de Dios con profundidad</p>

                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Versículo o referencia bíblica
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Ej: Juan 3:16, Salmo 23, Génesis 1:1"
                    value={citaInput}
                    onChange={(e) => setCitaInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStudy()}
                    className="flex-1 px-4 py-3 bg-[#171c2b] border border-[#262f44] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#d4a029]/60 focus:ring-1 focus:ring-[#d4a029]"
                  />
                  <button
                    onClick={() => handleStudy()}
                    disabled={estudiando}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#e0b042] to-[#b3831b] text-black font-semibold text-sm hover:brightness-110 active:scale-98 transition-all shadow-md shadow-[#d4a029]/20 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                  >
                    {estudiando ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generar Estudio</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="text-xs text-gray-500">Ejemplos:</span>
                  {EJEMPLOS.map((ej) => (
                    <button
                      key={ej}
                      onClick={() => {
                        setCitaInput(ej)
                        handleStudy(ej)
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#171c2b] hover:bg-[#22293d] border border-[#242c3f] text-xs text-gray-300 transition-colors"
                    >
                      {ej}
                    </button>
                  ))}
                </div>

                {errorExeg && (
                  <p className="mt-3 text-xs text-red-400 bg-red-950/30 p-3 rounded-xl border border-red-900/40">
                    {errorExeg}
                  </p>
                )}
              </div>
              {estudios.length > 0 && (
                <div className="space-y-4">
                  {estudios.map((est) => (
                    <StudySection
                      key={est.id}
                      cita={est.cita}
                      texto={est.texto}
                      apiKey={apiKey}
                      onClear={() => setEstudios(prev => prev.filter(e => e.id !== est.id))}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VISTA: COMPARACIÓN */}
          {activeTab === 'comparacion' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#111520] border border-[#202738] shadow-lg">
                <div className="flex items-center gap-2.5 mb-2">
                  <Scale className="w-5 h-5 text-[#d4a029]" />
                  <h2 className="font-semibold text-lg text-white">Estudio Comparado</h2>
                </div>
                <p className="text-xs text-gray-400 mb-4">Compara y analiza dos pasajes bíblicos en paralelo</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Pasaje Principal (A)</label>
                    <input
                      type="text"
                      placeholder="Ej: Juan 3:16"
                      value={cita1}
                      onChange={(e) => setCita1(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
                      className="w-full px-4 py-3 bg-[#171c2b] border border-[#262f44] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#d4a029]/60 focus:ring-1 focus:ring-[#d4a029]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Pasaje Comparativo (B)</label>
                    <input
                      type="text"
                      placeholder="Ej: Romanos 5:8"
                      value={cita2}
                      onChange={(e) => setCita2(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
                      className="w-full px-4 py-3 bg-[#171c2b] border border-[#262f44] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#d4a029]/60 focus:ring-1 focus:ring-[#d4a029]"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-500">Ejemplos:</span>
                    {COMP_EJEMPLOS.map(([ej1, ej2], idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCita1(ej1)
                          setCita2(ej2)
                          handleCompare(ej1, ej2)
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#171c2b] hover:bg-[#22293d] border border-[#242c3f] text-xs text-gray-300 transition-colors"
                      >
                        {ej1} vs {ej2}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleCompare()}
                    disabled={comparando}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#e0b042] to-[#b3831b] text-black font-semibold text-sm hover:brightness-110 active:scale-98 transition-all shadow-md shadow-[#d4a029]/20 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    {comparando ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Scale className="w-4 h-4" />
                        <span>Comparar Pasajes</span>
                      </>
                    )}
                  </button>
                </div>

                {errorComp && (
                  <p className="mt-3 text-xs text-red-400 bg-red-950/30 p-3 rounded-xl border border-red-900/40">
                    {errorComp}
                  </p>
                )}
              </div>

              {comparados.map((c) => (
                <ComparativeSection
                  key={c.id}
                  cita1={c.cita1}
                  cita2={c.cita2}
                  texto={c.texto}
                  apiKey={apiKey}
                  onRemove={() => setComparados(prev => prev.filter(x => x.id !== c.id))}
                />
              ))}
            </div>
          )}

          {/* VISTA: SERMONES */}
          {activeTab === 'sermones' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#111520] border border-[#202738] shadow-lg">
                <div className="flex items-center gap-2.5 mb-2">
                  <Mic className="w-5 h-5 text-[#d4a029]" />
                  <h2 className="font-semibold text-lg text-white">Generador de Sermones</h2>
                </div>
                <p className="text-xs text-gray-400 mb-4">Prepara un sermón o devocional a partir de un pasaje bíblico</p>

                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => setEstiloSermon('expositivo')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                      estiloSermon === 'expositivo'
                        ? 'bg-[#2e230a] text-[#f5cf6d] border-[#d4a029]'
                        : 'bg-[#171c2b] text-gray-400 border-[#262f44]'
                    }`}
                  >
                    Sermón Expositivo
                  </button>
                  <button
                    onClick={() => setEstiloSermon('devocional')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                      estiloSermon === 'devocional'
                        ? 'bg-[#2e230a] text-[#f5cf6d] border-[#d4a029]'
                        : 'bg-[#171c2b] text-gray-400 border-[#262f44]'
                    }`}
                  >
                    Devocional Breve
                  </button>
                </div>

                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Pasaje bíblico
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Ej: Juan 3:16, Salmo 23, Génesis 1:1"
                    value={citaSermon}
                    onChange={(e) => setCitaSermon(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSermon()}
                    className="flex-1 px-4 py-3 bg-[#171c2b] border border-[#262f44] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#d4a029]/60 focus:ring-1 focus:ring-[#d4a029]"
                  />
                  <button
                    onClick={() => handleSermon()}
                    disabled={generandoSermon}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#e0b042] to-[#b3831b] text-black font-semibold text-sm hover:brightness-110 active:scale-98 transition-all shadow-md shadow-[#d4a029]/20 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                  >
                    {generandoSermon ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generar Sermón</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="text-xs text-gray-500">Ejemplos:</span>
                  {EJEMPLOS.map((ej) => (
                    <button
                      key={ej}
                      onClick={() => {
                        setCitaSermon(ej)
                        handleSermon(ej)
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#171c2b] hover:bg-[#22293d] border border-[#242c3f] text-xs text-gray-300 transition-colors"
                    >
                      {ej}
                    </button>
                  ))}
                </div>

                {errorSermon && (
                  <p className="mt-3 text-xs text-red-400 bg-red-950/30 p-3 rounded-xl border border-red-900/40">
                    {errorSermon}
                  </p>
                )}
              </div>

              {sermones.map((s) => (
                <SermonSection
                  key={s.id}
                  cita={s.cita}
                  texto={s.texto}
                  estilo={s.estilo}
                  onRemove={() => setSermones(prev => prev.filter(x => x.id !== s.id))}
                />
              ))}
            </div>
          )}

          {/* VISTA: LÍNEA DE TIEMPO */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#111520] border border-[#202738] shadow-lg">
                <div className="flex items-center gap-2.5 mb-2">
                  <CalendarDays className="w-5 h-5 text-[#d4a029]" />
                  <h2 className="font-semibold text-lg text-white">Línea de Tiempo Histórica y Profética</h2>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  Explora la cronología bíblica, los períodos de la historia sagrada y el cumplimiento de profecías
                </p>

                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Libro, pasaje o evento bíblico
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Ej: Génesis, Éxodo 1-14, Juan 3, David y Goliat, Apocalipsis"
                    value={citaTimeline}
                    onChange={(e) => setCitaTimeline(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTimeline()}
                    className="flex-1 px-4 py-3 bg-[#171c2b] border border-[#262f44] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#d4a029]/60 focus:ring-1 focus:ring-[#d4a029]"
                  />
                  <button
                    onClick={() => handleTimeline()}
                    disabled={generandoTimeline}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#e0b042] to-[#b3831b] text-black font-semibold text-sm hover:brightness-110 active:scale-98 transition-all shadow-md shadow-[#d4a029]/20 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    {generandoTimeline ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CalendarDays className="w-4 h-4" />
                        <span>Generar Cronología</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="text-xs text-gray-500">Ejemplos:</span>
                  {['Génesis', 'Éxodo 1-15', '1 Samuel 17', 'Ministerio de Jesús', 'Hechos de los Apóstoles'].map((ej) => (
                    <button
                      key={ej}
                      onClick={() => {
                        setCitaTimeline(ej)
                        handleTimeline(ej)
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#171c2b] hover:bg-[#22293d] border border-[#242c3f] text-xs text-gray-300 transition-colors"
                    >
                      {ej}
                    </button>
                  ))}
                </div>

                {errorTimeline && (
                  <p className="mt-3 text-xs text-red-400 bg-red-950/30 p-3 rounded-xl border border-red-900/40">
                    {errorTimeline}
                  </p>
                )}
              </div>

              {timelineData && (
                <TimelineViewer timeline={timelineData.data} cita={timelineData.cita} />
              )}
            </div>
          )}

          {/* VISTA: RED DE PERSONAJES */}
          {activeTab === 'personajes' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#111520] border border-[#202738] shadow-lg">
                <div className="flex items-center gap-2.5 mb-2">
                  <Users className="w-5 h-5 text-[#d4a029]" />
                  <h2 className="font-semibold text-lg text-white">Red y Árbol de Personajes Bíblicos</h2>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  Identifica todas las personas, sus roles, genealogías, relaciones y atributos teológicos en la Escritura
                </p>

                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Pasaje o historia bíblica
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Ej: Génesis 37 (José), Juan 3 (Nicodemo), Rut, Lucas 1-2"
                    value={citaPersonajes}
                    onChange={(e) => setCitaPersonajes(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePersonajes()}
                    className="flex-1 px-4 py-3 bg-[#171c2b] border border-[#262f44] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#d4a029]/60 focus:ring-1 focus:ring-[#d4a029]"
                  />
                  <button
                    onClick={() => handlePersonajes()}
                    disabled={generandoPersonajes}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#e0b042] to-[#b3831b] text-black font-semibold text-sm hover:brightness-110 active:scale-98 transition-all shadow-md shadow-[#d4a029]/20 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    {generandoPersonajes ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        <span>Analizar Personajes</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="text-xs text-gray-500">Ejemplos:</span>
                  {['Juan 3', 'Génesis 37', '1 Samuel 17', 'Rut 1-4', 'Lucas 10:25-37'].map((ej) => (
                    <button
                      key={ej}
                      onClick={() => {
                        setCitaPersonajes(ej)
                        handlePersonajes(ej)
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#171c2b] hover:bg-[#22293d] border border-[#242c3f] text-xs text-gray-300 transition-colors"
                    >
                      {ej}
                    </button>
                  ))}
                </div>

                {errorPersonajes && (
                  <p className="mt-3 text-xs text-red-400 bg-red-950/30 p-3 rounded-xl border border-red-900/40">
                    {errorPersonajes}
                  </p>
                )}
              </div>

              {personajesData && (
                <CharacterNetworkViewer data={personajesData.data} cita={personajesData.cita} />
              )}
            </div>
          )}

          {/* VISTA: HISTORIAL (Lee del Historial automático) */}
          {activeTab === 'historial' && (
            <HistorialView
              onSelectEstudio={(e: EstudioGuardado) => {
                setEstudios(prev => [{ id: uid(), cita: e.cita, texto: e.texto }, ...prev])
                setActiveTab('estudio')
              }}
              onSelectComparado={(e: EstudioGuardado) => {
                const [c1 = '', c2 = ''] = (e.cita || '').split(' vs ')
                setComparados(prev => [{ id: uid(), cita1: c1, cita2: c2, texto: e.texto }, ...prev])
                setActiveTab('comparacion')
              }}
              onSelectSermon={(s: SermonGuardado) => {
                setSermones(prev => [{ id: uid(), cita: s.cita, texto: s.texto, estilo: s.estilo as EstiloSermon }, ...prev])
                setActiveTab('sermones')
              }}
            />
          )}

          {/* VISTA: BIBLIOTECA (Solo estudios guardados explícitamente) */}
          {activeTab === 'biblioteca' && (
            <LibrarySidebar
              onClose={() => setActiveTab('inicio')}
              onSelectEstudio={(e: EstudioGuardado) => {
                setEstudios(prev => [{ id: uid(), cita: e.cita, texto: e.texto }, ...prev])
                setActiveTab('estudio')
              }}
              onSelectComparado={(e: EstudioGuardado) => {
                const [c1 = '', c2 = ''] = (e.cita || '').split(' vs ')
                setComparados(prev => [{ id: uid(), cita1: c1, cita2: c2, texto: e.texto }, ...prev])
                setActiveTab('comparacion')
              }}
              onSelectSermon={(s: SermonGuardado) => {
                setSermones(prev => [{ id: uid(), cita: s.cita, texto: s.texto, estilo: s.estilo as EstiloSermon }, ...prev])
                setActiveTab('sermones')
              }}
            />
          )}
        </main>

        <Footer />
      </div>

      {/* Modales */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        restantes={restantes}
        esAdmin={esAdmin}
        esPremium={esPremium}
      />
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
      <ThematicModal
        isOpen={showThematicModal}
        topic={thematicTopic}
        onClose={() => setShowThematicModal(false)}
        onSelectPassage={(cita) => {
          setCitaInput(cita)
          handleStudyFromInicio(cita)
        }}
      />
    </div>
  )
}

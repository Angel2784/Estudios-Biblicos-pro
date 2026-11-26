'use client'
import React, { useState, useMemo } from 'react'
import {
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  CheckCircle2,
  Bookmark
} from 'lucide-react'
import type { Timeline, EventoTimeline, PeriodoBiblico } from '@/lib/gemini'

interface TimelineViewerProps {
  timeline: Timeline
  cita?: string
}

const TIPO_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  principal: {
    label: 'Evento Clave',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: '#d4a029',
  },
  cumplimiento: {
    label: 'Cumplimiento',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: '#10b981',
  },
  profecia: {
    label: 'Profecía',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    dot: '#a855f7',
  },
  contexto: {
    label: 'Contexto Histórico',
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    dot: '#38bdf8',
  },
}

export default function TimelineViewer({ timeline, cita }: TimelineViewerProps) {
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<string>('todos')
  const [selectedTipo, setSelectedTipo] = useState<string>('todos')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string) => {
    setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Filtrado de eventos
  const eventosFiltrados = useMemo(() => {
    if (!timeline?.eventos) return []
    return timeline.eventos.filter((ev) => {
      const matchPeriodo =
        selectedPeriodoId === 'todos' || ev.periodoBiblicoId === selectedPeriodoId
      const matchTipo = selectedTipo === 'todos' || ev.tipo === selectedTipo
      const q = searchTerm.toLowerCase().trim()
      const matchSearch =
        !q ||
        ev.titulo.toLowerCase().includes(q) ||
        ev.descripcion.toLowerCase().includes(q) ||
        ev.lugarGeografico?.toLowerCase().includes(q) ||
        ev.personajesInvolucrados?.some((p) => p.toLowerCase().includes(q))
      return matchPeriodo && matchTipo && matchSearch
    })
  }, [timeline?.eventos, selectedPeriodoId, selectedTipo, searchTerm])

  const periodos = timeline?.periodos || []

  return (
    <div className="space-y-6">
      {/* Encabezado General */}
      <div className="rounded-2xl border border-[#202738] bg-[#111520] p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#2a210d] p-3 text-[#d4a029]">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#d4a029]">
              {cita ? `Cronología Bíblica: ${cita}` : 'Línea de Tiempo Histórica'}
            </span>
            <h2 className="text-xl font-bold text-white">{timeline.periodoGeneral}</h2>
          </div>
        </div>

        {timeline.contextoHistorico && (
          <p className="mt-4 text-sm leading-relaxed text-gray-300 border-l-2 border-[#d4a029]/40 pl-4 bg-[#141926]/50 py-2 rounded-r-xl">
            {timeline.contextoHistorico}
          </p>
        )}

        {/* Períodos Bíblicos */}
        {periodos.length > 0 && (
          <div className="mt-6 pt-5 border-t border-[#1e2538]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 text-[#d4a029]" />
              Períodos y Eras Históricas
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedPeriodoId('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  selectedPeriodoId === 'todos'
                    ? 'bg-[#d4a029] text-black font-semibold shadow-md'
                    : 'bg-[#181e2e] text-gray-400 hover:text-white border border-[#242e44]'
                }`}
              >
                Todos los períodos ({timeline.eventos?.length || 0})
              </button>
              {periodos.map((per) => {
                const count = timeline.eventos?.filter(
                  (e) => e.periodoBiblicoId === per.id
                ).length
                const isActive = selectedPeriodoId === per.id
                return (
                  <button
                    key={per.id}
                    onClick={() => setSelectedPeriodoId(per.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
                      isActive
                        ? 'border-[#d4a029] bg-[#2d2209] text-[#f5cf6d]'
                        : 'border-[#242e44] bg-[#141824] text-gray-300 hover:bg-[#1a2030]'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: per.color || '#d4a029' }}
                    />
                    <span>{per.nombre}</span>
                    <span className="text-[10px] text-gray-500">
                      ({per.fechaInicio} - {per.fechaFin})
                    </span>
                    {typeof count === 'number' && (
                      <span className="ml-1 rounded-full bg-[#1e2538] px-1.5 py-0.5 text-[10px] text-gray-400">
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Controles y Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar eventos, lugares, personajes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#121622] border border-[#202738] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4a029]"
          />
        </div>

        {/* Filtro por tipo de evento */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0 mr-1">
            <Filter className="h-3 w-3" /> Tipo:
          </span>
          {['todos', 'principal', 'cumplimiento', 'profecia', 'contexto'].map((tipo) => {
            const isCurrent = selectedTipo === tipo
            return (
              <button
                key={tipo}
                onClick={() => setSelectedTipo(tipo)}
                className={`px-2.5 py-1.5 rounded-lg text-xs capitalize whitespace-nowrap transition ${
                  isCurrent
                    ? 'bg-[#d4a029]/20 text-[#f5cf6d] border border-[#d4a029]/50 font-medium'
                    : 'bg-[#121622] text-gray-400 border border-[#202738] hover:text-white'
                }`}
              >
                {tipo === 'todos' ? 'Todos' : TIPO_CONFIG[tipo]?.label || tipo}
              </button>
            )
          })}
        </div>
      </div>

      {/* Lista / Timeline Vertical */}
      {eventosFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-[#202738] bg-[#111520] p-12 text-center text-gray-400">
          <Clock3 className="h-10 w-10 mx-auto text-gray-600 mb-2" />
          <p className="text-sm font-medium">No se encontraron eventos con los filtros seleccionados.</p>
          <button
            onClick={() => {
              setSelectedPeriodoId('todos')
              setSelectedTipo('todos')
              setSearchTerm('')
            }}
            className="mt-3 text-xs text-[#d4a029] hover:underline font-semibold"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-10 space-y-6 before:absolute before:bottom-0 before:left-3 sm:before:left-5 before:top-2 before:w-0.5 before:bg-gradient-to-b before:from-[#d4a029] before:via-[#3b4766] before:to-transparent">
          {eventosFiltrados.map((ev, index) => {
            const conf = TIPO_CONFIG[ev.tipo] || TIPO_CONFIG.principal
            const isExpanded = !!expandedEvents[ev.id]
            const periodo = periodos.find((p) => p.id === ev.periodoBiblicoId)

            return (
              <div key={ev.id || index} className="relative group">
                {/* Indicador en la línea */}
                <div
                  className="absolute -left-6 sm:-left-10 top-4 h-4 w-4 rounded-full border-2 border-[#0a0d14] shadow-md transition-transform group-hover:scale-125"
                  style={{ backgroundColor: conf.dot }}
                />

                {/* Tarjeta del evento */}
                <div className="rounded-2xl border border-[#202738] bg-[#111520] transition-all hover:border-[#d4a029]/50 hover:bg-[#131926] shadow-md overflow-hidden">
                  <div
                    onClick={() => toggleExpand(ev.id)}
                    className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl" role="img" aria-label="emoji">
                          {ev.emoji || '📜'}
                        </span>
                        <h4 className="text-base font-semibold text-white group-hover:text-[#f5cf6d] transition-colors">
                          {ev.titulo}
                        </h4>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${conf.bg} ${conf.text} ${conf.border}`}
                        >
                          {conf.label}
                        </span>
                        {periodo && (
                          <span className="text-[11px] text-gray-400 bg-[#171c2a] px-2 py-0.5 rounded-md border border-[#202738]">
                            {periodo.nombre}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-300 leading-relaxed pt-1">
                        {ev.descripcion}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1a2030]">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#d4a029] bg-[#29200c] px-3 py-1 rounded-lg border border-[#d4a029]/30">
                        <Clock3 className="h-3 w-3" />
                        {ev.fecha}
                      </div>
                      <div className="text-gray-400 hover:text-white">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sección expandida */}
                  {isExpanded && (
                    <div className="border-t border-[#1d2436] bg-[#0c0f18] p-5 space-y-4 text-xs">
                      {ev.detalles && (
                        <div>
                          <span className="font-semibold text-gray-300 block mb-1">
                            Análisis Detallado:
                          </span>
                          <p className="text-gray-400 leading-relaxed">
                            {ev.detalles}
                          </p>
                        </div>
                      )}

                      {ev.importanciaTeologica && (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-amber-200">
                          <span className="font-semibold block mb-1 text-amber-300 flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" /> Importancia Teológica:
                          </span>
                          <p className="text-amber-100/90 leading-relaxed">
                            {ev.importanciaTeologica}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        {ev.lugarGeografico && (
                          <div className="flex items-start gap-2 bg-[#141926] p-2.5 rounded-xl border border-[#1e2538]">
                            <MapPin className="h-4 w-4 text-[#d4a029] shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                                Lugar Bíblico
                              </span>
                              <span className="text-gray-200 font-medium">
                                {ev.lugarGeografico}
                              </span>
                            </div>
                          </div>
                        )}

                        {ev.personajesInvolucrados?.length > 0 && (
                          <div className="flex items-start gap-2 bg-[#141926] p-2.5 rounded-xl border border-[#1e2538]">
                            <Users className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                                Personajes
                              </span>
                              <span className="text-gray-200 font-medium">
                                {ev.personajesInvolucrados.join(', ')}
                              </span>
                            </div>
                          </div>
                        )}

                        {ev.referenciasBiblicas?.length > 0 && (
                          <div className="flex items-start gap-2 bg-[#141926] p-2.5 rounded-xl border border-[#1e2538]">
                            <BookOpen className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                                Citas
                              </span>
                              <span className="text-gray-200 font-medium">
                                {ev.referenciasBiblicas.join(', ')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

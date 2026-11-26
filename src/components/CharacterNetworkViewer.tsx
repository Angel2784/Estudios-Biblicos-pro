'use client'
import React, { useState, useMemo } from 'react'
import {
  Users,
  Search,
  BookOpen,
  Tag,
  ArrowRight,
  Sparkles,
  ChevronRight,
  LayoutGrid,
  GitFork,
  X,
  ExternalLink
} from 'lucide-react'
import type { ArbolPersonajes, PersonajeBiblico } from '@/lib/gemini'

interface CharacterNetworkViewerProps {
  data: ArbolPersonajes
  cita?: string
}

const ROL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Protagonista': { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  'Figura Divina': { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
  'Discípulo': { bg: 'bg-sky-500/15', text: 'text-sky-300', border: 'border-sky-500/30' },
  'Profeta': { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  'Testigo': { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  'Antagonista': { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
  'Grupo': { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30' },
  'Mencionado': { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' },
}

export default function CharacterNetworkViewer({ data, cita }: CharacterNetworkViewerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRol, setSelectedRol] = useState<string>('todos')
  const [selectedPersonaje, setSelectedPersonaje] = useState<PersonajeBiblico | null>(null)
  const [vista, setVista] = useState<'red' | 'grid'>('red')

  const personajes = data?.personajes || []

  // Mapa de personajes para acceso rápido por ID
  const mapPersonajes = useMemo(() => {
    const map = new Map<string, PersonajeBiblico>()
    personajes.forEach((p) => map.set(p.id, p))
    return map
  }, [personajes])

  // Roles únicos
  const roles = useMemo(() => {
    const set = new Set<string>()
    personajes.forEach((p) => p.rol && set.add(p.rol))
    return Array.from(set)
  }, [personajes])

  // Personajes filtrados
  const personajesFiltrados = useMemo(() => {
    return personajes.filter((p) => {
      const matchRol = selectedRol === 'todos' || p.rol === selectedRol
      const q = searchTerm.toLowerCase().trim()
      const matchSearch =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.descripcionBreve.toLowerCase().includes(q) ||
        p.atributos?.some((a) => a.toLowerCase().includes(q)) ||
        p.versiculosAparece?.some((v) => v.toLowerCase().includes(q))
      return matchRol && matchSearch
    })
  }, [personajes, selectedRol, searchTerm])

  const confDefault = { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' }

  return (
    <div className="space-y-6">
      {/* Encabezado General */}
      <div className="rounded-2xl border border-[#202738] bg-[#111520] p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#2a210d] p-3 text-[#d4a029]">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#d4a029]">
                {cita ? `Red de Personajes: ${cita}` : 'Personajes y Relaciones Bíblicas'}
              </span>
              <h2 className="text-xl font-bold text-white">
                {data.totalPersonajes} Personaje{data.totalPersonajes !== 1 ? 's' : ''} Identificados
              </h2>
            </div>
          </div>

          {/* Selector de Vista */}
          <div className="flex items-center gap-1 rounded-xl bg-[#090c14] p-1 border border-[#1e2538]">
            <button
              onClick={() => setVista('red')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                vista === 'red'
                  ? 'bg-[#d4a029] text-black font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <GitFork className="h-3.5 w-3.5" />
              Red y Relaciones
            </button>
            <button
              onClick={() => setVista('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                vista === 'grid'
                  ? 'bg-[#d4a029] text-black font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Tarjetas
            </button>
          </div>
        </div>

        {data.contexto && (
          <p className="mt-4 text-sm text-gray-300 leading-relaxed border-l-2 border-[#d4a029]/40 pl-4 bg-[#141926]/40 py-2 rounded-r-xl">
            {data.contexto}
          </p>
        )}
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, atributo o versículo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#121622] border border-[#202738] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4a029]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedRol('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition ${
              selectedRol === 'todos'
                ? 'bg-[#d4a029] text-black font-semibold'
                : 'bg-[#121622] text-gray-400 border border-[#202738] hover:text-white'
            }`}
          >
            Todos ({personajes.length})
          </button>
          {roles.map((rol) => {
            const isCurrent = selectedRol === rol
            const count = personajes.filter((p) => p.rol === rol).length
            return (
              <button
                key={rol}
                onClick={() => setSelectedRol(rol)}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition border ${
                  isCurrent
                    ? 'border-[#d4a029] bg-[#29200c] text-[#f5cf6d] font-medium'
                    : 'border-[#202738] bg-[#121622] text-gray-400 hover:text-white'
                }`}
              >
                {rol} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* VISTA 1: RED Y RELACIONES INTERACTIVAS */}
      {vista === 'red' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personajesFiltrados.map((p) => {
              const conf = ROL_COLORS[p.rol] || confDefault
              const relaciones = p.relaciones || []
              const isSelected = selectedPersonaje?.id === p.id

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPersonaje(p)}
                  className={`rounded-2xl border bg-[#111520] p-5 cursor-pointer transition-all hover:bg-[#151c2a] flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#d4a029] ring-2 ring-[#d4a029]/20'
                      : 'border-[#202738] hover:border-[#d4a029]/50'
                  }`}
                >
                  <div>
                    {/* Header Tarjeta */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl rounded-xl bg-[#171d2b] p-2 border border-[#222a3d]">
                          {p.emoji || '👤'}
                        </span>
                        <div>
                          <h3 className="font-bold text-white text-base hover:text-[#f5cf6d]">
                            {p.nombre}
                          </h3>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold border ${conf.bg} ${conf.text} ${conf.border}`}
                          >
                            {p.rol}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed mb-3">
                      {p.descripcionBreve}
                    </p>

                    {/* Atributos */}
                    {p.atributos?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {p.atributos.slice(0, 3).map((at) => (
                          <span
                            key={at}
                            className="text-[10px] bg-[#171d2b] text-gray-400 px-2 py-0.5 rounded-md border border-[#21293c]"
                          >
                            {at}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Relaciones con otros personajes */}
                  <div className="pt-3 border-t border-[#1c2334]">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-2">
                      Conexiones ({relaciones.length})
                    </span>
                    {relaciones.length === 0 ? (
                      <span className="text-[11px] text-gray-500 italic">Sin conexiones directas</span>
                    ) : (
                      <div className="space-y-1.5">
                        {relaciones.slice(0, 2).map((rel, idx) => {
                          const target = mapPersonajes.get(rel.targetId)
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs bg-[#151a27] px-2.5 py-1.5 rounded-lg border border-[#202738]"
                            >
                              <span className="text-[#d4a029] font-medium text-[11px]">
                                {rel.tipo}
                              </span>
                              <span className="text-gray-300 font-semibold flex items-center gap-1">
                                <ArrowRight className="h-3 w-3 text-gray-500" />
                                {target?.emoji || '👤'} {target?.nombre || rel.targetId}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* VISTA 2: TARJETAS COMPLETAS */}
      {vista === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personajesFiltrados.map((p) => {
            const conf = ROL_COLORS[p.rol] || confDefault
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPersonaje(p)}
                className="rounded-2xl border border-[#202738] bg-[#111520] p-5 cursor-pointer hover:border-[#d4a029]/50 transition-colors space-y-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{p.emoji || '👤'}</span>
                  <div>
                    <h3 className="font-bold text-white text-base">{p.nombre}</h3>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold border ${conf.bg} ${conf.text} ${conf.border}`}
                    >
                      {p.rol}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">{p.descripcionCompleta}</p>

                {p.versiculosAparece?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#1c2334]">
                    <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1 mr-1">
                      <BookOpen className="h-3 w-3 text-[#d4a029]" /> Pasajes:
                    </span>
                    {p.versiculosAparece.map((v) => (
                      <span
                        key={v}
                        className="rounded-md bg-[#181f2f] px-2 py-0.5 text-[10px] text-[#f5cf6d] border border-[#252f46]"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Detallado de Personaje */}
      {selectedPersonaje && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPersonaje(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[#2b354d] bg-[#0f131d] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl rounded-2xl bg-[#1b2233] p-2.5 border border-[#29344e]">
                  {selectedPersonaje.emoji || '👤'}
                </span>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedPersonaje.nombre}</h3>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                      ROL_COLORS[selectedPersonaje.rol]?.bg || confDefault.bg
                    } ${ROL_COLORS[selectedPersonaje.rol]?.text || confDefault.text} ${
                      ROL_COLORS[selectedPersonaje.rol]?.border || confDefault.border
                    }`}
                  >
                    {selectedPersonaje.rol}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPersonaje(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-[#1a2030] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Biografía / Rol Completo */}
            <div className="rounded-xl bg-[#141a27] p-4 border border-[#1f273b]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#d4a029] block mb-1.5">
                Historia y Participación Bíblica
              </span>
              <p className="text-xs text-gray-200 leading-relaxed font-serif">
                {selectedPersonaje.descripcionCompleta || selectedPersonaje.descripcionBreve}
              </p>
            </div>

            {/* Atributos y características */}
            {selectedPersonaje.atributos?.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-gray-400 block mb-2 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-[#d4a029]" /> Atributos Teológicos y Morales
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPersonaje.atributos.map((at) => (
                    <span
                      key={at}
                      className="rounded-lg bg-[#182030] px-2.5 py-1 text-xs text-gray-300 border border-[#25314a]"
                    >
                      {at}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Versículos donde interviene */}
            {selectedPersonaje.versiculosAparece?.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-gray-400 block mb-2 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-400" /> Referencias en el Texto
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedPersonaje.versiculosAparece.map((v) => (
                    <span
                      key={v}
                      className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 border border-emerald-500/30"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Conexiones con otros */}
            {selectedPersonaje.relaciones?.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-gray-400 block mb-2 flex items-center gap-1.5">
                  <GitFork className="h-3.5 w-3.5 text-sky-400" /> Relaciones con otros Personajes
                </span>
                <div className="space-y-1.5">
                  {selectedPersonaje.relaciones.map((rel, idx) => {
                    const target = mapPersonajes.get(rel.targetId)
                    return (
                      <div
                        key={idx}
                        onClick={() => target && setSelectedPersonaje(target)}
                        className="flex items-center justify-between text-xs bg-[#161d2d] px-3 py-2 rounded-xl border border-[#242e47] cursor-pointer hover:border-[#d4a029]/60 hover:bg-[#1a2337] transition"
                      >
                        <span className="text-[#f5cf6d] font-semibold">{rel.tipo}</span>
                        <span className="text-gray-200 font-medium flex items-center gap-1.5">
                          <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                          {target?.emoji || '👤'} {target?.nombre || rel.targetId}
                          <ChevronRight className="h-3 w-3 text-gray-500 ml-1" />
                        </span>
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
}

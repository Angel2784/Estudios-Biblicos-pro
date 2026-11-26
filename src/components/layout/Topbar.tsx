// src/components/layout/Topbar.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Crown, Menu, BookOpen, Sparkles, History, Languages, ArrowRight, X, ShieldCheck } from 'lucide-react'
import UserMenu from '@/components/UserMenu'
import type { User } from '@supabase/supabase-js'
import { isBiblePassage, findLexiconMatch } from '@/lib/lexicon'
import { getEstudios, type EstudioGuardado } from '@/lib/storage'

interface TopbarProps {
  user?: User | null
  onOpenMobileMenu: () => void
  onOpenPremium: () => void
  restantes: number | null
  usadas?: number | null
  esPremium: boolean
  esAdmin?: boolean
  onSelectSavedStudy: (estudio: EstudioGuardado) => void
  onGenerateStudy: (citaOTema: string) => void
  onThematicSearch: (tema: string) => void
}

export default function Topbar({
  user,
  onOpenMobileMenu,
  onOpenPremium,
  restantes,
  usadas,
  esPremium,
  esAdmin,
  onSelectSavedStudy,
  onGenerateStudy,
  onThematicSearch
}: TopbarProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [estudiosGuardados, setEstudiosGuardados] = useState<EstudioGuardado[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cálculo del conteo progresivo (0/3, 1/3, 2/3, 3/3)
  const totalGratis = 3
  const consultasUsadasGratis = usadas !== null && usadas !== undefined
    ? Math.min(totalGratis, Math.max(0, usadas))
    : restantes !== null && restantes !== undefined
      ? Math.min(totalGratis, Math.max(0, totalGratis - restantes))
      : 0

  // Cargar estudios guardados al interactuar con el buscador
  useEffect(() => {
    if (isOpen) {
      setEstudiosGuardados(getEstudios())
    }
  }, [isOpen])

  // Filtrado local instantáneo (0 tokens)
  const localMatches = query.trim()
    ? estudiosGuardados.filter(e => e.cita.toLowerCase().includes(query.toLowerCase())).slice(0, 3)
    : []

  const isPassage = isBiblePassage(query)
  const lexiconData = findLexiconMatch(query)

  // Atajo de teclado Ctrl + K / Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      if (localMatches.length > 0) {
        onSelectSavedStudy(localMatches[0])
      } else {
        onGenerateStudy(query)
      }
      setIsOpen(false)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-16 bg-[#0a0d14]/95 backdrop-blur-md border-b border-[#202533] px-4 lg:px-6 flex items-center justify-between gap-4">
      {/* Lado Izquierdo: Menú móvil y Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#151a26]"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <BookOpen className="w-6 h-6 text-[#f5cf6d] shrink-0" strokeWidth={2.25} />
          <span className="font-serif text-base lg:text-lg font-bold text-white whitespace-nowrap hidden sm:inline">
            Estudio Bíblico <span className="text-[#f5cf6d]">Pro</span>
          </span>
        </div>
      </div>

      {/* Centro: Buscador Inteligente */}
      <div ref={containerRef} className="relative flex-1 max-w-xl mx-2">
        <div className="flex items-center bg-[#131620] border border-[#262c3d] hover:border-[#f5cf6d]/40 focus-within:border-[#f5cf6d] rounded-full px-3.5 py-1.5 transition-all shadow-inner">
          <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDownInput}
            placeholder="Buscar cita (ej. Jn 3:16), tema, o palabra griega/hebrea..."
            className="w-full bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => { setQuery(''); setIsOpen(false) }}
              className="text-gray-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden md:inline-block text-[10px] text-gray-500 bg-[#1c2230] border border-[#2d374d] px-1.5 py-0.5 rounded font-mono">
              Ctrl K
            </kbd>
          )}
        </div>

        {/* Dropdown de Resultados */}
        {isOpen && query.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#121622] border border-[#2b3347] rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-[#202636] animate-in fade-in-50 duration-150">
            
            {/* SECCIÓN 1: Diccionario Griego / Hebreo */}
            {lexiconData && (
              <div className="p-3 bg-[#f5cf6d]/5">
                <div className="text-[11px] font-semibold text-[#f5cf6d] px-1 py-0.5 uppercase tracking-wider flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5" /> Léxico Bíblico ({lexiconData.language})
                </div>
                <div className="mt-1.5 p-3 bg-[#181e2e] border border-[#f5cf6d]/20 rounded-xl">
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-bold text-[#f5cf6d]">{lexiconData.original}</span>
                    <span className="text-xs font-mono bg-[#f5cf6d]/15 text-[#f5cf6d] px-2 py-0.5 rounded-full">
                      Strong {lexiconData.strong}
                    </span>
                  </div>
                  <p className="text-xs text-gray-200 mt-1 font-medium">{lexiconData.meaning}</p>
                  <p className="text-[11px] text-gray-400 mt-1 italic">{lexiconData.theologicalContext}</p>
                </div>
              </div>
            )}

            {/* SECCIÓN 2: Historial / Guardados */}
            {localMatches.length > 0 && (
              <div className="p-2">
                <div className="text-[11px] font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-blue-400" /> En tus Estudios Guardados
                </div>
                {localMatches.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onSelectSavedStudy(item)
                      setIsOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#1c2333] rounded-xl flex items-center justify-between text-sm text-gray-200 group transition-all"
                  >
                    <span className="font-medium group-hover:text-[#f5cf6d] flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-400 group-hover:text-[#f5cf6d]" />
                      {item.cita}
                    </span>
                    <span className="text-xs text-gray-500 group-hover:text-[#f5cf6d]">Abrir →</span>
                  </button>
                ))}
              </div>
            )}

            {/* SECCIÓN 3: Detección de Cita Bíblica */}
            {isPassage && (
              <div className="p-2 bg-emerald-950/20">
                <button
                  onClick={() => {
                    onGenerateStudy(query)
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-3 py-2.5 hover:bg-emerald-900/30 border border-emerald-500/30 rounded-xl flex items-center justify-between text-sm text-emerald-200 group transition-all"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>Estudiar pasaje bíblico: <strong className="text-emerald-300">{query}</strong></span>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold">
                    Generar Estudio <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              </div>
            )}

            {/* SECCIÓN 4: Búsqueda Temática con IA & Generación */}
            <div className="p-2 space-y-1">
              <div className="text-[11px] font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Inteligencia Artificial
              </div>

              <button
                onClick={() => {
                  onThematicSearch(query)
                  setIsOpen(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-purple-950/30 border border-transparent hover:border-purple-800/40 rounded-xl flex items-center justify-between text-sm text-gray-200 group transition-all"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Explorar tema: <strong className="text-purple-300">"{query}"</strong></span>
                </div>
                <span className="text-xs text-purple-400 flex items-center gap-1">
                  Ver pasajes sugeridos <ArrowRight className="w-3 h-3" />
                </span>
              </button>

              {!isPassage && (
                <button
                  onClick={() => {
                    onGenerateStudy(query)
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-amber-950/30 border border-transparent hover:border-amber-800/40 rounded-xl flex items-center justify-between text-sm text-gray-200 group transition-all"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#f5cf6d]" />
                    <span>Generar estudio de: <strong className="text-[#f5cf6d]">"{query}"</strong></span>
                  </div>
                  <span className="text-xs text-[#f5cf6d] flex items-center gap-1">
                    Iniciar <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Lado Derecho: Admin / Premium, Contador de Consultas y Usuario */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Caso 1: Administrador */}
        {esAdmin ? (
          <>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin</span>
            </div>
            <div className="hidden sm:flex items-center px-3 py-1 bg-[#131620] border border-[#202533] rounded-full text-xs text-gray-300">
              Consultas: <span className="font-bold text-[#f5cf6d] ml-1">∞ (Ilimitadas)</span>
            </div>
          </>
        ) : esPremium ? (
          /* Caso 2: Usuario Premium */
          <>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Premium</span>
            </div>
            <div className="hidden sm:flex items-center px-3 py-1 bg-[#131620] border border-[#202533] rounded-full text-xs text-gray-300">
              Consultas: <span className="font-bold text-[#f5cf6d] ml-1">{usadas ?? 0}/50</span>
            </div>
          </>
        ) : (
          /* Caso 3: Usuario Gratuito (Conteo: 0/3 -> 1/3 -> 2/3 -> 3/3) */
          <>
            <button
              onClick={onOpenPremium}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Premium</span>
            </button>
            <div className="hidden sm:flex items-center px-3 py-1 bg-[#131620] border border-[#202533] rounded-full text-xs text-gray-300">
              Consultas: <span className="font-bold text-[#f5cf6d] ml-1">{consultasUsadasGratis}/3</span>
            </div>
          </>
        )}

        {/* Menú de Usuario */}
        <UserMenu user={user} />
      </div>
    </header>
  )
}

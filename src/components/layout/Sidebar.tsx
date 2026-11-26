'use client'
import React from 'react'
import { Home, BookOpen, Scale, Mic, History, Library, Settings, LogOut, Crown, CalendarDays, Users } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

// Exportación explícita para resolver el error de TypeScript
export type TabType = 'inicio' | 'estudio' | 'comparacion' | 'sermones' | 'historial' | 'biblioteca' | string

interface SidebarProps {
  activeTab?: TabType
  onSelectTab?: (tab: TabType) => void
  onOpenSettings?: () => void
  onOpenPremium?: () => void
  isMobileOpen?: boolean
  onCloseMobile?: () => void
  esPremium?: boolean
}

const navigation = [
  { id: 'inicio', name: 'Inicio', icon: Home },
  { id: 'estudio', name: 'Estudio Bíblico', icon: BookOpen },
  { id: 'timeline', name: 'Línea de Tiempo', icon: CalendarDays },
  { id: 'personajes', name: 'Personajes', icon: Users },
  { id: 'comparacion', name: 'Comparación', icon: Scale },
  { id: 'sermones', name: 'Sermones', icon: Mic },
  { id: 'historial', name: 'Historial', icon: History },
  { id: 'biblioteca', name: 'Biblioteca', icon: Library },
]

export default function Sidebar({
  activeTab = 'inicio',
  onSelectTab,
  onOpenSettings,
  onOpenPremium,
  isMobileOpen = false,
  onCloseMobile,
  esPremium = false,
}: SidebarProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/sign-in'
  }

  const handleSelect = (tab: TabType) => {
    onSelectTab?.(tab)
    onCloseMobile?.()
  }

  return (
    <>
      {/* Overlay para cerrar el menú en móvil */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed left-0 z-50 flex w-64 shrink-0 flex-col border-r border-[#202738] bg-[#0a0d14] p-4 text-white transition-transform duration-200
          top-0 h-screen
          lg:top-16 lg:h-[calc(100vh-4rem)]
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <nav className="space-y-1 mt-2">
          {navigation.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'border border-[#d4a029]/40 bg-[#2e230a] text-[#f5cf6d]'
                    : 'text-gray-400 hover:bg-[#131722] hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </button>
            )
          })}

          <button
            onClick={() => {
              onOpenSettings?.()
              onCloseMobile?.()
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-[#131722] hover:text-white"
          >
            <Settings className="h-5 w-5" />
            Ajustes
          </button>
        </nav>

        <div className="space-y-4 mt-8">
          {!esPremium ? (
            <div className="rounded-2xl border border-[#d4a029]/40 bg-gradient-to-b from-[#2b220d] to-[#171310] p-4 text-center">
              <Crown className="mx-auto mb-2 h-6 w-6 text-[#f5cf6d]" />
              <h4 className="text-sm font-semibold text-white">Plan Premium</h4>
              <p className="mt-1 text-xs text-gray-400">
                Acceso ilimitado a todas las funciones
              </p>
              <button
                onClick={() => {
                  onOpenPremium?.()
                  onCloseMobile?.()
                }}
                className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#e0b042] to-[#b3831b] py-2 text-xs font-bold text-black transition hover:brightness-110"
              >
                Actualizar
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#d4a029]/40 bg-[#2b220d] py-3 text-xs font-semibold text-[#f5cf6d]">
              <Crown className="h-4 w-4" />
              Premium Activo
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  )
}

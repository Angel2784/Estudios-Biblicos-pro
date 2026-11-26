// src/components/dashboard/RecentStudies.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { Clock, BookOpen, ChevronRight } from 'lucide-react'
import { TabType } from '../layout/Sidebar'
import { getHistorial, type HistorialItem } from '@/lib/storage'

interface RecentStudiesProps {
  onSelectTab: (tab: TabType) => void
  onSelectStudy?: (cita: string) => void
}

function tiempoRelativo(fechaISO: string): string {
  const fecha = new Date(fechaISO)
  const ahora = new Date()
  const diffMs = ahora.getTime() - fecha.getTime()
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDias <= 0) return 'Hoy'
  if (diffDias === 1) return 'Ayer'
  if (diffDias < 7) return `Hace ${diffDias} días`
  if (diffDias < 30) return `Hace ${Math.floor(diffDias / 7)} sem`
  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function RecentStudies({ onSelectTab, onSelectStudy }: RecentStudiesProps) {
  const [estudios, setEstudios] = useState<HistorialItem[]>([])

  const cargar = () => {
    const todos = getHistorial()
    setEstudios(todos.filter(x => x.tipo === 'estudio').slice(0, 3))
  }

  useEffect(() => {
    cargar()
    window.addEventListener('ebp_storage_updated', cargar)
    window.addEventListener('storage', cargar)
    return () => {
      window.removeEventListener('ebp_storage_updated', cargar)
      window.removeEventListener('storage', cargar)
    }
  }, [])

  return (
    <div className="p-5 rounded-2xl bg-[#111520] border border-[#202738] shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#d4a029]" />
          <h3 className="font-semibold text-sm text-gray-200">Tus Últimos Estudios</h3>
        </div>
        <button
          onClick={() => onSelectTab('historial')}
          className="text-xs text-[#d4a029] hover:underline flex items-center gap-1 cursor-pointer"
        >
          Ver todo <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {estudios.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-6">
          Aún no tienes estudios recientes. Genera uno para verlo aquí.
        </p>
      ) : (
        <div className="space-y-2.5">
          {estudios.map((est) => (
            <button
              key={est.id}
              onClick={() => onSelectStudy?.(est.cita)}
              className="w-full text-left p-3 rounded-xl bg-[#171c2b]/60 hover:bg-[#1d2336] border border-[#232a3d] hover:border-[#d4a029]/40 transition-all flex items-start justify-between gap-3 group cursor-pointer"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-[#20273a] text-[#f5cf6d] mt-0.5 shrink-0">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-xs text-gray-200 group-hover:text-[#f5cf6d] transition-colors truncate">
                    {est.cita}
                  </h4>
                  <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                    {est.texto.slice(0, 80)}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-gray-500 whitespace-nowrap shrink-0">
                {tiempoRelativo(est.fecha)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

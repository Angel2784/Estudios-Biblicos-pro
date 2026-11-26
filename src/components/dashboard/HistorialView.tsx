// src/components/dashboard/HistorialView.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { History, BookOpen, GitCompare, Mic2 } from 'lucide-react'
import {
  getHistorial,
  type HistorialItem,
  type EstudioGuardado,
  type SermonGuardado
} from '@/lib/storage'

export interface HistorialViewProps {
  onSelectEstudio?: (estudio: EstudioGuardado) => void
  onSelectComparado?: (estudio: EstudioGuardado) => void
  onSelectSermon?: (sermon: SermonGuardado) => void
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
  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

const iconoPorTipo = {
  estudio: BookOpen,
  comparado: GitCompare,
  sermon: Mic2,
}

const etiquetaPorTipo = {
  estudio: 'Estudio',
  comparado: 'Comparación',
  sermon: 'Sermón',
}

export default function HistorialView({
  onSelectEstudio,
  onSelectComparado,
  onSelectSermon
}: HistorialViewProps) {
  const [items, setItems] = useState<HistorialItem[]>([])

  const cargar = () => {
    setItems(getHistorial())
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

  const handleSelect = (item: HistorialItem) => {
    if (item.tipo === 'estudio') {
      onSelectEstudio?.({ cita: item.cita, texto: item.texto, fecha: item.fecha })
    } else if (item.tipo === 'comparado') {
      onSelectComparado?.({ cita: item.cita, texto: item.texto, fecha: item.fecha })
    } else {
      onSelectSermon?.({ cita: item.cita, texto: item.texto, fecha: item.fecha, estilo: item.extra || 'expositivo' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <History className="w-5 h-5 text-[#d4a029]" />
        <h2 className="text-2xl font-serif font-bold text-[#fae29c]">Historial</h2>
      </div>
      <p className="text-sm text-gray-400 -mt-4">
        Todo lo que has generado automáticamente, en orden cronológico. Para guardar un estudio en tu colección permanente, usa el botón "Guardar".
      </p>

      {items.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#111520] border border-[#202738] text-center">
          <p className="text-sm text-gray-500">Aún no tienes actividad reciente en el historial.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const Icon = iconoPorTipo[item.tipo]
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full text-left p-4 rounded-xl bg-[#111520] hover:bg-[#171c2b] border border-[#202738] hover:border-[#d4a029]/40 transition-all flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-[#20273a] text-[#f5cf6d] shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-gray-200 group-hover:text-[#f5cf6d] transition-colors truncate">
                      {item.cita}
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      {etiquetaPorTipo[item.tipo]}{item.extra ? ` · ${item.extra}` : ''}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-gray-500 whitespace-nowrap shrink-0">
                  {tiempoRelativo(item.fecha)}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

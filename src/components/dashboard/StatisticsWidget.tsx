'use client'
import React, { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { getEstudios, getComparados } from '@/lib/storage'

function esEsteMes(fechaISO: string): boolean {
  const f = new Date(fechaISO)
  const ahora = new Date()
  return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear()
}

export default function StatisticsWidget() {
  const [stats, setStats] = useState({ esteMes: 0, versiculos: 0, sermones: 0 })

  useEffect(() => {
    const estudios = getEstudios()
    const comparados = getComparados()
    const esteMes = [...estudios, ...comparados].filter(e => esEsteMes(e.fecha)).length

    setStats({
      esteMes,
      versiculos: estudios.length + comparados.length,
      sermones: 0, // Aún no se guardan sermones — ver nota en storage.ts
    })
  }, [])

  return (
    <div className="p-5 rounded-2xl bg-[#111520] border border-[#202738] shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-[#d4a029]" />
        <h3 className="font-semibold text-sm text-gray-200">Estadísticas</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-[#171c2b]/60 border border-[#232a3d] text-center">
          <span className="block text-xl font-bold text-[#f5cf6d]">{stats.esteMes}</span>
          <span className="text-[11px] text-gray-400">Estudios este mes</span>
        </div>
        <div className="p-3 rounded-xl bg-[#171c2b]/60 border border-[#232a3d] text-center">
          <span className="block text-xl font-bold text-[#f5cf6d]">{stats.versiculos}</span>
          <span className="text-[11px] text-gray-400">Versículos analizados</span>
        </div>
        <div className="p-3 rounded-xl bg-[#171c2b]/60 border border-[#232a3d] text-center">
          <span className="block text-xl font-bold text-[#f5cf6d]">{stats.sermones}</span>
          <span className="text-[11px] text-gray-400">Sermones creados</span>
        </div>
      </div>
    </div>
  )
}

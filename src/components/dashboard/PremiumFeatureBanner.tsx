// src/components/dashboard/PremiumFeatureBanner.tsx
'use client'
import React from 'react'
import { Crown, Sparkles, Brain, Mic, BookMarked, Download } from 'lucide-react'

interface PremiumFeatureBannerProps {
  onOpenPremium: () => void
  esPremium?: boolean
}

export default function PremiumFeatureBanner({ onOpenPremium, esPremium }: PremiumFeatureBannerProps) {
  if (esPremium) return null

  const features = [
    { title: 'Consultas ilimitadas', icon: Sparkles },
    { title: 'Exégesis avanzada', icon: Brain },
    { title: 'Sermones personalizados', icon: Mic },
    { title: 'Biblioteca extendida', icon: BookMarked },
    { title: 'Exportación a DOCX', icon: Download },
  ]

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-r from-[#17150f] via-[#12141c] to-[#17150f] border border-[#d4a029]/40 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#2e230a] border border-[#d4a029]/50 text-[#f5cf6d]">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-white">Funciones Premium</h3>
            <p className="text-xs text-gray-400">Desbloquea todo el potencial de Estudio Bíblico Pro</p>
          </div>
        </div>
        <button
          onClick={onOpenPremium}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e0b042] to-[#b3831b] text-black font-bold text-xs hover:brightness-110 active:scale-98 transition-all shadow-md shadow-[#d4a029]/20"
        >
          Actualizar a Premium
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {features.map((feat, idx) => {
          const Icon = feat.icon
          return (
            <div key={idx} className="p-3 rounded-xl bg-[#181c28]/60 border border-[#242b3d] flex items-center gap-2.5">
              <Icon className="w-4 h-4 text-[#f5cf6d] shrink-0" />
              <span className="text-xs text-gray-300 font-medium">{feat.title}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'
import React from 'react'
import { BookOpen, Scale, Mic, ArrowRight, CalendarDays, Users } from 'lucide-react'
import { TabType } from '../layout/Sidebar'

interface QuickActionCardsProps {
  onSelectTab: (tab: TabType) => void
}

const cards = [
  {
    id: 'estudio',
    title: 'Estudio Bíblico',
    description: 'Exégesis profunda y léxico original griego y hebreo',
    icon: BookOpen,
  },
  {
    id: 'timeline',
    title: 'Línea de Tiempo',
    description: 'Cronología de eras, profecías y eventos históricos',
    icon: CalendarDays,
  },
  {
    id: 'personajes',
    title: 'Red de Personajes',
    description: 'Relaciones, roles y atributos de figuras bíblicas',
    icon: Users,
  },
  {
    id: 'comparacion',
    title: 'Comparación de Pasajes',
    description: 'Estudia versículos relacionados en paralelo',
    icon: Scale,
  },
  {
    id: 'sermones',
    title: 'Generación de Sermones',
    description: 'Bosquejos expositivos y devocionales prácticos',
    icon: Mic,
  },
]

export default function QuickActionCards({ onSelectTab }: QuickActionCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <button
            key={card.id}
            onClick={() => onSelectTab(card.id as TabType)}
            className="group flex flex-col justify-between rounded-2xl border border-[#202738] bg-[#111520] p-5 text-left transition hover:border-[#d4a029]/50 hover:bg-[#151a26]"
          >
            <div className="space-y-3">
              <div className="w-fit rounded-lg bg-[#2b220d] p-2.5 text-[#d4a029]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white group-hover:text-[#f5cf6d]">
                  {card.title}
                </h3>
                <p className="mt-1 text-xs text-gray-400">{card.description}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[#d4a029]">
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        )
      })}
    </div>
  )
}

'use client'
import { useState } from 'react'
import { extraerSeccion, convertirEnlacesBiblicos } from '@/lib/parser'

interface Tab { label: string; seccion?: number }

interface Props {
  texto: string
  tabs: Tab[]
  extraContent?: (seccion: number) => React.ReactNode
}

export default function TabPanel({ texto, tabs, extraContent }: Props) {
  const [activa, setActiva] = useState(0)

  const getContenido = (tab: Tab, idx: number): string => {
    if (idx === 0) return convertirEnlacesBiblicos(texto)
    if (tab.seccion) {
      const siguiente = tabs[idx + 1]?.seccion
      return convertirEnlacesBiblicos(extraerSeccion(texto, tab.seccion, siguiente))
    }
    return ''
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="tab-bar">
        {tabs.map((tab, i) => (
          <button
            key={i}
            className={`tab-btn ${activa === i ? 'active' : ''}`}
            onClick={() => setActiva(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="tab-panel">
        <div
          className="prose-biblical"
          dangerouslySetInnerHTML={{ __html: getContenido(tabs[activa], activa).replace(/\n/g, '<br/>') }}
        />
        {extraContent && tabs[activa].seccion && extraContent(tabs[activa].seccion!)}
      </div>
    </div>
  )
}

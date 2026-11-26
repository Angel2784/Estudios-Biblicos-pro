// src/components/ThematicModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, BookOpen, X, Loader2, ArrowRight } from 'lucide-react'
import { getApiKey } from '@/lib/storage'
import { obtenerExploracionTematica, type ExploracionTematica } from '@/lib/gemini'

type ThematicResult = ExploracionTematica

interface ThematicModalProps {
  isOpen: boolean;
  topic: string;
  onClose: () => void;
  onSelectPassage: (cita: string) => void;
}

export default function ThematicModal({ isOpen, topic, onClose, onSelectPassage }: ThematicModalProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ThematicResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !topic) return

    const fetchThematicData = async () => {
      setLoading(true)
      setError('')
      setData(null)

      try {
        const apiKey = getApiKey()
        const resultado = await obtenerExploracionTematica(apiKey || '', topic)
        setData(resultado)
      } catch (err: any) {
        setError(err?.message || 'No se pudieron obtener las sugerencias temáticas. Intenta de nuevo.')
      } finally {
        setLoading(false)
      }
    }

    fetchThematicData()
  }, [isOpen, topic])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#10141d] border border-[#f5cf6d]/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202533] bg-[#151a26]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#f5cf6d]" />
            <h3 className="text-base font-bold text-white">
              Exploración Temática: <span className="text-[#f5cf6d]">"{topic}"</span>
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#202533]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#f5cf6d] animate-spin" />
              <p className="text-sm text-gray-400">Consultando pasajes bíblicos y perspectivas teológicas...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Resumen */}
              <div className="p-4 bg-[#151a26] border border-[#202533] rounded-xl text-sm text-gray-300 leading-relaxed">
                <span className="font-semibold text-[#f5cf6d] block mb-1">💡 Perspectiva Bíblica:</span>
                {data.resumen}
              </div>

              {/* Pasajes Clave */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#f5cf6d]" /> Pasajes Recomendados para Estudiar
                </h4>
                <div className="grid gap-3">
                  {data.pasajes.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-[#151a26]/70 border border-[#202533] hover:border-[#f5cf6d]/50 rounded-xl flex items-center justify-between group transition-all"
                    >
                      <div className="pr-3">
                        <span className="font-bold text-[#f5cf6d] text-sm block">{item.cita}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{item.explicacion}</p>
                      </div>
                      <button
                        onClick={() => {
                          onSelectPassage(item.cita)
                          onClose()
                        }}
                        className="shrink-0 px-3 py-1.5 bg-[#f5cf6d]/10 hover:bg-[#f5cf6d] text-[#f5cf6d] hover:text-[#0a0d14] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                      >
                        Estudiar <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preguntas de Reflexión */}
              {data.preguntas?.length > 0 && (
                <div className="p-4 bg-amber-950/10 border border-amber-500/20 rounded-xl">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300/80 mb-2">
                    Reflexión y Aplicación:
                  </h4>
                  <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                    {data.preguntas.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

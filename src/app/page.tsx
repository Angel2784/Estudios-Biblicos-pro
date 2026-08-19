'use client'

import { useState } from 'react'
import { Settings, BookOpen, User, Copy, Bookmark, Download, ChevronDown, X, MessageSquare, Sparkles } from 'lucide-react'

export default function Home() {
  const [pasaje, setPasaje] = useState('Salmos 23:1-6')
  const [pasajeA, setPasajeA] = useState('')
  const [pasajeB, setPasajeB] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)

  const handleEstudiar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Realiza una exégesis y estudio bíblico profundo del pasaje: ${pasaje}` }),
      })
      const data = await res.json()
      setResultado(data.text || data.error)
    } catch (err) {
      setResultado('Error al conectar con el servidor.')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] text-[#f3e5ab] p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-center bg-[#131b2e] border border-[#d4af37]/30 p-4 rounded-2xl shadow-xl">
          <h1 className="text-xl font-bold tracking-wide text-[#f3e5ab]">Estudio Bíblico Pro</h1>
          <div className="flex items-center space-x-3">
            <span className="text-xs bg-[#1e293b] border border-[#d4af37]/20 px-3 py-1.5 rounded-full text-gray-300">
              1 consultas gratis hoy
            </span>
            <button className="flex items-center space-x-1.5 bg-[#1e293b] hover:bg-[#273548] border border-[#d4af37]/30 px-4 py-1.5 rounded-xl text-sm font-medium transition">
              <BookOpen size={16} />
              <span>Biblioteca</span>
            </button>
            <button className="p-2 bg-[#1e293b] hover:bg-[#273548] border border-[#d4af37]/30 rounded-xl transition">
              <Settings size={18} />
            </button>
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white shadow-inner">
              A
            </div>
          </div>
        </header>

        {/* Sección: Estudio Bíblico */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#f3e5ab]">Estudio Bíblico</h2>
          
          <div className="bg-[#131b2e] border border-[#d4af37]/40 p-6 rounded-2xl shadow-2xl space-y-4">
            <form onSubmit={handleEstudiar} className="flex gap-3">
              <input
                type="text"
                value={pasaje}
                onChange={(e) => setPasaje(e.target.value)}
                placeholder="Ej: Salmos 23:1-6"
                className="flex-1 bg-[#0b0f19] border border-[#d4af37]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-[#d4af37] to-[#aa7c11] text-black font-bold px-6 py-3 rounded-xl shadow-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Estudiando...' : 'Estudiar'}
              </button>
            </form>

            {/* Pills de acceso rápido */}
            <div className="flex flex-wrap gap-2 pt-1">
              {['Juan 3:16', 'Salmos 23:1-6', 'Romanos 8:28', 'Filipenses 4:13'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPasaje(item)}
                  className="text-xs bg-[#1e293b] hover:bg-[#273548] border border-[#d4af37]/30 text-[#f3e5ab] px-3.5 py-1.5 rounded-full transition"
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Alerta de límite y precios */}
            <div className="bg-[#2a1215] border border-red-500/40 text-red-200 text-xs p-3 rounded-xl flex items-center justify-between">
              <span>Alcanzaste tu límite gratis. Hazte premium: $14.900 COP/mes o $149.000 COP/año.</span>
              <a href="#pagar" className="underline font-bold hover:text-white">Mejorar plan</a>
            </div>
          </div>
        </section>

        {/* Tarjeta de Resultado Dinámica (si hay respuesta) */}
        {resultado && (
          <div className="bg-[#131b2e] border border-[#d4af37]/40 p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#d4af37]/20 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Exégesis: {pasaje}</h3>
                <span className="text-xs text-gray-400">Estudio generado con IA</span>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => navigator.clipboard.writeText(resultado)} className="flex items-center space-x-1 text-xs bg-[#1e293b] border border-[#d4af37]/30 px-3 py-1.5 rounded-lg hover:bg-[#273548]">
                  <Copy size={14} /> <span>Copiar todo</span>
                </button>
                <button className="flex items-center space-x-1 text-xs bg-[#1e293b] border border-[#d4af37]/30 px-3 py-1.5 rounded-lg hover:bg-[#273548]">
                  <Bookmark size={14} /> <span>Guardar</span>
                </button>
                <button onClick={() => setResultado(null)} className="p-1.5 bg-[#1e293b] hover:bg-red-900/50 rounded-lg text-gray-300">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-200 whitespace-pre-wrap bg-[#0b0f19] p-4 rounded-xl border border-[#d4af37]/20 max-h-96 overflow-y-auto">
              {resultado}
            </div>

            <div className="flex items-center justify-between bg-[#1e293b] border border-[#d4af37]/20 px-4 py-2.5 rounded-xl text-sm">
              <div className="flex items-center space-x-2 text-gray-300">
                <MessageSquare size={16} />
                <span>Chat con el pasaje</span>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </div>
          </div>
        )}

        {/* Sección: Estudio Comparado */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#f3e5ab]">Estudio Comparado</h2>
          
          <div className="bg-[#131b2e] border border-[#d4af37]/40 p-6 rounded-2xl shadow-2xl space-y-4">
            <p className="text-xs text-gray-400">Compara dos pasajes con análisis teológico profundo</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={pasajeA}
                onChange={(e) => setPasajeA(e.target.value)}
                placeholder="Pasaje A (ej: Juan 3:16)"
                className="bg-[#0b0f19] border border-[#d4af37]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
              <input
                type="text"
                value={pasajeB}
                onChange={(e) => setPasajeB(e.target.value)}
                placeholder="Pasaje B (ej: Romanos 5:8)"
                className="bg-[#0b0f19] border border-[#d4af37]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
            </div>

            <button
              onClick={() => {
                if(pasajeA && pasajeB) {
                  setPasaje(`${pasajeA} vs ${pasajeB}`)
                  handleEstudiar({ preventDefault: () => {} } as any)
                }
              }}
              className="w-full bg-gradient-to-r from-[#d4af37] to-[#aa7c11] text-black font-bold py-3 rounded-xl shadow-lg hover:opacity-90 transition"
            >
              Comparar
            </button>

            <div className="flex flex-wrap gap-2 pt-1">
              {['Juan 3:16 vs Romanos 5:8', 'Salmos 23 vs Juan 10:11', 'Gálatas 2:20 vs Filipenses 1:21'].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    const partes = item.split(' vs ')
                    setPasajeA(partes[0])
                    setPasajeB(partes[1])
                  }}
                  className="text-xs bg-[#1e293b] hover:bg-[#273548] border border-[#d4af37]/30 text-[#f3e5ab] px-3.5 py-1.5 rounded-full transition"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}

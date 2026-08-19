'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, X, ChevronDown, ChevronUp, Bot, User } from 'lucide-react'
import { obtenerRespuestaChat, type MensajeChat } from '@/lib/gemini'
import { convertirEnlacesBiblicos } from '@/lib/parser'

interface Props {
  cita:        string
  textoPasaje: string
  apiKey:      string
}

// Función para convertir tablas y markdown de Gemini a HTML estructurado
function renderMarkdownConTablas(texto: string): string {
  let html = texto

  // 1. Convertir tablas Markdown (| col | col |)
  const lineas = html.split('\n')
  const resultado: string[] = []
  let enTabla = false
  let tablaHtml = ''

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim()
    if (linea.startsWith('|') && linea.endsWith('|')) {
      // Ignorar fila divisoria |---|---|
      if (/^\|[\s\-:|]+\|$/.test(linea)) {
        continue
      }
      
      const celdas = linea.split('|').slice(1, -1).map(c => c.trim())
      
      if (!enTabla) {
        enTabla = true
        tablaHtml = '<div class="overflow-x-auto my-3 rounded-xl border border-amber-500/30 bg-black/40"><table class="w-full text-xs text-left border-collapse"><thead><tr class="bg-amber-500/15 border-b border-amber-500/30 text-amber-200">'
        celdas.forEach(c => {
          tablaHtml += `<th class="p-2.5 font-semibold">${c.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</th>`
        })
        tablaHtml += '</tr></thead><tbody>'
      } else {
        tablaHtml += '<tr class="border-b border-white/5 hover:bg-white/5">'
        celdas.forEach(c => {
          tablaHtml += `<td class="p-2.5 text-slate-200">${c.replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-300">$1</strong>')}</td>`
        })
        tablaHtml += '</tr>'
      }
    } else {
      if (enTabla) {
        tablaHtml += '</tbody></table></div>'
        resultado.push(tablaHtml)
        enTabla = false
        tablaHtml = ''
      }
      resultado.push(lineas[i])
    }
  }
  if (enTabla) {
    tablaHtml += '</tbody></table></div>'
    resultado.push(tablaHtml)
  }

  html = resultado.join('\n')

  // 2. Convertir negritas (**texto**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-300 font-semibold">$1</strong>')
  
  // 3. Convertir listas (- item o * item)
  html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li class="ml-4 list-disc text-slate-200 my-1">$1</li>')

  // 4. Convertir enlaces bíblicos y saltos de línea
  html = convertirEnlacesBiblicos(html)
  html = html.replace(/\n(?!<\/?(table|thead|tbody|tr|th|td|div|li|ul)>)/g, '<br/>')

  return html
}

export default function ChatPanel({ cita, textoPasaje, apiKey }: Props) {
  const [open, setOpen]           = useState(false)
  const [input, setInput]         = useState('')
  const [mensajes, setMensajes]   = useState<MensajeChat[]>([])
  const [cargando, setCargando]   = useState(false)
  const [error, setError]         = useState('')
  const bottomRef                 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, open])

  const enviar = async () => {
    const texto = input.trim()
    if (!texto || cargando) return
    setInput(''); setError('')

    const nuevosConPregunta: MensajeChat[] = [...mensajes, { role: 'user', content: texto }]
    setMensajes(nuevosConPregunta)
    setCargando(true)
    try {
      const respuesta = await obtenerRespuestaChat(apiKey, cita, textoPasaje, nuevosConPregunta)
      setMensajes(prev => [...prev, { role: 'assistant', content: respuesta }])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally { setCargando(false) }
  }

  const limpiar = () => { setMensajes([]); setError('') }

  const SUGERENCIAS = [
    '¿Cuál es el mensaje principal?',
    '¿Qué significa en el contexto original?',
    '¿Cómo aplicarlo hoy?',
    '¿Qué dice sobre Jesús?',
  ]

  return (
    <div className="card mt-4 overflow-hidden border border-amber-500/20 bg-slate-950/40 p-0">

      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-transparent border-none cursor-pointer hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-sky-400" />
          <span className="text-sm font-medium text-sky-300">
            Chat con el pasaje
          </span>
          {mensajes.length > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-500/30">
              {Math.floor(mensajes.length / 2)} preguntas
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {mensajes.length > 0 && (
            <button
              onClick={e => { e.stopPropagation(); limpiar() }}
              className="text-slate-400 hover:text-red-400 bg-transparent border-none cursor-pointer p-1"
              title="Limpiar conversación"
            >
              <X size={14} />
            </button>
          )}
          {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10">

          {/* Mensajes */}
          <div className="max-h-[380px] overflow-y-auto p-4 space-y-3">
            {mensajes.length === 0 && (
              <div>
                <p className="text-xs mb-3 text-slate-400">
                  Haz preguntas sobre <strong className="text-amber-300">{cita}</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGERENCIAS.map(s => (
                    <button 
                      key={s} 
                      className="pill text-xs hover:border-amber-400" 
                      onClick={() => setInput(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensajes.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                {m.role === 'assistant' && (
                  <div className="shrink-0 w-7 h-7 rounded-full bg-sky-950/80 border border-sky-400/30 flex items-center justify-center mt-1">
                    <Bot size={14} className="text-sky-300" />
                  </div>
                )}

                <div 
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-100 rounded-br-none'
                      : 'bg-slate-900/80 border border-white/10 text-slate-100 rounded-bl-none'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: renderMarkdownConTablas(m.content) }}
                      className="prose-biblical text-sm leading-relaxed"
                    />
                  ) : (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  )}
                </div>

                {m.role === 'user' && (
                  <div className="shrink-0 w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mt-1">
                    <User size={14} className="text-amber-300" />
                  </div>
                )}
              </div>
            ))}

            {cargando && (
              <div className="flex gap-2 items-center">
                <div className="shrink-0 w-7 h-7 rounded-full bg-sky-950/80 border border-sky-400/30 flex items-center justify-center">
                  <Bot size={14} className="text-sky-300" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-white/10 text-xs text-sky-300 flex items-center gap-2">
                  <span className="animate-spin text-sm">⟳</span> Analizando y respondiendo...
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs p-2.5 rounded-xl bg-red-950/40 text-red-400 border border-red-800/60">
                ⚠️ {error}
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input de Chat */}
          <div className="flex gap-2 p-3 border-t border-white/10 bg-black/20">
            <input
              className="input-gold flex-1 text-sm py-2.5 px-3.5"
              placeholder="Pregunta sobre el pasaje..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
              disabled={cargando}
            />
            <button
              className="btn-gold px-4 py-2.5 text-xs"
              onClick={enviar}
              disabled={cargando || !input.trim()}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

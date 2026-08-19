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

function renderMarkdownConTablas(texto: string): string {
  let html = texto
  const lineas = html.split('\n')
  const resultado: string[] = []
  let enTabla = false
  let tablaHtml = ''

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim()
    if (linea.startsWith('|') && linea.endsWith('|')) {
      if (/^\|[\s\-:|]+\|$/.test(linea)) continue
      
      const celdas = linea.split('|').slice(1, -1).map(c => c.trim())
      
      if (!enTabla) {
        enTabla = true
        tablaHtml = '<div style="overflow-x:auto; margin: 12px 0; border-radius: 10px; border: 1px solid var(--navy-border); background: var(--navy);"><table style="width:100%; font-size: 12px; text-align: left; border-collapse: collapse;"><thead><tr style="background: rgba(240,168,48,0.15); border-bottom: 1px solid var(--navy-border); color: var(--gold-light);">'
        celdas.forEach(c => {
          tablaHtml += `<th style="padding: 8px 10px; font-weight: 600;">${c.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</th>`
        })
        tablaHtml += '</tr></thead><tbody>'
      } else {
        tablaHtml += '<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">'
        celdas.forEach(c => {
          tablaHtml += `<td style="padding: 8px 10px; color: var(--text-primary);">${c.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--gold);">$1</strong>')}</td>`
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
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--gold); font-weight: 600;">$1</strong>')
  html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li style="margin-left: 18px; margin-top: 4px; margin-bottom: 4px; color: var(--text-primary);">$1</li>')
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
    <div className="card mt-3" style={{ padding: 0, overflow: 'hidden' }}>

      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={15} style={{ color: 'var(--gold)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--gold-light)' }}>
            Chat con el pasaje
          </span>
          {mensajes.length > 0 && (
            <span style={{
              background: 'var(--navy-border)', color: 'var(--gold)',
              fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
            }}>
              {Math.floor(mensajes.length / 2)} preguntas
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {mensajes.length > 0 && (
            <button
              onClick={e => { e.stopPropagation(); limpiar() }}
              style={{ color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
              title="Limpiar conversación"
            >
              <X size={13} />
            </button>
          )}
          {open ? <ChevronUp size={15} style={{ color: 'var(--text-dim)' }} /> : <ChevronDown size={15} style={{ color: 'var(--text-dim)' }} />}
        </div>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--navy-border)' }}>

          <div style={{ maxHeight: 380, overflowY: 'auto', padding: '12px 16px' }}>
            {mensajes.length === 0 && (
              <div>
                <p className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
                  Haz preguntas sobre <strong style={{ color: 'var(--gold)' }}>{cita}</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGERENCIAS.map(s => (
                    <button 
                      key={s} 
                      className="tab-btn" 
                      style={{ fontSize: 11 }}
                      onClick={() => setInput(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensajes.map((m, i) => (
              <div key={i} className={`flex gap-2 mb-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                {m.role === 'assistant' && (
                  <div style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--navy-border)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', marginTop: 2,
                  }}>
                    <Bot size={13} style={{ color: 'var(--gold)' }} />
                  </div>
                )}

                <div 
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: m.role === 'user' ? 'var(--gold-dim)' : 'var(--navy-mid)',
                    border: '1px solid var(--navy-border)',
                    color: m.role === 'user' ? 'var(--gold-light)' : 'var(--text-primary)',
                  }}
                >
                  {m.role === 'assistant' ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: renderMarkdownConTablas(m.content) }}
                      className="prose-biblical"
                      style={{ fontSize: '0.95rem', lineHeight: 1.6 }}
                    />
                  ) : (
                    <span style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{m.content}</span>
                  )}
                </div>

                {m.role === 'user' && (
                  <div style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--gold-dim)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', marginTop: 2,
                  }}>
                    <User size={13} style={{ color: 'var(--gold)' }} />
                  </div>
                )}
              </div>
            ))}

            {cargando && (
              <div className="flex gap-2 items-center">
                <div style={{
                  flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--navy-border)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Bot size={13} style={{ color: 'var(--gold)' }} />
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '12px', background: 'var(--navy-mid)', fontSize: 12, color: 'var(--gold)' }}>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: 6 }}>⟳</span> Analizando pasaje...
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs p-2 rounded" style={{ color: '#ef4444', background: '#7f1d1d33', border: '1px solid #7f1d1d' }}>
                ⚠️ {error}
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 px-3 pb-3" style={{ borderTop: '1px solid var(--navy-border)', paddingTop: 10 }}>
            <input
              className="input-field flex-1"
              style={{ fontSize: 13, padding: '8px 12px' }}
              placeholder="Pregunta sobre el pasaje..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
              disabled={cargando}
            />
            <button
              className="btn-primary"
              style={{ padding: '8px 14px' }}
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

'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, X, ChevronDown, ChevronUp, Bot, User } from 'lucide-react'
import { obtenerRespuestaChat, type MensajeChat } from '@/lib/gemini'
import { convertirEnlacesBiblicos } from '@/lib/parser'

interface Props {
  cita:       string
  textoPasaje: string
  apiKey:     string
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
    <div className="card mt-3 overflow-hidden" style={{ padding: 0 }}>

      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={15} style={{ color: '#60a5fa' }} />
          <span className="text-sm font-medium" style={{ color: '#60a5fa' }}>
            Chat con el pasaje
          </span>
          {mensajes.length > 0 && (
            <span style={{
              background: '#1e3a5f', color: '#60a5fa',
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
          {/* Mensajes */}
          <div style={{ maxHeight: 340, overflowY: 'auto', padding: '12px 16px' }}>

            {mensajes.length === 0 && (
              <div>
                <p className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
                  Haz preguntas sobre <strong style={{ color: 'var(--gold)' }}>{cita}</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGERENCIAS.map(s => (
                    <button key={s} className="tab-btn" style={{ fontSize: 11 }}
                      onClick={() => setInput(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {mensajes.map((m, i) => (
              <div key={i} className={`flex gap-2 mb-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                    background: '#1e3a5f', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', marginTop: 2,
                  }}>
                    <Bot size={13} style={{ color: '#60a5fa' }} />
                  </div>
                )}
                <div style={{
                  maxWidth: '80%',
                  padding: '8px 12px',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user' ? 'var(--gold-dim)' : 'var(--navy-mid)',
                  color: m.role === 'user' ? 'var(--gold)' : 'var(--text-primary)',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}>
                  {m.role === 'assistant' ? (
                    <div
                      className="prose-biblical"
                      style={{ fontSize: 13, lineHeight: 1.6 }}
                      dangerouslySetInnerHTML={{
                        __html: convertirEnlacesBiblicos(m.content).replace(/\n/g, '<br/>')
                      }}
                    />
                  ) : (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span>
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
              <div className="flex gap-2 mb-3">
                <div style={{
                  flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                  background: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bot size={13} style={{ color: '#60a5fa' }} />
                </div>
                <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: 'var(--navy-mid)' }}>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#60a5fa',
                        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs p-2 rounded" style={{ color: '#ef4444', background: '#7f1d1d33' }}>
                ⚠️ {error}
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
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
              style={{ padding: '8px 12px', opacity: cargando || !input.trim() ? 0.6 : 1 }}
              onClick={enviar}
              disabled={cargando || !input.trim()}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}

'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Check, Copy, PenLine, Link2, MessageCircle, StickyNote, Plus, Trash2, Edit3, X } from 'lucide-react'
import { getAnotaciones, guardarAnotaciones } from '@/lib/storage'
import type { Anotacion } from '@/lib/storage'
import { convertirEnlacesBiblicos } from '@/lib/parser'

const COLORS = [
  { hex: '#fbbf24', name: 'Amarillo' },
  { hex: '#86efac', name: 'Verde' },
  { hex: '#93c5fd', name: 'Azul' },
  { hex: '#f9a8d4', name: 'Rosa' },
  { hex: '#fdba74', name: 'Naranja' },
]

interface Props { texto: string; cita: string }

export default function AnnotationReader({ texto, cita }: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [anotaciones, setAnotaciones] = useState<Anotacion[]>([])
  const [toolbar, setToolbar]         = useState<{ x: number; y: number; text: string; id?: string } | null>(null)
  const [selectedColor, setSelectedColor] = useState('#fbbf24')
  const [modal, setModal]             = useState<{ id: string; preview: string; nota: string } | null>(null)
  const [saveMsg, setSaveMsg]         = useState('')
  const [showNotes, setShowNotes]     = useState(false)

  useEffect(() => { setAnotaciones(getAnotaciones(cita)) }, [cita])
  useEffect(() => { guardarAnotaciones(cita, anotaciones) }, [anotaciones, cita])

  const handleSelection = () => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !contentRef.current) return
    const text = sel.toString().trim()
    if (text.length >= 1) {
      try {
        const range = sel.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setToolbar({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
          text: text,
        })
      } catch {
        // Fallback
      }
    }
  }

  const buildHtml = useCallback((): string => {
    const lineas = texto.split('\n')
    const bloques: string[] = []
    let citaBuffer: string[] = []
    const flushCita = () => {
      if (citaBuffer.length) {
        bloques.push(`<blockquote>${citaBuffer.join('<br/>')}</blockquote>`)
        citaBuffer = []
      }
    }
    lineas.forEach(linea => {
      const m = linea.match(/^\s*>\s?(.*)$/)
      if (m) { citaBuffer.push(m[1]) }
      else { flushCita(); bloques.push(linea) }
    })
    flushCita()

    let html = convertirEnlacesBiblicos(bloques.join('\n')).replace(/\n(?!<\/?blockquote>)/g, '<br/>')
    
    anotaciones.forEach(an => {
      const escaped = an.fragmento.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const notaIndicator = an.nota ? ' 📝' : ''
      html = html.replace(
        new RegExp(escaped, 'g'),
        `<mark id="hl-${an.id}" data-id="${an.id}" data-color="${an.hex}" ` +
        `style="background:${an.hex}40; color:#fff; border-bottom: 2px solid ${an.hex}; border-radius:3px; padding:1px 3px; cursor:pointer">` +
        `${an.fragmento}${notaIndicator}</mark>`
      )
    })
    return html
  }, [texto, anotaciones])

  const aplicarResaltado = (hexColor: string) => {
    if (!toolbar?.text) return
    const id = 'an_' + Date.now()
    const nueva: Anotacion = {
      id,
      fragmento: toolbar.text,
      color: hexColor,
      hex: hexColor,
      nota: '',
      fecha: new Date().toISOString(),
    }
    setAnotaciones(prev => [...prev, nueva])
    setToolbar(null)
    window.getSelection()?.removeAllRanges()
    setSaveMsg('Resaltado guardado')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  const abrirModalNota = () => {
    if (!toolbar) return
    let id = toolbar.id
    let fragmento = toolbar.text
    let notaExistente = ''

    if (id) {
      const encontrada = anotaciones.find(a => a.id === id)
      if (encontrada) {
        fragmento = encontrada.fragmento
        notaExistente = encontrada.nota || ''
      }
    } else {
      id = 'an_' + Date.now()
      const nueva: Anotacion = {
        id,
        fragmento,
        color: selectedColor,
        hex: selectedColor,
        nota: '',
        fecha: new Date().toISOString(),
      }
      setAnotaciones(prev => [...prev, nueva])
    }

    setModal({ id, preview: fragmento, nota: notaExistente })
    setToolbar(null)
    window.getSelection()?.removeAllRanges()
  }

  const guardarNota = () => {
    if (!modal) return
    setAnotaciones(prev => prev.map(a => a.id === modal.id ? { ...a, nota: modal.nota } : a))
    setModal(null)
    setSaveMsg('Nota guardada')
    setTimeout(() => setSaveMsg(''), 2500)
  }

  const eliminarAnotacion = (id: string) => {
    setAnotaciones(prev => prev.filter(a => a.id !== id))
    setSaveMsg('Eliminado')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  const handleClickContenido = (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest('[data-id]') as HTMLElement | null
    if (el && el.dataset.id) {
      const anId = el.dataset.id
      const an = anotaciones.find(a => a.id === anId)
      if (an) {
        const rect = el.getBoundingClientRect()
        setToolbar({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
          text: an.fragmento,
          id: an.id,
        })
      }
    }
  }

  const notasConTexto = anotaciones.filter(a => a.nota)

  return (
    <div className="relative">
      <p className="text-xs mb-3 flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
        <PenLine size={12} /> Selecciona cualquier fragmento para resaltar, anotar y compartir
      </p>

      <div
        ref={contentRef}
        className="prose-biblical select-text cursor-text"
        onMouseUp={handleSelection}
        onTouchEnd={handleSelection}
        onClick={handleClickContenido}
        dangerouslySetInnerHTML={{ __html: buildHtml() }}
      />

      {toolbar && (
        <div
          className="annotation-toolbar"
          style={{
            position: 'fixed',
            left: Math.max(150, Math.min(toolbar.x, typeof window !== 'undefined' ? window.innerWidth - 150 : 500)),
            top: Math.max(60, toolbar.y),
            transform: 'translate(-50%, -100%)',
            zIndex: 99999,
          }}
        >
          <div className="flex items-center gap-1.5 px-1">
            {COLORS.map(c => (
              <button
                key={c.hex}
                title={c.name}
                onClick={() => { setSelectedColor(c.hex); aplicarResaltado(c.hex) }}
                style={{
                  width: 20, height: 20, borderRadius: '50%',
                  backgroundColor: c.hex, border: '2px solid rgba(255,255,255,0.4)',
                  cursor: 'pointer', flexShrink: 0
                }}
              />
            ))}
          </div>

          <div style={{ width: 1, height: 18, background: 'var(--navy-border)' }} />

          <button
            onClick={abrirModalNota}
            className="tab-btn"
            style={{ padding: '4px 8px', fontSize: 11 }}
          >
            <StickyNote size={13} /> Nota
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(`"${toolbar.text}" — ${cita}`)
              setToolbar(null)
              setSaveMsg('Copiado')
              setTimeout(() => setSaveMsg(''), 2000)
            }}
            className="tab-btn"
            style={{ padding: '4px 8px', fontSize: 11 }}
            title="Copiar"
          >
            <Copy size={13} />
          </button>

          {toolbar.id && (
            <button
              onClick={() => { eliminarAnotacion(toolbar.id!); setToolbar(null) }}
              className="tab-btn"
              style={{ padding: '4px 8px', fontSize: 11, background: '#7f1d1d33', color: '#ef4444' }}
              title="Borrar"
            >
              <Trash2 size={13} />
            </button>
          )}

          <button
            onClick={() => setToolbar(null)}
            style={{ color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 mt-4 pt-3 flex-wrap" style={{ borderTop: '1px solid var(--navy-border)' }}>
        <button 
          className="btn-secondary" 
          style={{ fontSize: 11, padding: '5px 12px' }}
          onClick={() => setShowNotes(v => !v)}
        >
          <StickyNote size={13} /> Notas ({notasConTexto.length})
        </button>

        {saveMsg && <span style={{ color: 'var(--green)', fontSize: 11 }}>✓ {saveMsg}</span>}

        {anotaciones.length > 0 && (
          <span style={{ color: 'var(--text-dim)', fontSize: 11, marginLeft: 'auto' }}>
            {anotaciones.length} resaltado{anotaciones.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {showNotes && (
        <div className="mt-3 p-4 rounded-xl" style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h4 style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600 }}>
              Notas guardadas
            </h4>
            <button
              onClick={() => {
                const id = 'an_' + Date.now()
                setModal({ id, preview: 'Nota general sobre el pasaje', nota: '' })
              }}
              className="tab-btn"
              style={{ fontSize: 10, padding: '3px 8px' }}
            >
              <Plus size={11} /> Nueva nota
            </button>
          </div>

          {notasConTexto.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: 12, fontStyle: 'italic' }}>
              Sin notas aún. Selecciona texto y toca el ícono de nota para agregar una.
            </p>
          ) : (
            <div className="space-y-2">
              {notasConTexto.map(an => (
                <div 
                  key={an.id} 
                  style={{
                    borderLeft: `3px solid ${an.hex}`,
                    background: 'var(--navy-mid)',
                    borderRadius: '0 8px 8px 0',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: 11, fontStyle: 'italic' }}>
                      &ldquo;{an.fragmento}&rdquo;
                    </p>
                    <p style={{ color: 'var(--text-primary)', fontSize: 13, marginTop: 3 }}>
                      {an.nota}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setModal({ id: an.id, preview: an.fragmento, nota: an.nota || '' })}
                      style={{ color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 3 }}
                      title="Editar"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => eliminarAnotacion(an.id)}
                      style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 3 }}
                      title="Borrar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modal && (
        <div 
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}
        >
          <div style={{
            background: 'var(--navy-card)', border: '1px solid var(--gold-dim)',
            borderRadius: 14, padding: 20, width: '100%', maxWidth: 380, animation: 'slideUp 0.2s ease-out',
          }}>
            <h3 style={{ color: 'var(--gold)', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              📝 Nota de Estudio
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 12, fontStyle: 'italic', marginBottom: 10 }}>
              &ldquo;{modal.preview}&rdquo;
            </p>
            <textarea
              autoFocus
              value={modal.nota}
              onChange={e => setModal({ ...modal, nota: e.target.value })}
              placeholder="Escribe tu nota aquí..."
              style={{
                width: '100%', background: 'var(--navy-mid)', color: 'var(--text-primary)',
                border: '1px solid var(--navy-border)', borderRadius: 8, padding: 10,
                fontSize: 13, minHeight: 90, outline: 'none',
              }}
            />
            <div className="flex gap-2 mt-3 justify-end">
              <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => setModal(null)}>
                Cancelar
              </button>
              <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={guardarNota}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

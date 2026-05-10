'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
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
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [anotaciones, setAnotaciones] = useState<Anotacion[]>([])
  const [toolbar, setToolbar] = useState<{ x: number; y: number } | null>(null)
  const [selectedColor, setSelectedColor] = useState('#fbbf24')
  const [activeId, setActiveId] = useState<string | null>(null)

  // FIX 1: Guardamos el texto seleccionado antes de que el toolbar lo borre
  const [pendingText, setPendingText] = useState<string>('')

  const [modal, setModal] = useState<{ id: string; preview: string; nota: string } | null>(null)
  const [shareMenu, setShareMenu] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const shareUrl = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(cita)}&version=RVR1960`

  useEffect(() => {
    setAnotaciones(getAnotaciones(cita))
  }, [cita])

  useEffect(() => {
    guardarAnotaciones(cita, anotaciones)
  }, [anotaciones, cita])

  const buildHtml = useCallback((): string => {
    let html = convertirEnlacesBiblicos(texto).replace(/\n/g, '<br/>')
    anotaciones.forEach(an => {
      const escaped = an.fragmento.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const notaAttr = an.nota
        ? ` data-nota="${an.nota.replace(/"/g, "'").replace(/\n/g, '&#10;')}"`
        : ''
      html = html.replace(
        new RegExp(escaped, 'g'),
        `<mark id="hl-${an.id}" data-id="${an.id}" data-color="${an.hex}" ` +
        `style="background:${an.hex};color:#1a1a2e;border-radius:3px;padding:1px 3px;cursor:pointer"${notaAttr}>` +
        `${an.fragmento}</mark>`
      )
    })
    return html
  }, [texto, anotaciones])

  // FIX 2: Lógica de selección unificada para mouse y touch
  const handleSelection = useCallback((x: number, y: number, target: EventTarget | null) => {
    // Si tocó un resaltado existente
    const el = (target as HTMLElement)?.closest('[data-id]') as HTMLElement | null
    if (el) {
      setActiveId(el.dataset.id ?? null)
      setSelectedColor(el.dataset.color ?? '#fbbf24')
      setPendingText('')
      setToolbar({ x, y })
      return
    }

    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) {
      if (!toolbarRef.current?.contains(target as Node)) {
        setToolbar(null)
        setActiveId(null)
        setPendingText('')
      }
      return
    }

    const text = sel.toString().trim()
    if (text.length < 2) return
    if (!contentRef.current?.contains(sel.getRangeAt(0).commonAncestorContainer)) return

    // FIX 1: Capturamos el texto AHORA antes de que el toolbar lo borre
    setActiveId(null)
    setPendingText(text)
    setToolbar({ x, y })
  }, [])

  // Handler para mouse (PC)
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    handleSelection(e.clientX, e.clientY, e.target)
  }, [handleSelection])

  // FIX 3: Handler para touch (móvil) — esto no existía antes
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0]
    // Pequeño delay para que la selección se estabilice en móvil
    setTimeout(() => {
      handleSelection(touch.clientX, touch.clientY, e.target)
    }, 120)
  }, [handleSelection])

  // FIX 4: applyHighlight ahora usa pendingText si la selección ya se borró
  const applyHighlight = useCallback((): { id: string; fragmento: string } | null => {
    const text = pendingText || window.getSelection()?.toString().trim() || ''
    if (!text || text.length < 2) return null

    const id = 'an_' + Date.now()
    const newAn: Anotacion = {
      id,
      fragmento: text,
      color: selectedColor,
      hex: selectedColor,
      nota: '',
      fecha: new Date().toISOString(),
    }
    setAnotaciones(prev => [...prev, newAn])
    window.getSelection()?.removeAllRanges()
    setPendingText('')
    return { id, fragmento: text }
  }, [selectedColor, pendingText])

  const handleColorClick = (color: string) => {
    setSelectedColor(color)
    if (activeId) {
      setAnotaciones(prev =>
        prev.map(a => a.id === activeId ? { ...a, color, hex: color } : a)
      )
    } else {
      const result = applyHighlight()
      if (result) setActiveId(result.id)
    }
  }

  // FIX 5: handleNota corregido — ya no busca en estado stale
  const handleNota = () => {
    let id = activeId
    let fragmento = ''

    if (!id) {
      // Nueva anotación: applyHighlight devuelve el fragmento directamente
      const result = applyHighlight()
      if (!result) return
      id = result.id
      fragmento = result.fragmento
    } else {
      // Anotación existente: la buscamos en el estado actual
      fragmento = anotaciones.find(a => a.id === id)?.fragmento ?? ''
    }

    const notaActual = anotaciones.find(a => a.id === id)?.nota ?? ''
    setModal({ id, preview: fragmento.substring(0, 60), nota: notaActual })
    setToolbar(null)
  }

  const saveNota = () => {
    if (!modal) return
    setAnotaciones(prev => prev.map(a => a.id === modal.id ? { ...a, nota: modal.nota } : a))
    setModal(null)
    setSaveMsg('✅ Nota guardada')
    setTimeout(() => setSaveMsg(''), 2500)
  }

  const handleCopy = () => {
    const text = activeId
      ? (anotaciones.find(a => a.id === activeId)?.fragmento ?? '')
      : (pendingText || window.getSelection()?.toString().trim() ?? '')
    if (text) {
      navigator.clipboard.writeText(`${text}\n\n— ${cita} (RVR1960)`)
      setSaveMsg('📋 Copiado')
      setTimeout(() => setSaveMsg(''), 2000)
    }
    setToolbar(null)
  }

  const removeHighlight = () => {
    if (!activeId) return
    setAnotaciones(prev => prev.filter(a => a.id !== activeId))
    setActiveId(null)
    setToolbar(null)
    setPendingText('')
  }

  const getShareText = (): string => {
    const text = activeId
      ? (anotaciones.find(a => a.id === activeId)?.fragmento ?? '')
      : (pendingText || window.getSelection()?.toString().trim() ?? '')
    return `${text} — ${cita} (RVR1960)`
  }

  // FIX 6: Posicionamiento corregido — centrado y sin salirse de la pantalla
  const TOOLBAR_W = 360
  const toolbarLeft = toolbar
    ? Math.max(8, Math.min(
        toolbar.x - TOOLBAR_W / 2,
        (typeof window !== 'undefined' ? window.innerWidth : 800) - TOOLBAR_W - 8
      ))
    : 0
  const toolbarTop = toolbar ? Math.max(toolbar.y - 64, 8) : 0

  const notasConTexto = anotaciones.filter(a => a.nota)

  return (
    <div className="relative">
      <p className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
        ✋ Selecciona cualquier fragmento para resaltar, anotar y compartir
      </p>

      <div
        ref={contentRef}
        className="prose-biblical"
        style={{ cursor: 'text', userSelect: 'text' }}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleTouchEnd}          {/* ← NUEVO: soporte móvil */}
        dangerouslySetInnerHTML={{ __html: buildHtml() }}
      />

      {toolbar && (
        <div
          ref={toolbarRef}
          className="annotation-toolbar"
          style={{ left: toolbarLeft, top: toolbarTop, position: 'fixed', zIndex: 9999 }}
          onMouseDown={e => e.preventDefault()}
          onTouchStart={e => e.preventDefault()} {/* ← NUEVO: evita borrar selección en móvil */}
        >
          {COLORS.map(c => (
            <button key={c.hex} title={c.name} onClick={() => handleColorClick(c.hex)}
              style={{
                width: 22, height: 22, borderRadius: '50%',
                border: `2px solid ${selectedColor === c.hex ? 'white' : 'transparent'}`,
                background: c.hex, cursor: 'pointer', flexShrink: 0,
                transform: selectedColor === c.hex ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.15s',
              }}
            />
          ))}
          <div style={{ width: 1, height: 20, background: '#475569' }} />
          <button className="tab-btn" style={{ padding: '4px 8px', fontSize: 11 }} onClick={handleNota}>📝</button>
          <button className="tab-btn" style={{ padding: '4px 8px', fontSize: 11 }} onClick={handleCopy}>📋</button>
          <button className="tab-btn" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => setShareMenu(v => !v)}>↗️</button>
          {activeId && (
            <button className="tab-btn" style={{ padding: '4px 8px', fontSize: 11, background: '#7f1d1d' }}
              onClick={removeHighlight}>✕</button>
          )}
          {shareMenu && (
            <div style={{
              position: 'absolute', top: '110%', left: 0,
              background: 'var(--navy-card)', border: '1px solid #334155',
              borderRadius: 10, padding: 8, zIndex: 10001,
              display: 'flex', flexDirection: 'column', gap: 4, minWidth: 170,
            }}>
              {[
                { label: '💬 WhatsApp', fn: () => window.open(`https://wa.me/?text=${encodeURIComponent(getShareText()+'\n'+shareUrl)}`, '_blank') },
                { label: '🐦 Twitter/X', fn: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}&url=${encodeURIComponent(shareUrl)}`, '_blank') },
                { label: '🔗 Copiar link', fn: () => { navigator.clipboard.writeText(shareUrl); setSaveMsg('🔗 Link copiado'); setTimeout(() => setSaveMsg(''), 2000) } },
                { label: '📋 Copiar texto', fn: () => { navigator.clipboard.writeText(getShareText()); setSaveMsg('📋 Copiado'); setTimeout(() => setSaveMsg(''), 2000) } },
              ].map(item => (
                <button key={item.label} className="tab-btn"
                  style={{ padding: '5px 10px', fontSize: 11, textAlign: 'left' }}
                  onClick={() => { item.fn(); setShareMenu(false); setToolbar(null) }}>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 mt-4 flex-wrap"
        style={{ borderTop: '1px solid var(--navy-border)', paddingTop: 12 }}>
        <button className="btn-secondary" style={{ fontSize: 11, padding: '5px 12px' }}
          onClick={() => setShowNotes(v => !v)}>
          📋 Notas ({notasConTexto.length})
        </button>
        <span style={{ color: 'var(--green)', fontSize: 11 }}>{saveMsg}</span>
        {anotaciones.length > 0 && (
          <span style={{ color: 'var(--text-dim)', fontSize: 11, marginLeft: 'auto' }}>
            {anotaciones.length} resaltado{anotaciones.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {showNotes && (
        <div className="mt-3" style={{ animation: 'slideUp 0.3s ease-out' }}>
          {notasConTexto.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>
              Sin notas aún. Resalta texto y toca 📝 para agregar una nota.
            </p>
          ) : (
            <div className="space-y-2">
              {notasConTexto.map(an => (
                <div key={an.id} style={{
                  borderLeft: `3px solid ${an.hex}`,
                  background: 'var(--navy-card)',
                  borderRadius: '0 8px 8px 0',
                  padding: '8px 12px',
                }}>
                  <p style={{ color: 'var(--text-dim)', fontSize: 11, fontStyle: 'italic' }}>
                    &ldquo;{an.fragmento.substring(0, 70)}{an.fragmento.length > 70 ? '...' : ''}&rdquo;
                  </p>
                  <p style={{ color: 'var(--text-primary)', fontSize: 13, marginTop: 3 }}>{an.nota}</p>
                  <p style={{ color: 'var(--text-dim)', fontSize: 10, marginTop: 3 }}>
                    {new Date(an.fecha).toLocaleDateString('es-ES')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div style={{
            background: 'var(--navy-card)', border: '1px solid var(--gold-dim)',
            borderRadius: 14, padding: 24, width: '100%', maxWidth: 380,
            animation: 'slideUp 0.2s ease-out',
          }}>
            <h3 style={{ color: 'var(--gold)', fontSize: 14, marginBottom: 10 }}>📝 Nota</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 12, fontStyle: 'italic', marginBottom: 10 }}>
              &ldquo;{modal.preview}{modal.preview.length >= 60 ? '...' : ''}&rdquo;
            </p>
            <textarea
              autoFocus
              value={modal.nota}
              onChange={e => setModal({ ...modal, nota: e.target.value })}
              placeholder="Escribe tu nota aquí..."
              style={{
                width: '100%', background: 'var(--navy-mid)', color: 'var(--text-primary)',
                border: '1px solid var(--navy-border)', borderRadius: 8, padding: 10,
                fontSize: 13, resize: 'vertical', minHeight: 80,
                fontFamily: 'DM Sans, sans-serif', outline: 'none',
              }}
            />
            <div className="flex gap-2 mt-3 justify-end">
              <button className="btn-secondary" style={{ fontSize: 12, padding: '7px 14px' }}
                onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn-primary" style={{ fontSize: 12, padding: '7px 14px' }}
                onClick={saveNota}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

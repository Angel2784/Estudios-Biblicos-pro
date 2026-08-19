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

  // Cargar anotaciones guardadas
  useEffect(() => { setAnotaciones(getAnotaciones(cita)) }, [cita])
  useEffect(() => { guardarAnotaciones(cita, anotaciones) }, [anotaciones, cita])

  // Capturar selección de texto
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

  // Renderizar el HTML con citas y marcas resaltadas
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
        `class="cursor-pointer font-medium rounded px-1 transition-all" ` +
        `style="background:${an.hex}40; color:#fff; border-bottom: 2px solid ${an.hex};">` +
        `${an.fragmento}${notaIndicator}</mark>`
      )
    })
    return html
  }, [texto, anotaciones])

  // Aplicar resaltado
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

  // Abrir modal para añadir/editar nota
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

  // Guardar nota
  const guardarNota = () => {
    if (!modal) return
    setAnotaciones(prev => prev.map(a => a.id === modal.id ? { ...a, nota: modal.nota } : a))
    setModal(null)
    setSaveMsg('Nota guardada')
    setTimeout(() => setSaveMsg(''), 2500)
  }

  // Eliminar anotación
  const eliminarAnotacion = (id: string) => {
    setAnotaciones(prev => prev.filter(a => a.id !== id))
    setSaveMsg('Anotación eliminada')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  // Click en texto existente
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
      <p className="text-xs mb-3 flex items-center gap-1.5 text-amber-200/70">
        <PenLine size={13} /> Selecciona cualquier palabra o frase para resaltar y añadir notas.
      </p>

      {/* Contenido interactivo */}
      <div
        ref={contentRef}
        className="prose-biblical select-text cursor-text"
        onMouseUp={handleSelection}
        onTouchEnd={handleSelection}
        onClick={handleClickContenido}
        dangerouslySetInnerHTML={{ __html: buildHtml() }}
      />

      {/* ── TOOLBAR FLOTANTE DE RESALTADO Y NOTAS ── */}
      {toolbar && (
        <div
          className="fixed z-[99999] flex items-center gap-2 p-2 rounded-2xl bg-[#0f131f]/95 border border-amber-400/50 shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl -translate-x-1/2 -translate-y-full animate-fadeIn"
          style={{ left: Math.max(160, Math.min(toolbar.x, typeof window !== 'undefined' ? window.innerWidth - 160 : 500)), top: Math.max(70, toolbar.y) }}
        >
          {/* Selector de colores */}
          <div className="flex items-center gap-1.5 px-1">
            {COLORS.map(c => (
              <button
                key={c.hex}
                title={c.name}
                onClick={() => { setSelectedColor(c.hex); aplicarResaltado(c.hex) }}
                className="w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-125 border border-white/40"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>

          <div className="w-[1px] h-5 bg-white/20" />

          {/* Botón Añadir Nota */}
          <button
            onClick={abrirModalNota}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30 cursor-pointer"
          >
            <StickyNote size={13} /> Nota
          </button>

          {/* Botón Copiar */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(`"${toolbar.text}" — ${cita}`)
              setToolbar(null)
              setSaveMsg('Texto copiado')
              setTimeout(() => setSaveMsg(''), 2000)
            }}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
            title="Copiar"
          >
            <Copy size={14} />
          </button>

          {/* Si es una anotación existente, opción de borrar */}
          {toolbar.id && (
            <button
              onClick={() => { eliminarAnotacion(toolbar.id!); setToolbar(null) }}
              className="p-1.5 rounded-xl text-red-400 hover:bg-red-950/60 cursor-pointer"
              title="Quitar resaltado"
            >
              <Trash2 size={14} />
            </button>
          )}

          {/* Cerrar */}
          <button
            onClick={() => setToolbar(null)}
            className="p-1 rounded-xl text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── BARRA INFERIOR DE NOTAS ── */}
      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10 flex-wrap">
        <button 
          className="btn-glass text-xs py-1.5 px-3.5 flex items-center gap-1.5"
          onClick={() => setShowNotes(v => !v)}
        >
          <StickyNote size={14} className="text-amber-300" />
          <span>Notas ({notasConTexto.length})</span>
        </button>

        {saveMsg && (
          <span className="text-xs text-emerald-400 font-medium animate-fadeIn">
            ✓ {saveMsg}
          </span>
        )}

        {anotaciones.length > 0 && (
          <span className="text-xs text-slate-400 ml-auto">
            {anotaciones.length} elemento{anotaciones.length !== 1 ? 's' : ''} resaltado{anotaciones.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── PANEL EXPANDIBLE DE NOTAS ── */}
      {showNotes && (
        <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <StickyNote size={15} /> Tus Notas y Apuntes
            </h4>
            <button
              onClick={() => {
                const id = 'an_' + Date.now()
                setModal({ id, preview: 'Nota general sobre el pasaje', nota: '' })
              }}
              className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30"
            >
              <Plus size={12} /> Nueva nota manual
            </button>
          </div>

          {notasConTexto.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No tienes notas aún. Selecciona cualquier palabra o frase del estudio para agregarle una nota.
            </p>
          ) : (
            <div className="space-y-2.5">
              {notasConTexto.map(an => (
                <div 
                  key={an.id} 
                  className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-start justify-between gap-3"
                  style={{ borderLeft: `4px solid ${an.hex}` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 italic">
                      &ldquo;{an.fragmento}&rdquo;
                    </p>
                    <p className="text-sm text-slate-100 mt-1 font-medium whitespace-pre-wrap">
                      {an.nota}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {new Date(an.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setModal({ id: an.id, preview: an.fragmento, nota: an.nota || '' })}
                      className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-white/5 rounded-lg"
                      title="Editar nota"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => eliminarAnotacion(an.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg"
                      title="Borrar nota"
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

      {/* ── MODAL PARA ESCRIBIR / EDITAR NOTA ── */}
      {modal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}
        >
          <div className="bg-[#101420] border border-amber-500/40 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slideUp">
            <h3 className="flex items-center gap-2 text-base font-bold text-amber-300 mb-2">
              <StickyNote size={16} /> Nota de Estudio
            </h3>
            
            <p className="text-xs text-slate-400 italic mb-3 bg-black/30 p-2.5 rounded-xl border border-white/5">
              &ldquo;{modal.preview}&rdquo;
            </p>

            <textarea
              autoFocus
              value={modal.nota}
              onChange={e => setModal({ ...modal, nota: e.target.value })}
              placeholder="Escribe tu reflexión, apunte o explicación teológica aquí..."
              className="w-full bg-slate-950/80 text-slate-100 border border-amber-500/30 rounded-xl p-3 text-sm min-h-[120px] focus:outline-none focus:border-amber-400"
            />

            <div className="flex gap-2.5 mt-4 justify-end">
              <button 
                className="btn-glass text-xs"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button 
                className="btn-gold text-xs px-4"
                onClick={guardarNota}
              >
                Guardar Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

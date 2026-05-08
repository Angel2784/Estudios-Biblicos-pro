'use client'
import { useState } from 'react'
import { Library, Trash2, Download, BookOpen, GitCompare, X } from 'lucide-react'
import { getEstudios, getComparados, eliminarEstudio, exportarBiblioteca, type EstudioGuardado } from '@/lib/storage'

interface Props {
  onSelectEstudio: (estudio: EstudioGuardado) => void
  onSelectComparado: (estudio: EstudioGuardado) => void
  onClose: () => void
}

export default function LibrarySidebar({ onSelectEstudio, onSelectComparado, onClose }: Props) {
  const [tab, setTab] = useState<'estudios' | 'comparados'>('estudios')
  const estudios = getEstudios()
  const comparados = getComparados()

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: 320,
      background: 'var(--navy-card)', borderLeft: '1px solid var(--navy-border)',
      zIndex: 1000, display: 'flex', flexDirection: 'column',
      animation: 'slideUp 0.3s ease-out',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--navy-border)' }}>
        <div className="flex items-center gap-2">
          <Library size={18} style={{ color: 'var(--gold)' }} />
          <span className="font-semibold" style={{ color: 'var(--gold)' }}>Mi Biblioteca</span>
        </div>
        <button onClick={onClose} className="btn-secondary" style={{ padding: '5px 8px' }}>
          <X size={15} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-3" style={{ borderBottom: '1px solid var(--navy-border)' }}>
        <button className={`tab-btn flex-1 ${tab === 'estudios' ? 'active' : ''}`} onClick={() => setTab('estudios')}>
          <BookOpen size={12} /> Estudios ({estudios.length})
        </button>
        <button className={`tab-btn flex-1 ${tab === 'comparados' ? 'active' : ''}`} onClick={() => setTab('comparados')}>
          <GitCompare size={12} /> Comparados ({comparados.length})
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tab === 'estudios' && (
          estudios.length === 0
            ? <p className="text-sm text-center py-8" style={{ color: 'var(--text-dim)' }}>Sin estudios guardados aún</p>
            : estudios.map(e => (
              <div key={e.cita} className="card" style={{ padding: '12px 14px', cursor: 'pointer' }}
                onClick={() => onSelectEstudio(e)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--gold)' }}>{e.cita}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                      {new Date(e.fecha).toLocaleDateString('es-ES')}
                      {e.anotaciones?.length > 0 && ` · ${e.anotaciones.length} anotaciones`}
                    </p>
                  </div>
                  <button
                    onClick={ev => { ev.stopPropagation(); eliminarEstudio(e.cita) }}
                    className="btn-secondary" style={{ padding: '4px 6px', flexShrink: 0 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
        )}
        {tab === 'comparados' && (
          comparados.length === 0
            ? <p className="text-sm text-center py-8" style={{ color: 'var(--text-dim)' }}>Sin comparados guardados aún</p>
            : comparados.map(e => (
              <div key={e.cita} className="card" style={{ padding: '12px 14px', cursor: 'pointer' }}
                onClick={() => onSelectComparado(e)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--gold)' }}>{e.cita}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                      {new Date(e.fecha).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <button
                    onClick={ev => { ev.stopPropagation(); eliminarEstudio(e.cita) }}
                    className="btn-secondary" style={{ padding: '4px 6px', flexShrink: 0 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: '1px solid var(--navy-border)' }}>
        <button className="btn-secondary w-full justify-center" style={{ fontSize: 12 }} onClick={exportarBiblioteca}>
          <Download size={13} /> Exportar biblioteca (JSON)
        </button>
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  restantes: number | null
  esAdmin: boolean
  esPremium: boolean
}

type FontSize = '1.15rem' | '1.45rem' | '1.8rem'

export default function SettingsModal({
  isOpen,
  onClose,
  restantes,
  esAdmin,
  esPremium,
}: Props) {
  const [fontSize, setFontSize] = useState<FontSize>('1.15rem')
  const [mensajeDatos, setMensajeDatos] = useState('')

  // Cargar tamaño guardado al abrir
  useEffect(() => {
    const saved = localStorage.getItem('ebp_fontSize') as FontSize | null
    if (saved) {
      setFontSize(saved)
      document.documentElement.style.setProperty('--biblical-font-size', saved)
      document.body.style.setProperty('--biblical-font-size', saved)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Cambiar tamaño de letra en tiempo real
  const handleCambiarFuente = (tamano: FontSize) => {
    setFontSize(tamano)
    localStorage.setItem('ebp_fontSize', tamano)
    document.documentElement.style.setProperty('--biblical-font-size', tamano)
    document.body.style.setProperty('--biblical-font-size', tamano)
  }

  // Vaciar historial
  const handleBorrarHistorial = () => {
    if (window.confirm('¿Seguro que deseas vaciar todo tu historial de estudios guardados?')) {
      localStorage.removeItem('ebp_estudios')
      localStorage.removeItem('ebp_comparados')
      localStorage.removeItem('ebp_sermones')
      setMensajeDatos('Historial eliminado con éxito')
      setTimeout(() => setMensajeDatos(''), 3000)
    }
  }

  // Limpiar notas locales
  const handleBorrarNotas = () => {
    if (window.confirm('¿Seguro que deseas borrar todas las notas y resaltados guardados?')) {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('ebp_an_')) {
          localStorage.removeItem(key)
        }
      })
      setMensajeDatos('Notas y resaltados eliminados con éxito')
      setTimeout(() => setMensajeDatos(''), 3000)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Fondo oscuro translúcido con desenfoque */}
      <div 
        onClick={onClose} 
        style={{ position: 'absolute', inset: 0, background: 'rgba(5, 7, 12, 0.75)', backdropFilter: 'blur(10px)' }} 
      />

      {/* Ventana Modal Translúcida */}
      <div 
        className="card" 
        style={{ position: 'relative', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', zIndex: 1001, animation: 'slideUp 0.25s ease-out' }}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/20 mb-5">
          <h2 className="section-title m-0 text-xl">Ajustes</h2>
          <button onClick={onClose} className="btn-glass p-2" style={{ borderRadius: '50%' }}>
            <X size={16} />
          </button>
        </div>

        {/* ── 1. ESTADO DE LA CUENTA Y PLAN ── */}
        <div className="mb-6 p-4 rounded-2xl" style={{ background: 'rgba(20, 28, 44, 0.5)', border: '1px solid rgba(255, 215, 80, 0.2)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Tipo de Cuenta:</span>
            <span className="pill text-xs px-3 py-0.5 text-amber-300 font-semibold">
              {esAdmin ? 'Administrador' : esPremium ? 'Premium Ilimitado' : 'Estándar Gratis'}
            </span>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/40 text-xs">
            <span className="text-slate-400">Consultas disponibles hoy:</span>
            <span className="text-amber-300 font-bold">
              {esAdmin || esPremium ? 'Ilimitadas' : (restantes ?? 0)}
            </span>
          </div>
        </div>

        {/* ── 2. TAMAÑO DE LETRA DEL TEXTO BÍBLICO ── */}
        <div className="mb-6">
          <h3 className="text-amber-200 text-sm font-semibold mb-2">Tamaño de letra (Texto Bíblico)</h3>
          <p className="text-xs text-slate-400 mb-3">Ajusta el tamaño de lectura para el texto de los estudios.</p>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleCambiarFuente('1.15rem')}
              className={`pill text-center py-2 ${fontSize === '1.15rem' ? 'pill-active-blue' : ''}`}
            >
              Normal (A)
            </button>
            <button
              type="button"
              onClick={() => handleCambiarFuente('1.45rem')}
              className={`pill text-center py-2 ${fontSize === '1.45rem' ? 'pill-active-blue' : ''}`}
            >
              Grande (A+)
            </button>
            <button
              type="button"
              onClick={() => handleCambiarFuente('1.8rem')}
              className={`pill text-center py-2 ${fontSize === '1.8rem' ? 'pill-active-blue' : ''}`}
            >
              Extra (A++)
            </button>
          </div>
        </div>

        {/* ── 3. GESTIÓN DE DATOS LOCALES ── */}
        <div className="pt-4 border-t border-slate-700/40">
          <h3 className="text-amber-200 text-sm font-semibold mb-2">Gestión de Datos y Almacenamiento</h3>
          <div className="flex gap-2 flex-col sm:flex-row">
            <button 
              onClick={handleBorrarHistorial}
              className="btn-glass text-xs py-2 px-3 justify-center text-slate-300 hover:text-red-300 flex-1"
            >
              Vaciar historial
            </button>
            <button 
              onClick={handleBorrarNotas}
              className="btn-glass text-xs py-2 px-3 justify-center text-slate-300 hover:text-red-300 flex-1"
            >
              Limpiar notas
            </button>
          </div>

          {mensajeDatos && (
            <p className="mt-3 text-xs text-center text-green-400 bg-green-950/40 py-1.5 px-3 rounded-lg border border-green-800/40">
              {mensajeDatos}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

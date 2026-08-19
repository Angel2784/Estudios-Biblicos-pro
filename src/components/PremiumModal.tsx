'use client'
import { useState } from 'react'
import { X, Copy, Check, MessageCircle, QrCode, Smartphone } from 'lucide-react'
import { PRECIO_MENSUAL, PRECIO_ANUAL } from '@/lib/gemini'
import { useUser } from '@clerk/nextjs'

interface Props {
  isOpen: boolean
  onClose: () => void
}

type MetodoPago = 'nequi' | 'daviplata' | 'breb'

export default function PremiumModal({ isOpen, onClose }: Props) {
  const { user } = useUser()
  const [plan, setPlan] = useState<'mensual' | 'anual'>('anual')
  const [metodo, setMetodo] = useState<MetodoPago>('nequi')
  const [copiado, setCopiado] = useState<string | null>(null)

  // ════════════════════════════════════════════════════════════════════════════
  // ⚙️ TUS DATOS DE COBRO REALES
  // ════════════════════════════════════════════════════════════════════════════
  const NOMBRE_TITULAR          = 'Angel Peña'
  const NUMERO_NEQUI            = '322 730 7125'
  const QR_NEQUI_IMG            = '/qr-nequi.jpg'        // 👈 Coincide con public/qr-nequi.jpg
  const NUMERO_DAVIPLATA        = '322 730 7125'
  const LLAVE_BREB              = '3227307125'
  const QR_BREB_IMG             = '/qr-breb.jpg'         // 👈 Coincide con public/qr-breb.jpg
  const WHATSAPP_VISIBLE        = '+57 322 730 7125'
  const WHATSAPP_NUMERO_LINK    = '573227307125'
  // ════════════════════════════════════════════════════════════════════════════

  if (!isOpen) return null

  const emailUsuario = user?.primaryEmailAddress?.emailAddress || 'No registrado'
  const valorPlan = plan === 'anual' ? '$149.000 COP' : '$14.900 COP'
  const planTexto = plan === 'anual' ? `Plan Anual (${PRECIO_ANUAL})` : `Plan Mensual (${PRECIO_MENSUAL})`
  
  const mensajeWhatsApp = encodeURIComponent(
    `Hola, quiero activar mi cuenta Premium en Estudio Bíblico Pro.\n\n` +
    `• Plan seleccionado: ${planTexto}\n` +
    `• Valor: ${valorPlan}\n` +
    `• Mi correo registrado: ${emailUsuario}\n\n` +
    `Adjunto mi comprobante de pago para la activación inmediata.`
  )

  const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMERO_LINK}?text=${mensajeWhatsApp}`

  const handleCopiar = (texto: string, clave: string) => {
    navigator.clipboard.writeText(texto.replace(/\s+/g, ''))
    setCopiado(clave)
    setTimeout(() => setCopiado(null), 2500)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Fondo oscuro translúcido con desenfoque */}
      <div 
        onClick={onClose} 
        style={{ position: 'absolute', inset: 0, background: 'rgba(5, 7, 12, 0.85)', backdropFilter: 'blur(12px)' }} 
      />

      {/* Ventana Modal */}
      <div 
        className="card" 
        style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: 530, 
          maxHeight: '92vh', 
          overflowY: 'auto', 
          zIndex: 1001, 
          animation: 'slideUp 0.25s ease-out' 
        }}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-4">
          <div>
            <span className="pill text-[10.5px] px-2.5 py-0.5 text-amber-300 border-amber-400/40 font-semibold">
              Acceso Ilimitado
            </span>
            <h2 className="section-title m-0 text-2xl mt-1">Hazte Premium</h2>
          </div>
          <button 
            onClick={onClose} 
            className="btn-glass p-2" 
            style={{ borderRadius: '50%' }}
            title="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Beneficios */}
        <div className="space-y-1.5 mb-5 text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">✓</span>
            <span>Consultas y estudios exegéticos <strong>ilimitados</strong> todos los días.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">✓</span>
            <span>Generador de sermones, análisis comparados y personajes sin límite.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">✓</span>
            <span>Exportación en Word (.docx) y soporte prioritario.</span>
          </div>
        </div>

        {/* ── 1. SELECTOR DE PLANES ── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Plan Anual */}
          <button 
            type="button"
            onClick={() => setPlan('anual')}
            className={`p-3.5 rounded-2xl text-left transition-all relative ${
              plan === 'anual' 
                ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_16px_rgba(255,212,104,0.2)]' 
                : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
            }`}
            style={{ border: '1.5px solid' }}
          >
            <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[9px] font-bold px-2 py-0.5 rounded-full">
              MÁS POPULAR
            </span>
            <p className="text-xs text-slate-300 font-medium">Plan Anual</p>
            <p className="text-amber-300 font-bold text-base mt-1">
              $149.000 <span className="text-[10px] text-slate-400 font-normal">COP</span>
            </p>
            <p className="text-[10px] text-green-400 mt-1 font-medium">Ahorras 2 meses</p>
          </button>

          {/* Plan Mensual */}
          <button 
            type="button"
            onClick={() => setPlan('mensual')}
            className={`p-3.5 rounded-2xl text-left transition-all ${
              plan === 'mensual' 
                ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_16px_rgba(255,212,104,0.2)]' 
                : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
            }`}
            style={{ border: '1.5px solid' }}
          >
            <p className="text-xs text-slate-300 font-medium">Plan Mensual</p>
            <p className="text-amber-300 font-bold text-base mt-1">
              $14.900 <span className="text-[10px] text-slate-400 font-normal">COP</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Cancela cuando quieras</p>
          </button>
        </div>

        {/* ── 2. PESTAÑAS DE MÉTODO DE PAGO ── */}
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setMetodo('nequi')}
            className={`pill flex-1 py-2 text-center text-xs font-semibold ${metodo === 'nequi' ? 'pill-active-blue' : ''}`}
          >
            Nequi
          </button>
          
          <button
            type="button"
            onClick={() => setMetodo('daviplata')}
            className={`pill flex-1 py-2 text-center text-xs font-semibold ${metodo === 'daviplata' ? 'pill-active-blue' : ''}`}
          >
            Daviplata
          </button>

          <button
            type="button"
            onClick={() => setMetodo('breb')}
            className={`pill flex-1 py-2 text-center text-xs font-semibold ${metodo === 'breb' ? 'pill-active-blue' : ''}`}
          >
            Llave Bre-B
          </button>
        </div>

        {/* ── 3. CONTENEDOR DE PAGO INTERACTIVO ── */}
        <div className="p-4 rounded-2xl mb-4" style={{ background: 'rgba(20, 28, 44, 0.65)', border: '1px solid rgba(255, 215, 80, 0.25)' }}>
          
          {/* VISTA NEQUI (Con Auto-Zoom al QR) */}
          {metodo === 'nequi' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">Pagar {valorPlan} con Nequi:</span>
                <span className="text-[11px] text-amber-300">Escanea o transfiere</span>
              </div>

              {/* Contenedor Grande con Auto-Zoom */}
              <div className="flex justify-center my-3">
                <div 
                  className="bg-white rounded-2xl shadow-xl border-2 border-amber-400/50 flex items-center justify-center overflow-hidden"
                  style={{ width: 230, height: 230 }}
                >
                  <img 
                    src={QR_NEQUI_IMG} 
                    alt="QR Nequi" 
                    className="w-full h-full object-cover"
                    style={{ 
                      objectPosition: 'center 34%', 
                      transform: 'scale(1.7)' // 👈 Zoom directo al QR de Nequi
                    }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none'
                      const fallback = (e.target as HTMLElement).parentElement?.querySelector('.qr-fallback-nequi') as HTMLElement
                      if (fallback) fallback.style.display = 'flex'
                    }}
                  />
                  <div className="qr-fallback-nequi hidden w-full h-full flex-col items-center justify-center bg-slate-100 rounded-lg text-slate-800 p-2 text-center">
                    <QrCode size={44} className="text-slate-700 mb-1" />
                    <span className="text-xs font-bold">QR Nequi</span>
                    <span className="text-[9px] text-slate-600">Sube qr-nequi.jpg a /public</span>
                  </div>
                </div>
              </div>

              {/* Número Nequi */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-700/60">
                <div>
                  <p className="text-[10px] text-slate-400">Número de Nequi:</p>
                  <p className="text-sm text-white font-mono font-bold tracking-wider">{NUMERO_NEQUI}</p>
                </div>
                <button 
                  onClick={() => handleCopiar(NUMERO_NEQUI, 'nequi')}
                  className="btn-secondary text-xs px-3 py-1.5"
                  type="button"
                >
                  {copiado === 'nequi' ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                  <span>{copiado === 'nequi' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          )}

          {/* VISTA DAVIPLATA (SOLO NÚMERO) */}
          {metodo === 'daviplata' && (
            <div className="space-y-3 py-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">Pagar {valorPlan} con Daviplata:</span>
                <span className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                  <Smartphone size={13} /> Transferencia directa
                </span>
              </div>

              <p className="text-[11.5px] text-slate-300 leading-relaxed">
                Abre tu app <strong>Daviplata</strong>, selecciona <strong>"Pasar Plata"</strong> a otro Daviplata y transfiere a este número:
              </p>

              {/* Número Daviplata destacado */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-red-500/30 my-2 shadow-inner">
                <div>
                  <p className="text-[10px] text-red-300/80 font-medium uppercase tracking-wider">Número de Daviplata</p>
                  <p className="text-base text-white font-mono font-bold tracking-wider mt-0.5">{NUMERO_DAVIPLATA}</p>
                </div>
                <button 
                  onClick={() => handleCopiar(NUMERO_DAVIPLATA, 'daviplata')}
                  className="btn-secondary text-xs px-3.5 py-2 font-medium"
                  type="button"
                >
                  {copiado === 'daviplata' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  <span>{copiado === 'daviplata' ? '¡Copiado!' : 'Copiar número'}</span>
                </button>
              </div>
            </div>
          )}

          {/* VISTA LLAVE BRE-B (Con Auto-Zoom al QR) */}
          {metodo === 'breb' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">Pagar {valorPlan} por Bre-B (Cualquier Banco):</span>
                <span className="text-[11px] text-emerald-400 font-semibold">Interoperable</span>
              </div>

              {/* Contenedor Grande con Auto-Zoom */}
              <div className="flex justify-center my-3">
                <div 
                  className="bg-white rounded-2xl shadow-xl border-2 border-emerald-400/50 flex items-center justify-center overflow-hidden"
                  style={{ width: 230, height: 230 }}
                >
                  <img 
                    src={QR_BREB_IMG} 
                    alt="QR Bre-B" 
                    className="w-full h-full object-cover"
                    style={{ 
                      objectPosition: 'center 50%', 
                      transform: 'scale(1.5)' // 👈 Zoom directo al QR de Bre-B
                    }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none'
                      const fallback = (e.target as HTMLElement).parentElement?.querySelector('.qr-fallback-breb') as HTMLElement
                      if (fallback) fallback.style.display = 'flex'
                    }}
                  />
                  <div className="qr-fallback-breb hidden w-full h-full flex-col items-center justify-center bg-slate-100 rounded-lg text-slate-800 p-2 text-center">
                    <QrCode size={44} className="text-emerald-700 mb-1" />
                    <span className="text-xs font-bold">QR Bre-B</span>
                    <span className="text-[9px] text-slate-600">Sube qr-breb.jpg a /public</span>
                  </div>
                </div>
              </div>

              <p className="text-[11.5px] text-slate-300 leading-relaxed">
                Transfiere desde cualquier banco en Colombia (Bancolombia, Davivienda, Nu, etc.) usando la <strong>Llave Bre-B</strong> o escaneando el QR:
              </p>

              {/* Llave Bre-B */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-700/60 my-2">
                <div>
                  <p className="text-[10px] text-slate-400">Llave Bre-B registrada:</p>
                  <p className="text-sm text-white font-mono font-bold tracking-wider">{LLAVE_BREB}</p>
                </div>
                <button 
                  onClick={() => handleCopiar(LLAVE_BREB, 'breb')}
                  className="btn-secondary text-xs px-3 py-1.5"
                  type="button"
                >
                  {copiado === 'breb' ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                  <span>{copiado === 'breb' ? 'Copiada' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Titular de la cuenta */}
          <div className="pt-2 mt-2 border-t border-slate-700/40 text-[11px] text-slate-300 flex items-center justify-between">
            <span>Titular de la cuenta:</span>
            <strong className="text-amber-200">{NOMBRE_TITULAR}</strong>
          </div>
        </div>

        {/* ── 4. SECCIÓN WHATSAPP DE ACTIVACIÓN ── */}
        <div className="p-3.5 rounded-2xl mb-4 bg-slate-900/50 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-400">WhatsApp de soporte y activación:</span>
            <strong className="text-xs text-amber-300 font-mono">{WHATSAPP_VISIBLE}</strong>
          </div>

          <a 
            href={urlWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold w-full text-center flex items-center justify-center gap-2 py-3 text-xs font-bold"
          >
            <MessageCircle size={16} />
            <span>Enviar comprobante por WhatsApp</span>
          </a>
        </div>

        <p className="text-center text-[10.5px] text-slate-400 m-0">
          Tu cuenta registrada (<strong>{emailUsuario}</strong>) se activará inmediatamente tras validar el comprobante.
        </p>
      </div>
    </div>
  )
}

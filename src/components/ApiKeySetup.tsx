'use client'
import { useState } from 'react'
import { Key, ExternalLink, Eye, EyeOff, Zap } from 'lucide-react'
import { setApiKey } from '@/lib/storage'

interface Props { onSave: (key: string) => void }

export default function ApiKeySetup({ onSave }: Props) {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')

  const testKey = async () => {
    if (!key.trim()) return
    setTesting(true); setError('')
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hola' }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        }
      )
      if (res.ok) {
        setApiKey(key.trim())
        onSave(key.trim())
      } else {
        const d = await res.json()
        setError(d?.error?.message || 'API Key inválida. Verifica que sea correcta.')
      }
    } catch {
      setError('Error de conexión. Verifica tu internet.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div style={{ animation: 'slideUp 0.5s ease-out' }} className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📜</div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Crimson Pro, serif', color: 'var(--gold)' }}>
            Estudio Bíblico Pro
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            Exégesis académica con inteligencia artificial
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg" style={{ background: 'var(--gold-dim)' }}>
              <Key size={20} style={{ color: 'var(--gold)' }} />
            </div>
            <div>
              <h2 className="font-semibold text-base">Conecta tu API Key de Gemini</h2>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Gratis · Se guarda solo en tu dispositivo</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                className="input-field pr-12"
                placeholder="AIza..."
                value={key}
                onChange={e => setKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && testKey()}
              />
              <button onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
                style={{ color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="text-xs p-3 rounded-lg" style={{ background: '#7f1d1d33', color: '#ef4444', border: '1px solid #7f1d1d' }}>
                ⚠️ {error}
              </div>
            )}

            <button onClick={testKey} disabled={!key.trim() || testing} className="btn-primary w-full justify-center">
              {testing
                ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Verificando...</>
                : <><Zap size={16} /> Conectar y comenzar</>}
            </button>
          </div>

          <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--navy-border)' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
              ¿Cómo obtener tu API Key gratis?
            </p>
            <ol className="space-y-2">
              {[
                'Ve a aistudio.google.com con tu cuenta Google',
                'Haz clic en "Get API Key" → "Create API key"',
                'Copia la key y pégala arriba',
              ].map((step, i) => (
                <li key={i} className="flex gap-2 text-xs" style={{ color: 'var(--text-dim)' }}>
                  <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}>{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener"
              className="mt-4 flex items-center gap-2 text-xs btn-secondary w-full justify-center">
              <ExternalLink size={13} /> Ir a Google AI Studio
            </a>
          </div>

          <p className="text-center text-xs mt-4" style={{ color: 'var(--text-dim)' }}>
            🔒 Tu API Key nunca sale de tu dispositivo
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}

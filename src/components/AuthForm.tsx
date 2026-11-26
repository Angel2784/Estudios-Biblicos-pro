'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  mode: 'sign-in' | 'sign-up'
}

export default function AuthForm({ mode }: Props) {
  const params = useSearchParams()
  const redirect = params.get('redirect') || '/'

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkEmail, setCheckEmail] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const supabase = createClient()

  const handleGoogle = async () => {
    if (mode === 'sign-up' && !acceptedTerms) {
      setError('Debes aceptar los Términos y la Política de Privacidad para crear una cuenta.')
      return
    }
    try {
      setGoogleLoading(true)
      setError('')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
        },
      })
      if (error) {
        setError(error.message)
        setGoogleLoading(false)
      }
    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error inesperado al conectar con Google.')
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    if (mode === 'sign-up' && !acceptedTerms) {
      setError('Debes aceptar los Términos y la Política de Privacidad para crear una cuenta.')
      return
    }
    setLoading(true)
    setError('')

    try {
      if (mode === 'sign-up') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              first_name: firstName.trim() || null,
              last_name: lastName.trim() || null,
              terminos_aceptados_en: new Date().toISOString()
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
          },
        })
        if (error) {
          setError(error.message)
          setLoading(false)
        } else {
          setCheckEmail(true)
          setLoading(false)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) {
          setError(error.message)
          setLoading(false)
        } else {
          window.location.href = redirect || '/'
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Error al procesar la solicitud.')
      setLoading(false)
    }
  }

  return (
    <div className="card w-full max-w-md relative overflow-hidden" style={{ padding: 32 }}>
      {/* Resplandor dorado decorativo */}
      <div
        className="absolute -top-12 -left-12 w-32 h-32 rounded-full blur-2xl pointer-events-none"
        style={{ background: 'rgba(254, 212, 104, 0.15)' }}
      />

      {/* Encabezado */}
      <div className="text-center mb-6 relative z-10">
        <h2 className="section-title" style={{ fontSize: '1.6rem', justifyContent: 'center', width: '100%' }}>
          {mode === 'sign-in' ? 'Bienvenido de nuevo' : 'Crear una cuenta'}
        </h2>
        <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
          {mode === 'sign-in' ? 'Inicia sesión para continuar' : 'Regístrate para comenzar a estudiar la Palabra'}
        </p>
      </div>

      {checkEmail ? (
        <div
          className="text-center space-y-3 relative z-10"
          style={{
            padding: 16, borderRadius: 16,
            background: 'rgba(74, 222, 128, 0.08)',
            border: '1px solid rgba(74, 222, 128, 0.35)',
          }}
        >
          <CheckCircle2 className="w-10 h-10 mx-auto" style={{ color: 'var(--green)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>¡Revisa tu correo electrónico!</h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Hemos enviado un enlace de confirmación a{' '}
            <span style={{ color: 'var(--gold-light)', fontWeight: 600 }}>{email}</span>.
          </p>
          <Link
            href="/sign-in"
            className="inline-block mt-2 text-xs font-medium hover:underline"
            style={{ color: 'var(--gold-glow)' }}
          >
            Volver a Iniciar Sesión
          </Link>
        </div>
      ) : (
        <div className="relative z-10">
          {/* Checkbox de aceptación de Términos y Privacidad (solo en registro) */}
          {mode === 'sign-up' && (
            <label
              className="flex items-start gap-2 mb-4 cursor-pointer select-none"
              style={{ fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.5 }}
            >
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => { setAcceptedTerms(e.target.checked); if (error) setError('') }}
                className="mt-0.5"
                style={{ accentColor: 'var(--gold-glow)', width: 14, height: 14, flexShrink: 0 }}
              />
              <span>
                Acepto los{' '}
                <Link href="/terminos" target="_blank" className="hover:underline font-medium" style={{ color: 'var(--gold-light)' }}>
                  Términos y Condiciones
                </Link>{' '}
                y la{' '}
                <Link href="/privacidad" target="_blank" className="hover:underline font-medium" style={{ color: 'var(--gold-light)' }}>
                  Política de Privacidad
                </Link>
              </span>
            </label>
          )}

          {/* Botón de Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading || (mode === 'sign-up' && !acceptedTerms)}
            className="btn-glass w-full justify-center"
            style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, opacity: (googleLoading || loading || (mode === 'sign-up' && !acceptedTerms)) ? 0.5 : 1 }}
          >
            {googleLoading ? (
              <div
                className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{ borderColor: 'var(--gold-glow)', borderTopColor: 'transparent' }}
              />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z" />
                <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
              </svg>
            )}
            <span>Continuar con Google</span>
          </button>

          {/* Aviso para cuentas nuevas creadas vía Google desde sign-in */}
          {mode === 'sign-in' && (
            <p className="text-center mt-2.5" style={{ fontSize: 10.5, color: 'var(--text-dim)', lineHeight: 1.4 }}>
              Si es tu primera vez, al continuar con Google aceptas nuestros{' '}
              <Link href="/terminos" target="_blank" className="hover:underline" style={{ color: 'var(--gold-light)' }}>
                Términos
              </Link>{' '}
              y{' '}
              <Link href="/privacidad" target="_blank" className="hover:underline" style={{ color: 'var(--gold-light)' }}>
                Política de Privacidad
              </Link>.
            </p>
          )}

          {/* Divisor */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid var(--navy-border)' }} />
            </div>
            <span
              className="relative px-3 text-xs uppercase"
              style={{ background: 'rgba(14, 18, 30, 0.9)', color: 'var(--text-dim)' }}
            >
              o
            </span>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div
              className="mb-4 flex items-start gap-2.5 text-xs"
              style={{
                padding: 12, borderRadius: 14,
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--red)' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'sign-up' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Nombre</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
                    <input
                      type="text" required placeholder="Juan"
                      value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      className="input-gold" style={{ padding: '10px 12px 10px 34px', fontSize: 12 }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Apellido</label>
                  <input
                    type="text" placeholder="Pérez"
                    value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className="input-gold" style={{ padding: '10px 12px', fontSize: 12 }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Correo electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
                <input
                  type="email" required placeholder="pastor@iglesia.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-gold" style={{ padding: '10px 12px 10px 34px', fontSize: 12 }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
                <input
                  type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input-gold" style={{ padding: '10px 40px 10px 34px', fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading || (mode === 'sign-up' && !acceptedTerms)}
              className="btn-gold w-full mt-2"
              style={{ padding: '14px 26px', opacity: (loading || googleLoading || (mode === 'sign-up' && !acceptedTerms)) ? 0.5 : 1 }}
            >
              {loading ? (
                <div
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: '#1a1102', borderTopColor: 'transparent' }}
                />
              ) : (
                <span>Continuar</span>
              )}
            </button>
          </form>

          {/* Enlace alternativo */}
          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-dim)' }}>
            {mode === 'sign-in' ? '¿No tienes cuenta? ' : '¿Ya tienes una cuenta? '}
            <Link
              href={mode === 'sign-in' ? `/sign-up?redirect=${encodeURIComponent(redirect)}` : `/sign-in?redirect=${encodeURIComponent(redirect)}`}
              className="font-semibold hover:underline"
              style={{ color: 'var(--gold-light)' }}
            >
              {mode === 'sign-in' ? 'Regístrate' : 'Inicia Sesión'}
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}

'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function AccountPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/sign-in'); return }
      setUser(data.user)
    })
  }, [])

  const cambiarPassword = async () => {
    if (password.trim().length < 6) { setMsg('Mínimo 6 caracteres.'); return }
    setLoading(true); setMsg('')
    const { error } = await supabase.auth.updateUser({ password: password.trim() })
    setLoading(false)
    setMsg(error ? error.message : 'Contraseña actualizada correctamente.')
    setPassword('')
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--navy)' }}>
      <div className="card" style={{ maxWidth: 420, width: '100%' }}>
        <h1 className="section-title" style={{ fontSize: '1.3rem', display: 'block', marginBottom: 4 }}>Administrar cuenta</h1>
        <p className="text-xs mb-5" style={{ color: 'var(--text-dim)' }}>{user.email}</p>

        <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Nueva contraseña</label>
        <input
          className="input-field w-full mt-1"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {msg && <p className="text-xs mt-2" style={{ color: msg.includes('actualizada') ? 'var(--green)' : '#fca5a5' }}>{msg}</p>}

        <button onClick={cambiarPassword} disabled={loading} className="btn-gold active w-full mt-4" style={{ justifyContent: 'center', padding: '10px 14px' }}>
          {loading ? 'Guardando...' : 'Actualizar contraseña'}
        </button>

        <button onClick={() => router.push('/')} className="btn-secondary w-full mt-2.5" style={{ justifyContent: 'center', padding: '10px 14px' }}>
          Volver a la app
        </button>
      </div>
    </div>
  )
}

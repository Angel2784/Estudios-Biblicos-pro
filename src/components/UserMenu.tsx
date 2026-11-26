'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface Props {
  user?: User | null
}

export default function UserMenu({ user: propUser }: Props = {}) {
  const [user, setUser] = useState<User | null>(propUser ?? null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (propUser !== undefined) {
      setUser(propUser)
    } else {
      supabase.auth.getUser().then(({ data }) => setUser(data.user))
    }
  }, [propUser, supabase])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <a
          href="/sign-in"
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1a2030] transition border border-[#242c3f]"
        >
          Entrar
        </a>
        <a
          href="/sign-up"
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#d4a029] text-black hover:brightness-110 transition shadow-sm"
        >
          Crear cuenta
        </a>
      </div>
    )
  }
  const email = user.email || ''
  const initial = (email[0] || 'a').toLowerCase()
  const displayName = (user.user_metadata?.first_name as string) || 'Usuario'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px',
        }}
        title={email}
      >
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'var(--gold-dim, rgba(255,215,80,0.2))',
          color: 'var(--gold-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 13, textTransform: 'lowercase', flexShrink: 0,
        }}>
          {initial}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }} className="hidden sm:inline">
          {displayName}
        </span>
        <ChevronDown size={14} style={{ color: 'var(--text-dim)' }} />
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: 'absolute', right: 0, top: 40, width: 260,
            padding: 0, overflow: 'hidden', zIndex: 60,
            background: 'rgba(10,13,22,0.97) !important' as string,
          }}
        >
          <div className="flex items-center gap-2.5 px-4 py-3.5" style={{ borderBottom: '1px solid var(--navy-border)' }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: 'var(--gold-dim, rgba(255,215,80,0.2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-light)', fontWeight: 700,
            }}>
              {initial}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p className="text-xs font-semibold m-0" style={{ color: 'var(--text-primary)' }}>
                {displayName}
              </p>
              <p className="text-[11px] m-0 truncate" style={{ color: 'var(--text-dim)' }}>{email}</p>
            </div>
          </div>
          <button
            onClick={() => { setOpen(false); router.push('/account') }}
            className="w-full text-left px-4 py-2.5 text-xs"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            Administrar cuenta
          </button>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2.5 text-xs"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', borderTop: '1px solid var(--navy-border)' }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

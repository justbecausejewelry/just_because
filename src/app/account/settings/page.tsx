'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabaseAuth } from '@/lib/auth'

export default function AccountSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const check = async () => {
      const {
        data: { user: currentUser },
      } = await supabaseAuth.auth.getUser()

      if (!currentUser) {
        router.replace('/login?redirect=/account/settings')
        return
      }

      setUser(currentUser)
    }

    void check()
  }, [router])

  if (!user) {
    return (
      <main style={{ minHeight: '100vh', background: '#FBF5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B8A090', fontFamily: 'var(--font-playfair)', fontSize: '20px' }}>
        Loading settings...
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FBF5F0', maxWidth: '760px', margin: '0 auto', padding: '60px 24px' }}>
      <Link href="/account" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.08em' }}>{'<-'} Back to account</Link>
      <section style={{ marginTop: '32px', background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '28px' }}>
        <p className="eyebrow-luxury" style={{ marginBottom: '10px' }}>PROFILE</p>
        <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '32px', fontWeight: 400, margin: 0 }}>Account Settings</h1>
        <div style={{ display: 'grid', gap: '16px', marginTop: '28px' }}>
          <label>
            <span className="eyebrow-luxury" style={{ display: 'block', marginBottom: '8px' }}>EMAIL</span>
            <input className="input-luxury" value={user.email || ''} readOnly />
          </label>
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.7, margin: 0 }}>
            Profile editing is intentionally minimal in this prototype. Auth identity is managed by Supabase.
          </p>
        </div>
      </section>
    </main>
  )
}

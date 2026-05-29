"use client"

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { checkIsAdmin, clearAdminCache } from '@/lib/adminAuth'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart2,
  Users,
  Tag,
  MessageSquare,
  Diamond,
  LogOut,
  ChevronRight,
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/diamonds', label: 'Diamonds', icon: Diamond },
  { href: '/admin/discount-codes', label: 'Discount Codes', icon: Tag },
  { href: '/admin/support', label: 'Support', icon: MessageSquare },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [adminName, setAdminName] = useState('')

  useEffect(() => {
    checkIsAdmin().then(({ isAdmin }) => {
      if (!isAdmin) {
        router.replace('/')
        return
      }
      setAllowed(true)
      setChecking(false)
    }).catch(() => {
      router.replace('/')
      setChecking(false)
    })

    supabase.auth.getUser().then(({ data: { user } }) => {
      const name = typeof user?.user_metadata?.name === 'string' && user.user_metadata.name.trim()
        ? user.user_metadata.name
        : user?.email?.split('@')[0] || 'Admin'
      setAdminName(name)
    })
  }, [router])

  const handleSignOut = async () => {
    clearAdminCache()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (checking) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF5F0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-italianno)', fontSize: '48px', color: '#C9A961' }}>just</div>
          <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#B8A090', fontFamily: 'var(--font-inter)', marginTop: '8px' }}>LOADING...</div>
        </div>
      </div>
    )
  }

  if (!allowed) return null

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#FBF5F0', overflow: 'hidden' }}>
      <aside style={{ width: '220px', flexShrink: 0, background: '#1A1014', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <div style={{ padding: '28px 24px 20px', borderBottom: '0.5px solid rgba(201,169,97,0.15)' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-italianno)', fontSize: '28px', color: '#C9A961', lineHeight: 0.9 }}>just</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <div style={{ width: '10px', height: '0.5px', background: 'rgba(201,169,97,0.4)' }} />
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '8px', letterSpacing: '0.35em', color: 'rgba(201,169,97,0.6)' }}>BECAUSE</span>
              <div style={{ width: '10px', height: '0.5px', background: 'rgba(201,169,97,0.4)' }} />
            </div>
          </Link>
          <div style={{ fontSize: '9px', color: 'rgba(184,160,144,0.5)', fontFamily: 'var(--font-inter)', letterSpacing: '0.2em', marginTop: '8px' }}>
            ADMIN PANEL
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {sidebarLinks.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 20px',
                  textDecoration: 'none',
                  background: active ? 'rgba(201,169,97,0.12)' : 'transparent',
                  borderLeft: active ? '2px solid #C9A961' : '2px solid transparent',
                  transition: 'all 0.2s',
                  color: active ? '#C9A961' : 'rgba(184,160,144,0.7)',
                }}
                onMouseEnter={(event) => {
                  if (!active) {
                    event.currentTarget.style.background = 'rgba(201,169,97,0.06)'
                    event.currentTarget.style.color = 'rgba(251,245,240,0.8)'
                  }
                }}
                onMouseLeave={(event) => {
                  if (!active) {
                    event.currentTarget.style.background = 'transparent'
                    event.currentTarget.style.color = 'rgba(184,160,144,0.7)'
                  }
                }}
              >
                <Icon size={16} strokeWidth={1.5} />
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', letterSpacing: '0.04em', fontWeight: active ? 500 : 400 }}>
                  {label}
                </span>
                {active && <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '0.5px solid rgba(201,169,97,0.15)' }}>
          <Link
            href="/"
            target="_blank"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', textDecoration: 'none', color: 'rgba(201,169,97,0.6)', fontSize: '11px', fontFamily: 'var(--font-inter)', marginBottom: '8px', transition: 'color 0.2s' }}
            onMouseEnter={(event) => event.currentTarget.style.color = '#C9A961'}
            onMouseLeave={(event) => event.currentTarget.style.color = 'rgba(201,169,97,0.6)'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            VIEW STORE
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0 8px', borderTop: '0.5px solid rgba(201,169,97,0.1)' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(201,169,97,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-playfair)', fontSize: '14px', color: '#C9A961' }}>
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', color: 'rgba(251,245,240,0.8)', fontFamily: 'var(--font-inter)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adminName}</div>
              <div style={{ fontSize: '9px', color: 'rgba(201,169,97,0.5)', letterSpacing: '0.15em' }}>ADMIN</div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(184,160,144,0.5)', fontSize: '11px', fontFamily: 'var(--font-inter)', padding: '6px 0', width: '100%', transition: 'color 0.2s' }}
            onMouseEnter={(event) => event.currentTarget.style.color = '#A85C6A'}
            onMouseLeave={(event) => event.currentTarget.style.color = 'rgba(184,160,144,0.5)'}
          >
            <LogOut size={13} strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', background: '#FBF5F0' }}>
        {children}
      </main>
    </div>
  )
}

"use client"

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { forceSignOut } from '@/lib/forceSignOut'
import { getAdminAccessToken } from '@/lib/adminSession'
import { getSettledBrowserSession } from '@/lib/supabase'
import { useRole } from '@/hooks/useRole'
import { BrandLogo } from '@/components/ui/BrandLogo'
import {
  LayoutDashboard,
  Package,
  RotateCcw,
  ShoppingBag,
  BarChart2,
  Users,
  Tag,
  MessageSquare,
  Diamond,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Gem,
} from 'lucide-react'

type SidebarLink = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  exact?: boolean
}

const sidebarLinks: SidebarLink[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/ring-settings', label: 'Ring Settings', icon: Gem },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/returns', label: 'Returns', icon: RotateCcw },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/diamonds', label: 'Diamonds', icon: Diamond },
  { href: '/admin/discount-codes', label: 'Discount Codes', icon: Tag },
  { href: '/admin/discount-codes/analytics', label: 'Discount Analytics', icon: BarChart2 },
  { href: '/admin/support', label: 'Support', icon: MessageSquare },
]

const superAdminLinks: SidebarLink[] = [
  { href: '/admin/users', label: 'Users', icon: Users },
]

export default function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [adminName, setAdminName] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingReturns, setPendingReturns] = useState(0)
  const { role, isAdmin, isSuperAdmin, loading: roleLoading } = useRole()

  useEffect(() => {
    if (roleLoading) return

    if (!isAdmin) {
      setAllowed(false)
      setChecking(false)
      return
    }

    setAllowed(true)
    setChecking(false)

    getSettledBrowserSession().then((session) => {
      const user = session?.user || null
      const name = typeof user?.user_metadata?.name === 'string' && user.user_metadata.name.trim()
        ? user.user_metadata.name
        : user?.email?.split('@')[0] || 'Admin'
      setAdminName(name)
    })
  }, [isAdmin, roleLoading])

  useEffect(() => {
    if (!isAdmin) return

    let cancelled = false

    const loadPendingReturns = async () => {
      const token = await getAdminAccessToken()
      if (!token) return

      try {
        const response = await fetch('/api/admin/returns', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const payload = await response.json() as {
          returns?: Array<{ status: string }>
        }
        if (!cancelled) {
          setPendingReturns((payload.returns || []).filter((item) => item.status === 'requested' || item.status === 'under_review').length)
        }
      } catch {
        if (!cancelled) setPendingReturns(0)
      }
    }

    void loadPendingReturns()

    return () => {
      cancelled = true
    }
  }, [isAdmin, pathname])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  const handleSignOut = async () => {
    await forceSignOut()
  }

  if (checking) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF5F0' }}>
        <div style={{ textAlign: 'center' }}>
          <BrandLogo size="lg" />
          <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#B8A090', fontFamily: 'var(--font-inter)', marginTop: '8px' }}>LOADING...</div>
        </div>
      </div>
    )
  }

  if (!allowed) {
    return (
      <main style={{ alignItems: 'center', background: '#FBF5F0', color: '#1A1014', display: 'flex', justifyContent: 'center', minHeight: '100vh', padding: '40px 20px' }}>
        <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', maxWidth: '440px', padding: '36px 28px', textAlign: 'center' }}>
          <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', margin: '0 0 18px' }}>
            ADMIN
          </p>
          <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '30px', fontWeight: 400, margin: '0 0 12px' }}>
            Admin access is not available yet.
          </h1>
          <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '13px', lineHeight: 1.7, margin: '0 0 24px' }}>
            Your storefront session was not signed out. Return to your account and try the admin panel again once the role check finishes.
          </p>
          <Link
            href="/account"
            style={{
              background: '#1A1014',
              color: '#FBF5F0',
              display: 'inline-block',
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              letterSpacing: '0.18em',
              padding: '14px 22px',
              textDecoration: 'none',
            }}
          >
            BACK TO ACCOUNT
          </Link>
        </section>
      </main>
    )
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const visibleSidebarLinks = isSuperAdmin
    ? [...sidebarLinks, ...superAdminLinks]
    : sidebarLinks

  const currentPageLabel = visibleSidebarLinks.find(({ href, exact }) => isActive(href, exact))?.label || 'Admin'

  const SidebarContent = () => (
    <aside
      style={{
        width: '220px',
        flexShrink: 0,
        background: '#1A1014',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '0.5px solid rgba(201,169,97,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <Link href="/" className="shrink-0 select-none" style={{ textDecoration: 'none' }}>
          <BrandLogo size="sm" />
          <div style={{ fontSize: '9px', color: 'rgba(184,160,144,0.5)', fontFamily: 'var(--font-inter)', letterSpacing: '0.2em', marginTop: '8px' }}>
            ADMIN PANEL
          </div>
        </Link>

        <button
          className="admin-close-btn"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close admin menu"
          style={{
            display: 'none',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(184,160,144,0.7)',
            padding: '4px',
          }}
        >
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {visibleSidebarLinks.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 20px',
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
              <span style={{ flex: 1, fontSize: '12px', fontFamily: 'var(--font-inter)', letterSpacing: '0.04em', fontWeight: active ? 500 : 400 }}>
                {label}
              </span>
              {href === '/admin/returns' && pendingReturns > 0 ? (
                <span style={{ background: '#C9A961', borderRadius: '999px', color: '#1A1014', fontSize: '10px', fontWeight: 500, lineHeight: 1, padding: '3px 7px' }}>
                  {pendingReturns}
                </span>
              ) : null}
              {active && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
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
          <ExternalLink size={12} strokeWidth={1.5} />
          VIEW STORE
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0 8px', borderTop: '0.5px solid rgba(201,169,97,0.1)' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(201,169,97,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-playfair)', fontSize: '14px', color: '#C9A961' }}>
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', color: 'rgba(251,245,240,0.8)', fontFamily: 'var(--font-inter)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adminName}</div>
            <div style={{ fontSize: '9px', color: 'rgba(201,169,97,0.5)', letterSpacing: '0.15em' }}>
              {role === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN'}
            </div>
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
  )

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .admin-close-btn {
            display: flex !important;
          }
          .admin-desktop-sidebar {
            display: none !important;
          }
          .admin-mobile-topbar {
            display: flex !important;
          }
          .admin-mobile-drawer {
            display: flex !important;
          }
          .admin-main-content {
            padding: 16px !important;
          }
        }
        @media (min-width: 769px) {
          .admin-mobile-drawer,
          .admin-mobile-backdrop {
            display: none !important;
          }
          .admin-mobile-topbar {
            display: none !important;
          }
        }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: '#FBF5F0', overflow: 'hidden', position: 'relative' }}>
        <div className="admin-desktop-sidebar" style={{ height: '100vh', flexShrink: 0 }}>
          <SidebarContent />
        </div>

        {sidebarOpen && (
          <button
            className="admin-mobile-backdrop"
            aria-label="Close admin menu backdrop"
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(26,16,20,0.62)',
              backdropFilter: 'blur(4px)',
              border: 'none',
              padding: 0,
              zIndex: 200,
            }}
          />
        )}

        <div
          className="admin-mobile-drawer"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            zIndex: 201,
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <SidebarContent />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div
            className="admin-mobile-topbar"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
            background: '#1A1014',
            borderBottom: '0.5px solid rgba(201,169,97,0.15)',
            flexShrink: 0,
            height: '52px',
          }}
        >
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin menu"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#C9A961',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Menu size={22} color="#C9A961" />
            </button>

            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(201,169,97,0.8)', textTransform: 'uppercase' }}>
              {currentPageLabel}
            </div>

            <Link
              href="/"
              target="_blank"
              aria-label="View store"
              style={{ display: 'flex', alignItems: 'center', color: 'rgba(184,160,144,0.6)', padding: '4px', textDecoration: 'none' }}
            >
              <ExternalLink size={16} strokeWidth={1.5} />
            </Link>
          </div>

          <main className="admin-main-content" style={{ flex: 1, overflowY: 'auto', background: '#FBF5F0' }}>
            {children}
          </main>
        </div>
      </div>
    </>
  )
}

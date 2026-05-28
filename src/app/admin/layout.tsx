'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart2,
  Bell,
  Gem,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  ShoppingBag,
  Tag,
  Users,
} from 'lucide-react'
import { signOut, supabaseAuth } from '@/lib/auth'

const ADMIN_EMAILS = [
  'ujjwalbana@gmail.com',
  'jesse@gmail.com',
]

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
  { label: 'Diamonds', href: '/admin/diamonds', icon: Gem },
  { label: 'Discount', href: '/admin/discount-codes', icon: Tag },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Support', href: '/admin/support', icon: MessageSquare },
]

function titleFor(pathname: string) {
  if (pathname === '/admin') return 'Dashboard'
  if (pathname.includes('/products/new')) return 'Add Product'
  if (pathname.includes('/products/') && pathname !== '/admin/products') return 'Edit Product'
  const match = navItems.find((item) => item.href === pathname)
  return match?.label || 'Admin Panel'
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState('')
  const [isChecking, setIsChecking] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [supportUnreadCount, setSupportUnreadCount] = useState(0)
  const [ordersReceivedCount, setOrdersReceivedCount] = useState(0)
  const title = useMemo(() => titleFor(pathname), [pathname])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-dropdown="admin-avatar"]')) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const check = async () => {
      const {
        data: { user },
      } = await supabaseAuth.auth.getUser()

      if (!user) {
        router.replace('/login?redirect=/admin')
        return
      }

      if (!ADMIN_EMAILS.includes(user.email || '')) {
        router.replace('/')
        return
      }

      setEmail(user.email || '')
      setIsChecking(false)
    }

    void check()
  }, [router])

  useEffect(() => {
    const loadBadges = async () => {
      try {
        const supportResponse = await fetch('/api/admin/conversations')
        const payload = (await supportResponse.json()) as {
          conversations?: Array<{ isReadByAdmin?: boolean }>
        }
        const count = (payload.conversations || []).filter((item) => item.isReadByAdmin === false).length
        setSupportUnreadCount(count)
      } catch {
        setSupportUnreadCount(0)
      }

      const { count } = await supabaseAuth
        .from('Order')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'received')

      setOrdersReceivedCount(count || 0)
    }

    void loadBadges()
  }, [pathname])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#FBF5F0', color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px' }}>
        Checking admin access...
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0EB' }}>
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[260px] flex-col lg:flex" style={{ backgroundColor: '#1A1014' }}>
        <div style={{ borderBottom: '0.5px solid rgba(201,169,97,0.2)', padding: '28px 24px' }}>
          <div className="flex items-baseline gap-1">
            <span style={{ color: '#C9A961', fontFamily: 'var(--font-italianno)', fontSize: '30px', lineHeight: 1 }}>just</span>
            <span style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 500, letterSpacing: '0.24em' }}>BECAUSE</span>
          </div>
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px', marginTop: '5px' }}>Admin Panel</p>
        </div>

        <nav className="flex-1" style={{ padding: '16px 12px' }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className="admin-sidebar-link mb-1 flex items-center gap-3"
                style={{
                  backgroundColor: isActive ? 'rgba(201,169,97,0.12)' : 'transparent',
                  borderRadius: '4px',
                  color: isActive ? '#C9A961' : '#B8A090',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '13px',
                  padding: '11px 14px',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={17} />
                {item.label}
                {item.href === '/admin/support' && supportUnreadCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#E8C4D0', color: '#6B2D44', borderRadius: '999px', fontSize: '10px', padding: '1px 7px' }}>
                    {supportUnreadCount}
                  </span>
                )}
                {item.href === '/admin/orders' && ordersReceivedCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#C9A961', color: '#1A1014', borderRadius: '999px', fontSize: '10px', padding: '1px 7px' }}>
                    {ordersReceivedCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div style={{ borderTop: '0.5px solid rgba(201,169,97,0.2)', padding: '16px 12px' }}>
          <div className="mb-4 flex items-center gap-3" style={{ padding: '0 8px' }}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: '#C9A961', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '13px', fontWeight: 500 }}>U</span>
            <span>
              <span style={{ color: '#FBF5F0', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>Ujjwal Bana</span>
              <span style={{ color: '#B8A090', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '10px' }}>{email}</span>
            </span>
          </div>
          <button onClick={handleSignOut} className="flex w-full items-center gap-3" style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px', padding: '11px 14px' }}>
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:ml-[260px]">
        <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 lg:px-8" style={{ backgroundColor: '#FBF5F0', borderBottom: '0.5px solid #EDD9AF' }}>
          <div>
            <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '4px' }}>ADMIN</p>
            <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 400, margin: 0 }}>{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Bell color="#1A1014" size={19} />
            <div data-dropdown="admin-avatar" style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#C9A961',
                  color: '#1A1014',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-inter)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                U
              </button>

              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  background: '#FBF5F0',
                  border: '0.5px solid #EDD9AF',
                  borderRadius: '4px',
                  boxShadow: '0 8px 32px rgba(26,16,20,0.12)',
                  minWidth: '200px',
                  zIndex: 1000,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '14px 16px',
                    borderBottom: '0.5px solid #EDD9AF',
                  }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#1A1014',
                      fontFamily: 'var(--font-inter)',
                    }}>Ujjwal Bana</div>
                    <div style={{
                      fontSize: '11px',
                      color: '#B8A090',
                      marginTop: '2px',
                      fontFamily: 'var(--font-inter)',
                    }}>ujjwalbana@gmail.com</div>
                    <div style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      background: '#EDD9AF',
                      color: '#6B4A10',
                      fontSize: '9px',
                      padding: '2px 8px',
                      letterSpacing: '0.15em',
                      fontFamily: 'var(--font-inter)',
                    }}>SUPER ADMIN</div>
                  </div>

                  <div style={{ padding: '8px 0' }}>
                    <Link href="/admin" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 16px',
                      fontSize: '13px',
                      color: '#1A1014',
                      textDecoration: 'none',
                      fontFamily: 'var(--font-inter)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(event) => event.currentTarget.style.background = '#F5E8ED'}
                    onMouseLeave={(event) => event.currentTarget.style.background = 'transparent'}
                    onClick={() => setShowDropdown(false)}
                    >
                      Dashboard
                    </Link>

                    <Link href="/" target="_blank" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 16px',
                      fontSize: '13px',
                      color: '#1A1014',
                      textDecoration: 'none',
                      fontFamily: 'var(--font-inter)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(event) => event.currentTarget.style.background = '#F5E8ED'}
                    onMouseLeave={(event) => event.currentTarget.style.background = 'transparent'}
                    onClick={() => setShowDropdown(false)}
                    >
                      View Store ↗
                    </Link>

                    <div style={{
                      borderTop: '0.5px solid #EDD9AF',
                      margin: '8px 0',
                    }} />

                    <button
                      onClick={async () => {
                        setShowDropdown(false)
                        const { supabaseAuth } = await import('@/lib/auth')
                        await supabaseAuth.auth.signOut()
                        window.location.href = '/login'
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 16px',
                        fontSize: '13px',
                        color: '#A85C6A',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        fontFamily: 'var(--font-inter)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(event) => event.currentTarget.style.background = '#FFF0F0'}
                      onMouseLeave={(event) => event.currentTarget.style.background = 'transparent'}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, MessageSquare, RotateCcw, Settings, ShoppingBag } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { getSettledBrowserSession, getStoredAccountUser, supabase, SUPABASE_AUTH_STORAGE_KEY } from '@/lib/supabase'
import { forceSignOut } from '@/lib/forceSignOut'
import { getOrCreateProfile, type UserProfile } from '@/lib/userProfile'
import { useRole } from '@/hooks/useRole'

type MenuCardProps = {
  href: string
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  title: string
  description: string
  badge?: number | null
}

type AccountStats = {
  orders: number | null
  wishlist: number | null
  unreadMessages: number | null
}

const LOGIN_HANDOFF_KEY = 'jb_login_handoff_v1'

type StoredAuthSession = {
  access_token: string
  refresh_token?: string
  expires_at?: number
  user: User
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function sessionFromUnknown(value: unknown): StoredAuthSession | null {
  if (!isRecord(value)) return null

  const candidate = value.currentSession || value.session || value
  if (!isRecord(candidate)) return null

  const accessToken = candidate.access_token
  const refreshToken = candidate.refresh_token
  const user = candidate.user
  if (typeof accessToken !== 'string' || !isRecord(user)) return null

  const email = user.email
  if (typeof email !== 'string' || !email) return null
  if (typeof user.id !== 'string' || !user.id) return null

  const expiresAt = candidate.expires_at
  if (typeof expiresAt === 'number' && expiresAt < Date.now() / 1000) {
    return null
  }

  return {
    access_token: accessToken,
    refresh_token: typeof refreshToken === 'string' ? refreshToken : undefined,
    expires_at: typeof expiresAt === 'number' ? expiresAt : undefined,
    user: user as unknown as User,
  }
}

function isAuthStorageKey(key: string) {
  return key === SUPABASE_AUTH_STORAGE_KEY
    || key.includes('supabase.auth.token')
    || (key.startsWith('sb-') && key.includes('-auth-token'))
}

function getSessionFromStorage(): StoredAuthSession | null {
  if (typeof window === 'undefined') return null

  try {
    const keys = Object.keys(window.localStorage)

    if (process.env.NODE_ENV === 'development') {
      console.log('localStorage keys:', keys)
      console.log('Looking for auth session...')
    }

    const authKeys = [
      SUPABASE_AUTH_STORAGE_KEY,
      ...keys.filter((key) => key !== SUPABASE_AUTH_STORAGE_KEY && isAuthStorageKey(key)),
    ]

    for (const authKey of authKeys) {
      const raw = window.localStorage.getItem(authKey)
      if (!raw) continue

      const session = sessionFromUnknown(JSON.parse(raw))
      if (session) return session
    }

    return null
  } catch {
    return null
  }
}

function getLoginHandoff(): StoredAuthSession | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(LOGIN_HANDOFF_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null

    const expiresAt = parsed.expiresAt
    if (typeof expiresAt !== 'number' || expiresAt < Date.now()) {
      window.sessionStorage.removeItem(LOGIN_HANDOFF_KEY)
      return null
    }

    const user = parsed.user
    if (!isRecord(user) || typeof user.id !== 'string' || typeof user.email !== 'string') {
      return null
    }

    return {
      access_token: '',
      user: user as unknown as User,
    }
  } catch {
    return null
  }
}

function displayName(user: User | null, profile: UserProfile | null) {
  if (profile?.firstName || profile?.lastName) {
    return `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
  }
  if (!user) return ''
  const name = user.user_metadata?.name
  return typeof name === 'string' && name.trim() ? name : user.email || 'Your account'
}

function initialFor(user: User | null, profile: UserProfile | null) {
  const value = displayName(user, profile)
  return value.charAt(0).toUpperCase() || 'J'
}

function MenuCard({ href, icon: Icon, title, description, badge }: MenuCardProps) {
  return (
    <Link
      href={href}
      className="account-menu-card"
      style={{
        background: '#FDF8F2',
        border: '0.5px solid #EDD9AF',
        borderRadius: '4px',
        padding: '24px',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        transition: 'all 0.2s ease',
        color: '#1A1014',
        position: 'relative',
      }}
    >
      <span
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '4px',
          background: 'rgba(201,169,97,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={20} color="#C9A961" strokeWidth={1.5} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '14px', fontWeight: 500 }}>
          {title}
          {badge ? (
            <span style={{ background: '#E8C4D0', color: '#1A1014', borderRadius: '4px', fontSize: '10px', padding: '1px 7px' }}>{badge}</span>
          ) : null}
        </span>
        <span style={{ display: 'block', color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px', marginTop: '4px' }}>{description}</span>
      </span>
    </Link>
  )
}

export default function AccountPage() {
  const router = useRouter()
  const loadedUserIdRef = useRef<string | null>(null)
  const isRedirectingRef = useRef(false)
  const manualSignOutRef = useRef(false)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<AccountStats>({
    orders: null,
    wishlist: null,
    unreadMessages: null,
  })
  const [pageLoading, setPageLoading] = useState(true)
  const { role, isAdmin, isSuperAdmin, loading: roleLoading } = useRole()

  useEffect(() => {
    let cancelled = false
    let loginRedirectTimer: ReturnType<typeof globalThis.setTimeout> | null = null

    const clearLoginRedirect = () => {
      if (!loginRedirectTimer) return

      globalThis.clearTimeout(loginRedirectTimer)
      loginRedirectTimer = null
    }

    const scheduleLoginRedirect = () => {
      if (loginRedirectTimer || isRedirectingRef.current) return

      loginRedirectTimer = globalThis.setTimeout(() => {
        if (cancelled || loadedUserIdRef.current || isRedirectingRef.current) return

        setPageLoading(false)
      }, 0)
    }

    const loadStats = async (userId: string, email: string) => {
      const [ordersResult, wishlistResult, unreadResult] = await Promise.allSettled([
        supabase.from('Order').select('id', { count: 'exact', head: true }).eq('customerEmail', email),
        supabase.from('Wishlist').select('id', { count: 'exact', head: true }).eq('userId', userId),
        supabase.from('Conversation').select('id', { count: 'exact', head: true }).eq('customerId', userId).eq('isReadByCustomer', false),
      ])

      if (cancelled) return

      setStats({
        orders: ordersResult.status === 'fulfilled' ? ordersResult.value.count || 0 : 0,
        wishlist: wishlistResult.status === 'fulfilled' ? wishlistResult.value.count || 0 : 0,
        unreadMessages: unreadResult.status === 'fulfilled' ? unreadResult.value.count || 0 : 0,
      })
    }

    const loadProfile = async (currentUser: User) => {
      const currentProfile = await getOrCreateProfile(
        currentUser.id,
        currentUser.email || '',
        typeof currentUser.user_metadata?.name === 'string' ? currentUser.user_metadata.name : undefined
      )

      if (!cancelled) {
        setProfile(currentProfile)
      }
    }

    const hydrateAccount = (currentUser: User, loadPrivateData = true) => {
      if (cancelled) return

      const email = currentUser.email || ''
      const isSameUser = loadedUserIdRef.current === currentUser.id

      isRedirectingRef.current = false
      clearLoginRedirect()
      setUser(currentUser)
      setPageLoading(false)

      if (!loadPrivateData) {
        return
      }

      if (isSameUser) {
        return
      }

      loadedUserIdRef.current = currentUser.id

      void Promise.allSettled([
        loadStats(currentUser.id, email),
        loadProfile(currentUser),
      ])
    }

    const storedAccountUser = getStoredAccountUser()
    const storedSession = getSessionFromStorage() || getLoginHandoff() || (storedAccountUser ? {
      access_token: '',
      user: storedAccountUser,
    } : null)
    if (storedSession?.user) {
      hydrateAccount(storedSession.user, false)
    }

    const verifyCurrentSession = async () => {
      const settledSession = await getSettledBrowserSession(1000)
      if (cancelled) return

      if (settledSession?.user) {
        hydrateAccount(settledSession.user)
        return
      }

      if (!storedSession?.user) {
        scheduleLoginRedirect()
      }
    }

    void verifyCurrentSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return

      if (event === 'SIGNED_OUT') {
        if (loadedUserIdRef.current && !manualSignOutRef.current) return

        void (async () => {
          const settledSession = await getSettledBrowserSession(1000)
          if (cancelled) return

          if (settledSession?.user) {
            hydrateAccount(settledSession.user)
            return
          }

          const storedUser = getStoredAccountUser()
          if (storedUser) {
            hydrateAccount(storedUser)
            return
          }

          clearLoginRedirect()
          setUser(null)
          setProfile(null)
          setPageLoading(false)
        })()
        return
      }

      if (!session?.user) {
        return
      }

      void (async () => {
        const settledSession = await getSettledBrowserSession(1000)
        if (cancelled) return

        if (settledSession?.user) {
          hydrateAccount(settledSession.user)
          return
        }

        hydrateAccount(session.user, false)
      })()
    })

    return () => {
      cancelled = true
      clearLoginRedirect()
      subscription.unsubscribe()
    }
  }, [router])

  const handleSignOut = async () => {
    manualSignOutRef.current = true
    await forceSignOut()
  }

  if (pageLoading) {
    return (
      <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF5F0' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '32px', color: '#C9A961', animation: 'pulse 1.5s ease-in-out infinite' }}>*</div>
        <style>{`
          @keyframes pulse {
            0%,100%{opacity:0.3;transform:scale(1)}
            50%{opacity:1;transform:scale(1.1)}
          }
        `}</style>
      </div>
    )
  }

  if (!user) {
    return (
      <main style={{ alignItems: 'center', background: '#FBF5F0', color: '#1A1014', display: 'flex', justifyContent: 'center', minHeight: '100vh', padding: '40px 20px' }}>
        <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', maxWidth: '420px', padding: '36px 28px', textAlign: 'center' }}>
          <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', margin: '0 0 18px' }}>
            ACCOUNT
          </p>
          <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '30px', fontWeight: 400, margin: '0 0 12px' }}>
            Sign in to continue
          </h1>
          <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '13px', lineHeight: 1.7, margin: '0 0 24px' }}>
            Your account session was not found in this browser.
          </p>
          <Link
            href="/login?redirect=/account"
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
            SIGN IN
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main style={{ background: '#FBF5F0', minHeight: '100vh', maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }}>
      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          paddingBottom: '40px',
          borderBottom: '0.5px solid #EDD9AF',
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '4px',
            background: 'linear-gradient(135deg, #C9A961, #EDD9AF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: '#1A1014',
            fontFamily: 'var(--font-playfair)',
            flexShrink: 0,
          }}
        >
          {initialFor(user, profile)}
        </div>
        <div>
          <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '15px', margin: '0 0 4px' }}>Welcome back,</p>
          <h1 style={{ alignItems: 'center', color: '#1A1014', display: 'flex', flexWrap: 'wrap', fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 400, gap: '10px', margin: 0 }}>
            {displayName(user, profile)}
            {isAdmin ? (
              <span style={{ background: '#C9A961', borderRadius: '4px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.16em', padding: '3px 8px' }}>
                {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
              </span>
            ) : null}
          </h1>
          <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '13px', margin: '6px 0 0' }}>
            {user?.email} {profile?.createdAt ? `- Member since ${new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(profile.createdAt))}` : ''}
          </p>
        </div>
      </section>

      <section className="account-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '28px' }}>
        {[
          ['Orders', stats.orders === null ? '-' : String(stats.orders)],
          ['Wishlist', stats.wishlist === null ? '-' : String(stats.wishlist)],
          ['Messages', stats.unreadMessages === null ? '-' : String(stats.unreadMessages)],
          ['Ring Size', profile?.ringSize || 'Not set'],
        ].map(([label, value]) => (
          <div key={label} style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '16px' }}>
            <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.16em', margin: 0, textTransform: 'uppercase' }}>{label}</p>
            <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '22px', margin: '6px 0 0' }}>
              {value}
              {label === 'Messages' && stats.unreadMessages && stats.unreadMessages > 0 ? <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '4px', background: '#C9A961', marginLeft: '8px' }} /> : null}
            </p>
          </div>
        ))}
      </section>

      <section className="account-menu-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <MenuCard href="/account/orders" icon={ShoppingBag} title="My Orders" description="Track and view your orders" />
        <MenuCard href="/account/returns" icon={RotateCcw} title="My Returns" description="Track your return requests" />
        <MenuCard href="/account/messages" icon={MessageSquare} title="Messages" description="Chat with our team" badge={stats.unreadMessages} />
        <MenuCard href="/wishlist" icon={Heart} title="Wishlist" description="Your saved pieces" />
        <MenuCard href="/account/settings" icon={Settings} title="Account Settings" description="Update your profile" />
        {roleLoading ? (
          <div style={{
            height: '72px',
            background: 'rgba(201,169,97,0.04)',
            border: '0.5px solid rgba(237,217,175,0.5)',
            marginBottom: '12px',
            position: 'relative',
            overflow: 'hidden',
            gridColumn: '1 / -1',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(201,169,97,0.08) 50%, transparent 100%)',
              animation: 'shimmerSlide 1.5s ease-in-out infinite',
            }} />
          </div>
        ) : isAdmin ? (
          <Link
            href="/admin"
            style={{
              background: '#1A1014',
              border: '0.5px solid rgba(201,169,97,0.3)',
              borderRadius: '4px',
              padding: '24px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              gridColumn: '1 / -1',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = '#2A1E24'
              event.currentTarget.style.borderColor = 'rgba(201,169,97,0.6)'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = '#1A1014'
              event.currentTarget.style.borderColor = 'rgba(201,169,97,0.3)'
            }}
          >
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '4px',
              background: 'rgba(201,169,97,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A961" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#FBF5F0',
                marginBottom: '3px',
                fontFamily: 'var(--font-inter)',
              }}>
                Admin Panel
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(201,169,97,0.7)',
                fontFamily: 'var(--font-inter)',
              }}>
                {role === 'super_admin'
                  ? '* Super Admin - Full access'
                  : '* Admin - Manage store'}
              </div>
            </div>
            <span style={{
              color: '#C9A961',
              fontSize: '20px',
              fontFamily: 'var(--font-playfair)',
            }}>&gt;</span>
          </Link>
        ) : null}
      </section>

      <button
        onClick={handleSignOut}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'transparent',
          border: '0.5px solid #EDD9AF',
          padding: '12px 24px',
          cursor: 'pointer',
          fontSize: '12px',
          letterSpacing: '0.15em',
          color: 'var(--color-muted-text)',
          fontFamily: 'var(--font-inter)',
          marginTop: '32px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.borderColor = '#A85C6A'
          event.currentTarget.style.color = '#A85C6A'
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.borderColor = '#EDD9AF'
          event.currentTarget.style.color = 'var(--color-muted-text)'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        SIGN OUT
      </button>

      <style>{`
        .account-menu-card:hover {
          border-color: #C9A961 !important;
          background: #FCF0F4 !important;
          transform: translateY(-2px);
        }

        @keyframes shimmerSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @media (max-width: 768px) {
          main {
            padding: 40px 16px !important;
          }
          .account-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .account-menu-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 480px) {
          .account-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .account-menu-card {
            padding: 18px !important;
          }
        }
      `}</style>
    </main>
  )
}

'use client'

import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, LogOut, MessageSquare, Settings, ShoppingBag } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { supabaseAuth } from '@/lib/auth'
import { getOrCreateProfile, type UserProfile } from '@/lib/userProfile'

type MenuCardProps = {
  href: string
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  title: string
  description: string
  badge?: number
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
          borderRadius: '50%',
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
            <span style={{ background: '#E8C4D0', color: '#6B2D44', borderRadius: '999px', fontSize: '10px', padding: '1px 7px' }}>{badge}</span>
          ) : null}
        </span>
        <span style={{ display: 'block', color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', marginTop: '4px' }}>{description}</span>
      </span>
    </Link>
  )
}

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [orderCount, setOrderCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAccount = async () => {
      const {
        data: { user: currentUser },
      } = await supabaseAuth.auth.getUser()

      if (!currentUser) {
        router.push('/login?redirect=/account')
        return
      }

      setUser(currentUser)
      const currentProfile = await getOrCreateProfile(
        currentUser.id,
        currentUser.email || '',
        typeof currentUser.user_metadata?.name === 'string' ? currentUser.user_metadata.name : undefined
      )
      setProfile(currentProfile)

      const [{ count: orders }, { count: wishlist }, { count: unread }] = await Promise.all([
        supabaseAuth.from('Order').select('*', { count: 'exact', head: true }).eq('customerEmail', currentUser.email || ''),
        supabaseAuth.from('Wishlist').select('*', { count: 'exact', head: true }).eq('userId', currentUser.id),
        supabaseAuth.from('Conversation').select('*', { count: 'exact', head: true }).eq('customerId', currentUser.id).eq('isReadByCustomer', false),
      ])

      setOrderCount(orders || 0)
      setWishlistCount(wishlist || 0)
      setUnreadMessages(unread || 0)
      setIsLoading(false)
    }

    void loadAccount()
  }, [router])

  const handleSignOut = async () => {
    await supabaseAuth.auth.signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <main style={{ background: '#FBF5F0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B8A090', fontFamily: 'var(--font-playfair)', fontSize: '20px' }}>
        Loading account...
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
            borderRadius: '50%',
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
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '14px', margin: '0 0 4px' }}>Welcome back,</p>
          <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 400, margin: 0 }}>{displayName(user, profile)}</h1>
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', margin: '6px 0 0' }}>
            {user?.email} {profile?.createdAt ? `- Member since ${new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(profile.createdAt))}` : ''}
          </p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4" style={{ marginBottom: '28px' }}>
        {[
          ['Orders', String(orderCount)],
          ['Wishlist', String(wishlistCount)],
          ['Messages', String(unreadMessages)],
          ['Ring Size', profile?.ringSize || 'Not set'],
        ].map(([label, value]) => (
          <div key={label} style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '16px' }}>
            <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.16em', margin: 0, textTransform: 'uppercase' }}>{label}</p>
            <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '22px', margin: '6px 0 0' }}>
              {value}
              {label === 'Messages' && unreadMessages > 0 ? <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#C9A961', marginLeft: '8px' }} /> : null}
            </p>
          </div>
        ))}
      </section>

      <section className="account-menu-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <MenuCard href="/account/orders" icon={ShoppingBag} title="My Orders" description="Track and view your orders" />
        <MenuCard href="/account/messages" icon={MessageSquare} title="Messages" description="Chat with our team" badge={unreadMessages} />
        <MenuCard href="/wishlist" icon={Heart} title="Wishlist" description="Your saved pieces" />
        <MenuCard href="/account/settings" icon={Settings} title="Account Settings" description="Update your profile" />
      </section>

      <button
        onClick={handleSignOut}
        className="btn-outline"
        style={{ marginTop: '32px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
      >
        <LogOut size={16} />
        Sign out
      </button>

      <style>{`
        .account-menu-card:hover {
          border-color: #C9A961 !important;
          background: #FAF5EE !important;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .account-menu-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  )
}

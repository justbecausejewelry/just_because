'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Gem } from 'lucide-react'
import { getSettledBrowserSession } from '@/lib/supabase'

type Conversation = {
  id: string
  subject: string
  status: 'open' | 'replied' | 'resolved'
  isReadByCustomer: boolean
  updatedAt: string
  createdAt?: string
  productTitle: string | null
}

function statusStyle(status: Conversation['status']) {
  if (status === 'replied') {
    return { background: '#E8C4D0', color: '#6B2D44', border: '0.5px solid #E8C4D0' }
  }
  if (status === 'resolved') {
    return { background: '#FDF8F2', color: 'var(--color-muted-text)', border: '0.5px solid #EDD9AF' }
  }
  return { background: 'transparent', color: '#C9A961', border: '0.5px solid #C9A961' }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const loadedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const session = await getSettledBrowserSession()
      const user = session?.user

      if (!user || !session?.access_token) {
        return
      }

      const response = await fetch('/api/conversations', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const payload = (await response.json()) as { conversations?: Conversation[] }
      if (cancelled) return
      loadedRef.current = true
      setConversations(payload.conversations || [])
      setIsLoading(false)
    }

    void load()

    const fallbackTimer = window.setTimeout(() => {
      if (cancelled || loadedRef.current) return
      void getSettledBrowserSession(1000).then((session) => {
        if (cancelled || loadedRef.current) return
        if (session?.user && session.access_token) {
          void load()
          return
        }
        router.replace('/login?redirect=/account/messages')
      })
    }, 5000)

    return () => {
      cancelled = true
      window.clearTimeout(fallbackTimer)
    }
  }, [router])

  return (
    <main style={{ background: '#FBF5F0', minHeight: '100vh', padding: '60px 24px' }}>
      <section style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '28px' }}>
          <Link href="/" style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em' }}>Home</Link>
          <span style={{ color: '#EDD9AF' }}>/</span>
          <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em' }}>Messages</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <p className="eyebrow-luxury" style={{ marginBottom: '10px' }}>MY ACCOUNT</p>
            <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '42px', fontWeight: 400, margin: 0 }}>My Messages</h1>
          </div>
          <Link className="btn-primary" href="/account/messages/new">SEND A MESSAGE</Link>
        </div>

        {isLoading ? (
          <div className="just-because-shimmer" style={{ height: '120px', border: '0.5px solid #EDD9AF' }} />
        ) : conversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#FDF8F2', border: '0.5px solid #EDD9AF' }}>
            <Gem size={58} color="#C9A961" strokeWidth={1} style={{ margin: '0 auto 18px' }} />
            <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, margin: 0 }}>No messages yet</h2>
            <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '14px', margin: '8px 0 24px' }}>Have a question? We would love to help.</p>
            <Link className="btn-primary" href="/account/messages/new">SEND A MESSAGE</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {conversations.map((conversation) => {
              const unread = !conversation.isReadByCustomer
              return (
                <Link
                  key={conversation.id}
                  href={`/account/messages/${conversation.id}`}
                  style={{
                    background: '#FDF8F2',
                    border: unread ? '0.5px solid #C9A961' : '0.5px solid #EDD9AF',
                    borderRadius: '2px',
                    padding: '18px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '18px',
                    alignItems: 'center',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '14px', fontWeight: 500, margin: 0 }}>{conversation.subject}</h2>
                    {conversation.productTitle && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#C9A961" strokeWidth="1.5">
                          <path d="M6 3h12l4 6-10 13L2 9z" />
                        </svg>
                        <span style={{ fontSize: '10px', color: '#C9A961', fontFamily: 'var(--font-inter)', letterSpacing: '0.1em' }}>
                          Re: {conversation.productTitle}
                        </span>
                      </div>
                    )}
                    <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px', margin: '6px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Conversation with the Just Because team
                    </p>
                    <time style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '11px' }}>{formatDate(conversation.updatedAt || conversation.createdAt || new Date().toISOString())}</time>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{ ...statusStyle(conversation.status), borderRadius: '999px', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.12em', padding: '5px 10px', textTransform: 'uppercase' }}>{conversation.status}</span>
                    {unread && <span aria-label="Unread" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C9A961' }} />}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

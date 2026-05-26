'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type ConversationStatus = 'open' | 'replied' | 'resolved'

type Conversation = {
  id: string
  customerName: string | null
  customerEmail: string | null
  subject: string
  status: ConversationStatus
  isReadByAdmin: boolean
  updatedAt: string
  createdAt: string
}

const tabs: Array<'all' | ConversationStatus> = ['all', 'open', 'replied', 'resolved']

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

function badgeStyle(status: ConversationStatus) {
  if (status === 'replied') return { background: '#E8C4D0', color: '#6B2D44', border: '0.5px solid #E8C4D0' }
  if (status === 'resolved') return { background: '#FDF8F2', color: '#B8A090', border: '0.5px solid #EDD9AF' }
  return { background: '#EDD9AF', color: '#6B4A10', border: '0.5px solid #EDD9AF' }
}

export default function AdminSupportPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | ConversationStatus>('all')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      const response = await fetch(`/api/admin/conversations?status=${filter}`)
      const payload = (await response.json()) as { conversations?: Conversation[] }
      setConversations(payload.conversations || [])
      setIsLoading(false)
    }

    void load()
  }, [filter])

  const stats = useMemo(() => {
    return {
      open: conversations.filter((item) => item.status === 'open').length,
      replied: conversations.filter((item) => item.status === 'replied').length,
      unread: conversations.filter((item) => !item.isReadByAdmin).length,
    }
  }, [conversations])

  return (
    <main style={{ padding: '32px', background: '#F5F0EB', minHeight: 'calc(100vh - 86px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'flex-end', marginBottom: '28px' }}>
        <div>
          <p className="eyebrow-luxury" style={{ marginBottom: '8px' }}>SUPPORT</p>
          <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '32px', fontWeight: 400, margin: 0 }}>Customer Messages</h2>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3" style={{ marginBottom: '24px' }}>
        {[
          ['Open', stats.open],
          ['Replied', stats.replied],
          ['Unread', stats.unread],
        ].map(([label, value]) => (
          <div key={label} style={{ background: '#FBF5F0', border: '0.5px solid #EDD9AF', padding: '20px 24px' }}>
            <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.18em', margin: 0, textTransform: 'uppercase' }}>{label}</p>
            <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '36px', margin: '8px 0 0' }}>{value}</p>
          </div>
        ))}
      </section>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              background: filter === tab ? '#1A1014' : '#FBF5F0',
              border: '0.5px solid #EDD9AF',
              color: filter === tab ? '#FBF5F0' : '#1A1014',
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              letterSpacing: '0.14em',
              padding: '9px 14px',
              textTransform: 'uppercase',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <section style={{ background: '#FBF5F0', border: '0.5px solid #EDD9AF', overflow: 'hidden' }}>
        <div className="hidden md:grid" style={{ gridTemplateColumns: '1.1fr 1.4fr 1fr 120px 150px 90px', gap: '16px', padding: '14px 18px', borderBottom: '0.5px solid #EDD9AF', color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.18em' }}>
          <span>CUSTOMER</span>
          <span>SUBJECT</span>
          <span>LAST MESSAGE</span>
          <span>STATUS</span>
          <span>DATE</span>
          <span>ACTIONS</span>
        </div>

        {isLoading ? (
          <div className="just-because-shimmer" style={{ height: '120px' }} />
        ) : conversations.length === 0 ? (
          <div style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', padding: '40px 18px', textAlign: 'center' }}>No conversations found.</div>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => router.push(`/admin/support/${conversation.id}`)}
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '1.1fr 1.4fr 1fr 120px 150px 90px',
                gap: '16px',
                alignItems: 'center',
                padding: '16px 18px',
                border: 'none',
                borderBottom: '0.5px solid #EDD9AF',
                borderLeft: conversation.isReadByAdmin ? '2px solid transparent' : '2px solid #C9A961',
                background: conversation.isReadByAdmin ? '#FBF5F0' : '#FDF8F2',
                textAlign: 'left',
                fontWeight: conversation.isReadByAdmin ? 400 : 500,
              }}
            >
              <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>
                {conversation.customerName || 'Customer'}
                <small style={{ display: 'block', color: '#B8A090', fontSize: '11px', marginTop: '2px' }}>{conversation.customerEmail}</small>
              </span>
              <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>{conversation.subject}</span>
              <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>Open conversation</span>
              <span style={{ ...badgeStyle(conversation.status), borderRadius: '999px', display: 'inline-flex', justifyContent: 'center', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.12em', padding: '5px 9px', textTransform: 'uppercase' }}>{conversation.status}</span>
              <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px' }}>{formatDate(conversation.updatedAt || conversation.createdAt)}</span>
              <span style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.12em' }}>OPEN</span>
            </button>
          ))
        )}
      </section>
    </main>
  )
}

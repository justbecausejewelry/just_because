'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { supabaseAuth } from '@/lib/auth'

type ConversationStatus = 'open' | 'replied' | 'resolved'

type Conversation = {
  id: string
  customerName: string | null
  customerEmail: string | null
  subject: string
  status: ConversationStatus
  createdAt: string
  productSlug: string | null
  productTitle: string | null
  productImage: string | null
}

type ConversationMessage = {
  id: string
  senderType: 'admin' | 'customer'
  senderName: string | null
  content: string
  createdAt: string
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

export default function AdminSupportThreadPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { showToast } = useToast()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [reply, setReply] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  const getAccessToken = async () => {
    const {
      data: { session },
    } = await supabaseAuth.auth.getSession()
    return session?.access_token || null
  }

  const loadConversation = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) {
      router.replace('/login?redirect=/admin/support')
      return
    }

    const response = await fetch(`/api/conversations/${params.id}?viewer=admin`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const payload = (await response.json()) as {
      conversation?: Conversation
      messages?: ConversationMessage[]
    }
    setConversation(payload.conversation || null)
    setMessages(payload.messages || [])
    setIsLoading(false)
  }, [params.id, router])

  useEffect(() => {
    void loadConversation()
  }, [loadConversation])

  const sendReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = reply.trim()
    if (!content) return

    setIsSending(true)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Please sign in again')

      const response = await fetch(`/api/conversations/${params.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderType: 'admin',
          senderName: 'Just Because Team',
          content,
        }),
      })

      if (!response.ok) throw new Error('Unable to send reply')

      setReply('')
      showToast('Reply sent!', 'success')
      await loadConversation()
    } catch {
      showToast('Unable to send reply', 'error')
    } finally {
      setIsSending(false)
    }
  }

  const updateStatus = async (status: ConversationStatus) => {
    const token = await getAccessToken()
    if (!token) return

    await fetch(`/api/conversations/${params.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })
    setConversation((prev) => (prev ? { ...prev, status } : prev))
    if (status === 'resolved') {
      showToast('Conversation resolved', 'success')
      router.push('/admin/support')
    }
  }

  return (
    <main style={{ padding: '32px', background: '#F5F0EB', minHeight: 'calc(100vh - 86px)' }}>
      <Link href="/admin/support" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.08em' }}>
        {'<-'} Back to inbox
      </Link>

      {isLoading ? (
        <div className="just-because-shimmer" style={{ height: '240px', marginTop: '24px', border: '0.5px solid #EDD9AF' }} />
      ) : conversation ? (
        <section style={{ marginTop: '24px', display: 'grid', gap: '20px' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
            <div>
              <p className="eyebrow-luxury" style={{ marginBottom: '8px' }}>CONVERSATION</p>
              <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '30px', fontWeight: 400, margin: 0 }}>{conversation.subject}</h2>
            </div>
            <select className="select-luxury" value={conversation.status} onChange={(event) => void updateStatus(event.target.value as ConversationStatus)} style={{ maxWidth: '180px' }}>
              <option value="open">Open</option>
              <option value="replied">Replied</option>
              <option value="resolved">Resolved</option>
            </select>
          </header>

          <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '16px 20px' }}>
            <p style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '14px', fontWeight: 500, margin: 0 }}>{conversation.customerName || 'Customer'}</p>
            <a href={`mailto:${conversation.customerEmail || ''}`} style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{conversation.customerEmail}</a>
            <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', margin: '8px 0 0' }}>
              Date joined: Prototype account | Total orders: --
            </p>
          </div>

          {conversation.productTitle && (
            <div
              style={{
                background: '#FDF8F2',
                border: '0.5px solid #C9A961',
                borderRadius: '4px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {conversation.productImage && (
                  <Image
                    src={conversation.productImage}
                    alt=""
                    width={48}
                    height={48}
                    style={{
                      width: '48px',
                      height: '48px',
                      objectFit: 'cover',
                      borderRadius: '2px',
                    }}
                  />
                )}
                <div>
                  <div style={{ fontSize: '9px', color: '#C9A961', letterSpacing: '0.2em', fontFamily: 'var(--font-inter)', marginBottom: '3px' }}>
                    CUSTOMER IS ASKING ABOUT
                  </div>
                  <div style={{ fontSize: '14px', fontFamily: 'var(--font-playfair)', color: '#1A1014' }}>
                    {conversation.productTitle}
                  </div>
                </div>
              </div>

              {conversation.productSlug && (
                <Link
                  href={`/products/${conversation.productSlug}`}
                  target="_blank"
                  style={{ fontSize: '11px', color: '#C9A961', fontFamily: 'var(--font-inter)', textDecoration: 'none', letterSpacing: '0.1em' }}
                >
                  VIEW PRODUCT
                </Link>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#FBF5F0', border: '0.5px solid #EDD9AF', padding: '24px' }}>
            {messages.map((message) => {
              const isAdmin = message.senderType === 'admin'
              return (
                <article
                  key={message.id}
                  style={{
                    alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                    maxWidth: '78%',
                    background: isAdmin ? '#EDD9AF' : '#1A1014',
                    color: isAdmin ? '#1A1014' : '#FBF5F0',
                    borderRadius: isAdmin ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    padding: '12px 16px',
                  }}
                >
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: '10px', color: isAdmin ? '#6B4A10' : '#C9A961', margin: '0 0 4px' }}>
                    {isAdmin ? 'Just Because Team' : message.senderName || 'Customer'}
                  </p>
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
                  <time style={{ color: isAdmin ? '#6B4A10' : '#B8A090', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '10px', marginTop: '8px', textAlign: 'right' }}>
                    {formatTime(message.createdAt)}
                  </time>
                </article>
              )
            })}
          </div>

          <form onSubmit={sendReply} style={{ background: '#FBF5F0', border: '0.5px solid #EDD9AF', padding: '20px' }}>
            <label>
              <span className="eyebrow-luxury" style={{ display: 'block', marginBottom: '10px' }}>REPLY AS JUST BECAUSE TEAM</span>
              <textarea className="textarea-luxury" rows={4} value={reply} onChange={(event) => setReply(event.target.value)} />
            </label>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '14px', flexWrap: 'wrap' }}>
              <button className="btn-outline" type="button" onClick={() => void updateStatus('resolved')}>RESOLVE CONVERSATION</button>
              <button className="btn-primary" disabled={isSending}>
                {isSending ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                SEND REPLY
              </button>
            </div>
          </form>
        </section>
      ) : (
        <div style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', marginTop: '24px' }}>Conversation not found.</div>
      )}
    </main>
  )
}

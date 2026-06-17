'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { supabaseAuth } from '@/lib/auth'
import { useToast } from '@/context/ToastContext'

type Conversation = {
  id: string
  subject: string
  status: 'open' | 'replied' | 'resolved'
  createdAt: string
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

export default function MessageThreadPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { showToast } = useToast()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [reply, setReply] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  const loadConversation = useCallback(async () => {
    const {
      data: { session },
    } = await supabaseAuth.auth.getSession()
    const user = session?.user

    if (!user || !session?.access_token) {
      router.replace(`/login?redirect=/account/messages/${params.id}`)
      return
    }

    const response = await fetch(`/api/conversations/${params.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
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
    const interval = window.setInterval(() => {
      void loadConversation()
    }, 30000)
    return () => window.clearInterval(interval)
  }, [loadConversation])

  const handleReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = reply.trim()
    if (!content) return

    setIsSending(true)
    try {
      const {
        data: { session },
      } = await supabaseAuth.auth.getSession()
      const user = session?.user

      if (!user || !session?.access_token) {
        router.replace(`/login?redirect=/account/messages/${params.id}`)
        return
      }

      const response = await fetch(`/api/conversations/${params.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderType: 'customer',
          senderName: typeof user?.user_metadata?.name === 'string' ? user.user_metadata.name : user?.email || 'Customer',
          content,
        }),
      })

      if (!response.ok) {
        throw new Error('Unable to send reply')
      }

      setReply('')
      showToast('Reply sent', 'success')
      await loadConversation()
    } catch {
      showToast('Unable to send reply', 'error')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main style={{ background: '#FBF5F0', minHeight: '100vh', padding: '48px 24px' }}>
      <section style={{ maxWidth: '820px', margin: '0 auto' }}>
        <Link href="/account/messages" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.08em' }}>
          {'<-'} Back to messages
        </Link>

        {isLoading ? (
          <div className="just-because-shimmer" style={{ height: '220px', marginTop: '24px', border: '0.5px solid #EDD9AF' }} />
        ) : conversation ? (
          <>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', borderBottom: '0.5px solid #EDD9AF', padding: '24px 0 18px' }}>
              <div>
                <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 400, margin: 0 }}>{conversation.subject}</h1>
                <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px', marginTop: '8px' }}>
                  Started {formatTime(conversation.createdAt)}
                </p>
              </div>
              <span style={{ color: '#C9A961', border: '0.5px solid #C9A961', borderRadius: '999px', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.12em', padding: '6px 10px', textTransform: 'uppercase' }}>
                {conversation.status}
              </span>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px 0' }}>
              {messages.map((message) => {
                const isCustomer = message.senderType === 'customer'
                return (
                  <article
                    key={message.id}
                    style={{
                      alignSelf: isCustomer ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      background: isCustomer ? '#1A1014' : '#FDF8F2',
                      color: isCustomer ? '#FBF5F0' : '#1A1014',
                      border: isCustomer ? 'none' : '0.5px solid #EDD9AF',
                      borderRadius: isCustomer ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      padding: '12px 16px',
                    }}
                  >
                    {!isCustomer && (
                      <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', margin: '0 0 4px' }}>
                        Just Because Team
                      </p>
                    )}
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
                    <time style={{ color: 'var(--color-muted-text)', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '10px', marginTop: '8px', textAlign: 'right' }}>
                      {formatTime(message.createdAt)}
                    </time>
                  </article>
                )
              })}
            </div>

            {conversation.status !== 'resolved' && (
              <form onSubmit={handleReply} style={{ borderTop: '0.5px solid #EDD9AF', paddingTop: '16px' }}>
                <textarea className="textarea-luxury" rows={3} placeholder="Send a follow-up..." value={reply} onChange={(event) => setReply(event.target.value)} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button className="btn-primary" disabled={isSending}>
                    {isSending ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                    {'SEND ->'}
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', padding: '40px 0' }}>Conversation not found.</div>
        )}
      </section>
    </main>
  )
}

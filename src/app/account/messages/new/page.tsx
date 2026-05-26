'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { supabaseAuth } from '@/lib/auth'
import { useToast } from '@/context/ToastContext'

const subjects = [
  'Question about a product',
  'Ring sizing help',
  'Order inquiry',
  'Custom design request',
  'Shipping & delivery',
  'Returns & exchanges',
  'Diamond education',
  'Other',
]

export default function NewMessagePage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabaseAuth.auth.getUser()
      if (!user) {
        router.replace('/login?redirect=/account/messages/new')
        return
      }
      setIsChecking(false)
    }

    void checkUser()
  }, [router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const trimmed = message.trim()
    if (!subject || !trimmed) {
      setError('Please choose a subject and write a message.')
      return
    }

    setIsSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabaseAuth.auth.getUser()

      if (!user) {
        router.replace('/login?redirect=/account/messages/new')
        return
      }

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user.id,
          customerEmail: user.email,
          customerName: typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : user.email,
          subject,
          message: trimmed,
        }),
      })

      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to send message')
      }

      showToast("Message sent! We'll reply soon *", 'success')
      router.push('/account/messages')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isChecking) {
    return (
      <main style={{ minHeight: '100vh', background: '#FBF5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B8A090', fontFamily: 'var(--font-playfair)', fontSize: '20px' }}>
        Loading...
      </main>
    )
  }

  return (
    <main style={{ background: '#FBF5F0', minHeight: '100vh', maxWidth: '640px', margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '28px' }}>
        <Link href="/" style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em' }}>Home</Link>
        <span style={{ color: '#EDD9AF' }}>/</span>
        <Link href="/account/messages" style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em' }}>My Account</Link>
        <span style={{ color: '#EDD9AF' }}>/</span>
        <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em' }}>New Message</span>
      </div>

      <p className="eyebrow-luxury" style={{ marginBottom: '10px' }}>SUPPORT</p>
      <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '36px', fontWeight: 400, lineHeight: 1.1, margin: 0 }}>Send us a message</h1>
      <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '14px', lineHeight: 1.7, margin: '12px 0 32px' }}>
        Our team typically replies within a few hours.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
        <label>
          <span className="eyebrow-luxury" style={{ display: 'block', marginBottom: '8px' }}>SUBJECT *</span>
          <select className="select-luxury" value={subject} onChange={(event) => setSubject(event.target.value)}>
            <option value="">Select a topic...</option>
            {subjects.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="eyebrow-luxury" style={{ display: 'block', marginBottom: '8px' }}>YOUR MESSAGE *</span>
          <textarea
            className="textarea-luxury"
            rows={6}
            maxLength={1000}
            placeholder="Tell us what's on your mind..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            style={{ resize: 'vertical' }}
          />
          <span style={{ display: 'block', textAlign: 'right', color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', marginTop: '6px' }}>
            {message.length}/1000
          </span>
        </label>

        {error && (
          <div style={{ background: '#FCF0F4', border: '0.5px solid #E8C4D0', color: '#A85C6A', fontFamily: 'var(--font-inter)', fontSize: '13px', padding: '12px 14px' }}>
            {error}
          </div>
        )}

        <button className="btn-primary" disabled={isSubmitting} style={{ justifyContent: 'center', width: '100%', height: '52px' }}>
          {isSubmitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
          {isSubmitting ? 'SENDING...' : 'SEND MESSAGE ->'}
        </button>
      </form>
    </main>
  )
}

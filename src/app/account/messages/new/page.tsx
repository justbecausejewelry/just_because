'use client'

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { supabaseAuth } from '@/lib/auth'
import { getGeneralErrorMessage } from '@/lib/errors'
import { getSettledBrowserSession } from '@/lib/supabase'
import { useToast } from '@/context/ToastContext'
import { useFormPersistence } from '@/hooks/useFormPersistence'

const generalSubjects = [
  'Question about a product',
  'Ring sizing help',
  'Order inquiry',
  'Custom design request',
  'Shipping & delivery',
  'Returns & exchanges',
  'Diamond education',
  'Other',
]

const productSubjects = [
  'Ring sizing for this design',
  'Metal options available',
  'Diamond shape customization',
  'Delivery time for this piece',
  'Price and payment options',
  'Custom engraving',
  'Certificate and authentication',
  'Other question about this piece',
]

function LoadingMessage() {
  return (
    <main style={{ minHeight: '100vh', background: '#FBF5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-text)', fontFamily: 'var(--font-playfair)', fontSize: '20px' }}>
      Loading...
    </main>
  )
}

function NewMessageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const draftState = useMemo(() => ({ subject, message }), [message, subject])
  const clearPersistedMessage = useFormPersistence('support_message_form_v1', draftState, (updater) => {
    const next = typeof updater === 'function' ? updater(draftState) : updater
    if (typeof next.subject === 'string') setSubject(next.subject)
    if (typeof next.message === 'string') setMessage(next.message)
  })

  const conversationType = searchParams.get('type') || 'general'
  const productId = searchParams.get('productId')
  const productSlug = searchParams.get('productSlug')
  const productTitle = searchParams.get('productTitle')
  const productImage = searchParams.get('productImage')
  const isProductChat = conversationType === 'product' && Boolean(productId)

  const subjects = useMemo(() => (isProductChat ? productSubjects : generalSubjects), [isProductChat])
  const heading = isProductChat ? 'Ask about this piece' : 'Send us a message'
  const subtext = isProductChat
    ? `Our experts will answer your specific question about the ${productTitle || 'piece'}.`
    : 'Our team typically replies within a few hours.'
  const placeholder = isProductChat
    ? `What would you like to know about the ${productTitle || 'piece'}?`
    : "Tell us what's on your mind..."

  useEffect(() => {
    const checkUser = async () => {
      const session = await getSettledBrowserSession()
      const user = session?.user
      if (!user) {
        const currentPath = `/account/messages/new?${searchParams.toString()}`
        router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`)
        return
      }
      setUserEmail(user.email || '')
      setIsChecking(false)
    }

    void checkUser()
  }, [router, searchParams])

  useEffect(() => {
    setSubject('')
  }, [isProductChat])

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
      const session = await getSettledBrowserSession()
      const user = session?.user

      if (!user || !session?.access_token) {
        const currentPath = `/account/messages/new?${searchParams.toString()}`
        router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`)
        return
      }

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : user.email,
          subject,
          message: trimmed,
          conversationType: isProductChat ? 'product' : 'general',
          productId: productId || null,
          productSlug: productSlug || null,
          productTitle: productTitle || null,
          productImage: productImage || null,
        }),
      })

      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        console.error('[account/messages/new] send failed:', payload.error)
        throw new Error('Unable to send message')
      }

      showToast(isProductChat ? 'Question sent! Our expert will reply soon *' : "Message sent! We'll reply soon *", 'success')
      clearPersistedMessage()
      router.push('/account/messages')
    } catch (err) {
      console.error('[account/messages/new] request failed:', err)
      setError(getGeneralErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isChecking) {
    return <LoadingMessage />
  }

  return (
    <main style={{ background: '#FBF5F0', minHeight: '100vh', maxWidth: '640px', margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '28px' }}>
        <Link href="/" style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em' }}>Home</Link>
        <span style={{ color: '#EDD9AF' }}>/</span>
        <Link href="/account/messages" style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em' }}>My Account</Link>
        <span style={{ color: '#EDD9AF' }}>/</span>
        <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em' }}>New Message</span>
      </div>

      <p className="eyebrow-luxury" style={{ marginBottom: '10px' }}>SUPPORT</p>
      <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '36px', fontWeight: 400, lineHeight: 1.1, margin: 0 }}>{heading}</h1>
      <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '14px', lineHeight: 1.7, margin: '12px 0 32px' }}>
        {subtext}
      </p>

      {isProductChat && (
        <div
          style={{
            background: '#FDF8F2',
            border: '0.5px solid #C9A961',
            borderRadius: '4px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            gap: '14px',
            alignItems: 'center',
          }}
        >
          {productImage && (
            <div
              style={{
                width: '64px',
                height: '64px',
                flexShrink: 0,
                background: '#F5E8ED',
                borderRadius: '2px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <Image src={productImage} alt={productTitle || ''} fill sizes="64px" style={{ objectFit: 'cover' }} />
            </div>
          )}
          <div>
            <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#C9A961', fontFamily: 'var(--font-inter)', marginBottom: '4px' }}>
              ASKING ABOUT
            </div>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-playfair)', color: '#1A1014', marginBottom: '4px' }}>
              {productTitle}
            </div>
            {productSlug && (
              <Link href={`/products/${productSlug}`} style={{ fontSize: '11px', color: '#C9A961', fontFamily: 'var(--font-inter)', textDecoration: 'none' }}>
                View product -&gt;
              </Link>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
        {userEmail && (
          <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px', padding: '12px 14px' }}>
            Sending as {userEmail} (logged in)
          </div>
        )}
        <label>
          <span className="eyebrow-luxury" style={{ display: 'block', marginBottom: '8px' }}>SUBJECT *</span>
          <select className="select-luxury" value={subject} onChange={(event) => setSubject(event.target.value)}>
            <option value="">{isProductChat ? 'Select your question...' : 'Select a topic...'}</option>
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
            placeholder={placeholder}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            style={{ resize: 'vertical' }}
          />
          <span style={{ display: 'block', textAlign: 'right', color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '11px', marginTop: '6px' }}>
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

export default function NewMessagePage() {
  return (
    <Suspense fallback={<LoadingMessage />}>
      <NewMessageContent />
    </Suspense>
  )
}

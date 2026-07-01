'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { useFormPersistence } from '@/hooks/useFormPersistence'
import { supabaseAuth } from '@/lib/auth'
import { getGeneralErrorMessage } from '@/lib/errors'
import {
  RETURN_REASONS,
  checkReturnEligibility,
  returnReasonLabel,
  type ReturnReason,
} from '@/lib/returnEligibility'

type OrderItem = {
  id: string
  productTitle?: string | null
  selectedMetal?: string | null
  selectedCarat?: number | null
  selectedShape?: string | null
  unitPrice?: number | null
  quantity?: number | null
  engraving?: string | null
}

type Order = {
  id: string
  orderNumber: string
  customerEmail: string
  customerName?: string | null
  total: number
  status: string
  createdAt: string
  OrderItem?: OrderItem[]
}

type CreatedReturn = {
  id: string
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function firstItemName(order: Order | null) {
  const item = order?.OrderItem?.[0]
  return item?.productTitle || 'Just Because piece'
}

function ReturnRequestContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order') || ''
  const [step, setStep] = useState(1)
  const [reason, setReason] = useState<ReturnReason | ''>('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [returnReference, setReturnReference] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const draftState = useMemo(() => ({ step, reason, details }), [details, reason, step])
  const clearPersistedReturn = useFormPersistence('return_request_form_v1', draftState, (updater) => {
    const next = typeof updater === 'function' ? updater(draftState) : updater
    if (typeof next.step === 'number') setStep(next.step)
    if (typeof next.reason === 'string' && (next.reason === '' || RETURN_REASONS.some((item) => item.value === next.reason))) {
      setReason(next.reason as ReturnReason | '')
    }
    if (typeof next.details === 'string') setDetails(next.details)
  })

  useEffect(() => {
    let cancelled = false

    const loadOrder = async (currentUser: User) => {
      if (!orderId) {
        setError('Select an order before starting a return request.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const { data, error: orderError } = await supabaseAuth
          .from('Order')
          .select('*, OrderItem(*)')
          .eq('id', orderId)
          .eq('customerEmail', currentUser.email || '')
          .maybeSingle()

        if (orderError) throw orderError

        if (!cancelled) {
          setOrder(data as Order | null)
          setError(data ? '' : 'Order not found for this account.')
        }
      } catch (caught) {
        if (!cancelled) {
          console.error('[account/returns/new] order load failed:', caught)
          setError(getGeneralErrorMessage(caught))
          setOrder(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((event, session) => {
      if (cancelled) return

      if (event === 'SIGNED_OUT' || !session?.user) {
        router.replace(`/login?redirect=/account/returns/new?order=${orderId}`)
        return
      }

      setUser(session.user)
      void loadOrder(session.user)
    })

    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled && !user) {
        router.replace(`/login?redirect=/account/returns/new?order=${orderId}`)
      }
    }, 5000)

    return () => {
      cancelled = true
      window.clearTimeout(fallbackTimer)
      subscription.unsubscribe()
    }
  }, [orderId, router, user])

  const eligibility = useMemo(() => (
    order
      ? checkReturnEligibility({
        createdAt: order.createdAt,
        status: order.status,
        items: order.OrderItem,
      })
      : { eligible: false, reason: 'Order details are required before requesting a return.' }
  ), [order])

  const handleSubmit = async () => {
    if (!order || !reason) return

    setSubmitting(true)
    setError('')

    try {
      const { data: sessionData } = await supabaseAuth.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Please sign in again before submitting your request.')

      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          reason,
          reasonDetails: details,
        }),
      })
      const payload = await response.json() as {
        returnRequest?: CreatedReturn
        error?: string
      }

      if (!response.ok || !payload.returnRequest) {
        console.error('[account/returns/new] submit failed:', payload.error)
        throw new Error('Unable to submit return request.')
      }

      setReturnReference(payload.returnRequest.id)
      setSubmitted(true)
      clearPersistedReturn()
      setStep(4)
    } catch (caught) {
      console.error('[account/returns/new] request failed:', caught)
      setError(getGeneralErrorMessage(caught))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main style={{ alignItems: 'center', background: '#FBF5F0', color: 'var(--color-muted-text)', display: 'flex', fontFamily: 'var(--font-playfair)', fontSize: '20px', justifyContent: 'center', minHeight: '100vh' }}>
        Loading return request...
      </main>
    )
  }

  return (
    <main style={{ background: '#FBF5F0', margin: '0 auto', maxWidth: '780px', minHeight: '100vh', padding: '60px 24px' }}>
      <Link href="/account/orders" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.08em' }}>{'<-'} Back to orders</Link>
      <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '40px', fontWeight: 400, margin: '28px 0 10px' }}>Request a Return</h1>
      <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '13px', lineHeight: 1.7, margin: '0 0 28px' }}>
        Returns are reviewed by our team before shipment authorization is issued.
      </p>

      {error ? (
        <div style={{ background: '#FCF0F4', border: '0.5px solid #A85C6A', color: '#A85C6A', fontFamily: 'var(--font-inter)', fontSize: '13px', marginBottom: '18px', padding: '14px 16px' }}>
          {error}
        </div>
      ) : null}

      {submitted ? (
        <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '42px 28px', textAlign: 'center' }}>
          <CheckCircle color="#7A8F72" size={58} strokeWidth={1.2} style={{ margin: '0 auto 18px' }} />
          <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 400, margin: 0 }}>Return Request Submitted</h2>
          <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.08em', margin: '14px 0' }}>Return Reference: {returnReference}</p>
          <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '13px', lineHeight: 1.7, margin: '0 auto 24px', maxWidth: '440px' }}>
            We will review your request within 1-2 business days and email you with next steps.
          </p>
          <Link href="/account/orders" className="btn-primary">BACK TO ORDERS</Link>
        </section>
      ) : (
        <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '28px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {[1, 2, 3].map((item) => (
              <span key={item} style={{ background: step >= item ? '#C9A961' : '#EDD9AF', flex: 1, height: '2px' }} />
            ))}
          </div>

          {step === 1 && (
            <div>
              <p className="eyebrow-luxury" style={{ marginBottom: '16px' }}>ELIGIBILITY CHECK</p>
              {order ? (
                <div style={{ background: '#FBF5F0', border: '0.5px solid #EDD9AF', padding: '18px', marginBottom: '18px' }}>
                  <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '22px', fontWeight: 400, margin: 0 }}>{order.orderNumber}</h2>
                  <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px', margin: '8px 0 0' }}>{formatDate(order.createdAt)} - {firstItemName(order)} - {formatPrice(order.total || 0)}</p>
                </div>
              ) : null}
              <div style={{ background: eligibility.eligible ? 'rgba(201,169,97,0.08)' : '#FCF0F4', border: `0.5px solid ${eligibility.eligible ? '#EDD9AF' : '#A85C6A'}`, color: eligibility.eligible ? '#1A1014' : '#A85C6A', fontFamily: 'var(--font-inter)', fontSize: '13px', lineHeight: 1.7, padding: '16px' }}>
                {eligibility.eligible
                  ? `This order is eligible. ${eligibility.daysRemaining} days remain in the return window.`
                  : eligibility.reason}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '22px' }}>
                {eligibility.eligible ? (
                  <button className="btn-primary" onClick={() => setStep(2)}>CONTINUE</button>
                ) : (
                  <Link href="/account/messages/new" className="btn-outline">CONTACT SUPPORT</Link>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="eyebrow-luxury" style={{ marginBottom: '16px' }}>RETURN REASON</p>
              <div style={{ display: 'grid', gap: '8px' }}>
                {RETURN_REASONS.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setReason(item.value)}
                    style={{
                      background: reason === item.value ? 'rgba(201,169,97,0.08)' : '#FDF8F2',
                      border: reason === item.value ? '1px solid #C9A961' : '0.5px solid #EDD9AF',
                      cursor: 'pointer',
                      padding: '16px',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <p style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '15px', fontWeight: 500, margin: 0 }}>{item.label}</p>
                    <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '13px', margin: '5px 0 0' }}>{item.description}</p>
                  </button>
                ))}
              </div>
              <textarea
                className="input-luxury"
                rows={4}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Please describe the issue in detail to help us process your return faster..."
                style={{ height: 'auto', marginTop: '16px', padding: '14px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '22px' }}>
                <button className="btn-outline" onClick={() => setStep(1)}>BACK</button>
                <button className="btn-primary" disabled={!reason} onClick={() => setStep(3)}>CONTINUE</button>
              </div>
            </div>
          )}

          {step === 3 && order && (
            <div>
              <p className="eyebrow-luxury" style={{ marginBottom: '16px' }}>REVIEW REQUEST</p>
              <div style={{ display: 'grid', gap: '10px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>
                <div><strong>Order:</strong> {order.orderNumber}</div>
                <div><strong>Item:</strong> {firstItemName(order)}</div>
                <div><strong>Reason:</strong> {returnReasonLabel(reason)}</div>
                <div><strong>Details:</strong> {details || 'No additional details provided.'}</div>
              </div>
              <div style={{ background: 'rgba(201,169,97,0.08)', border: '0.5px solid #EDD9AF', color: '#6B4A10', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.7, marginTop: '22px', padding: '16px' }}>
                By submitting this request you confirm the item is unworn and in original condition with all packaging. Return authorization must be received before shipping.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '22px' }}>
                <button className="btn-outline" onClick={() => setStep(2)}>BACK</button>
                <button className="btn-primary" disabled={submitting} onClick={() => void handleSubmit()}>
                  {submitting ? 'SUBMITTING...' : 'SUBMIT RETURN REQUEST'}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  )
}

export default function NewReturnPage() {
  return (
    <Suspense
      fallback={
        <main style={{ alignItems: 'center', background: '#FBF5F0', color: 'var(--color-muted-text)', display: 'flex', fontFamily: 'var(--font-playfair)', fontSize: '20px', justifyContent: 'center', minHeight: '100vh' }}>
          Loading return request...
        </main>
      }
    >
      <ReturnRequestContent />
    </Suspense>
  )
}

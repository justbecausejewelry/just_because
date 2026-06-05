'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import { supabaseAuth } from '@/lib/auth'
import { RETURN_STATUS_LABELS, normalizeReturnStatus, returnReasonLabel } from '@/lib/returnEligibility'

type ReturnRequest = {
  id: string
  orderNumber: string
  itemName: string
  reason: string
  status: string
  authorizationNumber: string
  createdAt: string
}

function formatDate(value: string) {
  if (!value) return 'Pending'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function statusStyle(status: string) {
  const normalized = normalizeReturnStatus(status)
  if (normalized === 'approved' || normalized === 'refunded') return { background: 'rgba(122,143,114,0.14)', color: '#3F5F38' }
  if (normalized === 'rejected') return { background: '#FCF0F4', color: '#A85C6A' }
  if (normalized === 'item_received') return { background: 'rgba(184,160,144,0.16)', color: '#6B5B4E' }
  if (normalized === 'closed') return { background: '#F5E8ED', color: '#B8A090' }
  return { background: '#EDD9AF', color: '#6B4A10' }
}

export default function AccountReturnsPage() {
  const router = useRouter()
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadReturns = async () => {
      try {
        setLoading(true)
        const { data: sessionData } = await supabaseAuth.auth.getSession()
        const token = sessionData.session?.access_token

        if (!token) {
          router.replace('/login?redirect=/account/returns')
          return
        }

        const response = await fetch('/api/returns', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const payload = await response.json() as {
          returns?: ReturnRequest[]
          error?: string
        }

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to load returns.')
        }

        if (!cancelled) {
          setReturns(payload.returns || [])
          setError('')
        }
      } catch (caught) {
        if (!cancelled) {
          setReturns([])
          setError(caught instanceof Error ? caught.message : 'Unable to load returns.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadReturns()

    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        router.replace('/login?redirect=/account/returns')
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <main style={{ alignItems: 'center', background: '#FBF5F0', color: '#B8A090', display: 'flex', fontFamily: 'var(--font-playfair)', fontSize: '20px', justifyContent: 'center', minHeight: '100vh' }}>
        Loading returns...
      </main>
    )
  }

  return (
    <main style={{ background: '#FBF5F0', margin: '0 auto', maxWidth: '900px', minHeight: '100vh', padding: '60px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '28px' }}>
        <Link href="/account" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.08em' }}>{'<-'} Back to account</Link>
        <Link href="/account/orders" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em', textDecoration: 'none' }}>MY ORDERS</Link>
      </div>
      <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '42px', fontWeight: 400, margin: '0 0 28px' }}>My Returns</h1>

      {error ? (
        <div style={{ background: '#FCF0F4', border: '0.5px solid #A85C6A', color: '#A85C6A', fontFamily: 'var(--font-inter)', fontSize: '13px', marginBottom: '18px', padding: '14px 16px' }}>
          {error}
        </div>
      ) : null}

      {returns.length === 0 ? (
        <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '56px 24px', textAlign: 'center' }}>
          <RotateCcw size={52} color="#C9A961" strokeWidth={1.2} style={{ margin: '0 auto 18px' }} />
          <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, margin: 0 }}>No return requests yet</h2>
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '14px', margin: '10px 0 24px' }}>Need to return something?</p>
          <Link href="/account/orders" className="btn-primary">GO TO MY ORDERS</Link>
        </section>
      ) : (
        <section style={{ display: 'grid', gap: '14px' }}>
          {returns.map((item) => {
            const normalized = normalizeReturnStatus(item.status)
            return (
              <article key={item.id} style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '20px 24px' }}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 style={{ color: '#C9A961', fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 400, margin: 0 }}>{item.orderNumber || 'Order pending'}</h2>
                    <p style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px', margin: '8px 0 0' }}>{item.itemName}</p>
                    <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', margin: '5px 0 0' }}>{returnReasonLabel(item.reason)} - submitted {formatDate(item.createdAt)}</p>
                    {item.authorizationNumber ? (
                      <p style={{ color: '#6B4A10', fontFamily: 'var(--font-inter)', fontSize: '12px', margin: '10px 0 0' }}>Authorization: {item.authorizationNumber}</p>
                    ) : null}
                  </div>
                  <span style={{ ...statusStyle(item.status), borderRadius: '4px', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.12em', padding: '6px 10px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {RETURN_STATUS_LABELS[normalized]}
                  </span>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}


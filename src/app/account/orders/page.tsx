'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExternalLink, Package, RotateCcw, ShoppingBag } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { getMetalLabel } from '@/config/productOptions'
import { supabaseAuth } from '@/lib/auth'
import { checkReturnEligibility } from '@/lib/returnEligibility'
import { getCarrierLabel, orderStatusLabel, orderStatusStyle } from '@/lib/tracking'

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
  total: number
  status: string
  trackingNumber?: string | null
  carrier?: string | null
  trackingUrl?: string | null
  estimatedDelivery?: string | null
  createdAt: string
  OrderItem?: OrderItem[]
}

type OrdersResponse = {
  orders?: Order[]
  error?: string
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function itemLine(item: OrderItem) {
  return [
    item.productTitle || 'Just Because piece',
    getMetalLabel(item.selectedMetal),
    item.selectedCarat ? `${item.selectedCarat}ct` : null,
    item.selectedShape,
  ].filter(Boolean).join(' - ')
}

export default function AccountOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const loadedUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadForUser = async (user: User) => {
      if (loadedUserIdRef.current === user.id) return
      loadedUserIdRef.current = user.id

      try {
        setIsLoading(true)
        const { data: sessionData } = await supabaseAuth.auth.getSession()
        const token = sessionData.session?.access_token

        if (!token) {
          router.replace('/login?redirect=/account/orders')
          return
        }

        const response = await fetch('/api/account/orders', {
          headers: { Authorization: `Bearer ${token}` },
        })

        const payload = await response.json().catch(() => ({})) as OrdersResponse

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to load orders')
        }

        if (!cancelled) {
          setOrders(payload.orders || [])
        }
      } catch (error) {
        console.error('Orders load error:', error)
        if (!cancelled) {
          setOrders([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void supabaseAuth.auth.getSession().then(({ data }) => {
      if (cancelled) return

      if (data.session?.user) {
        void loadForUser(data.session.user)
      } else {
        router.replace('/login?redirect=/account/orders')
      }
    })

    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((event, session) => {
      if (cancelled) return

      if (event === 'SIGNED_OUT' || !session?.user) {
        router.replace('/login?redirect=/account/orders')
        return
      }

      void loadForUser(session.user)
    })

    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled && !loadedUserIdRef.current) {
        router.replace('/login?redirect=/account/orders')
      }
    }, 5000)

    return () => {
      cancelled = true
      window.clearTimeout(fallbackTimer)
      subscription.unsubscribe()
    }
  }, [router])

  if (isLoading) {
    return (
      <main style={{ minHeight: '100vh', background: '#FBF5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-text)', fontFamily: 'var(--font-playfair)', fontSize: '20px' }}>
        Loading orders...
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FBF5F0', maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '28px' }}>
        <Link href="/account" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.08em' }}>{'<-'} Back to account</Link>
        <Link href="/account/returns" style={{ alignItems: 'center', color: '#C9A961', display: 'inline-flex', fontFamily: 'var(--font-inter)', fontSize: '11px', gap: '6px', letterSpacing: '0.08em', textDecoration: 'none' }}>
          <RotateCcw size={14} />
          My Returns
        </Link>
      </div>
      <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '42px', fontWeight: 400, margin: '0 0 28px' }}>My Orders</h1>

      {orders.length === 0 ? (
        <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '56px 24px', textAlign: 'center' }}>
          <ShoppingBag size={52} color="#C9A961" strokeWidth={1.2} style={{ margin: '0 auto 18px' }} />
          <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, margin: 0 }}>No orders yet</h2>
          <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '14px', margin: '10px 0 24px' }}>No orders yet. Start browsing.</p>
          <Link href="/diamonds" className="btn-primary">START BROWSING -</Link>
        </section>
      ) : (
        <section>
          {orders.map((order) => {
            const itemCount = (order.OrderItem || []).reduce((total, item) => total + (item.quantity || 1), 0)
            const itemSummary = itemCount
              ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
              : 'No item details'
            const eligibility = checkReturnEligibility({
              createdAt: order.createdAt,
              status: order.status,
              items: order.OrderItem,
            })

            return (
              <article key={order.id} style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '20px 24px', marginBottom: '16px' }}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 style={{ color: '#C9A961', fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 400, margin: 0 }}>{order.orderNumber}</h2>
                    <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px', marginTop: '4px' }}>{formatDate(order.createdAt)}</p>
                    <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px', margin: '4px 0 0' }}>{itemSummary}</p>
                  </div>
                  <div style={{ alignItems: 'flex-start', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ ...orderStatusStyle(order.status), border: '0.5px solid #EDD9AF', borderRadius: '4px', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.12em', padding: '5px 10px', textTransform: 'uppercase' }}>{orderStatusLabel(order.status)}</span>
                    <span style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '18px' }}>{formatPrice(order.total || 0)}</span>
                  </div>
                </div>

                {order.trackingNumber ? (
                  <div style={{ alignItems: 'center', background: '#FBF5F0', border: '0.5px solid #EDD9AF', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', marginTop: '16px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Package size={18} color="#C9A961" />
                      <div>
                        <p style={{ color: '#1A1014', fontSize: '12px', margin: 0 }}>{getCarrierLabel(order.carrier)} {order.trackingNumber}</p>
                        <p style={{ color: 'var(--color-muted-text)', fontSize: '11px', margin: '4px 0 0' }}>Estimated delivery: {formatDate(order.estimatedDelivery)}</p>
                      </div>
                    </div>
                    {order.trackingUrl ? (
                      <a href={order.trackingUrl} target="_blank" rel="noreferrer" style={{ alignItems: 'center', color: '#C9A961', display: 'inline-flex', fontSize: '11px', gap: '6px', letterSpacing: '0.08em' }}>
                        Track Package
                        <ExternalLink size={13} />
                      </a>
                    ) : null}
                  </div>
                ) : null}

                {expanded === order.id && (
                  <div style={{ borderTop: '0.5px solid #EDD9AF', marginTop: '16px', paddingTop: '14px' }}>
                    {(order.OrderItem || []).map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px', padding: '7px 0' }}>
                        <span>{itemLine(item)}</span>
                        <span>{formatPrice((item.unitPrice || 0) * (item.quantity || 1))}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px' }}>
                  <button onClick={() => setExpanded((current) => current === order.id ? null : order.id)} style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em' }}>
                    {expanded === order.id ? 'Hide quick view' : 'Quick view'}
                  </button>
                  <Link href={`/account/orders/${order.id}`} style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em' }}>View Order Details -</Link>
                  <Link href="/account/messages/new" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em' }}>Need help?</Link>
                  {eligibility.eligible ? (
                    <Link
                      href={`/account/returns/new?order=${order.id}`}
                      style={{
                        alignItems: 'center',
                        background: 'transparent',
                        border: '0.5px solid #EDD9AF',
                        color: '#1A1014',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '12px',
                        gap: '6px',
                        letterSpacing: '0.08em',
                        padding: '8px 16px',
                        textDecoration: 'none',
                      }}
                    >
                      Return Item
                    </Link>
                  ) : null}
                </div>
                {eligibility.eligible ? (
                  <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '11px', margin: '8px 0 0' }}>
                    {eligibility.daysRemaining} days left to return
                  </p>
                ) : (
                  <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '11px', margin: '8px 0 0' }}>
                    {eligibility.reason}
                  </p>
                )}
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}

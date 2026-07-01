'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Check, Download, ExternalLink, Package, Printer, ShoppingBag } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { getMetalLabel } from '@/config/productOptions'
import { supabaseAuth } from '@/lib/auth'
import { getGeneralErrorMessage } from '@/lib/errors'
import { getSettledBrowserSession } from '@/lib/supabase'
import { getCarrierLabel, normalizeOrderStatus, orderStatusLabel, orderStatusStyle, type OrderStatus } from '@/lib/tracking'

type ShippingAddress = {
  firstName?: string
  lastName?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  phone?: string
}

type OrderItem = {
  id: string
  productTitle?: string | null
  productImage?: string | null
  selectedMetal?: string | null
  selectedCarat?: number | null
  selectedShape?: string | null
  selectedColor?: string | null
  selectedClarity?: string | null
  ringSize?: string | null
  engraving?: string | null
  unitPrice?: number | null
  quantity?: number | null
  totalPrice?: number | null
}

type OrderEvent = {
  id?: string
  order_id?: string | null
  status: string
  message?: string | null
  tracking_number?: string | null
  carrier?: string | null
  tracking_url?: string | null
  created_at?: string | null
}

type Order = {
  id: string
  orderNumber: string
  customerName?: string | null
  customerEmail: string
  status: string
  subtotal?: number | null
  shippingAmount?: number | null
  taxAmount?: number | null
  discountAmount?: number | null
  total?: number | null
  shippingAddress?: ShippingAddress | null
  trackingNumber?: string | null
  carrier?: string | null
  trackingUrl?: string | null
  estimatedDelivery?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  createdAt: string
  updatedAt?: string | null
  OrderItem?: OrderItem[]
}

type OrderDetailResponse = {
  order?: Order
  events?: OrderEvent[]
  error?: string
}

type TimelineStep = {
  status: OrderStatus
  label: string
  completed: boolean
  date?: string | null
  message?: string | null
  trackingNumber?: string | null
  carrier?: string | null
  trackingUrl?: string | null
  expected?: string | null
}

const statusOrder: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered', 'completed']

function formatPrice(value = 0) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function productTitle(item: OrderItem) {
  return item.productTitle || 'Just Because piece'
}

function productDetails(item: OrderItem) {
  return [
    getMetalLabel(item.selectedMetal),
    item.selectedCarat ? `${item.selectedCarat}ct` : null,
    item.selectedShape,
    item.selectedColor,
    item.selectedClarity,
    item.ringSize ? `Size ${item.ringSize}` : null,
    item.engraving ? `Engraving: ${item.engraving}` : null,
  ].filter(Boolean).join(' / ')
}

function normalizedProgressStatus(status?: string | null): OrderStatus {
  const normalized = normalizeOrderStatus(status)
  if (normalized === 'pending') return 'confirmed'
  if (normalized === 'cancelled' || normalized === 'refunded') return 'confirmed'
  return normalized
}

function buildTimeline(order: Order, events: OrderEvent[]): TimelineStep[] {
  const currentStatus = normalizedProgressStatus(order.status)
  const currentIndex = statusOrder.indexOf(currentStatus)
  const eventByStatus = new Map<string, OrderEvent>()

  events.forEach((event) => {
    const key = normalizeOrderStatus(event.status)
    eventByStatus.set(key, event)
  })

  return statusOrder.map((status, index) => {
    const event = eventByStatus.get(status)
    const completed = currentIndex >= index
    const fallbackDate =
      status === 'confirmed' ? order.createdAt :
      status === 'shipped' ? order.shippedAt :
      status === 'delivered' ? order.deliveredAt :
      completed ? order.updatedAt || order.createdAt : null

    return {
      status,
      label: orderStatusLabel(status),
      completed,
      date: event?.created_at || fallbackDate,
      message: event?.message || (completed ? undefined : status === 'delivered' && order.estimatedDelivery ? `Expected ${formatDate(order.estimatedDelivery)}` : undefined),
      trackingNumber: event?.tracking_number || (status === 'shipped' ? order.trackingNumber : null),
      carrier: event?.carrier || (status === 'shipped' ? order.carrier : null),
      trackingUrl: event?.tracking_url || (status === 'shipped' ? order.trackingUrl : null),
      expected: status === 'delivered' && !completed ? order.estimatedDelivery : null,
    }
  })
}

export default function AccountOrderDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id
  const [order, setOrder] = useState<Order | null>(null)
  const [events, setEvents] = useState<OrderEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let loadedUserId: string | null = null

    const loadOrder = async (user: User) => {
      if (loadedUserId === user.id) return

      if (!user.email) {
        router.replace('/login?redirect=/account/orders')
        return
      }

      try {
        setIsLoading(true)
        const session = await getSettledBrowserSession()
        const token = session?.access_token

        if (!token) {
          return
        }

        loadedUserId = user.id

        const response = await fetch(`/api/account/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const payload = await response.json().catch(() => ({})) as OrderDetailResponse

        if (cancelled) return

        if (!response.ok) {
          console.error('[account/order-detail] load failed:', payload.error)
          setError('We could not find that order. Please check your orders or contact us for help.')
          setOrder(null)
          return
        }

        if (!payload.order) {
          setError('We could not find that order. Please check your orders or contact us for help.')
          setOrder(null)
          return
        }

        setOrder(payload.order)
        setEvents(payload.events || [])
      } catch (caught) {
        console.error('[account/order-detail] request failed:', caught)
        if (!cancelled) {
          setError(getGeneralErrorMessage(caught))
          setOrder(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void getSettledBrowserSession().then((session) => {
      if (cancelled) return
      if (session?.user) {
        void loadOrder(session.user)
      }
    })

    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((event, session) => {
      if (cancelled) return

      if (event === 'SIGNED_OUT') {
        void getSettledBrowserSession().then((settledSession) => {
          if (cancelled) return
          if (settledSession?.user) {
            void loadOrder(settledSession.user)
            return
          }
          router.replace(`/login?redirect=/account/orders/${orderId}`)
        })
        return
      }

      if (!session?.user) {
        return
      }

      void loadOrder(session.user)
    })

    const fallbackTimer = window.setTimeout(() => {
      if (cancelled || loadedUserId) return
      router.replace(`/login?redirect=/account/orders/${orderId}`)
    }, 5000)

    return () => {
      cancelled = true
      window.clearTimeout(fallbackTimer)
      subscription.unsubscribe()
    }
  }, [orderId, router])

  const timeline = useMemo(() => order ? buildTimeline(order, events) : [], [events, order])

  const handleDownloadInvoice = async () => {
    try {
      setIsDownloadingInvoice(true)
      const session = await getSettledBrowserSession()
      const token = session?.access_token

      if (!token) {
        router.replace(`/login?redirect=/account/orders/${orderId}`)
        return
      }

      const response = await fetch(`/account/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Unable to download invoice.')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `JustBecause-Order-${(order?.orderNumber || orderId).replace(/[^A-Za-z0-9_-]/g, '')}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (downloadError) {
      console.error('[account/order-detail] invoice download failed:', downloadError)
      setError('We could not download your invoice right now. Please try again in a moment.')
    } finally {
      setIsDownloadingInvoice(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <main style={{ minHeight: '100vh', background: '#FBF5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-text)', fontFamily: 'var(--font-playfair)', fontSize: '20px' }}>
        Loading order...
      </main>
    )
  }

  if (!order) {
    return (
      <main style={{ minHeight: '100vh', background: '#FBF5F0', maxWidth: '760px', margin: '0 auto', padding: '60px 24px' }}>
        <Link href="/account/orders" style={{ color: '#C9A961', fontSize: '12px', letterSpacing: '0.08em' }}>{'<-'} Back to orders</Link>
        <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', marginTop: '28px', padding: '42px 24px', textAlign: 'center' }}>
          <ShoppingBag size={48} color="#C9A961" strokeWidth={1.2} style={{ margin: '0 auto 16px' }} />
          <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '26px', fontWeight: 400, margin: 0 }}>Order unavailable</h1>
          <p style={{ color: 'var(--color-muted-text)', fontSize: '13px', margin: '10px 0 0' }}>{error || 'We could not find this order for your account.'}</p>
        </section>
      </main>
    )
  }

  const items = order.OrderItem || []
  const statusStyle = orderStatusStyle(order.status)

  return (
    <main className="order-print-root" style={{ minHeight: '100vh', background: '#FBF5F0', maxWidth: '1040px', margin: '0 auto', padding: '56px 24px 72px' }}>
      <style>{`
        @media print {
          nav, footer, .print-hidden { display: none !important; }
          body { background: #FBF5F0 !important; }
          .order-print-root {
            max-width: none !important;
            min-height: auto !important;
            padding: 0 !important;
          }
          .order-print-root section,
          .order-print-root aside {
            break-inside: avoid;
            box-shadow: none !important;
          }
        }
      `}</style>
      <Link className="print-hidden" href="/account/orders" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.08em' }}>{'<-'} Back to orders</Link>

      <header className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_0.8fr]" style={{ marginTop: '24px', marginBottom: '24px' }}>
        <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '28px' }}>
          <p style={{ color: '#C9A961', fontSize: '10px', letterSpacing: '0.3em', margin: '0 0 10px', textTransform: 'uppercase' }}>Order Detail</p>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '38px', fontWeight: 400, margin: 0 }}>{order.orderNumber}</h1>
            <div className="print-hidden flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleDownloadInvoice()}
                disabled={isDownloadingInvoice}
                style={{ alignItems: 'center', background: '#1A1014', border: '0.5px solid #1A1014', color: '#FBF5F0', cursor: isDownloadingInvoice ? 'wait' : 'pointer', display: 'inline-flex', gap: '8px', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.16em', padding: '11px 14px', textTransform: 'uppercase' }}
              >
                <Download size={14} />
                {isDownloadingInvoice ? 'Preparing...' : 'Download Invoice'}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                style={{ alignItems: 'center', background: 'transparent', border: '0.5px solid #EDD9AF', color: '#1A1014', cursor: 'pointer', display: 'inline-flex', gap: '8px', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.16em', padding: '11px 14px', textTransform: 'uppercase' }}
              >
                <Printer size={14} />
                Print
              </button>
            </div>
          </div>
          {error ? (
            <p className="print-hidden" style={{ color: '#A85C6A', fontFamily: 'var(--font-inter)', fontSize: '12px', margin: '14px 0 0' }}>{error}</p>
          ) : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3" style={{ marginTop: '22px' }}>
            <HeaderStat label="Date Placed" value={formatDate(order.createdAt)} />
            <HeaderStat label="Total" value={formatPrice(order.total || 0)} />
            <div>
              <p style={{ color: 'var(--color-muted-text)', fontSize: '10px', letterSpacing: '0.18em', margin: '0 0 7px', textTransform: 'uppercase' }}>Status</p>
              <span style={{ ...statusStyle, border: '0.5px solid #EDD9AF', borderRadius: '4px', color: statusStyle.color, display: 'inline-block', fontSize: '10px', letterSpacing: '0.12em', padding: '7px 10px', textTransform: 'uppercase' }}>
                {orderStatusLabel(order.status)}
              </span>
            </div>
          </div>
        </section>

        <section style={{ background: '#1A1014', border: '0.5px solid #EDD9AF', padding: '28px' }}>
          <p style={{ color: '#C9A961', fontSize: '10px', letterSpacing: '0.3em', margin: '0 0 10px', textTransform: 'uppercase' }}>Tracking</p>
          {order.trackingNumber ? (
            <>
              <p style={{ color: '#FBF5F0', fontFamily: 'var(--font-playfair)', fontSize: '22px', margin: 0 }}>{getCarrierLabel(order.carrier)}</p>
              <p style={{ color: 'var(--color-muted-text)', fontSize: '13px', margin: '8px 0 0' }}>{order.trackingNumber}</p>
              <p style={{ color: 'var(--color-muted-text)', fontSize: '12px', margin: '14px 0 0' }}>Estimated delivery: {formatDate(order.estimatedDelivery)}</p>
              {order.trackingUrl ? (
                <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="btn-primary" style={{ alignItems: 'center', display: 'inline-flex', gap: '8px', marginTop: '18px' }}>
                  Track Package
                  <ExternalLink size={14} />
                </a>
              ) : null}
            </>
          ) : (
            <p style={{ color: 'var(--color-muted-text)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>Tracking will appear here as soon as your order ships.</p>
          )}
        </section>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '28px' }}>
          <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '26px', fontWeight: 400, margin: '0 0 22px' }}>Order Timeline</h2>
          <div>
            {timeline.map((step, index) => (
              <div key={step.status} style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: '16px', minHeight: '86px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: step.completed ? '#1A1014' : '#EDD9AF', color: step.completed ? '#FBF5F0' : 'var(--color-muted-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {step.completed ? <Check size={16} /> : index + 1}
                  </div>
                  {index < timeline.length - 1 && <div style={{ flex: 1, width: '0.5px', background: '#EDD9AF' }} />}
                </div>
                <div>
                  <p style={{ color: step.completed ? '#1A1014' : 'var(--color-muted-text)', fontWeight: 500, margin: 0 }}>{step.label}</p>
                  <p style={{ color: 'var(--color-muted-text)', fontSize: '13px', margin: '5px 0 0' }}>
                    {step.completed ? formatDateTime(step.date) : step.expected ? `Expected ${formatDate(step.expected)}` : 'Pending'}
                  </p>
                  {step.message ? <p style={{ color: 'var(--color-muted-text)', fontSize: '13px', lineHeight: 1.5, margin: '7px 0 0' }}>{step.message}</p> : null}
                  {step.trackingNumber ? (
                    <div style={{ background: '#FBF5F0', border: '0.5px solid #EDD9AF', marginTop: '10px', padding: '12px' }}>
                      <p style={{ color: 'var(--color-muted-text)', fontSize: '12px', margin: 0 }}>{getCarrierLabel(step.carrier)}</p>
                      <p style={{ color: '#1A1014', fontWeight: 500, margin: '4px 0 0' }}>{step.trackingNumber}</p>
                      {step.trackingUrl ? (
                        <a href={step.trackingUrl} target="_blank" rel="noreferrer" style={{ color: '#C9A961', fontSize: '13px', marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          Track on {getCarrierLabel(step.carrier)}
                          <ExternalLink size={13} />
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside style={{ display: 'grid', gap: '18px', alignContent: 'start' }}>
          <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '24px' }}>
            <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, margin: '0 0 18px' }}>Order Items</h2>
            {items.map((item) => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: '12px', padding: '12px 0', borderBottom: '0.5px solid #EDD9AF' }}>
                <div style={{ alignItems: 'center', background: '#FBF5F0', border: '0.5px solid #EDD9AF', display: 'flex', height: '56px', justifyContent: 'center' }}>
                  {item.productImage ? (
                    <Image src={item.productImage} alt="" width={56} height={56} unoptimized style={{ height: '100%', objectFit: 'cover', width: '100%' }} />
                  ) : (
                    <Package size={20} color="#C9A961" />
                  )}
                </div>
                <div>
                  <p style={{ color: '#1A1014', fontSize: '13px', margin: 0 }}>{productTitle(item)}</p>
                  <p style={{ color: 'var(--color-muted-text)', fontSize: '11px', lineHeight: 1.5, margin: '4px 0' }}>{productDetails(item)}</p>
                  <p style={{ color: '#1A1014', fontSize: '12px', margin: 0 }}>{item.quantity || 1} x {formatPrice(item.unitPrice || 0)}</p>
                </div>
              </div>
            ))}
          </section>

          <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '24px' }}>
            <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, margin: '0 0 18px' }}>Order Summary</h2>
            {[
              ['Subtotal', order.subtotal || 0],
              ['Shipping', order.shippingAmount || 0],
              ['Discount', -(order.discountAmount || 0)],
              ['Tax', order.taxAmount || 0],
              ['Total', order.total || 0],
            ].map(([label, value]) => (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: label === 'Total' ? '#1A1014' : 'var(--color-muted-text)', fontFamily: label === 'Total' ? 'var(--font-playfair)' : 'var(--font-inter)', fontSize: label === 'Total' ? '18px' : '13px' }}>
                <span>{label}</span>
                <span>{formatPrice(value as number)}</span>
              </div>
            ))}
          </section>

          <ShippingAddressBlock address={order.shippingAddress} fallbackName={order.customerName || order.customerEmail} />
        </aside>
      </div>
    </main>
  )
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ color: 'var(--color-muted-text)', fontSize: '10px', letterSpacing: '0.18em', margin: '0 0 7px', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ color: '#1A1014', fontSize: '14px', margin: 0 }}>{value}</p>
    </div>
  )
}

function ShippingAddressBlock({ address, fallbackName }: { address?: ShippingAddress | null; fallbackName: string }) {
  return (
    <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '24px' }}>
      <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, margin: '0 0 18px' }}>Shipping Address</h2>
      <div style={{ color: 'var(--color-muted-text)', fontSize: '13px', lineHeight: 1.7 }}>
        <div style={{ color: '#1A1014' }}>{[address?.firstName, address?.lastName].filter(Boolean).join(' ') || fallbackName}</div>
        <div>{address?.addressLine1 || 'No address line recorded'}</div>
        {address?.addressLine2 ? <div>{address.addressLine2}</div> : null}
        <div>{[address?.city, address?.state, address?.zipCode].filter(Boolean).join(', ')}</div>
        <div>{address?.country}</div>
      </div>
    </section>
  )
}

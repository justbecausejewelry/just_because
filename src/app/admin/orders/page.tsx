'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, Download, ExternalLink, Eye, MessageSquare, PackageCheck, Search, Truck, X } from 'lucide-react'
import { getMetalLabel } from '@/config/productOptions'
import { getAdminAccessToken } from '@/lib/adminSession'
import {
  CARRIERS,
  getCarrierLabel,
  normalizeOrderStatus,
  orderStatusLabel,
  orderStatusStyle,
  type CarrierValue,
  type OrderStatus,
} from '@/lib/tracking'

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
  productId?: string | null
  productTitle?: string | null
  title?: string | null
  name?: string | null
  selectedMetal?: string | null
  selectedCarat?: number | null
  selectedShape?: string | null
  selectedColor?: string | null
  selectedClarity?: string | null
  ringSize?: string | null
  engraving?: string | null
  quantity?: number | null
  unitPrice?: number | null
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
  created_by?: string | null
}

type Order = {
  id: string
  orderNumber?: string | null
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  shippingAddress?: ShippingAddress | null
  subtotal?: number | null
  shippingAmount?: number | null
  taxAmount?: number | null
  discountAmount?: number | null
  total?: number | null
  status?: string | null
  trackingNumber?: string | null
  carrier?: string | null
  trackingUrl?: string | null
  estimatedDelivery?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  createdAt: string
  updatedAt?: string | null
  items?: OrderItem[]
  events?: OrderEvent[]
}

const filters: Array<{ label: string; value: 'all' | OrderStatus }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
]

function formatCurrency(value = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
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

function relativeDate(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const days = Math.max(0, Math.floor(diff / 86400000))
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function itemTitle(item: OrderItem) {
  return item.productTitle || item.title || item.name || item.productId || 'Custom piece'
}

function itemDetails(item: OrderItem) {
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

function orderItems(order: Order) {
  return order.items || []
}

function orderDisplayId(order: Order) {
  return order.orderNumber || `JB-${order.id?.slice(-6).toUpperCase()}`
}

function customerDisplayName(order: Order) {
  return order.customerName || order.customerEmail || 'Guest'
}

function orderTotal(order: Order) {
  return order.total || order.subtotal || 0
}

async function getAdminToken() {
  return getAdminAccessToken()
}

function isProcessingStatus(status: OrderStatus) {
  return status === 'processing'
}

function timelineEvents(order: Order): OrderEvent[] {
  if (order.events?.length) return order.events

  const status = normalizeOrderStatus(order.status)
  const events: OrderEvent[] = [
    {
      id: `${order.id}-confirmed`,
      status: 'confirmed',
      message: 'Order placed.',
      created_at: order.createdAt,
    },
  ]

  if (['processing', 'shipped', 'delivered', 'completed'].includes(status)) {
    events.push({
      id: `${order.id}-confirmed`,
      status: 'confirmed',
      message: 'Order confirmed.',
      created_at: order.updatedAt || order.createdAt,
    })
  }

  if (['processing', 'shipped', 'delivered', 'completed'].includes(status)) {
    events.push({
      id: `${order.id}-processing`,
      status: 'processing',
      message: 'Your jewelry is being prepared.',
      created_at: order.updatedAt || order.createdAt,
    })
  }

  if (['shipped', 'delivered', 'completed'].includes(status)) {
    events.push({
      id: `${order.id}-shipped`,
      status: 'shipped',
      message: 'Order shipped.',
      tracking_number: order.trackingNumber,
      carrier: order.carrier,
      tracking_url: order.trackingUrl,
      created_at: order.shippedAt || order.updatedAt || order.createdAt,
    })
  }

  if (status === 'delivered') {
    events.push({
      id: `${order.id}-delivered`,
      status: 'delivered',
      message: 'Order delivered.',
      created_at: order.deliveredAt || order.updatedAt || order.createdAt,
    })
  }

  return events
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [shippingOrder, setShippingOrder] = useState<Order | null>(null)
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')
  const [query, setQuery] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)

    try {
      const token = await getAdminToken()
      if (!token) {
        setError('Admin session expired. Please sign in again.')
        setOrders([])
        return
      }

      const response = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = (await response.json()) as {
        orders?: Order[]
        error?: string
      }

      if (!response.ok) {
        setError(payload.error || 'Unable to load orders.')
        setOrders([])
        return
      }

      setOrders(payload.orders || [])
      setError(null)
    } catch (loadError) {
      console.error('Orders error:', loadError)
      setError('Unable to load orders.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchOrders()
  }, [fetchOrders])

  const filteredOrders = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase()

    return orders.filter((order) => {
      const status = normalizeOrderStatus(order.status)
      const matchesStatus = filter === 'all' || status === filter
      const haystack = [
        order.orderNumber,
        order.customerName,
        order.customerEmail,
        order.id,
        order.trackingNumber,
      ].join(' ').toLowerCase()
      const matchesQuery = !lowerQuery || haystack.includes(lowerQuery)
      const created = new Date(order.createdAt)
      const matchesFrom = !fromDate || created >= new Date(`${fromDate}T00:00:00`)
      const matchesTo = !toDate || created <= new Date(`${toDate}T23:59:59`)
      return matchesStatus && matchesQuery && matchesFrom && matchesTo
    })
  }, [filter, fromDate, orders, query, toDate])

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + orderTotal(order), 0)
    return {
      total: orders.length,
      pending: orders.filter((order) => normalizeOrderStatus(order.status) === 'pending').length,
      processing: orders.filter((order) => ['confirmed', 'processing'].includes(normalizeOrderStatus(order.status))).length,
      shipped: orders.filter((order) => normalizeOrderStatus(order.status) === 'shipped').length,
      revenue,
    }
  }, [orders])

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setSavingOrderId(orderId)
    setError(null)

    try {
      const token = await getAdminToken()
      if (!token) {
        setError('Admin session expired. Please sign in again.')
        return
      }

      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, status }),
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        setError(payload.error || 'Unable to update order.')
        return
      }

      setNotice(`Order marked ${orderStatusLabel(status).toLowerCase()}.`)
      await fetchOrders()
      setSelectedOrder((current) => {
        if (!current || current.id !== orderId) return current
        return { ...current, status }
      })
    } finally {
      setSavingOrderId(null)
    }
  }

  const markShipped = async ({
    order,
    carrier,
    trackingNumber,
    estimatedDelivery,
    note,
  }: {
    order: Order
    carrier: CarrierValue
    trackingNumber: string
    estimatedDelivery: string
    note: string
  }) => {
    setSavingOrderId(order.id)
    setError(null)

    try {
      const token = await getAdminToken()
      if (!token) {
        setError('Admin session expired. Please sign in again.')
        return
      }

      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          orderId: order.id,
          status: 'shipped',
          carrier,
          trackingNumber,
          estimatedDelivery: estimatedDelivery || null,
          note: note || null,
        }),
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        setError(payload.error || 'Unable to mark order shipped.')
        return
      }

      setNotice('Order marked as shipped. Shipping email sent to customer.')
      setShippingOrder(null)
      await fetchOrders()
    } finally {
      setSavingOrderId(null)
    }
  }

  const exportCsv = () => {
    const rows = [
      ['Order ID', 'Customer', 'Email', 'Items', 'Total', 'Status', 'Tracking', 'Date'],
      ...filteredOrders.map((order) => [
        order.orderNumber || order.id,
        order.customerName || '',
        order.customerEmail || '',
        String(orderItems(order).length),
        String(orderTotal(order)),
        normalizeOrderStatus(order.status),
        order.trackingNumber || '',
        order.createdAt,
      ]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'just-because-orders.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main style={{ background: '#FBF5F0', minHeight: '100vh', padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '32px', fontWeight: 400, color: '#1A1014', margin: 0 }}>Orders</h1>
        <button onClick={exportCsv} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={15} />
          EXPORT CSV
        </button>
      </div>

      {notice ? (
        <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', color: '#1A1014', fontSize: '12px', marginBottom: '16px', padding: '12px 14px' }}>
          {notice}
        </div>
      ) : null}
      {error ? (
        <div style={{ background: '#FCF0F4', border: '0.5px solid #EDD9AF', color: '#A85C6A', fontSize: '12px', marginBottom: '16px', padding: '12px 14px' }}>
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" style={{ marginBottom: '24px' }}>
        {[
          ['TOTAL ORDERS', stats.total.toString(), 'All customer orders'],
          ['AWAITING CONFIRMATION', stats.pending.toString(), 'Received or pending'],
          ['IN WORK', stats.processing.toString(), 'Confirmed or processing'],
          ['SHIPPED', stats.shipped.toString(), formatCurrency(stats.revenue)],
        ].map(([label, value, change]) => (
          <div key={label} style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '20px 24px' }}>
            <div style={{ color: '#C9A961', fontSize: '10px', letterSpacing: '0.2em', fontFamily: 'var(--font-inter)', marginBottom: '10px' }}>{label}</div>
            <div style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '28px', lineHeight: 1.1 }}>{value}</div>
            <div style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', marginTop: '8px' }}>{change}</div>
          </div>
        ))}
      </section>

      <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '18px 20px', marginBottom: '18px' }}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {filters.map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                style={{
                  background: filter === item.value ? '#1A1014' : 'transparent',
                  color: filter === item.value ? '#FBF5F0' : '#B8A090',
                  border: '0.5px solid #EDD9AF',
                  padding: '9px 13px',
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3" style={{ minWidth: 'min(100%, 680px)' }}>
            <label style={{ position: 'relative' }}>
              <Search size={15} color="#B8A090" style={{ position: 'absolute', top: '12px', left: '12px' }} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, email, order, tracking..."
                style={{ width: '100%', height: '40px', background: '#FBF5F0', border: '0.5px solid #EDD9AF', padding: '0 12px 0 34px', color: '#1A1014', fontSize: '12px' }}
              />
            </label>
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} style={{ height: '40px', background: '#FBF5F0', border: '0.5px solid #EDD9AF', padding: '0 12px', color: '#1A1014', fontSize: '12px' }} />
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} style={{ height: '40px', background: '#FBF5F0', border: '0.5px solid #EDD9AF', padding: '0 12px', color: '#1A1014', fontSize: '12px' }} />
          </div>
        </div>
      </section>

      <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1120px' }}>
          <thead>
            <tr>
              {['ORDER ID', 'CUSTOMER', 'ITEMS', 'TOTAL', 'STATUS', 'TRACKING', 'DATE', 'ACTIONS'].map((header) => (
                <th key={header} style={{ textAlign: 'left', padding: '14px 16px', color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.2em', borderBottom: '0.5px solid #EDD9AF' }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '28px 16px', color: '#B8A090' }}>Loading orders...</td></tr>
            ) : filteredOrders.map((order) => {
              const items = orderItems(order)
              const firstItem = items[0]
              const status = normalizeOrderStatus(order.status)
              return (
                <tr key={order.id} style={{ borderBottom: '0.5px solid #EDD9AF' }}>
                  <td style={{ padding: '16px', color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '13px', cursor: 'pointer' }} onClick={() => setSelectedOrder(order)}>
                    {orderDisplayId(order)}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ color: '#1A1014', fontSize: '13px' }}>{customerDisplayName(order)}</div>
                    <div style={{ color: '#B8A090', fontSize: '11px', marginTop: '3px' }}>{order.customerEmail}</div>
                  </td>
                  <td style={{ padding: '16px', color: '#1A1014', fontSize: '13px' }}>
                    <div>{items.length} items</div>
                    <div style={{ color: '#B8A090', fontSize: '11px', marginTop: '3px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstItem ? itemTitle(firstItem) : 'No items'}</div>
                  </td>
                  <td style={{ padding: '16px', color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '14px' }}>{formatCurrency(orderTotal(order))}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ ...orderStatusStyle(status), border: '0.5px solid #EDD9AF', borderRadius: '4px', display: 'inline-block', padding: '7px 10px', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {orderStatusLabel(status)}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: '#B8A090', fontSize: '12px' }}>
                    {order.trackingNumber ? (
                      <div>
                        <div style={{ color: '#1A1014' }}>{getCarrierLabel(order.carrier)}</div>
                        <a href={order.trackingUrl || '#'} target="_blank" rel="noreferrer" style={{ alignItems: 'center', color: '#C9A961', display: 'inline-flex', gap: '5px', marginTop: '3px' }}>
                          {order.trackingNumber}
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    ) : 'Not shipped'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ color: '#1A1014', fontSize: '12px' }}>{formatDate(order.createdAt)}</div>
                    <div style={{ color: '#B8A090', fontSize: '11px', marginTop: '3px' }}>{relativeDate(order.createdAt)}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <OrderActionButtons
                        order={order}
                        saving={savingOrderId === order.id}
                        onConfirm={() => void updateOrderStatus(order.id, 'confirmed')}
                        onProcessing={() => void updateOrderStatus(order.id, 'processing')}
                        onShip={() => setShippingOrder(order)}
                        onDelivered={() => void updateOrderStatus(order.id, 'delivered')}
                      />
                      <button onClick={() => setSelectedOrder(order)} aria-label="View order" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#1A1014' }}><Eye size={17} /></button>
                      <Link href={`/admin/support?customer=${encodeURIComponent(order.customerEmail || '')}`} aria-label="Message customer" style={{ color: '#1A1014' }}><MessageSquare size={17} /></Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={updateOrderStatus}
          onShip={() => setShippingOrder(selectedOrder)}
          saving={savingOrderId === selectedOrder.id}
        />
      )}

      {shippingOrder && (
        <ShippingModal
          order={shippingOrder}
          saving={savingOrderId === shippingOrder.id}
          onClose={() => setShippingOrder(null)}
          onSubmit={markShipped}
        />
      )}
    </main>
  )
}

function OrderActionButtons({
  order,
  saving,
  onConfirm,
  onProcessing,
  onShip,
  onDelivered,
}: {
  order: Order
  saving: boolean
  onConfirm: () => void
  onProcessing: () => void
  onShip: () => void
  onDelivered: () => void
}) {
  const status = normalizeOrderStatus(order.status)
  const baseStyle = {
    alignItems: 'center',
    border: '0.5px solid #EDD9AF',
    cursor: saving ? 'wait' : 'pointer',
    display: 'inline-flex',
    fontSize: '10px',
    gap: '6px',
    letterSpacing: '0.08em',
    padding: '8px 10px',
  }

  if (status === 'pending') {
    return (
      <button disabled={saving} onClick={onConfirm} style={{ ...baseStyle, background: '#1A1014', color: '#FBF5F0' }}>
        <Check size={13} />
        CONFIRM
      </button>
    )
  }

  if (status === 'confirmed') {
    return (
      <button disabled={saving} onClick={onProcessing} style={{ ...baseStyle, background: '#FDF8F2', color: '#1A1014' }}>
        <PackageCheck size={13} />
        PROCESSING
      </button>
    )
  }

  if (isProcessingStatus(status)) {
    return (
      <button disabled={saving} onClick={onShip} style={{ ...baseStyle, background: '#1A1014', color: '#FBF5F0' }}>
        <Truck size={13} />
        SHIP
      </button>
    )
  }

  if (status === 'shipped') {
    return (
      <button disabled={saving} onClick={onDelivered} style={{ ...baseStyle, background: '#FDF8F2', color: '#1A1014' }}>
        <PackageCheck size={13} />
        DELIVERED
      </button>
    )
  }

  return null
}

function ShippingModal({
  order,
  saving,
  onClose,
  onSubmit,
}: {
  order: Order
  saving: boolean
  onClose: () => void
  onSubmit: (input: {
    order: Order
    carrier: CarrierValue
    trackingNumber: string
    estimatedDelivery: string
    note: string
  }) => Promise<void>
}) {
  const [carrier, setCarrier] = useState<CarrierValue>('ups')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [estimatedDelivery, setEstimatedDelivery] = useState('')
  const [note, setNote] = useState('Your order is on its way.')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void onSubmit({ order, carrier, trackingNumber, estimatedDelivery, note })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,16,20,0.48)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px' }} onClick={onClose}>
      <form onSubmit={submit} style={{ background: '#FBF5F0', border: '0.5px solid #EDD9AF', boxShadow: '0 18px 60px rgba(26,16,20,0.22)', maxWidth: '620px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }} onClick={(event) => event.stopPropagation()}>
        <div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between', gap: '18px', marginBottom: '22px' }}>
          <div>
            <p style={{ color: '#C9A961', fontSize: '10px', letterSpacing: '0.3em', margin: '0 0 8px', textTransform: 'uppercase' }}>Shipping</p>
            <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 400, margin: 0 }}>Mark Order as Shipped</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close shipping modal" style={{ background: 'transparent', border: 'none', color: '#B8A090', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', marginBottom: '20px', padding: '16px' }}>
          <div style={{ color: '#C9A961', fontFamily: 'var(--font-playfair)', fontSize: '18px' }}>{orderDisplayId(order)}</div>
          <div style={{ color: '#1A1014', fontSize: '13px', marginTop: '5px' }}>{customerDisplayName(order)}</div>
          <div style={{ color: '#B8A090', fontSize: '12px', marginTop: '8px' }}>{orderItems(order).map(itemTitle).join(', ') || 'No items recorded'}</div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label style={{ color: '#B8A090', fontSize: '12px' }}>
            Carrier
            <select value={carrier} onChange={(event) => setCarrier(event.target.value as CarrierValue)} required className="input-luxury" style={{ marginTop: '8px' }}>
              {CARRIERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label style={{ color: '#B8A090', fontSize: '12px' }}>
            Tracking Number
            <input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} required placeholder="e.g. 1Z999AA10123456784" className="input-luxury" style={{ marginTop: '8px' }} />
          </label>
          <label style={{ color: '#B8A090', fontSize: '12px' }}>
            Estimated Delivery
            <input type="date" value={estimatedDelivery} onChange={(event) => setEstimatedDelivery(event.target.value)} className="input-luxury" style={{ marginTop: '8px' }} />
          </label>
          <label className="md:col-span-2" style={{ color: '#B8A090', fontSize: '12px' }}>
            Note to Customer
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Your order is on its way." className="input-luxury" style={{ height: '92px', marginTop: '8px', paddingTop: '12px', resize: 'vertical' }} />
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary" style={{ alignItems: 'center', display: 'inline-flex', gap: '8px' }}>
            <Truck size={15} />
            {saving ? 'Saving...' : 'Mark as Shipped'}
          </button>
        </div>
      </form>
    </div>
  )
}

function OrderDetailModal({
  order,
  onClose,
  onStatusChange,
  onShip,
  saving,
}: {
  order: Order
  onClose: () => void
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>
  onShip: () => void
  saving: boolean
}) {
  const status = normalizeOrderStatus(order.status)
  const address = order.shippingAddress

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,16,20,0.4)', zIndex: 300, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <aside style={{ width: 'min(100vw, 520px)', height: '100vh', background: '#FBF5F0', padding: '26px 28px', overflowY: 'auto', boxShadow: '-12px 0 40px rgba(26,16,20,0.18)' }} onClick={(event) => event.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', borderBottom: '0.5px solid #EDD9AF', paddingBottom: '18px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', color: '#1A1014', fontWeight: 400, margin: 0 }}>Order #{orderDisplayId(order)}</h2>
            <div style={{ color: '#B8A090', fontSize: '11px', marginTop: '6px' }}>{formatDate(order.createdAt)}</div>
            <span style={{ ...orderStatusStyle(status), border: '0.5px solid #EDD9AF', borderRadius: '4px', display: 'inline-block', marginTop: '10px', padding: '5px 9px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{orderStatusLabel(status)}</span>
          </div>
          <button onClick={onClose} aria-label="Close order details" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#B8A090', height: '28px' }}><X size={20} /></button>
        </div>

        <DetailSection title="CUSTOMER">
          <div style={{ color: '#1A1014', fontSize: '14px' }}>{customerDisplayName(order)}</div>
          <div style={{ color: '#C9A961', fontSize: '12px', marginTop: '4px' }}>{order.customerEmail}</div>
          <div style={{ color: '#B8A090', fontSize: '12px', marginTop: '4px' }}>{order.customerPhone || address?.phone || 'No phone on file'}</div>
          <Link href="/admin/customers" style={{ display: 'inline-block', color: '#C9A961', fontSize: '11px', letterSpacing: '0.08em', marginTop: '10px' }}>View profile {'->'}</Link>
        </DetailSection>

        {order.trackingNumber ? (
          <DetailSection title="TRACKING">
            <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '14px' }}>
              <div style={{ color: '#B8A090', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{getCarrierLabel(order.carrier)}</div>
              <div style={{ color: '#1A1014', fontSize: '16px', marginTop: '4px' }}>{order.trackingNumber}</div>
              <div style={{ color: '#B8A090', fontSize: '12px', marginTop: '6px' }}>Estimated delivery: {formatDate(order.estimatedDelivery)}</div>
              {order.trackingUrl ? (
                <a href={order.trackingUrl} target="_blank" rel="noreferrer" style={{ alignItems: 'center', color: '#C9A961', display: 'inline-flex', fontSize: '12px', gap: '6px', letterSpacing: '0.08em', marginTop: '12px' }}>
                  Track package
                  <ExternalLink size={13} />
                </a>
              ) : null}
            </div>
          </DetailSection>
        ) : null}

        <DetailSection title="ITEMS">
          {orderItems(order).map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', padding: '12px 0', borderBottom: '0.5px solid #EDD9AF' }}>
              <div>
                <div style={{ color: '#1A1014', fontSize: '13px' }}>{itemTitle(item)}</div>
                <div style={{ color: '#B8A090', fontSize: '11px', lineHeight: 1.6, marginTop: '3px' }}>{itemDetails(item)}</div>
              </div>
              <div style={{ color: '#1A1014', fontSize: '12px', whiteSpace: 'nowrap' }}>{item.quantity || 1} x {formatCurrency(item.unitPrice || 0)}</div>
            </div>
          ))}
        </DetailSection>

        <DetailSection title="ORDER SUMMARY">
          {[
            ['Subtotal', order.subtotal || 0],
            ['Shipping', order.shippingAmount || 0],
            ['Discount', -(order.discountAmount || 0)],
            ['Tax', order.taxAmount || 0],
            ['Total', orderTotal(order)],
          ].map(([label, value]) => (
            <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', color: label === 'Total' ? '#1A1014' : '#B8A090', fontFamily: label === 'Total' ? 'var(--font-playfair)' : 'var(--font-inter)', fontSize: label === 'Total' ? '17px' : '12px' }}>
              <span>{label}</span>
              <span>{formatCurrency(value as number)}</span>
            </div>
          ))}
        </DetailSection>

        <DetailSection title="SHIPPING ADDRESS">
          <div style={{ color: '#1A1014', fontSize: '13px', lineHeight: 1.7 }}>
            <div>{[address?.firstName, address?.lastName].filter(Boolean).join(' ') || order.customerName || 'Customer'}</div>
            <div>{address?.addressLine1 || 'No address line recorded'}</div>
            {address?.addressLine2 && <div>{address.addressLine2}</div>}
            <div>{[address?.city, address?.state, address?.zipCode].filter(Boolean).join(', ')}</div>
            <div>{address?.country}</div>
          </div>
        </DetailSection>

        <DetailSection title="ORDER TIMELINE">
          <div>
            {timelineEvents(order).map((event, index) => (
              <div key={event.id || `${event.status}-${index}`} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: '12px', minHeight: '64px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#1A1014', color: '#FBF5F0', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={12} />
                  </div>
                  {index < timelineEvents(order).length - 1 && <div style={{ flex: 1, width: '0.5px', background: '#EDD9AF' }} />}
                </div>
                <div>
                  <div style={{ color: '#1A1014', fontSize: '13px' }}>{orderStatusLabel(event.status)}</div>
                  <div style={{ color: '#B8A090', fontSize: '11px', marginTop: '3px' }}>{formatDateTime(event.created_at)}</div>
                  {event.message ? <div style={{ color: '#B8A090', fontSize: '12px', marginTop: '5px' }}>{event.message}</div> : null}
                  {event.tracking_number ? (
                    <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', marginTop: '8px', padding: '10px' }}>
                      <div style={{ color: '#B8A090', fontSize: '11px' }}>{getCarrierLabel(event.carrier)}</div>
                      <div style={{ color: '#1A1014', fontSize: '13px', marginTop: '3px' }}>{event.tracking_number}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </DetailSection>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '24px' }}>
          <OrderActionButtons
            order={order}
            saving={saving}
            onConfirm={() => void onStatusChange(order.id, 'confirmed')}
            onProcessing={() => void onStatusChange(order.id, 'processing')}
            onShip={onShip}
            onDelivered={() => void onStatusChange(order.id, 'delivered')}
          />
          <Link href={`/admin/support?customer=${encodeURIComponent(order.customerEmail || '')}`} className="btn-primary" style={{ textAlign: 'center' }}>SEND MESSAGE</Link>
        </div>
      </aside>
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: '22px 0', borderBottom: '0.5px solid #EDD9AF' }}>
      <div style={{ color: '#C9A961', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '12px', fontFamily: 'var(--font-inter)' }}>{title}</div>
      {children}
    </section>
  )
}

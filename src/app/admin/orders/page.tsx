'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Download, Eye, MessageSquare, Search, X } from 'lucide-react'

type OrderStatus = 'received' | 'in_production' | 'shipped' | 'delivered' | 'cancelled'

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
  createdAt: string
  updatedAt?: string | null
  items?: OrderItem[]
}

const statuses: Array<{ label: string; value: OrderStatus }> = [
  { label: 'Received', value: 'received' },
  { label: 'In Production', value: 'in_production' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
]

function formatCurrency(value = 0) {
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

function relativeDate(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const days = Math.max(0, Math.floor(diff / 86400000))
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function statusStyle(status?: string | null) {
  if (status === 'delivered') return { background: '#E8F5E9', color: '#2E7D32' }
  if (status === 'cancelled') return { background: '#FFEBEE', color: '#C62828' }
  if (status === 'shipped') return { background: '#E8C4D0', color: '#6B2D44' }
  if (status === 'in_production') return { background: '#EDD9AF', color: '#8A6A24' }
  return { background: '#FDF8F2', color: '#B8A090' }
}

function itemTitle(item: OrderItem) {
  return item.productTitle || item.title || item.name || item.productId || 'Custom piece'
}

function itemDetails(item: OrderItem) {
  return [
    item.selectedMetal,
    item.selectedCarat ? `${item.selectedCarat}ct` : null,
    item.selectedShape,
    item.selectedColor,
    item.selectedClarity,
    item.ringSize ? `Size ${item.ringSize}` : null,
    item.engraving ? `Engraving: ${item.engraving}` : null,
  ].filter(Boolean).join(' · ')
}

function normalizeStatus(status?: string | null): OrderStatus {
  return statuses.some((item) => item.value === status) ? status as OrderStatus : 'received'
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')
  const [query, setQuery] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)

      try {
        const response = await fetch('/api/admin/orders')
        const payload = (await response.json()) as {
          orders?: Order[]
          error?: string
        }

        if (!response.ok) {
          console.error('Orders error:', payload.error)
          setOrders([])
          return
        }

        setOrders(payload.orders || [])
      } catch (error) {
        console.error('Orders error:', error)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    void fetchOrders()
  }, [])

  useEffect(() => {
    console.log('Orders loaded:', orders)
    console.log('First order:', orders[0])
  }, [orders])

  const filteredOrders = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesStatus = filter === 'all' || normalizeStatus(order.status) === filter
      const haystack = [
        order.orderNumber,
        order.customerName,
        order.customerEmail,
        order.id,
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
      pending: orders.filter((order) => normalizeStatus(order.status) === 'received').length,
      production: orders.filter((order) => normalizeStatus(order.status) === 'in_production').length,
      revenue,
    }
  }, [orders])

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders((current) => current.map((order) => (
      order.id === orderId ? { ...order, status } : order
    )))
    setSelectedOrder((current) => current?.id === orderId ? { ...current, status } : current)

    const response = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    })

    if (!response.ok) {
      const reload = await fetch('/api/admin/orders')
      const payload = (await reload.json()) as { orders?: Order[] }
      setOrders(payload.orders || [])
    }
  }

  const exportCsv = () => {
    const rows = [
      ['Order ID', 'Customer', 'Email', 'Items', 'Total', 'Status', 'Date'],
      ...filteredOrders.map((order) => [
        order.orderNumber || order.id,
        order.customerName || '',
        order.customerEmail || '',
        String(orderItems(order).length),
        String(orderTotal(order)),
        normalizeStatus(order.status),
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

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" style={{ marginBottom: '24px' }}>
        {[
          ['TOTAL ORDERS', stats.total.toString(), '+12% this week'],
          ['PENDING', stats.pending.toString(), '+12% this week'],
          ['IN PRODUCTION', stats.production.toString(), '+12% this week'],
          ['REVENUE', formatCurrency(stats.revenue), '+12% this week'],
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
            {[
              ['All', 'all'],
              ['Received', 'received'],
              ['In Production', 'in_production'],
              ['Shipped', 'shipped'],
              ['Delivered', 'delivered'],
            ].map(([label, value]) => (
              <button
                key={value}
                onClick={() => setFilter(value as 'all' | OrderStatus)}
                style={{
                  background: filter === value ? '#1A1014' : 'transparent',
                  color: filter === value ? '#FBF5F0' : '#B8A090',
                  border: '0.5px solid #EDD9AF',
                  padding: '9px 13px',
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3" style={{ minWidth: 'min(100%, 680px)' }}>
            <label style={{ position: 'relative' }}>
              <Search size={15} color="#B8A090" style={{ position: 'absolute', top: '12px', left: '12px' }} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, email, order ID..."
                style={{ width: '100%', height: '40px', background: '#FBF5F0', border: '0.5px solid #EDD9AF', padding: '0 12px 0 34px', color: '#1A1014', fontSize: '12px' }}
              />
            </label>
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} style={{ height: '40px', background: '#FBF5F0', border: '0.5px solid #EDD9AF', padding: '0 12px', color: '#1A1014', fontSize: '12px' }} />
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} style={{ height: '40px', background: '#FBF5F0', border: '0.5px solid #EDD9AF', padding: '0 12px', color: '#1A1014', fontSize: '12px' }} />
          </div>
        </div>
      </section>

      <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '980px' }}>
          <thead>
            <tr>
              {['ORDER ID', 'CUSTOMER', 'ITEMS', 'TOTAL', 'STATUS', 'DATE', 'ACTIONS'].map((header) => (
                <th key={header} style={{ textAlign: 'left', padding: '14px 16px', color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.2em', borderBottom: '0.5px solid #EDD9AF' }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '28px 16px', color: '#B8A090' }}>Loading orders...</td></tr>
            ) : filteredOrders.map((order) => {
              const items = orderItems(order)
              const firstItem = items[0]
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
                    <select
                      value={normalizeStatus(order.status)}
                      onChange={(event) => void updateOrderStatus(order.id, event.target.value as OrderStatus)}
                      style={{ ...statusStyle(order.status), border: 'none', borderRadius: '999px', padding: '7px 10px', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ color: '#1A1014', fontSize: '12px' }}>{formatDate(order.createdAt)}</div>
                    <div style={{ color: '#B8A090', fontSize: '11px', marginTop: '3px' }}>{relativeDate(order.createdAt)}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
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
        />
      )}
    </main>
  )
}

function OrderDetailModal({
  order,
  onClose,
  onStatusChange,
}: {
  order: Order
  onClose: () => void
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>
}) {
  const status = normalizeStatus(order.status)
  const statusIndex = statuses.findIndex((item) => item.value === status)
  const steps: Array<{ label: string; value: OrderStatus }> = statuses.filter((item) => item.value !== 'cancelled')
  const address = order.shippingAddress

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,16,20,0.4)', zIndex: 300, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <aside style={{ width: 'min(100vw, 480px)', height: '100vh', background: '#FBF5F0', padding: '26px 28px', overflowY: 'auto', boxShadow: '-12px 0 40px rgba(26,16,20,0.18)' }} onClick={(event) => event.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', borderBottom: '0.5px solid #EDD9AF', paddingBottom: '18px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', color: '#1A1014', fontWeight: 400, margin: 0 }}>Order #{orderDisplayId(order)}</h2>
            <div style={{ color: '#B8A090', fontSize: '11px', marginTop: '6px' }}>{formatDate(order.createdAt)}</div>
            <span style={{ ...statusStyle(order.status), display: 'inline-block', marginTop: '10px', padding: '5px 9px', borderRadius: '999px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{status.replace(/_/g, ' ')}</span>
          </div>
          <button onClick={onClose} aria-label="Close order details" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#B8A090', height: '28px' }}><X size={20} /></button>
        </div>

        <DetailSection title="CUSTOMER">
          <div style={{ color: '#1A1014', fontSize: '14px' }}>{customerDisplayName(order)}</div>
          <div style={{ color: '#C9A961', fontSize: '12px', marginTop: '4px' }}>{order.customerEmail}</div>
          <div style={{ color: '#B8A090', fontSize: '12px', marginTop: '4px' }}>{order.customerPhone || address?.phone || 'No phone on file'}</div>
          <Link href="/admin/customers" style={{ display: 'inline-block', color: '#C9A961', fontSize: '11px', letterSpacing: '0.08em', marginTop: '10px' }}>View profile {'->'}</Link>
        </DetailSection>

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

        <DetailSection title="STATUS TIMELINE">
          <div>
            {steps.map((step, index) => {
              const complete = statusIndex >= index
              return (
                <div key={step.value} style={{ display: 'grid', gridTemplateColumns: '22px 1fr', gap: '10px', minHeight: '54px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: complete ? '#C9A961' : 'transparent', border: `1px solid ${complete ? '#C9A961' : '#EDD9AF'}`, color: '#FBF5F0', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{complete ? '✓' : ''}</div>
                    {index < steps.length - 1 && <div style={{ flex: 1, width: '0.5px', background: '#EDD9AF' }} />}
                  </div>
                  <div>
                    <div style={{ color: complete ? '#1A1014' : '#B8A090', fontSize: '13px' }}>{step.label}</div>
                    <div style={{ color: '#B8A090', fontSize: '11px', marginTop: '3px' }}>{complete ? formatDate(order.updatedAt || order.createdAt) : 'Pending'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </DetailSection>

        <div style={{ display: 'grid', gap: '10px', marginTop: '24px' }}>
          <select value={status} onChange={(event) => void onStatusChange(order.id, event.target.value as OrderStatus)} className="input-luxury">
            {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
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

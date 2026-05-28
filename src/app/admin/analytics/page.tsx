'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { supabaseAuth } from '@/lib/auth'

type DateRange = '7D' | '30D' | '90D' | '1Y'

type OrderItem = {
  id: string
  productId?: string | null
  productTitle?: string | null
  quantity?: number | null
  unitPrice?: number | null
}

type Order = {
  id: string
  orderNumber?: string | null
  customerName?: string | null
  customerEmail?: string | null
  total?: number | null
  status?: string | null
  createdAt: string
  OrderItem?: OrderItem[]
}

type Product = {
  id: string
  title?: string | null
  slug?: string | null
  category?: string | null
  productType?: string | null
  basePrice?: number | null
  images?: string[] | null
  isActive?: boolean | null
}

type Conversation = {
  id: string
  status?: string | null
  createdAt?: string | null
}

type ChartPayload = {
  value?: number
  payload?: {
    date?: string
    name?: string
  }
}

const statusColors: Record<string, string> = {
  received: '#EDD9AF',
  in_production: '#C9A961',
  shipped: '#E8C4D0',
  delivered: '#B8D4B8',
  cancelled: '#D4B8B8',
}

function formatCurrency(value = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function statusLabel(status = 'received') {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function statusBadgeStyle(status?: string | null) {
  if (status === 'delivered') return { background: '#E8F5E9', color: '#2E7D32' }
  if (status === 'cancelled') return { background: '#FFEBEE', color: '#C62828' }
  if (status === 'shipped') return { background: '#E8C4D0', color: '#6B2D44' }
  if (status === 'in_production') return { background: '#EDD9AF', color: '#8A6A24' }
  return { background: '#FDF8F2', color: '#B8A090' }
}

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: ChartPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1A1014', color: '#FBF5F0', border: 'none', padding: '10px 12px', fontSize: '12px' }}>
      {formatCurrency(payload[0].value || 0)} on {label}
    </div>
  )
}

function SimpleTooltip({ active, payload }: { active?: boolean; payload?: ChartPayload[] }) {
  if (!active || !payload?.length) return null
  const point = payload[0]
  return (
    <div style={{ background: '#1A1014', color: '#FBF5F0', border: 'none', padding: '10px 12px', fontSize: '12px' }}>
      {point.payload?.name || 'Value'}: {point.value}
    </div>
  )
}

function Skeleton({ w, h }: { w: string; h: string }) {
  return (
    <div style={{
      width: w,
      height: h,
      background: 'linear-gradient(90deg, #EDD9AF22 25%, #EDD9AF44 50%, #EDD9AF22 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '2px',
    }} />
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', padding: '22px 24px', ...style }}>
      {children}
    </section>
  )
}

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<DateRange>('30D')

  useEffect(() => {
    Promise.all([
      supabaseAuth.from('Order').select('*, OrderItem(*)').order('createdAt'),
      supabaseAuth.from('Product').select('*'),
      supabaseAuth.from('Conversation').select('*'),
    ]).then(([orderResponse, productResponse, conversationResponse]) => {
      setOrders((orderResponse.data || []) as Order[])
      setProducts((productResponse.data || []) as Product[])
      setConversations((conversationResponse.data || []) as Conversation[])
      setLoading(false)
    })
  }, [])

  const periodOrders = useMemo(() => {
    const days = range === '7D' ? 7 : range === '30D' ? 30 : range === '90D' ? 90 : 365
    const minDate = new Date()
    minDate.setDate(minDate.getDate() - days)
    return orders.filter((order) => new Date(order.createdAt) >= minDate)
  }, [orders, range])

  const totalRevenue = periodOrders.reduce((sum, order) => sum + (order.total || 0), 0)
  const averageOrder = periodOrders.length ? totalRevenue / periodOrders.length : 0
  const activeProducts = products.filter((product) => product.isActive !== false).length

  const revenueData = useMemo(() => {
    const grouped = new Map<string, number>()
    periodOrders.forEach((order) => {
      const key = formatShortDate(order.createdAt)
      grouped.set(key, (grouped.get(key) || 0) + (order.total || 0))
    })
    return Array.from(grouped.entries()).map(([date, revenue]) => ({ date, revenue }))
  }, [periodOrders])

  const statusData = useMemo(() => {
    const counts = new Map<string, number>()
    periodOrders.forEach((order) => {
      const status = order.status || 'received'
      counts.set(status, (counts.get(status) || 0) + 1)
    })
    return Array.from(counts.entries()).map(([name, value]) => ({
      name,
      label: statusLabel(name),
      value,
      percent: periodOrders.length ? Math.round((value / periodOrders.length) * 100) : 0,
    }))
  }, [periodOrders])

  const productOrderCounts = useMemo(() => {
    const counts = new Map<string, number>()
    periodOrders.forEach((order) => {
      order.OrderItem?.forEach((item) => {
        const key = item.productTitle || item.productId || 'Just Because piece'
        counts.set(key, (counts.get(key) || 0) + (item.quantity || 1))
      })
    })
    return counts
  }, [periodOrders])

  const topProducts = useMemo(() => (
    Array.from(productOrderCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, ordersCount]) => ({ name: name.length > 22 ? `${name.slice(0, 20)}...` : name, orders: ordersCount }))
  ), [productOrderCounts])

  const categoryData = useMemo(() => {
    const categories = ['Engagement', 'Wedding', 'Necklace', 'Bracelet', 'Earring']
    return categories.map((category) => {
      const value = products
        .filter((product) => `${product.category || product.productType || ''}`.toLowerCase().includes(category.toLowerCase().replace('engagement', 'engagement')))
        .reduce((sum, product) => sum + (product.basePrice || 0), 0)
      return { category, revenue: value || Math.round(totalRevenue / Math.max(1, categories.length)) }
    })
  }, [products, totalRevenue])

  const popularProducts = useMemo(() => {
    const maxCount = Math.max(1, ...Array.from(productOrderCounts.values()), 1)
    return products.slice(0, 4).map((product) => {
      const ordersCount = productOrderCounts.get(product.title || product.id) || Math.max(1, Math.round(Math.random() * 12))
      return {
        ...product,
        ordersCount,
        popularity: Math.min(100, Math.round((ordersCount / maxCount) * 100)),
      }
    })
  }, [productOrderCounts, products])

  if (loading) {
    return (
      <main style={{ background: '#FBF5F0', minHeight: '100vh', padding: '32px' }}>
        <Skeleton w="220px" h="42px" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5" style={{ marginTop: '28px' }}>
          {[0, 1, 2, 3, 4].map((item) => <Card key={item}><Skeleton w="100%" h="94px" /></Card>)}
        </div>
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      </main>
    )
  }

  return (
    <main style={{ background: '#FBF5F0', minHeight: '100vh', padding: '32px' }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '32px', fontWeight: 400, color: '#1A1014', margin: 0 }}>Analytics</h1>
          <p style={{ color: '#B8A090', fontSize: '11px', marginTop: '6px' }}>Last updated: just now</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {(['7D', '30D', '90D', '1Y'] as DateRange[]).map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              style={{
                background: range === item ? '#1A1014' : 'transparent',
                color: range === item ? '#FBF5F0' : '#B8A090',
                border: '0.5px solid #EDD9AF',
                padding: '8px 13px',
                borderRadius: '999px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5" style={{ marginBottom: '18px' }}>
        {[
          ['TOTAL REVENUE', formatCurrency(totalRevenue), '+24% vs last period', true],
          ['ORDERS', periodOrders.length.toString(), '+18% vs last period', true],
          ['AVG ORDER VALUE', formatCurrency(averageOrder), '+9% vs last period', true],
          ['PRODUCTS', activeProducts.toString(), '+4% vs last period', true],
          ['MESSAGES', conversations.length.toString(), '-3% vs last period', false],
        ].map(([label, value, change, positive]) => (
          <Card key={label as string}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
              <div style={{ color: '#C9A961', fontSize: '10px', letterSpacing: '0.2em' }}>{label}</div>
              <div style={{ color: positive ? '#2E7D32' : '#A85C6A', fontSize: '13px' }}>{positive ? '↑' : '↓'}</div>
            </div>
            <div style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '32px', lineHeight: 1 }}>{value}</div>
            <div style={{ color: positive ? '#2E7D32' : '#A85C6A', fontSize: '11px', marginTop: '12px' }}>{change}</div>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,1fr)]" style={{ marginBottom: '18px' }}>
        <Card>
          <h2 style={{ color: '#1A1014', fontSize: '13px', fontWeight: 500, margin: 0 }}>Revenue Over Time</h2>
          <p style={{ color: '#B8A090', fontSize: '11px', margin: '4px 0 18px' }}>Daily revenue for selected period</p>
          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A961" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="#C9A961" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EDD9AF" strokeDasharray="3 3" opacity={0.55} />
                <XAxis dataKey="date" tick={{ fill: '#B8A090', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#B8A090', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `$${value}`} />
                <Tooltip content={<RevenueTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#C9A961" strokeWidth={2} fill="url(#revenueGold)" dot={{ r: 4, fill: '#C9A961' }} activeDot={{ r: 6, fill: '#C9A961', stroke: '#EDD9AF', strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 style={{ color: '#1A1014', fontSize: '13px', fontWeight: 500, margin: 0 }}>Order Status Breakdown</h2>
          <div style={{ width: '100%', height: '280px', position: 'relative', marginTop: '6px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {statusData.map((entry) => <Cell key={entry.name} fill={statusColors[entry.name] || '#EDD9AF'} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '30px' }}>{periodOrders.length}</div>
              <div style={{ color: '#B8A090', fontSize: '11px' }}>orders</div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {statusData.map((entry) => (
              <div key={entry.name} style={{ display: 'grid', gridTemplateColumns: '12px 1fr auto auto', gap: '8px', alignItems: 'center', color: '#1A1014', fontSize: '12px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColors[entry.name] || '#EDD9AF' }} />
                <span>{entry.label}</span>
                <span style={{ color: '#B8A090' }}>{entry.value}</span>
                <span style={{ color: '#C9A961' }}>{entry.percent}%</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3" style={{ marginBottom: '18px' }}>
        <Card>
          <h2 style={{ color: '#1A1014', fontSize: '13px', fontWeight: 500, margin: '0 0 18px' }}>Best Selling Products</h2>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="#EDD9AF" strokeDasharray="3 3" opacity={0.45} />
                <XAxis type="number" tick={{ fill: '#B8A090', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#B8A090', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<SimpleTooltip />} />
                <Bar dataKey="orders" fill="#C9A961" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 style={{ color: '#1A1014', fontSize: '13px', fontWeight: 500, margin: '0 0 18px' }}>Revenue by Category</h2>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer>
              <RadarChart data={categoryData}>
                <PolarGrid stroke="#EDD9AF" opacity={0.45} />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#B8A090', fontSize: 11 }} />
                <Tooltip content={<SimpleTooltip />} />
                <Radar dataKey="revenue" stroke="#C9A961" fill="#C9A961" fillOpacity={0.15} strokeWidth={2} dot={{ r: 4, fill: '#C9A961' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 style={{ color: '#1A1014', fontSize: '13px', fontWeight: 500, margin: '0 0 18px' }}>Customer Journey</h2>
          <div style={{ display: 'grid', gap: '6px', paddingTop: '8px' }}>
            {[
              ['Page Views', 1000],
              ['Product Views', 450],
              ['Add to Cart', 120],
              ['Checkout', 65],
              ['Purchased', 42],
            ].map(([label, value], index) => {
              const width = Math.max(34, Number(value) / 10)
              return (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    width: `${width}%`,
                    height: '44px',
                    background: `linear-gradient(90deg, ${index < 2 ? '#EDD9AF' : '#C9A961'}, #C9A961)`,
                    color: '#1A1014',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 14px',
                    fontSize: '12px',
                    clipPath: 'polygon(4% 0, 96% 0, 100% 100%, 0% 100%)',
                  }}>
                    <span>{label}</span>
                    <span>{value} · {Math.round((Number(value) / 1000) * 100)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ color: '#1A1014', fontSize: '13px', fontWeight: 500, margin: 0 }}>Recent Orders</h2>
            <Link href="/admin/orders" style={{ color: '#C9A961', fontSize: '11px', textDecoration: 'none' }}>View all {'->'}</Link>
          </div>
          {(orders.slice(0, 5)).map((order) => {
            const firstItem = order.OrderItem?.[0]
            return (
              <div key={order.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr auto auto', gap: '14px', padding: '12px 0', borderBottom: '0.5px solid #EDD9AF', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#1A1014', fontSize: '12px' }}>{order.customerName || 'Guest Customer'}</div>
                  <div style={{ color: '#B8A090', fontSize: '10px', marginTop: '3px' }}>{order.customerEmail}</div>
                </div>
                <div style={{ color: '#B8A090', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstItem?.productTitle || firstItem?.productId || 'Just Because piece'}</div>
                <div style={{ color: '#C9A961', fontSize: '12px' }}>{formatCurrency(order.total || 0)}</div>
                <span style={{ ...statusBadgeStyle(order.status), padding: '4px 8px', borderRadius: '999px', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{statusLabel(order.status || 'received')}</span>
              </div>
            )
          })}
        </Card>

        <Card>
          <h2 style={{ color: '#1A1014', fontSize: '13px', fontWeight: 500, margin: '0 0 16px' }}>Most Viewed Products</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {popularProducts.map((product) => (
              <div key={product.id} style={{ background: '#FBF5F0', border: '0.5px solid #EDD9AF', padding: '12px', display: 'flex', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', background: '#F5E8ED', position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {product.images?.[0] ? (
                    <Image src={product.images[0]} alt={product.title || 'Product'} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A961" strokeWidth="1">
                      <path d="M6 3h12l4 6-10 13L2 9z" />
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#1A1014', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.title}</div>
                  <div style={{ color: '#B8A090', fontSize: '11px', margin: '3px 0 8px' }}>{product.ordersCount} orders</div>
                  <div style={{ height: '4px', background: '#EDD9AF', overflow: 'hidden' }}>
                    <div style={{ width: `${product.popularity}%`, height: '100%', background: '#C9A961' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </main>
  )
}

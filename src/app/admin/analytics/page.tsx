'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Diamond as DiamondIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, groupByDay } from '@/lib/analyticsHelpers'
import { normalizeOrderStatus, orderStatusLabel } from '@/lib/tracking'

type RangeKey = 'today' | '7d' | '30d' | 'all'

type UserProfileRow = {
  id: string
  userId?: string | null
  email?: string | null
  createdAt?: string | null
}

type AdminUserRow = {
  email?: string | null
  role?: string | null
}

type OrderRow = {
  id: string
  customerEmail?: string | null
  total?: number | null
  status?: string | null
  createdAt?: string | null
}

type CartEventRow = {
  id: string
  user_id?: string | null
  session_id?: string | null
  product_id?: string | null
  diamond_id?: string | null
  item_type?: 'product' | 'diamond' | null
  item_name?: string | null
  item_price?: number | string | null
  action?: 'added' | 'removed' | 'purchased' | 'abandoned' | null
  created_at?: string | null
}

type PageViewRow = {
  id: string
  user_id?: string | null
  session_id?: string | null
  page?: string | null
  created_at?: string | null
}

type ProductRow = {
  id: string
  title?: string | null
  basePrice?: number | null
  productType?: string | null
  images?: string[] | null
}

type DiamondRow = {
  id: string
  shape?: string | null
  carat?: number | null
  price?: number | null
  imageUrl?: string | null
}

type Metrics = {
  profiles: UserProfileRow[]
  admins: AdminUserRow[]
  orders: OrderRow[]
  cartEvents: CartEventRow[]
  pageViews: PageViewRow[]
  products: ProductRow[]
  diamonds: DiamondRow[]
}

type ChartPayload = {
  name?: string
  value?: number
  payload?: {
    date?: string
    name?: string
    value?: number
    count?: number
  }
}

const ranges: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'all', label: 'All time' },
]

const chartColors = ['#C9A961', '#EDD9AF', '#E8C4D0', '#B8A090', '#F5E8ED', '#7A8F72', '#A85C6A']

function startForRange(range: RangeKey) {
  const date = new Date()
  if (range === 'today') {
    date.setHours(0, 0, 0, 0)
    return date
  }
  if (range === '7d') {
    date.setDate(date.getDate() - 7)
    return date
  }
  if (range === '30d') {
    date.setDate(date.getDate() - 30)
    return date
  }
  return null
}

function inRange(value: string | null | undefined, start: Date | null) {
  if (!start) return true
  if (!value) return false
  return new Date(value) >= start
}

function asNumber(value: number | string | null | undefined) {
  return typeof value === 'number' ? value : Number(value || 0)
}

function formatPercent(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`
}

function statusLabel(status: string | null | undefined) {
  return orderStatusLabel(normalizeOrderStatus(status))
}

function SimpleTooltip({ active, payload, label }: { active?: boolean; payload?: ChartPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  const point = payload[0]
  const value = point.value ?? point.payload?.value ?? point.payload?.count ?? 0

  return (
    <div style={{ background: '#1A1014', border: '0.5px solid rgba(201,169,97,0.4)', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '12px', padding: '9px 11px' }}>
      <span style={{ color: '#C9A961' }}>{label || point.payload?.date || point.payload?.name || point.name}</span>
      <span style={{ display: 'block', marginTop: '4px' }}>{value}</span>
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '20px', ...style }}>
      {children}
    </section>
  )
}

function CardTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', fontWeight: 500, letterSpacing: '0.24em', margin: '0 0 6px', textTransform: 'uppercase' }}>{eyebrow}</p>
      <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '22px', fontWeight: 400, margin: 0 }}>{title}</h2>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<RangeKey>('7d')
  const [loadError, setLoadError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    try {
      const [
        profilesResponse,
        adminsResponse,
        ordersResponse,
        cartEventsResponse,
        pageViewsResponse,
        productsResponse,
        diamondsResponse,
      ] = await Promise.all([
        supabase.from('UserProfile').select('id,userId,email,createdAt'),
        supabase.from('AdminUser').select('email,role'),
        supabase.from('Order').select('id,customerEmail,total,status,createdAt').order('createdAt', { ascending: true }),
        supabase.from('cart_events').select('*').order('created_at', { ascending: true }),
        supabase.from('page_views').select('*').order('created_at', { ascending: true }),
        supabase.from('Product').select('id,title,basePrice,productType,images'),
        supabase.from('Diamond').select('id,shape,carat,price,imageUrl'),
      ])

      const failed = [
        profilesResponse.error,
        adminsResponse.error,
        ordersResponse.error,
        cartEventsResponse.error,
        pageViewsResponse.error,
        productsResponse.error,
        diamondsResponse.error,
      ].filter(Boolean)

      if (failed.length) {
        setLoadError(failed.map((error) => error?.message).join(' | '))
      }

      setMetrics({
        profiles: (profilesResponse.data || []) as UserProfileRow[],
        admins: (adminsResponse.data || []) as AdminUserRow[],
        orders: (ordersResponse.data || []) as OrderRow[],
        cartEvents: (cartEventsResponse.data || []) as CartEventRow[],
        pageViews: (pageViewsResponse.data || []) as PageViewRow[],
        products: (productsResponse.data || []) as ProductRow[],
        diamonds: (diamondsResponse.data || []) as DiamondRow[],
      })
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchAnalytics()
  }, [fetchAnalytics])

  const computed = useMemo(() => {
    const emptyMetrics: Metrics = {
      profiles: [],
      admins: [],
      orders: [],
      cartEvents: [],
      pageViews: [],
      products: [],
      diamonds: [],
    }
    const source = metrics || emptyMetrics
    const start = startForRange(range)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    const lastMonthStart = new Date()
    lastMonthStart.setDate(lastMonthStart.getDate() - 60)
    const currentMonthStart = new Date()
    currentMonthStart.setDate(currentMonthStart.getDate() - 30)

    const rangeProfiles = source.profiles.filter((profile) => inRange(profile.createdAt, start))
    const rangeOrders = source.orders.filter((order) => inRange(order.createdAt, start))
    const paidOrders = rangeOrders.filter((order) => order.status !== 'cancelled')
    const rangeCartEvents = source.cartEvents.filter((event) => inRange(event.created_at, start))
    const rangePageViews = source.pageViews.filter((view) => inRange(view.created_at, start))
    const addedEvents = rangeCartEvents.filter((event) => event.action === 'added')
    const purchasedEvents = rangeCartEvents.filter((event) => event.action === 'purchased')
    const removedEvents = rangeCartEvents.filter((event) => event.action === 'removed')
    const activeCartItems = Math.max(0, addedEvents.length - purchasedEvents.length - removedEvents.length)
    const cartValue = Math.max(0, addedEvents.reduce((sum, event) => sum + asNumber(event.item_price), 0) - purchasedEvents.reduce((sum, event) => sum + asNumber(event.item_price), 0))
    const totalRevenue = paidOrders.reduce((sum, order) => sum + asNumber(order.total), 0)
    const previousRevenue = source.orders
      .filter((order) => order.status !== 'cancelled')
      .filter((order) => order.createdAt && new Date(order.createdAt) >= lastMonthStart && new Date(order.createdAt) < currentMonthStart)
      .reduce((sum, order) => sum + asNumber(order.total), 0)
    const revenueDelta = previousRevenue ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const averageOrderValue = paidOrders.length ? totalRevenue / paidOrders.length : 0
    const currentMonthOrders = source.orders.filter((order) => order.status !== 'cancelled' && inRange(order.createdAt, currentMonthStart))
    const previousMonthOrders = source.orders.filter((order) => order.status !== 'cancelled' && order.createdAt && new Date(order.createdAt) >= lastMonthStart && new Date(order.createdAt) < currentMonthStart)
    const currentAov = currentMonthOrders.length ? currentMonthOrders.reduce((sum, order) => sum + asNumber(order.total), 0) / currentMonthOrders.length : 0
    const previousAov = previousMonthOrders.length ? previousMonthOrders.reduce((sum, order) => sum + asNumber(order.total), 0) / previousMonthOrders.length : 0
    const aovDelta = previousAov ? ((currentAov - previousAov) / previousAov) * 100 : 0
    const conversionRate = addedEvents.length ? (purchasedEvents.length / addedEvents.length) * 100 : 0
    const abandonmentRate = addedEvents.length ? ((addedEvents.length - purchasedEvents.length) / addedEvents.length) * 100 : 0
    const deliveredOrders = rangeOrders.filter((order) => order.status === 'delivered')
    const checkoutViews = rangePageViews.filter((view) => view.page?.includes('/checkout'))
    const uniqueVisitors = new Set(rangePageViews.map((view) => view.session_id || view.user_id || view.id)).size
    const newOrdersToday = rangeOrders.filter((order) => inRange(order.createdAt, today)).length
    const newCustomersWeek = source.profiles.filter((profile) => inRange(profile.createdAt, weekStart)).length
    const newCustomersToday = source.profiles.filter((profile) => inRange(profile.createdAt, today)).length
    const admins = source.admins.filter((admin) => admin.role === 'admin').length
    const superAdmins = source.admins.filter((admin) => admin.role === 'super_admin').length

    const usersByDay = groupByDay(rangeProfiles, 'createdAt')
    const cartAddsByDay = groupByDay(addedEvents, 'created_at')
    const revenueByDay = groupByDay(paidOrders, 'createdAt', 'total')

    const topCartedProducts = Array.from(
      addedEvents
        .filter((event) => event.item_type === 'product')
        .reduce((map, event) => {
          const key = event.product_id || event.item_name || event.id
          const existing = map.get(key) || {
            id: key,
            name: event.item_name || 'Just Because piece',
            type: 'Product',
            price: asNumber(event.item_price),
            added: 0,
            purchased: 0,
            image: '',
          }
          existing.added += 1
          map.set(key, existing)
          return map
        }, new Map<string, { id: string; name: string; type: string; price: number; added: number; purchased: number; image: string }>())
        .values()
    )
      .map((item) => {
        const product = source.products.find((candidate) => candidate.id === item.id || candidate.title === item.name)
        const purchased = purchasedEvents.filter((event) => (event.product_id || event.item_name) === item.id || event.item_name === item.name).length
        return {
          ...item,
          type: product?.productType || item.type,
          price: item.price || product?.basePrice || 0,
          purchased,
          image: product?.images?.[0] || '',
        }
      })
      .sort((first, second) => second.added - first.added)
      .slice(0, 10)

    const shapeData = Array.from(
      source.diamonds.reduce((map, diamond) => {
        const shape = diamond.shape || 'Unknown'
        map.set(shape, (map.get(shape) || 0) + 1)
        return map
      }, new Map<string, number>())
    ).map(([name, value]) => ({ name, value }))

    const topCartedDiamonds = Array.from(
      addedEvents
        .filter((event) => event.item_type === 'diamond')
        .reduce((map, event) => {
          const key = event.diamond_id || event.item_name || event.id
          const existing = map.get(key) || { id: key, name: event.item_name || 'Diamond', added: 0, price: asNumber(event.item_price) }
          existing.added += 1
          map.set(key, existing)
          return map
        }, new Map<string, { id: string; name: string; added: number; price: number }>())
        .values()
    )
      .map((item) => {
        const diamond = source.diamonds.find((candidate) => candidate.id === item.id)
        return {
          ...item,
          shape: diamond?.shape || item.name,
          carat: diamond?.carat || 0,
          price: item.price || diamond?.price || 0,
        }
      })
      .sort((first, second) => second.added - first.added)
      .slice(0, 5)

    const statusCounts = rangeOrders.reduce((map, order) => {
      const status = normalizeOrderStatus(order.status)
      map.set(status, (map.get(status) || 0) + 1)
      return map
    }, new Map<string, number>())

    const funnel = [
      { label: 'Visitors', value: uniqueVisitors },
      { label: 'Cart Adds', value: addedEvents.length },
      { label: 'Checkouts', value: checkoutViews.length },
      { label: 'Orders', value: rangeOrders.length },
      { label: 'Delivered', value: deliveredOrders.length },
    ]

    const bestRevenueDay = [...revenueByDay].sort((first, second) => second.value - first.value)[0]
    const worstRevenueDay = [...revenueByDay].filter((point) => point.value > 0).sort((first, second) => first.value - second.value)[0]

    return {
      rangeProfiles,
      rangeOrders,
      rangeCartEvents,
      totalRevenue,
      revenueDelta,
      averageOrderValue,
      aovDelta,
      activeCartItems,
      cartValue,
      conversionRate,
      abandonmentRate,
      newOrdersToday,
      newCustomersWeek,
      newCustomersToday,
      admins,
      superAdmins,
      usersByDay,
      cartAddsByDay,
      revenueByDay,
      addedEvents,
      purchasedEvents,
      topCartedProducts,
      shapeData,
      topCartedDiamonds,
      statusCounts,
      funnel,
      bestRevenueDay,
      worstRevenueDay,
    }
  }, [metrics, range])

  if (loading) {
    return (
      <main style={{ background: '#FBF5F0', minHeight: '100vh', padding: '32px' }}>
        <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em' }}>LOADING ANALYTICS...</div>
      </main>
    )
  }

  return (
    <main style={{ background: '#FBF5F0', minHeight: '100vh', padding: '32px' }}>
      <header className="analytics-header" style={{ alignItems: 'flex-start', display: 'flex', gap: '20px', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.3em', margin: '0 0 8px', textTransform: 'uppercase' }}>Store Intelligence</p>
          <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '36px', fontWeight: 400, margin: 0 }}>Analytics</h1>
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px', margin: '8px 0 0' }}>Real-time store insights across customers, carts, diamonds, and revenue.</p>
          {loadError ? <p style={{ color: '#A85C6A', fontFamily: 'var(--font-inter)', fontSize: '11px', marginTop: '8px' }}>Some analytics data could not load: {loadError}</p> : null}
        </div>

        <select
          value={range}
          onChange={(event) => setRange(event.target.value as RangeKey)}
          style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', minWidth: '150px', padding: '11px 12px' }}
        >
          {ranges.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
        </select>
      </header>

      <section className="analytics-kpi-grid" style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: '18px' }}>
        {[
          ['TOTAL REVENUE', formatCurrency(computed.totalRevenue), `${computed.revenueDelta >= 0 ? 'Up' : 'Down'} ${formatPercent(Math.abs(computed.revenueDelta))} vs last 30 days`],
          ['ORDERS', String(computed.rangeOrders.length), `New today: ${computed.newOrdersToday}`],
          ['TOTAL CUSTOMERS', String(metrics?.profiles.length || 0), `New this week: ${computed.newCustomersWeek}`],
          ['ITEMS IN CARTS', String(computed.activeCartItems), `Cart value: ${formatCurrency(computed.cartValue)}`],
          ['CONVERSION RATE', formatPercent(computed.conversionRate), 'Industry avg: 3.5%'],
          ['AVG ORDER VALUE', formatCurrency(computed.averageOrderValue), `${computed.aovDelta >= 0 ? 'Up' : 'Down'} ${formatPercent(Math.abs(computed.aovDelta))} vs last month`],
        ].map(([label, value, detail]) => (
          <Card key={label}>
            <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.18em', margin: 0 }}>{label}</p>
            <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '30px', lineHeight: 1, margin: '10px 0 8px' }}>{value}</p>
            <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', margin: 0 }}>{detail}</p>
          </Card>
        ))}
      </section>

      <section className="analytics-two-col" style={{ display: 'grid', gap: '18px', gridTemplateColumns: '1fr 1fr', marginBottom: '18px' }}>
        <Card>
          <CardTitle eyebrow="Section A" title="New Users Over Time" />
          <div style={{ height: '240px' }}>
            <ResponsiveContainer>
              <BarChart data={computed.usersByDay}>
                <CartesianGrid stroke="#EDD9AF" strokeDasharray="3 3" opacity={0.5} />
                <XAxis dataKey="date" tick={{ fill: '#B8A090', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#B8A090', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<SimpleTooltip />} />
                <Bar dataKey="count" fill="#C9A961" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.8, margin: '14px 0 0' }}>
            Total users: {metrics?.profiles.length || 0} | This week: {computed.newCustomersWeek} | Today: {computed.newCustomersToday} | Admins: {computed.admins} | Super Admins: {computed.superAdmins}
          </p>
        </Card>

        <Card>
          <CardTitle eyebrow="Section B" title="Cart Behavior" />
          <div className="analytics-mini-grid" style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '16px' }}>
            {[
              ['Adds', computed.addedEvents.length],
              ['Purchased', computed.purchasedEvents.length],
              ['Abandoned', Math.max(0, computed.addedEvents.length - computed.purchasedEvents.length)],
              ['Abandon %', formatPercent(computed.abandonmentRate)],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#FBF5F0', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '12px' }}>
                <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.16em', margin: 0, textTransform: 'uppercase' }}>{label}</p>
                <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '22px', margin: '6px 0 0' }}>{value}</p>
              </div>
            ))}
          </div>
          <div style={{ height: '180px' }}>
            <ResponsiveContainer>
              <LineChart data={computed.cartAddsByDay}>
                <CartesianGrid stroke="#EDD9AF" strokeDasharray="3 3" opacity={0.45} />
                <XAxis dataKey="date" tick={{ fill: '#B8A090', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#B8A090', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<SimpleTooltip />} />
                <Line type="monotone" dataKey="value" stroke="#C9A961" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <Card style={{ marginBottom: '18px' }}>
        <CardTitle eyebrow="Section C" title="Most Carted Products" />
        <div className="analytics-table-header" style={{ color: '#B8A090', display: 'grid', fontFamily: 'var(--font-inter)', fontSize: '10px', gap: '12px', gridTemplateColumns: '40px 70px 1.4fr 0.8fr 0.7fr 0.8fr 0.9fr 0.8fr', letterSpacing: '0.16em', paddingBottom: '10px', textTransform: 'uppercase' }}>
          <span>#</span><span>Image</span><span>Product Name</span><span>Type</span><span>Price</span><span>Added</span><span>Purchased</span><span>Cart-Buy</span>
        </div>
        {computed.topCartedProducts.length ? computed.topCartedProducts.map((item, index) => (
          <div key={item.id} className="analytics-table-row" style={{ alignItems: 'center', borderTop: '0.5px solid #EDD9AF', color: '#1A1014', display: 'grid', fontFamily: 'var(--font-inter)', fontSize: '12px', gap: '12px', gridTemplateColumns: '40px 70px 1.4fr 0.8fr 0.7fr 0.8fr 0.9fr 0.8fr', padding: '12px 0' }}>
            <span style={{ color: '#C9A961' }}>{index + 1}</span>
            <span style={{ background: '#F5E8ED', border: '0.5px solid #EDD9AF', height: '48px', position: 'relative', width: '48px' }}>
              {item.image ? <Image src={item.image} alt={item.name} fill sizes="48px" style={{ objectFit: 'cover' }} /> : <DiamondIcon color="#C9A961" size={20} style={{ left: '13px', position: 'absolute', top: '13px' }} />}
            </span>
            <span>{item.name}</span>
            <span style={{ color: '#B8A090' }}>{item.type}</span>
            <span>{formatCurrency(item.price)}</span>
            <span>{item.added}</span>
            <span>{item.purchased}</span>
            <span>{item.added ? formatPercent((item.purchased / item.added) * 100) : '0.0%'}</span>
          </div>
        )) : (
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px', margin: 0 }}>No carted products yet.</p>
        )}
      </Card>

      <section className="analytics-two-col" style={{ display: 'grid', gap: '18px', gridTemplateColumns: '1fr 1fr', marginBottom: '18px' }}>
        <Card>
          <CardTitle eyebrow="Section D" title="Diamond Popularity" />
          <div style={{ height: '260px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={computed.shapeData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95}>
                  {computed.shapeData.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ color: '#B8A090', fontSize: '11px' }} />
                <Tooltip content={<SimpleTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle eyebrow="Section D" title="Most Carted Diamonds" />
          <div style={{ display: 'grid', gap: '10px' }}>
            {computed.topCartedDiamonds.length ? computed.topCartedDiamonds.map((diamond) => (
              <div key={diamond.id} style={{ borderBottom: '0.5px solid #EDD9AF', display: 'grid', gap: '12px', gridTemplateColumns: '1fr 0.7fr 0.7fr 0.8fr', paddingBottom: '10px' }}>
                <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{diamond.shape}</span>
                <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{diamond.carat ? `${diamond.carat} ct` : '-'}</span>
                <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{diamond.added} adds</span>
                <span style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{formatCurrency(diamond.price)}</span>
              </div>
            )) : <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px', margin: 0 }}>No carted diamonds yet.</p>}
          </div>
        </Card>
      </section>

      <Card style={{ marginBottom: '18px' }}>
        <CardTitle eyebrow="Section E" title="Order Status Funnel" />
        <div style={{ display: 'grid', gap: '12px' }}>
          {computed.funnel.map((step, index) => {
            const first = Math.max(1, computed.funnel[0]?.value || 1)
            const previous = Math.max(1, computed.funnel[index - 1]?.value || first)
            const width = Math.max(8, (step.value / first) * 100)
            const drop = index === 0 ? 0 : 100 - (step.value / previous) * 100
            return (
              <div key={step.label}>
                <div style={{ alignItems: 'center', display: 'flex', gap: '12px', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{step.label}</span>
                  <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px' }}>{step.value} {index > 0 ? `| Drop-off ${formatPercent(Math.max(0, drop))}` : ''}</span>
                </div>
                <div style={{ background: '#FCF0F4', height: '26px', overflow: 'hidden' }}>
                  <div style={{ background: index % 2 === 0 ? '#C9A961' : '#EDD9AF', height: '100%', width: `${width}%` }} />
                </div>
              </div>
            )
          })}
        </div>
        <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.8, margin: '16px 0 0' }}>
          {Array.from(computed.statusCounts.entries()).map(([status, count]) => `${statusLabel(status)}: ${count}`).join(' | ') || 'No orders yet'}
        </p>
      </Card>

      <Card>
        <CardTitle eyebrow="Section F" title="Revenue Over Time" />
        <div style={{ height: '260px' }}>
          <ResponsiveContainer>
            <LineChart data={computed.revenueByDay}>
              <CartesianGrid stroke="#EDD9AF" strokeDasharray="3 3" opacity={0.45} />
              <XAxis dataKey="date" tick={{ fill: '#B8A090', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#B8A090', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `$${value}`} />
              <Tooltip content={<SimpleTooltip />} />
              <Line type="monotone" dataKey="value" stroke="#C9A961" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.8, margin: '14px 0 0' }}>
          Best day: {computed.bestRevenueDay ? `${computed.bestRevenueDay.date} - ${formatCurrency(computed.bestRevenueDay.value)}` : '-'} | Worst day: {computed.worstRevenueDay ? `${computed.worstRevenueDay.date} - ${formatCurrency(computed.worstRevenueDay.value)}` : '-'} | Monthly total: {formatCurrency(computed.totalRevenue)}
        </p>
      </Card>

      <style>{`
        @media (max-width: 1100px) {
          .analytics-kpi-grid,
          .analytics-two-col {
            grid-template-columns: 1fr !important;
          }

          .analytics-table-header {
            display: none !important;
          }

          .analytics-table-row {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 720px) {
          main {
            padding: 20px !important;
          }

          .analytics-header {
            flex-direction: column !important;
          }

          .analytics-mini-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 520px) {
          .analytics-table-row,
          .analytics-mini-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  )
}

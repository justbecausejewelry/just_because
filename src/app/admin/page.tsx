'use client'

import { useEffect, useMemo, useState } from 'react'
import { DollarSign, Gem, Package, ShoppingBag } from 'lucide-react'
import { supabaseAuth } from '@/lib/auth'
import { normalizeOrderStatus, orderStatusLabel } from '@/lib/tracking'

type Product = { id: string }
type Diamond = { id: string }
type Order = {
  id: string
  orderNumber: string
  customerName: string
  status: string
  total: number
  createdAt: string
  items?: { id: string }[]
}

const cardStyle = {
  backgroundColor: '#FBF5F0',
  border: '0.5px solid #EDD9AF',
  borderRadius: '4px',
  padding: '24px 28px',
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function statusStyle(status: string) {
  const normalized = normalizeOrderStatus(status)
  if (normalized === 'confirmed') return { backgroundColor: '#EDD9AF', color: '#6B4A10' }
  if (normalized === 'processing') return { backgroundColor: '#E8C4D0', color: '#6B2D44' }
  if (normalized === 'shipped' || normalized === 'delivered' || normalized === 'completed') return { backgroundColor: '#DDE8D6', color: '#3F5D34' }
  return { backgroundColor: '#FDF8F2', color: '#B8A090' }
}

async function getAdminToken() {
  const { data } = await supabaseAuth.auth.getSession()
  return data.session?.access_token || null
}

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [diamonds, setDiamonds] = useState<Diamond[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const load = async () => {
      const token = await getAdminToken()
      if (!token) return
      const adminHeaders = { Authorization: `Bearer ${token}` }
      const [productsResponse, diamondsResponse, ordersResponse] = await Promise.all([
        fetch('/api/admin/products', { headers: adminHeaders }),
        fetch('/api/products?limit=1'),
        fetch('/api/admin/stats', { headers: adminHeaders }).catch(() => null),
      ])
      const productPayload = (await productsResponse.json()) as { products?: Product[] }
      setProducts(productPayload.products || [])

      const apiProducts = await diamondsResponse.json()
      void apiProducts

      const diamondResponse = await fetch('/api/admin/diamonds', { headers: adminHeaders }).catch(() => null)
      if (diamondResponse?.ok) {
        const payload = (await diamondResponse.json()) as { diamonds?: Diamond[] }
        setDiamonds(payload.diamonds || [])
      }

      if (ordersResponse?.ok) {
        const payload = (await ordersResponse.json()) as { orders?: Order[] }
        setOrders(payload.orders || [])
      }
    }
    void load()
  }, [])

  const revenue = useMemo(() => orders.reduce((sum, order) => sum + Number(order.total || 0), 0), [orders])
  const activeOrders = orders.filter((order) => order.status !== 'delivered').length

  const stats = [
    { label: 'Total Products', value: products.length.toLocaleString(), icon: Package, trend: '+12% this month' },
    { label: 'Total Revenue', value: formatMoney(revenue), icon: DollarSign, trend: '+12% this month' },
    { label: 'Active Orders', value: activeOrders.toLocaleString(), icon: ShoppingBag, trend: '+12% this month' },
    { label: 'Total Diamonds', value: diamonds.length.toLocaleString(), icon: Gem, trend: '+12% this month' },
  ]

  return (
    <main className="p-6 lg:p-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <article key={stat.label} style={cardStyle}>
              <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(201,169,97,0.14)' }}>
                <Icon color="#C9A961" size={20} />
              </span>
              <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.16em', marginBottom: '8px', textTransform: 'uppercase' }}>{stat.label}</p>
              <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '36px', lineHeight: 1, marginBottom: '10px' }}>{stat.value}</p>
              <p style={{ color: '#7A8F72', fontFamily: 'var(--font-inter)', fontSize: '11px' }}>{stat.trend}</p>
            </article>
          )
        })}
      </div>

      <section className="mt-8" style={{ ...cardStyle, padding: '24px' }}>
        <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 400, marginBottom: '18px' }}>Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr>
                {['Order #', 'Customer', 'Items', 'Total', 'Status', 'Date'].map((heading) => (
                  <th key={heading} style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.14em', padding: '10px 0', textTransform: 'uppercase' }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map((order) => (
                <tr key={order.id} style={{ borderTop: '0.5px solid #EDD9AF' }}>
                  <td style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px', padding: '14px 0' }}>{order.orderNumber}</td>
                  <td style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>{order.customerName}</td>
                  <td style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>{order.items?.length || 0}</td>
                  <td style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>{formatMoney(order.total)}</td>
                  <td><span style={{ ...statusStyle(order.status), borderRadius: '999px', fontFamily: 'var(--font-inter)', fontSize: '10px', padding: '5px 10px' }}>{orderStatusLabel(order.status)}</span></td>
                  <td style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!orders.length && (
                <tr>
                  <td colSpan={6} style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px', padding: '28px 0', textAlign: 'center' }}>No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

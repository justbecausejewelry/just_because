'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import { supabaseAuth } from '@/lib/auth'

type OrderItem = {
  id: string
  productTitle?: string | null
  selectedMetal?: string | null
  selectedCarat?: number | null
  selectedShape?: string | null
  unitPrice?: number | null
  quantity?: number | null
}

type Order = {
  id: string
  orderNumber: string
  customerEmail: string
  total: number
  status: string
  createdAt: string
  OrderItem?: OrderItem[]
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function statusStyle(status: string) {
  if (status === 'delivered') return { background: '#FDF8F2', color: '#B8A090' }
  if (status === 'shipped') return { background: '#FCF0F4', color: '#7A8F72' }
  if (status === 'in_production') return { background: '#E8C4D0', color: '#6B2D44' }
  return { background: '#EDD9AF', color: '#6B4A10' }
}

export default function AccountOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabaseAuth.auth.getUser()

      if (!user) {
        router.replace('/login?redirect=/account/orders')
        return
      }

      const { data } = await supabaseAuth
        .from('Order')
        .select('*, OrderItem(*)')
        .eq('customerEmail', user.email || '')
        .order('createdAt', { ascending: false })

      setOrders((data || []) as Order[])
      setIsLoading(false)
    }

    void load()
  }, [router])

  if (isLoading) {
    return (
      <main style={{ minHeight: '100vh', background: '#FBF5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B8A090', fontFamily: 'var(--font-playfair)', fontSize: '20px' }}>
        Loading orders...
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FBF5F0', maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }}>
      <Link href="/account" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.08em' }}>{'<-'} Back to account</Link>
      <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '42px', fontWeight: 400, margin: '28px 0' }}>My Orders</h1>

      {orders.length === 0 ? (
        <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '56px 24px', textAlign: 'center' }}>
          <ShoppingBag size={52} color="#C9A961" strokeWidth={1.2} style={{ margin: '0 auto 18px' }} />
          <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, margin: 0 }}>No orders yet</h2>
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '14px', margin: '10px 0 24px' }}>Your order history will appear here.</p>
          <Link href="/products" className="btn-primary">SHOP THE COLLECTION</Link>
        </section>
      ) : (
        <section>
          {orders.map((order) => (
            <article key={order.id} style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '20px 24px', marginBottom: '16px' }}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 style={{ color: '#C9A961', fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 400, margin: 0 }}>{order.orderNumber}</h2>
                  <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', marginTop: '4px' }}>{formatDate(order.createdAt)}</p>
                </div>
                <span style={{ ...statusStyle(order.status), borderRadius: '999px', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.12em', padding: '5px 10px', textTransform: 'uppercase' }}>{order.status.replace(/_/g, ' ')}</span>
                <span style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '18px' }}>{formatPrice(order.total || 0)}</span>
              </div>

              {expanded === order.id && (
                <div style={{ borderTop: '0.5px solid #EDD9AF', marginTop: '16px', paddingTop: '14px' }}>
                  {(order.OrderItem || []).map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', padding: '7px 0' }}>
                      <span>{item.productTitle || 'Just Because piece'} - {item.selectedMetal} - {item.selectedCarat}ct {item.selectedShape}</span>
                      <span>{formatPrice((item.unitPrice || 0) * (item.quantity || 1))}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button onClick={() => setExpanded((current) => current === order.id ? null : order.id)} style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em' }}>
                  {expanded === order.id ? 'Hide details' : 'View details'}
                </button>
                <Link href="/account/messages/new" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em' }}>Need help?</Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

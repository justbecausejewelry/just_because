'use client'

import { useEffect, useMemo, useState } from 'react'
import { Archive, DollarSign, Gem, Package, ShoppingBag } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
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
type BackupStatus = {
  lastBackup?: {
    createdAt?: string | null
    message?: string | null
    metadata?: Record<string, unknown> | null
    status?: string | null
  } | null
  nextBackup?: string
  status?: string
  warning?: string
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
  const { showToast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [diamonds, setDiamonds] = useState<Diamond[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null)
  const [backupLoading, setBackupLoading] = useState(false)

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

      const backupResponse = await fetch('/api/admin/backup/status', { headers: adminHeaders }).catch(() => null)
      if (backupResponse?.ok) {
        const payload = (await backupResponse.json()) as BackupStatus
        setBackupStatus(payload)
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

  const lastBackupLabel = backupStatus?.lastBackup?.createdAt
    ? new Date(backupStatus.lastBackup.createdAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Not run yet'
  const backupState = backupLoading ? 'Running' : backupStatus?.status === 'failed' ? 'Failed' : backupStatus?.status === 'success' ? 'Running' : 'Not configured'
  const backupColor = backupLoading || backupStatus?.status === 'success' ? '#7A8F72' : backupStatus?.status === 'failed' ? '#A85C6A' : '#B8A090'

  const runBackupNow = async () => {
    const token = await getAdminToken()
    if (!token) {
      showToast('Admin session expired. Please sign in again.', 'error')
      return
    }

    setBackupLoading(true)
    try {
      const response = await fetch('/api/backup/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = (await response.json()) as {
        details?: string
        error?: string
        message?: string
        stats?: {
          todayOrders?: number
          totalOrders?: number
        }
        success?: boolean
      }

      if (!response.ok || !payload.success) {
        throw new Error(payload.details || payload.error || 'Backup failed.')
      }

      showToast(`Backup sent. ${payload.stats?.todayOrders || 0} orders today.`, 'success')
      setBackupStatus({
        lastBackup: {
          createdAt: new Date().toISOString(),
          message: payload.message || 'Backup sent successfully',
          metadata: payload.stats || {},
          status: 'success',
        },
        nextBackup: 'Tonight at 9:00 PM CST',
        status: 'success',
      })
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Backup failed.'
      showToast(message, 'error')
      setBackupStatus((current) => ({
        ...current,
        lastBackup: current?.lastBackup || null,
        nextBackup: current?.nextBackup || 'Tonight at 9:00 PM CST',
        status: 'failed',
      }))
    } finally {
      setBackupLoading(false)
    }
  }

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
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(201,169,97,0.14)' }}>
              <Archive color="#C9A961" size={20} />
            </span>
            <div>
              <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.16em', marginBottom: '8px', textTransform: 'uppercase' }}>Backup Status</p>
              <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, margin: '0 0 10px' }}>Daily order backup</h2>
              <div className="grid gap-2 md:grid-cols-3">
                <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', margin: 0 }}>
                  Last backup: <span style={{ color: '#1A1014' }}>{lastBackupLabel}</span>
                </p>
                <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', margin: 0 }}>
                  Next backup: <span style={{ color: '#1A1014' }}>{backupStatus?.nextBackup || 'Tonight at 9:00 PM CST'}</span>
                </p>
                <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', margin: 0 }}>
                  Status: <span style={{ color: backupColor }}>{backupState}</span>
                </p>
              </div>
              {backupStatus?.warning ? (
                <p style={{ color: '#A85C6A', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.6, margin: '12px 0 0' }}>
                  {backupStatus.warning}
                </p>
              ) : null}
            </div>
          </div>
          <button
            disabled={backupLoading}
            onClick={runBackupNow}
            style={{
              backgroundColor: '#1A1014',
              color: '#FBF5F0',
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              letterSpacing: '0.18em',
              opacity: backupLoading ? 0.65 : 1,
              padding: '13px 18px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {backupLoading ? 'RUNNING...' : 'RUN BACKUP NOW'}
          </button>
        </div>
      </section>

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

'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Search, ShoppingBag, UserRound } from 'lucide-react'

type Customer = {
  id?: string
  userId?: string
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  signupSource?: string | null
  signup_source?: string | null
  ringSize?: string | null
  createdAt?: string | null
  orderCount: number
  totalSpent: number
}

type Filter = 'all' | 'has-orders' | 'no-orders'

function formatDate(value?: string | null) {
  if (!value) return 'Unknown'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function relativeDate(value?: string | null) {
  if (!value) return ''
  const diff = Date.now() - new Date(value).getTime()
  const days = Math.max(0, Math.floor(diff / 86_400_000))
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function customerName(customer: Customer) {
  const name = `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
  return name || customer.email.split('@')[0] || 'Customer'
}

function customerSignupSource(customer: Customer) {
  return customer.signupSource || customer.signup_source || 'direct'
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/admin/customers')
        const payload = (await response.json()) as {
          customers?: Customer[]
          error?: string
        }

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to load customers')
        }

        setCustomers(payload.customers || [])
      } catch (error) {
        console.error('Customers error:', error)
        setCustomers([])
      } finally {
        setLoading(false)
      }
    }

    void fetchCustomers()
  }, [])

  const stats = useMemo(() => {
    const monthAgo = Date.now() - 30 * 86_400_000
    return {
      total: customers.length,
      newThisMonth: customers.filter((customer) => customer.createdAt && new Date(customer.createdAt).getTime() >= monthAgo).length,
      revenue: customers.reduce((sum, customer) => sum + customer.totalSpent, 0),
    }
  }, [customers])

  const filteredCustomers = useMemo(() => {
    const search = query.trim().toLowerCase()
    return customers.filter((customer) => {
      const matchesSearch = !search
        || customerName(customer).toLowerCase().includes(search)
        || customer.email.toLowerCase().includes(search)
      const matchesFilter = filter === 'all'
        || (filter === 'has-orders' && customer.orderCount > 0)
        || (filter === 'no-orders' && customer.orderCount === 0)

      return matchesSearch && matchesFilter
    })
  }, [customers, filter, query])

  return (
    <main style={{ background: '#FBF5F0', minHeight: 'calc(100vh - 89px)', padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'flex-end', marginBottom: '28px' }}>
        <div>
          <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '32px', fontWeight: 400, margin: 0 }}>
            Customers
          </h1>
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', marginTop: '6px' }}>
            {stats.total} registered customers
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3" style={{ marginBottom: '24px' }}>
        {[
          ['TOTAL CUSTOMERS', stats.total.toLocaleString()],
          ['NEW THIS MONTH', stats.newThisMonth.toLocaleString()],
          ['TOTAL REVENUE', formatCurrency(stats.revenue)],
        ].map(([label, value]) => (
          <div key={label} style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', padding: '20px 24px' }}>
            <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '8px' }}>{label}</p>
            <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '28px', margin: 0 }}>{value}</p>
            <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', marginTop: '4px' }}>Registered profiles</p>
          </div>
        ))}
      </section>

      <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', padding: '18px 20px', marginBottom: '20px' }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FBF5F0', border: '0.5px solid #EDD9AF', padding: '0 14px', minHeight: '44px', flex: 1 }}>
            <Search size={16} color="#B8A090" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or email..."
              style={{ background: 'transparent', border: 'none', color: '#1A1014', flex: 1, fontFamily: 'var(--font-inter)', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              ['all', 'All'],
              ['has-orders', 'Has Orders'],
              ['no-orders', 'No Orders'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value as Filter)}
                style={{
                  background: filter === value ? '#1A1014' : 'transparent',
                  border: '0.5px solid #EDD9AF',
                  color: filter === value ? '#FBF5F0' : '#1A1014',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  padding: '12px 16px',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', padding: '40px', textAlign: 'center' }}>
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '340px', padding: '48px 24px', textAlign: 'center' }}>
            <UserRound color="#C9A961" size={54} strokeWidth={1} />
            <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, margin: '18px 0 8px' }}>
              No customers yet
            </h2>
            <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>
              They will appear here when people sign up
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', minWidth: '920px', width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #EDD9AF' }}>
                  {['CUSTOMER', 'EMAIL', 'SOURCE', 'ORDERS', 'SPENT', 'JOINED', 'ACTIONS'].map((heading) => (
                    <th key={heading} style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', fontWeight: 500, letterSpacing: '0.2em', padding: '16px 20px', textAlign: heading === 'ACTIONS' ? 'right' : 'left' }}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const name = customerName(customer)
                  const initial = name.charAt(0).toUpperCase()
                  return (
                    <tr key={customer.userId || customer.id || customer.email} style={{ borderBottom: '0.5px solid #EDD9AF' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
                          <span style={{ alignItems: 'center', background: 'rgba(201,169,97,0.15)', borderRadius: '50%', color: '#C9A961', display: 'flex', fontFamily: 'var(--font-playfair)', fontSize: '16px', height: '36px', justifyContent: 'center', width: '36px' }}>
                            {initial}
                          </span>
                          <div>
                            <p style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '14px', margin: 0 }}>{name}</p>
                            <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', marginTop: '2px' }}>{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px', padding: '16px 20px' }}>{customer.email}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ border: '0.5px solid #EDD9AF', color: customerSignupSource(customer) === 'checkout' ? '#C9A961' : '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em', padding: '5px 9px', textTransform: 'uppercase' }}>
                          {customerSignupSource(customer)}
                        </span>
                        {customer.phone ? (
                          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', marginTop: '6px' }}>{customer.phone}</p>
                        ) : null}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ border: customer.orderCount > 0 ? '0.5px solid #C9A961' : '0.5px solid #EDD9AF', color: customer.orderCount > 0 ? '#C9A961' : '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', padding: '5px 9px' }}>
                          {customer.orderCount} {customer.orderCount === 1 ? 'order' : 'orders'}
                        </span>
                      </td>
                      <td style={{ color: customer.totalSpent > 0 ? '#1A1014' : '#B8A090', fontFamily: 'var(--font-playfair)', fontSize: '15px', padding: '16px 20px' }}>
                        {formatCurrency(customer.totalSpent)}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <p style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px', margin: 0 }}>{formatDate(customer.createdAt)}</p>
                        <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', marginTop: '2px' }}>{relativeDate(customer.createdAt)}</p>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '10px' }}>
                          <Link href={`/admin/orders?customer=${encodeURIComponent(customer.email)}`} title="View orders" style={{ color: '#C9A961' }}>
                            <ShoppingBag size={17} />
                          </Link>
                          <Link href={`/admin/support?customer=${encodeURIComponent(customer.email)}`} title="Message customer" style={{ color: '#C9A961' }}>
                            <MessageSquare size={17} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

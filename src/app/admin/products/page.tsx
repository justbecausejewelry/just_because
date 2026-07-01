'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Gem, Pencil, Search, Trash2 } from 'lucide-react'
import { getSettledBrowserSession } from '@/lib/supabase'

type Product = {
  id: string
  sku: string
  slug?: string
  title: string
  productType: string
  category: string
  basePrice: number
  images: string[]
  isActive: boolean
  isFeatured: boolean
}

const filters = [
  ['All', 'all'],
  ['Engagement', 'engagement_ring'],
  ['Wedding', 'wedding_ring'],
  ['Necklace', 'necklace'],
  ['Bracelet', 'bracelet'],
  ['Earring', 'earring'],
] as const

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function prettify(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

async function getAdminToken() {
  const session = await getSettledBrowserSession()
  return session?.access_token || null
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{ backgroundColor: checked ? '#C9A961' : '#D8CFC8', borderRadius: '999px', height: '22px', padding: '2px', transition: 'all 0.2s', width: '42px' }}>
      <span style={{ backgroundColor: '#FBF5F0', borderRadius: '50%', display: 'block', height: '18px', transform: checked ? 'translateX(20px)' : 'translateX(0)', transition: 'all 0.2s', width: '18px' }} />
    </button>
  )
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<string[]>([])

  const loadProducts = async () => {
    const token = await getAdminToken()
    if (!token) return
    const response = await fetch('/api/admin/products', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const payload = (await response.json()) as { products?: Product[] }
    setProducts(payload.products || [])
  }

  useEffect(() => {
    void loadProducts()
  }, [])

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesFilter = filter === 'all' || product.productType === filter
      const matchesSearch = `${product.sku} ${product.title}`.toLowerCase().includes(search.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [products, filter, search])

  const patchProduct = async (id: string, payload: Partial<Product>) => {
    setProducts((items) => items.map((item) => (item.id === id ? { ...item, ...payload } : item)))
    const token = await getAdminToken()
    if (!token) return
    await fetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
  }

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Hide this product from customers?')) return
    const token = await getAdminToken()
    if (!token) return
    await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setProducts((items) => items.map((item) => (item.id === id ? { ...item, isActive: false } : item)))
  }

  const bulkPatch = async (payload: Partial<Product>) => {
    await Promise.all(selected.map((id) => patchProduct(id, payload)))
    setSelected([])
  }

  return (
    <main className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '30px', fontWeight: 400, margin: 0 }}>Products</h2>
        <Link href="/admin/products/new" style={{ backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.18em', padding: '13px 18px', textDecoration: 'none' }}>ADD PRODUCT</Link>
      </div>

      <div className="mb-5 flex items-center gap-3" style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF', padding: '0 14px' }}>
        <Search color="#B8A090" size={18} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." style={{ backgroundColor: 'transparent', color: '#1A1014', flex: 1, fontFamily: 'var(--font-inter)', fontSize: '13px', outline: 'none', padding: '14px 0' }} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map(([label, value]) => (
          <button key={value} onClick={() => setFilter(value)} style={{ backgroundColor: filter === value ? '#1A1014' : 'transparent', border: '0.5px solid #EDD9AF', borderRadius: '999px', color: filter === value ? '#FBF5F0' : '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', padding: '8px 13px' }}>{label}</button>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3" style={{ backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '12px', padding: '12px 16px' }}>
          <span>{selected.length} items selected</span>
          <div className="flex gap-3">
            <button onClick={() => bulkPatch({ isActive: true })} style={{ color: '#C9A961' }}>Set active</button>
            <button onClick={() => bulkPatch({ isActive: false })} style={{ color: '#C9A961' }}>Set inactive</button>
            <button onClick={() => bulkPatch({ isActive: false })} style={{ color: '#E8C4D0' }}>Delete selected</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto" style={{ backgroundColor: '#FBF5F0', border: '0.5px solid #EDD9AF', borderRadius: '4px' }}>
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr>
              {['', 'Image', 'SKU', 'Title', 'Type', 'Price', 'Status', 'Featured', 'Actions'].map((heading) => (
                <th key={heading} style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.14em', padding: '16px', textTransform: 'uppercase' }}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} style={{ borderTop: '0.5px solid #EDD9AF' }}>
                <td style={{ padding: '14px 16px' }}><input checked={selected.includes(product.id)} onChange={(event) => setSelected((items) => event.target.checked ? [...items, product.id] : items.filter((id) => id !== product.id))} type="checkbox" style={{ accentColor: '#1A1014' }} /></td>
                <td>
                  <div style={{ backgroundColor: '#F5E8ED', height: '48px', position: 'relative', width: '48px' }}>
                    {product.images?.[0] ? <Image src={product.images[0]} alt={product.title} fill sizes="48px" style={{ objectFit: 'cover' }} /> : <div className="flex h-full items-center justify-center"><Gem color="#C9A961" size={21} /></div>}
                  </div>
                </td>
                <td style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{product.sku}</td>
                <td style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '16px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    {product.title}
                    {!product.isActive && (
                      <span style={{
                        fontSize: '9px',
                        letterSpacing: '0.15em',
                        color: '#B8A090',
                        background: '#F5F0EA',
                        border: '0.5px solid #EDD9AF',
                        padding: '2px 8px',
                        fontFamily: 'var(--font-inter)',
                      }}>
                        DRAFT
                      </span>
                    )}
                    {product.isActive && (
                      <span style={{
                        fontSize: '9px',
                        letterSpacing: '0.15em',
                        color: '#2E7D32',
                        background: '#F0FFF4',
                        border: '0.5px solid #A8D5A8',
                        padding: '2px 8px',
                        fontFamily: 'var(--font-inter)',
                      }}>
                        LIVE
                      </span>
                    )}
                  </span>
                </td>
                <td style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{prettify(product.productType)}</td>
                <td style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{formatMoney(product.basePrice)}</td>
                <td><Toggle checked={product.isActive} onChange={() => patchProduct(product.id, { isActive: !product.isActive })} /></td>
                <td><Toggle checked={product.isFeatured} onChange={() => patchProduct(product.id, { isFeatured: !product.isFeatured })} /></td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Link
                      href={`/products/${product.slug || product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View on storefront"
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent',
                        border: '0.5px solid #EDD9AF',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        color: '#B8A090',
                        transition: 'all 0.2s',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.borderColor = '#C9A961'
                        event.currentTarget.style.color = '#C9A961'
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.borderColor = '#EDD9AF'
                        event.currentTarget.style.color = '#B8A090'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </Link>
                    <Link href={`/admin/products/${product.id}`} title="Edit product" style={{ color: '#C9A961', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '0.5px solid #EDD9AF', borderRadius: '2px' }}><Pencil size={16} /></Link>
                    <button onClick={() => deleteProduct(product.id)} title="Delete product" style={{ color: '#A85C6A', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '0.5px solid #EDD9AF', borderRadius: '2px' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}

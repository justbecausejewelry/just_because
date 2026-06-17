'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Gem, ShieldCheck } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { getMetalLabel } from '@/config/productOptions'

type Suggestion = {
  id: string
  slug: string
  title: string
  basePrice: number
  images: string[]
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function CartPage() {
  const { itemCount, items, removeItem, subtotal, updateQuantity } = useCart()
  const [promo, setPromo] = useState('')
  const [discount, setDiscount] = useState({ code: '', amount: 0 })
  const [promoError, setPromoError] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const tax = Math.round((subtotal - discount.amount) * 0.08)
  const total = subtotal - discount.amount + tax

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/products?featured=true&limit=2')
      const payload = (await response.json()) as { products?: Suggestion[] }
      setSuggestions(payload.products || [])
    }
    void load()
  }, [])

  const applyPromo = async () => {
    setPromoError('')
    const response = await fetch('/api/discounts/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: promo, subtotal }),
    })
    const payload = (await response.json()) as {
      code?: string
      discountAmount?: number
      error?: string
    }
    if (!response.ok) {
      setPromoError(payload.error || 'Invalid code')
      setDiscount({ code: '', amount: 0 })
      return
    }
    setDiscount({ code: payload.code || promo, amount: payload.discountAmount || 0 })
  }

  const emptyActions = useMemo(
    () => (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Gem color="#C9A961" size={72} strokeWidth={1.1} />
        <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '32px', fontWeight: 400, marginTop: '20px' }}>Your cart is empty</h2>
        <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '16px', lineHeight: 1.625, marginBottom: '24px' }}>Discover something beautiful</p>
        <div className="cart-empty-actions flex flex-wrap justify-center gap-3">
          <Link href="/products" style={{ background: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.18em', padding: '14px 24px', textDecoration: 'none' }}>SHOP THE COLLECTION</Link>
          <Link href="/build" style={{ border: '1px solid #EDD9AF', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.18em', padding: '14px 24px', textDecoration: 'none' }}>BUILD YOUR OWN RING</Link>
        </div>
      </div>
    ),
    []
  )

  return (
    <main style={{ background: '#FBF5F0', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px clamp(16px, 5vw, 80px)', borderBottom: '0.5px solid #EDD9AF', background: '#FBF5F0' }}>
        <Link href="/" style={{ fontSize: '11px', color: 'var(--color-muted-text)', textDecoration: 'none', fontFamily: 'var(--font-inter)', letterSpacing: '0.08em' }}>Home</Link>
        <span style={{ color: '#EDD9AF' }}>›</span>
        <Link href="/products" style={{ fontSize: '11px', color: 'var(--color-muted-text)', textDecoration: 'none', fontFamily: 'var(--font-inter)', letterSpacing: '0.08em' }}>Collection</Link>
        <span style={{ color: '#EDD9AF' }}>›</span>
        <span style={{ fontSize: '11px', color: '#1A1014', fontFamily: 'var(--font-inter)', letterSpacing: '0.08em' }}>Cart</span>
      </div>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-10 md:py-10 lg:px-20 lg:py-[60px]">
        <nav style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '11px', marginBottom: '22px' }}>
          <Link href="/" style={{ color: 'var(--color-muted-text)', textDecoration: 'none' }}>Home</Link> / <span style={{ color: '#1A1014' }}>Cart</span>
        </nav>
        <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 400, lineHeight: 1.05, margin: 0 }}>Your Cart</h1>
        <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '15px', marginTop: '8px' }}>{itemCount} items</p>

        {items.length === 0 ? (
          emptyActions
        ) : (
          <div className="cart-layout mt-8 grid gap-8 md:grid-cols-[60fr_40fr] lg:mt-10 lg:grid-cols-[65fr_35fr] lg:gap-12">
            <section>
              <div className="hidden grid-cols-[100px_1fr_auto_auto_auto] gap-5 border-b pb-3 lg:grid" style={{ borderColor: '#EDD9AF' }}>
                {['Product', 'Details', 'Price', 'Quantity', 'Total'].map((label) => (
                  <span key={label} style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{label}</span>
                ))}
              </div>
              {items.map((item) => (
                <div key={item.id} className="cart-item-row relative grid grid-cols-[80px_1fr] gap-3 py-6 lg:grid-cols-[100px_1fr_auto_auto_auto] lg:items-center lg:gap-5" style={{ borderBottom: '0.5px solid #EDD9AF' }}>
                  <div style={{ width: 'clamp(80px, 14vw, 100px)', height: 'clamp(80px, 14vw, 100px)', background: '#F5E8ED', position: 'relative' }}>
                    {item.productImage ? <Image src={item.productImage} alt={item.productTitle} fill sizes="100px" style={{ objectFit: 'cover' }} /> : <div className="flex h-full items-center justify-center"><Gem color="#C9A961" size={34} /></div>}
                  </div>
                  <div>
                    <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '16px', fontWeight: 400 }}>{item.productTitle}</h2>
                    <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.16em', margin: '7px 0 10px' }}>LAB-GROWN DIAMOND</p>
                    {[
                      ['Metal', getMetalLabel(item.selectedMetal)],
                      ['Carat', `${item.selectedCarat}ct`],
                      ['Shape', item.selectedShape],
                      ['Size', item.ringSize],
                    ].map(([label, value]) => value && <p key={label} style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px', marginBottom: '3px' }}>{label}: {value}</p>)}
                    {item.engraving && <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px', fontStyle: 'italic' }}>Engraving: &quot;{item.engraving}&quot;</p>}
                    <p className="mt-3 flex items-center gap-1" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.12em' }}><ShieldCheck size={12} /> IGI CERTIFIED</p>
                    <div className="mt-3 flex gap-4">
                      <button onClick={() => removeItem(item.id)} style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>Remove</button>
                      <button style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px' }}>Save for later</button>
                    </div>
                  </div>
                  <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '16px' }}>{formatPrice(item.unitPrice)}</p>
                  <div className="flex items-center">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ width: '28px', height: '28px', border: '0.5px solid #EDD9AF', color: '#1A1014' }}>−</button>
                    <span style={{ width: '36px', textAlign: 'center', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ width: '28px', height: '28px', border: '0.5px solid #EDD9AF', color: '#1A1014' }}>+</button>
                  </div>
                  <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 500 }}>{formatPrice(item.unitPrice * item.quantity)}</p>
                </div>
              ))}
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <input value={promo} onChange={(event) => setPromo(event.target.value)} placeholder="ENTER PROMO CODE" style={{ background: '#FDF8F2', border: '1px solid #EDD9AF', color: '#1A1014', flex: 1, fontFamily: 'var(--font-inter)', fontSize: '12px', padding: '12px 16px' }} />
                <button onClick={applyPromo} style={{ background: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.15em', padding: '12px 20px' }}>APPLY</button>
              </div>
              {promoError && <p style={{ color: '#A85C6A', fontFamily: 'var(--font-inter)', fontSize: '12px', marginTop: '8px' }}>{promoError}</p>}
            </section>

            <aside className="lg:sticky lg:top-[100px]" style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', padding: '28px' }}>
              <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '16px' }}>ORDER SUMMARY</p>
              {[
                ['Subtotal', formatPrice(subtotal), '#1A1014'],
                ...(discount.amount ? [['Discount', `-${formatPrice(discount.amount)}`, '#C9A961']] : []),
                ['Shipping', 'FREE', '#7A8F72'],
                ['Est. Tax', formatPrice(tax), 'var(--color-muted-text)'],
              ].map(([label, value, color]) => (
                <div key={label} className="flex justify-between py-2" style={{ borderBottom: '0.5px solid #EDD9AF', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--color-muted-text)' }}>{label}</span>
                  <span style={{ color }}>{value}</span>
                </div>
              ))}
              <div style={{ paddingTop: '16px' }}>
                <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.2em' }}>TOTAL</p>
                <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '32px' }}>{formatPrice(total)}</p>
              </div>
              <Link className="cart-checkout-button" href="/checkout" style={{ display: 'block', width: '100%', height: '56px', background: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.2em', lineHeight: '56px', textAlign: 'center', textDecoration: 'none', marginTop: '20px' }}>PROCEED TO CHECKOUT →</Link>
              <Link href="/products" style={{ display: 'block', width: '100%', height: '48px', border: '1px solid #EDD9AF', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.16em', lineHeight: '48px', textAlign: 'center', textDecoration: 'none', marginTop: '10px' }}>← CONTINUE SHOPPING</Link>
              <div className="mt-5 flex justify-center gap-4" style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>
                <span>Secure Checkout</span><span>30-Day Returns</span><span>IGI Certified</span>
              </div>
              {suggestions.length > 0 && (
                <div className="mt-7">
                  <h3 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 400 }}>Complete the look</h3>
                  {suggestions.map((product) => (
                    <Link key={product.id} href={`/products/${product.slug}`} className="mt-3 flex gap-3" style={{ textDecoration: 'none' }}>
                      <div style={{ width: '54px', height: '54px', background: '#F5E8ED', position: 'relative' }}>{product.images?.[0] && <Image src={product.images[0]} alt={product.title} fill sizes="54px" style={{ objectFit: 'cover' }} />}</div>
                      <div><p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '13px' }}>{product.title}</p><p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{formatPrice(product.basePrice)}</p></div>
                    </Link>
                  ))}
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

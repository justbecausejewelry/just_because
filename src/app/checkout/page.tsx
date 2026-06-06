'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Gem } from 'lucide-react'
import { CheckoutAuthWall } from '@/components/checkout/CheckoutAuthWall'
import { useCart } from '@/context/CartContext'
import { supabaseAuth } from '@/lib/auth'
import { trackCartEvent, type CartItem as AnalyticsCartItem } from '@/lib/cart'

type SavedAddress = {
  id: string
  userId: string
  label: string
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string | null
  isDefault: boolean
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function Field({ label, value, onChange, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label>
      <span style={{ color: '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '8px' }}>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={{ background: '#FDF8F2', border: '1px solid #EDD9AF', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px', padding: '13px 15px', width: '100%' }} />
    </label>
  )
}

function toAnalyticsCartItem(item: ReturnType<typeof useCart>['items'][number]): AnalyticsCartItem {
  const isDiamond = item.selectedMetal === 'Loose diamond'

  return {
    id: item.id,
    type: isDiamond ? 'diamond' : 'product',
    name: item.productTitle,
    price: item.unitPrice,
    imageUrl: item.productImage,
    carat: item.selectedCarat,
    shape: item.selectedShape,
    quantity: item.quantity,
    productId: item.productId,
    productSlug: item.productSlug,
    productTitle: item.productTitle,
    productImage: item.productImage,
    selectedMetal: item.selectedMetal,
    selectedCarat: item.selectedCarat,
    selectedShape: item.selectedShape,
    selectedColor: item.selectedColor,
    selectedClarity: item.selectedClarity,
    ringSize: item.ringSize,
    engraving: item.engraving,
    unitPrice: item.unitPrice,
    priceBreakdown: item.priceBreakdown,
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { clearCart, items, subtotal } = useCart()
  const [step, setStep] = useState(1)
  const [isPlacing, setIsPlacing] = useState(false)
  const [error, setError] = useState('')
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard')
  const [userId, setUserId] = useState<string | null>(null)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [saveAddress, setSaveAddress] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: '',
  })
  const shippingAmount = shippingMethod === 'express' ? 25 : 0
  const tax = Math.round(subtotal * 0.08)
  const total = subtotal + shippingAmount + tax
  const maskedCard = useMemo(() => {
    const digits = form.cardNumber.replace(/\D/g, '').slice(-4) || '4242'
    return `•••• •••• •••• ${digits}`
  }, [form.cardNumber])

  const refreshUser = useCallback(async () => {
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      setUserId(null)
      setSavedAddresses([])
      setSelectedAddressId('')
      return
    }

    setUserId(user.id)
    setForm((current) => ({
      ...current,
      email: current.email || user.email || '',
    }))

    const { data } = await supabaseAuth
      .from('SavedAddress')
      .select('*')
      .eq('userId', user.id)
      .order('isDefault', { ascending: false })

    setSavedAddresses((data || []) as SavedAddress[])
  }, [])

  useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  const setField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const continueTo = (next: number) => {
    setError('')
    setStep(next)
  }

  const applySavedAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id)
    setForm((current) => ({
      ...current,
      firstName: current.firstName || address.firstName,
      lastName: current.lastName || address.lastName,
      phone: current.phone || address.phone || '',
      address1: address.addressLine1,
      address2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      zip: address.zipCode,
      country: address.country,
    }))
  }

  const placeOrder = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!items.length) {
      setError('Your cart is empty.')
      return
    }

    setIsPlacing(true)
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 800))

      const {
        data: { user },
      } = await supabaseAuth.auth.getUser()

      if (!user) {
        setStep(3)
        setError('Please sign in or create an account before payment.')
        setIsPlacing(false)
        return
      }

      const customerName = `${form.firstName} ${form.lastName}`.trim()
      const customerEmail = form.email.trim() || user.email || ''

      if (!customerEmail || !customerEmail.includes('@')) {
        setError('Please enter a valid email address.')
        setIsPlacing(false)
        return
      }

      if (!customerName) {
        setError('Please enter your name.')
        setIsPlacing(false)
        return
      }

      const orderNumber = `JB-${Date.now().toString().slice(-6)}`
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone: form.phone,
          shippingAddress: {
            firstName: form.firstName,
            lastName: form.lastName,
            addressLine1: form.address1,
            addressLine2: form.address2 || '',
            city: form.city,
            state: form.state,
            zipCode: form.zip,
            country: form.country || 'India',
            method: shippingMethod,
          },
          items: items.map((item) => ({
            ...item,
            totalPrice: item.unitPrice * item.quantity,
          })),
          subtotal,
          shippingAmount,
          shippingCost: shippingAmount,
          taxAmount: tax,
          discount: 0,
          discountAmount: 0,
          total,
          status: 'received',
          paymentMethod: 'pending',
          paymentStatus: 'pending',
          userId: user.id,
          isGuest: false,
          guestEmail: null,
          guestName: null,
          orderNumber,
        }),
      })
      const payload = (await response.json()) as {
        order?: { id: string; orderNumber?: string | null }
        orderNumber?: string
        error?: string
      }

      if (!response.ok || !payload.order?.id) {
        throw new Error(payload.error || 'Unable to place order.')
      }

      if (saveAddress && userId) {
        await supabaseAuth
          .from('SavedAddress')
          .insert({
            userId,
            label: 'Home',
            firstName: form.firstName,
            lastName: form.lastName,
            addressLine1: form.address1,
            addressLine2: form.address2,
            city: form.city,
            state: form.state,
            zipCode: form.zip,
            country: form.country,
            phone: form.phone,
            isDefault: savedAddresses.length === 0,
          })
      }

      await Promise.all(items.map((item) => trackCartEvent('purchased', toAnalyticsCartItem(item), user?.id || null)))
      await clearCart()
      const confirmationParams = new URLSearchParams({
        order: payload.order.id,
        number: payload.orderNumber || payload.order.orderNumber || orderNumber,
      })
      router.push(`/order-confirmed?${confirmationParams.toString()}`)
    } catch (orderError) {
      const message = orderError instanceof Error ? orderError.message : 'Unable to place order.'
      console.error('Order error:', orderError)
      setError(`Failed to place order: ${message}`)
      setIsPlacing(false)
    }
  }

  return (
    <main style={{ background: '#FBF5F0', minHeight: '100vh' }}>
      <div className="checkout-progress" style={{ width: '100%', background: '#FBF5F0', borderBottom: '0.5px solid #EDD9AF', position: 'sticky', top: '80px', zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
          {[
            { num: 1, label: 'Contact' },
            { num: 2, label: 'Shipping' },
            { num: 3, label: 'Payment' },
          ].map((progressStep) => (
            <div
              key={progressStep.num}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '18px 24px',
                background: step === progressStep.num ? '#FBF5F0' : 'transparent',
                borderRight: progressStep.num < 3 ? '0.5px solid #EDD9AF' : 'none',
                borderBottom: step === progressStep.num ? '2px solid #C9A961' : '2px solid transparent',
                cursor: step > progressStep.num ? 'pointer' : 'default',
                transition: 'all 0.3s',
              }}
              onClick={() => {
                if (step > progressStep.num) {
                  setStep(progressStep.num)
                }
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 500,
                fontFamily: 'var(--font-inter)',
                background: step > progressStep.num ? '#C9A961' : step === progressStep.num ? '#1A1014' : 'transparent',
                border: step >= progressStep.num ? 'none' : '1px solid #EDD9AF',
                color: step >= progressStep.num ? '#FBF5F0' : '#B8A090',
                flexShrink: 0,
              }}>
                {step > progressStep.num ? '✓' : progressStep.num}
              </div>
              <span style={{
                fontSize: '12px',
                letterSpacing: '0.1em',
                fontFamily: 'var(--font-inter)',
                fontWeight: step === progressStep.num ? 500 : 400,
                color: step === progressStep.num ? '#1A1014' : step > progressStep.num ? '#C9A961' : '#B8A090',
              }}>
                {progressStep.num}. {progressStep.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        className="checkout-summary-toggle"
        onClick={() => setSummaryOpen((open) => !open)}
        style={{ background: '#FDF8F2', borderBottom: '0.5px solid #EDD9AF', color: '#1A1014', display: 'none', fontFamily: 'var(--font-inter)', fontSize: '12px', justifyContent: 'space-between', padding: '14px 16px', width: '100%' }}
      >
        <span>{summaryOpen ? 'Hide' : 'Show'} order summary</span>
        <span style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '18px' }}>{formatPrice(total)}</span>
      </button>

      <div className="checkout-layout mx-auto grid max-w-[1200px] gap-10 px-4 py-6 md:grid-cols-[60fr_40fr] md:px-10 md:py-10 lg:grid-cols-[1fr_400px] lg:gap-[60px] lg:px-20">
        <form onSubmit={placeOrder}>
          <motion.section key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }} style={{ background: '#FBF5F0' }}>
            {step === 1 && (
              <div className="grid gap-5">
                <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em' }}>CONTACT</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="FIRST NAME" value={form.firstName} onChange={(value) => setField('firstName', value)} />
                  <Field label="LAST NAME" value={form.lastName} onChange={(value) => setField('lastName', value)} />
                </div>
                <Field label="EMAIL ADDRESS" value={form.email} onChange={(value) => setField('email', value)} />
                <Field label="PHONE NUMBER" value={form.phone} onChange={(value) => setField('phone', value)} />
                <label className="flex items-center gap-3" style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}><input type="checkbox" style={{ accentColor: '#1A1014' }} /> Email me about new collections and exclusive offers</label>
                <button type="button" onClick={() => continueTo(2)} style={{ background: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', height: '52px', letterSpacing: '0.2em' }}>CONTINUE TO SHIPPING →</button>
              </div>
            )}
            {step === 2 && (
              <div className="grid gap-5">
                <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em' }}>SHIPPING ADDRESS</p>
                {savedAddresses.length > 0 && (
                  <div>
                    <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.25em', marginBottom: '10px' }}>USE SAVED ADDRESS</p>
                    <div className="grid gap-3">
                      {savedAddresses.map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => applySavedAddress(address)}
                          style={{
                            background: '#FDF8F2',
                            border: selectedAddressId === address.id ? '0.5px solid #C9A961' : '0.5px solid #EDD9AF',
                            color: '#1A1014',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-inter)',
                            fontSize: '12px',
                            padding: '12px 16px',
                            textAlign: 'left',
                          }}
                        >
                          <strong style={{ color: '#C9A961', fontWeight: 500 }}>{address.label}</strong>
                          <span style={{ color: '#B8A090', display: 'block', marginTop: '4px' }}>
                            {address.addressLine1}, {address.city}, {address.state} {address.zipCode}
                          </span>
                        </button>
                      ))}
                    </div>
                    <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', marginTop: '14px' }}>Or enter a new address</p>
                  </div>
                )}
                <Field label="ADDRESS LINE 1" value={form.address1} onChange={(value) => setField('address1', value)} />
                <Field label="ADDRESS LINE 2" value={form.address2} onChange={(value) => setField('address2', value)} />
                <div className="grid gap-4 md:grid-cols-2"><Field label="CITY" value={form.city} onChange={(value) => setField('city', value)} /><Field label="STATE" value={form.state} onChange={(value) => setField('state', value)} /></div>
                <div className="grid gap-4 md:grid-cols-2"><Field label="ZIP CODE" value={form.zip} onChange={(value) => setField('zip', value)} /><Field label="COUNTRY" value={form.country} onChange={(value) => setField('country', value)} /></div>
                {[
                  ['standard', 'Standard Shipping', 'FREE', '3-5 business days'],
                  ['express', 'Express Shipping', '$25', '1-2 business days'],
                ].map(([value, label, price, copy]) => (
                  <button key={value} type="button" onClick={() => setShippingMethod(value as 'standard' | 'express')} className="text-left" style={{ background: '#FDF8F2', border: `1px solid ${shippingMethod === value ? '#1A1014' : '#EDD9AF'}`, padding: '16px 20px' }}>
                    <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>{shippingMethod === value ? '●' : '○'} {label} ({price})</span>
                    <span style={{ color: '#B8A090', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '11px', marginTop: '4px' }}>{copy}</span>
                  </button>
                ))}
                <button type="button" onClick={() => continueTo(3)} style={{ background: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', height: '52px', letterSpacing: '0.2em' }}>CONTINUE TO PAYMENT →</button>
              </div>
            )}
            {step === 3 && (
              !userId ? (
                <CheckoutAuthWall
                  email={form.email}
                  name={`${form.firstName} ${form.lastName}`.trim()}
                  phone={form.phone}
                  onSuccess={() => void refreshUser()}
                />
              ) : (
              <div className="grid gap-5">
                <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em' }}>PAYMENT</p>
                <div style={{ background: 'linear-gradient(135deg, #1A1014, #2A1E24)', borderRadius: '12px', padding: '24px', aspectRatio: '1.6', color: '#FBF5F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <p><span style={{ color: '#C9A961', fontFamily: 'var(--font-italianno)', fontSize: '28px' }}>just</span> <span style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.2em' }}>BECAUSE</span></p>
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: '24px', letterSpacing: '0.08em' }}>{maskedCard}</p>
                  <div className="flex justify-between"><span>{form.cardName || 'CARDHOLDER NAME'}</span><span>{form.expiry || 'MM/YY'}</span></div>
                </div>
                <Field label="CARD NUMBER" value={form.cardNumber} onChange={(value) => setField('cardNumber', value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19))} placeholder="1234 5678 9012 3456" />
                <div className="grid gap-4 md:grid-cols-2"><Field label="EXPIRY MM/YY" value={form.expiry} onChange={(value) => setField('expiry', value)} /><Field label="CVV" value={form.cvv} onChange={(value) => setField('cvv', value)} /></div>
                <Field label="CARDHOLDER NAME" value={form.cardName} onChange={(value) => setField('cardName', value)} placeholder="Name on card" />
                <label style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}><input type="checkbox" defaultChecked style={{ accentColor: '#1A1014', marginRight: '8px' }} /> Same as shipping address</label>
                {userId && (
                  <label style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>
                    <input type="checkbox" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} style={{ accentColor: '#1A1014', marginRight: '8px' }} />
                    Save this address for future orders
                  </label>
                )}
                {error && <p style={{ color: '#A85C6A', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{error}</p>}
                <button disabled={isPlacing} style={{ background: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '13px', height: '60px', letterSpacing: '0.25em', opacity: isPlacing ? 0.7 : 1 }}>{isPlacing ? 'PROCESSING...' : `PLACE ORDER — ${formatPrice(total)}`}</button>
                <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px', textAlign: 'center' }}>SSL Encrypted | PCI Compliant | 256-bit Security</p>
              </div>
              )
            )}
          </motion.section>
        </form>

        <aside className={`checkout-summary ${summaryOpen ? 'is-open' : ''} lg:sticky lg:top-8`} style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', padding: '28px', height: 'fit-content' }}>
          <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '14px' }}>ORDER SUMMARY</p>
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 py-3" style={{ borderBottom: '0.5px solid #EDD9AF' }}>
              <div style={{ width: '56px', height: '56px', background: '#F5E8ED', position: 'relative' }}>{item.productImage ? <Image src={item.productImage} alt={item.productTitle} fill sizes="56px" style={{ objectFit: 'cover' }} /> : <Gem color="#C9A961" size={20} />}</div>
              <div className="min-w-0 flex-1"><p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '13px' }}>{item.productTitle}</p><p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px' }}>{item.selectedMetal} · {item.selectedCarat}ct</p></div>
              <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '14px' }}>{formatPrice(item.unitPrice * item.quantity)}</p>
            </div>
          ))}
          {[
            ['Subtotal', formatPrice(subtotal)],
            ['Shipping', shippingAmount ? formatPrice(shippingAmount) : 'FREE'],
            ['Tax', formatPrice(tax)],
          ].map(([label, value]) => <div key={label} className="flex justify-between py-2" style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px' }}><span>{label}</span><span>{value}</span></div>)}
          <div className="mt-3 flex justify-between" style={{ borderTop: '0.5px solid #EDD9AF', paddingTop: '14px' }}><span style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.2em' }}>TOTAL</span><span style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '28px' }}>{formatPrice(total)}</span></div>
          <Link href="/cart" style={{ color: '#C9A961', display: 'inline-block', fontFamily: 'var(--font-inter)', fontSize: '11px', marginTop: '16px', textDecoration: 'none' }}>← Edit cart</Link>
        </aside>
      </div>
    </main>
  )
}

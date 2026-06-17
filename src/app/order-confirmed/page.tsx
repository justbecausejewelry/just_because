'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCheck, Clock, Copy, Mail, Package, Share2 } from 'lucide-react'

const confetti = Array.from({ length: 20 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 100}%`,
  delay: `${(index % 8) * 0.12}s`,
  size: `${4 + (index % 5)}px`,
  color: ['#C9A961', '#E8C4D0', '#FBF5F0'][index % 3],
}))

function OrderConfirmedContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('number') || searchParams.get('order') || 'JB-PENDING'
  const isGuest = searchParams.get('guest') === '1'
  const guestEmail = searchParams.get('email') || ''
  const [copied, setCopied] = useState(false)

  const copyOrder = async () => {
    await navigator.clipboard.writeText(orderNumber)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <main className="order-confirmed-page relative overflow-hidden" style={{ background: '#FBF5F0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
      <style jsx>{`
        @keyframes fall {
          0% { transform: translateY(-60px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
      {confetti.map((piece) => <span key={piece.id} style={{ position: 'absolute', top: '-20px', left: piece.left, width: piece.size, height: piece.size, background: piece.color, animation: `fall 3s ${piece.delay} ease-out forwards` }} />)}

      <section className="w-full max-w-[600px] text-center">
        <motion.div className="order-checkmark" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }} style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #C9A961, #EDD9AF)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}><CheckCheck color="#FBF5F0" size={36} /></motion.div>
        </motion.div>
        <motion.p initial={{ y: 20 }} animate={{ y: 0 }} transition={{ delay: 0.4 }} style={{ color: '#C9A961', fontFamily: 'var(--font-jost)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.22em', marginBottom: '12px' }}>ORDER CONFIRMED</motion.p>
        <motion.h1 className="order-headline" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '42px', fontWeight: 400, lineHeight: 1.1, marginBottom: '16px' }}>Thank you for your order.</motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '15px', lineHeight: 1.7, maxWidth: '440px', margin: '0 auto 32px' }}>Your Just Because piece is being lovingly crafted. You&apos;ll receive an email confirmation shortly.</motion.p>
        <motion.div className="order-number-box" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', padding: '20px 28px', marginBottom: '40px', display: 'inline-flex', gap: '16px', alignItems: 'center' }}>
          <div className="text-left">
            <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.18em' }}>ORDER NUMBER</p>
            <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '22px' }}>{orderNumber}</p>
          </div>
          <button onClick={copyOrder} style={{ color: '#C9A961' }}>{copied ? <CheckCheck size={18} /> : <Copy size={18} />}</button>
        </motion.div>

        <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 400, marginBottom: '20px' }}>What happens next?</h2>
        <div className="order-journey mb-10 grid grid-cols-4 gap-2">
          {['Order Received', 'CAD Design', 'Crafting', 'Shipped'].map((label, index) => (
            <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + index * 0.1 }} className="relative text-center">
              <span style={{ margin: '0 auto 8px', width: '32px', height: '32px', borderRadius: '50%', background: index === 0 ? '#C9A961' : 'transparent', border: `1px solid ${index === 0 ? '#C9A961' : '#EDD9AF'}`, color: index === 0 ? '#FBF5F0' : 'var(--color-muted-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{index === 0 ? '✓' : index + 1}</span>
              <p style={{ color: index === 0 ? '#C9A961' : 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '11px' }}>{label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mb-10 grid gap-3 md:grid-cols-3">
          {[{ icon: Mail, title: 'Confirmation Email', body: 'Sent within 5 minutes' }, { icon: Clock, title: 'Crafting Time', body: '3-5 weeks for your piece' }, { icon: Package, title: 'Free Shipping', body: 'Worldwide, fully insured' }].map((card) => {
            const Icon = card.icon
            return <div key={card.title} style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', padding: '20px', textAlign: 'center' }}><span className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'rgba(201,169,97,0.14)' }}><Icon color="#C9A961" size={17} /></span><p style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px', fontWeight: 500 }}>{card.title}</p><p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '11px', lineHeight: 1.5 }}>{card.body}</p></div>
          })}
        </div>

        {isGuest && (
          <div
            style={{
              background: '#FDF8F2',
              border: '0.5px solid #EDD9AF',
              padding: '24px',
              textAlign: 'center',
              marginBottom: '32px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: '1.4rem',
                marginBottom: '8px',
                color: '#1A1014',
              }}
            >
              Save your order history
            </h3>
            <p
              style={{
                color: 'var(--color-muted-text)',
                fontSize: '14px',
                marginBottom: '16px',
              }}
            >
              Create an account to track this order, save your wishlist and get early access to new pieces.
            </p>
            <Link href={`/signup?email=${encodeURIComponent(guestEmail)}`} className="btn-primary">
              Create Account
            </Link>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/products" style={{ background: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.2em', padding: '14px 36px', textDecoration: 'none' }}>CONTINUE SHOPPING</Link>
          <Link href="/account/orders" style={{ border: '1px solid #EDD9AF', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.2em', padding: '14px 36px', textDecoration: 'none' }}>VIEW YOUR ORDER</Link>
        </div>
        <div className="mt-7">
          <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px', marginBottom: '10px' }}>Share the love</p>
          <div className="flex justify-center gap-3"><a href="#" style={{ color: '#C9A961' }}><Share2 size={18} /></a><a href="#" style={{ color: '#C9A961' }}><Share2 size={18} /></a></div>
        </div>
      </section>
    </main>
  )
}

export default function OrderConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: '#FBF5F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '18px',
              color: 'var(--color-muted-text)',
            }}
          >
            Loading...
          </div>
        </div>
      }
    >
      <OrderConfirmedContent />
    </Suspense>
  )
}

'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Gem, Trash2, X } from 'lucide-react'
import { useCart } from '@/context/CartContext'

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function MiniCartDrawer({
  isOpen,
  onClose,
}: {
  isOpen?: boolean
  onClose?: () => void
}) {
  const router = useRouter()
  const {
    closeCart,
    isMiniCartOpen,
    itemCount,
    items,
    removeItem,
    subtotal,
    updateQuantity,
  } = useCart()
  const open = isOpen ?? isMiniCartOpen
  const close = onClose ?? closeCart
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const navigate = (href: string) => {
    close()
    router.push(href)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(26,16,20,0.4)',
              zIndex: 200,
            }}
          />
          <motion.aside
            initial={isMobile ? { y: '100%' } : { x: 420 }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: 420 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'fixed',
              top: isMobile ? 'auto' : 0,
              right: 0,
              bottom: isMobile ? 0 : 'auto',
              left: isMobile ? 0 : 'auto',
              height: isMobile ? '85vh' : '100vh',
              width: isMobile ? '100%' : 'min(420px, 100vw)',
              background: '#FBF5F0',
              zIndex: 201,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: isMobile ? '12px 12px 0 0' : 0,
            }}
          >
            {isMobile && <div style={{ width: '40px', height: '4px', background: '#EDD9AF', borderRadius: '999px', margin: '12px auto 0' }} />}
            <header
              style={{
                padding: '24px',
                borderBottom: '0.5px solid #EDD9AF',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <p
                  style={{
                    color: '#C9A961',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '10px',
                    letterSpacing: '0.3em',
                    marginBottom: '4px',
                  }}
                >
                  YOUR CART
                </p>
                <p
                  style={{
                    color: '#1A1014',
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '20px',
                    margin: 0,
                  }}
                >
                  {itemCount} items
                </p>
              </div>
              <button
                onClick={close}
                style={{
                  width: '40px',
                  height: '40px',
                  border: '0.5px solid #EDD9AF',
                  borderRadius: '50%',
                  color: '#1A1014',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </header>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {items.length === 0 ? (
                <div
                  className="flex h-full flex-col items-center justify-center text-center"
                  style={{ color: '#1A1014' }}
                >
                  <Gem color="#C9A961" size={48} strokeWidth={1.1} />
                  <p
                    style={{
                      fontFamily: 'var(--font-playfair)',
                      fontSize: '20px',
                      marginTop: '16px',
                    }}
                  >
                    Your cart is empty
                  </p>
                  <p
                    style={{
                      color: '#B8A090',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '13px',
                      marginBottom: '20px',
                    }}
                  >
                    Add something beautiful
                  </p>
                  <button
                    onClick={close}
                    style={{
                      background: '#1A1014',
                      color: '#FBF5F0',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '11px',
                      letterSpacing: '0.18em',
                      padding: '12px 18px',
                    }}
                  >
                    CONTINUE SHOPPING
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      padding: '16px 0',
                      borderBottom: '0.5px solid #EDD9AF',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        background: '#F5E8ED',
                        position: 'relative',
                        flexShrink: 0,
                      }}
                    >
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productTitle}
                          fill
                          sizes="60px"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Gem color="#C9A961" size={22} />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          color: '#1A1014',
                          fontFamily: 'var(--font-playfair)',
                          fontSize: '14px',
                          marginBottom: '4px',
                        }}
                      >
                        {item.productTitle}
                      </p>
                      <p
                        style={{
                          color: '#B8A090',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '10px',
                          marginBottom: '2px',
                        }}
                      >
                        {item.selectedMetal} · {item.selectedCarat}ct · {item.selectedShape}
                      </p>
                      {item.engraving && (
                        <p
                          style={{
                            color: '#B8A090',
                            fontFamily: 'var(--font-inter)',
                            fontSize: '10px',
                            fontStyle: 'italic',
                          }}
                        >
                          &quot;{item.engraving}&quot;
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="flex items-center">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ width: '24px', height: '24px', border: '0.5px solid #EDD9AF', color: '#1A1014', fontSize: '14px' }}>−</button>
                          <span style={{ width: '28px', textAlign: 'center', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ width: '24px', height: '24px', border: '0.5px solid #EDD9AF', color: '#1A1014', fontSize: '14px' }}>+</button>
                        </div>
                        <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '14px' }}>{formatPrice(item.unitPrice * item.quantity)}</p>
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.id)} style={{ color: '#B8A090', alignSelf: 'start' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <footer
                style={{
                  padding: '20px 24px',
                  borderTop: '0.5px solid #EDD9AF',
                  background: '#FBF5F0',
                }}
              >
                <div className="flex items-end justify-between">
                  <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>Subtotal</span>
                  <span style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px' }}>{formatPrice(subtotal)}</span>
                </div>
                <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', textAlign: 'center', margin: '8px 0 16px' }}>Free shipping on all orders</p>
                <button onClick={() => navigate('/cart')} style={{ width: '100%', height: '48px', background: 'transparent', border: '1px solid #1A1014', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.18em', marginBottom: '10px' }}>VIEW FULL CART</button>
                <button onClick={() => navigate('/checkout')} style={{ width: '100%', height: '52px', background: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.2em' }}>PROCEED TO CHECKOUT →</button>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

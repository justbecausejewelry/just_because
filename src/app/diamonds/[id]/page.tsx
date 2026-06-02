'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Gem } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { supabase } from '@/lib/supabase'

type DiamondRow = {
  id: string
  shape: string
  carat: number
  color: string
  clarity: string
  cut?: string | null
  polish?: string | null
  symmetry?: string | null
  fluorescence?: string | null
  price: number
  imageUrl?: string | null
  measurements?: string | null
  depthPercent?: number | null
  tablePercent?: number | null
  certificateNumber?: string | null
  certificateType?: string | null
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function DiamondDetailPage() {
  const params = useParams<{ id: string }>()
  const { addItem } = useCart()
  const [diamond, setDiamond] = useState<DiamondRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartNotice, setCartNotice] = useState<{ isGuest: boolean } | null>(null)

  useEffect(() => {
    const loadDiamond = async () => {
      setLoading(true)
      setError('')
      const { data, error: fetchError } = await supabase
        .from('Diamond')
        .select('*')
        .eq('id', params.id)
        .maybeSingle()

      if (fetchError || !data) {
        setError('Diamond not found')
        setDiamond(null)
      } else {
        setDiamond(data as DiamondRow)
      }

      setLoading(false)
    }

    void loadDiamond()
  }, [params.id])

  useEffect(() => {
    if (!cartNotice) return undefined

    const timer = window.setTimeout(() => setCartNotice(null), 6000)
    return () => window.clearTimeout(timer)
  }, [cartNotice])

  const addDiamondToCart = async () => {
    if (!diamond) return

    await addItem({
      productId: diamond.id,
      productSlug: `loose-diamond-${diamond.id}`,
      productTitle: `${diamond.carat.toFixed(2)}ct ${diamond.shape} Diamond`,
      productImage: diamond.imageUrl || '',
      selectedMetal: 'Loose diamond',
      selectedCarat: diamond.carat,
      selectedShape: diamond.shape,
      selectedColor: diamond.color,
      selectedClarity: diamond.clarity,
      quantity: 1,
      unitPrice: diamond.price,
      priceBreakdown: {
        base: diamond.price,
        metal: 0,
        carat: 0,
        shape: 0,
        color: 0,
        clarity: 0,
      },
    })

    const { data: { user } } = await supabase.auth.getUser()
    setCartNotice({ isGuest: !user })
  }

  return (
    <main style={{ background: '#FBF5F0', minHeight: '100vh', padding: 'clamp(24px, 5vw, 72px)' }}>
      <Link href="/diamonds" style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.12em', textDecoration: 'none' }}>
        - BACK TO DIAMONDS
      </Link>

      {loading ? (
        <div style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', padding: '80px 0' }}>
          Loading diamond...
        </div>
      ) : error || !diamond ? (
        <section style={{ padding: '80px 0', textAlign: 'center' }}>
          <Gem color="#C9A961" size={54} strokeWidth={1.1} style={{ margin: '0 auto 18px' }} />
          <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '32px', fontWeight: 400 }}>Diamond not found</h1>
          <Link href="/diamonds" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.16em', textDecoration: 'none' }}>
            VIEW ALL DIAMONDS
          </Link>
        </section>
      ) : (
        <section className="diamond-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 460px)', gap: 'clamp(28px, 6vw, 72px)', alignItems: 'start', marginTop: '32px' }}>
          <style>{`
            @media (max-width: 900px) {
              .diamond-detail-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
          <div style={{ aspectRatio: '1', background: '#F5E8ED', border: '0.5px solid #EDD9AF', position: 'relative' }}>
            {diamond.imageUrl ? (
              <Image src={diamond.imageUrl} alt={`${diamond.carat}ct ${diamond.shape} diamond`} fill sizes="(max-width: 900px) 100vw, 55vw" style={{ objectFit: 'cover' }} priority />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Gem color="#C9A961" size={72} strokeWidth={1.1} />
              </div>
            )}
          </div>

          <div>
            <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '10px' }}>
              {diamond.certificateType || 'IGI'} CERTIFIED
            </div>
            <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: 'clamp(34px, 5vw, 52px)', fontWeight: 400, lineHeight: 1.05, margin: '0 0 16px' }}>
              {diamond.carat.toFixed(2)}ct {diamond.shape}
              <br />
              <span style={{ color: '#B8A090', fontSize: '0.58em' }}>Lab-Grown Diamond</span>
            </h1>
            <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '30px', marginBottom: '24px' }}>
              {formatPrice(diamond.price)}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '0.5px solid #EDD9AF', marginBottom: '24px' }}>
              {[
                ['COLOR', diamond.color],
                ['CLARITY', diamond.clarity],
                ['CUT', diamond.cut || 'Excellent'],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: '16px 10px', borderRight: label === 'CUT' ? 'none' : '0.5px solid #EDD9AF', textAlign: 'center' }}>
                  <div style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.18em', marginBottom: '6px' }}>{label}</div>
                  <div style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '18px' }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '20px', marginBottom: '24px' }}>
              {[
                ['Measurements', diamond.measurements],
                ['Depth', diamond.depthPercent ? `${diamond.depthPercent}%` : null],
                ['Table', diamond.tablePercent ? `${diamond.tablePercent}%` : null],
                ['Polish', diamond.polish],
                ['Symmetry', diamond.symmetry],
                ['Fluorescence', diamond.fluorescence],
                ['Certificate', diamond.certificateNumber],
              ].map(([label, value]) => value ? (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '8px 0', borderBottom: '0.5px solid rgba(237,217,175,0.7)', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>
                  <span style={{ color: '#B8A090' }}>{label}</span>
                  <span>{value}</span>
                </div>
              ) : null)}
            </div>

            <button onClick={() => void addDiamondToCart()} style={{ width: '100%', background: '#1A1014', color: '#FBF5F0', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.2em', padding: '17px' }}>
              ADD TO CART
            </button>
          </div>
        </section>
      )}

      {cartNotice ? (
        <div style={{ position: 'fixed', right: '24px', bottom: '24px', zIndex: 1200, width: 'min(360px, calc(100vw - 32px))', background: '#FDF8F2', border: '0.5px solid #EDD9AF', boxShadow: '0 12px 36px rgba(26,16,20,0.16)', padding: '18px' }}>
          <div style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '18px', marginBottom: '12px' }}>
            Added to your cart
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: cartNotice.isGuest ? '12px' : 0 }}>
            <Link href="/cart" style={{ background: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.14em', padding: '10px 14px', textDecoration: 'none' }}>
              VIEW CART
            </Link>
            {cartNotice.isGuest ? (
              <Link href="/login?redirect=/cart" style={{ border: '0.5px solid #EDD9AF', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.14em', padding: '10px 14px', textDecoration: 'none' }}>
                SIGN IN TO SAVE
              </Link>
            ) : null}
          </div>
          <button onClick={() => setCartNotice(null)} style={{ background: 'transparent', border: 'none', color: '#C9A961', cursor: 'pointer', fontFamily: 'var(--font-inter)', fontSize: '11px', padding: 0 }}>
            Continue browsing -
          </button>
        </div>
      ) : null}
    </main>
  )
}

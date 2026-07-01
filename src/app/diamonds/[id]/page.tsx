'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Gem } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { LOOSE_DIAMOND_VALUE } from '@/config/productOptions'
import { getDiamondImage } from '@/lib/diamondImages'
import { getSettledBrowserSession, supabase } from '@/lib/supabase'

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

const COLOR_ORDER = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
const CLARITY_ORDER = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1']

function sortByOrder(values: string[], order: string[]) {
  return values.sort((a, b) => {
    const aIndex = order.indexOf(a)
    const bIndex = order.indexOf(b)

    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })
}

function uniqueOptions(values: Array<string | null | undefined>, order: string[]) {
  return sortByOrder(
    [...new Set(values.filter((value): value is string => Boolean(value)))],
    order
  )
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
  const router = useRouter()
  const { addItem } = useCart()
  const [diamond, setDiamond] = useState<DiamondRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartNotice, setCartNotice] = useState<{ isGuest: boolean } | null>(null)
  const [sameShapeDiamonds, setSameShapeDiamonds] = useState<DiamondRow[]>([])
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedClarity, setSelectedClarity] = useState('')

  const selectedMatch = useMemo(() => {
    if (!diamond || !selectedColor || !selectedClarity) return null

    return sameShapeDiamonds
      .filter((item) => item.color === selectedColor && item.clarity === selectedClarity)
      .sort((a, b) => Math.abs(a.carat - diamond.carat) - Math.abs(b.carat - diamond.carat))[0] || null
  }, [diamond, sameShapeDiamonds, selectedClarity, selectedColor])

  const displayDiamond = selectedMatch || diamond
  const availabilityLoaded = sameShapeDiamonds.length > 0
  const combinationAvailable = !availabilityLoaded || Boolean(selectedMatch)
  const diamondImage = displayDiamond ? getDiamondImage(displayDiamond.shape) : ''
  const shapeColors = useMemo(() => uniqueOptions(sameShapeDiamonds.map((item) => item.color), COLOR_ORDER), [sameShapeDiamonds])
  const shapeClarities = useMemo(() => uniqueOptions(sameShapeDiamonds.map((item) => item.clarity), CLARITY_ORDER), [sameShapeDiamonds])

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
        const nextDiamond = data as DiamondRow
        setDiamond(nextDiamond)
        setSelectedColor(nextDiamond.color)
        setSelectedClarity(nextDiamond.clarity)
      }

      setLoading(false)
    }

    void loadDiamond()
  }, [params.id])

  useEffect(() => {
    if (!diamond?.shape) return

    const loadSameShape = async () => {
      const { data } = await supabase
        .from('Diamond')
        .select('*')
        .eq('shape', diamond.shape)
        .eq('isAvailable', true)

      setSameShapeDiamonds((data || []) as DiamondRow[])
    }

    void loadSameShape()
  }, [diamond?.shape])

  useEffect(() => {
    if (!cartNotice) return undefined

    const timer = window.setTimeout(() => setCartNotice(null), 6000)
    return () => window.clearTimeout(timer)
  }, [cartNotice])

  const addDiamondToCart = async () => {
    if (!displayDiamond || !combinationAvailable) return

    await addItem({
      productId: displayDiamond.id,
      productSlug: `loose-diamond-${displayDiamond.id}`,
      productTitle: `${displayDiamond.carat.toFixed(2)}ct ${displayDiamond.shape} Diamond`,
      productImage: getDiamondImage(displayDiamond.shape),
      selectedMetal: LOOSE_DIAMOND_VALUE,
      selectedCarat: displayDiamond.carat,
      selectedShape: displayDiamond.shape,
      selectedColor: displayDiamond.color,
      selectedClarity: displayDiamond.clarity,
      quantity: 1,
      unitPrice: displayDiamond.price,
      priceBreakdown: {
        base: displayDiamond.price,
        metal: 0,
        carat: 0,
        shape: 0,
        color: 0,
        clarity: 0,
      },
    })

    const session = await getSettledBrowserSession()
    const user = session?.user || null
    setCartNotice({ isGuest: !user })
    router.push('/cart')
  }

  const buildRingWithDiamond = () => {
    if (!displayDiamond || !combinationAvailable) return

    const builderDiamond = {
      ...displayDiamond,
      img: getDiamondImage(displayDiamond.shape),
    }
    window.localStorage.setItem('builder_diamond', JSON.stringify(builderDiamond))

    const builderParams = new URLSearchParams({
      step: '2',
      diamond: displayDiamond.id,
      carat: displayDiamond.carat.toString(),
      color: displayDiamond.color,
      clarity: displayDiamond.clarity,
      price: displayDiamond.price.toString(),
      shape: displayDiamond.shape,
    })
    router.push(`/build?${builderParams.toString()}`)
  }

  return (
    <main style={{ background: '#FBF5F0', minHeight: '100vh', padding: 'clamp(24px, 5vw, 72px)' }}>
      <Link href="/diamonds" style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.12em', textDecoration: 'none' }}>
        - BACK TO DIAMONDS
      </Link>

      {loading ? (
        <div style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', padding: '80px 0' }}>
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
          <div style={{ aspectRatio: '1', background: '#FBF5F0', border: '0.5px solid #EDD9AF', position: 'relative' }}>
            <Image src={diamondImage} alt={`${(displayDiamond || diamond).carat}ct ${(displayDiamond || diamond).shape} diamond`} fill sizes="(max-width: 900px) 100vw, 55vw" style={{ objectFit: 'contain', padding: '44px' }} priority />
          </div>

          <div>
            <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '10px' }}>
              {diamond.certificateType || 'IGI'} CERTIFIED
            </div>
            <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: 'clamp(34px, 5vw, 52px)', fontWeight: 400, lineHeight: 1.05, margin: '0 0 16px' }}>
              {(displayDiamond || diamond).carat.toFixed(2)}ct {(displayDiamond || diamond).shape}
              <br />
              <span style={{ color: 'var(--color-muted-text)', fontSize: '0.58em' }}>Lab-Grown Diamond</span>
            </h1>
            <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '30px', marginBottom: '24px' }}>
              {formatPrice((displayDiamond || diamond).price)}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '0.5px solid #EDD9AF', marginBottom: '24px' }}>
              {[
                ['COLOR', (displayDiamond || diamond).color],
                ['CLARITY', (displayDiamond || diamond).clarity],
                ['CUT', (displayDiamond || diamond).cut || 'Excellent'],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: '16px 10px', borderRight: label === 'CUT' ? 'none' : '0.5px solid #EDD9AF', textAlign: 'center' }}>
                  <div style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.18em', marginBottom: '6px' }}>{label}</div>
                  <div style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '18px' }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '20px', marginBottom: '24px' }}>
              <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.25em', marginBottom: '16px' }}>
                CUSTOMIZE YOUR DIAMOND
              </div>

              <div style={{ marginBottom: '18px' }}>
                <div style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 500, marginBottom: '10px' }}>
                  Color
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {shapeColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      style={{
                        background: selectedColor === color ? '#1A1014' : '#FBF5F0',
                        border: '0.5px solid #EDD9AF',
                        color: selectedColor === color ? '#FBF5F0' : '#1A1014',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        fontWeight: 500,
                        minWidth: '40px',
                        padding: '8px 10px',
                      }}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 500, marginBottom: '10px' }}>
                  Clarity
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {shapeClarities.map((clarity) => (
                    <button
                      key={clarity}
                      onClick={() => setSelectedClarity(clarity)}
                      style={{
                        background: selectedClarity === clarity ? '#1A1014' : '#FBF5F0',
                        border: '0.5px solid #EDD9AF',
                        color: selectedClarity === clarity ? '#FBF5F0' : '#1A1014',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        fontWeight: 500,
                        padding: '8px 10px',
                      }}
                    >
                      {clarity}
                    </button>
                  ))}
                </div>
              </div>

              {!combinationAvailable ? (
                <div style={{ color: '#A85C6A', fontFamily: 'var(--font-inter)', fontSize: '12px', marginTop: '14px' }}>
                  Not available in this combination.
                </div>
              ) : selectedMatch ? (
                <div style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px', marginTop: '14px' }}>
                  Matched to {selectedMatch.carat.toFixed(2)}ct diamond {selectedMatch.id}.
                </div>
              ) : null}
            </div>

            <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '20px', marginBottom: '24px' }}>
              {[
                ['Measurements', (displayDiamond || diamond).measurements],
                ['Depth', (displayDiamond || diamond).depthPercent ? `${(displayDiamond || diamond).depthPercent}%` : null],
                ['Table', (displayDiamond || diamond).tablePercent ? `${(displayDiamond || diamond).tablePercent}%` : null],
                ['Polish', (displayDiamond || diamond).polish],
                ['Symmetry', (displayDiamond || diamond).symmetry],
                ['Fluorescence', (displayDiamond || diamond).fluorescence],
                ['Certificate', (displayDiamond || diamond).certificateNumber],
              ].map(([label, value]) => value ? (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '8px 0', borderBottom: '0.5px solid rgba(237,217,175,0.7)', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--color-muted-text)' }}>{label}</span>
                  <span>{value}</span>
                </div>
              ) : null)}
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <button disabled={!combinationAvailable} onClick={() => void addDiamondToCart()} style={{ width: '100%', background: combinationAvailable ? '#1A1014' : '#B8A090', color: '#FBF5F0', border: 'none', cursor: combinationAvailable ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.2em', padding: '17px' }}>
                ADD LOOSE DIAMOND TO CART - {displayDiamond ? formatPrice(displayDiamond.price) : ''}
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center', color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.2em' }}>
                <span style={{ height: '0.5px', background: '#EDD9AF' }} />
                <span>OR</span>
                <span style={{ height: '0.5px', background: '#EDD9AF' }} />
              </div>
              <button disabled={!combinationAvailable} onClick={buildRingWithDiamond} style={{ width: '100%', background: '#FDF8F2', color: '#1A1014', border: '0.5px solid #EDD9AF', cursor: combinationAvailable ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.18em', padding: '15px' }}>
                USE THIS DIAMOND TO BUILD A RING -
              </button>
              <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.7, margin: 0 }}>
                Add the diamond alone, or pair it with a setting in the ring builder.
              </p>
            </div>
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

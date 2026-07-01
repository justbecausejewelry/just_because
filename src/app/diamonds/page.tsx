'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { LOOSE_DIAMOND_VALUE } from '@/config/productOptions'
import { ALL_DIAMONDS, Diamond } from '@/lib/diamondCatalog'
import { getSettledBrowserSession, supabase } from '@/lib/supabase'
import DiamondVisualizer from '@/components/diamonds/DiamondVisualizer'
import { getDiamondImage } from '@/lib/diamondImages'

type DiamondRow = {
  id?: string | number | null
  shape?: string | null
  carat?: number | string | null
  color?: string | null
  clarity?: string | null
  cut?: string | null
  polish?: string | null
  symmetry?: string | null
  fluorescence?: string | null
  price?: number | string | null
  images?: string[] | string | null
  imageUrl?: string | null
  depthPercent?: number | string | null
  tablePercent?: number | string | null
  measurements?: string | null
  certificateNumber?: string | null
  certificateType?: string | null
  certificateUrl?: string | null
  isAvailable?: boolean | string | null
  reportNumber?: string | null
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: '#FDF8F2',
  border: '0.5px solid #EDD9AF',
  fontSize: '12px',
  color: '#1A1014',
  outline: 'none',
  fontFamily: 'var(--font-inter)',
  borderRadius: '2px',
}

const SHAPE_ORDER = ['Round', 'Princess', 'Cushion', 'Oval', 'Emerald', 'Pear', 'Radiant', 'Asscher', 'Heart', 'Marquise']
const COLOR_ORDER = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
const CLARITY_ORDER = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1']
const CUT_ORDER = ['Ideal', 'Excellent', 'Very Good', 'Good', 'Fair']

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

function countValues(diamonds: Diamond[], field: 'shape' | 'color' | 'clarity' | 'cut') {
  return diamonds.reduce<Record<string, number>>((counts, diamond) => {
    const value = diamond[field]
    if (value) counts[value] = (counts[value] || 0) + 1
    return counts
  }, {})
}

function parseNumber(value: string, fallback: number) {
  const nextValue = Number(value)
  return Number.isFinite(nextValue) ? nextValue : fallback
}

function mapDiamond(row: DiamondRow, index: number): Diamond {
  const shape = row.shape || 'Round'
  const carat = Number(row.carat ?? 1)
  const price = Number(row.price ?? 0)
  const fallback = ALL_DIAMONDS[index % ALL_DIAMONDS.length]

  return {
    id: String(row.id || fallback.id),
    shape,
    carat: Number.isFinite(carat) && carat > 0 ? carat : fallback.carat,
    color: row.color || fallback.color,
    clarity: row.clarity || fallback.clarity,
    cut: row.cut || fallback.cut,
    price: Number.isFinite(price) && price > 0 ? price : fallback.price,
    polish: row.polish || fallback.polish,
    symmetry: row.symmetry || fallback.symmetry,
    fluorescence: row.fluorescence || fallback.fluorescence,
    depthPercent: String(row.depthPercent || fallback.depthPercent),
    tablePercent: String(row.tablePercent || fallback.tablePercent),
    measurements: row.measurements || fallback.measurements,
    certificateNumber: row.certificateNumber || row.reportNumber || fallback.certificateNumber,
    certificateType: row.certificateType || fallback.certificateType,
    certificateUrl: row.certificateUrl || fallback.certificateUrl,
    img: getDiamondImage(shape),
  }
}

function calculateCustomPrice(carat: number, color: string, clarity: string) {
  const basePerCarat = 500
  const colorMultiplier: Record<string, number> = {
    D: 1.6,
    E: 1.45,
    F: 1.28,
    G: 1.12,
    H: 1.0,
    I: 0.88,
    J: 0.8,
    K: 0.72,
  }
  const clarityMultiplier: Record<string, number> = {
    FL: 1.8,
    IF: 1.65,
    VVS1: 1.45,
    VVS2: 1.3,
    VS1: 1.15,
    VS2: 1.0,
    SI1: 0.85,
    SI2: 0.75,
    I1: 0.62,
  }

  return Math.round(
    carat *
      basePerCarat *
      (colorMultiplier[color] || 1) *
      (clarityMultiplier[clarity] || 1)
  )
}

function colorDescription(color: string) {
  if (color === 'D') return 'Exceptional white+'
  if (color === 'E') return 'Exceptional white'
  if (color === 'F') return 'Rare white+'
  if (color === 'G') return 'Rare white'
  if (color === 'H') return 'White'
  if (color === 'K') return 'Soft warm tint'
  return 'Slightly tinted'
}

function clarityDescription(clarity: string) {
  if (clarity === 'FL') return 'Flawless'
  if (clarity === 'IF') return 'Internally Flawless'
  if (clarity === 'VVS1') return 'Very Very Slightly Included'
  if (clarity === 'VVS2') return 'Very Very Slight'
  if (clarity === 'VS1') return 'Very Slightly Included'
  if (clarity === 'VS2') return 'Very Slight'
  if (clarity === 'SI2') return 'Slightly Included'
  if (clarity === 'I1') return 'Included'
  return 'Slightly Included'
}

function formatShapeParam(shape: string) {
  return shape
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function DiamondsLoadingFallback() {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FBF5F0',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: '32px',
            color: '#C9A961',
            animation: 'pulse 1.2s ease infinite',
          }}
        >
          *
        </div>
        <div
          style={{
            fontSize: '11px',
            letterSpacing: '0.25em',
            color: 'var(--color-muted-text)',
            marginTop: '12px',
            fontFamily: 'var(--font-inter)',
          }}
        >
          LOADING DIAMONDS...
        </div>
        <style>{`
          @keyframes pulse {
            0%,100%{opacity:0.3;transform:scale(0.9)}
            50%{opacity:1;transform:scale(1.1)}
          }
        `}</style>
      </div>
    </div>
  )
}

function DiamondModal({
  diamond,
  onClose,
  onChoose,
}: {
  diamond: Diamond
  onClose: () => void
  onChoose: (customDiamond: Diamond) => void
}) {
  const router = useRouter()
  const { addItem } = useCart()
  const { showToast } = useToast()
  const [customCarat, setCustomCarat] = useState(diamond.carat || 1)
  const [customColor, setCustomColor] = useState(diamond.color || 'G')
  const [customClarity, setCustomClarity] = useState(diamond.clarity || 'VS1')
  const [cartNotice, setCartNotice] = useState<{ isGuest: boolean } | null>(null)

  useEffect(() => {
    setCustomCarat(diamond.carat || 1)
    setCustomColor(diamond.color || 'G')
    setCustomClarity(diamond.clarity || 'VS1')
    setCartNotice(null)
  }, [diamond])

  useEffect(() => {
    if (!cartNotice) return undefined

    const timer = window.setTimeout(() => setCartNotice(null), 6000)
    return () => window.clearTimeout(timer)
  }, [cartNotice])

  const customPrice = calculateCustomPrice(customCarat, customColor, customClarity)
  const originalCustomPrice = calculateCustomPrice(diamond.carat || 1, diamond.color || 'G', diamond.clarity || 'VS1')
  const customDiamond: Diamond = {
    ...diamond,
    carat: customCarat,
    color: customColor,
    clarity: customClarity,
    price: customPrice,
  }

  const addLooseDiamond = async () => {
    await addItem({
      productId: diamond.id,
      productSlug: `loose-diamond-${diamond.id}`,
      productTitle: `${customCarat.toFixed(2)}ct ${diamond.shape} Diamond`,
      productImage: diamond.img,
      selectedMetal: LOOSE_DIAMOND_VALUE,
      selectedCarat: customCarat,
      selectedShape: diamond.shape,
      selectedColor: customColor,
      selectedClarity: customClarity,
      quantity: 1,
      unitPrice: customPrice,
      priceBreakdown: {
        base: customPrice,
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
    showToast('Diamond added to cart', 'success')
    router.push('/cart')
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,16,20,0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="diamond-modal-grid"
        style={{
          background: '#FBF5F0',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
        }}
      >
        <style>{`
          input[type='range'] {
            -webkit-appearance: none;
            appearance: none;
            height: 4px;
            border-radius: 2px;
            cursor: pointer;
          }
          input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #1A1014;
            border: 3px solid #C9A961;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(26,16,20,0.3);
            transition: transform 0.15s ease;
          }
          input[type='range']::-webkit-slider-thumb:hover {
            transform: scale(1.2);
          }
          input[type='range']::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #1A1014;
            border: 3px solid #C9A961;
            cursor: pointer;
          }
        `}</style>
        <button
          onClick={onClose}
          aria-label="Close diamond details"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-muted-text)',
            zIndex: 10,
            fontSize: '20px',
          }}
        >
          x
        </button>

        <div>
          <DiamondVisualizer
            initialShape={diamond.shape || 'Round'}
            initialCarat={customCarat || 1}
            onCaratChange={setCustomCarat}
            showShapeSelector={false}
          />
          <div
            style={{
              padding: '24px',
              background: '#FDF8F2',
              borderTop: '0.5px solid #EDD9AF',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            {[0, 1].map((item) => (
              <div
                key={item}
                style={{
                  aspectRatio: '1',
                  background: '#FBF5F0',
                  border: '0.5px solid #EDD9AF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <Image
                  src={getDiamondImage(diamond.shape)}
                  alt={`${diamond.shape} diamond preview`}
                  fill
                  sizes="160px"
                  quality={90}
                  style={{ objectFit: 'contain', padding: '24px' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '40px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#C9A961', marginBottom: '8px', fontFamily: 'var(--font-jost)', fontWeight: 500 }}>
            LAB-GROWN DIAMOND - {diamond.id}
          </div>
          <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, color: '#1A1014', marginBottom: '24px', lineHeight: 1.1 }}>
            {diamond.carat} Carat {diamond.shape}
            <br />
            <span style={{ fontFamily: 'var(--font-jost)', fontSize: '17px', color: 'var(--color-muted-text)', fontWeight: 300 }}>Lab Grown Diamond</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: '#EDD9AF', border: '0.5px solid #EDD9AF', marginBottom: '24px' }}>
            {[
              ['CARAT', customCarat.toFixed(2)],
              ['COLOR', customColor],
              ['CLARITY', customClarity],
              ['CUT', diamond.cut],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#FBF5F0', padding: '14px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.18em', color: 'var(--color-muted-text)', marginBottom: '6px', fontFamily: 'var(--font-jost)', fontWeight: 500, textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', color: '#1A1014', fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.22em', color: '#C9A961', marginBottom: '16px', fontFamily: 'var(--font-jost)', fontWeight: 600 }}>
              - CUSTOMIZE YOUR DIAMOND
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '12px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
                  Your diamond: {customCarat.toFixed(2)} ct
                </span>
                <div style={{ background: '#1A1014', color: '#FBF5F0', padding: '4px 12px', fontSize: '13px', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
                  {customCarat.toFixed(2)} ct
                </div>
              </div>
              <div style={{ position: 'relative', padding: '4px 0' }}>
                <input
                  type="range"
                  min={0.25}
                  max={5}
                  step={0.01}
                  value={customCarat}
                  onChange={(event) => setCustomCarat(Number(event.target.value))}
                  style={{
                    width: '100%',
                    height: '4px',
                    appearance: 'none',
                    background: `linear-gradient(to right, #C9A961 ${((customCarat - 0.25) / (5 - 0.25)) * 100}%, #EDD9AF ${((customCarat - 0.25) / (5 - 0.25)) * 100}%)`,
                    outline: 'none',
                    cursor: 'pointer',
                    borderRadius: '2px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                {[0.25, 0.5, 1, 1.5, 2, 3, 4, 5].map((carat) => (
                  <button
                    key={carat}
                    onClick={() => setCustomCarat(carat)}
                    style={{
                      fontSize: '10px',
                      color: Math.abs(customCarat - carat) < 0.05 ? '#C9A961' : 'var(--color-muted-text)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-inter)',
                      fontWeight: Math.abs(customCarat - carat) < 0.05 ? 500 : 400,
                      padding: '0',
                    }}
                  >
                    {carat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>Color</span>
                <span style={{ fontSize: '11px', color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)' }}>{colorDescription(customColor)}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                {['D', 'E', 'F', 'G', 'H', 'I'].map((color, index) => {
                  const selected = customColor === color
                  const gradients = ['#FAFAFA', '#F5F5F5', '#F0F0F0', '#EBEBEB', '#E3E0D0', '#D8D0B8']
                  return (
                    <button
                      key={color}
                      onClick={() => setCustomColor(color)}
                      title={color}
                      style={{
                        flex: 1,
                        height: '36px',
                        background: gradients[index],
                        border: selected ? '2px solid #1A1014' : '1px solid #EDD9AF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: selected ? 500 : 400,
                        color: '#1A1014',
                        fontFamily: 'var(--font-inter)',
                        transition: 'all 0.2s',
                        borderRadius: '2px',
                        boxShadow: selected ? '0 2px 8px rgba(26,16,20,0.15)' : 'none',
                      }}
                    >
                      {color}
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', letterSpacing: '0.05em' }}>
                <span>&lt;- COLORLESS</span>
                <span>NEAR COLORLESS -&gt;</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>Clarity</span>
                <span style={{ fontSize: '11px', color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)' }}>{clarityDescription(customClarity)}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1'].map((clarity) => (
                  <button
                    key={clarity}
                    onClick={() => setCustomClarity(clarity)}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      border: customClarity === clarity ? '2px solid #1A1014' : '1px solid #EDD9AF',
                      background: customClarity === clarity ? '#1A1014' : '#FBF5F0',
                      color: customClarity === clarity ? '#FBF5F0' : '#1A1014',
                      fontSize: '10px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-inter)',
                      transition: 'all 0.2s',
                      borderRadius: '2px',
                      textAlign: 'center',
                    }}
                  >
                    {clarity}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: customPrice !== originalCustomPrice ? 'rgba(201,169,97,0.06)' : 'transparent', border: '0.5px solid #EDD9AF', padding: '16px 20px', marginBottom: '20px', transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--color-muted-text)', letterSpacing: '0.18em', fontFamily: 'var(--font-jost)', fontWeight: 500, marginBottom: '4px' }}>YOUR DIAMOND PRICE</div>
                <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2.5rem', color: '#1A1014', fontWeight: 400, lineHeight: 1, transition: 'all 0.3s' }}>${customPrice.toLocaleString()}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', marginTop: '4px' }}>
                  {customCarat.toFixed(2)}ct - {customColor} - {customClarity}
                  <br />
                  Starting at ${Math.round(customPrice / 12).toLocaleString()}/mo
                </div>
              </div>
              {customPrice !== originalCustomPrice ? (
                <div style={{ fontSize: '11px', color: customPrice > originalCustomPrice ? '#A85C6A' : '#2E7D32', fontFamily: 'var(--font-inter)', textAlign: 'right' }}>
                  {customPrice > originalCustomPrice ? '↑' : '↓'} Custom selection
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '16px 20px', marginBottom: '20px' }}>
            {[
              ['Measurements', `${diamond.measurements} mm`],
              ['Table', `${diamond.tablePercent}%`],
              ['Depth', `${diamond.depthPercent}%`],
              ['IGI Report', diamond.certificateNumber],
            ].map(([label, value], index) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '8px 0', borderBottom: index < 3 ? '0.5px solid #EDD9AF' : 'none', fontSize: '13px', fontFamily: 'var(--font-inter)' }}>
                <span style={{ color: 'var(--color-muted-text)' }}>{label}</span>
                <span style={{ color: '#1A1014', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
            {diamond.certificateUrl ? (
              <a
                href={diamond.certificateUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#C9A961', display: 'inline-block', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.12em', marginTop: '12px', textDecoration: 'none' }}
              >
                VIEW CERTIFICATE -
              </a>
            ) : null}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#FDF8F2', border: '0.5px solid #EDD9AF', marginBottom: '24px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1A1014', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '9px', color: '#C9A961', fontWeight: 500, letterSpacing: '0.05em' }}>IGI</span>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#1A1014', fontWeight: 500, fontFamily: 'var(--font-inter)' }}>IGI Certified</div>
              <div style={{ fontSize: '11px', color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)' }}>View certificate - prototype</div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <button onClick={() => void addLooseDiamond()} className="btn-primary" style={{ width: '100%', marginBottom: '12px' }}>
              Add Loose Diamond to Cart - ${customPrice.toLocaleString()}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
              <div style={{ flex: 1, height: '0.5px', background: '#EDD9AF' }} />
              <span style={{ fontSize: '11px', color: 'var(--color-muted-text)', letterSpacing: '0.1em' }}>OR</span>
              <div style={{ flex: 1, height: '0.5px', background: '#EDD9AF' }} />
            </div>

            <button onClick={() => onChoose(customDiamond)} className="btn-outline" style={{ width: '100%', marginTop: '12px' }}>
              Use This Diamond to Build a Ring -
            </button>
            <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', textAlign: 'center', marginTop: '8px' }}>
              Choose a setting and preview your complete ring
            </p>
          </div>
        </div>

        {cartNotice ? (
          <div
            style={{
              position: 'fixed',
              right: '24px',
              bottom: '24px',
              zIndex: 1200,
              width: 'min(360px, calc(100vw - 32px))',
              background: '#FDF8F2',
              border: '0.5px solid #EDD9AF',
              boxShadow: '0 12px 36px rgba(26,16,20,0.16)',
              padding: '18px',
            }}
          >
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
      </div>
    </div>
  )
}

function DiamondsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const shapeParam = searchParams.get('shape')
  const [diamonds, setDiamonds] = useState<Diamond[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedShape, setSelectedShape] = useState(() => (shapeParam ? formatShapeParam(shapeParam) : 'All'))
  const [selectedColor, setSelectedColor] = useState('All')
  const [selectedClarity, setSelectedClarity] = useState('All')
  const [selectedCut, setSelectedCut] = useState('All')
  const [caratRange, setCaratRange] = useState<[number, number]>([0.5, 15])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [sortBy, setSortBy] = useState('price_low')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedDiamond, setSelectedDiamond] = useState<Diamond | null>(null)

  useEffect(() => {
    if (shapeParam) {
      setSelectedShape(formatShapeParam(shapeParam))
    }
  }, [shapeParam])

  useEffect(() => {
    if (!shapeParam) return undefined

    const scrollTimer = window.setTimeout(() => {
      document.getElementById('diamonds-grid')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 300)

    return () => window.clearTimeout(scrollTimer)
  }, [shapeParam])

  const fetchDiamonds = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('Diamond')
        .select('*')
        .eq('isAvailable', true)

      console.log('RAW DATA:', data)
      console.log('RAW ERROR:', fetchError)
      console.log('COUNT:', data?.length)

      if (fetchError) {
        console.error('SUPABASE ERROR:', fetchError)
        setDiamonds([])
        setError('Could not load diamonds')
      } else {
        setDiamonds((data || []).map((row, index) => mapDiamond(row as DiamondRow, index)))
      }
    } catch (caught) {
      console.error('CATCH ERROR:', caught)
      setDiamonds([])
      setError('Could not load diamonds')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchDiamonds()
  }, [fetchDiamonds])

  const filterDiamonds = useCallback((omit?: 'shape' | 'color' | 'clarity' | 'cut') => {
    return diamonds.filter((diamond) => {
      if (omit !== 'shape' && selectedShape !== 'All' && diamond.shape !== selectedShape) return false
      if (omit !== 'color' && selectedColor !== 'All' && diamond.color !== selectedColor) return false
      if (omit !== 'clarity' && selectedClarity !== 'All' && diamond.clarity !== selectedClarity) return false
      if (omit !== 'cut' && selectedCut !== 'All' && diamond.cut !== selectedCut) return false
      if (diamond.carat < caratRange[0] || diamond.carat > caratRange[1]) return false
      if (diamond.price < priceRange[0] || diamond.price > priceRange[1]) return false
      return true
    })
  }, [caratRange, diamonds, priceRange, selectedClarity, selectedColor, selectedCut, selectedShape])

  const filtered = useMemo(() => {
    return filterDiamonds().sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price
      if (sortBy === 'price_high') return b.price - a.price
      if (sortBy === 'carat_high') return b.carat - a.carat
      if (sortBy === 'carat_low') return a.carat - b.carat
      return 0
    })
  }, [filterDiamonds, sortBy])

  const shapeBase = useMemo(() => filterDiamonds('shape'), [filterDiamonds])
  const colorBase = useMemo(() => filterDiamonds('color'), [filterDiamonds])
  const clarityBase = useMemo(() => filterDiamonds('clarity'), [filterDiamonds])
  const cutBase = useMemo(() => filterDiamonds('cut'), [filterDiamonds])
  const availableShapes = useMemo(() => uniqueOptions(shapeBase.map((diamond) => diamond.shape), SHAPE_ORDER), [shapeBase])
  const availableColors = useMemo(() => uniqueOptions(colorBase.map((diamond) => diamond.color), COLOR_ORDER), [colorBase])
  const availableClarities = useMemo(() => uniqueOptions(clarityBase.map((diamond) => diamond.clarity), CLARITY_ORDER), [clarityBase])
  const availableCuts = useMemo(() => uniqueOptions(cutBase.map((diamond) => diamond.cut), CUT_ORDER), [cutBase])
  const shapeCounts = useMemo(() => countValues(shapeBase, 'shape'), [shapeBase])
  const colorCounts = useMemo(() => countValues(colorBase, 'color'), [colorBase])
  const clarityCounts = useMemo(() => countValues(clarityBase, 'clarity'), [clarityBase])
  const cutCounts = useMemo(() => countValues(cutBase, 'cut'), [cutBase])

  useEffect(() => {
    if (selectedShape !== 'All' && diamonds.length && !availableShapes.includes(selectedShape)) setSelectedShape('All')
    if (selectedColor !== 'All' && diamonds.length && !availableColors.includes(selectedColor)) setSelectedColor('All')
    if (selectedClarity !== 'All' && diamonds.length && !availableClarities.includes(selectedClarity)) setSelectedClarity('All')
    if (selectedCut !== 'All' && diamonds.length && !availableCuts.includes(selectedCut)) setSelectedCut('All')
  }, [availableClarities, availableColors, availableCuts, availableShapes, diamonds.length, selectedClarity, selectedColor, selectedCut, selectedShape])

  return (
    <div style={{ background: '#FBF5F0', minHeight: '100vh' }}>
      <style jsx global>{`
        @media (max-width: 900px) {
          .diamond-page-shell { grid-template-columns: 1fr !important; }
          .diamond-path-grid { grid-template-columns: 1fr !important; }
          .diamond-sidebar { position: static !important; border-right: none !important; border-bottom: 0.5px solid #EDD9AF !important; }
          .diamond-toolbar { align-items: flex-start !important; flex-direction: column !important; }
          .diamond-modal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <header className="diamond-hero" style={{ background: '#1A1014', padding: '64px 24px 48px', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#C9A961', marginBottom: '14px', fontFamily: 'var(--font-jost)', fontWeight: 500 }}>
          LAB-GROWN DIAMONDS
        </div>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(2rem,4vw,5rem)', fontWeight: 400, color: '#FBF5F0', lineHeight: 1.05, margin: '0 auto 8px', maxWidth: '340px', overflowWrap: 'anywhere' }}>
          Find your perfect <span style={{ display: 'block', fontStyle: 'italic', color: '#C9A961' }}>diamond.</span>
        </h1>
        <p style={{ fontSize: '17px', color: 'rgba(184,160,144,0.8)', maxWidth: '520px', margin: '0 auto 32px', lineHeight: 1.8, fontFamily: 'var(--font-jost)', fontWeight: 300 }}>
          Every diamond IGI certified. Same fire, same brilliance as mined, grown sustainably in our solar foundry.
        </p>
        <div
          className="diamond-shape-filter-bar scrollbar-hide"
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            maxWidth: '900px',
            margin: '0 auto',
          }}
        >
          {['All', ...availableShapes].map((shape) => (
            <button
              key={shape}
              onClick={() => setSelectedShape(shape)}
              style={{
                padding: '8px 16px',
                background: selectedShape === shape ? '#C9A961' : 'rgba(251,245,240,0.06)',
                border: `0.5px solid ${selectedShape === shape ? '#C9A961' : 'rgba(201,169,97,0.25)'}`,
                color: selectedShape === shape ? '#1A1014' : 'rgba(251,245,240,0.7)',
                fontSize: '11px',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                fontFamily: 'var(--font-inter)',
                transition: 'all 0.2s',
                borderRadius: '2px',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {shape === 'All' ? `ALL (${shapeBase.length})` : `${shape.toUpperCase()} (${shapeCounts[shape] || 0})`}
            </button>
          ))}
        </div>
      </header>

      <section style={{ background: '#FBF5F0', borderBottom: '0.5px solid #EDD9AF', padding: '28px 24px' }}>
        <div className="diamond-path-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '1120px', margin: '0 auto' }}>
          <a href="#diamonds-grid" style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', color: '#1A1014', display: 'block', padding: '24px', textDecoration: 'none' }}>
            <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.28em', marginBottom: '10px' }}>
              OPTION ONE
            </div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 400, lineHeight: 1.15, margin: '0 0 10px' }}>
              Buy a loose diamond
            </h2>
            <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '15px', lineHeight: 1.625, margin: 0 }}>
              Choose a certified diamond and add it to cart by itself.
            </p>
          </a>

          <Link href="/build" style={{ background: '#1A1014', border: '0.5px solid #EDD9AF', color: '#FBF5F0', display: 'block', padding: '24px', textDecoration: 'none' }}>
            <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.28em', marginBottom: '10px' }}>
              OPTION TWO
            </div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 400, lineHeight: 1.15, margin: '0 0 10px' }}>
              Build a ring
            </h2>
            <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '15px', lineHeight: 1.625, margin: 0 }}>
              Start with a center stone, then pair it with a setting.
            </p>
          </Link>
        </div>
      </section>

      <div className="diamond-page-shell" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', maxWidth: '1500px', margin: '0 auto', minHeight: '80vh' }}>
        <aside className="diamond-sidebar" style={{ background: '#FBF5F0', borderRight: '0.5px solid #EDD9AF', padding: '32px 24px', position: 'sticky', top: '72px', height: 'fit-content' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.25em', color: '#C9A961', marginBottom: '24px', fontFamily: 'var(--font-inter)' }}>FILTERS</div>

          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '11px', color: '#1A1014', fontWeight: 500, marginBottom: '12px', fontFamily: 'var(--font-inter)', letterSpacing: '0.05em' }}>CARAT WEIGHT</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="number" value={caratRange[0]} min={0.5} max={15} step={0.1} onChange={(event) => setCaratRange([parseNumber(event.target.value, 0.5), caratRange[1]])} style={{ ...inputStyle, width: '80px' }} />
              <span style={{ color: 'var(--color-muted-text)', fontSize: '12px' }}>-</span>
              <input type="number" value={caratRange[1]} min={0.5} max={15} step={0.1} onChange={(event) => setCaratRange([caratRange[0], parseNumber(event.target.value, 15)])} style={{ ...inputStyle, width: '80px' }} />
              <span style={{ fontSize: '12px', color: 'var(--color-muted-text)' }}>ct</span>
            </div>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '11px', color: '#1A1014', fontWeight: 500, marginBottom: '12px', fontFamily: 'var(--font-inter)', letterSpacing: '0.05em' }}>PRICE RANGE</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="number" value={priceRange[0]} min={0} step={100} onChange={(event) => setPriceRange([parseNumber(event.target.value, 0), priceRange[1]])} style={{ ...inputStyle, width: '90px' }} placeholder="Min" />
              <span style={{ color: 'var(--color-muted-text)', fontSize: '12px' }}>-</span>
              <input type="number" value={priceRange[1]} min={0} step={100} onChange={(event) => setPriceRange([priceRange[0], parseNumber(event.target.value, 100000)])} style={{ ...inputStyle, width: '90px' }} placeholder="Max" />
            </div>
          </div>

          {[
            ['COLOR', availableColors, selectedColor, setSelectedColor, colorCounts],
            ['CLARITY', availableClarities, selectedClarity, setSelectedClarity, clarityCounts],
            ['CUT', availableCuts, selectedCut, setSelectedCut, cutCounts],
          ].map(([label, options, selected, setSelected, counts]) => (
            <div key={label as string} style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '11px', color: '#1A1014', fontWeight: 500, marginBottom: '12px', fontFamily: 'var(--font-inter)', letterSpacing: '0.05em' }}>{label as string}</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['All', ...(options as string[])].map((option) => {
                  const selectedValue = selected as string
                  const updateSelected = setSelected as (value: string) => void
                  const active = selectedValue === option
                  const optionCount = option === 'All'
                    ? (options as string[]).reduce((total, value) => total + ((counts as Record<string, number>)[value] || 0), 0)
                    : (counts as Record<string, number>)[option] || 0
                  return (
                    <button
                      key={option}
                      onClick={() => updateSelected(option)}
                      style={{
                        minWidth: label === 'COLOR' ? '36px' : undefined,
                        height: label === 'COLOR' ? '36px' : undefined,
                        padding: label === 'COLOR' ? '0' : '6px 10px',
                        border: `1.5px solid ${active ? '#1A1014' : '#EDD9AF'}`,
                        background: active ? '#1A1014' : '#FDF8F2',
                        color: active ? '#FBF5F0' : '#1A1014',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-inter)',
                        transition: 'all 0.2s',
                        borderRadius: '2px',
                      }}
                    >
                      {option} ({optionCount})
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              setSelectedShape('All')
              setSelectedColor('All')
              setSelectedClarity('All')
              setSelectedCut('All')
              setCaratRange([0.5, 15])
              setPriceRange([0, 100000])
            }}
            style={{ width: '100%', padding: '10px', background: 'transparent', border: '0.5px solid #EDD9AF', color: 'var(--color-muted-text)', fontSize: '11px', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}
          >
            CLEAR ALL FILTERS
          </button>
        </aside>

        <main id="diamonds-grid" style={{ padding: '32px' }}>
          <div className="diamond-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '28px', paddingBottom: '20px', borderBottom: '0.5px solid #EDD9AF' }}>
            <div style={{ fontSize: '14px', color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)' }}>
              Showing <span style={{ color: '#C9A961', fontWeight: 500 }}>{loading ? '...' : filtered.length}</span> of {diamonds.length} diamonds
            </div>
            <div className="diamond-sort-bar scrollbar-hide" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)' }}>SORT:</span>
              {[
                ['price_low', 'Price: Low'],
                ['price_high', 'Price: High'],
                ['carat_high', 'Carat: High'],
                ['carat_low', 'Carat: Low'],
              ].map(([value, label]) => (
                <button key={value} onClick={() => setSortBy(value)} style={{ padding: '6px 14px', background: sortBy === value ? '#1A1014' : 'transparent', border: `0.5px solid ${sortBy === value ? '#1A1014' : '#EDD9AF'}`, color: sortBy === value ? '#FBF5F0' : 'var(--color-muted-text)', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-inter)', borderRadius: '2px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {label}
                </button>
              ))}
              {(['grid', 'list'] as const).map((mode) => (
                <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: '6px 10px', background: viewMode === mode ? '#C9A961' : 'transparent', border: '0.5px solid #EDD9AF', color: viewMode === mode ? '#1A1014' : 'var(--color-muted-text)', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-inter)', borderRadius: '2px' }}>
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {selectedShape !== 'All' && shapeParam ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                background: 'rgba(201,169,97,0.08)',
                border: '0.5px solid rgba(201,169,97,0.3)',
                padding: '12px 16px',
                marginBottom: '20px',
                borderRadius: '2px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: '#1A1014',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                Showing <strong>{filtered.length}</strong> {selectedShape} cut diamonds
              </div>
              <button
                onClick={() => setSelectedShape('All')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '11px',
                  color: '#C9A961',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-inter)',
                  letterSpacing: '0.1em',
                  whiteSpace: 'nowrap',
                }}
              >
                CLEAR FILTER ×
              </button>
            </div>
          ) : null}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', gap: '16px' }}>
              <div style={{ fontSize: '32px', color: '#C9A961', animation: 'pulse 1.2s ease infinite' }}>*</div>
              <div style={{ fontSize: '12px', letterSpacing: '0.25em', color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)' }}>
                LOADING DIAMONDS...
              </div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#A85C6A', fontFamily: 'var(--font-inter)' }}>
              <div style={{ marginBottom: '12px' }}>
                Could not load diamonds
              </div>
              <button
                onClick={() => void fetchDiamonds()}
                style={{
                  padding: '10px 24px',
                  background: '#1A1014',
                  color: '#FBF5F0',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                TRY AGAIN
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 40px' }}>
              <div style={{ fontSize: '48px', color: '#EDD9AF', marginBottom: '16px' }}>
                &#9671;
              </div>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', color: '#1A1014', marginBottom: '8px' }}>
                No diamonds found
              </div>
              <div style={{ fontSize: '15px', color: 'var(--color-muted-text)', marginBottom: '24px', fontFamily: 'var(--font-inter)' }}>
                Try adjusting your filters
              </div>
              <button
                onClick={() => {
                  setSelectedShape('All')
                  setSelectedColor('All')
                  setSelectedClarity('All')
                  setSelectedCut('All')
                  setCaratRange([0.5, 15])
                  setPriceRange([0, 100000])
                  setSortBy('price_low')
                }}
                style={{
                  padding: '12px 28px',
                  background: '#1A1014',
                  color: '#FBF5F0',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  letterSpacing: '0.2em',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                CLEAR ALL FILTERS
              </button>
            </div>
          ) : (
            <div className="diamonds-grid" style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(220px, 1fr))' : '1fr', gap: '16px' }}>
              {filtered.map((diamond) => (
                <button
                  key={diamond.id}
                  className="diamond-card"
                  onClick={() => setSelectedDiamond(diamond)}
                  style={{
                    background: '#FDF8F2',
                    border: '0.5px solid rgba(237,217,175,0.75)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 14px rgba(26,16,20,0.05)',
                    cursor: 'pointer',
                    display: viewMode === 'grid' ? 'block' : 'grid',
                    gridTemplateColumns: viewMode === 'grid' ? undefined : '190px 1fr',
                    overflow: 'hidden',
                    textAlign: 'left',
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                  }}
                >
                  <div style={{ alignItems: 'center', background: '#FBF5F0', borderBottom: '0.5px solid rgba(237,217,175,0.7)', display: 'flex', height: '192px', justifyContent: 'center', overflow: 'hidden', padding: '24px', position: 'relative' }}>
                    <Image src={diamond.img} alt={`${diamond.carat}ct ${diamond.shape}`} fill style={{ objectFit: 'contain', padding: '24px' }} sizes={viewMode === 'grid' ? '220px' : '190px'} quality={90} />
                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(237,217,175,0.45)', color: '#C9A961', fontSize: '10px', padding: '3px 8px', letterSpacing: '0.12em', fontFamily: 'var(--font-inter)', fontWeight: 500, borderRadius: '4px' }}>
                      IGI
                    </div>
                  </div>
                  <div style={{ background: '#FDF8F2', padding: '16px' }}>
                    <div style={{ color: '#1A1014', fontFamily: 'var(--font-jost)', fontSize: '15px', fontWeight: 500, letterSpacing: '0.12em', marginBottom: '6px', textTransform: 'uppercase' }}>
                      {diamond.shape}
                    </div>
                    <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', color: '#1A1014', fontWeight: 500, marginBottom: '6px' }}>
                      {diamond.carat}ct
                    </div>
                    <div style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-jost)', fontSize: '15px', marginBottom: '14px' }}>
                      {diamond.color} color - {diamond.clarity} clarity - {diamond.cut}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-jost)', fontSize: '17px', color: '#C9A961', fontWeight: 500 }}>${diamond.price.toLocaleString()}</div>
                        <div style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-jost)', fontSize: '15px' }}>
                          ${Math.round((diamond.price || 0) / (diamond.carat || 1)).toLocaleString()}/ct
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#C9A961', fontFamily: 'var(--font-jost)', fontWeight: 600, letterSpacing: '0.1em' }}>VIEW -</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      {selectedDiamond ? (
        <DiamondModal
          diamond={selectedDiamond}
          onClose={() => setSelectedDiamond(null)}
          onChoose={(customDiamond) => {
            setSelectedDiamond(null)
            window.localStorage.setItem('builder_diamond', JSON.stringify(customDiamond))
            const params = new URLSearchParams({
              step: '2',
              diamond: customDiamond.id,
              carat: customDiamond.carat.toString(),
              color: customDiamond.color,
              clarity: customDiamond.clarity,
              price: customDiamond.price.toString(),
              shape: customDiamond.shape,
            })
            router.push(`/build?${params.toString()}`)
          }}
        />
      ) : null}
    </div>
  )
}

export default function DiamondsPage() {
  return (
    <Suspense fallback={<DiamondsLoadingFallback />}>
      <DiamondsContent />
    </Suspense>
  )
}

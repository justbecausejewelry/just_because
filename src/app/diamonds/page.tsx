'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import type { CSSProperties, SetStateAction } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { ALL_DIAMONDS, Diamond, SHAPE_DATA } from '@/lib/diamondCatalog'
import { supabase as supabaseAdmin } from '@/lib/supabase'

type DiamondRow = {
  id?: string | number | null
  shape?: string | null
  caratWeight?: number | string | null
  carat?: number | string | null
  color?: string | null
  clarity?: string | null
  cut?: string | null
  price?: number | string | null
  images?: string[] | string | null
  imageUrl?: string | null
  depth?: number | string | null
  table?: number | string | null
  depthPercent?: number | string | null
  tablePercent?: number | string | null
  measurements?: string | null
  igi?: string | null
  certificateNumber?: string | null
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

function parseNumber(value: string, fallback: number) {
  const nextValue = Number(value)
  return Number.isFinite(nextValue) ? nextValue : fallback
}

function firstImage(images: DiamondRow['images'], imageUrl?: string | null) {
  if (Array.isArray(images) && typeof images[0] === 'string') {
    return images[0]
  }

  if (typeof images === 'string' && images.trim()) {
    try {
      const parsed = JSON.parse(images) as unknown
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
        return parsed[0]
      }
    } catch {
      return images
    }
  }

  return imageUrl || ''
}

function mapDiamond(row: DiamondRow, index: number): Diamond {
  const shape = row.shape || 'Round'
  const carat = Number(row.caratWeight ?? row.carat ?? 1)
  const price = Number(row.price ?? 0)
  const fallback = ALL_DIAMONDS[index % ALL_DIAMONDS.length]
  const shapeImage = SHAPE_DATA.find((item) => item.name === shape)?.img || fallback.img

  return {
    id: String(row.id || fallback.id),
    shape,
    carat: Number.isFinite(carat) && carat > 0 ? carat : fallback.carat,
    color: row.color || fallback.color,
    clarity: row.clarity || fallback.clarity,
    cut: row.cut || fallback.cut,
    price: Number.isFinite(price) && price > 0 ? price : fallback.price,
    depth: String(row.depthPercent || row.depth || fallback.depth),
    table: String(row.tablePercent || row.table || fallback.table),
    measurements: row.measurements || fallback.measurements,
    igi: row.igi || row.certificateNumber || row.reportNumber || fallback.igi,
    img: firstImage(row.images, row.imageUrl) || shapeImage,
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
  }
  const clarityMultiplier: Record<string, number> = {
    IF: 1.65,
    VVS1: 1.45,
    VVS2: 1.3,
    VS1: 1.15,
    VS2: 1.0,
    SI1: 0.85,
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
  return 'Slightly tinted'
}

function clarityDescription(clarity: string) {
  if (clarity === 'IF') return 'Internally Flawless'
  if (clarity === 'VVS1') return 'Very Very Slightly Included'
  if (clarity === 'VVS2') return 'Very Very Slight'
  if (clarity === 'VS1') return 'Very Slightly Included'
  if (clarity === 'VS2') return 'Very Slight'
  return 'Slightly Included'
}

function formatShapeParam(shape: string) {
  return shape
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
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
  const { addItem } = useCart()
  const { showToast } = useToast()
  const [customCarat, setCustomCarat] = useState(diamond.carat || 1)
  const [customColor, setCustomColor] = useState(diamond.color || 'G')
  const [customClarity, setCustomClarity] = useState(diamond.clarity || 'VS1')

  useEffect(() => {
    setCustomCarat(diamond.carat || 1)
    setCustomColor(diamond.color || 'G')
    setCustomClarity(diamond.clarity || 'VS1')
  }, [diamond])

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
      selectedMetal: 'Loose diamond',
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
    onClose()
    showToast('Diamond added to cart -', 'success')
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
            color: '#B8A090',
            zIndex: 10,
            fontSize: '20px',
          }}
        >
          x
        </button>

        <div>
          <div style={{ aspectRatio: '1', position: 'relative', overflow: 'hidden' }}>
            <Image src={diamond.img} alt={diamond.shape} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 450px" quality={90} />
          </div>
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
                }}
              >
                {item === 0 ? (
                  <svg viewBox="0 0 100 100" width="80" height="80">
                    <rect x="15" y="20" width="70" height="60" rx="2" fill="none" stroke="#C9A961" strokeWidth="1" />
                    <line x1="15" y1="20" x2="50" y2="5" stroke="#C9A961" strokeWidth="0.8" />
                    <line x1="85" y1="20" x2="50" y2="5" stroke="#C9A961" strokeWidth="0.8" />
                    <line x1="15" y1="80" x2="50" y2="95" stroke="#C9A961" strokeWidth="0.8" />
                    <line x1="85" y1="80" x2="50" y2="95" stroke="#C9A961" strokeWidth="0.8" />
                    <line x1="15" y1="20" x2="15" y2="80" stroke="#C9A961" strokeWidth="0.8" />
                    <line x1="85" y1="20" x2="85" y2="80" stroke="#C9A961" strokeWidth="0.8" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 100 80" width="80" height="60">
                    <polygon points="50,5 90,35 50,75 10,35" fill="none" stroke="#C9A961" strokeWidth="1" />
                    <line x1="10" y1="35" x2="90" y2="35" stroke="#C9A961" strokeWidth="0.5" strokeDasharray="3,2" />
                    <line x1="50" y1="5" x2="50" y2="75" stroke="#C9A961" strokeWidth="0.5" strokeDasharray="3,2" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '40px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#C9A961', marginBottom: '8px', fontFamily: 'var(--font-inter)' }}>
            LAB-GROWN DIAMOND - {diamond.id}
          </div>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 400, color: '#1A1014', marginBottom: '24px', lineHeight: 1.2 }}>
            {diamond.carat} Carat {diamond.shape}
            <br />
            <span style={{ fontSize: '18px', color: '#B8A090' }}>Lab Grown Diamond</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: '#EDD9AF', border: '0.5px solid #EDD9AF', marginBottom: '24px' }}>
            {[
              ['CARAT', customCarat.toFixed(2)],
              ['COLOR', customColor],
              ['CLARITY', customClarity],
              ['CUT', diamond.cut],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#FBF5F0', padding: '14px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#B8A090', marginBottom: '6px', fontFamily: 'var(--font-inter)' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', color: '#1A1014' }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.25em', color: '#C9A961', marginBottom: '16px', fontFamily: 'var(--font-inter)' }}>
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
                      color: Math.abs(customCarat - carat) < 0.05 ? '#C9A961' : '#B8A090',
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
                <span style={{ fontSize: '11px', color: '#B8A090', fontFamily: 'var(--font-inter)' }}>{colorDescription(customColor)}</span>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#B8A090', fontFamily: 'var(--font-inter)', letterSpacing: '0.05em' }}>
                <span>&lt;- COLORLESS</span>
                <span>NEAR COLORLESS -&gt;</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>Clarity</span>
                <span style={{ fontSize: '11px', color: '#B8A090', fontFamily: 'var(--font-inter)' }}>{clarityDescription(customClarity)}</span>
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
                <div style={{ fontSize: '10px', color: '#B8A090', letterSpacing: '0.2em', fontFamily: 'var(--font-inter)', marginBottom: '4px' }}>YOUR DIAMOND PRICE</div>
                <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '36px', color: '#1A1014', lineHeight: 1, transition: 'all 0.3s' }}>${customPrice.toLocaleString()}</div>
                <div style={{ fontSize: '11px', color: '#B8A090', fontFamily: 'var(--font-inter)', marginTop: '4px' }}>
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
              ['Table', `${diamond.table}%`],
              ['Depth', `${diamond.depth}%`],
              ['IGI Report', diamond.igi],
            ].map(([label, value], index) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '8px 0', borderBottom: index < 3 ? '0.5px solid #EDD9AF' : 'none', fontSize: '13px', fontFamily: 'var(--font-inter)' }}>
                <span style={{ color: '#B8A090' }}>{label}</span>
                <span style={{ color: '#1A1014', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#FDF8F2', border: '0.5px solid #EDD9AF', marginBottom: '24px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1A1014', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '9px', color: '#C9A961', fontWeight: 500, letterSpacing: '0.05em' }}>IGI</span>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#1A1014', fontWeight: 500, fontFamily: 'var(--font-inter)' }}>IGI Certified</div>
              <div style={{ fontSize: '11px', color: '#B8A090', fontFamily: 'var(--font-inter)' }}>View certificate - prototype</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button onClick={() => onChoose(customDiamond)} style={{ flex: 1, padding: '16px', background: '#1A1014', color: '#FBF5F0', border: 'none', fontSize: '11px', letterSpacing: '0.18em', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              CHOOSE THIS DIAMOND
            </button>
            <button onClick={() => void addLooseDiamond()} style={{ padding: '16px 20px', background: 'transparent', border: '0.5px solid #EDD9AF', color: '#1A1014', fontSize: '11px', letterSpacing: '0.18em', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              ADD TO CART
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DiamondsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const shapeParam = searchParams.get('shape')
  const [diamonds, setDiamonds] = useState<Diamond[]>(ALL_DIAMONDS)
  const [loading, setLoading] = useState(true)
  const [selectedShape, setSelectedShape] = useState(() => (shapeParam ? formatShapeParam(shapeParam) : 'All'))
  const [selectedColor, setSelectedColor] = useState<string[]>([])
  const [selectedClarity, setSelectedClarity] = useState<string[]>([])
  const [caratRange, setCaratRange] = useState<[number, number]>([0.5, 5])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [sortBy, setSortBy] = useState('price_low')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedDiamond, setSelectedDiamond] = useState<Diamond | null>(null)

  useEffect(() => {
    if (!shapeParam) return undefined

    const formatted = formatShapeParam(shapeParam)
    setSelectedShape(formatted)
    const scrollTimer = window.setTimeout(() => {
      document.getElementById('diamonds-grid')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 300)

    return () => window.clearTimeout(scrollTimer)
  }, [shapeParam])

  useEffect(() => {
    const fetchDiamonds = async () => {
      const { data, error } = await supabaseAdmin
        .from('Diamond')
        .select('*')
        .order('price', { ascending: true })

      if (!error && data && data.length > 0) {
        setDiamonds((data as DiamondRow[]).map(mapDiamond))
      } else {
        try {
          const response = await fetch('/api/admin/diamonds')
          const payload = (await response.json()) as { diamonds?: DiamondRow[] }
          if (response.ok && payload.diamonds?.length) {
            setDiamonds(payload.diamonds.map(mapDiamond))
          } else {
            setDiamonds(ALL_DIAMONDS)
          }
        } catch {
          setDiamonds(ALL_DIAMONDS)
        }
      }
      setLoading(false)
    }

    void fetchDiamonds()
  }, [])

  const filtered = useMemo(() => {
    return diamonds.filter((diamond) => {
      if (selectedShape !== 'All' && diamond.shape !== selectedShape) return false
      if (selectedColor.length && !selectedColor.includes(diamond.color)) return false
      if (selectedClarity.length && !selectedClarity.includes(diamond.clarity)) return false
      if (diamond.carat < caratRange[0] || diamond.carat > caratRange[1]) return false
      if (diamond.price < priceRange[0] || diamond.price > priceRange[1]) return false
      return true
    }).sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price
      if (sortBy === 'price_high') return b.price - a.price
      if (sortBy === 'carat_high') return b.carat - a.carat
      if (sortBy === 'carat_low') return a.carat - b.carat
      return 0
    })
  }, [caratRange, diamonds, priceRange, selectedClarity, selectedColor, selectedShape, sortBy])

  return (
    <div style={{ background: '#FBF5F0', minHeight: '100vh' }}>
      <style jsx global>{`
        @media (max-width: 900px) {
          .diamond-page-shell { grid-template-columns: 1fr !important; }
          .diamond-sidebar { position: static !important; border-right: none !important; border-bottom: 0.5px solid #EDD9AF !important; }
          .diamond-toolbar { align-items: flex-start !important; flex-direction: column !important; }
          .diamond-modal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <header style={{ background: '#1A1014', padding: '64px 24px 48px', textAlign: 'center' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.35em', color: '#C9A961', marginBottom: '14px', fontFamily: 'var(--font-inter)' }}>
          LAB-GROWN DIAMONDS
        </div>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 400, color: '#FBF5F0', marginBottom: '8px' }}>
          Find your perfect <span style={{ fontStyle: 'italic', color: '#C9A961' }}>diamond.</span>
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(184,160,144,0.8)', maxWidth: '480px', margin: '0 auto 32px', lineHeight: 1.8, fontFamily: 'var(--font-inter)' }}>
          Every diamond IGI certified. Same fire, same brilliance as mined, grown sustainably in our solar foundry.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '900px', margin: '0 auto' }}>
          {['All', ...SHAPE_DATA.map((shape) => shape.name)].map((shape) => (
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
              }}
            >
              {shape.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="diamond-page-shell" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', maxWidth: '1500px', margin: '0 auto', minHeight: '80vh' }}>
        <aside className="diamond-sidebar" style={{ background: '#FBF5F0', borderRight: '0.5px solid #EDD9AF', padding: '32px 24px', position: 'sticky', top: '72px', height: 'fit-content' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.25em', color: '#C9A961', marginBottom: '24px', fontFamily: 'var(--font-inter)' }}>FILTERS</div>

          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '11px', color: '#1A1014', fontWeight: 500, marginBottom: '12px', fontFamily: 'var(--font-inter)', letterSpacing: '0.05em' }}>CARAT WEIGHT</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="number" value={caratRange[0]} min={0.5} max={5} step={0.1} onChange={(event) => setCaratRange([parseNumber(event.target.value, 0.5), caratRange[1]])} style={{ ...inputStyle, width: '80px' }} />
              <span style={{ color: '#B8A090', fontSize: '12px' }}>-</span>
              <input type="number" value={caratRange[1]} min={0.5} max={10} step={0.1} onChange={(event) => setCaratRange([caratRange[0], parseNumber(event.target.value, 5)])} style={{ ...inputStyle, width: '80px' }} />
              <span style={{ fontSize: '11px', color: '#B8A090' }}>ct</span>
            </div>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '11px', color: '#1A1014', fontWeight: 500, marginBottom: '12px', fontFamily: 'var(--font-inter)', letterSpacing: '0.05em' }}>PRICE RANGE</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="number" value={priceRange[0]} min={0} step={100} onChange={(event) => setPriceRange([parseNumber(event.target.value, 0), priceRange[1]])} style={{ ...inputStyle, width: '90px' }} placeholder="Min" />
              <span style={{ color: '#B8A090', fontSize: '12px' }}>-</span>
              <input type="number" value={priceRange[1]} min={0} step={100} onChange={(event) => setPriceRange([priceRange[0], parseNumber(event.target.value, 10000)])} style={{ ...inputStyle, width: '90px' }} placeholder="Max" />
            </div>
          </div>

          {[
            ['COLOR', ['D', 'E', 'F', 'G', 'H', 'I'], selectedColor, setSelectedColor],
            ['CLARITY', ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1'], selectedClarity, setSelectedClarity],
          ].map(([label, options, selected, setSelected]) => (
            <div key={label as string} style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '11px', color: '#1A1014', fontWeight: 500, marginBottom: '12px', fontFamily: 'var(--font-inter)', letterSpacing: '0.05em' }}>{label as string}</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(options as string[]).map((option) => {
                  const selectedItems = selected as string[]
                  const updateSelected = setSelected as (value: SetStateAction<string[]>) => void
                  const active = selectedItems.includes(option)
                  return (
                    <button
                      key={option}
                      onClick={() => updateSelected((prev) => (prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]))}
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
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              setSelectedShape('All')
              setSelectedColor([])
              setSelectedClarity([])
              setCaratRange([0.5, 5])
              setPriceRange([0, 10000])
            }}
            style={{ width: '100%', padding: '10px', background: 'transparent', border: '0.5px solid #EDD9AF', color: '#B8A090', fontSize: '11px', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}
          >
            CLEAR ALL FILTERS
          </button>
        </aside>

        <main id="diamonds-grid" style={{ padding: '32px' }}>
          <div className="diamond-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '28px', paddingBottom: '20px', borderBottom: '0.5px solid #EDD9AF' }}>
            <div style={{ fontSize: '13px', color: '#B8A090', fontFamily: 'var(--font-inter)' }}>
              <span style={{ color: '#C9A961', fontWeight: 500 }}>{loading ? '...' : filtered.length}</span> diamonds found
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#B8A090', fontFamily: 'var(--font-inter)' }}>SORT:</span>
              {[
                ['price_low', 'Price: Low'],
                ['price_high', 'Price: High'],
                ['carat_high', 'Carat: High'],
                ['carat_low', 'Carat: Low'],
              ].map(([value, label]) => (
                <button key={value} onClick={() => setSortBy(value)} style={{ padding: '6px 14px', background: sortBy === value ? '#1A1014' : 'transparent', border: `0.5px solid ${sortBy === value ? '#1A1014' : '#EDD9AF'}`, color: sortBy === value ? '#FBF5F0' : '#B8A090', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-inter)', borderRadius: '2px' }}>
                  {label}
                </button>
              ))}
              {(['grid', 'list'] as const).map((mode) => (
                <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: '6px 10px', background: viewMode === mode ? '#C9A961' : 'transparent', border: '0.5px solid #EDD9AF', color: viewMode === mode ? '#1A1014' : '#B8A090', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-inter)', borderRadius: '2px' }}>
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
            <div style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', padding: '40px 0' }}>Loading diamonds...</div>
          ) : (
          <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(220px, 1fr))' : '1fr', gap: '16px' }}>
            {filtered.map((diamond) => (
              <button
                key={diamond.id}
                onClick={() => setSelectedDiamond(diamond)}
                style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s ease', borderRadius: '2px', textAlign: 'left', display: viewMode === 'grid' ? 'block' : 'grid', gridTemplateColumns: viewMode === 'grid' ? undefined : '180px 1fr' }}
              >
                <div style={{ aspectRatio: '1', position: 'relative', overflow: 'hidden', background: '#F5E8ED' }}>
                  <Image src={diamond.img} alt={`${diamond.carat}ct ${diamond.shape}`} fill style={{ objectFit: 'cover' }} sizes={viewMode === 'grid' ? '220px' : '180px'} quality={90} />
                  <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(26,16,20,0.85)', color: '#C9A961', fontSize: '8px', padding: '3px 7px', letterSpacing: '0.15em', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
                    IGI
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '15px', color: '#1A1014', marginBottom: '6px' }}>
                    {diamond.carat}ct {diamond.shape}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {[diamond.color, diamond.clarity, diamond.cut].map((spec) => (
                      <span key={spec} style={{ padding: '2px 7px', background: '#FBF5F0', border: '0.5px solid #EDD9AF', fontSize: '10px', color: '#B8A090', fontFamily: 'var(--font-inter)', borderRadius: '2px' }}>{spec}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', color: '#1A1014' }}>${diamond.price.toLocaleString()}</div>
                    <div style={{ fontSize: '10px', color: '#C9A961', fontFamily: 'var(--font-inter)', letterSpacing: '0.1em' }}>VIEW -</div>
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
            const params = new URLSearchParams({
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
    <Suspense fallback={<div style={{ height: '100vh', background: '#FBF5F0' }} />}>
      <DiamondsContent />
    </Suspense>
  )
}

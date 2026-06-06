'use client'

import { CSSProperties, Suspense, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { ALL_DIAMONDS, Diamond, SHAPE_DATA } from '@/lib/diamondCatalog'
import { supabase } from '@/lib/supabase'

type RingProduct = {
  id: string
  slug: string
  title: string
  category: string
  productType: string
  basePrice: number
  images: string[]
  metalImages?: {
    white_gold?: string[]
    yellow_gold?: string[]
    rose_gold?: string[]
    platinum?: string[]
  } | null
  availableMetals?: string[]
  availableSizes?: string[]
}

type ProductListResponse = {
  products?: RingProduct[]
}

const metalOptions = [
  ['14k_white_gold', '14K White Gold', 'white_gold'],
  ['14k_yellow_gold', '14K Yellow Gold', 'yellow_gold'],
  ['14k_rose_gold', '14K Rose Gold', 'rose_gold'],
  ['platinum', 'Platinum', 'platinum'],
] as const

const ringSizes = ['4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9']

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function imageForRing(ring: RingProduct, metal: string) {
  const metalKey = metalOptions.find(([value]) => value === metal)?.[2] || 'white_gold'
  return ring.metalImages?.[metalKey]?.[0] || ring.images?.[0] || ''
}

function isRingProduct(product: RingProduct) {
  const productType = product.productType?.toLowerCase() || ''
  const category = product.category?.toLowerCase() || ''

  return (
    ['engagement_ring', 'wedding_ring', 'ring', 'solitaire'].includes(productType) ||
    productType.includes('ring') ||
    category.includes('ring') ||
    category.includes('solitaire') ||
    category.includes('halo') ||
    category.includes('pave')
  )
}

function ringProductsOrAll(products: RingProduct[]) {
  const ringMatches = products.filter(isRingProduct)
  return ringMatches.length > 0 ? ringMatches : products
}

function isStoredDiamond(value: unknown): value is Diamond {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.shape === 'string' &&
    typeof candidate.carat === 'number' &&
    typeof candidate.color === 'string' &&
    typeof candidate.clarity === 'string' &&
    typeof candidate.cut === 'string' &&
    typeof candidate.price === 'number' &&
    typeof candidate.img === 'string'
  )
}

function diamondFromParams(searchParams: URLSearchParams): Diamond | null {
  const requestedDiamond = searchParams.get('diamond')
  if (!requestedDiamond) return null

  const catalogDiamond = ALL_DIAMONDS.find((item) => item.id === requestedDiamond)
  const carat = Number(searchParams.get('carat'))
  const price = Number(searchParams.get('price'))
  const shape = searchParams.get('shape') || catalogDiamond?.shape || 'Round'
  const shapeImage = SHAPE_DATA.find((item) => item.name === shape)?.img || SHAPE_DATA[0].img

  return {
    id: requestedDiamond,
    shape,
    carat: Number.isFinite(carat) && carat > 0 ? carat : catalogDiamond?.carat || 1,
    color: searchParams.get('color') || catalogDiamond?.color || 'G',
    clarity: searchParams.get('clarity') || catalogDiamond?.clarity || 'VS1',
    cut: catalogDiamond?.cut || 'Excellent',
    price: Number.isFinite(price) && price > 0 ? price : catalogDiamond?.price || 0,
    polish: catalogDiamond?.polish || 'Excellent',
    symmetry: catalogDiamond?.symmetry || 'Excellent',
    fluorescence: catalogDiamond?.fluorescence || 'None',
    depthPercent: catalogDiamond?.depthPercent || '62.0',
    tablePercent: catalogDiamond?.tablePercent || '58',
    measurements: catalogDiamond?.measurements || '6.50 x 6.50 x 4.00',
    certificateNumber: catalogDiamond?.certificateNumber || requestedDiamond,
    certificateType: catalogDiamond?.certificateType || 'IGI',
    certificateUrl: catalogDiamond?.certificateUrl || null,
    img: catalogDiamond?.img || shapeImage,
  }
}

function StepIndicator({ step }: { step: number }) {
  const steps = ['CHOOSE DIAMOND', 'CHOOSE SETTING', 'PREVIEW & ORDER']

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '34px 24px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'start', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '16%', right: '16%', top: '18px', height: '0.5px', background: '#EDD9AF' }} />
        {steps.map((label, index) => {
          const stepNumber = index + 1
          const complete = step > stepNumber
          const active = step === stepNumber

          return (
            <div key={label} style={{ display: 'grid', justifyItems: 'center', gap: '8px', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: active || complete ? '#C9A961' : '#FBF5F0',
                border: `0.5px solid ${active || complete ? '#C9A961' : '#EDD9AF'}`,
                color: active || complete ? '#1A1014' : '#B8A090',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: 500,
              }}>
                {complete ? '+' : stepNumber}
              </div>
              <div style={{ fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.18em', color: active ? '#1A1014' : '#B8A090', textAlign: 'center' }}>
                {label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DiamondCard({
  diamond,
  selected,
  onSelect,
}: {
  diamond: Diamond
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        background: '#FDF8F2',
        border: selected ? '1px solid #C9A961' : '0.5px solid #EDD9AF',
        borderRadius: '2px',
        cursor: 'pointer',
        overflow: 'hidden',
        textAlign: 'left',
      }}
    >
      <div style={{ aspectRatio: '1', background: '#FBF5F0', position: 'relative' }}>
        <Image src={diamond.img} alt={`${diamond.carat}ct ${diamond.shape}`} fill sizes="(max-width: 768px) 100vw, 240px" style={{ objectFit: 'contain', padding: '28px' }} quality={90} />
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.18em', marginBottom: '7px' }}>
          IGI CERTIFIED
        </div>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '19px', color: '#1A1014', marginBottom: '8px' }}>
          {diamond.carat}ct {diamond.shape}
        </div>
        <div style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', marginBottom: '13px' }}>
          {diamond.color} color - {diamond.clarity} clarity - {diamond.cut}
        </div>
        <div style={{ fontFamily: 'var(--font-playfair)', color: '#1A1014', fontSize: '23px' }}>
          {formatMoney(diamond.price)}
        </div>
      </div>
    </button>
  )
}

function BuildContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addItem } = useCart()
  const { showToast } = useToast()
  const [step, setStep] = useState(1)
  const [selectedDiamond, setSelectedDiamond] = useState<Diamond | null>(null)
  const [selectedSetting, setSelectedSetting] = useState<RingProduct | null>(null)
  const [selectedMetal, setSelectedMetal] = useState('14k_white_gold')
  const [selectedSize, setSelectedSize] = useState('')
  const [rings, setRings] = useState<RingProduct[]>([])
  const [loadingRings, setLoadingRings] = useState(true)
  const [selectedShape, setSelectedShape] = useState('All')

  useEffect(() => {
    const requestedDiamond = searchParams.get('diamond')
    const requestedStep = Number(searchParams.get('step'))
    let nextDiamond: Diamond | null = null

    if (requestedDiamond) {
      try {
        const storedValue = window.localStorage.getItem('builder_diamond')
        const parsedValue: unknown = storedValue ? JSON.parse(storedValue) : null
        if (isStoredDiamond(parsedValue) && parsedValue.id === requestedDiamond) {
          nextDiamond = parsedValue
        }
      } catch {
        nextDiamond = null
      }

      nextDiamond = nextDiamond || diamondFromParams(searchParams)
    }

    if (nextDiamond) {
      setSelectedDiamond(nextDiamond)
      setSelectedShape(nextDiamond.shape)
      setStep(requestedStep === 2 ? 2 : 1)
    }
  }, [searchParams])

  useEffect(() => {
    const loadRings = async () => {
      setLoadingRings(true)
      const { data, error } = await supabase
        .from('Product')
        .select('*')
        .eq('isActive', true)
        .or('productType.eq.engagement_ring,productType.eq.wedding_ring,productType.eq.ring')
        .order('isFeatured', { ascending: false })
        .order('basePrice', { ascending: true })

      let nextRings = !error && data ? (data as RingProduct[]) : []

      if (nextRings.length === 0) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('Product')
          .select('*')
          .eq('isActive', true)
          .order('basePrice', { ascending: true })

        const activeProducts = !fallbackError && fallbackData ? (fallbackData as RingProduct[]) : []
        nextRings = ringProductsOrAll(activeProducts)
      }

      if (nextRings.length === 0) {
        try {
          const response = await fetch('/api/products?limit=100', { cache: 'no-store' })
          if (response.ok) {
            const payload = (await response.json()) as ProductListResponse
            nextRings = ringProductsOrAll(Array.isArray(payload.products) ? payload.products : [])
          }
        } catch {
          nextRings = []
        }
      }

      setRings(nextRings)
      setLoadingRings(false)
    }

    void loadRings()
  }, [])

  const diamondOptions = useMemo(() => {
    const list = selectedShape === 'All'
      ? ALL_DIAMONDS
      : ALL_DIAMONDS.filter((diamond) => diamond.shape === selectedShape)
    return list.slice(0, 32)
  }, [selectedShape])

  const shapeOptions = useMemo(() => ['All', ...SHAPE_DATA.map((shape) => shape.name)], [])
  const settingPrice = selectedSetting?.basePrice || 0
  const diamondPrice = selectedDiamond?.price || 0
  const total = settingPrice + diamondPrice
  const selectedMetalLabel = metalOptions.find(([value]) => value === selectedMetal)?.[1] || '14K White Gold'
  const ringImage = selectedSetting ? imageForRing(selectedSetting, selectedMetal) : ''

  const selectButtonStyle: CSSProperties = {
    width: '100%',
    background: '#1A1014',
    color: '#FBF5F0',
    border: 'none',
    padding: '13px',
    fontFamily: 'var(--font-inter)',
    fontSize: '10px',
    letterSpacing: '0.16em',
    cursor: 'pointer',
  }

  const addCompleteRing = async () => {
    if (!selectedDiamond || !selectedSetting) {
      showToast('Choose a diamond and setting before adding your ring.', 'error')
      return
    }

    if (!selectedSize) {
      showToast('Please choose a ring size to complete your custom ring.', 'error')
      return
    }

    await addItem({
      productId: selectedSetting.id,
      productSlug: `custom-${selectedSetting.slug}-${selectedDiamond.id.toLowerCase()}`,
      productTitle: `Custom ${selectedSetting.title}`,
      productImage: ringImage || selectedDiamond.img,
      selectedMetal: selectedMetalLabel,
      selectedCarat: selectedDiamond.carat,
      selectedShape: selectedDiamond.shape,
      selectedColor: selectedDiamond.color,
      selectedClarity: selectedDiamond.clarity,
      ringSize: selectedSize,
      quantity: 1,
      unitPrice: total,
      priceBreakdown: {
        base: settingPrice,
        metal: 0,
        carat: diamondPrice,
        shape: 0,
        color: 0,
        clarity: 0,
      },
    })
    showToast('Custom ring added to cart', 'success')
    router.push('/cart')
  }

  return (
    <div style={{ background: '#FBF5F0', minHeight: '100vh' }}>
      <style jsx global>{`
        .builder-diamond-grid,
        .builder-setting-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        @media (max-width: 1100px) {
          .builder-diamond-grid,
          .builder-setting-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 820px) {
          .builder-diamond-grid,
          .builder-setting-grid,
          .builder-preview-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <header style={{ background: '#1A1014', padding: '52px 24px 28px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.32em', color: '#C9A961', marginBottom: '12px' }}>RING BUILDER</div>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400, color: '#FBF5F0', fontSize: 'clamp(34px, 5vw, 56px)', margin: 0 }}>
          Choose the diamond first.
        </h1>
      </header>

      <StepIndicator step={step} />

      {step === 1 ? (
        <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px 110px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '10px' }}>STEP ONE</div>
              <h2 style={{ fontFamily: 'var(--font-playfair)', color: '#1A1014', fontWeight: 400, fontSize: '32px', margin: 0 }}>Choose your center stone</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {shapeOptions.map((shape) => (
                <button
                  key={shape}
                  onClick={() => setSelectedShape(shape)}
                  style={{
                    background: selectedShape === shape ? '#1A1014' : '#FDF8F2',
                    border: '0.5px solid #EDD9AF',
                    color: selectedShape === shape ? '#FBF5F0' : '#1A1014',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '10px',
                    letterSpacing: '0.12em',
                    padding: '9px 12px',
                  }}
                >
                  {shape.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="builder-diamond-grid">
            {diamondOptions.map((diamond) => (
              <DiamondCard
                key={diamond.id}
                diamond={diamond}
                selected={selectedDiamond?.id === diamond.id}
                onSelect={() => setSelectedDiamond(diamond)}
              />
            ))}
          </div>

          {selectedDiamond ? (
            <div style={{ position: 'sticky', bottom: 0, background: '#1A1014', margin: '28px -24px -110px', padding: '18px 24px', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '18px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.24em', marginBottom: '5px' }}>SELECTED DIAMOND</div>
                <div style={{ color: '#FBF5F0', fontFamily: 'var(--font-playfair)', fontSize: '22px' }}>
                  {selectedDiamond.carat}ct {selectedDiamond.shape} - {formatMoney(selectedDiamond.price)}
                </div>
              </div>
              <button onClick={() => setStep(2)} style={{ ...selectButtonStyle, width: 'auto', minWidth: '220px', background: '#C9A961', color: '#1A1014' }}>
                CONTINUE TO SETTINGS -
              </button>
            </div>
          ) : null}
        </main>
      ) : null}

      {step === 2 ? (
        <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px 90px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '16px', marginBottom: '26px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '10px' }}>STEP TWO</div>
              <h2 style={{ fontFamily: 'var(--font-playfair)', color: '#1A1014', fontWeight: 400, fontSize: '32px', margin: 0 }}>Choose your setting</h2>
              {selectedDiamond ? (
                <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px', margin: '8px 0 0' }}>
                  Building around a {selectedDiamond.carat}ct {selectedDiamond.shape}, {selectedDiamond.color}, {selectedDiamond.clarity} diamond.
                </p>
              ) : null}
            </div>
            <button onClick={() => setStep(1)} style={{ background: 'transparent', border: '0.5px solid #EDD9AF', color: '#B8A090', padding: '11px 16px', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.14em', cursor: 'pointer' }}>
              CHANGE DIAMOND
            </button>
          </div>

          {!selectedDiamond ? (
            <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '34px', textAlign: 'center' }}>
              <h3 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '26px', fontWeight: 400, margin: '0 0 10px' }}>Choose a diamond first</h3>
              <button onClick={() => setStep(1)} style={{ ...selectButtonStyle, display: 'inline-block', width: 'auto' }}>
                BACK TO DIAMONDS -
              </button>
            </div>
          ) : loadingRings ? (
            <div style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', padding: '60px 0' }}>Loading ring settings...</div>
          ) : rings.length === 0 ? (
            <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '36px', textAlign: 'center' }}>
              <h3 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '26px', fontWeight: 400, margin: '0 0 10px' }}>No ring settings found</h3>
              <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px', lineHeight: 1.7, margin: '0 auto 22px', maxWidth: '480px' }}>
                Add an active ring product so the builder has a setting to pair with a diamond.
              </p>
              <Link href="/admin/products/new" style={{ ...selectButtonStyle, display: 'inline-block', textDecoration: 'none', width: 'auto' }}>
                ADD RING PRODUCT -
              </Link>
            </div>
          ) : (
            <div className="builder-setting-grid">
              {rings.map((ring) => {
                const image = imageForRing(ring, selectedMetal)
                return (
                  <article key={ring.id} style={{ background: '#FDF8F2', border: selectedSetting?.id === ring.id ? '1px solid #C9A961' : '0.5px solid #EDD9AF', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '1', position: 'relative', background: '#FBF5F0' }}>
                      {image ? <Image src={image} alt={ring.title} fill sizes="(max-width: 768px) 100vw, 25vw" style={{ objectFit: 'cover' }} quality={90} /> : null}
                    </div>
                    <div style={{ padding: '18px' }}>
                      <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.2em', marginBottom: '7px' }}>{ring.category.replace(/_/g, ' ').toUpperCase()}</div>
                      <h3 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 400, margin: '0 0 10px' }}>{ring.title}</h3>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        {metalOptions.map(([value, label]) => (
                          <button
                            key={value}
                            onClick={() => setSelectedMetal(value)}
                            style={{
                              border: selectedMetal === value ? '1px solid #1A1014' : '0.5px solid #EDD9AF',
                              background: selectedMetal === value ? '#1A1014' : '#FBF5F0',
                              color: selectedMetal === value ? '#FBF5F0' : '#B8A090',
                              fontFamily: 'var(--font-inter)',
                              fontSize: '9px',
                              padding: '5px 7px',
                              cursor: 'pointer',
                            }}
                          >
                            {label.replace('14K ', '')}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px' }}>Setting</span>
                        <span style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '22px' }}>{formatMoney(ring.basePrice)}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedSetting(ring)
                          setStep(3)
                        }}
                        style={selectButtonStyle}
                      >
                        SELECT SETTING -
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </main>
      ) : null}

      {step === 3 && selectedDiamond && selectedSetting ? (
        <main style={{ maxWidth: '980px', margin: '0 auto', padding: '16px 24px 90px' }}>
          <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '28px' }}>
            <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '20px' }}>STEP THREE</div>
            <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '32px', fontWeight: 400, margin: '0 0 24px' }}>
              Preview your custom ring
            </h2>

            <div className="builder-preview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
              <div style={{ aspectRatio: '1', position: 'relative', background: '#FBF5F0', border: '0.5px solid #EDD9AF' }}>
                {ringImage ? <Image src={ringImage} alt={selectedSetting.title} fill sizes="360px" style={{ objectFit: 'cover' }} quality={90} /> : null}
              </div>
              <div style={{ aspectRatio: '1', position: 'relative', background: '#FBF5F0', border: '0.5px solid #EDD9AF' }}>
                <Image src={selectedDiamond.img} alt={`${selectedDiamond.shape} diamond`} fill sizes="360px" style={{ objectFit: 'contain', padding: '42px' }} quality={90} />
              </div>
            </div>

            <div className="builder-preview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                {[
                  ['Diamond', `${selectedDiamond.carat}ct ${selectedDiamond.shape}, ${selectedDiamond.color}, ${selectedDiamond.clarity}`],
                  ['Setting', selectedSetting.title],
                  ['Metal', selectedMetalLabel],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '10px 0', borderBottom: '0.5px solid #EDD9AF', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>
                    <span style={{ color: '#B8A090' }}>{label}</span>
                    <span style={{ color: '#1A1014', textAlign: 'right' }}>{value}</span>
                  </div>
                ))}

                <label style={{ display: 'block', marginTop: '18px' }}>
                  <span style={{ display: 'block', color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '8px' }}>RING SIZE</span>
                  <select value={selectedSize} onChange={(event) => setSelectedSize(event.target.value)} style={{ width: '100%', background: '#FBF5F0', border: '0.5px solid #EDD9AF', color: '#1A1014', padding: '12px', fontFamily: 'var(--font-inter)' }}>
                    <option value="">Select size</option>
                    {ringSizes.map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </label>
                <label style={{ display: 'block', marginTop: '14px' }}>
                  <span style={{ display: 'block', color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '8px' }}>METAL</span>
                  <select value={selectedMetal} onChange={(event) => setSelectedMetal(event.target.value)} style={{ width: '100%', background: '#FBF5F0', border: '0.5px solid #EDD9AF', color: '#1A1014', padding: '12px', fontFamily: 'var(--font-inter)' }}>
                    {metalOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
              </div>

              <div style={{ background: '#FBF5F0', border: '0.5px solid #EDD9AF', padding: '22px' }}>
                {[
                  ['Diamond', diamondPrice],
                  ['Setting', settingPrice],
                ].map(([label, value]) => (
                  <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontFamily: 'var(--font-inter)', fontSize: '13px', color: '#B8A090' }}>
                    <span>{label as string}</span>
                    <span style={{ color: '#1A1014' }}>{formatMoney(value as number)}</span>
                  </div>
                ))}
                <div style={{ borderTop: '0.5px solid #EDD9AF', margin: '18px 0', paddingTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.18em' }}>TOTAL</span>
                  <span style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '34px' }}>{formatMoney(total)}</span>
                </div>
                <button onClick={addCompleteRing} style={{ ...selectButtonStyle, padding: '15px', fontSize: '11px', marginBottom: '12px' }}>
                  ADD COMPLETE RING TO CART
                </button>
                <button onClick={() => setStep(2)} style={{ width: '100%', background: 'transparent', color: '#B8A090', border: '0.5px solid #EDD9AF', padding: '12px', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.14em', cursor: 'pointer' }}>
                  CHANGE SETTING
                </button>
              </div>
            </div>
          </div>
        </main>
      ) : null}
    </div>
  )
}

export default function BuildPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#FBF5F0' }} />}>
      <BuildContent />
    </Suspense>
  )
}

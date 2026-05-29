'use client'

import { CSSProperties, Suspense, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { ALL_DIAMONDS, Diamond } from '@/lib/diamondCatalog'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

const metalOptions = [
  ['14k_white_gold', '14K White Gold', 'white_gold'],
  ['14k_yellow_gold', '14K Yellow Gold', 'yellow_gold'],
  ['14k_rose_gold', '14K Rose Gold', 'rose_gold'],
  ['platinum', 'Platinum', 'platinum'],
] as const

const ringSizes = ['4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9']

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function imageForRing(ring: RingProduct, metal: string) {
  const metalKey = metalOptions.find(([value]) => value === metal)?.[2] || 'white_gold'
  return ring.metalImages?.[metalKey]?.[0] || ring.images?.[0] || ''
}

function StepIndicator({ step }: { step: number }) {
  const steps = ['SETTING', 'DIAMOND', 'COMPLETE']
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '34px 24px 24px' }}>
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
                {complete ? '✓' : stepNumber}
              </div>
              <div style={{ fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.2em', color: active ? '#1A1014' : '#B8A090' }}>
                {label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DiamondCard({ diamond, onSelect }: { diamond: Diamond; onSelect: () => void }) {
  return (
    <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ aspectRatio: '1', position: 'relative', background: '#F5E8ED' }}>
        <Image src={diamond.img} alt={`${diamond.carat}ct ${diamond.shape}`} fill sizes="(max-width: 768px) 100vw, 240px" style={{ objectFit: 'cover' }} quality={90} />
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', color: '#1A1014', marginBottom: '8px' }}>
          {diamond.carat}ct {diamond.shape}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
          {[diamond.color, diamond.clarity, diamond.cut].map((spec) => (
            <span key={spec} style={{ border: '0.5px solid #EDD9AF', background: '#FBF5F0', color: '#B8A090', fontSize: '10px', padding: '2px 7px', fontFamily: 'var(--font-inter)' }}>{spec}</span>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <span style={{ fontFamily: 'var(--font-playfair)', color: '#1A1014', fontSize: '20px' }}>{formatMoney(diamond.price)}</span>
          <span style={{ fontFamily: 'var(--font-inter)', color: '#C9A961', fontSize: '9px', letterSpacing: '0.14em' }}>IGI</span>
        </div>
        <button onClick={onSelect} style={{ width: '100%', background: '#1A1014', color: '#FBF5F0', border: 'none', padding: '12px', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.16em', cursor: 'pointer' }}>
          SELECT THIS DIAMOND -
        </button>
      </div>
    </div>
  )
}

function BuildContent() {
  const searchParams = useSearchParams()
  const { addItem } = useCart()
  const { showToast } = useToast()
  const [step, setStep] = useState(1)
  const [rings, setRings] = useState<RingProduct[]>([])
  const [loadingRings, setLoadingRings] = useState(true)
  const [showAllShapes, setShowAllShapes] = useState(false)
  const [selectedRing, setSelectedRing] = useState<RingProduct | null>(null)
  const [selectedDiamond, setSelectedDiamond] = useState<Diamond | null>(null)
  const [selectedMetal, setSelectedMetal] = useState('14k_white_gold')
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  useEffect(() => {
    const requestedDiamond = searchParams.get('diamond')
    if (!requestedDiamond) return

    const diamond = ALL_DIAMONDS.find((item) => item.id === requestedDiamond)
    if (diamond) {
      setSelectedDiamond(diamond)
      setStep(1)
    }
  }, [searchParams])

  useEffect(() => {
    const loadRings = async () => {
      setLoadingRings(true)
      const { data, error } = await supabase
        .from('Product')
        .select('*')
        .eq('productType', 'engagement_ring')
        .eq('isActive', true)
        .order('basePrice', { ascending: true })

      if (!error && data) {
        setRings(data as RingProduct[])
      }
      setLoadingRings(false)
    }

    void loadRings()
  }, [])

  const diamondOptions = useMemo(() => {
    const list = showAllShapes
      ? ALL_DIAMONDS
      : ALL_DIAMONDS.filter((diamond) => diamond.shape === 'Round' || diamond.shape === 'Oval')
    return list.slice(0, showAllShapes ? 36 : 18)
  }, [showAllShapes])

  const settingPrice = selectedRing?.basePrice || 0
  const diamondPrice = selectedDiamond?.price || 0
  const total = settingPrice + diamondPrice
  const selectedMetalLabel = metalOptions.find(([value]) => value === selectedMetal)?.[1] || '14K White Gold'
  const ringImage = selectedRing ? imageForRing(selectedRing, selectedMetal) : ''

  const selectRing = (ring: RingProduct) => {
    setSelectedRing(ring)
    setStep(2)
  }

  const selectDiamond = (diamond: Diamond) => {
    setSelectedDiamond(diamond)
    setStep(3)
  }

  const addCompleteRing = async () => {
    if (!selectedRing || !selectedDiamond || !selectedSize) {
      showToast('Please choose a ring size to complete your custom ring.', 'error')
      return
    }

    await addItem({
      productId: selectedRing.id,
      productSlug: `custom-${selectedRing.slug}-${selectedDiamond.id.toLowerCase()}`,
      productTitle: `Custom ${selectedRing.title}`,
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
  }

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

  return (
    <div style={{ background: '#FBF5F0', minHeight: '100vh' }}>
      <style jsx global>{`
        @media (max-width: 900px) {
          .builder-ring-grid, .builder-diamond-grid { grid-template-columns: 1fr !important; }
          .builder-summary-grid { grid-template-columns: 1fr !important; }
          .builder-composition { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <header style={{ background: '#1A1014', padding: '52px 24px 28px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.32em', color: '#C9A961', marginBottom: '12px' }}>RING BUILDER</div>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400, color: '#FBF5F0', fontSize: 'clamp(34px, 5vw, 56px)', margin: 0 }}>
          Build a ring, piece by piece.
        </h1>
      </header>

      <StepIndicator step={step} />

      {step === 1 && (
        <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px 80px' }}>
          <div style={{ marginBottom: '26px' }}>
            <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '10px' }}>STEP ONE</div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', color: '#1A1014', fontWeight: 400, fontSize: '32px', margin: 0 }}>Choose your setting</h2>
          </div>

          {loadingRings ? (
            <div style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', padding: '40px 0' }}>Loading settings...</div>
          ) : (
            <div className="builder-ring-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '18px' }}>
              {rings.map((ring) => {
                const image = imageForRing(ring, selectedMetal)
                return (
                  <article key={ring.id} style={{ background: '#FDF8F2', border: selectedRing?.id === ring.id ? '1px solid #C9A961' : '0.5px solid #EDD9AF', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '1', position: 'relative', background: '#F5E8ED' }}>
                      {image ? <Image src={image} alt={ring.title} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} quality={90} /> : null}
                    </div>
                    <div style={{ padding: '18px' }}>
                      <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.2em', marginBottom: '7px' }}>{ring.category.replace(/_/g, ' ').toUpperCase()}</div>
                      <h3 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 400, margin: '0 0 10px' }}>{ring.title}</h3>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        {metalOptions.map(([value, label]) => (
                          <button key={value} onClick={() => setSelectedMetal(value)} style={{ border: selectedMetal === value ? '1px solid #1A1014' : '0.5px solid #EDD9AF', background: selectedMetal === value ? '#1A1014' : '#FBF5F0', color: selectedMetal === value ? '#FBF5F0' : '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '9px', padding: '5px 7px', cursor: 'pointer' }}>
                            {label.replace('14K ', '')}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px' }}>Setting</span>
                        <span style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '22px' }}>{formatMoney(ring.basePrice)}</span>
                      </div>
                      <button onClick={() => selectRing(ring)} style={selectButtonStyle}>SELECT THIS SETTING -</button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </main>
      )}

      {step === 2 && (
        <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px 80px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '16px', marginBottom: '26px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '10px' }}>STEP TWO</div>
              <h2 style={{ fontFamily: 'var(--font-playfair)', color: '#1A1014', fontWeight: 400, fontSize: '32px', margin: 0 }}>Choose your diamond</h2>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(1)} style={{ background: 'transparent', border: '0.5px solid #EDD9AF', color: '#B8A090', padding: '11px 16px', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.14em', cursor: 'pointer' }}>BACK</button>
              <button onClick={() => setShowAllShapes((value) => !value)} style={{ background: showAllShapes ? '#1A1014' : 'transparent', border: '0.5px solid #EDD9AF', color: showAllShapes ? '#FBF5F0' : '#1A1014', padding: '11px 16px', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.14em', cursor: 'pointer' }}>
                {showAllShapes ? 'POPULAR ONLY' : 'ALL SHAPES'}
              </button>
            </div>
          </div>
          <div className="builder-diamond-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
            {diamondOptions.map((diamond) => <DiamondCard key={diamond.id} diamond={diamond} onSelect={() => selectDiamond(diamond)} />)}
          </div>
        </main>
      )}

      {step === 3 && selectedRing && selectedDiamond && (
        <main style={{ maxWidth: '960px', margin: '0 auto', padding: '16px 24px 90px' }}>
          <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '28px' }}>
            <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '20px' }}>YOUR CUSTOM RING</div>
            <div className="builder-composition" style={{ display: 'grid', gridTemplateColumns: '1fr 48px 1fr', gap: '16px', alignItems: 'center', marginBottom: '28px' }}>
              <div style={{ aspectRatio: '1', position: 'relative', background: '#F5E8ED', border: '0.5px solid #EDD9AF' }}>
                {ringImage ? <Image src={ringImage} alt={selectedRing.title} fill sizes="300px" style={{ objectFit: 'cover' }} quality={90} /> : null}
              </div>
              <div style={{ color: '#C9A961', fontFamily: 'var(--font-playfair)', fontSize: '34px', textAlign: 'center' }}>+</div>
              <div style={{ aspectRatio: '1', position: 'relative', background: '#F5E8ED', border: '0.5px solid #EDD9AF' }}>
                <Image src={selectedDiamond.img} alt={selectedDiamond.shape} fill sizes="300px" style={{ objectFit: 'cover' }} quality={90} />
              </div>
            </div>

            <div className="builder-summary-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                {[
                  ['Setting', selectedRing.title],
                  ['Metal', selectedMetalLabel],
                  ['Diamond', `${selectedDiamond.carat}ct ${selectedDiamond.shape}, ${selectedDiamond.color}, ${selectedDiamond.clarity}`],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '10px 0', borderBottom: '0.5px solid #EDD9AF', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>
                    <span style={{ color: '#B8A090' }}>{label}</span>
                    <span style={{ color: '#1A1014', textAlign: 'right' }}>{value}</span>
                  </div>
                ))}

                <label style={{ display: 'block', marginTop: '18px' }}>
                  <span style={{ display: 'block', color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '8px' }}>RING SIZE</span>
                  <select value={selectedSize || ''} onChange={(event) => setSelectedSize(event.target.value || null)} style={{ width: '100%', background: '#FBF5F0', border: '0.5px solid #EDD9AF', color: '#1A1014', padding: '12px', fontFamily: 'var(--font-inter)' }}>
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
                  ['Setting', settingPrice],
                  ['Diamond', diamondPrice],
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
                <button onClick={addCompleteRing} style={{ width: '100%', background: '#1A1014', color: '#FBF5F0', border: 'none', padding: '15px', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.16em', cursor: 'pointer', marginBottom: '12px' }}>
                  ADD COMPLETE RING TO CART
                </button>
                <button onClick={() => setStep(2)} style={{ width: '100%', background: 'transparent', color: '#B8A090', border: '0.5px solid #EDD9AF', padding: '12px', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.14em', cursor: 'pointer' }}>
                  CHANGE DIAMOND
                </button>
              </div>
            </div>
          </div>
        </main>
      )}
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

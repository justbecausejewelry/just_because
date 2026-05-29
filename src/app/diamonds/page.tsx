'use client'

import { CSSProperties, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ALL_DIAMONDS, Diamond, SHAPE_DATA } from '@/lib/diamondCatalog'

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

function DiamondModal({
  diamond,
  onClose,
  onChoose,
}: {
  diamond: Diamond
  onClose: () => void
  onChoose: () => void
}) {
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
              ['CARAT', diamond.carat],
              ['COLOR', diamond.color],
              ['CLARITY', diamond.clarity],
              ['CUT', diamond.cut],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#FBF5F0', padding: '14px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#B8A090', marginBottom: '6px', fontFamily: 'var(--font-inter)' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', color: '#1A1014' }}>{value}</div>
              </div>
            ))}
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

          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '36px', color: '#1A1014', marginBottom: '6px' }}>${diamond.price.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: '#B8A090', marginBottom: '24px', fontFamily: 'var(--font-inter)' }}>
            Starting at ${Math.round(diamond.price / 12).toLocaleString()}/mo
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button onClick={onChoose} style={{ flex: 1, padding: '16px', background: '#1A1014', color: '#FBF5F0', border: 'none', fontSize: '11px', letterSpacing: '0.18em', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              CHOOSE THIS DIAMOND
            </button>
            <button style={{ padding: '16px 20px', background: 'transparent', border: '0.5px solid #EDD9AF', color: '#1A1014', fontSize: '11px', letterSpacing: '0.18em', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              ADD TO CART
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DiamondsPage() {
  const router = useRouter()
  const [selectedShape, setSelectedShape] = useState('All')
  const [selectedColor, setSelectedColor] = useState<string[]>([])
  const [selectedClarity, setSelectedClarity] = useState<string[]>([])
  const [caratRange, setCaratRange] = useState<[number, number]>([0.5, 5])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [sortBy, setSortBy] = useState('price_low')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedDiamond, setSelectedDiamond] = useState<Diamond | null>(null)

  const filtered = useMemo(() => {
    return ALL_DIAMONDS.filter((diamond) => {
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
  }, [caratRange, priceRange, selectedClarity, selectedColor, selectedShape, sortBy])

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
                  const updateSelected = setSelected as (value: React.SetStateAction<string[]>) => void
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

        <main style={{ padding: '32px' }}>
          <div className="diamond-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '28px', paddingBottom: '20px', borderBottom: '0.5px solid #EDD9AF' }}>
            <div style={{ fontSize: '13px', color: '#B8A090', fontFamily: 'var(--font-inter)' }}>
              <span style={{ color: '#C9A961', fontWeight: 500 }}>{filtered.length}</span> diamonds found
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
        </main>
      </div>

      {selectedDiamond ? (
        <DiamondModal
          diamond={selectedDiamond}
          onClose={() => setSelectedDiamond(null)}
          onChoose={() => {
            setSelectedDiamond(null)
            router.push(`/build?diamond=${selectedDiamond.id}`)
          }}
        />
      ) : null}
    </div>
  )
}

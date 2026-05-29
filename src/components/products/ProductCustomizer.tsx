"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type ProductForCustomizer = {
  productType?: string | null
  category?: string | null
  basePrice?: number | null
  pricePerCarat?: number | null
}

type CustomizerOptions = {
  showMetal: boolean
  showSize: boolean
  showCarat: boolean
  caratKey?: keyof typeof CARAT_OPTIONS
}

interface ProductCustomizerProps {
  product: ProductForCustomizer
  onSelectionChange: (selections: {
    metal: string
    size?: string
    caratWeight?: number
    totalPrice: number
  }) => void
}

const METALS = [
  { value: '14k_white_gold', label: '14k', fullLabel: '14K White Gold', color: '#E8E8E8', textColor: '#1A1014' },
  { value: '14k_yellow_gold', label: '14k', fullLabel: '14K Yellow Gold', color: '#C9A961', textColor: '#1A1014' },
  { value: '14k_rose_gold', label: '14k', fullLabel: '14K Rose Gold', color: '#D4956A', textColor: '#1A1014' },
  { value: 'platinum', label: 'Pt', fullLabel: 'Platinum', color: '#C0C0C0', textColor: '#1A1014' },
]

const CARAT_OPTIONS = {
  earring: [0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5, 6],
  stud: [0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5, 6],
  bracelet: [3, 5, 8, 10, 12, 15],
  tennis_bracelet: [3, 5, 8, 10, 12, 15],
  necklace: [5, 7, 10, 15, 20],
  tennis_necklace: [5, 7, 10, 15, 20],
  pendant: [0.25, 0.5, 0.75, 1, 1.5, 2],
}

const RING_SIZES = [
  '3', '3.5', '4', '4.5', '5', '5.5',
  '6', '6.5', '7', '7.5', '8', '8.5',
  '9', '9.5', '10',
]

function getOptionsForType(productType: string, category: string): CustomizerOptions {
  const type = productType.toLowerCase()
  const cat = category.toLowerCase()
  const combined = `${type} ${cat}`

  if (
    combined.includes('ring') ||
    combined.includes('band') ||
    combined.includes('engagement') ||
    combined.includes('wedding')
  ) {
    return { showMetal: true, showSize: true, showCarat: false }
  }

  if (
    combined.includes('earring') ||
    combined.includes('stud') ||
    combined.includes('hoop') ||
    combined.includes('huggie')
  ) {
    return { showMetal: true, showSize: false, showCarat: true, caratKey: 'earring' }
  }

  if (combined.includes('bracelet') || combined.includes('bangle')) {
    return { showMetal: true, showSize: false, showCarat: true, caratKey: 'bracelet' }
  }

  if (
    combined.includes('necklace') ||
    combined.includes('pendant') ||
    combined.includes('choker') ||
    combined.includes('tennis')
  ) {
    if (combined.includes('tennis')) {
      return { showMetal: true, showSize: false, showCarat: true, caratKey: 'tennis_necklace' }
    }
    if (combined.includes('pendant')) {
      return { showMetal: true, showSize: false, showCarat: true, caratKey: 'pendant' }
    }
    return { showMetal: true, showSize: false, showCarat: true, caratKey: 'necklace' }
  }

  return { showMetal: true, showSize: false, showCarat: false }
}

export function productNeedsRingSize(productType?: string | null, category?: string | null) {
  return getOptionsForType(productType || '', category || '').showSize
}

export default function ProductCustomizer({
  product,
  onSelectionChange,
}: ProductCustomizerProps) {
  const [selectedMetal, setSelectedMetal] = useState(METALS[0])
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedCarat, setSelectedCarat] = useState<number | null>(null)

  const options = useMemo(
    () => getOptionsForType(product.productType || '', product.category || ''),
    [product.productType, product.category]
  )

  const caratList = useMemo(
    () => (options.caratKey ? CARAT_OPTIONS[options.caratKey] : []),
    [options.caratKey]
  )

  useEffect(() => {
    setSelectedSize(null)
    setSelectedCarat(options.showCarat && caratList.length > 0 ? caratList[0] : null)
  }, [caratList, options.showCarat])

  useEffect(() => {
    const metalPrice = selectedMetal.value === 'platinum' ? 800
      : selectedMetal.value === '14k_yellow_gold' ? 200
      : selectedMetal.value === '14k_rose_gold' ? 150
      : 0

    const caratPrice = options.showCarat && selectedCarat
      ? selectedCarat * (product.pricePerCarat || 300)
      : 0

    onSelectionChange({
      metal: selectedMetal.fullLabel,
      size: selectedSize || undefined,
      caratWeight: selectedCarat || undefined,
      totalPrice: (product.basePrice || 0) + metalPrice + caratPrice,
    })
  }, [onSelectionChange, options.showCarat, product.basePrice, product.pricePerCarat, selectedCarat, selectedMetal, selectedSize])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {options.showMetal && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
              Metal Type:
            </span>
            <span style={{ fontSize: '13px', color: '#1A1014', fontFamily: 'var(--font-inter)' }}>
              {selectedMetal.fullLabel}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {METALS.map((metal) => (
              <button
                key={metal.value}
                onClick={() => setSelectedMetal(metal)}
                title={metal.fullLabel}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: selectedMetal.value === metal.value ? '2px solid #1A1014' : '1px solid #EDD9AF',
                  background: metal.color,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: selectedMetal.value === metal.value ? '0 0 0 3px rgba(26,16,20,0.1)' : 'none',
                }}
                onMouseEnter={(event) => {
                  if (selectedMetal.value !== metal.value) {
                    event.currentTarget.style.borderColor = '#1A1014'
                  }
                }}
                onMouseLeave={(event) => {
                  if (selectedMetal.value !== metal.value) {
                    event.currentTarget.style.borderColor = '#EDD9AF'
                  }
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 500, color: metal.textColor, fontFamily: 'var(--font-inter)', letterSpacing: '0.02em' }}>
                  {metal.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {options.showSize && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
              Ring Size:
            </span>
            <Link href="/education/ring-size" style={{ fontSize: '12px', color: '#C9A961', textDecoration: 'none', fontFamily: 'var(--font-inter)' }}>
              Size guide →
            </Link>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {RING_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                style={{
                  width: '48px',
                  height: '40px',
                  border: selectedSize === size ? '1.5px solid #1A1014' : '1px solid #EDD9AF',
                  background: selectedSize === size ? '#1A1014' : '#FBF5F0',
                  color: selectedSize === size ? '#FBF5F0' : '#1A1014',
                  fontSize: '13px',
                  fontFamily: 'var(--font-inter)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderRadius: '2px',
                }}
                onMouseEnter={(event) => {
                  if (selectedSize !== size) {
                    event.currentTarget.style.borderColor = '#1A1014'
                  }
                }}
                onMouseLeave={(event) => {
                  if (selectedSize !== size) {
                    event.currentTarget.style.borderColor = '#EDD9AF'
                  }
                }}
              >
                {size}
              </button>
            ))}
          </div>

          {!selectedSize && (
            <p style={{ fontSize: '11px', color: '#A85C6A', fontFamily: 'var(--font-inter)', marginTop: '8px' }}>
              Please select a ring size
            </p>
          )}
        </div>
      )}

      {options.showCarat && caratList.length > 0 && (
        <div>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
              Total Carat Weight:
            </span>
            {selectedCarat && (
              <span style={{ fontSize: '13px', color: '#1A1014', fontFamily: 'var(--font-inter)', marginLeft: '8px' }}>
                {selectedCarat} ct. tw.
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {caratList.map((carat) => (
              <button
                key={carat}
                onClick={() => setSelectedCarat(carat)}
                style={{
                  padding: '8px 16px',
                  minWidth: '52px',
                  border: selectedCarat === carat ? '1.5px solid #1A1014' : '1px solid #EDD9AF',
                  background: selectedCarat === carat ? '#1A1014' : '#FBF5F0',
                  color: selectedCarat === carat ? '#FBF5F0' : '#1A1014',
                  fontSize: '13px',
                  fontFamily: 'var(--font-inter)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderRadius: '2px',
                }}
                onMouseEnter={(event) => {
                  if (selectedCarat !== carat) {
                    event.currentTarget.style.borderColor = '#1A1014'
                  }
                }}
                onMouseLeave={(event) => {
                  if (selectedCarat !== carat) {
                    event.currentTarget.style.borderColor = '#EDD9AF'
                  }
                }}
              >
                {carat}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

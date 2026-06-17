"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { METALS, getMetalLabel, metalMatches } from '@/config/productOptions'

type PricingMap = Record<string, { enabled?: boolean; modifier?: number }>

type ProductForCustomizer = {
  productType?: string | null
  category?: string | null
  basePrice?: number | null
  pricePerCarat?: number | null
  availableMetals?: string[] | null
  availableCarats?: number[] | null
  availableSizes?: string[] | null
  metalPricing?: PricingMap | null
  caratPricing?: PricingMap | null
}

type MetalOption = (typeof METALS)[number]

type CustomizerOptions = {
  showMetal: boolean
  showSize: boolean
  showCarat: boolean
  showLength: boolean
  sizeType?: 'ring'
  caratKey?: keyof typeof CARAT_OPTIONS
  lengthOptions?: string[]
}

interface ProductCustomizerProps {
  product: ProductForCustomizer
  onSelectionChange: (selections: {
    metal: string
    size?: string
    length?: string
    caratWeight?: number
    totalPrice: number
  }) => void
}

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

function normalizeCaratOptions(options?: number[] | null) {
  return Array.from(
    new Set(
      (options || [])
        .map((option) => Number(option))
        .filter((option) => Number.isFinite(option) && option > 0)
    )
  ).sort((left, right) => left - right)
}

function getModifier(pricing: PricingMap | null | undefined, key?: string | number) {
  if (key === undefined || key === null || !pricing) return 0
  const entry = pricing[String(key)]
  if (!entry?.enabled) return 0
  return typeof entry.modifier === 'number' ? entry.modifier : 0
}

function getOptionsForType(productType: string, category: string): CustomizerOptions {
  const type = (productType || '').toLowerCase()
  const cat = (category || '').toLowerCase()

  if (
    type === 'engagement_ring' ||
    type === 'wedding_ring' ||
    type === 'ring' ||
    cat === 'engagement' ||
    cat === 'wedding'
  ) {
    return { showMetal: true, showSize: true, showCarat: false, showLength: false, sizeType: 'ring' }
  }

  if (
    type === 'earring' ||
    type === 'stud' ||
    cat.includes('earring') ||
    cat.includes('stud') ||
    cat.includes('hoop')
  ) {
    return { showMetal: true, showSize: false, showCarat: true, caratKey: 'earring', showLength: false }
  }

  if (
    type === 'bracelet' ||
    cat.includes('bracelet') ||
    cat.includes('bangle') ||
    cat.includes('tennis_bracelet')
  ) {
    return { showMetal: true, showSize: false, showCarat: true, caratKey: 'bracelet', showLength: true, lengthOptions: ['6.5"', '7"', '7.5"', '8"'] }
  }

  if (
    type === 'necklace' ||
    cat.includes('necklace') ||
    cat.includes('choker') ||
    cat.includes('tennis_necklace')
  ) {
    const isTennis = cat.includes('tennis')
    return { showMetal: true, showSize: false, showCarat: true, caratKey: isTennis ? 'tennis_necklace' : 'necklace', showLength: true, lengthOptions: ['14"', '16"', '18"', '20"', '22"'] }
  }

  if (type === 'pendant' || cat.includes('pendant')) {
    return { showMetal: true, showSize: false, showCarat: true, caratKey: 'pendant', showLength: true, lengthOptions: ['16"', '18"', '20"'] }
  }

  return { showMetal: true, showSize: false, showCarat: false, showLength: false }
}

export function productNeedsRingSize(productType?: string | null, category?: string | null) {
  return getOptionsForType(productType || '', category || '').showSize
}

export default function ProductCustomizer({
  product,
  onSelectionChange,
}: ProductCustomizerProps) {
  const [selectedMetal, setSelectedMetal] = useState<MetalOption | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedCarat, setSelectedCarat] = useState<number | null>(null)
  const [selectedLength, setSelectedLength] = useState<string | null>(null)

  const options = useMemo(
    () => getOptionsForType(product.productType || '', product.category || ''),
    [product.productType, product.category]
  )

  const metalList = useMemo(() => {
    if (!product.availableMetals?.length) return [...METALS]
    return METALS.filter((metal) => product.availableMetals?.some((option) => metalMatches(option, metal.value)))
  }, [product.availableMetals])

  const caratList = useMemo(() => {
    const productCarats = normalizeCaratOptions(product.availableCarats)
    if (productCarats.length) return productCarats
    return options.caratKey ? CARAT_OPTIONS[options.caratKey] : []
  }, [options.caratKey, product.availableCarats])

  const sizeList = useMemo(
    () => (product.availableSizes?.length ? product.availableSizes : RING_SIZES),
    [product.availableSizes]
  )

  useEffect(() => {
    setSelectedMetal((current) => {
      if (current && metalList.some((metal) => metal.value === current.value)) return current
      return metalList.length === 1 ? metalList[0] : null
    })
    setSelectedSize((current) => {
      if (current && sizeList.includes(current)) return current
      return options.showSize && sizeList.length === 1 ? sizeList[0] : null
    })
    setSelectedLength((current) => {
      if (current && options.lengthOptions?.includes(current)) return current
      return options.showLength && options.lengthOptions?.length === 1 ? options.lengthOptions[0] : null
    })
    setSelectedCarat((current) => {
      if (current && caratList.includes(current)) return current
      return options.showCarat && caratList.length === 1 ? caratList[0] : null
    })
  }, [caratList, metalList, options.lengthOptions, options.showCarat, options.showLength, options.showSize, sizeList])

  useEffect(() => {
    const metalPrice = selectedMetal ? getModifier(product.metalPricing, selectedMetal.value) : 0

    const caratPrice = options.showCarat && selectedCarat
      ? getModifier(product.caratPricing, selectedCarat) || selectedCarat * (product.pricePerCarat || 300)
      : 0

    onSelectionChange({
      metal: selectedMetal?.value || '',
      size: selectedSize || undefined,
      length: selectedLength || undefined,
      caratWeight: selectedCarat || undefined,
      totalPrice: (product.basePrice || 0) + metalPrice + caratPrice,
    })
  }, [onSelectionChange, options.showCarat, product.basePrice, product.caratPricing, product.metalPricing, product.pricePerCarat, selectedCarat, selectedLength, selectedMetal, selectedSize])

  const productType = product.productType || ''
  const lengthLabel = productType.includes('necklace')
    ? 'Necklace Length:'
    : productType.includes('bracelet')
      ? 'Bracelet Length:'
      : productType.includes('pendant')
        ? 'Chain Length:'
        : 'Length:'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {options.showMetal && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
              Metal Type:
            </span>
            <span style={{ fontSize: '13px', color: '#1A1014', fontFamily: 'var(--font-inter)' }}>
              {selectedMetal ? getMetalLabel(selectedMetal.value) : 'Select'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {metalList.map((metal) => (
              <button
                key={metal.value}
                onClick={() => setSelectedMetal(metal)}
                title={metal.label}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: selectedMetal?.value === metal.value ? '2px solid #1A1014' : '1px solid #EDD9AF',
                  background: metal.hex,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: selectedMetal?.value === metal.value ? '0 0 0 3px rgba(26,16,20,0.1)' : 'none',
                }}
                onMouseEnter={(event) => {
                  if (selectedMetal?.value !== metal.value) {
                    event.currentTarget.style.borderColor = '#1A1014'
                  }
                }}
                onMouseLeave={(event) => {
                  if (selectedMetal?.value !== metal.value) {
                    event.currentTarget.style.borderColor = '#EDD9AF'
                  }
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 500, color: '#1A1014', fontFamily: 'var(--font-inter)', letterSpacing: '0.02em' }}>
                  {metal.value === 'platinum' ? 'Pt' : '14K'}
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
            {sizeList.map((size) => (
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

      {options.showLength && options.lengthOptions && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
              {lengthLabel}
            </span>
            {selectedLength && (
              <span style={{ fontSize: '13px', color: '#1A1014', fontFamily: 'var(--font-inter)' }}>
                {selectedLength}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {options.lengthOptions.map((length) => (
              <button
                key={length}
                onClick={() => setSelectedLength(length)}
                style={{
                  padding: '8px 16px',
                  minWidth: '60px',
                  border: selectedLength === length ? '1.5px solid #1A1014' : '1px solid #EDD9AF',
                  background: selectedLength === length ? '#1A1014' : '#FBF5F0',
                  color: selectedLength === length ? '#FBF5F0' : '#1A1014',
                  fontSize: '13px',
                  fontFamily: 'var(--font-inter)',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(event) => {
                  if (selectedLength !== length) {
                    event.currentTarget.style.borderColor = '#1A1014'
                  }
                }}
                onMouseLeave={(event) => {
                  if (selectedLength !== length) {
                    event.currentTarget.style.borderColor = '#EDD9AF'
                  }
                }}
              >
                {length}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

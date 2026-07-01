'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Gem, SlidersHorizontal, X } from 'lucide-react'
import { ProductBadges } from '@/components/products/ProductBadges'
import { useToast } from '@/context/ToastContext'
import { useWishlist } from '@/context/WishlistContext'
import { METALS, getMetalLabel, normalizeMetalSelection } from '@/config/productOptions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { getGeneralErrorMessage } from '@/lib/errors'

const TYPE_MAP: Record<string, string[]> = {
  engagement_ring: ['engagement_ring'],
  engagement_rings: ['engagement_ring'],
  engagement: ['engagement_ring'],
  ring: ['ring', 'wedding_ring', 'engagement_ring'],
  rings: ['ring', 'wedding_ring', 'engagement_ring'],
  wedding_ring: ['wedding_ring'],
  wedding: ['wedding_ring'],
  necklace: ['necklace', 'tennis_necklace', 'pendant'],
  necklaces: ['necklace', 'tennis_necklace', 'pendant'],
  earring: ['earring', 'stud'],
  earrings: ['earring', 'stud'],
  bracelet: ['bracelet', 'tennis_bracelet', 'bangle'],
  bracelets: ['bracelet', 'tennis_bracelet', 'bangle'],
  pendant: ['pendant', 'necklace'],
  pendants: ['pendant'],
  diamond: ['diamond'],
  diamonds: ['diamond'],
}

type MetalPricingEntry = {
  enabled?: boolean
  modifier?: number
}

type Product = {
  id: string
  slug: string
  productType: string
  category: string
  title: string
  description: string | null
  basePrice: number
  metalPricing?: Record<string, MetalPricingEntry> | null
  images: string[]
  metalImages?: {
    white_gold?: string[]
    yellow_gold?: string[]
    rose_gold?: string[]
    platinum?: string[]
  } | null
  availableMetals: string[]
  availableShapes: string[]
  isBestSeller: boolean
  isNewArrival: boolean
  isFeatured: boolean
  isActive?: boolean
  sortOrder?: number
  createdAt?: string
}

type ProductTypeFilter = {
  label: string
  type: string
  category?: string
}

const productTypeFilters: ProductTypeFilter[] = [
  { label: 'All', type: 'all' },
  { label: 'Rings', type: 'ring' },
  { label: 'Engagement Rings', type: 'ring', category: 'engagement_ring' },
  { label: 'Wedding Rings', type: 'ring', category: 'wedding_ring' },
  { label: 'Necklaces', type: 'necklace' },
  { label: 'Bracelets', type: 'bracelet' },
  { label: 'Earrings', type: 'earring' },
  { label: 'Pendants', type: 'pendant' },
]

const metalSwatches = Object.fromEntries(METALS.map((metal) => [metal.value, metal.hex]))

const sortOptions = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price_low' },
  { label: 'Price: High to Low', value: 'price_high' },
  { label: 'Newest', value: 'newest' },
]

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

function prettify(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function normalizeType(value: string) {
  return normalizeToken(value)
}

function getTypeDbValues(value: string) {
  const normalized = normalizeType(value)
  const singular = normalized.replace(/s$/, '')
  return TYPE_MAP[normalized] || TYPE_MAP[singular] || [singular || normalized]
}

function normalizeSort(value: string) {
  if (value === 'price-asc') return 'price_low'
  if (value === 'price-desc') return 'price_high'
  return value || 'featured'
}

function getFilterLabel(value: string) {
  const normalized = normalizeType(value)
  const labels: Record<string, string> = {
    engagement: 'Engagement Rings',
    engagement_ring: 'Engagement Rings',
    engagement_rings: 'Engagement Rings',
    wedding: 'Wedding Bands',
    wedding_ring: 'Wedding Bands',
    ring: 'Rings',
    rings: 'Rings',
    necklace: 'Necklaces',
    necklaces: 'Necklaces',
    earring: 'Earrings',
    earrings: 'Earrings',
    bracelet: 'Bracelets',
    bracelets: 'Bracelets',
    pendant: 'Pendants',
    pendants: 'Pendants',
    diamond: 'Diamonds',
    diamonds: 'Diamonds',
  }
  return labels[normalized] || prettify(normalized)
}

function getCategoryFilterLabel(value: string) {
  const labels: Record<string, string> = {
    engagement_ring: 'Engagement Rings',
    wedding_ring: 'Wedding Rings',
  }

  return labels[normalizeToken(value)] || prettify(value)
}

function isProductTypeFilterActive(activeType: string, activeCategory: string, filter: ProductTypeFilter) {
  const normalizedType = normalizeType(activeType)
  const normalizedCategory = normalizeToken(activeCategory)

  if (filter.type === 'all') return (!normalizedType || normalizedType === 'all') && !normalizedCategory
  if (filter.category) {
    return normalizedType === normalizeType(filter.type) && normalizedCategory === normalizeToken(filter.category)
  }

  return normalizedType === normalizeType(filter.type)
}

function ProductPlaceholder({ size = 52 }: { size?: number }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #F5E8ED, #FDF8F2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,97,0.4)" strokeWidth="0.8">
        <path d="M6 3h12l4 6-10 13L2 9z" />
        <path d="M2 9h20" />
      </svg>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', display: 'flex', flexDirection: 'column', minHeight: '480px', overflow: 'hidden' }}>
      <div className="just-because-shimmer" style={{ flexShrink: 0, height: '280px', width: '100%' }} />
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', padding: '20px 16px 16px' }}>
        <div className="just-because-shimmer" style={{ height: '10px', width: '42%', marginBottom: '12px' }} />
        <div className="just-because-shimmer" style={{ height: '20px', width: '72%', marginBottom: '14px' }} />
        <div className="just-because-shimmer" style={{ height: '16px', width: '36%' }} />
        <div style={{ flex: 1 }} />
        <div className="just-because-shimmer" style={{ height: '46px', width: '100%' }} />
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const { toggleItem, isWishlisted } = useWishlist()
  const { showToast } = useToast()
  const image = product.metalImages?.white_gold?.[0] || product.images?.[0]
  const imagePosition = product.productType?.includes('necklace') ? 'center top' : 'center center'
  const wishlisted = isWishlisted(product.slug)

  const toggleWishlist = () => {
    toggleItem({
      id: product.id,
      productSlug: product.slug,
      productTitle: product.title,
      productImage: image || '',
      basePrice: product.basePrice,
      category: product.category,
      productType: product.productType,
    })
    showToast(
      wishlisted ? 'Removed from wishlist' : 'Added to wishlist ♡',
      wishlisted ? 'info' : 'wishlist'
    )
  }

  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: '0 16px 40px rgba(26,16,20,0.12)' }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="jb-card-hover group relative h-full"
    >
      <Link href={`/products/${product.slug}`} className="block h-full" style={{ textDecoration: 'none' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: '480px',
            position: 'relative',
            background: '#FDF8F2',
            border: '0.5px solid #EDD9AF',
            borderRadius: '2px',
            cursor: 'pointer',
            overflow: 'hidden',
            transition: 'border-color 0.4s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <div
            className={`product-img-wrap ${imagePosition === 'center top' ? 'is-top' : ''}`}
            style={{
              width: '100%',
              height: '280px',
              flexShrink: 0,
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#FDF8F2',
            }}
          >
            {image ? (
              <Image
                src={image}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                quality={90}
                className={`img-cover ${imagePosition === 'center top' ? 'is-top' : ''}`}
                style={{
                  objectFit: 'cover',
                  objectPosition: imagePosition,
                  transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            ) : (
              <ProductPlaceholder />
            )}
            <ProductBadges isBestSeller={product.isBestSeller} isNewArrival={product.isNewArrival} />
          </div>
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', padding: '20px 16px 16px' }}>
            <p style={{ color: '#C9A961', flexShrink: 0, fontFamily: 'var(--font-jost)', fontSize: '11px', fontWeight: 500, height: '16px', letterSpacing: '0.2em', marginBottom: '8px', textTransform: 'uppercase' }}>
              {prettify(product.category)}
            </p>
            <h2 style={{ color: '#1A1014', display: '-webkit-box', flexShrink: 0, fontFamily: 'var(--font-cormorant)', fontSize: '18px', fontWeight: 500, height: '50px', lineHeight: 1.35, marginBottom: '12px', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
              {product.title}
            </h2>
            <div style={{ display: 'flex', flexShrink: 0, gap: '6px', height: '16px', marginBottom: '12px' }}>
              {product.availableMetals?.slice(0, 4).map((metal) => {
                const normalizedMetal = normalizeMetalSelection(metal)
                return (
                  <span
                    key={metal}
                    title={getMetalLabel(metal)}
                    style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: normalizedMetal ? metalSwatches[normalizedMetal] || '#EDD9AF' : '#EDD9AF', border: '0.5px solid #EDD9AF' }}
                  />
                )
              })}
            </div>
            <p style={{ alignItems: 'center', display: 'flex', flexShrink: 0, gap: '6px', height: '32px', margin: 0, marginBottom: '16px' }}>
              <span style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-jost)', fontSize: '13px', marginRight: '6px' }}>From</span>
              <span style={{ color: '#1A1014', fontFamily: 'var(--font-jost)', fontSize: '17px', fontWeight: 500 }}>{formatPrice(product.basePrice)}</span>
            </p>
            <div style={{ flex: 1 }} />
            <div data-hover-cta style={{ background: '#1A1014', border: 'none', color: '#FBF5F0', cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-jost)', fontSize: '12px', fontWeight: 500, letterSpacing: '0.12em', marginTop: 'auto', padding: '14px', textAlign: 'center', textTransform: 'uppercase', width: '100%' }}>
              Customize →
            </div>
          </div>
        </div>
      </Link>
      <button
        className="jb-wishlist-button"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          toggleWishlist()
        }}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: 'rgba(253,248,242,0.92)',
          border: wishlisted ? '1px solid #E8C4D0' : '1px solid transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(4px)',
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.background = '#FBF5F0'
          event.currentTarget.style.borderColor = '#E8C4D0'
          event.currentTarget.style.transform = 'scale(1.1)'
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.background = 'rgba(253,248,242,0.92)'
          event.currentTarget.style.borderColor = wishlisted ? '#E8C4D0' : 'transparent'
          event.currentTarget.style.transform = 'scale(1)'
        }}
        title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={wishlisted ? '#E8C4D0' : 'none'}
          stroke={wishlisted ? '#C9A5B5' : '#B8A090'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </motion.div>
  )
}

function ProductsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const typeParam = searchParams.get('type') || ''
  const categoryParam = searchParams.get('category') || ''
  const activeType = normalizeType(typeParam) || 'all'
  const shape = searchParams.get('shape') || ''
  const selectedMetal = normalizeMetalSelection(searchParams.get('metal')) || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const sort = normalizeSort(searchParams.get('sort') || 'featured')
  const searchQuery = searchParams.get('q') || ''
  const [products, setProducts] = useState<Product[]>([])
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '120', sort })
      if (typeParam) params.set('type', typeParam)
      if (categoryParam) params.set('category', categoryParam)
      if (shape) params.set('shape', shape)
      if (selectedMetal) params.set('metal', selectedMetal)
      if (minPrice) params.set('minPrice', minPrice)
      if (maxPrice) params.set('maxPrice', maxPrice)
      if (searchQuery) params.set('q', searchQuery)

      const response = await fetch(`/api/products?${params.toString()}`)
      const payload = (await response.json()) as { products?: Product[]; error?: string }

      if (!response.ok) {
        console.error('[products] load failed:', payload.error)
        throw new Error('Unable to load products.')
      }

      setProducts(payload.products || [])
    } catch (caught) {
      console.error('[products] request failed:', caught)
      setError(getGeneralErrorMessage(caught))
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [categoryParam, maxPrice, minPrice, searchQuery, selectedMetal, shape, sort, typeParam])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  useEffect(() => {
    fetch('/api/products?limit=120')
      .then((response) => response.json() as Promise<{ products?: Product[] }>)
      .then(({ products: rows }) => {
        const types = Array.from(
          new Set(
            (rows || [])
              .map((row) => row.productType)
              .filter((value): value is string => Boolean(value))
          )
        )
        setAvailableTypes(types)
      })
  }, [])

  const visibleProductTypes = useMemo(() => {
    if (!availableTypes.length) return productTypeFilters

    return productTypeFilters.filter((filter) => {
      if (filter.type === 'all') return true
      const mappedTypes = getTypeDbValues(filter.category || filter.type)
      return availableTypes.some((availableType) => mappedTypes.includes(availableType))
    })
  }, [availableTypes])

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    const query = params.toString()
    router.push(query ? `/products?${query}` : '/products')
  }, [router, searchParams])

  const updateProductTypeFilter = useCallback((filter: ProductTypeFilter) => {
    const params = new URLSearchParams(searchParams.toString())

    if (filter.type === 'all') {
      params.delete('type')
      params.delete('category')
    } else {
      params.set('type', filter.type)
      if (filter.category) {
        params.set('category', filter.category)
      } else {
        params.delete('category')
      }
    }

    const query = params.toString()
    router.push(query ? `/products?${query}` : '/products')
  }, [router, searchParams])

  const clearProductTypeFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('type')
    params.delete('category')

    const query = params.toString()
    router.push(query ? `/products?${query}` : '/products')
  }, [router, searchParams])

  const clearFilters = useCallback(() => {
    router.push('/products')
  }, [router])

  const activePills = [
    activeType !== 'all' ? { label: getFilterLabel(activeType), onRemove: clearProductTypeFilters } : null,
    categoryParam ? { label: getCategoryFilterLabel(categoryParam), onRemove: () => updateFilter('category', '') } : null,
    shape ? { label: `${prettify(shape)} Cut`, onRemove: () => updateFilter('shape', '') } : null,
    selectedMetal ? { label: getMetalLabel(selectedMetal), onRemove: () => updateFilter('metal', '') } : null,
    minPrice ? { label: `Min ${formatPrice(Number(minPrice))}`, onRemove: () => updateFilter('minPrice', '') } : null,
    maxPrice ? { label: `Max ${formatPrice(Number(maxPrice))}`, onRemove: () => updateFilter('maxPrice', '') } : null,
  ].filter((pill): pill is { label: string; onRemove: () => void } => Boolean(pill))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      style={{ backgroundColor: '#FBF5F0', minHeight: '100vh' }}
    >
      <style jsx global>{`
        .just-because-shimmer {
          animation: justBecausePulse 1.5s ease-in-out infinite;
          background: linear-gradient(90deg, #F5E8ED 0%, #FBF5F0 50%, #F5E8ED 100%);
          background-size: 200% 100%;
        }

        @keyframes justBecausePulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 80px', borderBottom: '0.5px solid #EDD9AF' }}>
        <Link href="/" style={{ fontSize: '11px', color: 'var(--color-muted-text)', textDecoration: 'none', fontFamily: 'var(--font-inter)', letterSpacing: '0.08em' }}>Home</Link>
        <span style={{ color: '#EDD9AF' }}>›</span>
        <span style={{ fontSize: '11px', color: '#1A1014', fontFamily: 'var(--font-inter)', letterSpacing: '0.08em' }}>Collection</span>
      </div>

      <header className="products-hero px-6 py-12 md:px-20 md:py-16" style={{ borderBottom: '0.5px solid #EDD9AF' }}>
        <p style={{ alignItems: 'baseline', color: '#C9A961', display: 'flex', flexWrap: 'wrap', fontFamily: 'var(--font-jost)', fontSize: '11px', fontWeight: 500, gap: '8px', letterSpacing: '0.2em', marginBottom: '10px' }}>
          <BrandLogo size="sm" />
          <span>Collection</span>
        </p>
        <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(2rem, 7vw, 4rem)', fontWeight: 400, lineHeight: 1.05, margin: 0 }}>
          Lab-grown pieces, made personal
        </h1>
      </header>

      <div className="products-filter-bar sticky top-[80px] z-50 flex flex-col gap-4 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-10 lg:px-20" style={{ backgroundColor: '#FBF5F0', borderBottom: '0.5px solid #EDD9AF' }}>
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex w-full items-center justify-center gap-2 md:hidden"
          style={{ border: '1px solid #EDD9AF', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.15em', padding: '12px' }}
        >
          <SlidersHorizontal size={15} />
          FILTER & SORT
        </button>
        <div className="flex flex-wrap gap-2">
          {activePills.length ? activePills.map((pill) => (
            <button
              key={pill.label}
              onClick={pill.onRemove}
              className="flex items-center gap-2"
              style={{ backgroundColor: '#1A1014', borderRadius: '999px', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '10px', padding: '4px 12px' }}
            >
              {pill.label}
              <X size={12} />
            </button>
          )) : (
            <span style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '14px' }}>
              No active filters
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="products-count" style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '14px' }}>{products.length} pieces</span>
          <Select value={sort} onValueChange={(value) => updateFilter('sort', value)}>
            <SelectTrigger style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', minWidth: '180px' }}>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', color: '#1A1014' }}>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {mobileFiltersOpen && (
        <button
          aria-label="Close filters"
          onClick={() => setMobileFiltersOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,16,20,0.4)', zIndex: 120 }}
        />
      )}
      <div className="flex flex-col lg:flex-row">
        <aside
          className={`products-filter-panel ${mobileFiltersOpen ? 'is-open' : ''} lg:sticky lg:top-[130px] lg:h-fit lg:w-[260px] lg:flex-shrink-0`}
          style={{ padding: '32px 24px' }}
        >
          <div className="mobile-filter-handle md:hidden" />
          <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '22px' }}>FILTER</p>

          <div style={{ marginBottom: '30px' }}>
            <p style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.16em', marginBottom: '12px' }}>PRODUCT TYPE</p>
            <div className="flex flex-wrap gap-2">
              {visibleProductTypes.map((type) => (
                <button
                  key={`${type.type}-${type.category || 'parent'}`}
                  onClick={() => updateProductTypeFilter(type)}
                  className="product-filter-pill"
                  style={{ backgroundColor: isProductTypeFilterActive(activeType, categoryParam, type) ? '#1A1014' : 'transparent', border: '0.5px solid #EDD9AF', borderRadius: '999px', color: isProductTypeFilterActive(activeType, categoryParam, type) ? '#FBF5F0' : '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', padding: '8px 12px' }}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <p style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.16em', marginBottom: '12px' }}>METAL</p>
            <div className="flex flex-wrap gap-2">
              {METALS.map((metal) => (
                <button
                  key={metal.value}
                  onClick={() => updateFilter('metal', selectedMetal === metal.value ? '' : metal.value)}
                  className="product-filter-pill flex items-center gap-2"
                  style={{ backgroundColor: selectedMetal === metal.value ? '#1A1014' : 'transparent', border: '0.5px solid #EDD9AF', borderRadius: '999px', color: selectedMetal === metal.value ? '#FBF5F0' : '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', padding: '8px 12px' }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: metal.hex, border: '0.5px solid #EDD9AF' }} />
                  {metal.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <p style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.16em', marginBottom: '12px' }}>PRICE RANGE</p>
            <div className="flex gap-2">
              <input value={minPrice} onChange={(event) => updateFilter('minPrice', event.target.value)} placeholder="Min $" type="number" style={{ width: '50%', backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', outline: 'none', padding: '10px' }} />
              <input value={maxPrice} onChange={(event) => updateFilter('maxPrice', event.target.value)} placeholder="Max $" type="number" style={{ width: '50%', backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', outline: 'none', padding: '10px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <p style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.16em', marginBottom: '12px' }}>SORT</p>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilter('sort', option.value)}
                  className="product-filter-pill"
                  style={{ backgroundColor: sort === option.value ? '#1A1014' : 'transparent', border: '0.5px solid #EDD9AF', borderRadius: '999px', color: sort === option.value ? '#FBF5F0' : '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', padding: '8px 12px' }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={clearFilters} style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.12em' }}>
            Clear all filters
          </button>
          <button
            onClick={() => setMobileFiltersOpen(false)}
            className="mt-6 w-full md:hidden"
            style={{ background: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.18em', padding: '14px' }}
          >
            SHOW RESULTS
          </button>
        </aside>

        <main className="flex-1 px-4 pb-20 pt-4 md:px-10 md:pt-8">
          {error ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center" style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF' }}>
              <Gem color="#C9A961" size={54} strokeWidth={1.1} />
              <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, margin: 0 }}>Something lost its sparkle</h2>
              <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '15px', lineHeight: 1.625, margin: 0 }}>{error}</p>
              <button onClick={loadProducts} style={{ backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.18em', padding: '12px 18px' }}>RETRY</button>
            </div>
          ) : isLoading ? (
            <div className="products-grid" style={{ alignItems: 'stretch', display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {Array.from({ length: 9 }, (_, index) => <SkeletonCard key={index} />)}
            </div>
          ) : products.length ? (
            <div className="products-grid" style={{ alignItems: 'stretch', display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <Gem color="#C9A961" size={72} strokeWidth={1.1} />
              <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, margin: 0 }}>No pieces found</h2>
              <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '15px', lineHeight: 1.625, margin: 0 }}>Try adjusting your filters.</p>
              <button onClick={clearFilters} style={{ backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.18em', padding: '12px 18px' }}>CLEAR FILTERS</button>
            </div>
          )}
        </main>
      </div>
    </motion.div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#1A1014',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <BrandLogo size="xl" className="products-loading-logo" />
          <div style={{
            width: '40px',
            height: '1px',
            background: 'linear-gradient(to right, transparent, #C9A961, transparent)',
            animation: 'expandLine 1.5s ease-in-out infinite',
            marginTop: '8px',
          }} />
          <style>{`
        @keyframes breathe {
              0%, 100% { opacity: 0.5; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.05); }
        }

        .products-loading-logo {
          animation: breathe 1.5s ease-in-out infinite;
        }

            @keyframes expandLine {
              0%,100% { width: 20px; opacity: 0.3; }
              50% { width: 60px; opacity: 1; }
            }
          `}</style>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  )
}

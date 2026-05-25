'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Gem, SlidersHorizontal, X } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useWishlist } from '@/context/WishlistContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Product = {
  id: string
  slug: string
  productType: string
  category: string
  title: string
  description: string | null
  basePrice: number
  images: string[]
  availableMetals: string[]
  availableShapes: string[]
  isNewArrival: boolean
  isFeatured: boolean
  createdAt?: string
}

const productTypes = [
  { label: 'All', value: 'all' },
  { label: 'Engagement Rings', value: 'engagement_ring' },
  { label: 'Wedding Rings', value: 'wedding_ring' },
  { label: 'Necklaces', value: 'necklace' },
  { label: 'Bracelets', value: 'bracelet' },
  { label: 'Earrings', value: 'earring' },
]

const metals = ['White Gold', 'Yellow Gold', 'Rose Gold', 'Platinum']
const metalSwatches: Record<string, string> = {
  'White Gold': '#E8E8E8',
  'Yellow Gold': '#C9A961',
  'Rose Gold': '#E8B5A8',
  Platinum: '#D0D0D0',
}

const sortOptions = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
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

function ProductPlaceholder({ size = 52 }: { size?: number }) {
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: '#F5E8ED' }}>
      <Gem color="#C9A961" size={size} strokeWidth={1.1} />
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', overflow: 'hidden' }}>
      <div className="just-because-shimmer" style={{ aspectRatio: '1', width: '100%' }} />
      <div style={{ padding: '18px 18px 22px' }}>
        <div className="just-because-shimmer" style={{ height: '10px', width: '42%', marginBottom: '12px' }} />
        <div className="just-because-shimmer" style={{ height: '20px', width: '72%', marginBottom: '14px' }} />
        <div className="just-because-shimmer" style={{ height: '16px', width: '36%' }} />
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const { toggleItem, isWishlisted } = useWishlist()
  const { showToast } = useToast()
  const image = product.images?.[0]
  const badge = product.isNewArrival ? 'NEW' : product.basePrice < 2000 ? 'POPULAR' : null
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
      whileHover={{ y: -8, boxShadow: '0 12px 40px rgba(26,16,20,0.10)' }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="group relative h-full"
    >
      <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none' }}>
        <div
          style={{
            backgroundColor: '#FDF8F2',
            border: '0.5px solid #EDD9AF',
            borderRadius: '2px',
            cursor: 'pointer',
            overflow: 'hidden',
            transition: 'border-color 0.4s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <div style={{ aspectRatio: '1', position: 'relative', overflow: 'hidden', backgroundColor: '#F5E8ED' }}>
            {image ? (
              <Image
                src={image}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 50vw, 33vw"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <ProductPlaceholder />
            )}
            {badge && (
              <span
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  backgroundColor: badge === 'NEW' ? '#1A1014' : '#E8C4D0',
                  color: badge === 'NEW' ? '#FBF5F0' : '#6B2D44',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '9px',
                  letterSpacing: '0.15em',
                  padding: '4px 10px',
                }}
              >
                {badge}
              </span>
            )}
          </div>
          <div style={{ padding: '18px 18px 22px', position: 'relative' }}>
            <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.2em', marginBottom: '7px', textTransform: 'uppercase' }}>
              {prettify(product.category)}
            </p>
            <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 400, lineHeight: 1.25, marginBottom: '9px' }}>
              {product.title}
            </h2>
            <div className="mb-3 flex items-center gap-[7px]">
              {product.availableMetals?.slice(0, 4).map((metal) => (
                <span key={metal} title={metal} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: metalSwatches[metal] || '#EDD9AF', border: '0.5px solid #EDD9AF' }} />
              ))}
            </div>
            <p style={{ margin: 0 }}>
              <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px', marginRight: '6px' }}>From</span>
              <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '16px', fontWeight: 500 }}>{formatPrice(product.basePrice)}</span>
            </p>
            <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0" style={{ backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.18em', padding: '11px', textAlign: 'center' }}>
              Customize →
            </div>
          </div>
        </div>
      </Link>
      <button
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
  const initialType = searchParams.get('type') || searchParams.get('category') || 'all'
  const initialShape = searchParams.get('shape') || ''
  const [products, setProducts] = useState<Product[]>([])
  const [selectedType, setSelectedType] = useState(initialType)
  const [selectedMetals, setSelectedMetals] = useState<string[]>([])
  const [shape, setShape] = useState(initialShape)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('featured')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '80' })
      if (selectedType !== 'all') {
        params.set('type', selectedType)
      }

      const response = await fetch(`/api/products?${params.toString()}`)
      const payload = (await response.json()) as { products?: Product[]; error?: string }
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to load products.')
      }
      setProducts(payload.products || [])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load products.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedType])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  useEffect(() => {
    setShape(searchParams.get('shape') || '')
  }, [searchParams])

  const filtered = useMemo(() => {
    let list = [...products]

    if (selectedMetals.length) {
      list = list.filter((product) =>
        selectedMetals.some((metal) => product.availableMetals?.includes(metal))
      )
    }

    if (shape) {
      list = list.filter((product) =>
        product.availableShapes?.some((item) => item.toLowerCase() === shape.toLowerCase())
      )
    }

    if (minPrice) {
      list = list.filter((product) => product.basePrice >= Number(minPrice))
    }

    if (maxPrice) {
      list = list.filter((product) => product.basePrice <= Number(maxPrice))
    }

    if (sort === 'price-asc') {
      list.sort((a, b) => a.basePrice - b.basePrice)
    } else if (sort === 'price-desc') {
      list.sort((a, b) => b.basePrice - a.basePrice)
    } else if (sort === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    } else {
      list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    }

    return list
  }, [products, selectedMetals, shape, minPrice, maxPrice, sort])

  const activePills = [
    selectedType !== 'all' ? { label: prettify(selectedType), onRemove: () => setSelectedType('all') } : null,
    shape ? { label: `${prettify(shape)} Cut`, onRemove: () => setShape('') } : null,
    ...selectedMetals.map((metal) => ({ label: metal, onRemove: () => setSelectedMetals((items) => items.filter((item) => item !== metal)) })),
    minPrice ? { label: `Min ${formatPrice(Number(minPrice))}`, onRemove: () => setMinPrice('') } : null,
    maxPrice ? { label: `Max ${formatPrice(Number(maxPrice))}`, onRemove: () => setMaxPrice('') } : null,
  ].filter((pill): pill is { label: string; onRemove: () => void } => Boolean(pill))

  const toggleMetal = (metal: string) => {
    setSelectedMetals((items) =>
      items.includes(metal) ? items.filter((item) => item !== metal) : [...items, metal]
    )
  }

  const clearFilters = () => {
    setSelectedType('all')
    setSelectedMetals([])
    setShape('')
    setMinPrice('')
    setMaxPrice('')
    setSort('featured')
  }

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
        <Link href="/" style={{ fontSize: '11px', color: '#B8A090', textDecoration: 'none', fontFamily: 'var(--font-inter)', letterSpacing: '0.08em' }}>Home</Link>
        <span style={{ color: '#EDD9AF' }}>›</span>
        <span style={{ fontSize: '11px', color: '#1A1014', fontFamily: 'var(--font-inter)', letterSpacing: '0.08em' }}>Collection</span>
      </div>

      <header className="px-6 py-12 md:px-20 md:py-16" style={{ borderBottom: '0.5px solid #EDD9AF' }}>
        <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '10px' }}>
          JUST BECAUSE COLLECTION
        </p>
        <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: 'clamp(34px, 5vw, 52px)', fontWeight: 400, lineHeight: 1.05, margin: 0 }}>
          Lab-grown pieces, made personal
        </h1>
      </header>

      <div className="sticky top-[80px] z-50 flex flex-col gap-4 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-10 lg:px-20" style={{ backgroundColor: '#FBF5F0', borderBottom: '0.5px solid #EDD9AF' }}>
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
            <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>
              No active filters
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{filtered.length} pieces</span>
          <Select value={sort} onValueChange={setSort}>
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
              {productTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  style={{ backgroundColor: selectedType === type.value ? '#1A1014' : 'transparent', border: '0.5px solid #EDD9AF', borderRadius: '999px', color: selectedType === type.value ? '#FBF5F0' : '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', padding: '8px 12px' }}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <p style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.16em', marginBottom: '12px' }}>METAL</p>
            <div className="flex flex-wrap gap-2">
              {metals.map((metal) => (
                <button
                  key={metal}
                  onClick={() => toggleMetal(metal)}
                  className="flex items-center gap-2"
                  style={{ backgroundColor: selectedMetals.includes(metal) ? '#1A1014' : 'transparent', border: '0.5px solid #EDD9AF', borderRadius: '999px', color: selectedMetals.includes(metal) ? '#FBF5F0' : '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', padding: '8px 12px' }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: metalSwatches[metal], border: '0.5px solid #EDD9AF' }} />
                  {metal}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <p style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.16em', marginBottom: '12px' }}>PRICE RANGE</p>
            <div className="flex gap-2">
              <input value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Min $" type="number" style={{ width: '50%', backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', outline: 'none', padding: '10px' }} />
              <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Max $" type="number" style={{ width: '50%', backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', outline: 'none', padding: '10px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <p style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.16em', marginBottom: '12px' }}>SORT</p>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSort(option.value)}
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
              <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '14px', margin: 0 }}>{error}</p>
              <button onClick={loadProducts} style={{ backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.18em', padding: '12px 18px' }}>RETRY</button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
              {Array.from({ length: 9 }, (_, index) => <SkeletonCard key={index} />)}
            </div>
          ) : filtered.length ? (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
              {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <Gem color="#C9A961" size={72} strokeWidth={1.1} />
              <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, margin: 0 }}>No pieces found</h2>
              <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '14px', margin: 0 }}>Try adjusting your filters.</p>
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
            minHeight: '100vh',
            background: '#FBF5F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '18px',
              color: '#B8A090',
            }}
          >
            Loading...
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  )
}

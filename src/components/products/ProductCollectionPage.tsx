'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Gem } from 'lucide-react'
import { ProductBadges } from '@/components/products/ProductBadges'

type Product = {
  id: string
  slug: string
  productType: string
  category: string
  title: string
  basePrice: number
  images: string[]
  metalImages?: {
    white_gold?: string[]
    yellow_gold?: string[]
    rose_gold?: string[]
    platinum?: string[]
  } | null
  availableMetals: string[]
  isBestSeller: boolean
  isNewArrival: boolean
}

type ProductCollectionPageProps = {
  title: string
  subtitle: string
  query: string
  emptyTitle: string
  emptyText: string
}

const metalSwatches: Record<string, string> = {
  'White Gold': '#E8E8E8',
  white_gold: '#E8E8E8',
  'Yellow Gold': '#C9A961',
  yellow_gold: '#C9A961',
  'Rose Gold': '#E8B5A8',
  rose_gold: '#E8B5A8',
  Platinum: '#D0D0D0',
  platinum: '#D0D0D0',
}

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

function ProductPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: '#F5E8ED' }}>
      <Gem color="#C9A961" size={56} strokeWidth={1.05} />
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', display: 'flex', flexDirection: 'column', minHeight: '480px', overflow: 'hidden' }}>
      <div className="just-because-shimmer" style={{ flexShrink: 0, height: '280px', width: '100%' }} />
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', padding: '20px 16px 16px' }}>
        <div className="just-because-shimmer" style={{ height: '10px', marginBottom: '12px', width: '42%' }} />
        <div className="just-because-shimmer" style={{ height: '20px', marginBottom: '14px', width: '72%' }} />
        <div className="just-because-shimmer" style={{ height: '16px', width: '36%' }} />
        <div style={{ flex: 1 }} />
        <div className="just-because-shimmer" style={{ height: '46px', width: '100%' }} />
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const image = product.metalImages?.white_gold?.[0] || product.images?.[0]
  const imagePosition = product.productType?.includes('necklace') ? 'center top' : 'center center'

  return (
    <motion.article
      whileHover={{ y: -8, boxShadow: '0 16px 40px rgba(26,16,20,0.12)' }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="jb-card-hover group relative h-full"
    >
      <Link href={`/products/${product.slug}`} className="block h-full" style={{ textDecoration: 'none' }}>
        <div
          style={{
            background: '#FDF8F2',
            border: '0.5px solid #EDD9AF',
            borderRadius: '2px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: '480px',
            overflow: 'hidden',
            position: 'relative',
            transition: 'border-color 0.4s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <div
            className={`product-img-wrap ${imagePosition === 'center top' ? 'is-top' : ''}`}
            style={{
              backgroundColor: '#FDF8F2',
              flexShrink: 0,
              height: '280px',
              overflow: 'hidden',
              position: 'relative',
              width: '100%',
            }}
          >
            {image ? (
              <Image
                src={image}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
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
            <p style={{ color: '#C9A961', flexShrink: 0, fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 500, height: '16px', letterSpacing: '0.2em', marginBottom: '8px', textTransform: 'uppercase' }}>
              {prettify(product.category)}
            </p>
            <h2 style={{ color: '#1A1014', display: '-webkit-box', flexShrink: 0, fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 500, height: '50px', lineHeight: 1.35, marginBottom: '12px', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
              {product.title}
            </h2>
            <div style={{ display: 'flex', flexShrink: 0, gap: '6px', height: '16px', marginBottom: '12px' }}>
              {product.availableMetals?.slice(0, 4).map((metal) => (
                <span
                  key={metal}
                  title={prettify(metal)}
                  style={{ backgroundColor: metalSwatches[metal] || '#EDD9AF', border: '0.5px solid #EDD9AF', borderRadius: '50%', height: '8px', width: '8px' }}
                />
              ))}
            </div>
            <p style={{ alignItems: 'center', display: 'flex', flexShrink: 0, gap: '6px', height: '32px', margin: 0, marginBottom: '16px' }}>
              <span style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '13px', marginRight: '6px' }}>From</span>
              <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '17px', fontWeight: 500 }}>{formatPrice(product.basePrice)}</span>
            </p>
            <div style={{ flex: 1 }} />
            <div data-hover-cta style={{ background: '#1A1014', border: 'none', color: '#FBF5F0', flexShrink: 0, fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 500, letterSpacing: '0.12em', marginTop: 'auto', padding: '14px', textAlign: 'center', textTransform: 'uppercase', width: '100%' }}>
              Customize -&gt;
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

export function ProductCollectionPage({
  title,
  subtitle,
  query,
  emptyTitle,
  emptyText,
}: ProductCollectionPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/products?${query}`)
      const payload = (await response.json()) as { products?: Product[]; error?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to load products.')
      }

      setProducts(payload.products || [])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load products.')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [query])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  return (
    <motion.main
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

      <div style={{ alignItems: 'center', borderBottom: '0.5px solid #EDD9AF', display: 'flex', gap: '8px', padding: '16px clamp(24px, 6vw, 80px)' }}>
        <Link href="/" style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em', textDecoration: 'none' }}>Home</Link>
        <span style={{ color: '#EDD9AF' }}>/</span>
        <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em' }}>{title}</span>
      </div>

      <header className="px-6 py-12 md:px-20 md:py-16" style={{ borderBottom: '0.5px solid #EDD9AF' }}>
        <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.3em', marginBottom: '12px', textTransform: 'uppercase' }}>
          Collection
        </p>
        <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: 'clamp(2.4rem, 7vw, 4.75rem)', fontWeight: 400, lineHeight: 1.05, margin: 0 }}>
          {title}
        </h1>
        <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '15px', lineHeight: 1.8, margin: '18px 0 0', maxWidth: '620px' }}>
          {subtitle}
        </p>
      </header>

      <section className="px-4 py-10 md:px-10 md:py-14 lg:px-20">
        {error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center" style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF' }}>
            <Gem color="#C9A961" size={54} strokeWidth={1.1} />
            <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, margin: 0 }}>Something lost its sparkle</h2>
            <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '15px', lineHeight: 1.625, margin: 0 }}>{error}</p>
            <button onClick={loadProducts} style={{ backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.18em', padding: '12px 18px' }}>RETRY</button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => <SkeletonCard key={index} />)}
          </div>
        ) : products.length ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center" style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF' }}>
            <Gem color="#C9A961" size={72} strokeWidth={1.1} />
            <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, margin: 0 }}>{emptyTitle}</h2>
            <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '15px', lineHeight: 1.625, margin: 0 }}>{emptyText}</p>
          </div>
        )}
      </section>
    </motion.main>
  )
}

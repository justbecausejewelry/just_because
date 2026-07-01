'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  HomeProductCard,
  HomeProductSkeletonCard,
  type HomeMerchProduct,
} from '@/components/home/HomeProductCard'

type BestSellerFilter = {
  label: string
  value: 'all' | 'rings' | 'necklaces' | 'earrings' | 'bracelets'
}

const filters: BestSellerFilter[] = [
  { label: 'All', value: 'all' },
  { label: 'Rings', value: 'rings' },
  { label: 'Necklaces', value: 'necklaces' },
  { label: 'Earrings', value: 'earrings' },
  { label: 'Bracelets', value: 'bracelets' },
]

function matchesFilter(product: HomeMerchProduct, filter: BestSellerFilter['value']) {
  if (filter === 'all') return true
  if (filter === 'rings') {
    return product.productType === 'ring' || product.productType === 'engagement_ring'
  }
  if (filter === 'necklaces') return product.productType === 'necklace'
  if (filter === 'earrings') return product.productType === 'earring'
  return product.productType === 'bracelet'
}

export function BestSellers() {
  const [activeFilter, setActiveFilter] = useState<BestSellerFilter['value']>('all')
  const [products, setProducts] = useState<HomeMerchProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadProducts = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/products?bestSeller=true&sort=newest&limit=8')
        const payload = (await response.json()) as { products?: HomeMerchProduct[]; error?: string }

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to load best sellers.')
        }

        if (!cancelled) {
          setProducts(payload.products || [])
        }
      } catch (caught) {
        if (!cancelled) {
          setProducts([])
          setError(caught instanceof Error ? caught.message : 'Unable to load best sellers.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadProducts()

    return () => {
      cancelled = true
    }
  }, [])

  const visibleProducts = useMemo(
    () => products.filter((product) => matchesFilter(product, activeFilter)).slice(0, 8),
    [activeFilter, products]
  )

  return (
    <section
      className="px-5 py-12 md:px-10 md:py-20 lg:px-20"
      style={{ backgroundColor: '#FBF5F0' }}
    >
      <style jsx global>{`
        .home-merch-shimmer {
          animation: homeMerchPulse 1.4s ease-in-out infinite;
          background: linear-gradient(90deg, rgba(184,160,144,0.18), rgba(237,217,175,0.28), rgba(184,160,144,0.18));
          background-size: 220% 100%;
        }

        .home-product-card:hover .home-product-img {
          transform: scale(1.03);
        }

        .home-product-card:hover .home-product-image button {
          transform: scale(1.06);
        }

        .best-seller-tabs {
          justify-content: flex-start;
          scrollbar-width: none;
        }

        .best-seller-tabs::-webkit-scrollbar {
          display: none;
        }

        @media (min-width: 768px) {
          .best-seller-tabs {
            justify-content: center;
          }
        }

        @keyframes homeMerchPulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="mx-auto max-w-[1440px]">
        <div className="text-center">
          <p
            style={{
              color: '#C9A961',
              fontFamily: 'var(--font-inter)',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.3em',
              marginBottom: '14px',
              textTransform: 'uppercase',
            }}
          >
            BEST SELLERS
          </p>
          <div style={{ backgroundColor: '#C9A961', height: '1px', margin: '0 auto 18px', width: '60px' }} />
          <h2
            style={{
              color: '#1A1014',
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              fontWeight: 400,
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            Loved by everyone.
          </h2>
          <p
            style={{
              color: '#1A1014',
              fontFamily: 'var(--font-inter)',
              fontSize: '15px',
              lineHeight: 1.8,
              margin: '10px 0 0',
            }}
          >
            For good reason.
          </p>
        </div>

        <div
          className="best-seller-tabs mt-9 flex gap-3 overflow-x-auto pb-1"
        >
          {filters.map((filter) => {
            const active = activeFilter === filter.value
            return (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                style={{
                  backgroundColor: active ? '#1A1014' : 'transparent',
                  border: `1px solid ${active ? '#1A1014' : '#B8A090'}`,
                  color: active ? '#FBF5F0' : '#B8A090',
                  cursor: 'pointer',
                  flex: '0 0 auto',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  padding: '8px 20px',
                  textTransform: 'uppercase',
                  transition: 'border-color 0.3s ease, color 0.3s ease, background-color 0.3s ease',
                }}
                onMouseEnter={(event) => {
                  if (!active) {
                    event.currentTarget.style.borderColor = '#1A1014'
                    event.currentTarget.style.color = '#1A1014'
                  }
                }}
                onMouseLeave={(event) => {
                  if (!active) {
                    event.currentTarget.style.borderColor = '#B8A090'
                    event.currentTarget.style.color = '#B8A090'
                  }
                }}
              >
                {filter.label}
              </button>
            )
          })}
        </div>

        {error ? (
          <div
            className="mt-10 py-16 text-center"
            style={{
              border: '0.5px solid #EDD9AF',
              color: '#B8A090',
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        ) : isLoading ? (
          <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => <HomeProductSkeletonCard key={index} />)}
          </div>
        ) : visibleProducts.length ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4"
            >
              {visibleProducts.map((product) => (
                <HomeProductCard
                  badgeLabel="BEST SELLER"
                  badgeTone="noir"
                  key={product.id}
                  product={product}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div
            className="mt-10 py-16 text-center"
            style={{
              border: '0.5px solid #EDD9AF',
              color: '#B8A090',
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
              lineHeight: 1.8,
            }}
          >
            Coming soon. Check back for our most loved pieces.
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/best-sellers"
            style={{
              color: '#C9A961',
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.15em',
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            View all best sellers -&gt;
          </Link>
        </div>
      </div>
    </section>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  HomeProductCard,
  HomeProductSkeletonCard,
  type HomeMerchProduct,
} from '@/components/home/HomeProductCard'

export function NewArrivals() {
  const [products, setProducts] = useState<HomeMerchProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadProducts = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/products?newArrival=true&sort=newest&limit=8')
        const payload = (await response.json()) as { products?: HomeMerchProduct[]; error?: string }

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to load new arrivals.')
        }

        if (!cancelled) {
          setProducts(payload.products || [])
        }
      } catch (caught) {
        if (!cancelled) {
          setProducts([])
          setError(caught instanceof Error ? caught.message : 'Unable to load new arrivals.')
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

  return (
    <section
      className="px-5 py-12 md:px-10 md:py-20 lg:px-20"
      style={{ backgroundColor: '#FDF8F2' }}
    >
      <style jsx global>{`
        .new-arrivals-track {
          display: grid;
          gap: 24px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        @media (max-width: 767px) {
          .new-arrivals-track {
            display: flex;
            margin-left: -20px;
            margin-right: -20px;
            overflow-x: auto;
            padding: 0 20px 8px;
            scroll-snap-type: x mandatory;
            scrollbar-width: none;
          }

          .new-arrivals-track::-webkit-scrollbar {
            display: none;
          }

          .new-arrivals-track > * {
            flex: 0 0 66%;
            scroll-snap-align: start;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1440px]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-120px' }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="text-center"
        >
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
            NEW ARRIVALS
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
            Just landed.
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
            Already loved.
          </p>
        </motion.div>

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
          <div className="new-arrivals-track mt-10">
            {Array.from({ length: 4 }, (_, index) => <HomeProductSkeletonCard key={index} />)}
          </div>
        ) : products.length ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="new-arrivals-track mt-10"
          >
            {products.slice(0, 8).map((product) => (
              <HomeProductCard
                badgeLabel="NEW"
                badgeTone="gold"
                key={product.id}
                product={product}
              />
            ))}
          </motion.div>
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
            New pieces dropping soon. Follow us for first access.
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/new-arrivals"
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
            View all new arrivals -&gt;
          </Link>
        </div>
      </div>
    </section>
  )
}

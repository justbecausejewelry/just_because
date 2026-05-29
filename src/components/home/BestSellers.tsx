'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Gem } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useWishlist } from '@/context/WishlistContext'

type Product = {
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
  availableMetals: string[]
  isNewArrival: boolean
}

const metalSwatches: Record<string, string> = {
  'White Gold': '#E8E8E8',
  'Yellow Gold': '#C9A961',
  'Rose Gold': '#E8B5A8',
  Platinum: '#D0D0D0',
}

function formatCategory(category: string) {
  return category.replace(/_/g, ' ').toUpperCase()
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

function ProductPlaceholder() {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ backgroundColor: '#F5E8ED' }}
    >
      <Gem color="#C9A961" size={46} strokeWidth={1.1} />
    </div>
  )
}

function SkeletonCard() {
  return (
    <div
      style={{
        backgroundColor: '#FDF8F2',
        border: '0.5px solid #EDD9AF',
        borderRadius: '2px',
        overflow: 'hidden',
      }}
    >
      <div
        className="just-because-shimmer"
        style={{ aspectRatio: '1', width: '100%' }}
      />
      <div style={{ padding: '14px 16px 18px' }}>
        <div
          className="just-because-shimmer"
          style={{ height: '9px', width: '45%', marginBottom: '10px' }}
        />
        <div
          className="just-because-shimmer"
          style={{ height: '18px', width: '75%', marginBottom: '12px' }}
        />
        <div
          className="just-because-shimmer"
          style={{ height: '14px', width: '38%' }}
        />
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const { toggleItem, isWishlisted } = useWishlist()
  const { showToast } = useToast()
  const image = product.metalImages?.white_gold?.[0] || product.images?.[0]
  const badge = product.isNewArrival
    ? 'NEW'
    : product.basePrice < 2000
      ? 'POPULAR'
      : null
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
      whileHover={{
        y: -8,
        boxShadow: '0 16px 40px rgba(26,16,20,0.12)',
      }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="best-seller-card jb-card-hover group relative h-full"
    >
      <Link
        href={`/products/${product.slug}`}
        className="block h-full"
        style={{ textDecoration: 'none' }}
      >
        <div
          className="h-full overflow-hidden"
          style={{
            backgroundColor: '#FDF8F2',
            border: '0.5px solid #EDD9AF',
            borderRadius: '2px',
            cursor: 'pointer',
            transition:
              'border-color 0.4s cubic-bezier(0.4,0,0.2,1), box-shadow 0.4s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <div
            style={{
              aspectRatio: '1',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#F5E8ED',
            }}
          >
            {image ? (
              <Image
                src={image}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                style={{ objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)' }}
              />
            ) : (
              <ProductPlaceholder />
            )}

            {badge && (
              <span
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
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

          <div style={{ padding: '14px 16px 18px', position: 'relative' }}>
            <p
              style={{
                color: '#C9A961',
                fontFamily: 'var(--font-inter)',
                fontSize: '9px',
                letterSpacing: '0.2em',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}
            >
              {formatCategory(product.category)}
            </p>
            <h3
              style={{
                color: '#1A1014',
                fontFamily: 'var(--font-playfair)',
                fontSize: '15px',
                fontWeight: 400,
                lineHeight: 1.3,
                marginBottom: '8px',
              }}
            >
              {product.title}
            </h3>

            <div className="mb-[10px] flex items-center gap-[6px]">
              {product.availableMetals?.slice(0, 4).map((metal) => (
                <span
                  key={metal}
                  title={metal}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: metalSwatches[metal] || '#EDD9AF',
                    border: '0.5px solid #EDD9AF',
                  }}
                />
              ))}
            </div>

            <div className="flex items-end justify-between gap-3">
              <p style={{ margin: 0 }}>
                <span
                  style={{
                    color: '#B8A090',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '10px',
                    marginRight: '6px',
                  }}
                >
                  From
                </span>
                <span
                  style={{
                    color: '#1A1014',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '15px',
                    fontWeight: 500,
                  }}
                >
                  {formatPrice(product.basePrice)}
                </span>
              </p>
            </div>

            <div
              data-hover-cta
              className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0"
              style={{
                backgroundColor: '#1A1014',
                color: '#FBF5F0',
                fontFamily: 'var(--font-inter)',
                fontSize: '10px',
                letterSpacing: '0.18em',
                padding: '10px',
                textAlign: 'center',
                width: '100%',
              }}
            >
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
          top: '10px',
          right: '10px',
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

export function BestSellers() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProducts = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/products?featured=true&limit=5')
      const payload = (await response.json()) as {
        products?: Product[]
        error?: string
      }

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to load best sellers.')
      }

      setProducts(payload.products || [])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load best sellers.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadProducts()
  }, [])

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-120px' }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      className="px-6 py-12 md:px-10 md:py-[60px] lg:px-20 lg:py-24"
      style={{ backgroundColor: '#FBF5F0' }}
    >
      <style jsx global>{`
        .just-because-shimmer {
          animation: justBecausePulse 1.5s ease-in-out infinite;
          background: linear-gradient(90deg, #F5E8ED 0%, #FBF5F0 50%, #F5E8ED 100%);
          background-size: 200% 100%;
        }

        @keyframes justBecausePulse {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>

      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p
            style={{
              color: '#C9A961',
              fontFamily: 'var(--font-inter)',
              fontSize: '10px',
              letterSpacing: '0.3em',
              marginBottom: '10px',
            }}
          >
            BEST SELLERS
          </p>
          <h2
            style={{
              color: '#1A1014',
              fontFamily: 'var(--font-playfair)',
              fontSize: '32px',
              fontWeight: 400,
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            Loved by everyone
          </h2>
        </div>
        <Link
          href="/products"
          className="jb-gold-link"
          style={{
            color: '#C9A961',
            fontFamily: 'var(--font-inter)',
            fontSize: '11px',
            letterSpacing: '0.12em',
            textDecoration: 'none',
          }}
        >
          View all pieces →
        </Link>
      </div>

      {error ? (
        <div
          className="mt-12 flex flex-col items-center justify-center gap-4 py-16"
          style={{
            backgroundColor: '#FDF8F2',
            border: '0.5px solid #EDD9AF',
            color: '#B8A090',
            fontFamily: 'var(--font-inter)',
          }}
        >
          <p>{error}</p>
          <button
            onClick={loadProducts}
            style={{
              backgroundColor: '#1A1014',
              color: '#FBF5F0',
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              letterSpacing: '0.18em',
              padding: '12px 18px',
            }}
          >
            RETRY
          </button>
        </div>
      ) : (
        <div className="best-sellers-grid mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {isLoading
            ? Array.from({ length: 5 }, (_, index) => <SkeletonCard key={index} />)
            : products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      )}
    </motion.section>
  )
}

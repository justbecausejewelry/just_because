'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { useWishlist } from '@/context/WishlistContext'

export type HomeMerchProduct = {
  id: string
  slug: string
  title: string
  category: string
  productType: string
  basePrice: number
  diamondShape?: string | null
  images: string[]
  metalImages?: {
    white_gold?: string[]
    yellow_gold?: string[]
    rose_gold?: string[]
    platinum?: string[]
  } | null
  availableMetals?: string[]
  availableShapes?: string[]
  isBestSeller?: boolean | null
  isNewArrival?: boolean | null
}

type HomeProductCardProps = {
  badgeLabel: 'BEST SELLER' | 'NEW'
  badgeTone: 'noir' | 'gold'
  product: HomeMerchProduct
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(price)
}

function normalizeMetal(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function defaultMetalSelection(availableMetals?: string[]) {
  const metals = (availableMetals || []).map(normalizeMetal)
  if (metals.includes('white_gold')) return 'white_gold'
  return metals[0] || 'white_gold'
}

function isRingProduct(productType: string) {
  return productType === 'ring' || productType === 'engagement_ring' || productType === 'wedding_ring'
}

export function HomeProductSkeletonCard() {
  return (
    <div>
      <div
        className="home-merch-shimmer"
        style={{
          aspectRatio: '3 / 4',
          backgroundColor: '#FBF5F0',
          border: '0.5px solid #EDD9AF',
          overflow: 'hidden',
        }}
      />
      <div className="home-merch-shimmer" style={{ height: '15px', marginTop: '12px', width: '72%' }} />
      <div className="home-merch-shimmer" style={{ height: '13px', marginTop: '8px', width: '34%' }} />
      <div className="home-merch-shimmer" style={{ height: '38px', marginTop: '12px', width: '100%' }} />
    </div>
  )
}

export function HomeProductCard({ badgeLabel, badgeTone, product }: HomeProductCardProps) {
  const { addItem } = useCart()
  const { showToast } = useToast()
  const { isWishlisted, toggleItem } = useWishlist()
  const image = product.metalImages?.white_gold?.[0] || product.images?.[0]
  const wishlisted = isWishlisted(product.slug)

  const handleWishlist = async () => {
    const saved = await toggleItem({
      basePrice: product.basePrice,
      category: product.category,
      id: product.id,
      productImage: image || '',
      productSlug: product.slug,
      productTitle: product.title,
      productType: product.productType,
    })

    showToast(
      saved
        ? wishlisted
          ? 'Removed from wishlist'
          : 'Saved to wishlist'
        : 'Please sign in to save this piece.',
      saved ? (wishlisted ? 'info' : 'wishlist') : 'info'
    )
  }

  const handleAddToCart = async () => {
    const selectedMetal = defaultMetalSelection(product.availableMetals)
    const selectedShape = isRingProduct(product.productType)
      ? product.diamondShape || product.availableShapes?.[0] || 'Round'
      : undefined

    await addItem({
      engraving: undefined,
      priceBreakdown: {
        base: product.basePrice,
        carat: 0,
        clarity: 0,
        color: 0,
        metal: 0,
        shape: 0,
      },
      productId: product.id,
      productImage: image || '',
      productSlug: product.slug,
      productTitle: product.title,
      quantity: 1,
      ringSize: undefined,
      selectedCarat: 0,
      selectedClarity: undefined,
      selectedColor: undefined,
      selectedMetal,
      selectedShape,
      unitPrice: product.basePrice,
    })
    showToast('Added to cart successfully', 'success')
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="home-product-card"
      style={{ minWidth: 0 }}
    >
      <div
        className="home-product-image"
        style={{
          aspectRatio: '3 / 4',
          backgroundColor: '#FBF5F0',
          border: '0.5px solid #EDD9AF',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Link href={`/products/${product.slug}`} aria-label={product.title}>
          {image ? (
            <Image
              alt={product.title}
              className="home-product-img"
              fill
              quality={90}
              sizes="(max-width: 767px) 50vw, (max-width: 1023px) 50vw, 25vw"
              src={image}
              style={{
                objectFit: 'cover',
                transition: 'transform 0.3s ease',
              }}
            />
          ) : (
            <div
              style={{
                alignItems: 'center',
                background: 'linear-gradient(135deg, #FBF5F0, #EDD9AF)',
                display: 'flex',
                height: '100%',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,97,0.62)" strokeWidth="0.8">
                <path d="M6 3h12l4 6-10 13L2 9z" />
                <path d="M2 9h20" />
              </svg>
            </div>
          )}
        </Link>

        <span
          style={{
            backgroundColor: badgeTone === 'noir' ? '#1A1014' : '#C9A961',
            color: badgeTone === 'noir' ? '#FBF5F0' : '#1A1014',
            fontFamily: 'var(--font-inter)',
            fontSize: '9px',
            fontWeight: 500,
            left: '10px',
            letterSpacing: '0.1em',
            padding: '4px 8px',
            position: 'absolute',
            textTransform: 'uppercase',
            top: '10px',
            zIndex: 3,
          }}
        >
          {badgeLabel}
        </span>

        <button
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void handleWishlist()
          }}
          style={{
            alignItems: 'center',
            backgroundColor: 'rgba(251,245,240,0.88)',
            border: '0.5px solid #EDD9AF',
            borderRadius: '50%',
            color: '#C9A961',
            cursor: 'pointer',
            display: 'flex',
            height: '32px',
            justifyContent: 'center',
            position: 'absolute',
            right: '10px',
            top: '10px',
            transition: 'transform 0.3s ease, background-color 0.3s ease',
            width: '32px',
            zIndex: 4,
          }}
        >
          <Heart fill={wishlisted ? '#C9A961' : 'transparent'} size={15} strokeWidth={1.5} />
        </button>
      </div>

      <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none' }}>
        <h3
          style={{
            color: '#1A1014',
            fontFamily: 'var(--font-playfair)',
            fontSize: '15px',
            fontWeight: 400,
            lineHeight: 1.35,
            margin: '12px 0 6px',
          }}
        >
          {product.title}
        </h3>
      </Link>
      <p
        style={{
          color: '#1A1014',
          fontFamily: 'var(--font-inter)',
          fontSize: '13px',
          margin: '0 0 12px',
        }}
      >
        {formatPrice(product.basePrice)}
      </p>
      <button
        onClick={() => {
          void handleAddToCart()
        }}
        style={{
          backgroundColor: 'transparent',
          border: '1px solid #1A1014',
          color: '#1A1014',
          cursor: 'pointer',
          fontFamily: 'var(--font-inter)',
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.15em',
          padding: '10px',
          textTransform: 'uppercase',
          transition: 'background-color 0.3s ease, color 0.3s ease',
          width: '100%',
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.backgroundColor = '#1A1014'
          event.currentTarget.style.color = '#FBF5F0'
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.backgroundColor = 'transparent'
          event.currentTarget.style.color = '#1A1014'
        }}
      >
        ADD TO CART
      </button>
    </motion.article>
  )
}

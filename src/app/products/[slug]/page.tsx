'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Gem, Heart, RotateCcw, Share2, ShieldCheck, Sparkles, Star } from 'lucide-react'
import ProductAccordion from '@/components/product/ProductAccordion'
import ShareModal from '@/components/product/ShareModal'
import { ProductBadges } from '@/components/products/ProductBadges'
import ProductCustomizer, { productNeedsRingSize } from '@/components/products/ProductCustomizer'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { useWishlist } from '@/context/WishlistContext'
import { getMetalLabel, normalizeMetalSelection } from '@/config/productOptions'
import { supabaseAuth } from '@/lib/auth'
import { getGeneralErrorMessage } from '@/lib/errors'

type PricingMap = Record<string, { enabled?: boolean; modifier?: number }>
type MetalImages = Record<string, string[] | undefined>

type Product = {
  id: string
  slug: string
  productType: string
  category: string
  title: string
  description: string | null
  basePrice: number
  pricePerCarat?: number | null
  diamondShape?: string | null
  defaultCarat?: number | null
  metalPricing: PricingMap
  caratPricing: PricingMap
  shapePricing: PricingMap
  colorPricing: PricingMap
  clarityPricing: PricingMap
  availableMetals: string[]
  availableCarats: number[]
  availableShapes: string[]
  availableColors: string[]
  availableClarities: string[]
  availableSizes: string[]
  engravingAllowed: boolean
  engravingMaxChars: number
  images: string[]
  metalImages?: MetalImages | null
  totalCaratWeight?: string | number | null
  colorGrade?: string | null
  clarity?: string | null
  cut?: string | null
  metalKarat?: string | null
  settingStyle?: string | null
  dimensions?: string | null
  isBestSeller?: boolean | null
  isNewArrival?: boolean | null
}

type Review = {
  id: string
  customerName: string
  rating: number
  title: string | null
  comment: string | null
  createdAt: string
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

function isRingProduct(productType?: string | null, category?: string | null) {
  const type = (productType || '').toLowerCase()
  const cat = (category || '').toLowerCase()
  return ['engagement_ring', 'wedding_ring', 'ring'].includes(type) || cat === 'engagement' || cat === 'wedding'
}

function validImageUrl(image: string | null | undefined): image is string {
  if (!image) return false
  const trimmed = image.trim()
  return Boolean(trimmed) && !trimmed.endsWith('?') && !trimmed.includes('undefined') && !trimmed.includes('null')
}

function normalizeCaratOptions(options?: number[] | null) {
  return Array.from(
    new Set(
      (options || [])
        .map((option) => Number(option))
        .filter((option) => Number.isFinite(option) && option > 0)
    )
  ).sort((left, right) => left - right)
}

function defaultMetalSelection(availableMetals?: string[] | null) {
  const normalizedMetals = (availableMetals || [])
    .map((metal) => normalizeMetalSelection(metal))
    .filter(Boolean)

  if (normalizedMetals.includes('white_gold')) return 'white_gold'
  return normalizedMetals[0] || 'white_gold'
}

function getModifier(pricing: PricingMap | null | undefined, key?: string | number) {
  if (key === undefined || key === null || !pricing) return 0
  const entry = pricing[String(key)]
  if (!entry?.enabled) return 0
  return typeof entry.modifier === 'number' ? entry.modifier : 0
}

function ProductPlaceholder({ size = 72 }: { size?: number }) {
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: '#F5E8ED' }}>
      <Gem color="#C9A961" size={size} strokeWidth={1.05} />
    </div>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={14}
          color="#C9A961"
          fill={index < rating ? '#C9A961' : 'transparent'}
          strokeWidth={1.4}
        />
      ))}
    </div>
  )
}

function SkeletonDetail() {
  return (
    <div className="grid gap-10 lg:grid-cols-[55fr_45fr]" style={{ padding: '60px 80px' }}>
      <div className="just-because-shimmer" style={{ aspectRatio: '1', borderRadius: '2px' }} />
      <div>
        <div className="just-because-shimmer" style={{ height: '12px', width: '40%', marginBottom: '20px' }} />
        <div className="just-because-shimmer" style={{ height: '48px', width: '70%', marginBottom: '16px' }} />
        <div className="just-because-shimmer" style={{ height: '88px', width: '100%', marginBottom: '28px' }} />
        <div className="just-because-shimmer" style={{ height: '56px', width: '46%', marginBottom: '34px' }} />
        <div className="just-because-shimmer" style={{ height: '280px', width: '100%' }} />
      </div>
    </div>
  )
}

function RecommendationSkeletonCard() {
  return (
    <div style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', display: 'flex', flexDirection: 'column', minHeight: '420px', overflow: 'hidden' }}>
      <div className="just-because-shimmer" style={{ flexShrink: 0, height: '240px', width: '100%' }} />
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', padding: '18px 14px 14px' }}>
        <div className="just-because-shimmer" style={{ height: '10px', marginBottom: '12px', width: '42%' }} />
        <div className="just-because-shimmer" style={{ height: '20px', marginBottom: '14px', width: '76%' }} />
        <div className="just-because-shimmer" style={{ height: '16px', width: '34%' }} />
        <div style={{ flex: 1 }} />
        <div className="just-because-shimmer" style={{ height: '42px', width: '100%' }} />
      </div>
    </div>
  )
}

function RecommendationCard({
  product,
  onAddToCart,
}: {
  product: Product
  onAddToCart: (product: Product) => Promise<void>
}) {
  const image = product.metalImages?.white_gold?.[0] || product.images?.[0]
  const imagePosition = product.productType?.includes('necklace') || product.productType?.includes('pendant')
    ? 'center top'
    : 'center center'

  return (
    <motion.article
      whileHover={{ y: -6, boxShadow: '0 14px 34px rgba(26,16,20,0.10)' }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', display: 'flex', flexDirection: 'column', minHeight: '420px', overflow: 'hidden' }}
    >
      <Link href={`/products/${product.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
        <div style={{ backgroundColor: '#FDF8F2', height: '240px', overflow: 'hidden', position: 'relative' }}>
          {image ? (
            <Image
              src={image}
              alt={product.title}
              fill
              sizes="(max-width: 480px) 100vw, (max-width: 900px) 50vw, 25vw"
              quality={90}
              className={`img-cover ${imagePosition === 'center top' ? 'is-top' : ''}`}
              style={{ objectFit: 'cover', objectPosition: imagePosition, transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)' }}
            />
          ) : (
            <ProductPlaceholder size={56} />
          )}
          <ProductBadges isBestSeller={product.isBestSeller} isNewArrival={product.isNewArrival} />
        </div>
      </Link>

      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', padding: '18px 14px 14px' }}>
        <p style={{ color: '#C9A961', flexShrink: 0, fontFamily: 'var(--font-inter)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.2em', marginBottom: '8px', textTransform: 'uppercase' }}>
          {prettify(product.category)}
        </p>
        <Link href={`/products/${product.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
          <h3 style={{ color: '#1A1014', display: '-webkit-box', flexShrink: 0, fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 400, lineHeight: 1.35, marginBottom: '10px', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
            {product.title}
          </h3>
        </Link>
        <p style={{ alignItems: 'baseline', display: 'flex', flexShrink: 0, gap: '6px', margin: '0 0 16px' }}>
          <span style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>From</span>
          <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '16px', fontWeight: 500 }}>{formatPrice(product.basePrice)}</span>
        </p>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => {
            void onAddToCart(product)
          }}
          style={{ backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.16em', padding: '13px', textAlign: 'center', textTransform: 'uppercase', transition: 'background-color 0.3s ease', width: '100%' }}
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = '#2A1E24'
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = '#1A1014'
          }}
        >
          ADD TO CART
        </button>
      </div>
    </motion.article>
  )
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const { addItem, items, removeItem } = useCart()
  const { isWishlisted, toggleItem } = useWishlist()
  const { showToast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [showZoomLens, setShowZoomLens] = useState(false)
  const [selectedMetal, setSelectedMetal] = useState('')
  const [selectedCarat, setSelectedCarat] = useState<number | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [calculatedPrice, setCalculatedPrice] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const loadProduct = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/products/${params.slug}`)
      const payload = (await response.json()) as {
        product?: Product
        reviews?: Review[]
        error?: string
      }

      if (!response.ok || !payload.product) {
        console.error('[product-detail] load failed:', payload.error)
        throw new Error('Product not found.')
      }

      const incoming = payload.product
      const incomingCarats = normalizeCaratOptions(incoming.availableCarats)
      const incomingMetals = incoming.availableMetals || []
      const incomingSizes = incoming.availableSizes || []
      setProduct(incoming)
      setReviews(payload.reviews || [])
      setSelectedMetal(defaultMetalSelection(incomingMetals))
      setSelectedCarat(incomingCarats.length === 1 ? incomingCarats[0] : null)
      setSelectedSize(incomingSizes.length === 1 && !isRingProduct(incoming.productType, incoming.category) ? incomingSizes[0] : null)
      setCalculatedPrice(incoming.basePrice)
      setSelectedImage(0)
      setIsZoomed(false)
    } catch (caught) {
      console.error('[product-detail] request failed:', caught)
      setError(getGeneralErrorMessage(caught))
    } finally {
      setIsLoading(false)
    }
  }, [params.slug])

  useEffect(() => {
    void loadProduct()
  }, [loadProduct])

  useEffect(() => {
    if (!product) return

    let cancelled = false
    const params = new URLSearchParams({
      bestSeller: 'priority',
      exclude: product.id,
      limit: '4',
      type: product.productType,
    })

    setRecommendationsLoading(true)
    setRecommendationsError(null)

    fetch(`/api/products?${params.toString()}`)
      .then(async (response) => {
        const payload = (await response.json()) as { products?: Product[]; error?: string }
        if (!response.ok) {
          console.error('[product-detail] recommendations failed:', payload.error)
          throw new Error('Unable to load recommendations.')
        }
        if (!cancelled) {
          setRecommendations(payload.products || [])
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setRecommendations([])
          setRecommendationsError(getGeneralErrorMessage(caught))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRecommendationsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [product])

  const images = useMemo(() => {
    if (!product) return []

    const metalKey = selectedMetal
    const metalImages = product.metalImages?.[metalKey]

    if (metalImages?.length) {
      return metalImages.filter(validImageUrl)
    }

    return (product.images || []).filter(validImageUrl)
  }, [product, selectedMetal])

  const primaryImage = images[0] || product?.images?.[0] || ''
  const wishlisted = product ? isWishlisted(product.slug) : false


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (images.length <= 1) {
        if (event.key === 'Escape') {
          setIsZoomed(false)
        }
        return
      }

      if (event.key === 'ArrowLeft') {
        setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))
        setIsZoomed(false)
      }
      if (event.key === 'ArrowRight') {
        setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))
        setIsZoomed(false)
      }
      if (event.key === 'Escape') {
        setIsZoomed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [images.length])

  useEffect(() => {
    if (!product) return

    const params = new URLSearchParams(window.location.search)
    if (params.get('askExpert') !== 'true') return

    supabaseAuth.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      const msgParams = new URLSearchParams({
        type: 'product',
        productId: product.id,
        productSlug: product.slug,
        productTitle: product.title,
        productImage: primaryImage,
      })
      router.push(`/account/messages/new?${msgParams.toString()}`)
    })
  }, [primaryImage, product, router])

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 4.9

  const ringProduct = isRingProduct(product?.productType, product?.category)
  const availableCarats = useMemo(() => normalizeCaratOptions(product?.availableCarats), [product?.availableCarats])
  const caratPrice = !ringProduct && selectedCarat
    ? getModifier(product?.caratPricing, selectedCarat) || selectedCarat * (product?.pricePerCarat || 300)
    : 0
  const livePrice = calculatedPrice || product?.basePrice || 0
  const currentPrice = formatPrice(livePrice)
  const imagePosition = product?.productType?.includes('necklace') || product?.productType?.includes('pendant')
    ? 'center top'
    : 'center center'
  const cartItem = items.find((item) => item.productSlug === product?.slug)
  const isInCart = Boolean(cartItem)
  const cartItemVariant = [
    getMetalLabel(cartItem?.selectedMetal),
    cartItem?.selectedCarat ? `${cartItem.selectedCarat}ct` : null,
    cartItem?.ringSize ? `Size ${cartItem.ringSize}` : null,
  ].filter(Boolean).join(' - ')
  const needsRingSize = productNeedsRingSize(product?.productType, product?.category)
  const needsCarat = !ringProduct && Boolean(availableCarats.length)
  const missingSelections = [
    !selectedMetal ? 'Metal' : null,
    needsCarat && !selectedCarat ? 'Carat' : null,
    needsRingSize && !selectedSize ? 'Ring size' : null,
  ].filter((value): value is string => Boolean(value))
  const canAddToCart = missingSelections.length === 0
  const priceBreakdown = {
    base: product?.basePrice || 0,
    metal: 0,
    carat: caratPrice,
    shape: 0,
    color: 0,
    clarity: 0,
  }

  const handleCustomizerChange = useCallback((selections: {
    metal: string
    size?: string
    caratWeight?: number
    totalPrice: number
  }) => {
    setSelectedMetal(selections.metal)
    setSelectedSize(selections.size || null)
    setSelectedCarat(selections.caratWeight || null)
    setCalculatedPrice(selections.totalPrice)
    setSelectedImage(0)
    setIsZoomed(false)
  }, [])

  if (isLoading) {
    return (
      <div style={{ backgroundColor: '#FBF5F0', minHeight: '100vh' }}>
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
        <SkeletonDetail />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center" style={{ backgroundColor: '#FBF5F0' }}>
        <Gem color="#C9A961" size={72} strokeWidth={1.05} />
        <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '30px', fontWeight: 400, margin: 0 }}>We could not find that piece</h1>
        <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '15px', lineHeight: 1.625, margin: 0 }}>{error}</p>
        <button onClick={loadProduct} style={{ backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.18em', padding: '12px 18px' }}>
          RETRY
        </button>
      </div>
    )
  }

  const handleAddToCart = async () => {
    if (!canAddToCart) return

    if (cartItem) {
      await removeItem(cartItem.id)
    }
    const selectedShape = ringProduct ? product.diamondShape || product.availableShapes?.[0] || 'Round' : undefined

    await addItem({
      productId: product.id,
      productSlug: product.slug,
      productTitle: product.title,
      productImage: primaryImage,
      selectedMetal,
      selectedCarat: selectedCarat || 0,
      selectedShape,
      selectedColor: undefined,
      selectedClarity: undefined,
      ringSize: selectedSize || undefined,
      engraving: undefined,
      quantity: 1,
      unitPrice: livePrice,
      priceBreakdown,
    })
    showToast('Added to cart successfully', 'success')
    setAddedToCart(true)
    window.setTimeout(() => setAddedToCart(false), 2500)
  }

  const handleAddRecommendationToCart = async (recommendedProduct: Product) => {
    const recommendedImage = recommendedProduct.metalImages?.white_gold?.[0] || recommendedProduct.images?.[0] || ''
    const recommendedMetal = defaultMetalSelection(recommendedProduct.availableMetals)
    const recommendedIsRing = isRingProduct(recommendedProduct.productType, recommendedProduct.category)

    await addItem({
      productId: recommendedProduct.id,
      productSlug: recommendedProduct.slug,
      productTitle: recommendedProduct.title,
      productImage: recommendedImage,
      selectedMetal: recommendedMetal,
      selectedCarat: 0,
      selectedShape: recommendedIsRing
        ? recommendedProduct.diamondShape || recommendedProduct.availableShapes?.[0] || 'Round'
        : undefined,
      selectedColor: undefined,
      selectedClarity: undefined,
      ringSize: undefined,
      engraving: undefined,
      quantity: 1,
      unitPrice: recommendedProduct.basePrice,
      priceBreakdown: {
        base: recommendedProduct.basePrice,
        metal: 0,
        carat: 0,
        shape: 0,
        color: 0,
        clarity: 0,
      },
    })
    showToast('Added to cart successfully', 'success')
  }

  const handleBuyNow = async () => {
    if (!canAddToCart) return

    const selectedShape = ringProduct ? product.diamondShape || product.availableShapes?.[0] || 'Round' : undefined

    await addItem({
      productId: product.id,
      productSlug: product.slug,
      productTitle: product.title,
      productImage: primaryImage,
      selectedMetal,
      selectedCarat: selectedCarat || 0,
      selectedShape,
      selectedColor: undefined,
      selectedClarity: undefined,
      ringSize: selectedSize || undefined,
      engraving: undefined,
      quantity: 1,
      unitPrice: livePrice,
      priceBreakdown,
    })

    router.push('/checkout')
  }

  const handleTalkToExpert = async () => {
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      router.push(`/login?redirect=/products/${product.slug}?askExpert=true`)
      return
    }

    const params = new URLSearchParams({
      type: 'product',
      productId: product.id,
      productSlug: product.slug,
      productTitle: product.title,
      productImage: primaryImage,
    })

    router.push(`/account/messages/new?${params.toString()}`)
  }

  const handleShare = async () => {
    const shareData: ShareData = {
      title: product.title,
      text: `Check out this beautiful piece from Just Because: ${product.title}`,
      url: window.location.href,
    }

    if (navigator.share && (navigator.canShare?.(shareData) ?? true)) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        setShareModalOpen(true)
        return
      }
    }

    setShareModalOpen(true)
  }

  const handleWishlistToggle = async () => {
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      showToast('Please sign in to save this piece.', 'info')
      router.push(`/login?redirect=${encodeURIComponent(`/products/${product.slug}`)}`)
      return
    }

    const saved = await toggleItem({
      id: product.id,
      productSlug: product.slug,
      productTitle: product.title,
      productImage: primaryImage,
      basePrice: product.basePrice,
      category: product.category,
      productType: product.productType,
    })

    if (!saved) {
      showToast('Failed to update wishlist - please try again', 'error')
      return
    }

    showToast(wishlisted ? 'Removed from wishlist' : 'Saved to wishlist', wishlisted ? 'info' : 'wishlist')
  }

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

        .you-may-like-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        @media (max-width: 900px) {
          .you-may-like-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 480px) {
          .you-may-like-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="product-backbar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 80px',
        borderBottom: '0.5px solid #EDD9AF',
        background: '#FBF5F0',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-muted-text)',
            fontSize: '12px',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-inter)',
            padding: '8px 0',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(event) => event.currentTarget.style.color = '#1A1014'}
          onMouseLeave={(event) => event.currentTarget.style.color = 'var(--color-muted-text)'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Back to collection
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', letterSpacing: '0.05em' }}>
            {product?.category?.replace(/_/g, ' ').toUpperCase()}
          </span>
          <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-muted-text)', fontSize: '11px', fontFamily: 'var(--font-inter)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            Share
          </button>
        </div>
      </div>
      <div className="product-detail-grid mx-auto grid max-w-[1400px] gap-10 px-4 py-8 md:grid-cols-[45fr_55fr] md:px-10 md:py-10 lg:grid-cols-[55fr_45fr] lg:gap-[60px] lg:px-20 lg:py-[60px]">
        <section className="product-image-gallery">
          <div
            ref={imageRef}
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1',
              overflow: 'hidden',
              background: '#FDF8F2',
              borderRadius: '2px',
              cursor: isZoomed ? 'zoom-out' : 'zoom-in',
            }}
            onClick={() => setIsZoomed((zoomed) => !zoomed)}
            onMouseMove={(event) => {
              if (!imageRef.current) return
              const rect = imageRef.current.getBoundingClientRect()
              const x = ((event.clientX - rect.left) / rect.width) * 100
              const y = ((event.clientY - rect.top) / rect.height) * 100
              setZoomPos({ x, y })
              setShowZoomLens(true)
            }}
            onMouseLeave={() => {
              setShowZoomLens(false)
              setIsZoomed(false)
            }}
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0]?.clientX || 0
            }}
            onTouchEnd={(event) => {
              touchEndX.current = event.changedTouches[0]?.clientX || 0
              const diff = touchStartX.current - touchEndX.current
              if (images.length > 1 && Math.abs(diff) > 50) {
                setSelectedImage((prev) => {
                  if (diff > 0) {
                    return prev === images.length - 1 ? 0 : prev + 1
                  }
                  return prev === 0 ? images.length - 1 : prev - 1
                })
                setIsZoomed(false)
              }
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
                transform: isZoomed
                  ? `scale(2.5) translate(${(50 - zoomPos.x) * 0.4}%, ${(50 - zoomPos.y) * 0.4}%)`
                  : 'scale(1)',
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
              }}
            >
              {images[selectedImage] ? (
                <Image
                  src={images[selectedImage]}
                  alt={product.title}
                  fill
                  priority
                  quality={90}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className={`img-cover ${imagePosition === 'center top' ? 'is-top' : ''}`}
                  style={{
                    objectFit: 'cover',
                    objectPosition: imagePosition,
                    transition: 'transform 0.4s ease',
                  }}
                />
              ) : (
                <ProductPlaceholder size={92} />
              )}
            </div>

            <button
              onClick={(event) => {
                event.stopPropagation()
                setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                setIsZoomed(false)
              }}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(253,248,242,0.92)',
                border: '0.5px solid #EDD9AF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'all 0.2s ease',
                opacity: images.length > 1 ? 1 : 0,
                pointerEvents: images.length > 1 ? 'auto' : 'none',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = '#FBF5F0'
                event.currentTarget.style.borderColor = '#C9A961'
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = 'rgba(253,248,242,0.92)'
                event.currentTarget.style.borderColor = '#EDD9AF'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1014" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              onClick={(event) => {
                event.stopPropagation()
                setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                setIsZoomed(false)
              }}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(253,248,242,0.92)',
                border: '0.5px solid #EDD9AF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'all 0.2s ease',
                opacity: images.length > 1 ? 1 : 0,
                pointerEvents: images.length > 1 ? 'auto' : 'none',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = '#FBF5F0'
                event.currentTarget.style.borderColor = '#C9A961'
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = 'rgba(253,248,242,0.92)'
                event.currentTarget.style.borderColor = '#EDD9AF'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1014" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {!isZoomed && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(253,248,242,0.92)',
                  padding: '5px 10px',
                  fontSize: '10px',
                  color: 'var(--color-muted-text)',
                  fontFamily: 'var(--font-inter)',
                  letterSpacing: '0.1em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  pointerEvents: 'none',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
                Click to zoom
              </div>
            )}

            {isZoomed && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(253,248,242,0.92)',
                  padding: '5px 10px',
                  fontSize: '10px',
                  color: '#C9A961',
                  fontFamily: 'var(--font-inter)',
                  letterSpacing: '0.1em',
                  pointerEvents: 'none',
                }}
              >
                Click to zoom out
              </div>
            )}

            {showZoomLens && !isZoomed && (
              <div
                style={{
                  position: 'absolute',
                  width: '80px',
                  height: '80px',
                  border: '1px solid rgba(201,169,97,0.6)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                  transform: 'translate(-50%, -50%)',
                  left: `${zoomPos.x}%`,
                  top: `${zoomPos.y}%`,
                  transition: 'left 0.05s, top 0.05s',
                }}
              />
            )}

            {images.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '6px',
                  zIndex: 10,
                }}
              >
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(event) => {
                      event.stopPropagation()
                      setSelectedImage(index)
                      setIsZoomed(false)
                    }}
                    style={{
                      width: index === selectedImage ? '20px' : '6px',
                      height: '6px',
                      borderRadius: '999px',
                      background: index === selectedImage ? '#C9A961' : 'rgba(201,169,97,0.4)',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {images.length > 0 ? (
              images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  onClick={() => {
                    setSelectedImage(index)
                    setIsZoomed(false)
                  }}
                  style={{
                    position: 'relative',
                    width: '72px',
                    height: '72px',
                    flexShrink: 0,
                    border: selectedImage === index ? '1.5px solid #1A1014' : '0.5px solid #EDD9AF',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: '#FDF8F2',
                    padding: 0,
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <Image
                    src={image}
                    alt={`${product.title} view ${index + 1}`}
                    fill
                    sizes="72px"
                    onError={(event) => {
                      event.currentTarget.parentElement?.style.setProperty('display', 'none')
                    }}
                    className={`img-cover ${imagePosition === 'center top' ? 'is-top' : ''}`}
                    style={{
                      objectFit: 'cover',
                      objectPosition: imagePosition,
                    }}
                  />
                </button>
              ))
            ) : (
              [0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  style={{
                    width: '72px',
                    height: '72px',
                    flexShrink: 0,
                    border: index === 0 ? '2px solid #C9A961' : '1px solid #EDD9AF',
                    borderRadius: '2px',
                    background: '#F5E8ED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A961" strokeWidth="1">
                    <path d="M6 3h12l4 6-10 13L2 9z" />
                  </svg>
                </div>
              ))
            )}
          </div>
          <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px', marginTop: '12px', textAlign: 'center' }}>Click to zoom - use arrow keys or swipe to browse</p>
        </section>

        <section>
          <nav style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '11px', marginBottom: '20px' }}>
            <Link href="/" style={{ color: 'var(--color-muted-text)', textDecoration: 'none' }}>Home</Link>
            <span> / </span>
            <Link href="/products" style={{ color: 'var(--color-muted-text)', textDecoration: 'none' }}>{prettify(product.productType)}</Link>
            <span> / </span>
            <span style={{ color: '#1A1014' }}>{product.title}</span>
          </nav>

          <p style={{ color: '#C9A961', fontFamily: 'var(--font-jost)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.2em', marginBottom: '10px', textTransform: 'uppercase' }}>{prettify(product.category)}</p>
          <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, lineHeight: 1.1, margin: '0 0 10px' }}>
            {product.title}
          </h1>
          <div>
            <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-jost)', fontSize: '13px', marginBottom: '6px' }}>From</p>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPrice}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                style={{ color: '#1A1014', fontFamily: 'var(--font-cormorant)', fontSize: '2.5rem', letterSpacing: 0, fontWeight: 400 }}
              >
                {currentPrice}
              </motion.div>
            </AnimatePresence>
          </div>

          <div style={{ borderTop: '0.5px solid #EDD9AF', margin: '24px 0' }} />

          <div className="space-y-7">
            <ProductCustomizer
              product={product}
              onSelectionChange={handleCustomizerChange}
            />

            {isInCart && (
              <div style={{
                background: '#FDF8F2',
                border: '1px solid #C9A961',
                borderRadius: '2px',
                padding: '14px 18px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#C9A961', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="#FBF5F0" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#1A1014', fontWeight: 500, fontFamily: 'var(--font-inter)' }}>
                      You already added {cartItemVariant || 'this item'} to cart
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', marginTop: '2px' }}>
                      Review your selected variant before checkout.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href="/cart" style={{ padding: '8px 14px', background: '#1A1014', color: '#FBF5F0', fontSize: '10px', letterSpacing: '0.15em', textDecoration: 'none', fontFamily: 'var(--font-inter)', whiteSpace: 'nowrap' }}>VIEW CART</Link>
                </div>
              </div>
            )}

            <div
              className="product-action-buttons product-buy-buttons"
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '24px',
              }}
            >
              <button
                onClick={handleAddToCart}
                disabled={addedToCart || !canAddToCart}
                style={{
                  flex: 1,
                  height: '56px',
                  background: addedToCart ? '#2A1E24' : 'transparent',
                  border: '1.5px solid #1A1014',
                  color: '#1A1014',
                  fontSize: '11px',
                  letterSpacing: '0.2em',
                  cursor: !canAddToCart ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-inter)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  opacity: !canAddToCart ? 0.5 : 1,
                }}
                onMouseEnter={(event) => {
                  if (!addedToCart && canAddToCart) {
                    event.currentTarget.style.background = '#1A1014'
                    event.currentTarget.style.color = '#FBF5F0'
                  }
                }}
                onMouseLeave={(event) => {
                  if (!addedToCart) {
                    event.currentTarget.style.background = 'transparent'
                    event.currentTarget.style.color = '#1A1014'
                  }
                }}
              >
                {addedToCart ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBF5F0" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ color: '#FBF5F0' }}>ADDED TO CART</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                    ADD TO CART
                  </>
                )}
              </button>

              <button
                className="buy-now-btn"
                onClick={handleBuyNow}
                disabled={!canAddToCart}
                style={{
                  flex: 1,
                  height: '56px',
                  background: !canAddToCart ? '#B8A090' : '#1A1014',
                  border: 'none',
                  color: '#FBF5F0',
                  fontSize: '11px',
                  letterSpacing: '0.2em',
                  cursor: !canAddToCart ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(event) => {
                  if (canAddToCart) {
                    event.currentTarget.style.background = '#2A1E24'
                    event.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = canAddToCart ? '#1A1014' : '#B8A090'
                  event.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                BUY NOW
              </button>
            </div>

            {!canAddToCart && (
              <p
                style={{
                  fontSize: '11px',
                  color: '#A85C6A',
                  fontFamily: 'var(--font-inter)',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                ! Please select: {missingSelections.join(', ')}
              </p>
            )}

            <div className="flex items-center justify-center gap-8">
              <button
                className="flex items-center gap-2"
                onClick={handleWishlistToggle}
                style={{ color: wishlisted ? '#C9A961' : '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}
              >
                <Heart size={15} fill={wishlisted ? '#C9A961' : 'transparent'} /> {wishlisted ? 'Saved' : 'Save to Wishlist'}
              </button>
              <button
                className="flex items-center gap-2"
                onClick={handleShare}
                style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px' }}
              >
                <Share2 size={15} /> Share
              </button>
            </div>

            <div className="grid grid-cols-3" style={{ border: '0.5px solid #EDD9AF', backgroundColor: '#FDF8F2' }}>
              {[
                { icon: ShieldCheck, title: 'IGI', copy: 'Certified' },
                { icon: RotateCcw, title: '30-Day', copy: 'Returns' },
                { icon: Sparkles, title: 'Lifetime', copy: 'Warranty' },
              ].map((badge, index) => {
                const Icon = badge.icon
                return (
                  <div key={badge.title} className="flex flex-col items-center gap-1 px-2 py-4 text-center" style={{ borderLeft: index === 0 ? 'none' : '0.5px solid #EDD9AF' }}>
                    <Icon color="#C9A961" size={18} strokeWidth={1.4} />
                    <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '10px', fontWeight: 500 }}>{badge.title}</span>
                    <span style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{badge.copy}</span>
                  </div>
                )
              })}
            </div>

            <div
              style={{
                marginTop: '24px',
                padding: '16px 20px',
                background: '#FDF8F2',
                border: '0.5px solid #EDD9AF',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#1A1014',
                    fontFamily: 'var(--font-inter)',
                    marginBottom: '3px',
                  }}
                >
                  Questions about this piece?
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-muted-text)',
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  Our diamond experts reply within a few hours
                </div>
              </div>

              <button
                onClick={handleTalkToExpert}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  background: '#1A1014',
                  border: 'none',
                  color: '#FBF5F0',
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-inter)',
                  whiteSpace: 'nowrap',
                  borderRadius: '2px',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(event) => event.currentTarget.style.background = '#2A1E24'}
                onMouseLeave={(event) => event.currentTarget.style.background = '#1A1014'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                TALK TO AN EXPERT
              </button>
            </div>

            <ProductAccordion product={product} selectedMetal={selectedMetal} />
          </div>
        </section>
      </div>

      <div
        className="mobile-buy-bar"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(251,245,240,0.97)',
          backdropFilter: 'blur(10px)',
          borderTop: '0.5px solid #EDD9AF',
          padding: '12px 20px',
          display: 'none',
          gap: '10px',
          zIndex: 100,
        }}
      >
        <button
          onClick={handleAddToCart}
          disabled={addedToCart || !canAddToCart}
          style={{
            flex: 1,
            padding: '14px',
            background: 'transparent',
            border: '1px solid #1A1014',
            color: '#1A1014',
            fontSize: '11px',
            letterSpacing: '0.15em',
            cursor: !canAddToCart ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-inter)',
            opacity: !canAddToCart ? 0.55 : 1,
          }}
        >
          {addedToCart ? 'ADDED' : 'ADD TO CART'}
        </button>
        <button
          className="buy-now-btn"
          onClick={handleBuyNow}
          disabled={!canAddToCart}
          style={{
            flex: 1,
            padding: '14px',
            background: !canAddToCart ? '#B8A090' : '#1A1014',
            border: 'none',
            color: '#FBF5F0',
            fontSize: '11px',
            letterSpacing: '0.15em',
            cursor: !canAddToCart ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-inter)',
          }}
        >
          BUY NOW
        </button>
      </div>

      <section className="mx-auto max-w-[1400px] px-6 pb-20 md:px-10 lg:px-20">
        <div className="mt-16 grid gap-8 lg:grid-cols-[260px_1fr]">
          <div>
            <div style={{ color: '#C9A961', fontFamily: 'var(--font-playfair)', fontSize: '48px', lineHeight: 1 }}>{averageRating.toFixed(1)}</div>
            <Stars rating={Math.round(averageRating)} />
            <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '13px', marginTop: '8px' }}>Based on {reviews.length} reviews</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.length ? reviews.map((review) => (
              <motion.article key={review.id} whileHover={{ y: -4 }} transition={{ duration: 0.35 }} style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', padding: '20px 24px' }}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Stars rating={review.rating} />
                  <span style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <p style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>{review.customerName}</p>
                <h3 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '15px', fontStyle: 'italic', fontWeight: 400, marginBottom: '8px' }}>{review.title}</h3>
                <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '15px', lineHeight: 1.625, margin: 0 }}>{review.comment}</p>
              </motion.article>
            )) : (
              <div style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '15px', lineHeight: 1.625, padding: '24px' }}>
                Reviews will appear here once this piece has been tried, loved, and written about.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 pb-24 md:px-10 lg:px-20">
        <div style={{ borderTop: '0.5px solid #EDD9AF', paddingTop: '56px' }}>
          <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.3em', marginBottom: '10px', textTransform: 'uppercase' }}>
            DISCOVER MORE
          </p>
          <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: 'clamp(2rem, 4vw, 3.25rem)', fontWeight: 400, lineHeight: 1.12, margin: '0 0 28px' }}>
            You may also like
          </h2>

          {recommendationsError ? (
            <div style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '14px', lineHeight: 1.7, padding: '24px' }}>
              {recommendationsError}
            </div>
          ) : recommendationsLoading ? (
            <div className="you-may-like-grid">
              {Array.from({ length: 4 }, (_, index) => <RecommendationSkeletonCard key={index} />)}
            </div>
          ) : recommendations.length ? (
            <div className="you-may-like-grid">
              {recommendations.map((recommendedProduct) => (
                <RecommendationCard
                  key={recommendedProduct.id}
                  product={recommendedProduct}
                  onAddToCart={handleAddRecommendationToCart}
                />
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '14px', lineHeight: 1.7, padding: '24px' }}>
              More pieces in this style will appear here as the collection grows.
            </div>
          )}
        </div>
      </section>

      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title={product.title}
        imageUrl={primaryImage}
      />
    </motion.main>
  )
}

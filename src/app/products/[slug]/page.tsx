'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Gem, Heart, RotateCcw, Share2, ShieldCheck, Sparkles, Star } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'

type PricingMap = Record<string, { enabled?: boolean; modifier?: number }>

type Product = {
  id: string
  slug: string
  productType: string
  category: string
  title: string
  description: string | null
  basePrice: number
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
}

type Review = {
  id: string
  customerName: string
  rating: number
  title: string | null
  comment: string | null
  createdAt: string
}

type PriceResponse = {
  breakdown: {
    base: number
    metal: number
    carat: number
    shape: number
    color: number
    clarity: number
  }
  total: number
  formatted: string
  error?: string
}

const metalGradients: Record<string, string> = {
  'White Gold': 'linear-gradient(135deg, #FBF5F0 0%, #E8E8E8 52%, #BDBDBD 100%)',
  'Yellow Gold': 'linear-gradient(135deg, #EDD9AF 0%, #C9A961 52%, #8E7133 100%)',
  'Rose Gold': 'linear-gradient(135deg, #FCF0F4 0%, #E8B5A8 54%, #B97868 100%)',
  Platinum: 'linear-gradient(135deg, #FDF8F2 0%, #D0D0D0 52%, #A8A8A8 100%)',
}

const shapeFileNames: Record<string, string> = {
  Round: 'round',
  Oval: 'oval',
  Cushion: 'cushion',
  Princess: 'princess',
  Emerald: 'emerald',
  Pear: 'pear',
  Marquise: 'marquise',
  Heart: 'heart',
  Asscher: 'asscher',
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

function modifier(map: PricingMap | undefined, key: string | number) {
  return map?.[String(key)]?.modifier || 0
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

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const { addItem, items, removeItem } = useCart()
  const { showToast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedMetal, setSelectedMetal] = useState('')
  const [selectedCarat, setSelectedCarat] = useState<number>(6)
  const [selectedShape, setSelectedShape] = useState('')
  const [selectedColor, setSelectedColor] = useState('G')
  const [selectedClarity, setSelectedClarity] = useState('VS1')
  const [ringSize, setRingSize] = useState('6')
  const [engraving, setEngraving] = useState('')
  const [price, setPrice] = useState<PriceResponse | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

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
        throw new Error(payload.error || 'Product not found.')
      }

      const incoming = payload.product
      setProduct(incoming)
      setReviews(payload.reviews || [])
      setSelectedMetal(incoming.availableMetals?.[0] || 'White Gold')
      setSelectedCarat(incoming.availableCarats?.[0] || 6)
      setSelectedShape(incoming.availableShapes?.[0] || 'Round')
      setSelectedColor(incoming.availableColors?.[3] || incoming.availableColors?.[0] || 'G')
      setSelectedClarity(incoming.availableClarities?.[3] || incoming.availableClarities?.[0] || 'VS1')
      setRingSize(incoming.availableSizes?.[4] || incoming.availableSizes?.[0] || '6')
      setSelectedImage(0)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load product.')
    } finally {
      setIsLoading(false)
    }
  }, [params.slug])

  useEffect(() => {
    void loadProduct()
  }, [loadProduct])

  useEffect(() => {
    if (!product) {
      return
    }

    const calculatePrice = async () => {
      setPriceLoading(true)
      try {
        const response = await fetch('/api/price/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            selections: {
              metal: selectedMetal,
              carat: selectedCarat,
              shape: selectedShape,
              color: selectedColor,
              clarity: selectedClarity,
            },
          }),
        })
        const payload = (await response.json()) as PriceResponse
        if (!response.ok) {
          throw new Error(payload.error || 'Unable to calculate price.')
        }
        setPrice(payload)
      } catch {
        setPrice({
          breakdown: { base: product.basePrice, metal: 0, carat: 0, shape: 0, color: 0, clarity: 0 },
          total: product.basePrice,
          formatted: formatPrice(product.basePrice),
        })
      } finally {
        setPriceLoading(false)
      }
    }

    void calculatePrice()
  }, [product, selectedMetal, selectedCarat, selectedShape, selectedColor, selectedClarity])

  const images = useMemo(() => {
    if (!product?.images?.length) {
      return []
    }

    return Array.from({ length: 4 }, (_, index) => product.images[index % product.images.length])
  }, [product])

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 4.9

  const currentPrice = price?.formatted || formatPrice(product?.basePrice || 0)
  const cartItem = items.find((item) => item.productSlug === product?.slug)
  const isInCart = Boolean(cartItem)
  const calculatedPrice = price?.total || product?.basePrice || 0
  const priceBreakdown = price?.breakdown || {
    base: product?.basePrice || 0,
    metal: 0,
    carat: 0,
    shape: 0,
    color: 0,
    clarity: 0,
  }

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
        <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '14px', margin: 0 }}>{error}</p>
        <button onClick={loadProduct} style={{ backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.18em', padding: '12px 18px' }}>
          RETRY
        </button>
      </div>
    )
  }

  const addConfiguredItem = () => {
    if (cartItem) {
      removeItem(cartItem.id)
    }
    addItem({
      productId: product.id,
      productSlug: product.slug,
      productTitle: product.title,
      productImage: product.images?.[0] || '',
      selectedMetal,
      selectedCarat,
      selectedShape,
      selectedColor,
      selectedClarity,
      ringSize,
      engraving,
      quantity: 1,
      unitPrice: calculatedPrice,
      priceBreakdown,
    })
    showToast('Added to cart successfully', 'success')
    setAddedToCart(true)
    window.setTimeout(() => setAddedToCart(false), 1500)
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      style={{ backgroundColor: '#FBF5F0', minHeight: '100vh' }}
    >
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
            color: '#B8A090',
            fontSize: '12px',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-inter)',
            padding: '8px 0',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(event) => event.currentTarget.style.color = '#1A1014'}
          onMouseLeave={(event) => event.currentTarget.style.color = '#B8A090'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Back to collection
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontSize: '11px', color: '#B8A090', fontFamily: 'var(--font-inter)', letterSpacing: '0.05em' }}>
            {product?.category?.replace(/_/g, ' ').toUpperCase()}
          </span>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#B8A090', fontSize: '11px', fontFamily: 'var(--font-inter)' }}>
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
        <section>
          <div style={{ aspectRatio: '1', backgroundColor: '#F5E8ED', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
            {images[selectedImage] ? (
              <Image src={images[selectedImage]} alt={product.title} fill priority sizes="(max-width: 1024px) 100vw, 55vw" style={{ objectFit: 'cover' }} />
            ) : (
              <ProductPlaceholder size={92} />
            )}
          </div>
          <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {Array.from({ length: 4 }, (_, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                style={{
                  width: 'clamp(60px, 12vw, 80px)',
                  height: 'clamp(60px, 12vw, 80px)',
                  border: selectedImage === index ? '2px solid #C9A961' : '1px solid #EDD9AF',
                  backgroundColor: '#F5E8ED',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {images[index] ? (
                  <Image src={images[index]} alt={`${product.title} view ${index + 1}`} fill sizes="80px" style={{ objectFit: 'cover' }} />
                ) : (
                  <ProductPlaceholder size={24} />
                )}
              </button>
            ))}
          </div>
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px', marginTop: '12px', textAlign: 'center' }}>Hover to zoom</p>
        </section>

        <section>
          <nav style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', marginBottom: '20px' }}>
            <Link href="/" style={{ color: '#B8A090', textDecoration: 'none' }}>Home</Link>
            <span> / </span>
            <Link href="/products" style={{ color: '#B8A090', textDecoration: 'none' }}>{prettify(product.productType)}</Link>
            <span> / </span>
            <span style={{ color: '#1A1014' }}>{product.title}</span>
          </nav>

          <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.2em', marginBottom: '10px', textTransform: 'uppercase' }}>{prettify(product.category)}</p>
          <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 400, lineHeight: 1.1, margin: '0 0 10px' }}>
            {product.title}
          </h1>
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
            {product.description}
          </p>

          <div>
            <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', marginBottom: '6px' }}>Calculated price</p>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPrice}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: 'clamp(34px, 5vw, 42px)', letterSpacing: '-0.02em' }}
              >
                {priceLoading ? 'Calculating...' : currentPrice}
              </motion.div>
            </AnimatePresence>
            <Accordion type="single" collapsible>
              <AccordionItem value="breakdown" style={{ borderBottom: '0.5px solid #EDD9AF' }}>
                <AccordionTrigger style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.12em', padding: '12px 0' }}>
                  View breakdown →
                </AccordionTrigger>
                <AccordionContent>
                  <div style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>
                    {Object.entries(price?.breakdown || { base: product.basePrice }).map(([label, amount]) => (
                      <div key={label} className="flex justify-between py-2" style={{ borderBottom: label === 'clarity' ? '0.5px solid #EDD9AF' : 'none' }}>
                        <span style={{ color: '#B8A090' }}>{prettify(label)}</span>
                        <span>{amount >= 0 && label !== 'base' ? '+' : ''}{formatPrice(amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-3" style={{ color: '#C9A961', borderTop: '0.5px solid #EDD9AF', fontWeight: 500 }}>
                      <span>Total</span>
                      <span>{currentPrice}</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div style={{ borderTop: '0.5px solid #EDD9AF', margin: '24px 0' }} />

          <div className="space-y-7">
            <div>
              <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '14px' }}>METAL</p>
              <div className="grid grid-cols-4 gap-3">
                {product.availableMetals.map((metal) => (
                  <button key={metal} onClick={() => setSelectedMetal(metal)} className="flex flex-col items-center gap-2">
                    <span style={{ width: 'clamp(44px, 8vw, 52px)', height: 'clamp(44px, 8vw, 52px)', borderRadius: '50%', background: metalGradients[metal] || '#EDD9AF', border: selectedMetal === metal ? '2px solid #1A1014' : '0.5px solid #EDD9AF', boxShadow: selectedMetal === metal ? '0 0 0 3px #FBF5F0, 0 0 0 5px #C9A961' : 'none', transition: 'all 0.3s' }} />
                    <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px', textAlign: 'center' }}>{metal}</span>
                    <span style={{ color: modifier(product.metalPricing, metal) > 0 ? '#C9A961' : '#7A8F72', fontFamily: 'var(--font-inter)', fontSize: '10px' }}>
                      {modifier(product.metalPricing, metal) > 0 ? `+${formatPrice(modifier(product.metalPricing, metal))}` : 'Base'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '14px' }}>CARAT WEIGHT</p>
              <div className="grid grid-cols-3 gap-3">
                {product.availableCarats.map((carat) => {
                  const isSelected = selectedCarat === carat
                  return (
                    <button key={carat} onClick={() => setSelectedCarat(carat)} style={{ alignItems: 'center', backgroundColor: isSelected ? '#1A1014' : 'transparent', border: isSelected ? '1px solid #1A1014' : '1px solid #EDD9AF', color: isSelected ? '#FBF5F0' : '#1A1014', display: 'flex', flexDirection: 'column', gap: '4px', padding: '14px 20px' }}>
                      <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px' }}>{carat}ct</span>
                      <span style={{ color: isSelected ? '#EDD9AF' : '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px' }}>~{carat}mm</span>
                      <span style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px' }}>{formatPrice(modifier(product.caratPricing, carat))}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '14px' }}>DIAMOND SHAPE</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3">
                {product.availableShapes.slice(0, 9).map((shape) => {
                  const file = shapeFileNames[shape] || shape.toLowerCase()
                  return (
                    <button key={shape} onClick={() => setSelectedShape(shape)} className="flex flex-col items-center justify-center gap-1" style={{ width: '100%', minHeight: '70px', backgroundColor: selectedShape === shape ? '#FDF8F2' : 'transparent', border: selectedShape === shape ? '1px solid #C9A961' : '0.5px solid #EDD9AF', color: '#1A1014' }}>
                      <Image src={`/images/shapes/${file}.png`} alt={`${shape} cut`} width={38} height={38} style={{ objectFit: 'contain', mixBlendMode: 'multiply' }} />
                      <span style={{ color: selectedShape === shape ? '#C9A961' : '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '9px' }}>{shape}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '14px' }}>RING SIZE</p>
                <Select value={ringSize} onValueChange={setRingSize}>
                  <SelectTrigger style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', color: '#1A1014', fontFamily: 'var(--font-inter)', width: '100%' }}>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', color: '#1A1014' }}>
                    {product.availableSizes.map((size) => <SelectItem key={size} value={size}>Size {size}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Link href="#" style={{ color: '#C9A961', display: 'inline-block', fontFamily: 'var(--font-inter)', fontSize: '11px', marginTop: '9px', textDecoration: 'none' }}>View size guide →</Link>
              </div>

              <div>
                <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '14px' }}>ENGRAVING (OPTIONAL)</p>
                <div style={{ position: 'relative' }}>
                  <input
                    value={engraving}
                    onChange={(event) => setEngraving(event.target.value.slice(0, product.engravingMaxChars))}
                    placeholder="Add a personal message..."
                    style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', outline: 'none', padding: '11px 50px 11px 12px', width: '100%' }}
                  />
                  <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px', position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>{engraving.length}/{product.engravingMaxChars}</span>
                </div>
              </div>
            </div>

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
                      This item is in your cart
                    </div>
                    <div style={{ fontSize: '10px', color: '#B8A090', fontFamily: 'var(--font-inter)', marginTop: '2px' }}>
                      {cartItem?.selectedMetal} · {cartItem?.selectedCarat}ct · {cartItem?.selectedShape} · Size {cartItem?.ringSize}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href="/cart" style={{ padding: '8px 14px', background: '#1A1014', color: '#FBF5F0', fontSize: '10px', letterSpacing: '0.15em', textDecoration: 'none', fontFamily: 'var(--font-inter)', whiteSpace: 'nowrap' }}>VIEW CART</Link>
                  <Link href="/checkout" style={{ padding: '8px 14px', background: '#C9A961', color: '#1A1014', fontSize: '10px', letterSpacing: '0.15em', textDecoration: 'none', fontFamily: 'var(--font-inter)', whiteSpace: 'nowrap' }}>CHECKOUT</Link>
                </div>
              </div>
            )}

            <button
              className="product-add-to-cart"
              onClick={addConfiguredItem}
              style={{ backgroundColor: addedToCart ? '#C9A961' : isInCart ? '#2A1E24' : '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '12px', height: '56px', letterSpacing: '0.2em', transition: 'background-color 0.3s', width: '100%' }}
            >
              {addedToCart ? '✓ ADDED TO CART' : isInCart ? 'UPDATE CART' : `ADD TO CART — ${currentPrice}`}
            </button>

            <div className="flex items-center justify-center gap-8">
              <button className="flex items-center gap-2" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px' }}><Heart size={15} /> Save to Wishlist</button>
              <button className="flex items-center gap-2" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px' }}><Share2 size={15} /> Share</button>
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
                    <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px' }}>{badge.copy}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-[1400px] px-6 pb-20 md:px-10 lg:px-20">
        <Tabs defaultValue="description">
          <TabsList variant="line" style={{ borderBottom: '0.5px solid #EDD9AF', borderRadius: 0, color: '#B8A090', width: '100%' }}>
            {['description', 'details', 'shipping'].map((tab) => (
              <TabsTrigger key={tab} value={tab} style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.15em', padding: '14px 18px', textTransform: 'uppercase' }}>
                {tab === 'shipping' ? 'Shipping & Returns' : prettify(tab)}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="description">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: '720px', paddingTop: '28px' }}>
              <p style={{ color: '#3D3028', fontFamily: 'var(--font-inter)', fontSize: '14px', lineHeight: 1.8 }}>{product.description}</p>
              <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '22px', fontStyle: 'italic', lineHeight: 1.5, marginTop: '24px' }}>
                “A reason does not need to be grand to be worth remembering.”
              </p>
            </motion.div>
          </TabsContent>
          <TabsContent value="details">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: '520px', paddingTop: '28px' }}>
              {[
                ['Metal', selectedMetal],
                ['Diamond', `${selectedCarat}ct ${selectedShape}`],
                ['Setting', prettify(product.category)],
                ['Certificate', 'IGI'],
                ['Delivery', '3-5 weeks'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-3" style={{ borderBottom: '0.5px solid #EDD9AF', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>
                  <span style={{ color: '#B8A090' }}>{label}</span>
                  <span style={{ color: '#1A1014', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </motion.div>
          </TabsContent>
          <TabsContent value="shipping">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ color: '#3D3028', fontFamily: 'var(--font-inter)', fontSize: '14px', lineHeight: 1.8, maxWidth: '720px', paddingTop: '28px' }}>
              <p>Free shipping worldwide on every piece. Each ring is made to order and arrives in 3-5 weeks.</p>
              <p style={{ marginTop: '12px' }}>Returns are accepted within 30 days on non-engraved pieces. Lifetime warranty covers manufacturing defects.</p>
            </motion.div>
          </TabsContent>
        </Tabs>

        <div className="mt-16 grid gap-8 lg:grid-cols-[260px_1fr]">
          <div>
            <div style={{ color: '#C9A961', fontFamily: 'var(--font-playfair)', fontSize: '48px', lineHeight: 1 }}>{averageRating.toFixed(1)}</div>
            <Stars rating={Math.round(averageRating)} />
            <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', marginTop: '8px' }}>Based on {reviews.length} reviews</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.length ? reviews.map((review) => (
              <motion.article key={review.id} whileHover={{ y: -4 }} transition={{ duration: 0.35 }} style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', padding: '20px 24px' }}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Stars rating={review.rating} />
                  <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <p style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>{review.customerName}</p>
                <h3 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '15px', fontStyle: 'italic', fontWeight: 400, marginBottom: '8px' }}>{review.title}</h3>
                <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>{review.comment}</p>
              </motion.article>
            )) : (
              <div style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px', padding: '24px' }}>
                Reviews will appear here once this piece has been tried, loved, and written about.
              </div>
            )}
          </div>
        </div>
      </section>
    </motion.main>
  )
}

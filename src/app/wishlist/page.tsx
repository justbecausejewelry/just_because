'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Gem, Heart } from 'lucide-react'
import { useWishlist, type WishlistItem } from '@/context/WishlistContext'

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

function WishlistCard({
  item,
  onRemove,
}: {
  item: WishlistItem
  onRemove: (slug: string) => void
}) {
  return (
    <motion.article
      whileHover={{ y: -6, boxShadow: '0 12px 40px rgba(26,16,20,0.10)' }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{
        backgroundColor: '#FDF8F2',
        border: '0.5px solid #EDD9AF',
        borderRadius: '2px',
        overflow: 'hidden',
      }}
    >
      <Link href={`/products/${item.productSlug}`} style={{ textDecoration: 'none' }}>
        <div
          style={{
            aspectRatio: '1',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#F5E8ED',
          }}
        >
          {item.productImage ? (
            <Image
              src={item.productImage}
              alt={item.productTitle}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Gem color="#C9A961" size={54} strokeWidth={1.1} />
            </div>
          )}
          <span
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: 'rgba(253,248,242,0.92)',
              border: '1px solid #E8C4D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart size={16} color="#C9A5B5" fill="#E8C4D0" strokeWidth={1.5} />
          </span>
        </div>
        <div style={{ padding: '18px' }}>
          <p
            style={{
              color: '#C9A961',
              fontFamily: 'var(--font-inter)',
              fontSize: '9px',
              letterSpacing: '0.2em',
              marginBottom: '7px',
              textTransform: 'uppercase',
            }}
          >
            {prettify(item.category)}
          </p>
          <h2
            style={{
              color: '#1A1014',
              fontFamily: 'var(--font-playfair)',
              fontSize: '18px',
              fontWeight: 400,
              lineHeight: 1.25,
              marginBottom: '8px',
            }}
          >
            {item.productTitle}
          </h2>
          <p style={{ margin: 0 }}>
            <span
              style={{
                color: 'var(--color-muted-text)',
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                marginRight: '6px',
              }}
            >
              From
            </span>
            <span
              style={{
                color: '#1A1014',
                fontFamily: 'var(--font-inter)',
                fontSize: '16px',
                fontWeight: 500,
              }}
            >
              {formatPrice(item.basePrice)}
            </span>
          </p>
        </div>
      </Link>
      <div style={{ padding: '0 18px 18px' }}>
        <Link
          href={`/products/${item.productSlug}`}
          style={{
            background: '#1A1014',
            color: '#FBF5F0',
            display: 'block',
            fontFamily: 'var(--font-inter)',
            fontSize: '10px',
            letterSpacing: '0.15em',
            padding: '11px',
            textAlign: 'center',
            textDecoration: 'none',
            width: '100%',
          }}
        >
          ADD TO CART
        </Link>
        <button
          onClick={() => onRemove(item.productSlug)}
          style={{
            color: 'var(--color-muted-text)',
            fontFamily: 'var(--font-inter)',
            fontSize: '12px',
            marginTop: '12px',
            textAlign: 'center',
            width: '100%',
          }}
        >
          Remove from wishlist
        </button>
      </div>
    </motion.article>
  )
}

export default function WishlistPage() {
  const { items, removeItem, itemCount } = useWishlist()

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      className="px-6 py-12 md:px-20 md:py-[60px]"
      style={{ backgroundColor: '#FBF5F0', minHeight: '100vh' }}
    >
      <div className="mb-10 flex items-center gap-2">
        <Link
          href="/"
          style={{
            color: 'var(--color-muted-text)',
            fontFamily: 'var(--font-inter)',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textDecoration: 'none',
          }}
        >
          Home
        </Link>
        <span style={{ color: '#EDD9AF' }}>›</span>
        <span
          style={{
            color: '#1A1014',
            fontFamily: 'var(--font-inter)',
            fontSize: '11px',
            letterSpacing: '0.08em',
          }}
        >
          Wishlist
        </span>
      </div>

      <header className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1
            style={{
              color: '#1A1014',
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(38px, 6vw, 48px)',
              fontWeight: 400,
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            Your Wishlist
          </h1>
          <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '15px', marginTop: '10px' }}>
            {itemCount} saved {itemCount === 1 ? 'piece' : 'pieces'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Heart color="#C9A5B5" fill="#E8C4D0" size={30} strokeWidth={1.4} />
          <span
            style={{
              backgroundColor: '#E8C4D0',
              borderRadius: '999px',
              color: '#6B2D44',
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              padding: '5px 12px',
            }}
          >
            {itemCount}
          </span>
        </div>
      </header>

      {items.length === 0 ? (
        <section className="flex flex-col items-center justify-center py-20 text-center">
          <Heart color="#E8C4D0" size={82} strokeWidth={1.1} />
          <h2
            style={{
              color: '#1A1014',
              fontFamily: 'var(--font-playfair)',
              fontSize: '32px',
              fontWeight: 400,
              margin: '22px 0 8px',
            }}
          >
            Your wishlist is empty
          </h2>
          <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '16px', lineHeight: 1.625, marginBottom: '28px' }}>
            Save pieces you love for later.
          </p>
          <Link
            href="/products"
            style={{
              backgroundColor: '#1A1014',
              color: '#FBF5F0',
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              letterSpacing: '0.18em',
              padding: '14px 24px',
              textDecoration: 'none',
            }}
          >
            EXPLORE THE COLLECTION
          </Link>
        </section>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <WishlistCard key={item.productSlug} item={item} onRemove={removeItem} />
          ))}
        </section>
      )}
    </motion.main>
  )
}

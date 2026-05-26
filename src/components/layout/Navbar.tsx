'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Gem, Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import { MiniCartDrawer } from '@/components/cart/MiniCartDrawer'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { debounce } from '@/lib/utils'

type SearchProduct = {
  id: string
  title: string
  slug: string
  category: string
  productType: string
  basePrice: number
  images: string[] | null
  type: 'product'
}

type SearchDiamond = {
  id: string
  shape: string
  carat: number
  color: string
  clarity: string
  price: number
}

const navLinks = [
  { label: 'Engagement rings', href: '/products?type=engagement_ring' },
  { label: 'Rings', href: '/products?type=ring' },
  { label: 'Earrings', href: '/products?type=earring' },
  { label: 'Necklaces', href: '/products?type=necklace' },
  { label: 'Bracelets', href: '/products?type=bracelet' },
  { label: 'Diamonds', href: '/diamonds' },
  { label: 'Gifts *', href: '/products?category=gifts', isGold: true },
]

const popularSearches = ['Engagement rings', 'Tennis bracelet', 'Oval diamond', 'Rose gold', 'Wedding bands']

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

function highlightTitle(title: string, query: string) {
  const index = title.toLowerCase().indexOf(query.toLowerCase())
  if (index < 0 || !query) {
    return title
  }

  return (
    <>
      {title.slice(0, index)}
      <strong style={{ fontWeight: 500 }}>{title.slice(index, index + query.length)}</strong>
      {title.slice(index + query.length)}
    </>
  )
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([])
  const [diamondResults, setDiamondResults] = useState<SearchDiamond[]>([])
  const [searching, setSearching] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const pathname = usePathname()
  const inputRef = useRef<HTMLInputElement>(null)
  const { isMiniCartOpen, itemCount, closeCart } = useCart()
  const { itemCount: wishlistCount } = useWishlist()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        closeSearch()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (searchOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [searchOpen])

  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length < 2) {
          setSearchResults([])
          setDiamondResults([])
          return
        }

        setSearching(true)
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
          const payload = (await response.json()) as {
            results?: SearchProduct[]
            diamonds?: SearchDiamond[]
          }
          setSearchResults(payload.results || [])
          setDiamondResults(payload.diamonds || [])
        } catch {
          setSearchResults([])
          setDiamondResults([])
        } finally {
          setSearching(false)
        }
      }, 300),
    []
  )

  const handleQueryChange = (query: string) => {
    setSearchQuery(query)
    void debouncedSearch(query)
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setDiamondResults([])
  }

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#FBF5F0',
          borderBottom: '0.5px solid #EDD9AF',
          boxShadow: scrolled ? '0 2px 20px rgba(26,16,20,0.06)' : 'none',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <div
          className="jb-main-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            height: '64px',
            maxWidth: '1400px',
            margin: '0 auto',
            position: 'relative',
          }}
        >
          <Link href="/" className="jb-logo-link" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontFamily: 'var(--font-italianno)', fontSize: '28px', color: '#C9A961', lineHeight: 1 }}>just</span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', letterSpacing: '0.28em', color: '#1A1014', fontWeight: 500 }}>
                BECAUSE
              </span>
            </div>
          </Link>

          <div
            className="desktop-nav"
            style={{
              display: 'flex',
              gap: '28px',
              alignItems: 'center',
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="jb-nav-link"
                style={{
                  fontSize: '12px',
                  color: link.isGold ? '#C9A961' : '#1A1014',
                  textDecoration: 'none',
                  letterSpacing: '0.05em',
                  fontFamily: 'var(--font-inter)',
                  fontWeight: pathname === link.href ? 500 : 400,
                  whiteSpace: 'nowrap',
                  borderBottom: pathname === link.href ? '1px solid #1A1014' : '1px solid transparent',
                  paddingBottom: '2px',
                  transition: 'color 0.2s ease',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
            <button
              onClick={() => setSearchOpen(true)}
              className="desktop-only-icon jb-icon-action"
              aria-label="Search"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
            >
              <Search size={20} color="#1A1014" />
            </button>

            <Link href="/login" className="desktop-only-icon jb-icon-action" aria-label="Account" style={{ display: 'flex', alignItems: 'center', color: '#1A1014' }}>
              <User size={20} color="#1A1014" />
            </Link>

            <Link href="/wishlist" className="desktop-only-icon jb-icon-action" aria-label="Wishlist" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Heart size={20} color="#1A1014" />
              {wishlistCount > 0 && (
                <span style={{ position: 'absolute', top: '-6px', right: '-7px', background: '#E8C4D0', color: '#6B2D44', borderRadius: '50%', width: '15px', height: '15px', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500 }}>
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setCartOpen(true)}
              className="jb-icon-action"
              aria-label="Open cart"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', position: 'relative', display: 'flex', alignItems: 'center' }}
            >
              <ShoppingBag size={20} color="#1A1014" />
              {itemCount > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-6px', background: '#E8C4D0', color: '#6B2D44', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500 }}>
                  {itemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileOpen((open) => !open)}
              className="mobile-only-icon jb-icon-action"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
            >
              {mobileOpen ? <X size={22} color="#1A1014" /> : <Menu size={22} color="#1A1014" />}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,16,20,0.5)', border: 'none', zIndex: 150 }}
        />
      )}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '280px',
          height: '100vh',
          background: '#FBF5F0',
          zIndex: 151,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '0.5px solid #EDD9AF' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontFamily: 'var(--font-italianno)', fontSize: '24px', color: '#C9A961' }}>just</span>
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.25em', color: '#1A1014', fontWeight: 500 }}>BECAUSE</span>
          </div>
          <button onClick={() => setMobileOpen(false)} aria-label="Close menu" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} color="#B8A090" />
          </button>
        </div>

        <div style={{ flex: 1, padding: '8px 0' }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 24px',
                textDecoration: 'none',
                color: link.isGold ? '#C9A961' : '#1A1014',
                fontFamily: 'var(--font-inter)',
                fontSize: '14px',
                letterSpacing: '0.03em',
                borderBottom: '0.5px solid #EDD9AF',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = '#F5E8ED'
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = 'transparent'
              }}
            >
              {link.label}
              <span style={{ color: '#EDD9AF', fontSize: '16px' }}>{'>'}</span>
            </Link>
          ))}
        </div>

        <div style={{ padding: '20px 24px', borderTop: '0.5px solid #EDD9AF', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
            <Link href="/login" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: '#B8A090', fontSize: '12px', fontFamily: 'var(--font-inter)' }}>
              <User size={16} color="#B8A090" />
              Account
            </Link>
            <Link href="/wishlist" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: '#B8A090', fontSize: '12px', fontFamily: 'var(--font-inter)' }}>
              <Heart size={16} color="#B8A090" />
              Wishlist
              {wishlistCount > 0 && <span style={{ background: '#E8C4D0', color: '#6B2D44', borderRadius: '999px', padding: '1px 6px', fontSize: '10px' }}>{wishlistCount}</span>}
            </Link>
            <button
              onClick={() => {
                setMobileOpen(false)
                setSearchOpen(true)
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#B8A090', fontSize: '12px', fontFamily: 'var(--font-inter)', cursor: 'pointer', padding: 0 }}
            >
              <Search size={16} color="#B8A090" />
              Search
            </button>
          </div>
          <p style={{ fontSize: '11px', color: '#B8A090', fontFamily: 'var(--font-inter)', lineHeight: 1.6, margin: 0 }}>
            &quot;A reason, in itself.&quot;
          </p>
        </div>
      </aside>

      {searchOpen && (
        <>
          <button
            aria-label="Close search"
            onClick={closeSearch}
            style={{ position: 'fixed', inset: 0, background: 'rgba(26,16,20,0.5)', border: 'none', zIndex: 300, backdropFilter: 'blur(4px)' }}
          />
          <section style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#FBF5F0', zIndex: 301, padding: '24px 80px', borderBottom: '0.5px solid #EDD9AF' }}>
            <div className="flex items-center gap-4">
              <Search color="#C9A961" size={20} />
              <input
                ref={inputRef}
                value={searchQuery}
                onChange={(event) => handleQueryChange(event.target.value)}
                placeholder="Search for rings, necklaces, diamonds..."
                style={{ flex: 1, border: 'none', background: 'transparent', fontFamily: 'var(--font-playfair)', fontSize: '28px', color: '#1A1014', outline: 'none' }}
              />
              <button onClick={closeSearch} aria-label="Close search" style={{ color: '#B8A090', padding: '6px' }}>
                <X size={20} />
              </button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {popularSearches.map((suggestion) => (
                <button key={suggestion} onClick={() => handleQueryChange(suggestion)} style={{ border: '0.5px solid #EDD9AF', borderRadius: '999px', color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', padding: '7px 12px' }}>
                  {suggestion}
                </button>
              ))}
            </div>
          </section>
          <div className="jb-search-results" style={{ position: 'fixed', top: '138px', left: 0, right: 0, maxHeight: 'calc(100vh - 138px)', overflowY: 'auto', zIndex: 301, padding: '32px 80px' }}>
            {searching ? (
              <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="just-because-shimmer" style={{ height: '88px', border: '0.5px solid #EDD9AF' }} />
                ))}
              </div>
            ) : searchQuery.length > 2 && searchResults.length === 0 && diamondResults.length === 0 ? (
              <div style={{ color: '#B8A090', fontFamily: 'var(--font-playfair)', fontSize: '20px', textAlign: 'center' }}>
                No results for &quot;{searchQuery}&quot;
                <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px', marginTop: '10px' }}>
                  Try: engagement ring, oval diamond, tennis bracelet
                </p>
              </div>
            ) : (
              <div>
                {searchResults.length > 0 && (
                  <>
                    <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '14px' }}>PRODUCTS</p>
                    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                      {searchResults.map((product) => (
                        <Link key={product.id} href={`/products/${product.slug}`} onClick={closeSearch} style={{ display: 'flex', gap: '12px', padding: '16px', background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '2px', cursor: 'pointer', textDecoration: 'none' }}>
                          <div style={{ width: '56px', height: '56px', background: '#F5E8ED', position: 'relative', flexShrink: 0 }}>
                            {product.images?.[0] ? (
                              <Image src={product.images[0]} alt={product.title} fill sizes="56px" style={{ objectFit: 'cover' }} />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Gem color="#C9A961" size={26} strokeWidth={1.1} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>
                              {highlightTitle(product.title, searchQuery)}
                            </div>
                            <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.12em', marginTop: '3px' }}>
                              {prettify(product.category)}
                            </div>
                            <div style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '14px', marginTop: '5px' }}>
                              From {formatPrice(product.basePrice)}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
                {diamondResults.length > 0 && (
                  <div style={{ marginTop: '28px' }}>
                    <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', marginBottom: '14px' }}>DIAMONDS</p>
                    <div className="grid gap-4 md:grid-cols-4">
                      {diamondResults.map((diamond) => (
                        <div key={diamond.id} style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '16px' }}>
                          <div style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '16px' }}>
                            {diamond.carat}ct {diamond.shape}
                          </div>
                          <div style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', marginTop: '4px' }}>
                            {diamond.color} color - {diamond.clarity}
                          </div>
                          <div style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '14px', marginTop: '8px' }}>
                            {formatPrice(diamond.price)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <MiniCartDrawer
        isOpen={cartOpen || isMiniCartOpen}
        onClose={() => {
          setCartOpen(false)
          closeCart()
        }}
      />

      <style>{`
        .desktop-nav {
          display: none !important;
        }
        .desktop-only-icon {
          display: none !important;
        }
        .mobile-only-icon {
          display: flex !important;
        }
        @media (min-width: 1024px) {
          .desktop-nav {
            display: flex !important;
          }
          .desktop-only-icon {
            display: flex !important;
          }
          .mobile-only-icon {
            display: none !important;
          }
          .jb-main-nav {
            padding: 0 60px !important;
            height: 80px !important;
          }
        }
        @media (max-width: 768px) {
          .jb-search-results {
            top: 122px !important;
            max-height: calc(100vh - 122px) !important;
            padding: 16px !important;
          }
        }
      `}</style>
    </>
  )
}

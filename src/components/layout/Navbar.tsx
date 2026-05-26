'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Gem, Heart, Search, ShoppingBag, User, X } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { MiniCartDrawer } from '@/components/cart/MiniCartDrawer'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { signOut, supabaseAuth } from '@/lib/auth'
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
  { label: 'Engagement rings', href: '/products?type=engagement_ring', activePath: '/products' },
  { label: 'Rings', href: '/products?category=rings', activePath: '/products' },
  { label: 'Earrings', href: '/products?type=earring', activePath: '/products' },
  { label: 'Necklaces', href: '/products?type=necklace', activePath: '/products' },
  { label: 'Bracelets', href: '/products?type=bracelet', activePath: '/products' },
  { label: 'Diamonds', href: '/diamonds', activePath: '/diamonds' },
  { label: '✦ Gifts', href: '/products?category=gifts', activePath: '/products', gift: true },
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
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([])
  const [diamondResults, setDiamondResults] = useState<SearchDiamond[]>([])
  const [searching, setSearching] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isAdmin = user?.email === 'ujjwalbana@gmail.com'
  const { isMiniCartOpen, itemCount, closeCart } = useCart()
  const { itemCount: wishlistCount } = useWishlist()

  useEffect(() => {
    supabaseAuth.auth.getUser().then(({ data }) => setUser(data.user))

    const {
      data: { subscription },
    } = supabaseAuth.auth.onAuthStateChange((event, session) => {
      void event
      setUser(session?.user || null)
    })

    const close = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        closeSearch()
      }
    }

    const closeMobile = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileOpen(false)
      }
    }

    document.addEventListener('mousedown', close)
    document.addEventListener('mousedown', closeMobile)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('mousedown', close)
      document.removeEventListener('mousedown', closeMobile)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll)
    }
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

  const handleQueryChange = useCallback(
    (query: string) => {
      setSearchQuery(query)
      void debouncedSearch(query)
    },
    [debouncedSearch]
  )

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setDiamondResults([])
  }

  const handleSignOut = async () => {
    await signOut()
    setIsDropdownOpen(false)
  }

  const navStyle = (link: (typeof navLinks)[number]): CSSProperties => {
    const active = pathname === link.activePath || (link.activePath === '/products' && pathname.startsWith('/products'))

    return {
      fontSize: '13px',
      color: link.gift ? '#C9A961' : active ? '#1A1014' : '#1A1014',
      textDecoration: 'none',
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
      fontFamily: 'var(--font-inter)',
      fontWeight: link.gift || active ? 500 : 400,
      borderBottom: active && !link.gift ? '1.5px solid #1A1014' : '1px solid transparent',
      paddingBottom: '4px',
      transition: 'color 0.2s, border-color 0.2s',
    }
  }

  return (
    <>
      <header
        style={{
          background: '#FBF5F0',
          borderBottom: '0.5px solid #EDD9AF',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%',
          boxShadow: scrolled ? '0 2px 20px rgba(26,16,20,0.06)' : 'none',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <nav
          className="jb-navbar"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 48px',
            height: '80px',
            background: '#FBF5F0',
            position: 'relative',
            width: '100%',
          }}
        >
          <Link href="/" className="jb-logo-link" style={{ textDecoration: 'none', flexShrink: 0, zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', cursor: 'pointer' }}>
              <span
                style={{
                  fontFamily: 'var(--font-italianno)',
                  fontSize: '32px',
                  color: '#C9A961',
                  lineHeight: 1,
                }}
              >
                just
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '15px',
                  letterSpacing: '0.32em',
                  color: '#1A1014',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                }}
              >
                BECAUSE
              </span>
            </div>
          </Link>

          <div
            className="jb-desktop-nav"
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '28px',
              alignItems: 'center',
              zIndex: 0,
            }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="jb-nav-link"
                style={navStyle(link)}
                onMouseEnter={(event) => {
                  event.currentTarget.style.color = '#C9A961'
                  event.currentTarget.style.borderBottomColor = '#C9A961'
                }}
                onMouseLeave={(event) => {
                  const nextStyle = navStyle(link)
                  event.currentTarget.style.color = String(nextStyle.color)
                  event.currentTarget.style.borderBottomColor = String(nextStyle.borderBottom).includes('#1A1014')
                    ? '#1A1014'
                    : 'transparent'
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div
            className="jb-desktop-icons"
            style={{
              display: 'flex',
              gap: '22px',
              alignItems: 'center',
              flexShrink: 0,
              zIndex: 1,
            }}
          >
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="jb-icon-action"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <Search size={20} color="#1A1014" />
            </button>
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              {user ? (
                <button
                  onClick={() => setIsDropdownOpen((open) => !open)}
                  aria-label="Account menu"
                  className="jb-icon-action"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#1A1014',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <User size={20} />
                </button>
              ) : (
                <Link href="/login" aria-label="Sign in" className="jb-icon-action" style={{ color: '#1A1014', display: 'flex' }}>
                  <User size={20} />
                </Link>
              )}
              {isDropdownOpen && user && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '34px',
                    width: '210px',
                    backgroundColor: '#FDF8F2',
                    border: '0.5px solid #EDD9AF',
                    boxShadow: '0 12px 34px rgba(26,16,20,0.12)',
                    padding: '8px',
                    zIndex: 200,
                  }}
                >
                  {[
                    ['My Account', '/account'],
                    ['My Orders', '/account/orders'],
                    ['Wishlist', '/wishlist'],
                    ...(isAdmin ? ([['Admin Panel', '/admin']] as const) : []),
                  ].map(([label, href]) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setIsDropdownOpen(false)}
                      style={{
                        color: '#1A1014',
                        display: 'block',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '12px',
                        padding: '10px 12px',
                        textDecoration: 'none',
                      }}
                    >
                      {label}
                    </Link>
                  ))}
                  <div style={{ backgroundColor: '#EDD9AF', height: '0.5px', margin: '6px 0' }} />
                  <button
                    onClick={handleSignOut}
                    style={{
                      color: '#B8A090',
                      display: 'block',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '12px',
                      padding: '10px 12px',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
            <Link href="/wishlist" aria-label="Wishlist" className="jb-icon-action" style={{ color: '#1A1014', position: 'relative', display: 'flex' }}>
              <Heart size={20} color="#1A1014" />
              {wishlistCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-7px',
                    background: '#E8C4D0',
                    color: '#6B2D44',
                    borderRadius: '50%',
                    width: '15px',
                    height: '15px',
                    fontSize: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 500,
                  }}
                >
                  {wishlistCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="jb-icon-action"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ShoppingBag size={20} color="#1A1014" />
              {itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  animate={{ scale: [1.3, 1] }}
                  transition={{ duration: 0.25 }}
                  style={{
                    position: 'absolute',
                    top: '-7px',
                    right: '-8px',
                    background: '#E8C4D0',
                    color: '#6B2D44',
                    borderRadius: '50%',
                    minWidth: '15px',
                    height: '15px',
                    padding: '0 4px',
                    fontSize: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 500,
                    lineHeight: 1,
                  }}
                >
                  {itemCount}
                </motion.span>
              )}
            </button>
          </div>
          <div className="jb-mobile-actions">
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="jb-icon-action"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ShoppingBag size={20} color="#1A1014" />
              {itemCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-7px',
                    background: '#E8C4D0',
                    color: '#6B2D44',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    fontSize: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 500,
                  }}
                >
                  {itemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileOpen((open) => !open)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              className="jb-icon-action"
              style={{
                width: '44px',
                height: '44px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '5px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {[0, 1, 2].map((line) => (
                <span
                  key={line}
                  style={{
                    width: '24px',
                    height: '2px',
                    background: '#1A1014',
                    transform:
                      mobileOpen && line === 0
                        ? 'translateY(7px) rotate(45deg)'
                        : mobileOpen && line === 1
                          ? 'scaleX(0)'
                          : mobileOpen && line === 2
                            ? 'translateY(-7px) rotate(-45deg)'
                            : 'none',
                    transition: 'transform 0.25s ease',
                  }}
                />
              ))}
            </button>
          </div>
        </nav>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              ref={mobileMenuRef}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="jb-mobile-menu"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 24px',
                    color: link.gift ? '#C9A961' : '#1A1014',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '15px',
                    textDecoration: 'none',
                    borderBottom: '0.5px solid #EDD9AF',
                  }}
                >
                  {link.label}
                  <span style={{ color: '#C9A961' }}>›</span>
                </Link>
              ))}
              <div style={{ padding: '20px 24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <button className="jb-icon-action" onClick={() => { setMobileOpen(false); setSearchOpen(true) }} aria-label="Search" style={{ color: '#1A1014' }}><Search size={20} /></button>
                <Link className="jb-icon-action" onClick={() => setMobileOpen(false)} href={user ? '/account' : '/login'} style={{ color: '#1A1014' }}><User size={20} /></Link>
                <Link className="jb-icon-action" onClick={() => setMobileOpen(false)} href="/wishlist" style={{ color: '#1A1014', position: 'relative' }}>
                  <Heart size={20} />
                  {wishlistCount > 0 && <span style={{ position: 'absolute', top: '-7px', right: '-7px', background: '#E8C4D0', color: '#6B2D44', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{wishlistCount}</span>}
                </Link>
                <button className="jb-icon-action" onClick={() => { setMobileOpen(false); setCartOpen(true) }} aria-label="Open cart" style={{ color: '#1A1014', position: 'relative' }}>
                  <ShoppingBag size={20} />
                  {itemCount > 0 && <span style={{ position: 'absolute', top: '-7px', right: '-7px', background: '#E8C4D0', color: '#6B2D44', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{itemCount}</span>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSearch}
              className="jb-search-panel"
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(26,16,20,0.5)',
                zIndex: 300,
                backdropFilter: 'blur(4px)',
              }}
            />
            <motion.section
              initial={{ y: -24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                background: '#FBF5F0',
                zIndex: 301,
                padding: '24px 80px',
                borderBottom: '0.5px solid #EDD9AF',
              }}
            >
              <div className="flex items-center gap-4">
                <Search color="#C9A961" size={20} />
                <input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={(event) => handleQueryChange(event.target.value)}
                  placeholder="Search for rings, necklaces, diamonds..."
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '28px',
                    color: '#1A1014',
                    outline: 'none',
                  }}
                />
                <button onClick={closeSearch} aria-label="Close search" style={{ color: '#B8A090', padding: '6px' }}>
                  <X size={20} />
                </button>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {popularSearches.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleQueryChange(suggestion)}
                    style={{
                      border: '0.5px solid #EDD9AF',
                      borderRadius: '999px',
                      color: '#B8A090',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '11px',
                      padding: '7px 12px',
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.section>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="jb-search-results"
              style={{
                position: 'fixed',
                top: '138px',
                left: 0,
                right: 0,
                maxHeight: 'calc(100vh - 138px)',
                overflowY: 'auto',
                zIndex: 301,
                padding: '32px 80px',
              }}
            >
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
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            onClick={closeSearch}
                            style={{
                              display: 'flex',
                              gap: '12px',
                              padding: '16px',
                              background: '#FDF8F2',
                              border: '0.5px solid #EDD9AF',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              textDecoration: 'none',
                            }}
                          >
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
                              {diamond.color} color · {diamond.clarity}
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <MiniCartDrawer
        isOpen={cartOpen || isMiniCartOpen}
        onClose={() => {
          setCartOpen(false)
          closeCart()
        }}
      />
    </>
  )
}

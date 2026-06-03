'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import { MiniCartDrawer } from '@/components/cart/MiniCartDrawer'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useRole } from '@/hooks/useRole'

type MegaMenuLink = {
  label: string
  href: string
}

type MegaMenuSection = {
  title: string
  links: MegaMenuLink[]
}

type MegaMenuImage = {
  src: string
  label: string
  href: string
}

type MegaMenuEntry = {
  sections: MegaMenuSection[]
  images: MegaMenuImage[]
}

const megaMenuData: Record<string, MegaMenuEntry> = {
  'Engagement rings': {
    sections: [
      {
        title: 'DESIGN YOUR RING',
        links: [
          { label: 'Start With a Setting', href: '/products?type=engagement_ring' },
          { label: 'Start With a Diamond', href: '/diamonds' },
          { label: 'Build Your Ring', href: '/build' },
        ],
      },
      {
        title: 'SHOP BY STYLE',
        links: [
          { label: 'Solitaire', href: '/products?type=engagement_ring&category=solitaire' },
          { label: 'Pave', href: '/products?type=engagement_ring&category=pave' },
          { label: 'Halo', href: '/products?type=engagement_ring&category=halo' },
          { label: 'Hidden Halo', href: '/products?type=engagement_ring&category=hidden_halo' },
          { label: 'Three Stone', href: '/products?type=engagement_ring&category=three_stone' },
          { label: 'Side Stone', href: '/products?type=engagement_ring&category=side_stone' },
          { label: 'Channel Set', href: '/products?type=engagement_ring&category=channel_set' },
        ],
      },
      {
        title: 'SHOP BY SHAPE',
        links: [
          { label: 'Round', href: '/products?shape=round' },
          { label: 'Oval', href: '/products?shape=oval' },
          { label: 'Cushion', href: '/products?shape=cushion' },
          { label: 'Princess', href: '/products?shape=princess' },
          { label: 'Emerald', href: '/products?shape=emerald' },
          { label: 'Pear', href: '/products?shape=pear' },
          { label: 'Marquise', href: '/products?shape=marquise' },
          { label: 'Heart', href: '/products?shape=heart' },
        ],
      },
      {
        title: 'EXPLORE',
        links: [
          { label: 'Best Sellers', href: '/products?sort=featured&type=engagement_ring' },
          { label: 'New Arrivals', href: '/products?sort=new&type=engagement_ring' },
          { label: 'Under $3,000', href: '/products?maxPrice=3000&type=engagement_ring' },
          { label: 'Ring Size Guide', href: '/education/ring-size' },
        ],
      },
    ],
    images: [
      {
        src: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&q=85',
        label: 'BEST SELLERS',
        href: '/products?sort=featured&type=engagement_ring',
      },
      {
        src: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400&q=85',
        label: 'NEW ARRIVALS',
        href: '/products?sort=new&type=engagement_ring',
      },
    ],
  },
  Rings: {
    sections: [
      {
        title: 'SHOP BY TYPE',
        links: [
          { label: 'Engagement Rings', href: '/products?type=engagement_ring' },
          { label: 'Wedding Bands', href: '/products?type=wedding_ring' },
          { label: 'Eternity Bands', href: '/products?type=ring&category=eternity' },
          { label: 'Stackable Rings', href: '/products?type=ring&category=stackable' },
        ],
      },
      {
        title: 'WEDDING BANDS',
        links: [
          { label: 'Classic Bands', href: '/products?type=wedding_ring&category=classic' },
          { label: 'Diamond Bands', href: '/products?type=wedding_ring&category=diamond_band' },
          { label: 'Eternity Rings', href: '/products?type=wedding_ring&category=eternity' },
          { label: 'Curved Bands', href: '/products?type=wedding_ring&category=curved' },
          { label: "Men's Bands", href: '/products?type=wedding_ring&gender=mens' },
        ],
      },
      {
        title: 'BY METAL',
        links: [
          { label: 'White Gold', href: '/products?metal=white_gold&type=ring' },
          { label: 'Yellow Gold', href: '/products?metal=yellow_gold&type=ring' },
          { label: 'Rose Gold', href: '/products?metal=rose_gold&type=ring' },
          { label: 'Platinum', href: '/products?metal=platinum&type=ring' },
        ],
      },
    ],
    images: [
      {
        src: 'https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=400&q=85',
        label: 'WEDDING BANDS',
        href: '/products?type=wedding_ring',
      },
    ],
  },
  Earrings: {
    sections: [
      {
        title: 'SHOP BY STYLE',
        links: [
          { label: 'Stud Earrings', href: '/products?type=earring&category=stud' },
          { label: 'Hoop Earrings', href: '/products?type=earring&category=hoop' },
          { label: 'Drop Earrings', href: '/products?type=earring&category=drop' },
          { label: 'Huggie Earrings', href: '/products?type=earring&category=huggie' },
        ],
      },
      {
        title: 'BY DIAMOND',
        links: [
          { label: 'Diamond Studs', href: '/products?type=earring&material=diamond' },
          { label: 'Solitaire Studs', href: '/products?type=earring&category=solitaire' },
          { label: 'Pave Earrings', href: '/products?type=earring&category=pave' },
          { label: 'Halo Earrings', href: '/products?type=earring&category=halo' },
        ],
      },
    ],
    images: [
      {
        src: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=400&q=85',
        label: 'DIAMOND STUDS',
        href: '/products?type=earring',
      },
    ],
  },
  Necklaces: {
    sections: [
      {
        title: 'SHOP BY STYLE',
        links: [
          { label: 'Diamond Pendants', href: '/products?type=necklace&category=pendant' },
          { label: 'Tennis Necklaces', href: '/products?type=necklace&category=tennis' },
          { label: 'Station Necklaces', href: '/products?type=necklace&category=station' },
          { label: 'Chokers', href: '/products?type=necklace&category=choker' },
        ],
      },
      {
        title: 'BY LENGTH',
        links: [
          { label: 'Choker (14-16")', href: '/products?type=necklace&length=choker' },
          { label: 'Princess (18")', href: '/products?type=necklace&length=princess' },
          { label: 'Matinee (20-22")', href: '/products?type=necklace&length=matinee' },
        ],
      },
    ],
    images: [
      {
        src: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=85',
        label: 'PENDANTS',
        href: '/products?type=necklace',
      },
    ],
  },
  Bracelets: {
    sections: [
      {
        title: 'SHOP BY STYLE',
        links: [
          { label: 'Tennis Bracelets', href: '/products?type=bracelet&category=tennis' },
          { label: 'Bangles', href: '/products?type=bracelet&category=bangle' },
          { label: 'Chain Bracelets', href: '/products?type=bracelet&category=chain' },
          { label: 'Cuff Bracelets', href: '/products?type=bracelet&category=cuff' },
        ],
      },
    ],
    images: [
      {
        src: 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=400&q=85',
        label: 'TENNIS BRACELETS',
        href: '/products?type=bracelet',
      },
    ],
  },
  Diamonds: {
    sections: [
      {
        title: 'SHOP DIAMONDS',
        links: [
          { label: 'All Diamonds', href: '/diamonds' },
          { label: 'Round Diamonds', href: '/diamonds?shape=round' },
          { label: 'Oval Diamonds', href: '/diamonds?shape=oval' },
          { label: 'Cushion Diamonds', href: '/diamonds?shape=cushion' },
          { label: 'Princess Diamonds', href: '/diamonds?shape=princess' },
          { label: 'Emerald Diamonds', href: '/diamonds?shape=emerald' },
        ],
      },
      {
        title: 'LEARN',
        links: [
          { label: 'The 4 Cs', href: '/education/4cs' },
          { label: 'Diamond Shapes', href: '/education/shapes' },
          { label: 'Lab vs Natural', href: '/education/lab-grown' },
          { label: 'IGI Certification', href: '/education/igi' },
        ],
      },
      {
        title: 'BY CARAT',
        links: [
          { label: 'Under 1 Carat', href: '/diamonds?maxCarat=1' },
          { label: '1.0 - 1.5 Carat', href: '/diamonds?minCarat=1&maxCarat=1.5' },
          { label: '1.5 - 2.0 Carat', href: '/diamonds?minCarat=1.5&maxCarat=2' },
          { label: '2.0+ Carat', href: '/diamonds?minCarat=2' },
        ],
      },
    ],
    images: [
      {
        src: 'https://images.unsplash.com/photo-1616418195576-4b5ab01efb6d?w=400&q=85',
        label: 'LOOSE DIAMONDS',
        href: '/diamonds',
      },
    ],
  },
}

const menuLabels = Object.keys(megaMenuData)

export function Navbar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const menuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { isMiniCartOpen, itemCount, closeCart } = useCart()
  const { itemCount: wishlistCount } = useWishlist()
  const { isAdmin } = useRole()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setActiveMenu(null)
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    return () => {
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current)
      }
    }
  }, [])

  const clearMenuTimeout = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current)
      menuTimeoutRef.current = null
    }
  }

  const handleMouseEnter = (label: string) => {
    clearMenuTimeout()
    if (megaMenuData[label]) {
      setActiveMenu(label)
    }
  }

  const handleMouseLeave = () => {
    clearMenuTimeout()
    menuTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null)
    }, 150)
  }

  const submitSearch = () => {
    const query = searchQuery.trim()
    if (!query) return
    router.push(`/products?q=${encodeURIComponent(query)}`)
    setSearchOpen(false)
    setSearchQuery('')
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
  }

  const activeEntry = activeMenu ? megaMenuData[activeMenu] : null

  return (
    <>
      <style>{`
        .nav-logo-script {
          font-family: var(--font-italianno), cursive !important;
          font-size: 30px !important;
          color: #C9A961 !important;
          line-height: 0.85 !important;
          display: block !important;
        }

        .mega-link {
          font-size: 13px;
          color: #1A1014;
          text-decoration: none;
          font-family: var(--font-inter);
          line-height: 2.2;
          display: block;
          transition: color 0.15s ease;
          white-space: nowrap;
        }

        .mega-link:hover {
          color: #C9A961;
        }

        .mega-image-card {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          flex: 1;
          min-width: 160px;
          max-width: 220px;
        }

        .mega-image-card img {
          width: 100%;
          aspect-ratio: 3 / 4;
          object-fit: cover;
          display: block;
          transition: transform 0.5s ease;
        }

        .mega-image-card:hover img {
          transform: scale(1.04);
        }

        .nav-link-item {
          position: relative;
          padding: 0 2px;
          cursor: pointer;
        }

        .nav-link-item::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 1px;
          background: #1A1014;
          transition: width 0.25s ease;
        }

        .nav-link-item:hover::after,
        .nav-link-item.active::after {
          width: 100%;
        }

        .desktop-mega-nav {
          display: none !important;
        }

        .desktop-nav-icon {
          display: none !important;
        }

        .mobile-menu-btn {
          display: flex !important;
        }

        @media (min-width: 1120px) {
          .desktop-mega-nav {
            display: flex !important;
          }

          .desktop-nav-icon {
            display: flex !important;
          }

          .mobile-menu-btn {
            display: none !important;
          }
        }

        @media (max-width: 1119px) {
          .navbar-inner {
            padding: 0 24px !important;
          }
        }

        @keyframes megaFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 200,
          background: '#FBF5F0',
          borderBottom: `0.5px solid ${scrolled ? '#EDD9AF' : 'transparent'}`,
          boxShadow: scrolled ? '0 2px 20px rgba(26,16,20,0.06)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <div
          className="navbar-inner"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 60px',
            height: '68px',
            maxWidth: '1500px',
            margin: '0 auto',
            position: 'relative',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, minWidth: 'fit-content', userSelect: 'none', zIndex: 2 }}>
            <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: '1px', lineHeight: 1 }}>
              <span
                style={{
                  fontFamily: 'var(--font-italianno)',
                  filter: 'drop-shadow(0 1px 3px rgba(201,169,97,0.25))',
                  fontSize: '2.2rem',
                  fontStyle: 'italic',
                  color: '#C9A961',
                  display: 'block',
                  lineHeight: 1,
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                }}
              >
                just
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginTop: '-4px',
                  whiteSpace: 'nowrap',
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '0.5px',
                    background: '#C9A961',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '7.5px',
                    letterSpacing: '0.32em',
                    color: '#1A1014',
                    fontWeight: 500,
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  BECAUSE
                </span>
                <div
                  style={{
                    width: '18px',
                    height: '0.5px',
                    background: '#C9A961',
                    flexShrink: 0,
                  }}
                />
              </div>
            </div>
          </Link>

          <nav className="desktop-nav-center desktop-mega-nav" style={{ gap: '28px', alignItems: 'center', minWidth: 0, overflow: 'hidden', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            {menuLabels.map((label) => (
              <div
                key={label}
                className={`nav-link-item ${activeMenu === label ? 'active' : ''}`}
                onMouseEnter={() => handleMouseEnter(label)}
                onMouseLeave={handleMouseLeave}
              >
                <span style={{ fontSize: '12px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontWeight: activeMenu === label ? 500 : 400, letterSpacing: '0.02em', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                  {label}
                </span>
              </div>
            ))}

            <Link href="/products?category=gifts" style={{ fontSize: '12px', color: '#C9A961', textDecoration: 'none', fontFamily: 'var(--font-inter)', fontWeight: 500, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
              * Gifts
            </Link>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexShrink: 0, zIndex: 2 }}>
            <button
              onClick={() => setSearchOpen((open) => !open)}
              className="desktop-nav-icon"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', alignItems: 'center', gap: '6px', color: '#1A1014' }}
            >
              <Search size={18} color="#1A1014" />
              <span style={{ fontSize: '11px', letterSpacing: '0.12em', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>SEARCH</span>
            </button>

            <Link href="/account" className="desktop-nav-icon" style={{ alignItems: 'center', color: '#1A1014', textDecoration: 'none' }} aria-label="Account">
              <User size={18} color="#1A1014" />
            </Link>

            {isAdmin && (
              <Link href="/admin" className="desktop-nav-icon" style={{ alignItems: 'center', color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textDecoration: 'none' }}>
                ADMIN
              </Link>
            )}

            <Link href="/wishlist" className="desktop-nav-icon" style={{ position: 'relative', alignItems: 'center' }} aria-label="Wishlist">
              <Heart size={18} color="#1A1014" />
              {wishlistCount > 0 && (
                <span style={{ position: 'absolute', top: '-6px', right: '-7px', background: '#E8C4D0', color: '#6B2D44', borderRadius: '50%', width: '15px', height: '15px', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500 }}>
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setCartOpen(true)}
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
              aria-label="Open cart"
            >
              <ShoppingBag size={18} color="#1A1014" />
              {itemCount > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-6px', background: '#E8C4D0', color: '#6B2D44', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500 }}>
                  {itemCount}
                </span>
              )}
            </button>

            <span className="desktop-nav-icon" style={{ fontSize: '11px', color: '#B8A090', fontFamily: 'var(--font-inter)', letterSpacing: '0.08em', cursor: 'pointer', alignItems: 'center' }}>USD v</span>

            <button
              onClick={() => setMobileOpen((open) => !open)}
              className="mobile-menu-btn"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', alignItems: 'center' }}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} color="#1A1014" /> : <Menu size={22} color="#1A1014" />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div style={{ borderTop: '0.5px solid #EDD9AF', padding: '16px 60px', background: '#FBF5F0', display: 'flex', alignItems: 'center', gap: '16px', animation: 'megaFadeIn 0.2s ease' }}>
            <Search size={18} color="#B8A090" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  submitSearch()
                }
                if (event.key === 'Escape') {
                  closeSearch()
                }
              }}
              placeholder="Search for rings, diamonds, necklaces..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '16px', color: '#1A1014', fontFamily: 'var(--font-inter)' }}
            />
            <button onClick={closeSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B8A090' }} aria-label="Close search">
              <X size={18} />
            </button>
          </div>
        )}

        {activeEntry && activeMenu && (
          <div
            onMouseEnter={clearMenuTimeout}
            onMouseLeave={handleMouseLeave}
            style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#FBF5F0', borderTop: '0.5px solid #EDD9AF', borderBottom: '0.5px solid #EDD9AF', boxShadow: '0 8px 32px rgba(26,16,20,0.10)', zIndex: 300, animation: 'megaFadeIn 0.2s ease' }}
          >
            <div style={{ maxWidth: '1500px', margin: '0 auto', padding: '36px 60px', display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '48px', flex: 1 }}>
                {activeEntry.sections.map((section) => (
                  <div key={section.title} style={{ minWidth: '140px' }}>
                    <div style={{ fontSize: '9px', letterSpacing: '0.28em', color: '#C9A961', fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '12px', paddingBottom: '8px', borderBottom: '0.5px solid #EDD9AF' }}>
                      {section.title}
                    </div>
                    {section.links.map((link) => (
                      <Link key={link.href} href={link.href} className="mega-link" onClick={() => setActiveMenu(null)}>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                {activeEntry.images.map((image) => (
                  <Link key={image.href} href={image.href} className="mega-image-card" onClick={() => setActiveMenu(null)} style={{ textDecoration: 'none' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.src} alt={image.label} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(26,16,20,0.7) 0%, transparent 100%)', padding: '20px 12px 12px' }}>
                      <div style={{ fontSize: '9px', letterSpacing: '0.22em', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
                        {image.label}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#1A1014',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '0.5px solid rgba(201,169,97,0.15)',
            }}
          >
            <Link href="/" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none', flexShrink: 0, minWidth: 'fit-content', userSelect: 'none' }}>
              <span style={{ display: 'block', filter: 'drop-shadow(0 1px 3px rgba(201,169,97,0.25))', fontFamily: 'var(--font-italianno)', fontSize: '2.2rem', fontStyle: 'italic', color: '#C9A961', lineHeight: 1, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                just
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '-4px', whiteSpace: 'nowrap' }}>
                <div style={{ width: '18px', height: '0.5px', background: 'rgba(201,169,97,0.8)' }} />
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '7.5px', fontWeight: 500, letterSpacing: '0.32em', color: 'rgba(251,245,240,0.7)', lineHeight: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  BECAUSE
                </span>
                <div style={{ width: '18px', height: '0.5px', background: 'rgba(201,169,97,0.8)' }} />
              </div>
            </Link>

            <button
              onClick={() => setMobileOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FBF5F0', padding: '8px' }}
              aria-label="Close menu"
            >
              <X size={24} color="#FBF5F0" />
            </button>
          </div>

          <nav style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}>
            {[
              { label: 'Engagement rings', href: '/products?type=engagement_ring' },
              { label: 'Rings', href: '/products?type=ring' },
              { label: 'Earrings', href: '/products?type=earring' },
              { label: 'Necklaces', href: '/products?type=necklace' },
              { label: 'Bracelets', href: '/products?type=bracelet' },
              { label: 'Diamonds', href: '/diamonds' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '18px 24px',
                  borderBottom: '0.5px solid rgba(251,245,240,0.08)',
                  textDecoration: 'none',
                  color: '#FBF5F0',
                  fontSize: '16px',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                {item.label}
                <span style={{ color: 'rgba(201,169,97,0.5)', fontSize: '18px' }}>&gt;</span>
              </Link>
            ))}

            <Link
              href="/products?category=gifts"
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 24px',
                borderBottom: '0.5px solid rgba(251,245,240,0.08)',
                textDecoration: 'none',
                color: '#C9A961',
                fontSize: '16px',
                fontFamily: 'var(--font-inter)',
                fontWeight: 500,
              }}
            >
              Gifts
              <span style={{ color: 'rgba(201,169,97,0.5)', fontSize: '18px' }}>&gt;</span>
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '18px 24px',
                  borderBottom: '0.5px solid rgba(251,245,240,0.08)',
                  textDecoration: 'none',
                  color: '#C9A961',
                  fontSize: '16px',
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 500,
                }}
              >
                Admin Panel
                <span style={{ color: 'rgba(201,169,97,0.5)', fontSize: '18px' }}>&gt;</span>
              </Link>
            )}
          </nav>

          <div
            style={{
              padding: '24px',
              borderTop: '0.5px solid rgba(201,169,97,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <Link href="/account" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(251,245,240,0.7)', fontSize: '14px', textDecoration: 'none', fontFamily: 'var(--font-inter)' }}>
              <User size={18} />
              Account
            </Link>
            <Link href="/wishlist" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(251,245,240,0.7)', fontSize: '14px', textDecoration: 'none', fontFamily: 'var(--font-inter)' }}>
              <Heart size={18} />
              Wishlist
            </Link>
          </div>
        </div>
      )}

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

export default Navbar

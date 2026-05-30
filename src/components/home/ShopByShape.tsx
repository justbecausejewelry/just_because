'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const shapes = [
  { name: 'Round', src: '/images/shapes/round.png', href: '/diamonds?shape=round' },
  { name: 'Oval', src: '/images/shapes/oval.png', href: '/diamonds?shape=oval' },
  { name: 'Emerald', src: '/images/shapes/emerald.png', href: '/diamonds?shape=emerald' },
  { name: 'Pear', src: '/images/shapes/pear.png', href: '/diamonds?shape=pear' },
  { name: 'Princess', src: '/images/shapes/princess.png', href: '/diamonds?shape=princess' },
  { name: 'Cushion', src: '/images/shapes/cushion.png', href: '/diamonds?shape=cushion' },
  { name: 'Radiant', src: '/images/shapes/radiant.png', href: '/diamonds?shape=radiant' },
  { name: 'Marquise', src: '/images/shapes/marquise.png', href: '/diamonds?shape=marquise' },
  { name: 'Heart', src: '/images/shapes/heart.png', href: '/diamonds?shape=heart' },
  { name: 'Asscher', src: '/images/shapes/asscher.png', href: '/diamonds?shape=asscher' },
]

export function ShopByShape() {
  const [startIndex, setStartIndex] = useState(0)
  const [selected, setSelected] = useState('Round')
  const [windowWidth, setWindowWidth] = useState(1200)
  const [isSliding, setIsSliding] = useState(false)
  const [leftHover, setLeftHover] = useState(false)
  const [rightHover, setRightHover] = useState(false)

  useEffect(() => {
    setWindowWidth(window.innerWidth)

    const handler = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handler)

    return () => window.removeEventListener('resize', handler)
  }, [])

  const visibleCount = windowWidth < 1024 ? 10 : 5
  const imageSize = windowWidth < 768 ? 50 : windowWidth < 1024 ? 72 : 140
  const arrowSize = windowWidth < 768 ? 36 : 44

  const animateSlide = (nextIndex: number) => {
    setIsSliding(true)
    setStartIndex(nextIndex)
    window.setTimeout(() => setIsSliding(false), 200)
  }

  const prev = () =>
    animateSlide((startIndex - 1 + shapes.length) % shapes.length)

  const next = () => animateSlide((startIndex + 1) % shapes.length)

  const visibleShapes = Array.from(
    { length: visibleCount },
    (_, index) => shapes[(startIndex + index) % shapes.length],
  )

  const selectedHref = `/diamonds?shape=${selected.toLowerCase()}`

  const arrowBaseStyle = (hovered: boolean) => ({
    width: `${arrowSize}px`,
    height: `${arrowSize}px`,
    borderRadius: '50%',
    border: `0.5px solid ${hovered ? '#1A1014' : '#EDD9AF'}`,
    background: hovered ? '#1A1014' : '#FBF5F0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.25s',
  })

  return (
    <section
      className="shop-shape-section"
      style={{
        background: '#FBF5F0',
        padding: '72px 60px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontSize: '10px',
          letterSpacing: '0.3em',
          color: '#C9A961',
          fontFamily: 'var(--font-inter)',
          marginBottom: '14px',
        }}
      >
        SHOP BY SHAPE
      </p>

      <h2
        style={{
          fontFamily: 'var(--font-playfair)',
          fontSize: windowWidth < 768 ? '22px' : '30px',
          fontWeight: 400,
          color: '#1A1014',
          margin: 0,
        }}
      >
        Find your diamond&apos;s silhouette
      </h2>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: windowWidth < 768 ? '8px' : '16px',
          position: 'relative',
          marginTop: '40px',
        }}
      >
        <button
          className="shop-shape-arrow"
          type="button"
          aria-label="Previous shape"
          onClick={prev}
          onMouseEnter={() => setLeftHover(true)}
          onMouseLeave={() => setLeftHover(false)}
          style={arrowBaseStyle(leftHover)}
        >
          <ChevronLeft size={20} color={leftHover ? '#FBF5F0' : '#1A1014'} />
        </button>

        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: windowWidth < 1024 ? 'wrap' : 'nowrap',
              justifyContent: 'center',
              gap: windowWidth < 768 ? '8px' : '12px',
              overflow: 'hidden',
              opacity: isSliding ? 0.7 : 1,
              transition: 'opacity 0.2s ease',
            }}
          >
            {visibleShapes.map((shape) => {
              const isSelected = selected === shape.name

              return (
                <Link
                  key={shape.name}
                  href={shape.href}
                  onClick={() => setSelected(shape.name)}
                  onMouseEnter={(event) => {
                    if (!isSelected) {
                      event.currentTarget.style.borderColor = '#EDD9AF'
                      event.currentTarget.style.background = '#FDF8F2'
                    }
                  }}
                  onMouseLeave={(event) => {
                    if (!isSelected) {
                      event.currentTarget.style.borderColor = 'transparent'
                      event.currentTarget.style.background = 'transparent'
                    }
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: windowWidth < 768 ? '8px' : '14px',
                    padding: windowWidth < 768 ? '10px 6px' : windowWidth < 1024 ? '14px 8px' : '24px 20px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    border: `1px solid ${
                      isSelected ? '#C9A961' : 'transparent'
                    }`,
                    borderRadius: '4px',
                    background: isSelected ? '#FDF8F2' : 'transparent',
                    transition: 'all 0.35s ease',
                    minWidth: windowWidth < 768 ? '56px' : windowWidth < 1024 ? '72px' : '140px',
                  }}
                >
                  <Image
                    src={shape.src}
                    alt={`${shape.name} cut diamond`}
                    width={imageSize}
                    height={imageSize}
                    sizes="(max-width: 767px) 50px, (max-width: 1023px) 72px, 140px"
                    style={{
                      width: `${imageSize}px`,
                      height: `${imageSize}px`,
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 4px 12px rgba(26,16,20,0.12))',
                      mixBlendMode: 'multiply',
                    }}
                  />
                  <span
                    style={{
                      fontSize: windowWidth < 768 ? '9px' : '13px',
                      color: isSelected ? '#C9A961' : '#B8A090',
                      letterSpacing: '0.08em',
                      fontFamily: 'var(--font-inter)',
                      fontWeight: isSelected ? 500 : 400,
                    }}
                  >
                    {shape.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        <button
          className="shop-shape-arrow"
          type="button"
          aria-label="Next shape"
          onClick={next}
          onMouseEnter={() => setRightHover(true)}
          onMouseLeave={() => setRightHover(false)}
          style={arrowBaseStyle(rightHover)}
        >
          <ChevronRight size={20} color={rightHover ? '#FBF5F0' : '#1A1014'} />
        </button>
      </div>

      <div
        style={{
          marginTop: '24px',
          fontSize: '11px',
          color: '#B8A090',
          fontFamily: 'var(--font-inter)',
          letterSpacing: '0.1em',
        }}
      >
        Selected: {selected} Cut
        <Link
          href={selectedHref}
          style={{
            color: '#C9A961',
            fontSize: '11px',
            letterSpacing: '0.1em',
            textDecoration: 'none',
            marginLeft: '16px',
          }}
        >
          Shop {selected} Diamonds →
        </Link>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '6px',
          justifyContent: 'center',
          marginTop: '16px',
        }}
      >
        {shapes.map((shape) => (
          <span
            key={shape.name}
            style={{
              width: shape.name === selected ? '20px' : '6px',
              height: '6px',
              borderRadius: '999px',
              background: shape.name === selected ? '#1A1014' : '#EDD9AF',
              transition: 'width 0.3s ease',
            }}
          />
        ))}
      </div>
    </section>
  )
}

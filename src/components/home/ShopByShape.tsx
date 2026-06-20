'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

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
  const [selected, setSelected] = useState('Round')
  const selectedHref = `/diamonds?shape=${selected.toLowerCase()}`

  return (
    <section
      className="shop-shape-section"
      style={{
        background: '#FBF5F0',
        padding: '72px 24px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          color: '#C9A961',
          fontFamily: 'var(--font-jost)',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.22em',
          marginBottom: '14px',
        }}
      >
        SHOP BY SHAPE
      </p>

      <h2
        style={{
          color: '#1A1014',
          fontFamily: 'var(--font-cormorant)',
          fontSize: 'clamp(2rem,4vw,3.2rem)',
          fontWeight: 400,
          margin: 0,
        }}
      >
        Find your diamond&apos;s silhouette
      </h2>

      <div className="mx-auto mt-8 flex w-full max-w-md flex-col items-center justify-center px-4 md:mt-10 md:max-w-5xl">
        <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-5">
          {shapes.map((shape) => {
            const isSelected = selected === shape.name

            return (
              <Link
                key={shape.name}
                href={shape.href}
                className="aspect-square"
                onClick={() => setSelected(shape.name)}
                style={{
                  alignItems: 'center',
                  background: isSelected ? '#FDF8F2' : '#FBF5F0',
                  border: `0.5px solid ${isSelected ? '#C9A961' : '#EDD9AF'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  justifyContent: 'center',
                  padding: '16px 10px',
                  textDecoration: 'none',
                  transition: 'background 0.35s ease, border-color 0.35s ease, transform 0.35s ease',
                }}
              >
                <Image
                  src={shape.src}
                  alt={`${shape.name} cut diamond`}
                  width={88}
                  height={88}
                  sizes="(max-width: 767px) 80px, 88px"
                  style={{
                    height: 'clamp(64px, 18vw, 88px)',
                    mixBlendMode: 'multiply',
                    objectFit: 'contain',
                    width: 'clamp(64px, 18vw, 88px)',
                  }}
                />
                <span
                  style={{
                    color: isSelected ? '#C9A961' : '#1A1014',
                    fontFamily: 'var(--font-jost)',
                    fontSize: '14px',
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                  }}
                >
                  {shape.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      <div
        className="mx-auto flex max-w-md flex-col items-center justify-center gap-2 px-4 md:max-w-none md:flex-row"
        style={{
          color: 'var(--color-muted-text)',
          fontFamily: 'var(--font-jost)',
          fontSize: '15px',
          letterSpacing: '0.1em',
          marginTop: '24px',
        }}
      >
        <span>Selected: {selected} Cut</span>
        <Link
          href={selectedHref}
          style={{
            color: '#C9A961',
            fontSize: '14px',
            letterSpacing: '0.1em',
            textDecoration: 'none',
          }}
        >
          {`Shop ${selected} Diamonds`} &rarr;
        </Link>
      </div>
    </section>
  )
}

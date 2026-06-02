'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

type DiamondVisualizerProps = {
  shape: string
  carat: number
}

function diamondSize(carat: number) {
  return Math.max(18, Math.min(48, 18 + carat * 6))
}

export default function DiamondVisualizer({ shape, carat }: DiamondVisualizerProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
  }, [shape])

  const shapeImagePath = `/images/diamonds/${shape.toLowerCase()}-hand.jpg`
  const handImageSrc = imageError
    ? '/images/diamonds/round-hand.jpg'
    : shapeImagePath

  const size = diamondSize(carat)
  const shapeStyle = useMemo(() => {
    const lowerShape = shape.toLowerCase()
    if (lowerShape === 'oval' || lowerShape === 'marquise') {
      return { borderRadius: '50%', height: `${size * 1.24}px`, width: `${size * 0.78}px` }
    }
    if (lowerShape === 'emerald' || lowerShape === 'radiant') {
      return { borderRadius: '2px', height: `${size * 1.18}px`, width: `${size * 0.82}px` }
    }
    if (lowerShape === 'pear') {
      return { borderRadius: '60% 60% 60% 6px', height: `${size * 1.2}px`, transform: 'rotate(45deg)', width: `${size * 0.9}px` }
    }
    if (lowerShape === 'heart') {
      return { borderRadius: '50% 50% 4px 50%', height: `${size}px`, transform: 'rotate(45deg)', width: `${size}px` }
    }
    if (lowerShape === 'princess' || lowerShape === 'asscher') {
      return { borderRadius: '2px', height: `${size}px`, transform: 'rotate(45deg)', width: `${size}px` }
    }
    if (lowerShape === 'cushion') {
      return { borderRadius: '8px', height: `${size}px`, width: `${size}px` }
    }
    return { borderRadius: '50%', height: `${size}px`, width: `${size}px` }
  }, [shape, size])

  return (
    <div style={{ aspectRatio: '1', position: 'relative', overflow: 'hidden', background: '#F5E8ED' }}>
      <Image
        key={handImageSrc}
        src={handImageSrc}
        alt={`${shape} diamond on hand`}
        fill
        sizes="(max-width: 768px) 100vw, 450px"
        priority={false}
        quality={90}
        style={{
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageError(true)
          setImageLoaded(false)
        }}
      />

      {!imageLoaded ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#FDF8F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#B8A090',
            fontFamily: 'var(--font-inter)',
            fontSize: '10px',
            letterSpacing: '0.2em',
          }}
        >
          LOADING
        </div>
      ) : null}

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '50%',
          top: '55%',
          translate: '-50% -50%',
          background: 'radial-gradient(circle at 35% 30%, #FBF5F0 0%, #FDF8F2 28%, #C9A961 56%, rgba(251,245,240,0.85) 100%)',
          border: '0.5px solid rgba(201,169,97,0.8)',
          boxShadow: '0 4px 18px rgba(26,16,20,0.16), 0 0 18px rgba(201,169,97,0.28)',
          ...shapeStyle,
        }}
      />

      {imageError && shape !== 'Round' ? (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(26,16,20,0.7)',
            padding: '4px 10px',
            fontSize: '9px',
            letterSpacing: '0.15em',
            color: 'rgba(201,169,97,0.7)',
            fontFamily: 'var(--font-inter)',
          }}
        >
          SHOWING ROUND
        </div>
      ) : null}
    </div>
  )
}

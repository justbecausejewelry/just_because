'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

type DiamondVisualizerProps = {
  shape?: string
  carat?: number
  initialShape?: string
  initialCarat?: number
  onCaratChange?: (carat: number) => void
  onShapeChange?: (shape: string) => void
  showShapeSelector?: boolean
}

const SHAPES = ['Round', 'Oval', 'Cushion', 'Princess', 'Emerald', 'Radiant', 'Pear', 'Marquise', 'Heart', 'Asscher']
const CARAT_STEPS = [1, 1.5, 2]

function diamondSize(carat: number) {
  return Math.max(22, Math.min(54, 20 + carat * 14))
}

function normalizeCarat(carat: number) {
  return Math.round(Math.max(0.5, Math.min(3, carat)) * 10) / 10
}

export default function DiamondVisualizer({
  shape,
  carat,
  initialShape = 'Round',
  initialCarat = 1,
  onCaratChange,
  onShapeChange,
  showShapeSelector = true,
}: DiamondVisualizerProps) {
  const resolvedShape = shape || initialShape || 'Round'
  const resolvedCarat = carat ?? initialCarat ?? 1
  const [selectedShape, setSelectedShape] = useState(resolvedShape)
  const [selectedCarat, setSelectedCarat] = useState(normalizeCarat(resolvedCarat))
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setSelectedShape(resolvedShape)
    setImageLoaded(false)
    setImageError(false)
  }, [resolvedShape])

  useEffect(() => {
    setSelectedCarat(normalizeCarat(resolvedCarat))
  }, [resolvedCarat])

  const handleShapeChange = (nextShape: string) => {
    setSelectedShape(nextShape)
    setImageLoaded(false)
    setImageError(false)
    onShapeChange?.(nextShape)
  }

  const handleCaratChange = (nextCarat: number) => {
    const normalized = normalizeCarat(nextCarat)
    setSelectedCarat(normalized)
    onCaratChange?.(normalized)
  }

  const shapeImagePath = `/images/diamonds/${selectedShape.toLowerCase()}-hand.jpg`
  const handImageSrc = imageError
    ? '/images/diamonds/round-hand.jpg'
    : shapeImagePath

  const size = diamondSize(selectedCarat)
  const shapeStyle = useMemo(() => {
    const lowerShape = selectedShape.toLowerCase()
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
  }, [selectedShape, size])

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      {showShapeSelector ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {SHAPES.map((option) => {
            const selected = selectedShape === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleShapeChange(option)}
                style={{
                  background: selected ? '#1A1014' : '#FDF8F2',
                  border: '0.5px solid #EDD9AF',
                  borderRadius: '2px',
                  color: selected ? '#FBF5F0' : '#1A1014',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  padding: '8px 10px',
                  transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {option}
              </button>
            )
          })}
        </div>
      ) : null}

      <div style={{ aspectRatio: '1', position: 'relative', overflow: 'hidden', background: '#F5E8ED' }}>
        <Image
          key={handImageSrc}
          src={handImageSrc}
          alt={`${selectedShape} diamond on hand`}
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
            transition: 'width 500ms cubic-bezier(0.4, 0, 0.2, 1), height 500ms cubic-bezier(0.4, 0, 0.2, 1)',
            ...shapeStyle,
          }}
        />

        {imageError && selectedShape !== 'Round' ? (
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

      <div style={{ display: 'grid', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px' }}>
          <span style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em' }}>
            CARAT
          </span>
          <span style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '22px' }}>
            {selectedCarat.toFixed(1)} ct
          </span>
        </div>
        <input
          aria-label="Diamond carat"
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={selectedCarat}
          onChange={(event) => handleCaratChange(Number(event.target.value))}
          style={{
            accentColor: '#C9A961',
            cursor: 'pointer',
            width: '100%',
          }}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CARAT_STEPS.map((option) => {
            const selected = selectedCarat === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleCaratChange(option)}
                style={{
                  background: selected ? '#1A1014' : '#FDF8F2',
                  border: '0.5px solid #EDD9AF',
                  borderRadius: '2px',
                  color: selected ? '#FBF5F0' : '#1A1014',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '11px',
                  padding: '8px 12px',
                }}
              >
                {option.toFixed(1)} ct
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

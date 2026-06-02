'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

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
const CARAT_MARKERS = [0.25, 0.5, 1, 1.5, 2, 3, 4, 5]

const SHAPE_COPY: Record<string, string> = {
  Round: 'Classic brilliance - the most popular choice',
  Oval: 'Elongated sparkle with a graceful silhouette',
  Cushion: 'Soft corners with vintage romance',
  Princess: 'Clean geometry with modern fire',
  Emerald: 'Step-cut clarity with quiet drama',
  Radiant: 'Crisp facets with extra brightness',
  Pear: 'A delicate teardrop with movement',
  Marquise: 'Lengthening and regal on the hand',
  Heart: 'Romantic, expressive, and unmistakable',
  Asscher: 'Architectural symmetry with Art Deco polish',
}

function normalizeCarat(carat: number) {
  return Math.round(Math.max(0.25, Math.min(5, carat)) * 100) / 100
}

function getImageZoom(carat: number) {
  const normalized = (normalizeCarat(carat) - 0.25) / 4.75
  return 1 + normalized * 0.7
}

function getMmSize(carat: number) {
  return (6.5 * Math.cbrt(normalizeCarat(carat))).toFixed(2)
}

function getCaratContext(carat: number, shape: string) {
  if (carat < 0.5) return 'Delicate and subtle - perfect for everyday wear'
  if (carat < 1) return 'Understated elegance - noticeable but refined'
  if (carat < 1.5) return SHAPE_COPY[shape] || SHAPE_COPY.Round
  if (carat < 2) return 'Statement piece - bold and beautiful'
  if (carat < 3) return 'Showstopping - guaranteed to turn heads'
  return 'Exceptional - truly rare and magnificent'
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
  const handImageSrc = imageError ? '/images/diamonds/round-hand.jpg' : shapeImagePath
  const imageZoom = getImageZoom(selectedCarat)
  const mmSize = getMmSize(selectedCarat)

  return (
    <div
      style={{
        background: '#FDF8F2',
        border: '0.5px solid #EDD9AF',
        display: 'grid',
        fontFamily: 'var(--font-inter)',
        gap: '16px',
        padding: '24px',
      }}
    >
      <div style={{ color: '#C9A961', fontSize: '9px', letterSpacing: '0.3em' }}>
        SEE IT ON YOUR HAND
      </div>

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
                  background: selected ? '#1A1014' : '#FBF5F0',
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

      <div
        style={{
          aspectRatio: '4 / 3',
          background: '#F5E8ED',
          marginBottom: '4px',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <Image
            key={handImageSrc}
            src={handImageSrc}
            alt={`${selectedShape} diamond on hand`}
            fill
            sizes="(max-width: 768px) 100vw, 500px"
            priority
            quality={90}
            style={{
              objectFit: 'cover',
              objectPosition: 'center',
              opacity: imageLoaded ? 1 : 0,
              transform: `scale(${imageZoom})`,
              transformOrigin: 'center center',
              transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1), transform 400ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true)
              setImageLoaded(false)
            }}
          />
        </div>

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

        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(26,16,20,0.85)',
            backdropFilter: 'blur(8px)',
            border: '0.5px solid rgba(201,169,97,0.4)',
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
            padding: '6px 16px',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: '#C9A961', fontSize: '12px', fontWeight: 500 }}>
            {selectedCarat.toFixed(2)} ct
          </span>
          <span style={{ color: 'rgba(251,245,240,0.6)', fontSize: '11px' }}>
            &asymp; {mmSize} mm
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
          <span style={{ color: '#1A1014', fontSize: '12px', fontWeight: 500 }}>
            Carat Weight
          </span>
          <span style={{ color: '#C9A961', fontSize: '12px', fontWeight: 500 }}>
            {selectedCarat.toFixed(2)} ct
          </span>
        </div>

        <input
          aria-label="Diamond carat"
          type="range"
          min="0.25"
          max="5"
          step="0.01"
          value={selectedCarat}
          onChange={(event) => handleCaratChange(Number(event.target.value))}
          style={{
            accentColor: '#C9A961',
            cursor: 'pointer',
            width: '100%',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', marginTop: '2px' }}>
          {CARAT_MARKERS.map((option) => {
            const selected = Math.abs(selectedCarat - option) < 0.1
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleCaratChange(option)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: selected ? '#C9A961' : '#B8A090',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '10px',
                  fontWeight: selected ? 500 : 400,
                  padding: '4px 0',
                }}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>

      <div
        style={{
          background: 'rgba(201,169,97,0.06)',
          border: '0.5px solid rgba(201,169,97,0.2)',
          color: '#B8A090',
          fontSize: '12px',
          lineHeight: 1.6,
          padding: '12px 16px',
        }}
      >
        {getCaratContext(selectedCarat, selectedShape)}
      </div>

      <style>{`
        input[type='range'] {
          appearance: none;
          background: linear-gradient(90deg, #C9A961 0%, #EDD9AF 100%);
          height: 2px;
          outline: none;
        }

        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #1A1014;
          border: 3px solid #C9A961;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}

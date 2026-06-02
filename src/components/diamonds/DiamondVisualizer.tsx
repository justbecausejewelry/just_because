'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

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
const CARAT_TO_MM: [number, number][] = [
  [0.2, 3.8],
  [0.25, 4.1],
  [0.3, 4.3],
  [0.33, 4.5],
  [0.4, 4.8],
  [0.5, 5.2],
  [0.6, 5.5],
  [0.7, 5.7],
  [0.75, 5.9],
  [0.8, 6],
  [0.9, 6.3],
  [1, 6.5],
  [1.1, 6.7],
  [1.2, 6.9],
  [1.25, 7],
  [1.3, 7.1],
  [1.4, 7.3],
  [1.5, 7.4],
  [1.6, 7.6],
  [1.75, 7.8],
  [2, 8.2],
  [2.5, 8.8],
  [3, 9.4],
  [3.5, 9.9],
  [4, 10.4],
  [4.5, 10.7],
  [5, 11],
]

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

function getMMfromCarat(carat: number) {
  const normalized = normalizeCarat(carat)

  if (normalized <= CARAT_TO_MM[0][0]) return CARAT_TO_MM[0][1]
  if (normalized >= CARAT_TO_MM[CARAT_TO_MM.length - 1][0]) {
    return CARAT_TO_MM[CARAT_TO_MM.length - 1][1]
  }

  for (let index = 0; index < CARAT_TO_MM.length - 1; index += 1) {
    const [caratStart, mmStart] = CARAT_TO_MM[index]
    const [caratEnd, mmEnd] = CARAT_TO_MM[index + 1]

    if (normalized >= caratStart && normalized <= caratEnd) {
      const progress = (normalized - caratStart) / (caratEnd - caratStart)
      return mmStart + progress * (mmEnd - mmStart)
    }
  }

  return 6.5
}

function caratToPx(carat: number, containerWidthPx: number) {
  const diamondMM = getMMfromCarat(carat)

  // Calibrated from real hand photo measurements.
  // Finger occupies ~5.2% of the clean hand plate width; 16.9mm reference finger.
  // Visibility scale keeps carat-to-carat ratios true while keeping small stones visible.
  const FINGER_WIDTH_FRACTION = 0.052
  const FINGER_MM = 16.9
  const VISIBILITY_SCALE = 3.07
  const pxPerMM = (containerWidthPx * FINGER_WIDTH_FRACTION) / FINGER_MM
  const diamondPx = diamondMM * pxPerMM * VISIBILITY_SCALE

  return Math.round(Math.min(Math.max(diamondPx, 8), 120))
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
  const [diamondSrc, setDiamondSrc] = useState(`/images/diamonds/${resolvedShape.toLowerCase()}-diamond.png`)
  const [diamondVisible, setDiamondVisible] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(400)

  useEffect(() => {
    setSelectedShape(resolvedShape)
  }, [resolvedShape])

  useEffect(() => {
    setDiamondSrc(`/images/diamonds/${selectedShape.toLowerCase()}-diamond.png`)
    setDiamondVisible(true)
  }, [selectedShape])

  useEffect(() => {
    setSelectedCarat(normalizeCarat(resolvedCarat))
  }, [resolvedCarat])

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)

    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const handleShapeChange = (nextShape: string) => {
    setSelectedShape(nextShape)
    onShapeChange?.(nextShape)
  }

  const handleCaratChange = (nextCarat: number) => {
    const normalized = normalizeCarat(nextCarat)
    setSelectedCarat(normalized)
    onCaratChange?.(normalized)
  }

  const mmSize = getMMfromCarat(selectedCarat).toFixed(1)
  const px = caratToPx(selectedCarat, containerWidth)

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
        ref={containerRef}
        style={{
          aspectRatio: '4 / 3',
          background: '#F0EAE2',
          marginBottom: '16px',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
        }}
      >
        <Image
          src="/images/diamonds/hand-bg.jpg"
          alt="Hand"
          fill
          sizes="500px"
          priority
          quality={90}
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />

        <div
          style={{
            height: `${px}px`,
            left: '41.5%',
            pointerEvents: 'none',
            position: 'absolute',
            top: '32.5%',
            transform: 'translate(-50%, -50%)',
            transition: 'width 250ms ease, height 250ms ease',
            width: `${px}px`,
          }}
        >
          {diamondVisible ? (
            <Image
              src={diamondSrc}
              alt={`${selectedShape} diamond`}
              fill
              sizes={`${px}px`}
              quality={90}
              style={{
                objectFit: 'contain',
              }}
              onError={() => {
                if (diamondSrc === '/images/diamonds/round-diamond.png') {
                  setDiamondVisible(false)
                  return
                }

                setDiamondSrc('/images/diamonds/round-diamond.png')
              }}
            />
          ) : null}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(26,16,20,0.82)',
            border: '0.5px solid rgba(201,169,97,0.4)',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            padding: '5px 14px',
            whiteSpace: 'nowrap',
            borderRadius: '20px',
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

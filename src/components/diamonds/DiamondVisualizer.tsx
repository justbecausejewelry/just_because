'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { getDiamondImage } from '@/lib/diamondImages'

type DiamondVisualizerProps = {
  shape?: string
  carat?: number
  initialShape?: string
  initialCarat?: number
  availableCarats?: number[]
  diamondSelected?: boolean
  onCaratChange?: (carat: number) => void
  onShapeChange?: (shape: string) => void
  showShapeSelector?: boolean
}

const SHAPES = ['Round', 'Oval', 'Cushion', 'Princess', 'Emerald', 'Radiant', 'Pear', 'Marquise', 'Heart', 'Asscher']
const DEFAULT_CARAT_MARKERS = [0.25, 0.5, 1, 1.5, 2, 3, 4, 5]
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
  [6, 11.7],
  [7, 12.3],
  [8, 12.8],
  [9, 13.3],
  [10, 13.8],
  [11, 14.2],
  [12, 14.6],
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
  return Math.round(Math.max(0.2, Math.min(12, carat)) * 100) / 100
}

function normalizeCaratOptions(options: number[] | undefined) {
  const source = options?.length ? options : DEFAULT_CARAT_MARKERS
  return Array.from(
    new Set(
      source
        .map((option) => Number(option))
        .filter((option) => Number.isFinite(option) && option > 0)
        .map(normalizeCarat)
    )
  ).sort((left, right) => left - right)
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
  const FINGER_WIDTH_FRACTION = 0.082
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
  availableCarats,
  diamondSelected = true,
  onCaratChange,
  onShapeChange,
  showShapeSelector = true,
}: DiamondVisualizerProps) {
  const caratOptions = normalizeCaratOptions(availableCarats)
  const resolvedShape = shape || initialShape || 'Round'
  const resolvedCarat = carat ?? initialCarat ?? caratOptions[0] ?? 1
  const [selectedShape, setSelectedShape] = useState(resolvedShape)
  const [selectedCarat, setSelectedCarat] = useState(normalizeCarat(resolvedCarat))
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(400)

  useEffect(() => {
    setSelectedShape(resolvedShape)
  }, [resolvedShape])

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

  const sliderIndex = Math.max(
    0,
    caratOptions.findIndex((option) => option === selectedCarat)
  )
  const mmSize = getMMfromCarat(selectedCarat).toFixed(1)
  const px = caratToPx(selectedCarat, containerWidth)
  const diamondImage = getDiamondImage(selectedShape)

  return (
    <div
      className="diamond-visualizer-container"
      style={{
        background: '#FDF8F2',
        border: '0.5px solid #EDD9AF',
        display: 'grid',
        fontFamily: 'var(--font-jost)',
        gap: '16px',
        padding: '24px',
      }}
    >
      <div style={{ color: '#C9A961', fontSize: '12px', fontWeight: 600, letterSpacing: '0.22em' }}>
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
                  fontFamily: 'var(--font-jost)',
                  fontSize: '13px',
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
        className="visualizer-wrapper"
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

        {diamondSelected ? (
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
            <Image
              src={diamondImage}
              alt={`${selectedShape} diamond`}
              fill
              sizes={`${px}px`}
              quality={90}
              style={{
                objectFit: 'contain',
              }}
            />
          </div>
        ) : (
          <div
            style={{
              left: '41.5%',
              pointerEvents: 'none',
              position: 'absolute',
              textAlign: 'center',
              top: '32.5%',
              transform: 'translate(-50%, -50%)',
              width: '140px',
            }}
          >
            <span
              style={{
                background: 'rgba(251,245,240,0.84)',
                border: '0.5px solid rgba(201,169,97,0.45)',
                color: '#C9A961',
                display: 'inline-block',
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                letterSpacing: '0.08em',
                lineHeight: 1.4,
                padding: '6px 9px',
                textTransform: 'uppercase',
              }}
            >
              Select a carat to preview
            </span>
          </div>
        )}

        {diamondSelected ? (
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
            <span style={{ color: '#C9A961', fontSize: '14px', fontWeight: 500 }}>
              {selectedCarat.toFixed(2)} ct
            </span>
            <span style={{ color: 'rgba(251,245,240,0.75)', fontSize: '14px' }}>
              &asymp; {mmSize} mm
            </span>
          </div>
        ) : null}
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
          <span style={{ color: '#1A1014', fontSize: '14px', fontWeight: 500 }}>
            Carat Weight
          </span>
          <span style={{ color: '#C9A961', fontSize: '14px', fontWeight: 500 }}>
            {diamondSelected ? `${selectedCarat.toFixed(2)} ct` : 'Select'}
          </span>
        </div>

        <input
          aria-label="Diamond carat"
          type="range"
          min="0"
          max={Math.max(0, caratOptions.length - 1)}
          step="1"
          value={sliderIndex}
          onChange={(event) => handleCaratChange(caratOptions[Number(event.target.value)] || caratOptions[0])}
          style={{
            accentColor: '#C9A961',
            cursor: 'pointer',
            width: '100%',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', marginTop: '2px' }}>
          {caratOptions.map((option) => {
            const selected = diamondSelected && selectedCarat === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleCaratChange(option)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: selected ? '#C9A961' : 'var(--color-muted-text)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-jost)',
                  fontSize: '12px',
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
          color: 'var(--color-muted-text)',
          fontSize: '13px',
          lineHeight: 1.6,
          padding: '12px 16px',
        }}
      >
        {diamondSelected ? getCaratContext(selectedCarat, selectedShape) : 'Choose one of the available carat stops to see the stone on hand.'}
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

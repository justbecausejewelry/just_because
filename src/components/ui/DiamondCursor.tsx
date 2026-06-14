"use client"
import { useEffect, useState, useRef } from 'react'

type Sparkle = {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  color: string
}

function isFinitePoint(x: number, y: number) {
  return Number.isFinite(x) && Number.isFinite(y)
}

function isFiniteSparkle(sparkle: Sparkle) {
  return isFinitePoint(sparkle.x, sparkle.y) && Number.isFinite(sparkle.size)
}

export default function DiamondCursor() {
  const [position, setPosition] = useState({ x: -200, y: -200 })
  const [followerPos, setFollowerPos] = useState({ x: -200, y: -200 })
  const [isHovering, setIsHovering] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [sparkles, setSparkles] = useState<Sparkle[]>([])
  const positionRef = useRef({ x: -200, y: -200 })
  const followerRef = useRef({ x: -200, y: -200 })
  const rafRef = useRef<number | null>(null)
  const sparkleIdRef = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('ontouchstart' in window) return

    const handleMove = (e: MouseEvent) => {
      if (!isFinitePoint(e.clientX, e.clientY)) return

      const nextPosition = { x: e.clientX, y: e.clientY }
      positionRef.current = nextPosition
      setPosition(nextPosition)
      setIsVisible(true)

      // Random sparkle trail
      if (Math.random() > 0.6) {
        const colors = [
          '#C9A961', '#EDD9AF', '#ffffff',
          '#B8D4F8', '#E8C4D0', '#F0E6FF',
        ]
        const sparkleX = e.clientX + (Math.random() - 0.5) * 24
        const sparkleY = e.clientY + (Math.random() - 0.5) * 24
        const sparkleSize = Math.random() * 5 + 2
        if (!isFinitePoint(sparkleX, sparkleY) || !Number.isFinite(sparkleSize)) return

        const newSparkle = {
          id: sparkleIdRef.current++,
          x: sparkleX,
          y: sparkleY,
          size: sparkleSize,
          opacity: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
        }
        setSparkles(prev => [...prev.slice(-18), newSparkle])

        setTimeout(() => {
          setSparkles(prev =>
            prev.filter(s => s.id !== newSparkle.id)
          )
        }, 600)
      }
    }

    const handleLeave = () => {
      setIsVisible(false)
      setSparkles([])
    }
    const handleEnter = () => setIsVisible(true)

    const handleOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest(
        'a, button, [role="button"], input, select, textarea'
      )
      setIsHovering(!!el)
    }

    const handleDown = () => setIsClicking(true)
    const handleUp = () => {
      setIsClicking(false)
      if (!isFinitePoint(positionRef.current.x, positionRef.current.y)) return

      // Burst of sparkles on click
      const burst = Array.from({ length: 8 }, (_, i) => ({
        id: sparkleIdRef.current++,
        x: positionRef.current.x + Math.cos((i / 8) * Math.PI * 2) * 20,
        y: positionRef.current.y + Math.sin((i / 8) * Math.PI * 2) * 20,
        size: Math.random() * 6 + 3,
        opacity: 1,
        color: ['#C9A961', '#EDD9AF', '#ffffff', '#B8D4F8'][
          Math.floor(Math.random() * 4)
        ],
      })).filter(isFiniteSparkle)
      if (!burst.length) return

      setSparkles(prev => [...prev, ...burst])
      setTimeout(() => {
        setSparkles(prev =>
          prev.filter(s => !burst.find(b => b.id === s.id))
        )
      }, 700)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseleave', handleLeave)
    document.addEventListener('mouseenter', handleEnter)
    document.addEventListener('mouseover', handleOver)
    document.addEventListener('mousedown', handleDown)
    document.addEventListener('mouseup', handleUp)

    const animate = () => {
      followerRef.current = {
        x: followerRef.current.x +
          (position.x - followerRef.current.x) * 0.1,
        y: followerRef.current.y +
          (position.y - followerRef.current.y) * 0.1,
      }
      setFollowerPos({ ...followerRef.current })
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseleave', handleLeave)
      document.removeEventListener('mouseenter', handleEnter)
      document.removeEventListener('mouseover', handleOver)
      document.removeEventListener('mousedown', handleDown)
      document.removeEventListener('mouseup', handleUp)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [position.x, position.y])

  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    return null
  }

  return (
    <>
      <style>{`
        @keyframes sparkle-fade {
          0% { transform: scale(1) rotate(0deg); opacity: 1; }
          100% { transform: scale(0) rotate(180deg); opacity: 0; }
        }
        @keyframes diamond-pulse {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(201,169,97,0.6)); }
          50% { filter: drop-shadow(0 0 8px rgba(201,169,97,0.9))
                        drop-shadow(0 0 16px rgba(184,212,248,0.4)); }
        }
        @keyframes ring-expand {
          0% { transform: translate(-50%,-50%) scale(0.5); opacity: 0.8; }
          100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }
        }
      `}</style>

      {/* Sparkle particles */}
      {sparkles.filter(isFiniteSparkle).map(sparkle => (
        <div
          key={sparkle.id}
          style={{
            position: 'fixed',
            left: sparkle.x,
            top: sparkle.y,
            width: sparkle.size,
            height: sparkle.size,
            pointerEvents: 'none',
            zIndex: 99996,
            transform: 'translate(-50%, -50%)',
            animation: 'sparkle-fade 0.6s ease-out forwards',
          }}
        >
          {/* 4-pointed star sparkle */}
          <svg
            viewBox="0 0 10 10"
            style={{ width: '100%', height: '100%' }}
          >
            <polygon
              points="5,0 6,4 10,5 6,6 5,10 4,6 0,5 4,4"
              fill={sparkle.color}
            />
          </svg>
        </div>
      ))}

      {/* Trailing ring on hover */}
      {isHovering && (
        <div
          style={{
            position: 'fixed',
            left: followerPos.x,
            top: followerPos.y,
            width: '40px',
            height: '40px',
            pointerEvents: 'none',
            zIndex: 99997,
            transform: 'translate(-50%, -50%)',
            animation: 'ring-expand 0.5s ease-out forwards',
            border: '1px solid rgba(201,169,97,0.6)',
            borderRadius: '50%',
          }}
        />
      )}

      {/* Main diamond cursor */}
      <div
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          transform: `translate(-50%, -50%)
            scale(${isClicking ? 0.75 : isHovering ? 1.35 : 1})`,
          width: '36px',
          height: '36px',
          pointerEvents: 'none',
          zIndex: 99999,
          opacity: isVisible ? 1 : 0,
          transition: 'transform 0.12s ease, opacity 0.3s ease',
          animation: 'diamond-pulse 2s ease-in-out infinite',
        }}
      >
        <svg
          viewBox="0 0 60 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="dTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95"/>
              <stop offset="40%" stopColor="#B8D4F8" stopOpacity="0.85"/>
              <stop offset="100%" stopColor="#7BAFD4" stopOpacity="0.7"/>
            </linearGradient>
            <linearGradient id="dLeft" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EDD9AF" stopOpacity="0.9"/>
              <stop offset="50%" stopColor="#C9A961" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#8B6914" stopOpacity="0.9"/>
            </linearGradient>
            <linearGradient id="dRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6"/>
              <stop offset="50%" stopColor="#A8C8E8" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="#5A8FAA" stopOpacity="0.7"/>
            </linearGradient>
            <linearGradient id="dCenter" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9"/>
              <stop offset="30%" stopColor="#D4EAFF" stopOpacity="0.7"/>
              <stop offset="70%" stopColor="#C9A961" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#EDD9AF" stopOpacity="0.8"/>
            </linearGradient>
            <linearGradient id="dBottomL" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7BAFD4" stopOpacity="0.7"/>
              <stop offset="100%" stopColor="#2A5F80" stopOpacity="0.9"/>
            </linearGradient>
            <linearGradient id="dBottomR" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#C9A961" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#6B4A10" stopOpacity="0.9"/>
            </linearGradient>
            <linearGradient id="girdle" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#C9A961" stopOpacity="0.5"/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          </defs>

          {/* Girdle (widest part — horizontal belt) */}
          <polygon
            points="5,24 15,20 30,18 45,20 55,24 45,28 30,30 15,28"
            fill="url(#girdle)"
            stroke="rgba(201,169,97,0.6)"
            strokeWidth="0.4"
          />

          {/* CROWN — top facets */}

          {/* Table (top flat face) */}
          <polygon
            points="18,10 30,6 42,10 38,22 30,24 22,22"
            fill="url(#dTop)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="0.4"
          />

          {/* Crown left facet */}
          <polygon
            points="5,24 15,20 22,22 18,10 10,16"
            fill="url(#dLeft)"
            stroke="rgba(201,169,97,0.4)"
            strokeWidth="0.4"
          />

          {/* Crown right facet */}
          <polygon
            points="55,24 45,20 38,22 42,10 50,16"
            fill="url(#dRight)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.4"
          />

          {/* Crown front-left facet */}
          <polygon
            points="5,24 15,28 22,22 18,10 10,16"
            fill="rgba(200,220,240,0.5)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.3"
          />

          {/* Crown front-right facet */}
          <polygon
            points="55,24 45,28 38,22 42,10 50,16"
            fill="rgba(240,220,180,0.5)"
            stroke="rgba(201,169,97,0.3)"
            strokeWidth="0.3"
          />

          {/* PAVILION — bottom pointed facets */}

          {/* Bottom center left */}
          <polygon
            points="5,24 15,28 30,66"
            fill="url(#dBottomL)"
            stroke="rgba(100,160,200,0.4)"
            strokeWidth="0.4"
          />

          {/* Bottom center */}
          <polygon
            points="15,28 30,30 30,66"
            fill="url(#dCenter)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.4"
          />

          {/* Bottom center right */}
          <polygon
            points="30,30 45,28 30,66"
            fill="url(#dBottomR)"
            stroke="rgba(201,169,97,0.4)"
            strokeWidth="0.4"
          />

          {/* Bottom far right */}
          <polygon
            points="45,28 55,24 30,66"
            fill="rgba(90,143,170,0.7)"
            stroke="rgba(100,160,200,0.3)"
            strokeWidth="0.4"
          />

          {/* Culet highlight at tip */}
          <circle
            cx="30"
            cy="65"
            r="1.5"
            fill="rgba(255,255,255,0.9)"
            filter="url(#glow)"
          />

          {/* Main highlight on table */}
          <polygon
            points="22,11 30,8 36,11 33,17 27,17"
            fill="rgba(255,255,255,0.75)"
          />

          {/* Secondary highlight */}
          <ellipse
            cx="14"
            cy="21"
            rx="3"
            ry="2"
            fill="rgba(255,255,255,0.5)"
            transform="rotate(-30 14 21)"
          />

          {/* Blue light refraction */}
          <polygon
            points="40,23 45,21 48,25 44,27"
            fill="rgba(100,180,255,0.45)"
          />

          {/* Gold light refraction */}
          <polygon
            points="12,26 16,29 13,32"
            fill="rgba(255,200,80,0.45)"
          />

          {/* Outer glow ring */}
          <polygon
            points="5,24 15,20 30,18 45,20 55,24 45,28 30,30 15,28"
            fill="none"
            stroke="rgba(201,169,97,0.25)"
            strokeWidth="3"
            filter="url(#glow)"
          />
        </svg>
      </div>

      {/* Follower — subtle ring */}
      <div
        style={{
          position: 'fixed',
          left: followerPos.x,
          top: followerPos.y,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: `1px solid rgba(201,169,97,${isHovering ? 0 : 0.35})`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 99998,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease, border-color 0.2s ease',
        }}
      />
    </>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'

export default function DiamondCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 })
  const [followerPos, setFollowerPos] = useState({ x: -100, y: -100 })
  const [isHovering, setIsHovering] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const positionRef = useRef({ x: -100, y: -100 })
  const followerRef = useRef({ x: -100, y: -100 })
  const rafRef = useRef<number | null>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(true)

  useEffect(() => {
    const touchDevice = 'ontouchstart' in window || !window.matchMedia('(hover: hover) and (pointer: fine)').matches
    setIsTouchDevice(touchDevice)

    if (touchDevice) {
      return undefined
    }

    const handleMove = (event: MouseEvent) => {
      const nextPosition = { x: event.clientX, y: event.clientY }
      positionRef.current = nextPosition
      setPosition(nextPosition)
      setIsVisible(true)
    }

    const handleLeave = () => setIsVisible(false)
    const handleEnter = () => setIsVisible(true)

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const clickable = target.closest('a, button, [role="button"], input, select, textarea, label')
      setIsHovering(Boolean(clickable))
    }

    const handleMouseDown = () => setIsClicking(true)
    const handleMouseUp = () => setIsClicking(false)

    const animateFollower = () => {
      followerRef.current = {
        x: followerRef.current.x + (positionRef.current.x - followerRef.current.x) * 0.12,
        y: followerRef.current.y + (positionRef.current.y - followerRef.current.y) * 0.12,
      }
      setFollowerPos({ ...followerRef.current })
      rafRef.current = requestAnimationFrame(animateFollower)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseleave', handleLeave)
    document.addEventListener('mouseenter', handleEnter)
    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)
    rafRef.current = requestAnimationFrame(animateFollower)

    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseleave', handleLeave)
      document.removeEventListener('mouseenter', handleEnter)
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  if (isTouchDevice) {
    return null
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          transform: `translate(-50%, -50%) rotate(${isHovering ? '45deg' : '0deg'}) scale(${isClicking ? 0.7 : isHovering ? 1.4 : 1})`,
          width: isHovering ? '20px' : '14px',
          height: isHovering ? '20px' : '14px',
          pointerEvents: 'none',
          zIndex: 99999,
          opacity: isVisible ? 1 : 0,
          transition: 'transform 0.15s ease, width 0.2s ease, height 0.2s ease, opacity 0.3s ease',
          mixBlendMode: 'difference',
        }}
      >
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          <polygon
            points="10,0 20,7 20,13 10,20 0,13 0,7"
            fill={isHovering ? '#C9A961' : '#FBF5F0'}
            stroke={isHovering ? '#EDD9AF' : '#C9A961'}
            strokeWidth="1"
          />
          <line x1="10" y1="0" x2="10" y2="20" stroke={isHovering ? 'rgba(251,245,240,0.4)' : 'rgba(201,169,97,0.4)'} strokeWidth="0.5" />
          <line x1="0" y1="10" x2="20" y2="10" stroke={isHovering ? 'rgba(251,245,240,0.4)' : 'rgba(201,169,97,0.4)'} strokeWidth="0.5" />
        </svg>
      </div>

      <div
        style={{
          position: 'fixed',
          left: followerPos.x,
          top: followerPos.y,
          transform: `translate(-50%, -50%) rotate(${isHovering ? '45deg' : '0deg'}) scale(${isClicking ? 0.6 : isHovering ? 0.4 : 0.7})`,
          width: '40px',
          height: '40px',
          pointerEvents: 'none',
          zIndex: 99998,
          opacity: isVisible ? (isHovering ? 0 : 0.3) : 0,
          transition: 'transform 0.3s ease, opacity 0.3s ease',
        }}
      >
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          <polygon points="20,2 38,14 38,26 20,38 2,26 2,14" fill="none" stroke="#C9A961" strokeWidth="0.8" opacity="0.6" />
        </svg>
      </div>
    </>
  )
}

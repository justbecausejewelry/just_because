"use client"

import { useEffect, useRef, useState } from 'react'

interface Stat {
  end: number
  suffix: string
  label: string
  sublabel: string
  display?: (count: number, started: boolean) => string
}

const STATS: Stat[] = [
  {
    end: 2847,
    suffix: '+',
    label: 'Happy Customers',
    sublabel: 'Worldwide',
  },
  {
    end: 49,
    suffix: '★',
    label: 'Average Rating',
    sublabel: '2,847 reviews',
    display: (count, started) => (started ? (count / 10).toFixed(1) : '0.0'),
  },
  {
    end: 100,
    suffix: '%',
    label: 'Renewable Energy',
    sublabel: 'Solar powered',
  },
  {
    end: 0,
    suffix: '',
    label: 'Mining',
    sublabel: 'Lab-grown only',
  },
]

function useCountUp(end: number, duration = 2200, started: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!started) return

    if (end === 0) {
      setCount(0)
      return
    }

    let animationFrame = 0
    const startTime = performance.now()

    const tick = (time: number) => {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - (1 - progress) ** 3

      setCount(Math.floor(eased * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(tick)
      }
    }

    animationFrame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, started])

  return count
}

function StatItem({ stat, started }: { stat: Stat; started: boolean }) {
  const count = useCountUp(stat.end, 2200, started)
  const displayValue = stat.display ? stat.display(count, started) : count.toLocaleString()

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 32px',
        position: 'relative',
        transition: 'background 400ms cubic-bezier(0.4,0,0.2,1)',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = 'rgba(201,169,97,0.04)'
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = 'transparent'
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '40px',
          height: '1px',
          background: 'linear-gradient(to right, transparent, #C9A961, transparent)',
        }}
      />

      <div
        style={{
          fontFamily: 'var(--font-playfair)',
          fontSize: 'clamp(36px, 4vw, 56px)',
          fontWeight: 400,
          color: '#1A1014',
          lineHeight: 1,
          marginBottom: '10px',
          letterSpacing: '0',
        }}
      >
        {displayValue}
        <span
          style={{
            fontSize: '60%',
            color: '#C9A961',
            marginLeft: '2px',
          }}
        >
          {stat.suffix}
        </span>
      </div>

      <div
        style={{
          fontSize: '11px',
          letterSpacing: '0.2em',
          color: '#1A1014',
          fontFamily: 'var(--font-inter)',
          fontWeight: 500,
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}
      >
        {stat.label}
      </div>

      <div
        style={{
          fontSize: '11px',
          color: '#B8A090',
          fontFamily: 'var(--font-inter)',
          letterSpacing: '0.05em',
        }}
      >
        {stat.sublabel}
      </div>
    </div>
  )
}

export default function StatsCounter() {
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      className="stats-counter-section"
      ref={ref}
      aria-label="Just Because impact statistics"
      style={{
        background: '#FBF5F0',
        borderTop: '0.5px solid #EDD9AF',
        borderBottom: '0.5px solid #EDD9AF',
        padding: 0,
      }}
    >
      <div
        className="stats-grid"
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          background: '#EDD9AF',
          gap: '0.5px',
        }}
      >
        {STATS.map((stat) => (
          <div key={stat.label} style={{ background: '#FBF5F0' }}>
            <StatItem stat={stat} started={started} />
          </div>
        ))}
      </div>
    </section>
  )
}

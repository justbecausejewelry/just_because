"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function formatSegment(segment: string) {
  if (segment === '4cs') return '4Cs'
  return segment
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function EducationBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  const current = segments.length > 1 ? formatSegment(segments[segments.length - 1]) : ''

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        background: '#FBF5F0',
        borderBottom: '0.5px solid #EDD9AF',
        color: '#B8A090',
        fontFamily: 'var(--font-inter)',
        fontSize: '11px',
        letterSpacing: '0.12em',
        padding: '14px 24px',
        textTransform: 'uppercase',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: '10px',
          margin: '0 auto',
          maxWidth: '1180px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <Link href="/" style={{ color: '#1A1014', textDecoration: 'none' }}>
          Home
        </Link>
        <span aria-hidden="true" style={{ color: '#C9A961' }}>
          -&gt;
        </span>
        <span style={{ color: '#1A1014' }}>Education</span>
        {current ? (
          <>
            <span aria-hidden="true" style={{ color: '#C9A961' }}>
              -&gt;
            </span>
            <span aria-current="page">{current}</span>
          </>
        ) : null}
      </div>
    </nav>
  )
}

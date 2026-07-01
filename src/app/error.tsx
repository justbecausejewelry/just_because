'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[error boundary]', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FBF5F0',
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '11px',
          letterSpacing: '0.2em',
          color: '#C9A961',
          marginBottom: '16px',
        }}
      >
        SOMETHING WENT WRONG
      </p>
      <h1
        style={{
          fontFamily: 'var(--font-playfair)',
          fontSize: '32px',
          color: '#1A1014',
          fontWeight: 400,
          marginBottom: '16px',
        }}
      >
        We hit a small snag.
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '14px',
          color: '#B8A090',
          maxWidth: '400px',
          lineHeight: 1.8,
          marginBottom: '32px',
        }}
      >
        Something unexpected happened on our end. Our team has been notified. Please try again or contact us at support@justbecausejewelry.com
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            background: '#1A1014',
            color: '#FBF5F0',
            border: 'none',
            padding: '14px 32px',
            fontFamily: 'var(--font-inter)',
            fontSize: '11px',
            letterSpacing: '0.15em',
            cursor: 'pointer',
          }}
        >
          TRY AGAIN
        </button>
        <Link
          href="/"
          style={{
            background: 'transparent',
            color: '#1A1014',
            border: '0.5px solid #1A1014',
            padding: '14px 32px',
            fontFamily: 'var(--font-inter)',
            fontSize: '11px',
            letterSpacing: '0.15em',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          RETURN HOME
        </Link>
      </div>
    </div>
  )
}

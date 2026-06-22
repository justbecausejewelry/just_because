'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/ui/BrandLogo'

export default function ErrorPage({
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
    <main style={{ alignItems: 'center', backgroundColor: '#FBF5F0', color: '#1A1014', display: 'flex', justifyContent: 'center', minHeight: '80vh', padding: '40px 20px', textAlign: 'center' }}>
      <section style={{ maxWidth: '430px' }}>
        <div style={{ marginBottom: '24px' }}>
          <BrandLogo size="lg" href="/" />
        </div>
        <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '32px', fontWeight: 400, lineHeight: 1.15, margin: '32px 0 12px' }}>Something went wrong</h1>
        <p style={{ color: '#B8A090', fontFamily: 'var(--font-jost), Arial, sans-serif', fontSize: '15px', lineHeight: 1.7, margin: '0 0 32px' }}>We are sorry for the inconvenience. Please try again, or contact support if the problem continues.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          <button onClick={reset} style={{ backgroundColor: '#1A1014', border: 'none', color: '#FBF5F0', cursor: 'pointer', fontFamily: 'var(--font-jost), Arial, sans-serif', fontSize: '12px', letterSpacing: '0.16em', padding: '14px 32px', textTransform: 'uppercase' }}>Try Again</button>
          <Link href="/" style={{ border: '1px solid #C9A961', color: '#1A1014', fontFamily: 'var(--font-jost), Arial, sans-serif', fontSize: '12px', letterSpacing: '0.16em', padding: '14px 32px', textDecoration: 'none', textTransform: 'uppercase' }}>Go Home</Link>
        </div>
      </section>
    </main>
  )
}

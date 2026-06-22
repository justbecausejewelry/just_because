'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global error boundary]', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ backgroundColor: '#FBF5F0', margin: 0 }}>
        <main style={{ alignItems: 'center', backgroundColor: '#FBF5F0', color: '#1A1014', display: 'flex', justifyContent: 'center', minHeight: '100vh', padding: '40px 20px', textAlign: 'center' }}>
          <section style={{ maxWidth: '430px' }}>
            <h1 style={{ color: '#1A1014', fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 400, margin: 0 }}>Just Because</h1>
            <p style={{ color: '#B8A090', fontFamily: 'Arial, sans-serif', fontSize: '15px', lineHeight: 1.7, margin: '16px 0 28px' }}>Something went wrong. Please refresh the page.</p>
            <button onClick={reset} style={{ backgroundColor: '#1A1014', border: 'none', color: '#FBF5F0', cursor: 'pointer', fontFamily: 'Arial, sans-serif', fontSize: '12px', letterSpacing: '0.16em', padding: '14px 32px', textTransform: 'uppercase' }}>Try Again</button>
          </section>
        </main>
      </body>
    </html>
  )
}

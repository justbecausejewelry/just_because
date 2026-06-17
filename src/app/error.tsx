'use client'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{ alignItems: 'center', background: '#FBF5F0', color: '#1A1014', display: 'flex', minHeight: '100vh', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
      <section style={{ maxWidth: '520px' }}>
        <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase' }}>Something went wrong</p>
        <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '36px', fontWeight: 400, margin: '12px 0' }}>A small interruption</h1>
        <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>Please try again. If the issue continues, contact Just Because support.</p>
        <button onClick={reset} style={{ background: '#1A1014', border: 'none', color: '#FBF5F0', cursor: 'pointer', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.18em', padding: '13px 22px', textTransform: 'uppercase' }}>Try Again</button>
      </section>
    </main>
  )
}

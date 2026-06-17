import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{ alignItems: 'center', background: '#FBF5F0', color: '#1A1014', display: 'flex', minHeight: '100vh', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
      <section style={{ maxWidth: '520px' }}>
        <div style={{ color: '#C9A961', fontFamily: 'var(--font-italianno)', fontSize: '44px', lineHeight: 1 }}>just</div>
        <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.35em', marginBottom: '28px' }}>-- BECAUSE --</div>
        <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase' }}>404</p>
        <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '38px', fontWeight: 400, margin: '10px 0 12px' }}>Page not found</h1>
        <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '14px', lineHeight: 1.7, margin: '0 0 28px' }}>The piece you were looking for may have moved, but the collection is still waiting.</p>
        <Link href="/" style={{ background: '#1A1014', color: '#FBF5F0', display: 'inline-block', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.18em', padding: '13px 22px', textDecoration: 'none', textTransform: 'uppercase' }}>Return Home</Link>
      </section>
    </main>
  )
}

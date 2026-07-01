import Link from 'next/link'
import { BrandLogo } from '@/components/ui/BrandLogo'

export default function NotFound() {
  return (
    <main
      style={{
        alignItems: 'center',
        backgroundColor: '#FBF5F0',
        color: '#1A1014',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '56px 20px',
        textAlign: 'center',
      }}
    >
      <section style={{ maxWidth: '560px', width: '100%' }}>
        <div style={{ marginBottom: '36px' }}>
          <BrandLogo size="lg" href="/" />
        </div>
        <p
          style={{
            color: '#C9A961',
            fontFamily: 'var(--font-inter)',
            fontSize: '11px',
            letterSpacing: '0.3em',
            margin: '0 0 16px',
          }}
        >
          404
        </p>
        <h1
          style={{
            color: '#1A1014',
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(34px, 6vw, 52px)',
            fontWeight: 400,
            lineHeight: 1.08,
            margin: '0 0 18px',
          }}
        >
          We could not find that page.
        </h1>
        <p
          style={{
            color: '#B8A090',
            fontFamily: 'var(--font-inter)',
            fontSize: '14px',
            lineHeight: 1.8,
            margin: '0 auto 34px',
            maxWidth: '420px',
          }}
        >
          The page you are looking for may have moved or no longer exists.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center' }}>
          <Link
            href="/"
            style={{
              background: '#1A1014',
              color: '#FBF5F0',
              display: 'inline-block',
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              letterSpacing: '0.18em',
              padding: '14px 28px',
              textDecoration: 'none',
            }}
          >
            RETURN HOME
          </Link>
          <Link
            href="/products"
            style={{
              background: 'transparent',
              border: '0.5px solid #C9A961',
              color: '#1A1014',
              display: 'inline-block',
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              letterSpacing: '0.18em',
              padding: '14px 28px',
              textDecoration: 'none',
            }}
          >
            BROWSE COLLECTION
          </Link>
        </div>
      </section>
    </main>
  )
}

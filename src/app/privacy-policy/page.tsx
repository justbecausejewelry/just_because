import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <main style={{ background: '#FBF5F0', color: '#1A1014', minHeight: '100vh', padding: '72px 24px' }}>
      <section style={{ maxWidth: '760px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.16em', textDecoration: 'none', textTransform: 'uppercase' }}>
          Just Because
        </Link>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '40px', fontWeight: 400, margin: '28px 0 16px' }}>
          Privacy Policy
        </h1>
        <div style={{ borderTop: '0.5px solid #EDD9AF', paddingTop: '24px' }}>
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '14px', lineHeight: 1.8 }}>
            This privacy policy is a placeholder for the Just Because prototype. Replace this page with reviewed privacy terms before collecting real customer data.
          </p>
        </div>
      </section>
    </main>
  )
}

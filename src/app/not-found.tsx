import Link from 'next/link'
import { BrandLogo } from '@/components/ui/BrandLogo'

export default function NotFound() {
  return (
    <main style={{ alignItems: 'center', backgroundColor: '#FBF5F0', color: '#1A1014', display: 'flex', justifyContent: 'center', minHeight: '80vh', padding: '40px 20px', textAlign: 'center' }}>
      <section style={{ maxWidth: '430px' }}>
        <div style={{ marginBottom: '24px' }}>
          <BrandLogo size="lg" href="/" />
        </div>
        <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '72px', fontWeight: 400, lineHeight: 1, margin: '32px 0 8px' }}>404</h1>
        <p style={{ color: '#1A1014', fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '24px', lineHeight: 1.2, margin: '0 0 12px' }}>This page does not exist.</p>
        <p style={{ color: '#B8A090', fontFamily: 'var(--font-jost), Arial, sans-serif', fontSize: '15px', lineHeight: 1.7, margin: '0 0 32px' }}>The page you are looking for may have been moved or no longer exists.</p>
        <Link href="/" style={{ backgroundColor: '#1A1014', color: '#FBF5F0', display: 'inline-block', fontFamily: 'var(--font-jost), Arial, sans-serif', fontSize: '12px', letterSpacing: '0.16em', padding: '14px 32px', textDecoration: 'none', textTransform: 'uppercase' }}>Return Home</Link>
      </section>
    </main>
  )
}

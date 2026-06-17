import Link from 'next/link'

export default function TermsPage() {
  return (
    <main style={{ background: '#FBF5F0', color: '#1A1014', minHeight: '100vh', padding: '72px 24px' }}>
      <section style={{ maxWidth: '760px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.16em', textDecoration: 'none', textTransform: 'uppercase' }}>
          Just Because
        </Link>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '40px', fontWeight: 400, margin: '28px 0 16px' }}>
          Terms of Service
        </h1>
        <div style={{ borderTop: '0.5px solid #EDD9AF', display: 'grid', gap: '24px', paddingTop: '24px' }}>
          {[
            ['Orders', 'By placing an order, you agree that the information you provide is accurate and that you are authorized to use the selected payment method. Order confirmations indicate that we have received your request; acceptance occurs when the order is reviewed and confirmed.'],
            ['Product Details', 'We make every effort to present lab-grown diamond, metal, size, and price details accurately. Natural screen differences may affect how colors and finishes appear. Final handcrafted pieces may vary slightly within normal jewelry tolerances.'],
            ['Shipping', 'Estimated delivery windows are provided at checkout and in your order confirmation. Delivery dates may change because of carrier delays, address issues, weather, or production requirements.'],
            ['Returns', 'Eligible items may be returned according to our returns policy. Returned pieces must be unworn, undamaged, and sent back with original packaging and documentation. Custom, engraved, resized, or final-sale items may not be eligible for return.'],
            ['Account Security', 'You are responsible for keeping your account credentials secure and for notifying us if you believe your account has been accessed without authorization.'],
            ['Contact', 'Questions about these terms can be sent through our contact page or by replying to an order email from Just Because Jewelry.'],
          ].map(([title, copy]) => (
            <section key={title}>
              <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, margin: '0 0 8px' }}>{title}</h2>
              <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '14px', lineHeight: 1.8, margin: 0 }}>{copy}</p>
            </section>
          ))}
        </div>
      </section>
    </main>
  )
}

import { BrandLogo } from '@/components/ui/BrandLogo'

export default function PrivacyPolicyPage() {
  return (
    <main style={{ background: '#FBF5F0', color: '#1A1014', minHeight: '100vh', padding: '72px 24px' }}>
      <section style={{ maxWidth: '760px', margin: '0 auto' }}>
        <BrandLogo size="md" href="/" />
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '40px', fontWeight: 400, margin: '28px 0 16px' }}>
          Privacy Policy
        </h1>
        <div style={{ borderTop: '0.5px solid #EDD9AF', display: 'grid', gap: '24px', paddingTop: '24px' }}>
          {[
            ['Information We Collect', 'We collect the information needed to create accounts, process orders, provide customer support, and improve the Just Because shopping experience. This may include name, email, phone number, shipping address, order details, support messages, and site interaction data.'],
            ['How We Use Information', 'We use customer information to verify accounts, prepare and ship orders, send transactional emails, prevent fraud, respond to requests, manage returns, and maintain the security and performance of the website.'],
            ['Payments', 'Payment information is processed by our payment partners. Just Because Jewelry does not store full payment card numbers on our servers.'],
            ['Sharing', 'We share information only with service providers needed to operate the store, such as payment, shipping, email, analytics, fraud prevention, and hosting providers. We do not sell customer personal information.'],
            ['Retention', 'We keep order and account records as long as needed for customer service, legal, tax, fraud prevention, and business record purposes.'],
            ['Your Choices', 'You may contact us to update account information, ask privacy questions, or request assistance with your data. Transactional order emails are necessary for purchases and account security.'],
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

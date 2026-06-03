import Link from 'next/link'
import type { ReactNode } from 'react'
import { RefreshCw, RotateCcw } from 'lucide-react'

const nonRefundableItems = [
  'Used or worn items',
  'Rings exchanged previously',
  'Items purchased more than 30 days ago',
  'Engraving fees',
  'Items marked as final sale',
  'Shipping fees, including express and international',
  'Handling fee of $9.99, waived for one ring or matching ring set per household',
]

const timelineSteps = [
  'We receive your return',
  'Item inspected, usually within 1-2 business days',
  'Refund processed in 5-10 business days, up to 15 business days',
]

const cardStyle = {
  background: '#FDF8F2',
  border: '0.5px solid rgba(237,217,175,0.75)',
  borderRadius: '8px',
  boxShadow: '0 4px 20px rgba(26,16,20,0.06)',
  padding: '32px',
} as const

const bodyTextStyle = {
  color: '#6B5B4E',
  fontFamily: 'var(--font-inter)',
  fontSize: '14px',
  lineHeight: 1.85,
} as const

function PolicyButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        background: '#1A1014',
        color: '#FBF5F0',
        display: 'inline-flex',
        fontFamily: 'var(--font-jost)',
        fontSize: '13px',
        fontWeight: 500,
        letterSpacing: '0.1em',
        padding: '14px 24px',
        textDecoration: 'none',
        textTransform: 'uppercase',
        transition: 'background 400ms cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {children}
    </Link>
  )
}

export default function ReturnsPage() {
  return (
    <main style={{ background: '#FBF5F0', minHeight: '100vh' }}>
      <section
        style={{
          background: '#FBF5F0',
          padding: 'clamp(56px, 8vw, 104px) 24px 48px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            color: '#C9A961',
            fontFamily: 'var(--font-jost)',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.22em',
            marginBottom: '16px',
            textTransform: 'uppercase',
          }}
        >
          OUR POLICY
        </p>
        <h1
          style={{
            color: '#1A1014',
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(38px, 7vw, 72px)',
            fontWeight: 400,
            lineHeight: 1.05,
            margin: '0 auto 18px',
          }}
        >
          Returns & Exchanges
        </h1>
        <p
          style={{
            ...bodyTextStyle,
            margin: '0 auto',
            maxWidth: '560px',
          }}
        >
          We want you to love every piece. Here&apos;s how we make it right.
        </p>
      </section>

      <section style={{ padding: '0 24px 72px' }}>
        <div
          style={{
            display: 'grid',
            gap: '24px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            margin: '0 auto',
            maxWidth: '1120px',
          }}
        >
          <article style={cardStyle}>
            <RefreshCw color="#C9A961" size={32} strokeWidth={1.5} />
            <h2
              style={{
                color: '#1A1014',
                fontFamily: 'var(--font-playfair)',
                fontSize: '30px',
                fontWeight: 400,
                margin: '22px 0 18px',
              }}
            >
              Exchanges
            </h2>
            <div style={{ display: 'grid', gap: '16px', marginBottom: '28px' }}>
              <p style={bodyTextStyle}>
                New, unworn items may be exchanged for another size or style within 30 days of purchase unless otherwise noted.
              </p>
              <p style={bodyTextStyle}>
                To start an exchange, contact our team and we&apos;ll be happy to help. Shipping fees for exchanges are the responsibility of the customer.
              </p>
            </div>
            <PolicyButton href="/contact">Start an Exchange -&gt;</PolicyButton>
          </article>

          <article style={cardStyle}>
            <RotateCcw color="#C9A961" size={32} strokeWidth={1.5} />
            <h2
              style={{
                color: '#1A1014',
                fontFamily: 'var(--font-playfair)',
                fontSize: '30px',
                fontWeight: 400,
                margin: '22px 0 18px',
              }}
            >
              Returns
            </h2>
            <div style={{ display: 'grid', gap: '16px', marginBottom: '28px' }}>
              <p style={bodyTextStyle}>
                New, unworn items may be returned within 30 days of purchase unless otherwise noted.
              </p>
              <p style={bodyTextStyle}>
                Contact us with your order number to start a return. We respond within 1-2 business days with return instructions. Return authorization must be received prior to returning any items.
              </p>
              <p style={bodyTextStyle}>
                We recommend contacting us within 21 days of ordering to allow time for the authorization process and return shipping.
              </p>
              <p style={bodyTextStyle}>
                We offer free USPS first class return shipping labels for USA orders upon request, limit one prepaid label per household.
              </p>
            </div>
            <PolicyButton href="/contact">Start a Return -&gt;</PolicyButton>
          </article>
        </div>
      </section>

      <section style={{ padding: '0 24px 72px' }}>
        <div style={{ ...cardStyle, margin: '0 auto', maxWidth: '1120px' }}>
          <h2
            style={{
              color: '#1A1014',
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 400,
              marginBottom: '24px',
            }}
          >
            Non-Refundable Items
          </h2>
          <div
            style={{
              display: 'grid',
              gap: '14px 28px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            }}
          >
            {nonRefundableItems.map((item) => (
              <div
                key={item}
                style={{
                  borderBottom: '0.5px solid rgba(237,217,175,0.8)',
                  color: '#6B5B4E',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  padding: '0 0 12px',
                }}
              >
                <span style={{ color: '#C9A961', marginRight: '10px' }}>-</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 24px 72px' }}>
        <div style={{ margin: '0 auto', maxWidth: '1120px' }}>
          <h2
            style={{
              color: '#1A1014',
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 400,
              marginBottom: '28px',
              textAlign: 'center',
            }}
          >
            Refund Timeline
          </h2>
          <div
            style={{
              display: 'grid',
              gap: '18px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
              marginBottom: '28px',
            }}
          >
            {timelineSteps.map((step, index) => (
              <div key={step} style={cardStyle}>
                <div
                  style={{
                    alignItems: 'center',
                    background: '#1A1014',
                    color: '#C9A961',
                    display: 'flex',
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '20px',
                    height: '42px',
                    justifyContent: 'center',
                    marginBottom: '18px',
                    width: '42px',
                  }}
                >
                  {index + 1}
                </div>
                <p style={bodyTextStyle}>{step}</p>
              </div>
            ))}
          </div>
          <div
            style={{
              background: '#FDF8F2',
              border: '0.5px solid #C9A961',
              color: '#6B5B4E',
              fontFamily: 'var(--font-jost)',
              fontSize: '16px',
              lineHeight: 1.8,
              padding: '22px',
            }}
          >
            Items returned with signs of wear or received after the return deadline will be refused or charged a 30% restocking fee at our discretion. Cancelled and returned orders over $800 are subject to a 3% processing fee. Custom items generally may not be cancelled once manufacturing has been started.
          </div>
        </div>
      </section>

      <section
        style={{
          background: '#FDF8F2',
          borderTop: '0.5px solid #EDD9AF',
          padding: '56px 24px 72px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            color: '#1A1014',
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 400,
            marginBottom: '12px',
          }}
        >
          Have questions about a return?
        </p>
        <p style={{ ...bodyTextStyle, marginBottom: '12px' }}>Our team is available at:</p>
        <a
          href="mailto:team@justbecausejewelry.com"
          style={{
            color: '#C9A961',
            display: 'inline-block',
            fontFamily: 'var(--font-inter)',
            fontSize: '15px',
            marginBottom: '26px',
            textDecoration: 'none',
          }}
        >
          team@justbecausejewelry.com
        </a>
        <div>
          <PolicyButton href="/contact">Contact Us</PolicyButton>
        </div>
      </section>
    </main>
  )
}

'use client'

import Link from 'next/link'

export function EditorialSplit() {
  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .editorial-split-section {
            grid-template-columns: 1fr !important;
            height: auto !important;
          }

          .editorial-split-image {
            height: 300px !important;
          }

          .editorial-split-copy {
            padding: 40px 28px !important;
          }

          .editorial-split-actions {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
      `}</style>

      <section
        className="editorial-split-section"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          height: '70vh',
          overflow: 'hidden',
        }}
      >
        <div
          className="editorial-split-image"
          style={{
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&q=90"
            alt="Just Because"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.8s ease',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = 'scale(1.04)'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = 'scale(1)'
            }}
          />
        </div>

        <div
          className="editorial-split-copy"
          style={{
            background: '#1A1014',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '80px',
          }}
        >
          <div
            style={{
              fontSize: '9px',
              letterSpacing: '0.35em',
              color: '#C9A961',
              fontFamily: 'var(--font-inter)',
              marginBottom: '20px',
            }}
          >
            THE QUESTION THAT CHANGES EVERYTHING
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(36px, 4vw, 52px)',
              fontWeight: 400,
              color: '#FBF5F0',
              lineHeight: 1.05,
              marginBottom: '8px',
            }}
          >
            For the moment
          </h2>
          <h2
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(36px, 4vw, 52px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#C9A961',
              lineHeight: 1.05,
              marginBottom: '28px',
            }}
          >
            that matters most.
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
              color: 'rgba(184,160,144,0.85)',
              lineHeight: 1.85,
              maxWidth: '380px',
              marginBottom: '40px',
            }}
          >
            Every engagement ring in our collection is made to hold the weight
            of that question. Lab-grown diamonds, ethically sourced, set in
            recycled gold - beautiful inside and out.
          </p>

          <div className="editorial-split-actions" style={{ display: 'flex', gap: '14px' }}>
            <Link
              href="/products?type=engagement_ring"
              style={{
                background: '#FBF5F0',
                color: '#1A1014',
                padding: '14px 32px',
                fontSize: '11px',
                letterSpacing: '0.18em',
                textDecoration: 'none',
                fontFamily: 'var(--font-inter)',
                display: 'inline-block',
                transition: 'background 0.3s',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = '#EDD9AF'
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = '#FBF5F0'
              }}
            >
              SHOP ENGAGEMENT -&gt;
            </Link>
            <Link
              href="/build"
              style={{
                background: 'transparent',
                color: 'rgba(251,245,240,0.6)',
                padding: '14px 32px',
                fontSize: '11px',
                letterSpacing: '0.18em',
                textDecoration: 'none',
                fontFamily: 'var(--font-inter)',
                border: '1px solid rgba(201,169,97,0.3)',
                display: 'inline-block',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.borderColor = '#C9A961'
                event.currentTarget.style.color = '#FBF5F0'
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.borderColor = 'rgba(201,169,97,0.3)'
                event.currentTarget.style.color = 'rgba(251,245,240,0.6)'
              }}
            >
              BUILD YOURS
            </Link>
          </div>
        </div>
      </section>

      <section
        className="editorial-split-section"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          height: '70vh',
          overflow: 'hidden',
        }}
      >
        <div
          className="editorial-split-copy"
          style={{
            background: '#FBF5F0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '80px',
          }}
        >
          <div
            style={{
              fontSize: '9px',
              letterSpacing: '0.35em',
              color: '#C9A961',
              fontFamily: 'var(--font-inter)',
              marginBottom: '20px',
            }}
          >
            JUST BECAUSE
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(36px, 4vw, 52px)',
              fontWeight: 400,
              color: '#1A1014',
              lineHeight: 1.05,
              marginBottom: '8px',
            }}
          >
            You don&apos;t need
          </h2>
          <h2
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(36px, 4vw, 52px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#C9A961',
              lineHeight: 1.05,
              marginBottom: '28px',
            }}
          >
            a reason.
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
              color: '#B8A090',
              lineHeight: 1.85,
              maxWidth: '380px',
              marginBottom: '40px',
            }}
          >
            A Tuesday. A quiet dinner. A moment only you will remember. The
            best gifts are the ones that don&apos;t wait for a special occasion
            to justify them.
          </p>

          <Link
            href="/products"
            style={{
              background: '#1A1014',
              color: '#FBF5F0',
              padding: '14px 32px',
              fontSize: '11px',
              letterSpacing: '0.18em',
              textDecoration: 'none',
              fontFamily: 'var(--font-inter)',
              display: 'inline-block',
              width: 'fit-content',
              transition: 'background 0.3s',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = '#2A1E24'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = '#1A1014'
            }}
          >
            SHOP THE COLLECTION -&gt;
          </Link>
        </div>

        <div
          className="editorial-split-image"
          style={{
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=800&q=90"
            alt="Just Because"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.8s ease',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = 'scale(1.04)'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = 'scale(1)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, rgba(251,245,240,0.15) 0%, transparent 40%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </section>
    </div>
  )
}

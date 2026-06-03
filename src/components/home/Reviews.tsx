'use client'

import Image from 'next/image'

const ugcPhotos = [
  {
    src: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=90',
    name: 'Priya M.',
    location: 'Mumbai',
    review: 'I bought this for myself on a Tuesday. No occasion. Just because.',
  },
  {
    src: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&q=90',
    name: 'Sarah K.',
    location: 'Brooklyn',
    review: 'The packaging alone made me cry. The diamond outshines everything.',
  },
  {
    src: 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&q=90',
    name: 'Aisha R.',
    location: 'Dubai',
    review: 'Wore it to dinner and got asked about it three times.',
  },
  {
    src: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=90',
    name: 'Emma L.',
    location: 'London',
    review: 'It felt personal, considered, and quietly luxurious.',
  },
  {
    src: 'https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=600&q=90',
    name: 'Aaron L.',
    location: 'Toronto',
    review: 'Everything about it felt like a boutique appointment.',
  },
]

const reviewCards = [
  {
    name: 'Priya M.',
    loc: 'Mumbai',
    rating: 5,
    product: 'Solis Solitaire Ring',
    review: 'I bought this for myself on a Tuesday. No occasion. Just because. Best decision of the year.',
  },
  {
    name: 'Sarah K.',
    loc: 'Brooklyn',
    rating: 5,
    product: 'Lumi Halo Ring',
    review: 'The packaging alone made me cry. The diamond outshines my old one and it cost half.',
  },
  {
    name: 'Aaron L.',
    loc: 'Toronto',
    rating: 5,
    product: 'Tennis Bracelet',
    review: 'Felt less like e-commerce, more like a friend helping me choose. Exceptional service.',
  },
]

export function Reviews() {
  return (
    <section
      style={{
        padding: '96px 0',
        background: '#FDF8F2',
        textAlign: 'center',
      }}
    >
      <style>{`
        @media (max-width: 767px) {
          .ugc-header {
            padding: 0 24px !important;
          }

          .ugc-strip {
            overflow-x: auto !important;
            scroll-snap-type: x mandatory;
          }

          .ugc-photo {
            flex: 0 0 78vw !important;
            height: 320px !important;
            scroll-snap-align: start;
          }

          .ugc-review-grid {
            grid-template-columns: 1fr !important;
            padding: 0 24px !important;
          }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .ugc-photo {
            flex: 0 0 34vw !important;
          }

          .ugc-review-grid {
            grid-template-columns: 1fr !important;
            padding: 0 48px !important;
          }
        }
      `}</style>

      <div
        className="ugc-header"
        style={{
          padding: '0 80px',
          marginBottom: '48px',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.22em',
            color: '#C9A961',
            marginBottom: '12px',
            fontFamily: 'var(--font-jost)',
          }}
        >
          REAL CUSTOMERS
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: 'clamp(2rem,4vw,3.2rem)',
            fontWeight: 400,
            color: '#1A1014',
            marginBottom: '12px',
          }}
        >
          Words from real wearers
        </h2>
        <div
          style={{
            fontSize: '22px',
            color: '#C9A961',
            marginBottom: '6px',
            letterSpacing: '4px',
          }}
        >
          ★★★★★
        </div>
        <div
          style={{
            fontSize: '14px',
            color: '#B8A090',
            fontFamily: 'var(--font-jost)',
          }}
        >
          4.9 / 5 · 2,847 verified reviews
        </div>
      </div>

      <div
        className="ugc-strip"
        style={{
          display: 'flex',
          gap: '0',
          marginBottom: '64px',
          overflow: 'hidden',
          maxWidth: '100%',
        }}
      >
        {ugcPhotos.map((photo) => (
          <div
            key={photo.src}
            className="ugc-photo"
            style={{
              flex: 1,
              height: '360px',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
            onMouseEnter={(event) => {
              const img = event.currentTarget.querySelector('img')
              if (img) img.style.transform = 'scale(1.06)'
            }}
            onMouseLeave={(event) => {
              const img = event.currentTarget.querySelector('img')
              if (img) img.style.transform = 'scale(1)'
            }}
          >
            <Image
              src={photo.src}
              alt={photo.name}
              fill
              style={{
                objectFit: 'cover',
                transition: 'transform 0.6s ease',
              }}
              sizes="(max-width: 767px) 78vw, (max-width: 1023px) 34vw, 20vw"
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(26,16,20,0.75) 0%, transparent 50%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '14px',
                right: '14px',
              }}
            >
              <div style={{ fontSize: '10px', color: '#C9A961', marginBottom: '3px' }}>★★★★★</div>
              <div
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontStyle: 'italic',
                  fontSize: '11px',
                  color: 'rgba(251,245,240,0.9)',
                  lineHeight: 1.4,
                  marginBottom: '4px',
                }}
              >
                &quot;{photo.review}&quot;
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'rgba(201,169,97,0.8)',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                {photo.name} · {photo.location}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="ugc-review-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: '16px',
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 80px',
          textAlign: 'left',
        }}
      >
        {reviewCards.map((review) => (
          <div
            key={review.name}
            style={{
              background: '#FBF5F0',
              border: '0.5px solid #EDD9AF',
              padding: '28px 24px',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.boxShadow = '0 8px 32px rgba(26,16,20,0.08)'
              event.currentTarget.style.borderColor = '#C9A961'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.boxShadow = 'none'
              event.currentTarget.style.borderColor = '#EDD9AF'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
                marginBottom: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', color: '#C9A961' }}>{'★'.repeat(review.rating)}</div>
                <div
                  style={{
                    fontSize: '14px',
                    letterSpacing: '0.1em',
                    color: '#B8A090',
                    marginTop: '3px',
                    fontFamily: 'var(--font-jost)',
                  }}
                >
                  Verified · {review.product}
                </div>
              </div>
              <div
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.15em',
                  color: '#C9A961',
                  background: 'rgba(201,169,97,0.08)',
                  border: '0.5px solid rgba(201,169,97,0.2)',
                  padding: '3px 8px',
                  fontFamily: 'var(--font-jost)',
                  fontWeight: 600,
                }}
              >
                VERIFIED
              </div>
            </div>

            <p
              style={{
                fontFamily: 'var(--font-playfair)',
                fontStyle: 'italic',
                fontSize: '14px',
                color: '#1A1014',
                lineHeight: 1.75,
                marginBottom: '16px',
              }}
            >
              &quot;{review.review}&quot;
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                paddingTop: '14px',
                borderTop: '0.5px solid #EDD9AF',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #C9A961, #EDD9AF)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-playfair)',
                  fontSize: '14px',
                  color: '#1A1014',
                }}
              >
                {review.name.charAt(0)}
              </div>
              <div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#1A1014',
                    fontWeight: 500,
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  {review.name}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#B8A090',
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  {review.loc}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

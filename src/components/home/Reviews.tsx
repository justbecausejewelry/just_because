import Image from 'next/image'
import Link from 'next/link'

const posts = [
  {
    src: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=700&q=90',
    handle: '@priya.m',
  },
  {
    src: 'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=700&q=90',
    handle: '@sarah.brooklyn',
  },
  {
    src: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=700&q=90',
    handle: '@aaron.wears',
  },
  {
    src: 'https://images.unsplash.com/photo-1502767089025-6572583495b9?w=700&q=90',
    handle: '@daaniela.j',
  },
  {
    src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=700&q=90',
    handle: '@hannah.photos',
  },
]

export function Reviews() {
  return (
    <section
      className="reviews-section"
      style={{
        backgroundColor: '#FBF5F0',
        borderTop: '0.5px solid #EDD9AF',
        padding: '72px 0 0',
      }}
    >
      <div>
        <p
          style={{
            color: '#5C4F47',
            fontFamily: 'var(--font-inter)',
            fontSize: '11px',
            letterSpacing: '0.3em',
            marginBottom: '20px',
            paddingLeft: 'clamp(24px, 5vw, 60px)',
          }}
        >
          AS SEEN ON #JUSTBECAUSE
        </p>
      </div>

      <div
        className="flex flex-nowrap overflow-x-auto lg:overflow-x-visible"
        style={{
          gap: 0,
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {posts.map((post) => (
          <div
            key={post.handle}
            className="group h-[300px] flex-[0_0_75vw] md:h-[320px] md:flex-[0_0_42%] lg:h-[440px] lg:flex-1"
            style={{
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative',
              scrollSnapAlign: 'start',
            }}
          >
            <Image
              src={post.src}
              alt={`${post.handle} wearing Just Because jewelry`}
              fill
              sizes="(max-width: 767px) 82vw, (max-width: 1023px) 42vw, 20vw"
              className="transition-transform duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.04]"
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
            />
            <div
              className="transition-opacity duration-600 group-hover:opacity-100"
              style={{
                backgroundColor: 'rgba(26,16,20,0.14)',
                inset: 0,
                opacity: 0.72,
                position: 'absolute',
              }}
            />
            <div
              style={{
                alignItems: 'center',
                bottom: '16px',
                color: '#FBF5F0',
                display: 'flex',
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: 500,
                gap: '6px',
                left: '16px',
                position: 'absolute',
                textShadow: '0 1px 4px rgba(26,16,20,0.4)',
              }}
            >
              <span
                style={{
                  border: '1px solid #FBF5F0',
                  borderRadius: '50%',
                  display: 'inline-block',
                  height: '12px',
                  width: '12px',
                }}
              />
              {post.handle}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '32px clamp(24px, 5vw, 60px)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: '#C9A961', fontSize: '22px' }}>★★★★★</span>
          <span
            style={{
              color: '#1A1014',
              fontFamily: 'var(--font-playfair)',
              fontSize: '18px',
            }}
          >
            4.9 / 5
          </span>
          <span
            style={{
              color: '#5C4F47',
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
            }}
          >
            · 2,847 verified reviews
          </span>
        </div>

        <Link
          href="/reviews"
          style={{
            color: '#C9A961',
            display: 'inline-block',
            fontFamily: 'var(--font-inter)',
            fontSize: '11px',
            letterSpacing: '0.15em',
            marginTop: '8px',
            textDecoration: 'none',
          }}
        >
          Read all reviews →
        </Link>
      </div>
    </section>
  )
}

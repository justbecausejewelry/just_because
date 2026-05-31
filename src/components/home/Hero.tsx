import Image from 'next/image'
import Link from 'next/link'

const heroProduct = {
  title: 'Solis Solitaire',
  price: '$2,800',
  image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&q=90',
  slug: 'solis-solitaire',
}

export function Hero() {
  return (
    <section
      className="hero-section grid min-h-screen grid-cols-1 md:grid-cols-[50%_50%] lg:grid-cols-[45%_55%]"
      style={{ backgroundColor: '#FBF5F0' }}
    >
      <div className="hero-image order-1 flex w-full flex-col gap-3 md:order-2 md:h-full md:justify-center md:py-10 lg:py-14">
        <div className="relative h-[60vw] min-h-[280px] max-h-[400px] w-full overflow-hidden md:h-[72vh] md:max-h-[760px]">
          <Image
            src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1400&q=90"
            alt="Just Because lab grown diamond ring"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 55vw"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            quality={90}
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(251,245,240,0.08)' }}
          />
        </div>

        <Link
          href={`/products/${heroProduct.slug}`}
          className="mx-4 flex items-center justify-between gap-4 px-4 py-3 text-left no-underline transition-colors duration-400 md:mx-0 md:mr-6 lg:mr-10"
          style={{
            background: '#FDF8F2',
            border: '0.5px solid #EDD9AF',
            color: '#1A1014',
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              style={{
                position: 'relative',
                width: '48px',
                height: '48px',
                flexShrink: 0,
                overflow: 'hidden',
                background: '#F5E8ED',
                border: '0.5px solid #EDD9AF',
              }}
            >
              <Image
                src={heroProduct.image}
                alt={heroProduct.title}
                fill
                sizes="48px"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
            </div>
            <div className="min-w-0">
              <div
                style={{
                  color: '#C9A961',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '9px',
                  letterSpacing: '0.22em',
                  marginBottom: '3px',
                }}
              >
                FEATURED PIECE
              </div>
              <div
                style={{
                  color: '#1A1014',
                  fontFamily: 'var(--font-playfair)',
                  fontSize: '15px',
                  fontWeight: 400,
                }}
              >
                {heroProduct.title}
              </div>
              <div
                style={{
                  color: '#B8A090',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '12px',
                  marginTop: '2px',
                }}
              >
                From {heroProduct.price}
              </div>
            </div>
          </div>
          <span
            className="shrink-0 text-[11px] tracking-[0.18em]"
            style={{ color: '#C9A961', fontFamily: 'var(--font-inter)' }}
          >
            VIEW
          </span>
        </Link>
      </div>

      <div className="hero-copy order-2 flex items-center px-6 py-10 text-center md:order-1 md:px-10 md:py-[60px] md:text-left lg:px-20 lg:py-20">
        <div>
          <p
            className="mb-5 text-[9px] tracking-[0.32em] md:text-[10px]"
            style={{ color: '#C9A961', fontFamily: 'var(--font-inter)' }}
          >
            DESIGN YOUR RING
          </p>
          <h1
            className="mb-6 text-[36px] leading-[1.1] md:text-[44px] lg:text-[64px]"
            style={{
              color: '#1A1014',
              fontFamily: 'var(--font-playfair)',
              fontWeight: 400,
            }}
          >
            A reason,
            <br />
            <em style={{ color: '#E8C4D0', fontStyle: 'italic' }}>
              in itself.
            </em>
          </h1>
          <p
            className="mx-auto mb-10 max-w-[380px] text-[13px] leading-[1.75] md:mx-0 md:text-[15px]"
            style={{ color: '#3D3028', fontFamily: 'var(--font-inter)' }}
          >
            Lab-grown diamonds and 18k recycled gold, crafted for the moments
            that don&apos;t ask for an occasion.
          </p>

          <div className="flex flex-col gap-[10px] sm:flex-row">
            <Link
              href="/products"
              className="w-full px-8 py-[14px] text-center text-[11px] tracking-[0.18em] sm:w-auto"
              style={{
                backgroundColor: '#1A1014',
                border: 'none',
                color: '#FBF5F0',
                fontFamily: 'var(--font-inter)',
              }}
            >
              Shop the collection
            </Link>
            <Link
              href="/build"
              className="w-full border px-8 py-[14px] text-center text-[11px] tracking-[0.18em] sm:w-auto"
              style={{
                backgroundColor: 'transparent',
                borderColor: '#EDD9AF',
                color: '#1A1014',
                fontFamily: 'var(--font-inter)',
              }}
            >
              Build a ring
            </Link>
          </div>

          <div
            className="mt-12 grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] tracking-[0.15em] sm:flex sm:flex-wrap"
            style={{ color: '#5C4F47', fontFamily: 'var(--font-inter)' }}
          >
            <span>IGI Certified</span>
            <span>-</span>
            <span>Free Returns</span>
            <span>-</span>
            <span>Lifetime Warranty</span>
          </div>
        </div>
      </div>
    </section>
  )
}

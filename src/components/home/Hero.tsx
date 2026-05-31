import Image from 'next/image'
import Link from 'next/link'

const heroProduct = {
  title: 'Solis Solitaire',
  subtitle: '18K White Gold - 2ct Round',
  price: '$2,800',
  image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&q=90',
}

export function Hero() {
  return (
    <section
      className="hero-section grid min-h-screen grid-cols-1 md:grid-cols-[50%_50%] lg:grid-cols-[45%_55%]"
      style={{ backgroundColor: '#FBF5F0' }}
    >
      <div className="hero-image relative order-1 h-[60vw] min-h-[280px] max-h-[400px] w-full overflow-hidden md:order-2 md:h-full md:max-h-none">
        <Image
          src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1400&q=90"
          alt="Just Because — lab grown diamond ring"
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
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            left: '32px',
            background: 'rgba(253,248,242,0.96)',
            borderLeft: '3px solid #C9A961',
            padding: '14px 18px',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0, overflow: 'hidden', background: '#FDF8F2' }}>
            <Image
              src={heroProduct.image}
              alt={heroProduct.title}
              fill
              sizes="48px"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
          <div>
            <p
              style={{
                color: '#1A1014',
                fontFamily: 'var(--font-playfair)',
                fontSize: '15px',
                fontWeight: 400,
              }}
            >
              {heroProduct.title}
            </p>
            <p
              style={{
                color: '#5C4F47',
                fontFamily: 'var(--font-inter)',
                fontSize: '10px',
                margin: '4px 0',
              }}
            >
              {heroProduct.subtitle}
            </p>
            <p
              style={{
                color: '#1A1014',
                fontFamily: 'var(--font-inter)',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              From {heroProduct.price}
            </p>
          </div>
        </div>
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
              Shop the collection →
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
            <span>✦ IGI Certified</span>
            <span>·</span>
            <span>✦ Free Returns</span>
            <span>·</span>
            <span>✦ Lifetime Warranty</span>
          </div>
        </div>
      </div>
    </section>
  )
}

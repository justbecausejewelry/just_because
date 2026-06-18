import Image from 'next/image'
import Link from 'next/link'

export function Hero() {
  return (
    <section
      className="hero-section grid min-h-screen grid-cols-1 md:grid-cols-[50%_50%] lg:grid-cols-[45%_55%]"
      style={{ backgroundColor: '#FBF5F0' }}
    >
      <div className="hero-image order-1 h-[60vw] min-h-[280px] max-h-[400px] w-full md:order-2 md:h-full md:max-h-none">
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src="/images/hero/hero-necklace.jpg"
            alt="Just Because diamond necklace in luxury jewelry box"
            fill
            className="object-cover object-[center_60%] md:object-[center_top]"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={true}
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(251,245,240,0.08)' }}
          />
        </div>
      </div>

      <div className="hero-copy order-2 flex items-center px-6 py-10 text-center md:order-1 md:px-10 md:py-[60px] md:text-left lg:px-20 lg:py-20">
        <div>
          <p
            className="mb-5 uppercase"
            style={{ color: '#C9A961', fontFamily: 'var(--font-jost)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.2em' }}
          >
            DESIGN YOUR RING
          </p>
          <h1
            className="mb-6"
            style={{
              color: '#1A1014',
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(2rem, 3.8vw, 3.4rem)',
              fontWeight: 400,
              lineHeight: 1.1,
            }}
          >
            A reason,
            <br />
            <em style={{ color: '#C9A961', fontSize: 'clamp(2rem, 3.8vw, 3.4rem)', fontStyle: 'italic' }}>
              in itself.
            </em>
          </h1>
          <p
            className="mx-auto mb-10 max-w-[430px] md:mx-0"
            style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-jost)', fontSize: '16px', fontWeight: 300, lineHeight: 1.625 }}
          >
            Lab-grown diamonds and 18k recycled gold, crafted for the moments
            that don&apos;t ask for an occasion.
          </p>

          <div className="flex flex-col gap-[10px] sm:flex-row">
            <Link
              href="/products"
              className="w-full px-8 py-[14px] text-center uppercase sm:w-auto"
              style={{
                backgroundColor: '#1A1014',
                border: 'none',
                color: '#FBF5F0',
                fontFamily: 'var(--font-jost)',
                fontSize: '11.5px',
                fontWeight: 500,
                letterSpacing: '0.12em',
              }}
            >
              Shop the collection
            </Link>
            <Link
              href="/build"
              className="w-full border px-8 py-[14px] text-center uppercase sm:w-auto"
              style={{
                backgroundColor: 'transparent',
                borderColor: '#EDD9AF',
                color: '#1A1014',
                fontFamily: 'var(--font-jost)',
                fontSize: '11.5px',
                fontWeight: 500,
                letterSpacing: '0.12em',
              }}
            >
              Build a ring
            </Link>
          </div>

          <div
            className="mt-12 grid grid-cols-2 gap-x-4 gap-y-2 sm:flex sm:flex-wrap"
            style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-jost)', fontSize: '14px', letterSpacing: '0.06em' }}
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

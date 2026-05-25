import Image from 'next/image'
import Link from 'next/link'

const categories = [
  {
    name: 'Rings',
    count: '120',
    price: 'From $980',
    href: '/products?category=rings',
    image: '/images/category/Rings.webp',
    alt: 'Rings collection',
    dark: false,
  },
  {
    name: 'Bracelets',
    count: '48',
    price: 'From $1,400',
    href: '/products?category=bracelets',
    image: '/images/category/Bracelets.webp',
    alt: 'Bracelets collection',
    dark: false,
  },
  {
    name: 'Necklaces',
    count: '76',
    price: 'From $620',
    href: '/products?category=necklaces',
    image: '/images/category/Necklaces.webp',
    alt: 'Necklaces collection',
    dark: false,
  },
  {
    name: 'Shop all',
    count: '244 pieces',
    price: '244 pieces',
    href: '/products',
    image: null,
    alt: '',
    dark: true,
  },
]

export function Categories() {
  return (
    <section
      className="px-6 py-12 md:px-10 md:py-[60px] lg:px-20 lg:py-[72px]"
      style={{ backgroundColor: '#FBF5F0' }}
    >
      <div className="text-center">
        <p
          className="mb-3 text-[10px] tracking-[0.32em]"
          style={{
            color: '#C9A961',
            fontFamily: 'var(--font-inter)',
            fontWeight: 500,
          }}
        >
          CATEGORIES
        </p>
        <h2
          className="text-[28px] leading-tight"
          style={{
            color: '#1A1014',
            fontFamily: 'var(--font-playfair)',
            fontWeight: 400,
          }}
        >
          Explore the collection
        </h2>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-[10px] md:grid-cols-4 md:gap-4">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={category.href}
            className="relative overflow-hidden rounded-[4px] border transition-transform duration-500 hover:-translate-y-1"
            style={{
              backgroundColor: category.dark ? '#1A1014' : '#FDF8F2',
              borderColor: category.dark ? '#1A1014' : '#EDD9AF',
              boxShadow: '0 4px 20px rgba(26,16,20,0.06)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#C9A961',
                color: '#3A2810',
                fontSize: '9px',
                padding: '3px 8px',
                letterSpacing: '0.1em',
                zIndex: 1,
              }}
            >
              {category.count}
            </div>
            {category.image ? (
              <div
                style={{
                  background: '#FFFFFF',
                  position: 'relative',
                  height: 'clamp(120px, 18vw, 200px)',
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={category.image}
                  alt={category.alt}
                  fill
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                />
              </div>
            ) : (
              <div
                className="relative flex h-[120px] items-center justify-center md:h-[160px] lg:h-[200px]"
                style={{ backgroundColor: '#1A1014' }}
              >
                <span style={{ fontSize: 36, color: '#C9A961' }}>-&gt;</span>
              </div>
            )}

            <div className="p-4">
              <h3
                className="text-[16px]"
                style={{
                  color: category.dark ? '#FBF5F0' : '#1A1014',
                  fontFamily: 'var(--font-playfair)',
                  fontWeight: 400,
                }}
              >
                {category.name}
              </h3>
              <p
                className="mt-1 text-[10px]"
                style={{
                  color: category.dark ? '#C9A961' : '#5C4F47',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                {category.price}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

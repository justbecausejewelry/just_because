import { existsSync } from 'node:fs'
import { join } from 'node:path'
import Image from 'next/image'
import Link from 'next/link'
import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { ArrowRight } from 'lucide-react'

type ProductSummary = {
  productType?: string | null
  basePrice?: number | null
}

type CategoryConfig = {
  name: string
  href: string
  image: string
  alt: string
  productTypes: string[]
  dark?: boolean
}

type CategoryCard = CategoryConfig & {
  minPrice: number | null
  priority: boolean
  imageExists: boolean
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    name: 'Rings',
    href: '/products?type=ring',
    image: '/images/category/rings.jpg',
    alt: 'Diamond rings collection',
    productTypes: ['ring', 'wedding_ring', 'engagement_ring'],
  },
  {
    name: 'Bracelets',
    href: '/products?type=bracelet',
    image: '/images/category/bracelets.jpg',
    alt: 'Diamond bracelets collection',
    productTypes: ['bracelet', 'tennis_bracelet', 'bangle'],
  },
  {
    name: 'Necklaces',
    href: '/products?type=necklace',
    image: '/images/category/necklaces.jpg',
    alt: 'Diamond necklaces collection',
    productTypes: ['necklace', 'tennis_necklace', 'pendant'],
  },
  {
    name: 'Earrings',
    href: '/products?type=earring',
    image: '/images/category/earrings.jpg',
    alt: 'Diamond earrings collection',
    productTypes: ['earring', 'stud'],
  },
  {
    name: 'Shop all',
    href: '/products',
    image: '/images/category/shopall.jpg',
    alt: 'Just Because jewelry collection',
    productTypes: [],
    dark: true,
  },
]

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

function publicImageExists(src: string) {
  return existsSync(join(process.cwd(), 'public', src.replace(/^\//, '')))
}

async function getProductSummaries() {
  noStore()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return { products: [] as ProductSummary[], count: 0 }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data, count, error } = await supabase
    .from('Product')
    .select('productType,basePrice', { count: 'exact' })
    .eq('isActive', true)

  if (error) {
    console.error('[home-categories] Failed to load Product category stats:', error)
    return { products: [] as ProductSummary[], count: 0 }
  }

  return {
    products: (data || []) as ProductSummary[],
    count: count || 0,
  }
}

function getCategoryMinPrice(products: ProductSummary[], productTypes: string[]) {
  const matchingPrices = products
    .filter((product) => product.productType && productTypes.includes(product.productType))
    .map((product) => Number(product.basePrice))
    .filter((price) => Number.isFinite(price) && price > 0)

  if (!matchingPrices.length) return null
  return Math.min(...matchingPrices)
}

function CategoryImage({
  category,
}: {
  category: CategoryCard
}) {
  if (!category.imageExists) {
    return (
      <div
        className="relative flex items-center justify-center"
        style={{
          backgroundColor: '#EDD9AF',
          height: 'clamp(150px, 18vw, 220px)',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            color: '#C9A961',
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(24px, 3vw, 38px)',
            fontStyle: 'italic',
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          {category.name}
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        background: category.dark ? '#1A1014' : '#FDF8F2',
        position: 'relative',
        height: 'clamp(150px, 18vw, 220px)',
        overflow: 'hidden',
      }}
    >
      <Image
        src={category.image}
        alt={category.alt}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        priority={category.priority}
        style={{ objectFit: 'cover' }}
      />
      {category.dark ? (
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(26,16,20,0.1) 0%, rgba(26,16,20,0.72) 100%)',
            inset: 0,
            position: 'absolute',
          }}
        />
      ) : null}
    </div>
  )
}

export async function Categories() {
  const { products, count } = await getProductSummaries()
  const categories = CATEGORY_CONFIGS.map((category, index): CategoryCard => ({
    ...category,
    minPrice: category.productTypes.length ? getCategoryMinPrice(products, category.productTypes) : null,
    priority: index < 2,
    imageExists: publicImageExists(category.image),
  }))

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

      <div className="mt-10 grid grid-cols-2 gap-[10px] md:grid-cols-3 md:gap-4 lg:grid-cols-5">
        {categories.map((category) => {
          const shopAllLabel = `${count} ${count === 1 ? 'piece' : 'pieces'}`
          const priceLabel = category.minPrice ? `From ${formatPrice(category.minPrice)}` : ''

          return (
            <Link
              key={category.name}
              href={category.href}
              className="group relative overflow-hidden rounded-[4px] border transition-transform duration-500 hover:-translate-y-1"
              style={{
                backgroundColor: category.dark ? '#1A1014' : '#FDF8F2',
                borderColor: category.dark ? '#1A1014' : '#EDD9AF',
                boxShadow: '0 4px 20px rgba(26,16,20,0.06)',
              }}
            >
              <CategoryImage category={category} />

              {category.dark ? (
                <div
                  style={{
                    alignItems: 'center',
                    background: '#C9A961',
                    color: '#1A1014',
                    display: 'flex',
                    height: '34px',
                    justifyContent: 'center',
                    position: 'absolute',
                    right: '12px',
                    top: '12px',
                    width: '34px',
                    zIndex: 2,
                  }}
                >
                  <ArrowRight size={17} strokeWidth={1.4} />
                </div>
              ) : null}

              <div
                className="p-4"
                style={{
                  position: category.dark ? 'absolute' : 'relative',
                  bottom: category.dark ? 0 : 'auto',
                  left: 0,
                  right: 0,
                  zIndex: 2,
                }}
              >
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
                {(category.dark ? shopAllLabel : priceLabel) ? (
                  <p
                    className="mt-1 text-[10px]"
                    style={{
                      color: category.dark ? '#C9A961' : 'var(--color-muted-text)',
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    {category.dark ? shopAllLabel : priceLabel}
                  </p>
                ) : null}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

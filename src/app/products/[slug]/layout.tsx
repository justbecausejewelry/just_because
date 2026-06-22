import type { Metadata } from 'next'
import { createServiceRoleClient } from '@/lib/server/security'

const SITE_URL = 'https://justbecausejewelry.com'

type ProductMetadataRow = {
  title: string | null
  description: string | null
  images: string[] | null
}

type ProductLayoutProps = {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

function truncateDescription(value: string | null | undefined) {
  if (!value) return ''
  return value.length > 160 ? `${value.slice(0, 157).trim()}...` : value
}

function firstProductImage(product: ProductMetadataRow | null) {
  const image = product?.images?.find((item) => item && !item.includes('undefined') && !item.includes('null'))
  return image || '/images/og-image.jpg'
}

export async function generateMetadata({ params }: ProductLayoutProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = createServiceRoleClient()

  if (!supabase) {
    return {
      title: 'Product',
      description: 'Shop Just Because lab-grown diamond jewelry.',
    }
  }

  const { data: product } = await supabase
    .from('Product')
    .select('title, description, images')
    .eq('slug', slug)
    .eq('isActive', true)
    .maybeSingle()

  const typedProduct = product as ProductMetadataRow | null
  const title = typedProduct?.title || 'Product'
  const description = truncateDescription(typedProduct?.description) || `Shop ${title} at Just Because - lab-grown diamonds, IGI certified.`
  const image = firstProductImage(typedProduct)

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/products/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/products/${slug}`,
      images: [
        {
          url: image,
          width: 1200,
          height: 1200,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default function ProductLayout({ children }: ProductLayoutProps) {
  return children
}

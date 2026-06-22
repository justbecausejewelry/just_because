import type { MetadataRoute } from 'next'
import { createServiceRoleClient } from '@/lib/server/security'

const SITE_URL = 'https://justbecausejewelry.com'

type ProductSitemapRow = {
  slug: string | null
  updatedAt: string | null
}

const staticPages: MetadataRoute.Sitemap = [
  { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
  { url: `${SITE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  { url: `${SITE_URL}/diamonds`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  { url: `${SITE_URL}/build`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  { url: `${SITE_URL}/returns`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${SITE_URL}/education/ring-size`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${SITE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  { url: `${SITE_URL}/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  { url: `${SITE_URL}/signup`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceRoleClient()
  if (!supabase) return staticPages

  const { data, error } = await supabase
    .from('Product')
    .select('slug, updatedAt')
    .eq('isActive', true)

  if (error) {
    console.error('[sitemap] Unable to load products:', error)
    return staticPages
  }

  const productPages: MetadataRoute.Sitemap = ((data || []) as ProductSitemapRow[])
    .filter((product) => product.slug)
    .map((product) => ({
      url: `${SITE_URL}/products/${product.slug}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

  return [...staticPages, ...productPages]
}

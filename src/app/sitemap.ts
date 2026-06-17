import type { MetadataRoute } from 'next'

const SITE_URL = 'https://justbecausejewelry.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    '',
    '/products',
    '/diamonds',
    '/build',
    '/cart',
    '/checkout',
    '/returns',
    '/education/ring-size',
    '/login',
    '/signup',
    '/privacy-policy',
    '/terms',
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }))
}

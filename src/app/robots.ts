import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/api',
          '/api/*',
          '/account',
          '/account/*',
          '/checkout',
          '/cart',
          '/order-confirmed',
          '/order-confirmation',
          '/wishlist',
        ],
      },
    ],
    sitemap: 'https://justbecausejewelry.com/sitemap.xml',
  }
}

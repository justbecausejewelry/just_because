import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : '*.supabase.co'
    const isProduction = process.env.NODE_ENV === 'production'

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "font-src 'self' data: https://fonts.gstatic.com",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://img.youtube.com https://*.supabase.co",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.stripe.com https://api.resend.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      isProduction ? 'upgrade-insecure-requests' : '',
    ].filter(Boolean).join('; ')

    const securityHeaders = [
      {
        key: 'Content-Security-Policy',
        value: csp,
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.stripe.com")',
      },
    ]

    if (isProduction) {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      })
    }

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [50, 75, 85, 90, 95, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    unoptimized: false,
  },
}

export default nextConfig

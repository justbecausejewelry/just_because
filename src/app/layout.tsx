import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Italianno, Jost } from 'next/font/google'
import { PageViewTracker } from '@/components/analytics/PageViewTracker'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AppShell } from '@/components/layout/AppShell'
import DiamondCursor from '@/components/ui/DiamondCursor'
import { CartProvider } from '@/context/CartContext'
import { ToastProvider } from '@/context/ToastContext'
import { WishlistProvider } from '@/context/WishlistContext'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-jost',
  display: 'swap',
})

const italianno = Italianno({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-italianno',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://justbecausejewelry.com'),
  title: {
    default: 'Just Because - Lab-Grown Diamond Jewelry',
    template: '%s | Just Because',
  },
  description: "Lab-grown diamonds and recycled gold, crafted for the moments that don't ask for an occasion. IGI certified, free shipping over $200, lifetime warranty.",
  keywords: [
    'lab grown diamonds',
    'engagement rings',
    'diamond jewelry',
    'sustainable jewelry',
    'IGI certified diamonds',
  ],
  authors: [{ name: 'Just Because Jewelry' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://justbecausejewelry.com',
    siteName: 'Just Because',
    title: 'Just Because - Lab-Grown Diamond Jewelry',
    description: "Lab-grown diamonds and recycled gold, crafted for the moments that don't ask for an occasion.",
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Just Because Jewelry',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Just Because - Lab-Grown Diamond Jewelry',
    description: "Lab-grown diamonds and recycled gold, crafted for the moments that don't ask for an occasion.",
    images: ['/images/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${jost.variable} ${italianno.variable} font-sans antialiased`}
        style={{ backgroundColor: '#FBF5F0', color: '#1A1014' }}
      >
        <DiamondCursor />
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <PageViewTracker />
              <ErrorBoundary>
                <AppShell>{children}</AppShell>
              </ErrorBoundary>
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  )
}

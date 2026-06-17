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
  title: 'Just Because - Lab-Grown Diamond Jewelry',
  description: "Lab-grown diamonds and 18k recycled gold, crafted for every moment that doesn't ask for an occasion.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Just Because - Lab-Grown Diamond Jewelry',
    description: "Lab-grown diamonds and 18k recycled gold, crafted for every moment that doesn't ask for an occasion.",
    url: 'https://justbecausejewelry.com',
    siteName: 'Just Because Jewelry',
    images: ['/apple-touch-icon.png'],
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
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

import type { Metadata } from 'next'
import { Playfair_Display, Inter, Italianno } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const italianno = Italianno({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-italianno',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Just Because - A reason, in itself.',
  description: 'Lab-grown diamonds for the moments that do not need an occasion.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${inter.variable} ${italianno.variable} font-body bg-verde-cream text-verde-ink antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
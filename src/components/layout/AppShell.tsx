'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import ChatButton from '@/components/ui/ChatButton'

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')
  const isCheckout = pathname.startsWith('/checkout')
  const isAuth = pathname === '/login' || pathname === '/signup'

  if (isAdmin || isAuth) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main>{children}</main>
      {!isCheckout && <Footer />}
      <ChatButton />
    </>
  )
}

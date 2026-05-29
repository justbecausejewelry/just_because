"use client"

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { checkIsAdmin } from '@/lib/adminAuth'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    checkIsAdmin().then(({ isAdmin }) => {
      if (!isAdmin) {
        router.replace('/')
      } else {
        setAllowed(true)
      }
      setChecking(false)
    })
  }, [pathname, router])

  if (checking) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FBF5F0',
        gap: '16px',
      }}>
        <div style={{
          fontFamily: 'var(--font-italianno)',
          fontSize: '48px',
          color: '#C9A961',
          lineHeight: 1,
        }}>
          just
        </div>
        <div style={{
          fontSize: '11px',
          letterSpacing: '0.3em',
          color: '#B8A090',
          fontFamily: 'var(--font-inter)',
        }}>
          VERIFYING ACCESS...
        </div>
        <div style={{
          width: '40px',
          height: '1px',
          background: '#EDD9AF',
          animation: 'loading 1.5s ease-in-out infinite',
        }} />
        <style>{`
          @keyframes loading {
            0%,100% { width: 40px; opacity: 0.4; }
            50% { width: 80px; opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  if (!allowed) return null

  return <>{children}</>
}

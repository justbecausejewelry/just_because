'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package } from 'lucide-react'
import { supabaseAuth } from '@/lib/auth'

export default function AccountOrdersPage() {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const check = async () => {
      const {
        data: { user },
      } = await supabaseAuth.auth.getUser()

      if (!user) {
        router.replace('/login?redirect=/account/orders')
        return
      }

      setIsReady(true)
    }

    void check()
  }, [router])

  if (!isReady) {
    return (
      <main style={{ minHeight: '100vh', background: '#FBF5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B8A090', fontFamily: 'var(--font-playfair)', fontSize: '20px' }}>
        Loading orders...
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FBF5F0', maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }}>
      <Link href="/account" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.08em' }}>{'<-'} Back to account</Link>
      <section style={{ marginTop: '32px', background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '56px 24px', textAlign: 'center' }}>
        <Package size={48} color="#C9A961" strokeWidth={1.2} style={{ margin: '0 auto 18px' }} />
        <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '32px', fontWeight: 400, margin: 0 }}>No orders yet</h1>
        <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '14px', margin: '10px 0 24px' }}>Your Just Because orders will appear here.</p>
        <Link href="/products" className="btn-primary">SHOP THE COLLECTION</Link>
      </section>
    </main>
  )
}

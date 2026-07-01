'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getSessionId } from '@/lib/cart'
import { getSettledBrowserSession, supabase } from '@/lib/supabase'

export function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const trackPageView = async () => {
      try {
        const session = await getSettledBrowserSession()
        const user = session?.user || null

        const { error } = await supabase.from('page_views').insert({
          user_id: user?.id || null,
          session_id: getSessionId(),
          page: pathname,
          referrer: typeof document !== 'undefined' ? document.referrer || null : null,
        })

        if (error) {
          console.error('Analytics error:', error)
        }
      } catch (error) {
        console.error('Analytics error:', error)
      }
    }

    void trackPageView()
  }, [pathname])

  return null
}

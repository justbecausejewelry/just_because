import { createClient } from '@supabase/supabase-js'
import { clearAdminCache } from '@/lib/adminAuth'

export async function forceSignOut() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    clearAdminCache()

    if (typeof window !== 'undefined') {
      window.localStorage.clear()
      window.sessionStorage.clear()

      document.cookie.split(';').forEach((cookie) => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`)
      })
    }

    await supabase.auth.signOut({ scope: 'global' })
  } catch (error) {
    console.error('Sign out error:', error)
  } finally {
    if (typeof window !== 'undefined') {
      window.location.replace('/login')
    }
  }
}

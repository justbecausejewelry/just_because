import { clearAdminCache } from '@/lib/adminAuth'
import { supabase } from '@/lib/supabase'

export async function forceSignOut() {
  try {
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

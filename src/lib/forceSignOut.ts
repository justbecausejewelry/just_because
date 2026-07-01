import { clearAdminCache } from '@/lib/adminAuth'
import { ACCOUNT_USER_STORAGE_KEY, SUPABASE_AUTH_STORAGE_KEY, supabase } from '@/lib/supabase'

const AUTH_SESSION_COOKIE = 'jb_auth_session_v1'
const ACCOUNT_USER_COOKIE = 'jb_account_user_v1'

function clearCookie(name: string, domain?: string) {
  document.cookie = [
    `${name}=`,
    'Path=/',
    'Max-Age=0',
    'SameSite=Lax',
    domain ? `Domain=${domain}` : '',
    window.location.protocol === 'https:' ? 'Secure' : '',
  ].filter(Boolean).join('; ')
}

function clearAuthStorage() {
  window.localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY)
  window.localStorage.removeItem(ACCOUNT_USER_STORAGE_KEY)

  Object.keys(window.localStorage)
    .filter((key) => key.includes('supabase.auth.token') || (key.startsWith('sb-') && key.includes('-auth-token')))
    .forEach((key) => window.localStorage.removeItem(key))
}

export async function forceSignOut() {
  try {
    clearAdminCache()

    if (typeof window !== 'undefined') {
      await fetch('/api/auth/session-cookie', { method: 'DELETE' }).catch(() => null)
      clearAuthStorage()
      window.sessionStorage.clear()
      clearCookie(AUTH_SESSION_COOKIE)
      clearCookie(ACCOUNT_USER_COOKIE)
      clearCookie(AUTH_SESSION_COOKIE, '.justbecausejewelry.com')
      clearCookie(ACCOUNT_USER_COOKIE, '.justbecausejewelry.com')

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

import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const SUPABASE_AUTH_STORAGE_KEY = 'sb-xayiwdexbykvbvcgudne-auth-token'
export const ACCOUNT_USER_STORAGE_KEY = 'jb_account_user_v1'

let supabaseInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
      storageKey: SUPABASE_AUTH_STORAGE_KEY,
    },
  })

  return supabaseInstance
}

export const getSupabase = getSupabaseClient

export const supabase = getSupabaseClient()

export default supabase

type StoredAccountUser = {
  expiresAt: number
  user: {
    id: string
    email: string
    user_metadata: User['user_metadata']
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function persistBrowserSession(session: Session) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(SUPABASE_AUTH_STORAGE_KEY, JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: session.token_type,
      user: session.user,
    }))

    window.localStorage.setItem(ACCOUNT_USER_STORAGE_KEY, JSON.stringify({
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      user: {
        id: session.user.id,
        email: session.user.email || '',
        user_metadata: session.user.user_metadata,
      },
    } satisfies StoredAccountUser))
  } catch {
    // Storage can be unavailable in private modes. Supabase still owns in-memory auth.
  }
}

export function getStoredAccountUser(): User | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(ACCOUNT_USER_STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null

    const expiresAt = parsed.expiresAt
    if (typeof expiresAt !== 'number' || expiresAt < Date.now()) {
      window.localStorage.removeItem(ACCOUNT_USER_STORAGE_KEY)
      return null
    }

    const user = parsed.user
    if (!isRecord(user) || typeof user.id !== 'string' || typeof user.email !== 'string') {
      return null
    }

    return user as unknown as User
  } catch {
    return null
  }
}

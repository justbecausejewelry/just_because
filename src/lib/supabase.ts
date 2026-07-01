import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const SUPABASE_AUTH_STORAGE_KEY = 'sb-xayiwdexbykvbvcgudne-auth-token'
export const ACCOUNT_USER_STORAGE_KEY = 'jb_account_user_v1'
const AUTH_SESSION_COOKIE = 'jb_auth_session_v1'
const ACCOUNT_USER_COOKIE = 'jb_account_user_v1'
const SESSION_SETTLE_DELAY_MS = 600

let supabaseInstance: SupabaseClient | null = null

function cookieDomain() {
  if (typeof window === 'undefined') return ''
  const hostname = window.location.hostname.toLowerCase()
  return hostname === 'justbecausejewelry.com' || hostname.endsWith('.justbecausejewelry.com')
    ? '; domain=.justbecausejewelry.com'
    : ''
}

function cookieSecureFlag() {
  if (typeof window === 'undefined') return ''
  return window.location.protocol === 'https:' ? '; Secure' : ''
}

function setBrowserCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return

  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
    'SameSite=Lax',
    cookieDomain(),
    cookieSecureFlag(),
  ].filter(Boolean).join('; ')
}

function getBrowserCookie(name: string) {
  if (typeof document === 'undefined') return null

  const prefix = `${name}=`
  const match = document.cookie
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix))

  if (!match) return null

  try {
    return decodeURIComponent(match.slice(prefix.length))
  } catch {
    return null
  }
}

function isLegacyAuthStorageKey(key: string) {
  return key !== SUPABASE_AUTH_STORAGE_KEY
    && (key.includes('supabase.auth.token') || (key.startsWith('sb-') && key.includes('-auth-token')))
}

function clearLegacyAuthStorage() {
  if (typeof window === 'undefined') return

  try {
    Object.keys(window.localStorage)
      .filter(isLegacyAuthStorageKey)
      .forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Some browsers can block storage enumeration.
  }
}

function bootstrapSessionFromCookie() {
  if (typeof window === 'undefined') return

  try {
    if (window.localStorage.getItem(SUPABASE_AUTH_STORAGE_KEY)) return

    const session = getBrowserCookie(AUTH_SESSION_COOKIE)
    if (!session) return

    window.localStorage.setItem(SUPABASE_AUTH_STORAGE_KEY, session)
  } catch {
    // Browser storage can be blocked; the in-memory client still initializes.
  }
}

export function getStoredBrowserSession(): Session | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(SUPABASE_AUTH_STORAGE_KEY) || getBrowserCookie(AUTH_SESSION_COOKIE)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null

    const accessToken = parsed.access_token
    const refreshToken = parsed.refresh_token
    const tokenType = parsed.token_type
    const user = parsed.user
    if (typeof accessToken !== 'string' || typeof refreshToken !== 'string' || !isRecord(user)) return null
    if (typeof user.id !== 'string' || !user.id) return null

    const expiresAt = parsed.expires_at
    if (typeof expiresAt === 'number' && expiresAt < Date.now() / 1000 - 60) {
      return null
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: typeof expiresAt === 'number' ? expiresAt : undefined,
      expires_in: typeof parsed.expires_in === 'number' ? parsed.expires_in : 3600,
      token_type: tokenType === 'bearer' ? tokenType : 'bearer',
      user: user as unknown as User,
    }
  } catch {
    return null
  }
}

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  bootstrapSessionFromCookie()

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
    clearLegacyAuthStorage()

    const storedSession = JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: session.token_type,
      user: session.user,
    })

    const storedAccountUser = JSON.stringify({
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      user: {
        id: session.user.id,
        email: session.user.email || '',
        user_metadata: session.user.user_metadata,
      },
    } satisfies StoredAccountUser)

    window.localStorage.setItem(SUPABASE_AUTH_STORAGE_KEY, storedSession)
    window.localStorage.setItem(ACCOUNT_USER_STORAGE_KEY, storedAccountUser)
    setBrowserCookie(AUTH_SESSION_COOKIE, storedSession, 30 * 24 * 60 * 60)
    setBrowserCookie(ACCOUNT_USER_COOKIE, storedAccountUser, 30 * 24 * 60 * 60)
  } catch {
    // Storage can be unavailable in private modes. Supabase still owns in-memory auth.
  }
}

export async function getSettledBrowserSession(waitMs = SESSION_SETTLE_DELAY_MS): Promise<Session | null> {
  const client = getSupabaseClient()

  const readSession = async () => {
    const {
      data: { session },
    } = await client.auth.getSession()
    return session
  }

  try {
    const immediateSession = await readSession()
    if (immediateSession?.user) {
      persistBrowserSession(immediateSession)
      return immediateSession
    }

    const storedSession = getStoredBrowserSession()
    if (storedSession?.access_token && storedSession.refresh_token) {
      const { data } = await client.auth.setSession({
        access_token: storedSession.access_token,
        refresh_token: storedSession.refresh_token,
      })

      if (data.session?.user) {
        persistBrowserSession(data.session)
        return data.session
      }
    }

    await new Promise((resolve) => globalThis.setTimeout(resolve, waitMs))

    const settledSession = await readSession()
    if (settledSession?.user) {
      persistBrowserSession(settledSession)
      return settledSession
    }

    return getStoredBrowserSession()
  } catch (error) {
    console.error('[auth] settled session check failed:', error)
    return getStoredBrowserSession()
  }
}

export function getStoredAccountUser(): User | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(ACCOUNT_USER_STORAGE_KEY) || getBrowserCookie(ACCOUNT_USER_COOKIE)
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

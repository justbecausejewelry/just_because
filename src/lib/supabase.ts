import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const SUPABASE_AUTH_STORAGE_KEY = 'sb-xayiwdexbykvbvcgudne-auth-token'
export const ACCOUNT_USER_STORAGE_KEY = 'jb_account_user_v1'
const AUTH_SESSION_COOKIE = 'jb_auth_session_v1'
const ACCOUNT_USER_COOKIE = 'jb_account_user_v1'
const SESSION_SETTLE_DELAY_MS = 600
const REFRESH_BACKOFF_MS = 60 * 1000
const TOKEN_EXPIRY_BUFFER_SECONDS = 90

let supabaseInstance: SupabaseClient | null = null
let settledSessionPromise: Promise<Session | null> | null = null
let refreshBackoffUntil = 0

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

export function clearBrowserAuthState(clearAccountUser = false) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY)
    if (clearAccountUser) {
      window.localStorage.removeItem(ACCOUNT_USER_STORAGE_KEY)
    }

    Object.keys(window.localStorage)
      .filter(isLegacyAuthStorageKey)
      .forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Some browsers can block storage mutation.
  }

  setBrowserCookie(AUTH_SESSION_COOKIE, '', 0)
  if (clearAccountUser) {
    setBrowserCookie(ACCOUNT_USER_COOKIE, '', 0)
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

    const candidate = isRecord(parsed.currentSession)
      ? parsed.currentSession
      : isRecord(parsed.session)
        ? parsed.session
        : parsed

    const accessToken = candidate.access_token
    const refreshToken = candidate.refresh_token
    const tokenType = candidate.token_type
    const user = candidate.user
    if (typeof accessToken !== 'string' || typeof refreshToken !== 'string' || !isRecord(user)) return null
    if (typeof user.id !== 'string' || !user.id) return null

    const expiresAt = candidate.expires_at
    if (typeof expiresAt === 'number' && expiresAt < Date.now() / 1000 - 60) {
      return null
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: typeof expiresAt === 'number' ? expiresAt : undefined,
      expires_in: typeof candidate.expires_in === 'number' ? candidate.expires_in : 3600,
      token_type: tokenType === 'bearer' ? tokenType : 'bearer',
      user: user as unknown as User,
    }
  } catch {
    return null
  }
}

function isSessionFresh(session: Session | null) {
  if (!session?.access_token || !session.refresh_token || !session.user) return false
  if (typeof session.expires_at !== 'number') return true
  return session.expires_at > Date.now() / 1000 + TOKEN_EXPIRY_BUFFER_SECONDS
}

function shouldBackOff(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const status = 'status' in error ? (error as { status?: unknown }).status : undefined
  if (status === 429) return true

  const message = 'message' in error ? (error as { message?: unknown }).message : undefined
  return typeof message === 'string' && message.toLowerCase().includes('too many')
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
    refreshBackoffUntil = 0
  } catch {
    // Storage can be unavailable in private modes. Supabase still owns in-memory auth.
  }
}

export async function getSettledBrowserSession(waitMs = SESSION_SETTLE_DELAY_MS): Promise<Session | null> {
  if (settledSessionPromise) return settledSessionPromise

  settledSessionPromise = settleBrowserSession(waitMs).finally(() => {
    settledSessionPromise = null
  })

  return settledSessionPromise
}

async function settleBrowserSession(waitMs: number): Promise<Session | null> {
  const client = getSupabaseClient()

  const readSession = async () => {
    const {
      data: { session },
    } = await client.auth.getSession()
    return session
  }

  try {
    const storedSession = getStoredBrowserSession()
    if (isSessionFresh(storedSession)) {
      return storedSession
    }

    if (Date.now() < refreshBackoffUntil) {
      return storedSession
    }

    const immediateSession = await readSession()
    if (immediateSession?.user) {
      persistBrowserSession(immediateSession)
      return immediateSession
    }

    await new Promise((resolve) => globalThis.setTimeout(resolve, waitMs))

    const settledSession = await readSession()
    if (settledSession?.user) {
      persistBrowserSession(settledSession)
      return settledSession
    }

    return storedSession
  } catch (error) {
    console.error('[auth] settled session check failed:', error)
    if (shouldBackOff(error)) {
      refreshBackoffUntil = Date.now() + REFRESH_BACKOFF_MS
    }
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

import { SUPABASE_AUTH_STORAGE_KEY, supabase } from '@/lib/supabase'

function readAccessTokenFromStorageValue(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  if (typeof record.access_token === 'string' && record.access_token) {
    return record.access_token
  }

  const nestedSession = record.session
  if (nestedSession && typeof nestedSession === 'object') {
    const nested = nestedSession as Record<string, unknown>
    if (typeof nested.access_token === 'string' && nested.access_token) {
      return nested.access_token
    }
  }

  const currentSession = record.currentSession
  if (currentSession && typeof currentSession === 'object') {
    const nested = currentSession as Record<string, unknown>
    if (typeof nested.access_token === 'string' && nested.access_token) {
      return nested.access_token
    }
  }

  return null
}

function getStorageKeys() {
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.replace('https://', '')
    ?.split('.')[0]

  return Array.from(new Set([
    SUPABASE_AUTH_STORAGE_KEY,
    projectRef ? `sb-${projectRef}-auth-token` : null,
  ].filter((key): key is string => Boolean(key))))
}

function getTokenFromLocalStorage(): string | null {
  if (typeof window === 'undefined') return null

  for (const key of getStorageKeys()) {
    const raw = window.localStorage.getItem(key)
    if (!raw) continue

    try {
      const parsed: unknown = JSON.parse(raw)
      const token = readAccessTokenFromStorageValue(parsed)
      if (token) return token
    } catch {
      // Ignore malformed storage and keep checking other known keys.
    }
  }

  return null
}

export async function getAdminAccessToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
      return session.access_token
    }

    const {
      data: { session: refreshed },
    } = await supabase.auth.refreshSession()
    if (refreshed?.access_token) {
      return refreshed.access_token
    }

    const storedToken = getTokenFromLocalStorage()
    if (storedToken) {
      return storedToken
    }

    console.error('[adminFetch] No token found anywhere')
    return null
  } catch (err) {
    console.error('[adminFetch] Error getting token:', err)
    return null
  }
}

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAdminAccessToken()

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Session expired. Please sign in again.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  if (!headers.has('Content-Type') && !isFormData) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

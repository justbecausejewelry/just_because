import { supabase } from './supabase'

const STORAGE_KEY = 'sb-xayiwdexbykvbvcgudne-auth-token'

export async function getAdminAccessToken(): Promise<string | null> {
  // Step 1: Read directly from localStorage first.
  // Token is already there, so no refresh is needed.
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        const token = parsed?.access_token
        if (token) {
          const expiresAt = parsed?.expires_at
          const now = Math.floor(Date.now() / 1000)
          if (!expiresAt || expiresAt > now + 60) {
            return token
          }
        }
      }
    } catch {
      // localStorage read failed. Continue to fallback.
    }
  }

  // Step 2: Only call getSession if localStorage was empty.
  // Do not manually refresh here; repeated refresh attempts cause 429s.
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
      return session.access_token
    }
  } catch {
    // getSession failed.
  }

  console.error('[adminFetch] No valid token found')
  return null
}

export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAdminAccessToken()

  if (!token) {
    return new Response(
      JSON.stringify({
        error: 'Session expired. Please sign in again.',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)

  if (
    !headers.has('Content-Type') &&
    !(options.body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, { ...options, headers })

  if (response.status === 401) {
    console.error('[adminFetch] 401 on:', url)
  }

  return response
}

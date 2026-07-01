import { supabase } from './supabase'

const STORAGE_KEY = 'sb-xayiwdexbykvbvcgudne-auth-token'

export async function getAdminAccessToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
      return session.access_token
    }
  } catch (err) {
    console.error('[adminSession] getSession failed:', err)
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (
          parsed &&
          typeof parsed === 'object' &&
          'access_token' in parsed &&
          typeof parsed.access_token === 'string'
        ) {
          return parsed.access_token
        }
      }
    } catch (err) {
      console.error('[adminSession] localStorage read failed:', err)
    }
  }

  console.error('[adminFetch] No token found anywhere')
  return null
}

export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
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
  if (
    !headers.has('Content-Type') &&
    !isFormData
  ) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, { ...options, headers })
}

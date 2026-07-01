import { supabase } from '@/lib/supabase'

let tokenPromise: Promise<string | null> | null = null

export async function getAdminAccessToken(): Promise<string | null> {
  if (tokenPromise) return tokenPromise

  tokenPromise = (async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.access_token) return session.access_token

      const {
        data: { session: refreshed },
      } = await supabase.auth.refreshSession()
      if (refreshed?.access_token) return refreshed.access_token

      return null
    } catch (error) {
      console.error('[adminSession] unable to get admin access token:', error)
      return null
    } finally {
      tokenPromise = null
    }
  })()

  return tokenPromise
}

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAdminAccessToken()

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'No session found. Please sign in.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  if (options.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

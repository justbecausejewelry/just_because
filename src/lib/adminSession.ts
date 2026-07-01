import { getSettledBrowserSession, getStoredBrowserSession, persistBrowserSession, supabase } from '@/lib/supabase'

export async function getAdminAccessToken(): Promise<string | null> {
  const settledSession = await getSettledBrowserSession(1000)
  if (settledSession?.access_token) return settledSession.access_token

  const storedSession = getStoredBrowserSession()
  if (storedSession?.access_token) return storedSession.access_token

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session?.access_token) {
    persistBrowserSession(session)
    return session.access_token
  }

  return null
}

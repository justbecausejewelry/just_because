import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CACHE_KEY = 'jb_admin_check'
const CACHE_TTL = 5 * 60 * 1000
const CHECK_TIMEOUT = 3000

export interface AdminRecord {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

type AdminCheckResult = {
  isAdmin: boolean
  role: string | null
  adminData: AdminRecord | null
}

function cacheKeyFor(email: string) {
  return `${CACHE_KEY}_${email.toLowerCase()}`
}

export async function checkIsAdmin(): Promise<{
  isAdmin: boolean
  role: string | null
  adminData: AdminRecord | null
}> {
  try {
    const { data: { user }, error: authError } =
      await supabase.auth.getUser()

    if (authError || !user?.email) {
      return { isAdmin: false, role: null, adminData: null }
    }

    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(cacheKeyFor(user.email))
      if (cached) {
        const parsed = JSON.parse(cached) as AdminCheckResult & { timestamp: number }
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          return {
            isAdmin: parsed.isAdmin,
            role: parsed.role,
            adminData: parsed.adminData,
          }
        }
      }
    }

    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      return { isAdmin: false, role: null, adminData: null }
    }

    const controller = new AbortController()
    const timeout = globalThis.setTimeout(() => controller.abort(), CHECK_TIMEOUT)

    const response = await fetch('/api/admin/check-access', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      signal: controller.signal,
    }).finally(() => globalThis.clearTimeout(timeout))

    if (!response.ok) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          cacheKeyFor(user.email),
          JSON.stringify({ isAdmin: false, role: null, adminData: null, timestamp: Date.now() })
        )
      }
      return { isAdmin: false, role: null, adminData: null }
    }

    const result = await response.json() as AdminCheckResult

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        cacheKeyFor(user.email),
        JSON.stringify({ ...result, timestamp: Date.now() })
      )
    }

    return result
  } catch (err) {
    console.error('Admin check failed:', err)
    return { isAdmin: false, role: null, adminData: null }
  }
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { isAdmin } = await checkIsAdmin()
  return isAdmin
}

export function clearAdminCache() {
  if (typeof window !== 'undefined') {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(CACHE_KEY))
      .forEach((key) => sessionStorage.removeItem(key))
  }
}

export const isAdminEmail = async (
  email: string | null | undefined
): Promise<boolean> => {
  if (!email) return false

  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email?.toLowerCase() !== email.toLowerCase()) {
    return false
  }

  const { isAdmin } = await checkIsAdmin()
  return isAdmin
}

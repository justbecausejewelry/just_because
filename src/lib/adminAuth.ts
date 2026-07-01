import { getSettledBrowserSession, supabase } from '@/lib/supabase'
import { adminFetch } from '@/lib/adminSession'

const CACHE_KEY = 'jb_admin'
const CACHE_TTL = 30 * 60 * 1000
const CHECK_TIMEOUT = 4000

export interface AdminRecord {
  id?: string
  email: string
  name?: string | null
  role: string | null
  createdAt?: string | null
}

type AdminCheckResult = {
  isAdmin: boolean
  role: string | null
  adminData: AdminRecord | null
}

type AdminCache = AdminCheckResult & {
  email: string
  ts: number
}

type AdminRow = {
  id?: string
  email?: string | null
  name?: string | null
  role?: string | null
  createdAt?: string | null
}

const emptyAdminResult: AdminCheckResult = {
  isAdmin: false,
  role: null,
  adminData: null,
}

function cacheKeyFor(email: string) {
  return `${CACHE_KEY}_${email.toLowerCase()}`
}

function getCache(email: string): AdminCheckResult | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(cacheKeyFor(email))
    if (!raw) return null

    const cached = JSON.parse(raw) as Partial<AdminCache>
    if (!cached.ts || Date.now() - cached.ts > CACHE_TTL) {
      sessionStorage.removeItem(cacheKeyFor(email))
      return null
    }

    if (cached.email?.toLowerCase() !== email.toLowerCase()) {
      return null
    }

    return {
      isAdmin: Boolean(cached.isAdmin),
      role: cached.role ?? null,
      adminData: cached.adminData ?? null,
    }
  } catch {
    return null
  }
}

function setCache(email: string, result: AdminCheckResult) {
  if (typeof window === 'undefined') return

  try {
    const cache: AdminCache = {
      ...result,
      email: email.toLowerCase(),
      ts: Date.now(),
    }
    sessionStorage.setItem(cacheKeyFor(email), JSON.stringify(cache))
  } catch {
    // Session storage can be unavailable in private modes; the DB result is still valid.
  }
}

function mapAdminRow(row: AdminRow, email: string): AdminCheckResult {
  const role = row.role ?? null

  return {
    isAdmin: true,
    role,
    adminData: {
      id: row.id,
      email: row.email?.toLowerCase() || email,
      name: row.name ?? null,
      role,
      createdAt: row.createdAt ?? null,
    },
  }
}

async function queryAdminUser(email: string): Promise<AdminCheckResult> {
  const { data, error } = await supabase
    .from('AdminUser')
    .select('id,email,name,role,createdAt')
    .eq('email', email)
    .maybeSingle()

  if (error || !data) {
    return emptyAdminResult
  }

  return mapAdminRow(data as AdminRow, email)
}

function timeoutResult(): Promise<AdminCheckResult> {
  return new Promise((resolve) => {
    globalThis.setTimeout(() => resolve(emptyAdminResult), CHECK_TIMEOUT)
  })
}

export async function checkIsAdmin(): Promise<AdminCheckResult> {
  try {
    const session = await getSettledBrowserSession()
    const email = session?.user?.email?.toLowerCase() || null

    if (email) {
      const cached = getCache(email)
      if (cached) {
        return cached
      }
    }

    const result = await Promise.race([
      adminFetch('/api/admin/check-access')
        .then(async (response) => {
          const payload = await response.json().catch(() => null) as Partial<AdminCheckResult> | null
          if (!response.ok || !payload?.isAdmin || !payload.adminData) return emptyAdminResult
          return {
            isAdmin: true,
            role: payload.role ?? payload.adminData.role ?? null,
            adminData: payload.adminData,
          }
        })
        .catch(() => emptyAdminResult),
      timeoutResult(),
    ])
    const cacheEmail = result.adminData?.email || email
    if (cacheEmail) {
      setCache(cacheEmail, result)
    }
    return result
  } catch {
    return emptyAdminResult
  }
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { isAdmin } = await checkIsAdmin()
  return isAdmin
}

export function clearAdminCache() {
  if (typeof window !== 'undefined') {
    try {
      Object.keys(sessionStorage)
        .filter((key) => key.startsWith(CACHE_KEY))
        .forEach((key) => sessionStorage.removeItem(key))
      Object.keys(localStorage)
        .filter((key) => key.startsWith(CACHE_KEY))
        .forEach((key) => localStorage.removeItem(key))
    } catch {
      // Storage can be unavailable in private modes.
    }
  }
}

export const isAdminEmail = async (
  email: string | null | undefined
): Promise<boolean> => {
  if (!email) return false

  const session = await getSettledBrowserSession()
  const user = session?.user || null

  if (user?.email?.toLowerCase() !== email.toLowerCase()) {
    return false
  }

  const { isAdmin } = await checkIsAdmin()
  return isAdmin
}

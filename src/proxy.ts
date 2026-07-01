import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type SupabaseEnv = {
  supabaseUrl: string
  anonKey: string
  serviceRoleKey?: string
}

type AdminUserRow = {
  role?: string | null
}

type AdminCheck = {
  isAdmin: boolean
  role: string | null
}

type StoredAuthSession = {
  access_token?: unknown
  expires_at?: unknown
}

type SupabaseUserResponse = {
  email?: string | null
}

const AUTH_SESSION_COOKIE = 'jb_auth_session_v1'

function getSupabaseEnv(): SupabaseEnv | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey) return null

  return {
    supabaseUrl,
    anonKey,
    serviceRoleKey: serviceRoleKey || undefined,
  }
}

function redirectToLogin(request: NextRequest) {
  const redirectUrl = new URL('/login', request.url)
  redirectUrl.searchParams.set('redirect', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(redirectUrl)
}

function wait(ms: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms))
}

function parseStoredSessionCookie(request: NextRequest): string | null {
  const rawCookie = request.cookies.get(AUTH_SESSION_COOKIE)?.value
  if (!rawCookie) return null

  try {
    const decoded = decodeURIComponent(rawCookie)
    const parsed = JSON.parse(decoded) as StoredAuthSession

    if (typeof parsed.expires_at === 'number' && parsed.expires_at < Date.now() / 1000 - 60) {
      return null
    }

    return typeof parsed.access_token === 'string' && parsed.access_token
      ? parsed.access_token
      : null
  } catch (error) {
    console.error('[proxy] stored auth cookie parse failed:', error)
    return null
  }
}

async function getUserEmailFromAccessToken(token: string, env: SupabaseEnv): Promise<string | null> {
  const response = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: env.anonKey,
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    console.error('[proxy] stored auth token validation failed:', response.status)
    return null
  }

  const user = (await response.json()) as SupabaseUserResponse
  return typeof user.email === 'string' && user.email ? user.email : null
}

async function checkAdminUser(email: string, env: SupabaseEnv): Promise<AdminCheck> {
  if (!env.serviceRoleKey) {
    console.error('[proxy] SUPABASE_SERVICE_ROLE_KEY missing during admin check')
    return { isAdmin: false, role: null }
  }

  const response = await fetch(
    `${env.supabaseUrl}/rest/v1/AdminUser?select=role&email=eq.${encodeURIComponent(email.toLowerCase())}&limit=1`,
    {
      headers: {
        apikey: env.serviceRoleKey,
        Authorization: `Bearer ${env.serviceRoleKey}`,
      },
    }
  )

  if (!response.ok) {
    console.error('[proxy] admin role check failed:', response.status)
    return { isAdmin: false, role: null }
  }

  const rows = (await response.json()) as AdminUserRow[]
  const role = rows[0]?.role
  return {
    isAdmin: role === 'admin' || role === 'super_admin',
    role: role || null,
  }
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') || ''

  if (host.startsWith('www.')) {
    const url = request.nextUrl.clone()
    url.host = host.replace('www.', '')
    return NextResponse.redirect(url, { status: 301 })
  }

  const pathname = request.nextUrl.pathname

  if (pathname === '/auth/callback' || pathname.startsWith('/auth/callback/')) {
    return NextResponse.next()
  }

  const adminPath = pathname === '/admin' || pathname.startsWith('/admin/')
  const checkoutPath = pathname === '/checkout'

  if (!adminPath && !checkoutPath) {
    return NextResponse.next()
  }

  console.log('[proxy] checking path:', pathname)

  const env = getSupabaseEnv()
  if (!env) {
    console.error('[proxy] Supabase auth environment is not configured')
    return new NextResponse('Authentication environment is not configured', { status: 500 })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(env.supabaseUrl, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  let {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (!user?.email) {
    await wait(600)
    const retry = await supabase.auth.getUser()
    user = retry.data.user
    error = retry.error
  }

  if (error) {
    console.error('[proxy] getUser failed:', error.message)
  }

  let userEmail = user?.email || null
  if (!userEmail) {
    const storedAccessToken = parseStoredSessionCookie(request)
    if (storedAccessToken) {
      userEmail = await getUserEmailFromAccessToken(storedAccessToken, env)
    }
  }

  if (!userEmail) {
    console.log('[proxy] no active session for path:', pathname)
    return redirectToLogin(request)
  }

  console.log('[proxy] session user:', userEmail)

  if (adminPath) {
    const adminCheck = await checkAdminUser(userEmail, env)
    console.log('[proxy] admin role check:', adminCheck.role || 'none')

    if (!adminCheck.isAdmin) {
      return new NextResponse('Admin access required', { status: 403 })
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}

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

  if (!user?.email) {
    console.log('[proxy] no active session for path:', pathname)
    return redirectToLogin(request)
  }

  console.log('[proxy] session user:', user.email)

  if (adminPath) {
    const adminCheck = await checkAdminUser(user.email, env)
    console.log('[proxy] admin role check:', adminCheck.role || 'none')

    if (!adminCheck.isAdmin) {
      return new NextResponse('Admin access required', { status: 403 })
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/checkout', '/admin/:path*'],
}

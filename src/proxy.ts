import { NextRequest, NextResponse } from 'next/server'

type SupabaseEnv = {
  supabaseUrl: string
  anonKey: string
  serviceRoleKey: string
  authCookieName: string
}

type SupabaseUser = {
  id?: string
  email?: string | null
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

  if (!supabaseUrl || !anonKey || !serviceRoleKey) return null

  const projectRef = (() => {
    try {
      return new URL(supabaseUrl).hostname.split('.')[0]
    } catch {
      return 'xayiwdexbykvbvcgudne'
    }
  })()

  return {
    supabaseUrl,
    anonKey,
    serviceRoleKey,
    authCookieName: `sb-${projectRef}-auth-token`,
  }
}

function decodeCookieValue(rawValue: string) {
  let value = rawValue

  try {
    value = decodeURIComponent(value)
  } catch {
    // Leave the original cookie value intact if it is not URI encoded.
  }

  if (value.startsWith('base64-')) {
    try {
      return atob(value.slice('base64-'.length))
    } catch {
      return value
    }
  }

  return value
}

function readAccessTokenFromObject(value: Record<string, unknown>) {
  if (typeof value.access_token === 'string') return value.access_token

  const currentSession = value.currentSession
  if (currentSession && typeof currentSession === 'object') {
    const record = currentSession as Record<string, unknown>
    if (typeof record.access_token === 'string') return record.access_token
  }

  const session = value.session
  if (session && typeof session === 'object') {
    const record = session as Record<string, unknown>
    if (typeof record.access_token === 'string') return record.access_token
  }

  return null
}

function readAccessTokenFromCookieValue(rawValue: string) {
  const decoded = decodeCookieValue(rawValue)

  try {
    const parsed = JSON.parse(decoded) as unknown

    if (Array.isArray(parsed)) {
      return typeof parsed[0] === 'string' ? parsed[0] : null
    }

    if (parsed && typeof parsed === 'object') {
      return readAccessTokenFromObject(parsed as Record<string, unknown>)
    }
  } catch {
    if (decoded.split('.').length === 3) return decoded
  }

  return null
}

function readAuthCookie(request: NextRequest, cookieName: string) {
  const direct = request.cookies.get(cookieName)?.value
  if (direct) return direct

  const chunks = request.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith(`${cookieName}.`))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }))

  if (!chunks.length) return null
  return chunks.map((chunk) => chunk.value).join('')
}

function getRequestToken(request: NextRequest, cookieName: string) {
  const authorization = request.headers.get('authorization')
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim() || null
  }

  const authCookie = readAuthCookie(request, cookieName)
  return authCookie ? readAccessTokenFromCookieValue(authCookie) : null
}

function redirectToLogin(request: NextRequest) {
  const redirectUrl = new URL('/login', request.url)
  redirectUrl.searchParams.set('redirect', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(redirectUrl)
}

async function getUser(token: string, env: SupabaseEnv) {
  const response = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: env.anonKey,
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) return null
  return (await response.json()) as SupabaseUser
}

async function checkAdminUser(email: string, env: SupabaseEnv): Promise<AdminCheck> {
  const response = await fetch(
    `${env.supabaseUrl}/rest/v1/AdminUser?select=role&email=eq.${encodeURIComponent(email.toLowerCase())}&limit=1`,
    {
      headers: {
        apikey: env.serviceRoleKey,
        Authorization: `Bearer ${env.serviceRoleKey}`,
      },
    }
  )

  if (!response.ok) return { isAdmin: false, role: null }

  const rows = (await response.json()) as AdminUserRow[]
  const role = rows[0]?.role
  return {
    isAdmin: role === 'admin' || role === 'super_admin',
    role: role || null,
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const adminPath = pathname === '/admin' || pathname.startsWith('/admin/')
  const accountPath = pathname === '/account' || pathname.startsWith('/account/')
  const checkoutPath = pathname === '/checkout'

  if (adminPath) {
    console.log('[proxy] path:', pathname)
  }

  if (!adminPath && !accountPath && !checkoutPath) {
    return NextResponse.next()
  }

  const env = getSupabaseEnv()
  if (!env) {
    return new NextResponse('Authentication environment is not configured', { status: 500 })
  }

  const token = getRequestToken(request, env.authCookieName)
  if (!token) {
    return redirectToLogin(request)
  }

  const user = await getUser(token, env)
  if (!user?.email) {
    return redirectToLogin(request)
  }

  if (adminPath) {
    const adminCheck = await checkAdminUser(user.email, env)
    console.log('[proxy] user:', user.email)
    console.log('[proxy] role check result:', adminCheck.role)

    if (!adminCheck.isAdmin) {
      return new NextResponse('Admin access required', { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*', '/checkout', '/admin/:path*'],
}

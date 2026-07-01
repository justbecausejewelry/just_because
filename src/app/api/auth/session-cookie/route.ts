import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthErrorMessage, getGeneralErrorMessage } from '@/lib/errors'

type SessionCookieBody = {
  accessToken?: unknown
  refreshToken?: unknown
}

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) return null

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
    authCookieName: `sb-${projectRef}-auth-token`,
  }
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return null
  return authorization.slice('Bearer '.length).trim() || null
}

async function readSessionBody(request: NextRequest): Promise<SessionCookieBody> {
  try {
    return (await request.json()) as SessionCookieBody
  } catch {
    return {}
  }
}

function createCookieResponse(request: NextRequest, supabaseUrl: string, anonKey: string) {
  let response = NextResponse.json({ ok: true })

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        response = NextResponse.json({ ok: true })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  return { response: () => response, supabase }
}

export async function POST(request: NextRequest) {
  const env = getSupabaseEnv()
  if (!env) {
    return NextResponse.json({ error: getGeneralErrorMessage() }, { status: 500 })
  }

  const body = await readSessionBody(request)
  const accessToken = typeof body.accessToken === 'string' ? body.accessToken : getBearerToken(request)
  const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : null

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 })
  }

  const { response, supabase } = createCookieResponse(request, env.supabaseUrl, env.anonKey)

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (error || !data.user?.email) {
    console.error('[session-cookie] setSession failed:', error?.message || 'No authenticated user')
    return NextResponse.json({ error: getAuthErrorMessage(error) }, { status: 401 })
  }

  console.log('[session-cookie] session cookie set for:', data.user.email)
  return response()
}

export async function DELETE(request: NextRequest) {
  const env = getSupabaseEnv()
  if (!env) {
    return NextResponse.json({ ok: true })
  }

  const response = NextResponse.json({ ok: true })
  const cookiesToClear = request.cookies
    .getAll()
    .filter((cookie) => cookie.name === env.authCookieName || cookie.name.startsWith(`${env.authCookieName}.`))

  cookiesToClear.forEach((cookie) => {
    response.cookies.set({
      name: cookie.name,
      value: '',
      path: '/',
      maxAge: 0,
    })
  })

  return response
}

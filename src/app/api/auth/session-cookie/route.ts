import { NextRequest, NextResponse } from 'next/server'

type SupabaseUserResponse = {
  id?: string
  email?: string | null
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

async function getUser(token: string, supabaseUrl: string, anonKey: string) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) return null
  return (await response.json()) as SupabaseUserResponse
}

export async function POST(request: NextRequest) {
  const env = getSupabaseEnv()
  if (!env) {
    return NextResponse.json({ error: 'Supabase environment is not configured' }, { status: 500 })
  }

  const token = getBearerToken(request)
  if (!token) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
  }

  const user = await getUser(token, env.supabaseUrl, env.anonKey)
  if (!user?.email) {
    return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: env.authCookieName,
    value: JSON.stringify({ access_token: token }),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}

export async function DELETE() {
  const env = getSupabaseEnv()
  if (!env) {
    return NextResponse.json({ ok: true })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: env.authCookieName,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}

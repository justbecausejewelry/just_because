import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/server/adminAuth'
import { getGeneralErrorMessage } from '@/lib/errors'

type AuthResult =
  | { user: User; admin: SupabaseClient }
  | { error: NextResponse }

type AdminResult =
  | { user: User; admin: SupabaseClient; role: 'admin' | 'super_admin' }
  | { error: NextResponse }

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) return null
  return { supabaseUrl, supabaseAnonKey, serviceRoleKey }
}

export function getBearerToken(request: NextRequest | Request) {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length).trim() || null
}

export function createServiceRoleClient() {
  const env = getSupabaseEnv()
  if (!env) return null

  // Service-role clients bypass RLS. Use only after this module validates auth,
  // ownership, or admin role for the current request.
  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function requireUser(request: NextRequest | Request): Promise<AuthResult> {
  const env = getSupabaseEnv()
  if (!env) {
    return { error: NextResponse.json({ error: getGeneralErrorMessage() }, { status: 500 }) }
  }

  const token = getBearerToken(request)
  if (!token) {
    return { error: NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 }) }
  }

  const auth = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data, error } = await auth.auth.getUser(token)
  if (error || !data.user) {
    return { error: NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 }) }
  }

  const admin = createServiceRoleClient()
  if (!admin) {
    return { error: NextResponse.json({ error: getGeneralErrorMessage() }, { status: 500 }) }
  }

  return { user: data.user, admin }
}

export async function requireAdmin(request: NextRequest | Request): Promise<AdminResult> {
  const auth = await verifyAdminRequest(request)

  if (auth.error || !auth.user || !auth.admin) {
    const status = auth.status === 403 ? 403 : auth.status === 500 ? 500 : 401
    const message = status === 403 ? 'Admin access required' : status === 401 ? 'Please sign in to continue.' : getGeneralErrorMessage()
    return { error: NextResponse.json({ error: message }, { status }) }
  }

  return { user: auth.user, admin: auth.admin, role: auth.user.role }
}

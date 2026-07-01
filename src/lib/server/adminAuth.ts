import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

type AdminRole = 'admin' | 'super_admin'

type AdminUserRow = {
  id?: string
  email?: string | null
  name?: string | null
  role?: string | null
  createdAt?: string | null
}

export type VerifiedAdminUser = User & {
  role: AdminRole
}

export type VerifyAdminRequestResult =
  | {
      admin: SupabaseClient
      adminData: AdminUserRow
      error: null
      status: 200
      user: VerifiedAdminUser
    }
  | {
      admin: null
      adminData: null
      error: string
      status: 401 | 403 | 500
      user: null
    }

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return null
  return { supabaseUrl, serviceRoleKey }
}

function createAdminClient() {
  const env = getSupabaseEnv()
  if (!env) return null

  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function getBearerToken(request: NextRequest | Request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authHeader) {
    console.log('[adminAuth] No authorization header found')
    console.log('[adminAuth] Headers received:', Object.fromEntries(request.headers.entries()))
    return null
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    console.log('[adminAuth] Empty authorization token')
    return null
  }

  return token
}

export async function verifyAdminRequest(request: NextRequest | Request): Promise<VerifyAdminRequestResult> {
  try {
    const admin = createAdminClient()
    if (!admin) {
      return {
        admin: null,
        adminData: null,
        error: 'Supabase admin environment is not configured',
        status: 500,
        user: null,
      }
    }

    const token = getBearerToken(request)
    if (!token) {
      return {
        admin: null,
        adminData: null,
        error: 'No authorization header',
        status: 401,
        user: null,
      }
    }

    const {
      data: { user },
      error,
    } = await admin.auth.getUser(token)

    if (error) {
      console.log('[adminAuth] getUser error:', error.message)
      return {
        admin: null,
        adminData: null,
        error: error.message,
        status: 401,
        user: null,
      }
    }

    if (!user?.email) {
      console.log('[adminAuth] No user found')
      return {
        admin: null,
        adminData: null,
        error: 'No user found',
        status: 401,
        user: null,
      }
    }

    const { data: adminUser, error: adminError } = await admin
      .from('AdminUser')
      .select('id,email,name,role,createdAt')
      .eq('email', user.email.toLowerCase())
      .single()

    const role = typeof adminUser?.role === 'string' ? adminUser.role : null
    if (adminError || (role !== 'admin' && role !== 'super_admin')) {
      console.log('[adminAuth] AdminUser lookup failed:', adminError?.message || 'Not an admin')
      return {
        admin: null,
        adminData: null,
        error: 'Not authorized as admin',
        status: 403,
        user: null,
      }
    }

    return {
      admin,
      adminData: adminUser as AdminUserRow,
      error: null,
      status: 200,
      user: { ...user, role },
    }
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Auth check failed'
    return {
      admin: null,
      adminData: null,
      error: message,
      status: 500,
      user: null,
    }
  }
}

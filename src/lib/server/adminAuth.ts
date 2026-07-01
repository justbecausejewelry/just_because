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
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice('Bearer '.length).trim()
  return token || null
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
        error: 'No authorization token provided',
        status: 401,
        user: null,
      }
    }

    const {
      data: { user },
      error,
    } = await admin.auth.getUser(token)

    if (error || !user?.email) {
      return {
        admin: null,
        adminData: null,
        error: 'Invalid or expired token',
        status: 401,
        user: null,
      }
    }

    const { data: adminUser, error: adminError } = await admin
      .from('AdminUser')
      .select('id,email,name,role,createdAt')
      .eq('email', user.email.toLowerCase())
      .maybeSingle()

    const role = typeof adminUser?.role === 'string' ? adminUser.role : null
    if (adminError || (role !== 'admin' && role !== 'super_admin')) {
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

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type AdminRole = 'user' | 'admin' | 'super_admin'

type UserProfileRow = {
  id: string
  userId: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  phone: string | null
  createdAt: string | null
}

type AdminUserRow = {
  id: string
  email: string | null
  name: string | null
  role: string | null
  createdAt: string | null
}

type AdminUserResponse = {
  id: string
  email: string
  name: string
  phone: string | null
  role: AdminRole
  createdAt: string | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getClients() {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return null
  }

  return {
    auth: createClient(supabaseUrl, supabaseAnonKey),
    admin: createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }),
  }
}

function normalizeRole(role: string | null | undefined): AdminRole {
  if (role === 'admin' || role === 'super_admin') return role
  return 'user'
}

function displayName(profile: UserProfileRow | null, admin: AdminUserRow | null, email: string) {
  const profileName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
  if (profileName) return profileName
  if (admin?.name?.trim()) return admin.name.trim()
  return email.split('@')[0] || 'Customer'
}

function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  return token || null
}

async function requireSuperAdmin(request: NextRequest) {
  const clients = getClients()
  if (!clients) {
    return {
      error: NextResponse.json({ error: 'Supabase admin environment is not configured' }, { status: 500 }),
    }
  }

  const token = getBearerToken(request)
  if (!token) {
    return {
      error: NextResponse.json({ error: 'Missing auth token' }, { status: 401 }),
    }
  }

  const { data: userData, error: userError } = await clients.auth.auth.getUser(token)
  const email = userData.user?.email?.toLowerCase()

  if (userError || !email) {
    return {
      error: NextResponse.json({ error: 'Invalid auth token' }, { status: 401 }),
    }
  }

  const { data: adminData, error: adminError } = await clients.admin
    .from('AdminUser')
    .select('role')
    .eq('email', email)
    .maybeSingle()

  if (adminError || normalizeRole((adminData as Pick<AdminUserRow, 'role'> | null)?.role) !== 'super_admin') {
    return {
      error: NextResponse.json({ error: 'Super admin access required' }, { status: 403 }),
    }
  }

  return {
    clients,
    email,
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request)
  if ('error' in auth) return auth.error

  const [{ data: profilesData, error: profilesError }, { data: adminsData, error: adminsError }] = await Promise.all([
    auth.clients.admin
      .from('UserProfile')
      .select('id,userId,email,firstName,lastName,phone,createdAt')
      .order('createdAt', { ascending: false }),
    auth.clients.admin
      .from('AdminUser')
      .select('id,email,name,role,createdAt')
      .order('createdAt', { ascending: false }),
  ])

  if (profilesError || adminsError) {
    return NextResponse.json({ error: 'Unable to load users' }, { status: 500 })
  }

  const profiles = (profilesData || []) as UserProfileRow[]
  const admins = (adminsData || []) as AdminUserRow[]
  const adminsByEmail = new Map(
    admins
      .filter((admin) => admin.email)
      .map((admin) => [admin.email!.toLowerCase(), admin])
  )

  const rowsByEmail = new Map<string, AdminUserResponse>()

  profiles.forEach((profile) => {
    const email = profile.email?.toLowerCase()
    if (!email) return

    const admin = adminsByEmail.get(email) || null
    rowsByEmail.set(email, {
      id: profile.userId || profile.id,
      email,
      name: displayName(profile, admin, email),
      phone: profile.phone,
      role: normalizeRole(admin?.role),
      createdAt: profile.createdAt || admin?.createdAt || null,
    })
  })

  admins.forEach((admin) => {
    const email = admin.email?.toLowerCase()
    if (!email || rowsByEmail.has(email)) return

    rowsByEmail.set(email, {
      id: admin.id,
      email,
      name: displayName(null, admin, email),
      phone: null,
      role: normalizeRole(admin.role),
      createdAt: admin.createdAt,
    })
  })

  const users = Array.from(rowsByEmail.values()).sort((first, second) => {
    const firstDate = first.createdAt ? new Date(first.createdAt).getTime() : 0
    const secondDate = second.createdAt ? new Date(second.createdAt).getTime() : 0
    return secondDate - firstDate
  })

  return NextResponse.json({ users })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSuperAdmin(request)
  if ('error' in auth) return auth.error

  const body = await request.json() as Partial<{ email: string; role: AdminRole }>
  const email = body.email?.toLowerCase().trim()
  const nextRole = body.role

  if (!email || (nextRole !== 'admin' && nextRole !== 'user')) {
    return NextResponse.json({ error: 'Email and valid role are required' }, { status: 400 })
  }

  const { data: existingAdmin } = await auth.clients.admin
    .from('AdminUser')
    .select('id,email,name,role')
    .eq('email', email)
    .maybeSingle()

  const existing = existingAdmin as AdminUserRow | null

  if (existing?.role === 'super_admin') {
    return NextResponse.json({ error: 'Super admins cannot be changed here' }, { status: 400 })
  }

  if (nextRole === 'admin') {
    if (existing?.id) {
      const { error } = await auth.clients.admin
        .from('AdminUser')
        .update({ role: 'admin' })
        .eq('id', existing.id)

      if (error) {
        return NextResponse.json({ error: 'Unable to update admin role' }, { status: 500 })
      }
    } else {
      const { data: profile } = await auth.clients.admin
        .from('UserProfile')
        .select('firstName,lastName')
        .eq('email', email)
        .maybeSingle()

      const profileRow = profile as Pick<UserProfileRow, 'firstName' | 'lastName'> | null
      const name = `${profileRow?.firstName || ''} ${profileRow?.lastName || ''}`.trim() || email.split('@')[0]

      const { error } = await auth.clients.admin
        .from('AdminUser')
        .insert({ email, name, role: 'admin' })

      if (error) {
        return NextResponse.json({ error: 'Unable to promote user' }, { status: 500 })
      }
    }
  } else if (existing?.id) {
    const { error } = await auth.clients.admin
      .from('AdminUser')
      .delete()
      .eq('id', existing.id)

    if (error) {
      return NextResponse.json({ error: 'Unable to remove admin role' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}

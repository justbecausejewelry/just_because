import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type DiscountType = 'percentage' | 'fixed'

type DiscountCodeRow = {
  id: string
  code: string
  type: string
  value: number
  minOrderAmt: number | null
  maxUses: number | null
  usedCount: number | null
  isActive: boolean | null
  expiresAt: string | null
  createdAt: string | null
}

type DiscountCodePayload = {
  code?: string
  type?: DiscountType
  value?: number
  minOrderAmount?: number
  maxUses?: number | null
  expiresAt?: string | null
  isActive?: boolean
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const seedCodes = [
  {
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    minOrderAmt: 0,
    maxUses: 100,
    isActive: true,
  },
  {
    code: 'FLAT500',
    type: 'fixed',
    value: 500,
    minOrderAmt: 2000,
    maxUses: 50,
    isActive: true,
  },
  {
    code: 'VIP20',
    type: 'percentage',
    value: 20,
    minOrderAmt: 5000,
    maxUses: 25,
    isActive: true,
  },
]

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

function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  return token || null
}

function normalizeCode(row: DiscountCodeRow) {
  return {
    id: row.id,
    code: row.code,
    type: row.type === 'fixed' ? 'fixed' : 'percentage',
    value: Number(row.value || 0),
    minOrderAmount: Number(row.minOrderAmt || 0),
    maxUses: row.maxUses,
    usesCount: Number(row.usedCount || 0),
    isActive: Boolean(row.isActive),
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  }
}

async function requireAdmin(request: NextRequest) {
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

  if (adminError || !adminData) {
    return {
      error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }),
    }
  }

  return { clients }
}

async function ensureSeedCodes(admin: SupabaseClient) {
  const { data } = await admin
    .from('DiscountCode')
    .select('code')
    .in('code', seedCodes.map((code) => code.code))

  const existing = new Set((data || []).map((row) => String(row.code)))
  const missing = seedCodes.filter((code) => !existing.has(code.code))

  if (missing.length) {
    await admin.from('DiscountCode').insert(missing)
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  await ensureSeedCodes(auth.clients.admin)

  const { data, error } = await auth.clients.admin
    .from('DiscountCode')
    .select('id,code,type,value,minOrderAmt,maxUses,usedCount,isActive,expiresAt,createdAt')
    .order('createdAt', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Unable to load discount codes' }, { status: 500 })
  }

  return NextResponse.json({
    codes: ((data || []) as DiscountCodeRow[]).map(normalizeCode),
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const body = await request.json() as DiscountCodePayload
  const code = body.code?.trim().toUpperCase()
  const type = body.type
  const value = Number(body.value || 0)
  const minOrderAmount = Number(body.minOrderAmount || 0)
  const maxUses = body.maxUses === null || body.maxUses === undefined ? null : Number(body.maxUses)
  const expiresAt = body.expiresAt || null
  const isActive = body.isActive !== false

  if (!code || (type !== 'percentage' && type !== 'fixed') || value <= 0) {
    return NextResponse.json({ error: 'Code, type, and value are required' }, { status: 400 })
  }

  if (type === 'percentage' && value > 100) {
    return NextResponse.json({ error: 'Percentage discounts cannot exceed 100%' }, { status: 400 })
  }

  const { error } = await auth.clients.admin
    .from('DiscountCode')
    .insert({
      code,
      type,
      value,
      minOrderAmt: minOrderAmount,
      maxUses,
      isActive,
      expiresAt,
    })

  if (error) {
    return NextResponse.json({ error: 'Unable to create discount code' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const body = await request.json() as Partial<{ id: string; isActive: boolean }>

  if (!body.id || typeof body.isActive !== 'boolean') {
    return NextResponse.json({ error: 'Code id and active status are required' }, { status: 400 })
  }

  const { error } = await auth.clients.admin
    .from('DiscountCode')
    .update({ isActive: body.isActive })
    .eq('id', body.id)

  if (error) {
    return NextResponse.json({ error: 'Unable to update discount code' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const id = request.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Code id is required' }, { status: 400 })
  }

  const { error } = await auth.clients.admin
    .from('DiscountCode')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Unable to delete discount code' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

type DiscountType = 'percentage' | 'fixed'

type DiscountCodeRow = {
  id: string
  code: string
  type: string
  value: number
  minOrderAmt: number | null
  maxUses: number | null
  maxUsesPerUser: number | null
  firstTimeOnly: boolean | null
  usedCount: number | null
  isActive: boolean | null
  expiresAt: string | null
  createdAt: string | null
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
    maxUsesPerUser: 1,
    firstTimeOnly: true,
    isActive: true,
  },
  {
    code: 'FLAT500',
    type: 'fixed',
    value: 500,
    minOrderAmt: 2000,
    maxUses: 50,
    maxUsesPerUser: null,
    firstTimeOnly: false,
    isActive: true,
  },
  {
    code: 'VIP20',
    type: 'percentage',
    value: 20,
    minOrderAmt: 5000,
    maxUses: 25,
    maxUsesPerUser: null,
    firstTimeOnly: false,
    isActive: true,
  },
]

const optionalLimitSchema = z.preprocess(
  (value) => value === '' || value === undefined ? null : value,
  z.union([z.coerce.number().int().min(1), z.null()])
)

const optionalDateSchema = z.preprocess(
  (value) => value === '' || value === undefined ? null : value,
  z.union([z.string().trim().min(1), z.null()])
).refine((value) => {
  if (!value) return true

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  expiry.setHours(0, 0, 0, 0)
  return Number.isFinite(expiry.getTime()) && expiry >= today
}, { message: 'Expiry date must be today or in the future' })

const createDiscountCodeSchema = z.object({
  code: z.string().trim().min(1, 'Code is required').max(80),
  type: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().positive('Value must be greater than 0'),
  minOrderAmount: z.coerce.number().min(0).default(0),
  maxUses: optionalLimitSchema.default(null),
  maxUsesPerUser: optionalLimitSchema.default(null),
  firstTimeOnly: z.boolean().default(false),
  expiresAt: optionalDateSchema.default(null),
  isActive: z.boolean().default(true),
}).superRefine((value, ctx) => {
  if (value.type === 'percentage' && value.value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Percentage discounts cannot exceed 100%',
      path: ['value'],
    })
  }
})

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
    maxUsesPerUser: row.maxUsesPerUser,
    firstTimeOnly: Boolean(row.firstTimeOnly),
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
    .select('id,code,type,value,minOrderAmt,maxUses,maxUsesPerUser,firstTimeOnly,usedCount,isActive,expiresAt,createdAt')
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

  const parsed = createDiscountCodeSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({
      error: parsed.error.issues[0]?.message || 'Invalid discount code payload',
    }, { status: 400 })
  }

  const code = parsed.data.code.toUpperCase()
  const { error } = await auth.clients.admin
    .from('DiscountCode')
    .insert({
      code,
      type: parsed.data.type,
      value: parsed.data.value,
      minOrderAmt: parsed.data.minOrderAmount,
      maxUses: parsed.data.maxUses,
      maxUsesPerUser: parsed.data.maxUsesPerUser,
      firstTimeOnly: parsed.data.firstTimeOnly,
      isActive: parsed.data.isActive,
      expiresAt: parsed.data.expiresAt,
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

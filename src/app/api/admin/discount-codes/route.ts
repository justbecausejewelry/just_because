import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getClientIp } from '@/lib/server/rateLimit'
import { requireAdmin } from '@/lib/server/security'

const discountTypeSchema = z.enum(['percentage', 'fixed', 'free_shipping', 'free_gift'])
const appliesToSchema = z.enum(['all', 'specific_products', 'specific_categories', 'specific_types'])
const customerSegmentSchema = z.enum(['all', 'new', 'returning', 'vip', 'win_back', 'specific_emails'])

const optionalPositiveNumber = z.preprocess(
  (value) => value === '' || value === undefined || value === null ? null : value,
  z.union([z.coerce.number().positive(), z.null()])
)

const optionalLimitSchema = z.preprocess(
  (value) => value === '' || value === undefined || value === null ? null : value,
  z.union([z.coerce.number().int().min(1), z.null()])
)

const optionalDateSchema = z.preprocess(
  (value) => value === '' || value === undefined || value === null ? null : value,
  z.union([z.string().trim().min(1), z.null()])
)

const stringArraySchema = z.preprocess((value) => {
  if (typeof value === 'string') {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return value || []
}, z.array(z.string().trim().min(1)).default([]))

const uuidArraySchema = z.preprocess((value) => value || [], z.array(z.string().uuid()).default([]))

const tierSchema = z.object({
  threshold: z.coerce.number().min(0),
  type: z.enum(['percentage', 'fixed']).default('percentage'),
  value: z.coerce.number().positive(),
})

export const discountPayloadSchema = z.object({
  code: z.string().trim().min(1, 'Code is required').max(80),
  type: discountTypeSchema.default('percentage'),
  value: z.coerce.number().min(0).default(0),
  maxDiscountAmount: optionalPositiveNumber.default(null),
  internalNotes: z.string().trim().max(4000).optional().default(''),
  campaignSource: z.string().trim().max(240).optional().default(''),
  maxUses: optionalLimitSchema.default(null),
  maxUsesPerUser: optionalLimitSchema.default(null),
  minOrderAmount: z.coerce.number().min(0).default(0),
  minItemCount: z.coerce.number().int().min(1).default(1),
  firstTimeOnly: z.boolean().default(false),
  canStackWithOthers: z.boolean().default(false),
  excludeSaleItems: z.boolean().default(true),
  freeShipping: z.boolean().default(false),
  appliesTo: appliesToSchema.default('all'),
  applicableProductIds: uuidArraySchema,
  applicableCategories: stringArraySchema,
  applicableTypes: stringArraySchema,
  excludedProductIds: uuidArraySchema,
  customerSegment: customerSegmentSchema.default('all'),
  specificEmails: stringArraySchema,
  minCustomerLifetimeValue: optionalPositiveNumber.default(null),
  countryRestrictions: stringArraySchema,
  startDate: optionalDateSchema.default(null),
  expiresAt: optionalDateSchema.default(null),
  timezone: z.string().trim().max(80).optional().default('America/Chicago'),
  isActive: z.boolean().default(true),
  freeGift: z.unknown().nullable().optional().default(null),
  tierThresholds: z.array(tierSchema).default([]),
}).superRefine((value, ctx) => {
  if (value.type !== 'free_shipping' && value.type !== 'free_gift' && value.value <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Value must be greater than 0', path: ['value'] })
  }

  if (value.type === 'percentage' && value.value > 100) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Percentage discounts cannot exceed 100%', path: ['value'] })
  }

  if (value.startDate && value.expiresAt && new Date(value.startDate).getTime() > new Date(value.expiresAt).getTime()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Start date cannot be after end date', path: ['startDate'] })
  }

  if (value.expiresAt) {
    const expiry = new Date(value.expiresAt.includes('T') ? value.expiresAt : `${value.expiresAt}T23:59:59.999`)
    if (Number.isFinite(expiry.getTime()) && expiry.getTime() < Date.now()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End date cannot be in the past', path: ['expiresAt'] })
    }
  }

  if (value.appliesTo === 'specific_products' && value.applicableProductIds.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Choose at least one product', path: ['applicableProductIds'] })
  }

  if (value.appliesTo === 'specific_categories' && value.applicableCategories.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Choose at least one category', path: ['applicableCategories'] })
  }

  if (value.appliesTo === 'specific_types' && value.applicableTypes.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Choose at least one product type', path: ['applicableTypes'] })
  }

  if (value.customerSegment === 'specific_emails' && value.specificEmails.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Add at least one eligible email', path: ['specificEmails'] })
  }
})

type DiscountCodeRow = {
  id: string
  code: string
  type?: string | null
  value?: number | null
  minOrderAmt?: number | null
  maxUses?: number | null
  maxUsesPerUser?: number | null
  firstTimeOnly?: boolean | null
  usedCount?: number | null
  currentUses?: number | null
  isActive?: boolean | null
  expiresAt?: string | null
  startDate?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  maxDiscountAmount?: number | null
  minItemCount?: number | null
  appliesTo?: string | null
  applicableProductIds?: string[] | null
  applicableCategories?: string[] | null
  applicableTypes?: string[] | null
  excludedProductIds?: string[] | null
  excludeSaleItems?: boolean | null
  canStackWithOthers?: boolean | null
  freeShipping?: boolean | null
  freeGift?: unknown | null
  customerSegment?: string | null
  specificEmails?: string[] | null
  minCustomerLifetimeValue?: number | null
  countryRestrictions?: string[] | null
  campaignSource?: string | null
  internalNotes?: string | null
  isArchived?: boolean | null
  archivedAt?: string | null
  totalRevenueImpact?: number | null
  tierThresholds?: unknown | null
  pausedForFraud?: boolean | null
  fraudReason?: string | null
}

function normalizeCode(row: DiscountCodeRow) {
  const usesCount = Number(row.currentUses ?? row.usedCount ?? 0)
  return {
    id: row.id,
    code: row.code,
    type: row.type || 'percentage',
    value: Number(row.value || 0),
    minOrderAmount: Number(row.minOrderAmt || 0),
    maxUses: row.maxUses ?? null,
    maxUsesPerUser: row.maxUsesPerUser ?? null,
    firstTimeOnly: Boolean(row.firstTimeOnly),
    usesCount,
    currentUses: usesCount,
    isActive: Boolean(row.isActive),
    expiresAt: row.expiresAt,
    startDate: row.startDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    maxDiscountAmount: row.maxDiscountAmount ?? null,
    minItemCount: row.minItemCount || 1,
    appliesTo: row.appliesTo || 'all',
    applicableProductIds: row.applicableProductIds || [],
    applicableCategories: row.applicableCategories || [],
    applicableTypes: row.applicableTypes || [],
    excludedProductIds: row.excludedProductIds || [],
    excludeSaleItems: row.excludeSaleItems !== false,
    canStackWithOthers: Boolean(row.canStackWithOthers),
    freeShipping: Boolean(row.freeShipping || row.type === 'free_shipping'),
    freeGift: row.freeGift || null,
    customerSegment: row.customerSegment || 'all',
    specificEmails: row.specificEmails || [],
    minCustomerLifetimeValue: row.minCustomerLifetimeValue ?? null,
    countryRestrictions: row.countryRestrictions || [],
    campaignSource: row.campaignSource || '',
    internalNotes: row.internalNotes || '',
    isArchived: Boolean(row.isArchived),
    archivedAt: row.archivedAt,
    totalRevenueImpact: Number(row.totalRevenueImpact || 0),
    tierThresholds: row.tierThresholds || [],
    pausedForFraud: Boolean(row.pausedForFraud),
    fraudReason: row.fraudReason || '',
  }
}

export function payloadToDiscountRow(payload: z.infer<typeof discountPayloadSchema>, userId: string) {
  return {
    code: payload.code.trim().toUpperCase(),
    type: payload.type,
    value: payload.type === 'free_shipping' || payload.type === 'free_gift' ? 0 : payload.value,
    minOrderAmt: payload.minOrderAmount,
    maxUses: payload.maxUses,
    maxUsesPerUser: payload.maxUsesPerUser,
    firstTimeOnly: payload.firstTimeOnly || payload.customerSegment === 'new',
    isActive: payload.isActive,
    expiresAt: payload.expiresAt,
    startDate: payload.startDate,
    minItemCount: payload.minItemCount,
    maxDiscountAmount: payload.maxDiscountAmount,
    appliesTo: payload.appliesTo,
    applicableProductIds: payload.applicableProductIds,
    applicableCategories: payload.applicableCategories,
    applicableTypes: payload.applicableTypes,
    excludedProductIds: payload.excludedProductIds,
    excludeSaleItems: payload.excludeSaleItems,
    canStackWithOthers: payload.canStackWithOthers,
    freeShipping: payload.freeShipping || payload.type === 'free_shipping',
    freeGift: payload.freeGift,
    customerSegment: payload.customerSegment,
    specificEmails: payload.specificEmails.map((email) => email.toLowerCase()),
    minCustomerLifetimeValue: payload.minCustomerLifetimeValue,
    countryRestrictions: payload.countryRestrictions,
    campaignSource: payload.campaignSource || null,
    internalNotes: payload.internalNotes || null,
    lastModifiedBy: userId,
    tierThresholds: payload.tierThresholds,
    updatedAt: new Date().toISOString(),
  }
}

async function logAudit({
  auth,
  discountCodeId,
  action,
  oldValues,
  newValues,
  ipAddress,
}: {
  auth: Awaited<ReturnType<typeof requireAdmin>> extends infer Result ? Exclude<Result, { error: NextResponse }> : never
  discountCodeId: string
  action: 'created' | 'modified' | 'activated' | 'deactivated' | 'archived' | 'restored'
  oldValues?: unknown
  newValues?: unknown
  ipAddress: string
}) {
  await auth.admin.from('DiscountCodeAuditLog').insert({
    discountCodeId,
    userId: auth.user.id,
    action,
    oldValues: oldValues || null,
    newValues: newValues || null,
    ipAddress,
  })
}

async function loadDiscountCodes(request: NextRequest) {
  console.log('[admin/discount-codes] GET called')
  const auth = await requireAdmin(request)
  if ('error' in auth) {
    console.error('[admin/discount-codes] auth failed')
    return auth
  }

  console.log('[admin/discount-codes] user:', auth.user.email)

  const { data, error } = await auth.admin
    .from('DiscountCode')
    .select('*')
    .eq('isArchived', false)
    .order('createdAt', { ascending: false })

  console.log('[admin/discount-codes] data count:', data?.length)
  console.log('[admin/discount-codes] error:', error)

  if (error) {
    console.error('[admin/discount-codes] FAILED:', error)
    return {
      error: NextResponse.json({ error: error.message || 'Unable to load discount codes' }, { status: 500 }),
    }
  }

  return { auth, codes: ((data || []) as DiscountCodeRow[]).map(normalizeCode) }
}

export async function GET(request: NextRequest) {
  try {
    const result = await loadDiscountCodes(request)
    if ('error' in result) return result.error

    return NextResponse.json({ codes: result.codes })
  } catch (error) {
    console.error('[admin/discount-codes] FAILED:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load discount codes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const parsed = discountPayloadSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid discount code payload' }, { status: 400 })
  }

  const payload = {
    ...payloadToDiscountRow(parsed.data, auth.user.id),
    createdBy: auth.user.id,
  }

  const { data, error } = await auth.admin
    .from('DiscountCode')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message || 'Unable to create discount code' }, { status: 500 })
  }

  const row = data as DiscountCodeRow
  await logAudit({
    auth,
    discountCodeId: row.id,
    action: 'created',
    newValues: normalizeCode(row),
    ipAddress: getClientIp(request),
  })

  return NextResponse.json({ ok: true, code: normalizeCode(row) })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const body = await request.json().catch(() => null) as unknown
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid discount code payload' }, { status: 400 })
  }

  const record = body as Record<string, unknown>
  const id = typeof record.id === 'string' ? record.id : ''
  if (!id) {
    return NextResponse.json({ error: 'Code id is required' }, { status: 400 })
  }

  const { data: current } = await auth.admin
    .from('DiscountCode')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!current) {
    return NextResponse.json({ error: 'Discount code not found' }, { status: 404 })
  }

  if (typeof record.isActive === 'boolean' && Object.keys(record).length <= 2) {
    const { data, error } = await auth.admin
      .from('DiscountCode')
      .update({
        isActive: record.isActive,
        lastModifiedBy: auth.user.id,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Unable to update discount code' }, { status: 500 })
    }

    await logAudit({
      auth,
      discountCodeId: id,
      action: record.isActive ? 'activated' : 'deactivated',
      oldValues: normalizeCode(current as DiscountCodeRow),
      newValues: normalizeCode(data as DiscountCodeRow),
      ipAddress: getClientIp(request),
    })
    return NextResponse.json({ ok: true, code: normalizeCode(data as DiscountCodeRow) })
  }

  const parsed = discountPayloadSchema.safeParse(record)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid discount code payload' }, { status: 400 })
  }

  const { data, error } = await auth.admin
    .from('DiscountCode')
    .update(payloadToDiscountRow(parsed.data, auth.user.id))
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Unable to update discount code' }, { status: 500 })
  }

  await logAudit({
    auth,
    discountCodeId: id,
    action: 'modified',
    oldValues: normalizeCode(current as DiscountCodeRow),
    newValues: normalizeCode(data as DiscountCodeRow),
    ipAddress: getClientIp(request),
  })

  return NextResponse.json({ ok: true, code: normalizeCode(data as DiscountCodeRow) })
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Code id is required' }, { status: 400 })
  }

  const { data: current } = await auth.admin
    .from('DiscountCode')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!current) {
    return NextResponse.json({ error: 'Discount code not found' }, { status: 404 })
  }

  const { error } = await auth.admin
    .from('DiscountCode')
    .update({
      isArchived: true,
      archivedAt: new Date().toISOString(),
      isActive: false,
      lastModifiedBy: auth.user.id,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Unable to archive discount code' }, { status: 500 })
  }

  await logAudit({
    auth,
    discountCodeId: id,
    action: 'archived',
    oldValues: normalizeCode(current as DiscountCodeRow),
    ipAddress: getClientIp(request),
  })

  return NextResponse.json({ ok: true })
}

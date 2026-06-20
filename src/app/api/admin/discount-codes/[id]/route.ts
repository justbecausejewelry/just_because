import { NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/server/rateLimit'
import { requireAdmin } from '@/lib/server/security'
import { discountPayloadSchema, payloadToDiscountRow } from '../route'

type RouteContext = {
  params: Promise<{ id: string }>
}

type DiscountCodeRow = {
  id: string
  code?: string | null
  type?: string | null
  value?: number | null
  isActive?: boolean | null
  isArchived?: boolean | null
  [key: string]: unknown
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
  action: 'modified' | 'activated' | 'deactivated' | 'archived'
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

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await context.params
  const body = await request.json().catch(() => null) as unknown
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid discount code payload' }, { status: 400 })
  }

  const { data: current } = await auth.admin
    .from('DiscountCode')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!current) {
    return NextResponse.json({ error: 'Discount code not found' }, { status: 404 })
  }

  const record = body as Record<string, unknown>
  if (typeof record.isActive === 'boolean' && Object.keys(record).length === 1) {
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
      oldValues: current,
      newValues: data,
      ipAddress: getClientIp(request),
    })

    return NextResponse.json({ ok: true, code: data as DiscountCodeRow })
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
    oldValues: current,
    newValues: data,
    ipAddress: getClientIp(request),
  })

  return NextResponse.json({ ok: true, code: data as DiscountCodeRow })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await context.params
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
    oldValues: current,
    ipAddress: getClientIp(request),
  })

  return NextResponse.json({ ok: true })
}

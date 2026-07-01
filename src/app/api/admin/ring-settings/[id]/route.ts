import { NextRequest, NextResponse } from 'next/server'
import { RING_SETTING_METALS, type RingSettingImages, type RingSettingPayload } from '@/lib/ringSettings'
import { requireAdmin } from '@/lib/server/security'

function stringArray(value: unknown, fallback: string[] = []) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : fallback
}

function imagesObject(value: unknown): RingSettingImages {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const entries = Object.entries(value).filter((entry): entry is [keyof RingSettingImages, string] => {
    const [key, nestedValue] = entry
    return ['white_gold', 'yellow_gold', 'rose_gold', 'platinum'].includes(key) && typeof nestedValue === 'string'
  })
  return Object.fromEntries(entries) as RingSettingImages
}

function payloadFromBody(body: Record<string, unknown>): RingSettingPayload {
  return {
    basePrice: Number(body.basePrice || 0),
    compatibleShapes: stringArray(body.compatibleShapes),
    description: typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null,
    imageUrl: typeof body.imageUrl === 'string' && body.imageUrl.trim() ? body.imageUrl.trim() : null,
    images: imagesObject(body.images),
    isActive: body.isActive !== false,
    metals: stringArray(body.metals, [...RING_SETTING_METALS]),
    name: typeof body.name === 'string' ? body.name.trim() : '',
    sortOrder: Number(body.sortOrder || 0),
    style: typeof body.style === 'string' ? body.style.trim() : '',
  }
}

function validatePayload(payload: RingSettingPayload) {
  if (!payload.name) return 'Setting name is required.'
  if (!payload.style) return 'Style is required.'
  if (!Number.isFinite(payload.basePrice) || payload.basePrice < 0) return 'Base price must be a valid non-negative number.'
  if (!payload.metals.length) return 'At least one metal is required.'
  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  const { data, error } = await auth.admin
    .from('RingSetting')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Ring setting not found' }, { status: 404 })
  }

  return NextResponse.json({ setting: data })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  const body = (await request.json()) as Record<string, unknown>
  const payload = payloadFromBody(body)
  const validationError = validatePayload(payload)

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const { data, error } = await auth.admin
    .from('RingSetting')
    .update({ ...payload, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ setting: data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  const { error } = await auth.admin
    .from('RingSetting')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

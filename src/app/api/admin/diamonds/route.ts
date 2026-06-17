import { NextRequest, NextResponse } from 'next/server'
import { getDiamondImage } from '@/lib/diamondImages'
import { requireAdmin } from '@/lib/server/security'

type DiamondPayload = {
  id?: string
  shape: string
  carat: number
  color: string
  clarity: string
  cut?: string | null
  polish?: string | null
  symmetry?: string | null
  fluorescence?: string | null
  price: number
  depthPercent?: number | null
  tablePercent?: number | null
  measurements?: string | null
  certificateNumber?: string | null
  certificateType?: string | null
  certificateUrl?: string | null
  imageUrl?: string | null
  isAvailable?: boolean
  isLabGrown?: boolean
}

function generateSku() {
  return `JB-DIA-${Date.now().toString().slice(-8)}`
}

function normalizePayload(body: Record<string, unknown>) {
  const carat = Number(body.carat)
  const price = Number(body.price)
  const payload: DiamondPayload = {
    shape: typeof body.shape === 'string' ? body.shape : 'Round',
    carat,
    color: typeof body.color === 'string' ? body.color : 'G',
    clarity: typeof body.clarity === 'string' ? body.clarity : 'VS1',
    cut: typeof body.cut === 'string' ? body.cut : null,
    polish: typeof body.polish === 'string' ? body.polish : 'Excellent',
    symmetry: typeof body.symmetry === 'string' ? body.symmetry : 'Excellent',
    fluorescence: typeof body.fluorescence === 'string' ? body.fluorescence : 'None',
    price,
    depthPercent: body.depthPercent === null || body.depthPercent === '' || body.depthPercent === undefined
      ? null
      : Number(body.depthPercent),
    tablePercent: body.tablePercent === null || body.tablePercent === '' || body.tablePercent === undefined
      ? null
      : Number(body.tablePercent),
    measurements: typeof body.measurements === 'string' && body.measurements.trim()
      ? body.measurements.trim()
      : null,
    certificateNumber: typeof body.certificateNumber === 'string' && body.certificateNumber.trim()
      ? body.certificateNumber.trim()
      : `IGI-${Math.floor(Math.random() * 9000000 + 1000000)}`,
    certificateType: typeof body.certificateType === 'string' && body.certificateType.trim()
      ? body.certificateType.trim()
      : 'IGI',
    certificateUrl: typeof body.certificateUrl === 'string' && body.certificateUrl.trim()
      ? body.certificateUrl.trim()
      : null,
    imageUrl: typeof body.imageUrl === 'string' && body.imageUrl.trim()
      ? body.imageUrl.trim()
      : getDiamondImage(typeof body.shape === 'string' ? body.shape : 'Round'),
    isAvailable: typeof body.isAvailable === 'boolean' ? body.isAvailable : true,
    isLabGrown: typeof body.isLabGrown === 'boolean' ? body.isLabGrown : true,
  }

  if (!Number.isFinite(payload.carat) || payload.carat <= 0) {
    throw new Error('Carat weight is required')
  }

  if (!Number.isFinite(payload.price) || payload.price <= 0) {
    throw new Error('Price is required')
  }

  return payload
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const includeAll = request.nextUrl.searchParams.get('all') === 'true'
  let query = auth.admin
    .from('Diamond')
    .select('*')
    .order('createdAt', { ascending: false })

  if (!includeAll) {
    query = query.eq('isAvailable', true)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ diamonds: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = (await request.json()) as Record<string, unknown>
    const payload = {
      ...normalizePayload(body),
      sku: typeof body.sku === 'string' && body.sku.trim() ? body.sku.trim() : generateSku(),
      isLabGrown: true,
    }

    const { data, error } = await auth.admin
      .from('Diamond')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ diamond: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid diamond payload' }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = (await request.json()) as Record<string, unknown>
    const id = typeof body.id === 'string' ? body.id : ''

    if (!id) {
      return NextResponse.json({ error: 'Diamond id is required' }, { status: 400 })
    }

    const { data, error } = await auth.admin
      .from('Diamond')
      .update(normalizePayload(body))
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ diamond: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid diamond payload' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const id = request.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Diamond id is required' }, { status: 400 })
  }

  const { error } = await auth.admin
    .from('Diamond')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { checkReturnEligibility, isReturnReason } from '@/lib/returnEligibility'
import { sendReturnRequestEmail } from '@/lib/sendReturnEmail'

type OrderRow = {
  id: string
  orderNumber?: string | null
  customerName?: string | null
  customerEmail?: string | null
  status?: string | null
  total?: number | null
  createdAt?: string | null
}

type OrderItemRow = {
  id: string
  orderId?: string | null
  productTitle?: string | null
  title?: string | null
  name?: string | null
  unitPrice?: number | null
  engraving?: string | null
}

type ReturnRow = {
  id: string
  order_id?: string | null
  user_id?: string | null
  order_number?: string | null
  customer_name?: string | null
  customer_email?: string | null
  item_name?: string | null
  item_price?: number | null
  reason?: string | null
  reason_details?: string | null
  status?: string | null
  authorization_number?: string | null
  rejection_reason?: string | null
  refund_amount?: number | null
  created_at?: string | null
  updated_at?: string | null
}

type CreateReturnPayload = {
  orderId?: string
  reason?: string
  reasonDetails?: string
  details?: string
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

function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  return token || null
}

async function requireUser(request: NextRequest) {
  const clients = getClients()
  if (!clients) {
    return {
      error: NextResponse.json({ error: 'Supabase environment is not configured' }, { status: 500 }),
    }
  }

  const token = getBearerToken(request)
  if (!token) {
    return {
      error: NextResponse.json({ error: 'Missing auth token' }, { status: 401 }),
    }
  }

  const { data, error } = await clients.auth.auth.getUser(token)
  if (error || !data.user?.email) {
    return {
      error: NextResponse.json({ error: 'Invalid auth token' }, { status: 401 }),
    }
  }

  return { clients, user: data.user }
}

function normalizeReturn(row: ReturnRow) {
  return {
    id: row.id,
    orderId: row.order_id || '',
    userId: row.user_id || '',
    orderNumber: row.order_number || '',
    customerName: row.customer_name || '',
    customerEmail: row.customer_email || '',
    itemName: row.item_name || 'Just Because piece',
    itemPrice: Number(row.item_price || 0),
    reason: row.reason || '',
    reasonDetails: row.reason_details || '',
    status: row.status || 'requested',
    authorizationNumber: row.authorization_number || '',
    rejectionReason: row.rejection_reason || '',
    refundAmount: Number(row.refund_amount || 0),
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  }
}

function itemTitle(item: OrderItemRow | undefined) {
  return item?.productTitle || item?.title || item?.name || 'Just Because piece'
}

async function loadOrder(admin: SupabaseClient, orderId: string) {
  const { data: orderData, error: orderError } = await admin
    .from('Order')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()

  if (orderError || !orderData) {
    return { order: null, items: [] as OrderItemRow[] }
  }

  const { data: itemsData } = await admin
    .from('OrderItem')
    .select('*')
    .eq('orderId', orderId)

  return {
    order: orderData as OrderRow,
    items: (itemsData || []) as OrderItemRow[],
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if ('error' in auth) return auth.error

  const { data, error } = await auth.clients.admin
    .from('return_requests')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message, returns: [] }, { status: 500 })
  }

  return NextResponse.json({
    returns: ((data || []) as ReturnRow[]).map(normalizeReturn),
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if ('error' in auth) return auth.error

  const body = await request.json() as CreateReturnPayload
  const orderId = body.orderId?.trim()
  const reason = body.reason?.trim()
  const reasonDetails = (body.reasonDetails || body.details || '').trim()

  if (!orderId || !reason || !isReturnReason(reason)) {
    return NextResponse.json({ error: 'Order and valid return reason are required' }, { status: 400 })
  }

  const { order, items } = await loadOrder(auth.clients.admin, orderId)
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const userEmail = auth.user.email?.toLowerCase() || ''
  const orderEmail = order.customerEmail?.toLowerCase() || ''
  if (!userEmail || userEmail !== orderEmail) {
    return NextResponse.json({ error: 'This order does not belong to the signed-in user' }, { status: 403 })
  }

  const eligibility = checkReturnEligibility({
    createdAt: order.createdAt,
    status: order.status,
    items,
  })

  if (!eligibility.eligible) {
    return NextResponse.json({ error: eligibility.reason || 'Order is not eligible for return' }, { status: 400 })
  }

  const { data: existing } = await auth.clients.admin
    .from('return_requests')
    .select('id')
    .eq('order_id', order.id)
    .eq('user_id', auth.user.id)
    .not('status', 'in', '(closed,rejected)')

  if ((existing || []).length > 0) {
    return NextResponse.json({ error: 'A return request for this order is already open' }, { status: 409 })
  }

  const firstItem = items[0]
  const { data, error } = await auth.clients.admin
    .from('return_requests')
    .insert({
      order_id: order.id,
      user_id: auth.user.id,
      order_number: order.orderNumber,
      customer_name: order.customerName || auth.user.email,
      customer_email: auth.user.email,
      item_name: itemTitle(firstItem),
      item_price: firstItem?.unitPrice || order.total || 0,
      reason,
      reason_details: reasonDetails,
      status: 'requested',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const returnRow = data as ReturnRow
  await sendReturnRequestEmail({
    customerEmail: auth.user.email || '',
    customerName: order.customerName || auth.user.email || '',
    orderNumber: order.orderNumber || order.id,
    returnId: returnRow.id,
    reason,
    type: 'requested',
  })

  return NextResponse.json({ returnRequest: normalizeReturn(returnRow) })
}

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { normalizeReturnStatus, type ReturnStatus } from '@/lib/returnEligibility'
import { sendReturnRequestEmail } from '@/lib/sendReturnEmail'

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
  admin_notes?: string | null
  rejection_reason?: string | null
  refund_amount?: number | null
  created_at?: string | null
  updated_at?: string | null
  approved_at?: string | null
  received_at?: string | null
  refunded_at?: string | null
}

type UpdatePayload = {
  returnId?: string
  action?: 'approve' | 'reject' | 'mark_received' | 'refund' | 'under_review'
  rejectionReason?: string
  refundAmount?: number
  adminNotes?: string
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
    status: normalizeReturnStatus(row.status),
    authorizationNumber: row.authorization_number || '',
    adminNotes: row.admin_notes || '',
    rejectionReason: row.rejection_reason || '',
    refundAmount: Number(row.refund_amount || 0),
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
    approvedAt: row.approved_at || '',
    receivedAt: row.received_at || '',
    refundedAt: row.refunded_at || '',
  }
}

function authorizationNumber() {
  return `JB-RTN-${Date.now().toString(36).toUpperCase()}`
}

function nextPatch(returnRow: ReturnRow, body: UpdatePayload): Partial<Record<string, string | number | null>> | null {
  const now = new Date().toISOString()

  if (body.action === 'approve') {
    return {
      status: 'approved',
      authorization_number: returnRow.authorization_number || authorizationNumber(),
      approved_at: now,
      admin_notes: body.adminNotes || returnRow.admin_notes || null,
    }
  }

  if (body.action === 'reject') {
    return {
      status: 'rejected',
      rejection_reason: body.rejectionReason || 'Return request did not meet eligibility requirements.',
      admin_notes: body.adminNotes || returnRow.admin_notes || null,
    }
  }

  if (body.action === 'mark_received') {
    return {
      status: 'item_received',
      received_at: now,
      admin_notes: body.adminNotes || returnRow.admin_notes || null,
    }
  }

  if (body.action === 'refund') {
    return {
      status: 'refunded',
      refund_amount: Number(body.refundAmount || returnRow.item_price || 0),
      refunded_at: now,
      admin_notes: body.adminNotes || returnRow.admin_notes || null,
    }
  }

  if (body.action === 'under_review') {
    return {
      status: 'under_review',
      admin_notes: body.adminNotes || returnRow.admin_notes || null,
    }
  }

  return null
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { data, error } = await auth.clients.admin
    .from('return_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message, returns: [] }, { status: 500 })
  }

  return NextResponse.json({
    returns: ((data || []) as ReturnRow[]).map(normalizeReturn),
  })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const body = await request.json() as UpdatePayload
  if (!body.returnId || !body.action) {
    return NextResponse.json({ error: 'returnId and action are required' }, { status: 400 })
  }

  const { data: current, error: currentError } = await auth.clients.admin
    .from('return_requests')
    .select('*')
    .eq('id', body.returnId)
    .maybeSingle()

  if (currentError || !current) {
    return NextResponse.json({ error: 'Return request not found' }, { status: 404 })
  }

  const currentReturn = current as ReturnRow
  const patch = nextPatch(currentReturn, body)
  if (!patch) {
    return NextResponse.json({ error: 'Invalid return action' }, { status: 400 })
  }

  const { data, error } = await auth.clients.admin
    .from('return_requests')
    .update(patch)
    .eq('id', body.returnId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const updated = data as ReturnRow
  const status = normalizeReturnStatus(updated.status) as ReturnStatus

  if (status === 'approved' || status === 'rejected' || status === 'refunded') {
    await sendReturnRequestEmail({
      customerEmail: updated.customer_email || '',
      customerName: updated.customer_name || updated.customer_email || '',
      orderNumber: updated.order_number || updated.order_id || '',
      returnId: updated.id,
      reason: updated.reason || '',
      authorizationNumber: updated.authorization_number || undefined,
      rejectionReason: updated.rejection_reason || undefined,
      refundAmount: Number(updated.refund_amount || 0),
      type: status === 'approved' ? 'approved' : status === 'refunded' ? 'refunded' : 'rejected',
    })
  }

  return NextResponse.json({ returnRequest: normalizeReturn(updated) })
}


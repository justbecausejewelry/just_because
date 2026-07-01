import { NextRequest, NextResponse } from 'next/server'
import { normalizeReturnStatus, type ReturnStatus } from '@/lib/returnEligibility'
import { verifyAdminRequest } from '@/lib/server/adminAuth'
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

async function requireAdmin(request: NextRequest) {
  const auth = await verifyAdminRequest(request)
  if (auth.error || !auth.admin) {
    return {
      error: NextResponse.json(
        { error: auth.error || 'Admin access required' },
        { status: auth.status === 403 ? 403 : auth.status === 500 ? 500 : 401 }
      ),
    }
  }

  return { clients: { admin: auth.admin } }
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

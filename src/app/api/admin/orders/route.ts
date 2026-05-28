import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const allowedStatuses = new Set([
  'received',
  'in_production',
  'shipped',
  'delivered',
  'cancelled',
])

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as {
    orderId?: string
    status?: string
  }

  if (!body.orderId || !body.status) {
    return NextResponse.json({ error: 'orderId and status required' }, { status: 400 })
  }

  if (!allowedStatuses.has(body.status)) {
    return NextResponse.json({ error: 'Invalid order status' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('Order')
    .update({
      status: body.status,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', body.orderId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ order: data })
}

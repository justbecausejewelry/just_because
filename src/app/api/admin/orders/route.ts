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

type OrderRow = {
  id: string
  [key: string]: unknown
}

type OrderItemRow = {
  orderId?: string | null
  [key: string]: unknown
}

export async function GET() {
  const { data: ordersData, error } = await supabase
    .from('Order')
    .select('*')
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Orders error:', error)
    return NextResponse.json({ error: error.message, orders: [] }, { status: 500 })
  }

  const { data: itemsData, error: itemsError } = await supabase
    .from('OrderItem')
    .select('*')

  if (itemsError) {
    console.error('Order items error:', itemsError)
  }

  const items = (itemsData || []) as OrderItemRow[]
  const orders = ((ordersData || []) as OrderRow[]).map((order) => ({
    ...order,
    items: items.filter((item) => item.orderId === order.id),
  }))

  return NextResponse.json({ orders })
}

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

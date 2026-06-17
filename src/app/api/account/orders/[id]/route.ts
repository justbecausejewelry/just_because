import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server/security'

type RouteContext = {
  params: Promise<{ id: string }>
}

type AccountOrder = {
  id: string
  userId?: string | null
  customerEmail?: string | null
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request)
  if ('error' in auth) return auth.error

  const { id } = await context.params
  const email = auth.user.email?.toLowerCase()

  const { data: order, error: orderError } = await auth.admin
    .from('Order')
    .select('*, OrderItem(*)')
    .eq('id', id)
    .maybeSingle()

  if (orderError) {
    console.error('[account-order-detail] order query failed:', orderError)
    return NextResponse.json({ error: 'Unable to load order' }, { status: 500 })
  }

  const typedOrder = order as AccountOrder | null
  const ownedByUser = typedOrder?.userId === auth.user.id
  const ownedByEmail = Boolean(email && typedOrder?.customerEmail?.toLowerCase() === email)

  if (!typedOrder || (!ownedByUser && !ownedByEmail)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: events, error: eventsError } = await auth.admin
    .from('order_events')
    .select('*')
    .eq('order_id', typedOrder.id)
    .order('created_at', { ascending: true })

  if (eventsError) {
    console.error('[account-order-detail] events query failed:', eventsError)
  }

  return NextResponse.json({
    order: typedOrder,
    events: eventsError ? [] : events || [],
  })
}

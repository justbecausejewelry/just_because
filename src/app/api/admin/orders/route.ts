import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendDeliveryEmail, sendShippingEmail } from '@/lib/emails/shippingEmail'
import { getCarrierLabel, getTrackingUrl, normalizeOrderStatus, type CarrierValue, type OrderStatus } from '@/lib/tracking'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const allowedStatuses = new Set<OrderStatus>([
  'received',
  'pending',
  'confirmed',
  'in_production',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
])

type OrderRow = {
  id: string
  orderNumber?: string | null
  customerName?: string | null
  customerEmail?: string | null
  status?: string | null
  [key: string]: unknown
}

type OrderItemRow = {
  id?: string | null
  orderId?: string | null
  productTitle?: string | null
  title?: string | null
  name?: string | null
  quantity?: number | null
  unitPrice?: number | null
  totalPrice?: number | null
  price?: number | null
  [key: string]: unknown
}

type OrderEventRow = {
  order_id?: string | null
  [key: string]: unknown
}

type PatchPayload = {
  orderId?: string
  status?: string
  carrier?: CarrierValue
  trackingNumber?: string
  estimatedDelivery?: string | null
  note?: string | null
}

function orderDisplayId(order: OrderRow) {
  return order.orderNumber || `JB-${order.id.slice(-6).toUpperCase()}`
}

function defaultMessage(status: OrderStatus, order: OrderRow, body: PatchPayload) {
  if (status === 'confirmed') return `Order ${orderDisplayId(order)} confirmed.`
  if (status === 'processing' || status === 'in_production') return 'Your jewelry is being prepared.'
  if (status === 'shipped') {
    const carrierLabel = getCarrierLabel(body.carrier)
    return body.note?.trim() || `Order shipped via ${carrierLabel}. Tracking: ${body.trackingNumber || ''}`.trim()
  }
  if (status === 'delivered') return `Order ${orderDisplayId(order)} delivered.`
  if (status === 'cancelled') return `Order ${orderDisplayId(order)} cancelled.`
  if (status === 'refunded') return `Order ${orderDisplayId(order)} refunded.`
  return `Order ${orderDisplayId(order)} updated.`
}

async function createOrderEvent({
  orderId,
  status,
  message,
  trackingNumber,
  carrier,
  trackingUrl,
}: {
  orderId: string
  status: OrderStatus
  message: string
  trackingNumber?: string | null
  carrier?: string | null
  trackingUrl?: string | null
}) {
  const { error } = await supabase
    .from('order_events')
    .insert({
      order_id: orderId,
      status,
      message,
      tracking_number: trackingNumber || null,
      carrier: carrier || null,
      tracking_url: trackingUrl || null,
      created_by: 'admin',
    })

  if (error) {
    console.error('Order event error:', error)
  }
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

  const { data: eventsData, error: eventsError } = await supabase
    .from('order_events')
    .select('*')
    .order('created_at', { ascending: true })

  if (eventsError) {
    console.error('Order events error:', eventsError)
  }

  const items = (itemsData || []) as OrderItemRow[]
  const events = (eventsData || []) as OrderEventRow[]
  const orders = ((ordersData || []) as OrderRow[]).map((order) => ({
    ...order,
    items: items.filter((item) => item.orderId === order.id),
    events: events.filter((event) => event.order_id === order.id),
  }))

  return NextResponse.json({ orders })
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as PatchPayload

  if (!body.orderId || !body.status) {
    return NextResponse.json({ error: 'orderId and status required' }, { status: 400 })
  }

  if (!allowedStatuses.has(body.status as OrderStatus)) {
    return NextResponse.json({ error: 'Invalid order status' }, { status: 400 })
  }

  const status = normalizeOrderStatus(body.status)

  if (status === 'shipped' && !body.trackingNumber?.trim()) {
    return NextResponse.json({ error: 'Tracking number is required to mark an order shipped' }, { status: 400 })
  }

  const { data: currentData, error: currentError } = await supabase
    .from('Order')
    .select('*')
    .eq('id', body.orderId)
    .maybeSingle()

  if (currentError || !currentData) {
    return NextResponse.json({ error: currentError?.message || 'Order not found' }, { status: 404 })
  }

  const currentOrder = currentData as OrderRow
  const trackingNumber = body.trackingNumber?.trim() || null
  const carrier = body.carrier || null
  const trackingUrl = status === 'shipped' && carrier && trackingNumber
    ? getTrackingUrl(carrier, trackingNumber)
    : null
  const now = new Date().toISOString()
  const patch: Record<string, string | null> = {
    status,
    updatedAt: now,
  }

  if (status === 'shipped') {
    patch.trackingNumber = trackingNumber
    patch.carrier = carrier
    patch.trackingUrl = trackingUrl
    patch.estimatedDelivery = body.estimatedDelivery || null
    patch.shippedAt = now
  }

  if (status === 'delivered') {
    patch.deliveredAt = now
  }

  const { data, error } = await supabase
    .from('Order')
    .update(patch)
    .eq('id', body.orderId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: itemsData, error: itemsError } = await supabase
    .from('OrderItem')
    .select('*')
    .eq('orderId', body.orderId)

  if (itemsError) {
    console.error('Order email items error:', itemsError)
  }

  const items = (itemsData || []) as OrderItemRow[]
  const message = defaultMessage(status, currentOrder, body)

  await createOrderEvent({
    orderId: body.orderId,
    status,
    message,
    trackingNumber,
    carrier,
    trackingUrl,
  })

  const updatedOrder = data as OrderRow

  if (status === 'shipped' && updatedOrder.customerEmail && trackingNumber && carrier && trackingUrl) {
    await sendShippingEmail({
      to: updatedOrder.customerEmail,
      customerName: updatedOrder.customerName || updatedOrder.customerEmail,
      orderNumber: orderDisplayId(updatedOrder),
      trackingNumber,
      carrier,
      trackingUrl,
      estimatedDelivery: body.estimatedDelivery || null,
      items,
      siteUrl: request.nextUrl.origin,
    })
  }

  if (status === 'delivered' && updatedOrder.customerEmail) {
    await sendDeliveryEmail({
      to: updatedOrder.customerEmail,
      customerName: updatedOrder.customerName || updatedOrder.customerEmail,
      orderNumber: orderDisplayId(updatedOrder),
      items,
      siteUrl: request.nextUrl.origin,
    })
  }

  return NextResponse.json({ order: updatedOrder })
}

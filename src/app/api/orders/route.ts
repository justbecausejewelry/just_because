import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

type OrderItemInput = {
  productId: string
  productTitle?: string
  selectedMetal?: string
  selectedCarat?: number
  selectedShape?: string
  selectedColor?: string
  selectedClarity?: string
  ringSize?: string
  engraving?: string
  quantity: number
  unitPrice: number
  totalPrice?: number
  priceBreakdown?: unknown
}

type CreatedOrder = {
  id: string
  orderNumber?: string | null
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    customerName: string
    customerEmail: string
    customerPhone?: string
    shippingAddress?: unknown
    items: OrderItemInput[]
    subtotal: number
    shippingAmount?: number
    shippingCost?: number
    taxAmount?: number
    userId?: string | null
    orderNumber?: string
    status?: string
    paymentMethod?: string
    paymentStatus?: string
    discount?: number
    total: number
    discountCode?: string
    discountAmount?: number
  }

  if (!body.customerEmail || !body.items?.length) {
    return NextResponse.json({ error: 'Missing customer or cart items.' }, { status: 400 })
  }

  const orderNumber = body.orderNumber || `JB-${Date.now().toString().slice(-6)}`

  const { data: order, error: orderError } = await supabase
    .from('Order')
    .insert({
      orderNumber,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      userId: body.userId || null,
      shippingAddress: body.shippingAddress,
      subtotal: body.subtotal,
      shippingAmount: body.shippingAmount || 0,
      shippingCost: body.shippingCost ?? body.shippingAmount ?? 0,
      taxAmount: body.taxAmount || 0,
      discount: body.discount || 0,
      discountAmount: body.discountAmount || 0,
      total: body.total,
      status: body.status || 'received',
      paymentMethod: body.paymentMethod || 'pending',
      paymentStatus: body.paymentStatus || 'pending',
      internalNotes: body.discountCode ? `Discount code: ${body.discountCode}` : null,
    })
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  const orderItems = body.items.map((item) => ({
    orderId: (order as CreatedOrder).id,
    productId: item.productId,
    productTitle: item.productTitle,
    selectedMetal: item.selectedMetal,
    selectedCarat: item.selectedCarat,
    selectedShape: item.selectedShape,
    selectedColor: item.selectedColor,
    selectedClarity: item.selectedClarity,
    ringSize: item.ringSize,
    engraving: item.engraving,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice ?? item.unitPrice * item.quantity,
    priceBreakdown: item.priceBreakdown,
  }))

  const { error: itemsError } = await supabase.from('OrderItem').insert(orderItems)

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({
    order,
    orderNumber: (order as CreatedOrder).orderNumber || orderNumber,
  })
}

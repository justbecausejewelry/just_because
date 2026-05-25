import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

type OrderItemInput = {
  productId: string
  selectedMetal?: string
  selectedCarat?: number
  selectedShape?: string
  selectedColor?: string
  selectedClarity?: string
  ringSize?: string
  engraving?: string
  quantity: number
  unitPrice: number
  priceBreakdown?: unknown
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
    taxAmount?: number
    total: number
    discountCode?: string
    discountAmount?: number
  }

  const orderNumber = `JB-${Date.now().toString(36).toUpperCase()}`

  const { data: order, error: orderError } = await supabase
    .from('Order')
    .insert({
      orderNumber,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      shippingAddress: body.shippingAddress,
      subtotal: body.subtotal,
      shippingAmount: body.shippingAmount || 0,
      taxAmount: body.taxAmount || 0,
      discountAmount: body.discountAmount || 0,
      total: body.total,
      status: 'received',
      internalNotes: body.discountCode ? `Discount code: ${body.discountCode}` : null,
    })
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  const orderItems = body.items.map((item) => ({
    orderId: order.id,
    productId: item.productId,
    selectedMetal: item.selectedMetal,
    selectedCarat: item.selectedCarat,
    selectedShape: item.selectedShape,
    selectedColor: item.selectedColor,
    selectedClarity: item.selectedClarity,
    ringSize: item.ringSize,
    engraving: item.engraving,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    priceBreakdown: item.priceBreakdown,
  }))

  const { error: itemsError } = await supabase.from('OrderItem').insert(orderItems)

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({ order, orderNumber: order.orderNumber })
}

import { NextResponse } from 'next/server'
import { buildOrderConfirmationEmailHtml } from '@/lib/email/templates/orderConfirmation'

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const html = buildOrderConfirmationEmailHtml({
    order: {
      id: 'ord_preview_284719',
      orderNumber: 'JB-284719',
      createdAt: new Date('2025-06-24T16:30:00.000Z'),
      subtotal: 6800,
      discountAmount: 300,
      shippingAmount: 0,
      taxAmount: 520,
      total: 7020,
      paymentStatus: 'paid',
      shippingAddress: {
        firstName: 'Priya',
        lastName: 'Mehta',
        addressLine1: '12 Pearl Avenue',
        city: 'New York',
        state: 'NY',
        zipCode: '10012',
        country: 'United States',
      },
    },
    customer: {
      fullName: 'Priya Mehta',
      email: 'priya@example.com',
      firstName: 'Priya',
    },
    items: [
      {
        title: 'Solis Diamond Ring',
        selectedMetal: 'white_gold',
        selectedCarat: 2,
        selectedShape: 'Round',
        ringSize: '7',
        engraving: 'Just Because',
        quantity: 1,
        unitPrice: 5200,
        totalPrice: 5200,
      },
      {
        title: 'Petit Diamant Necklace',
        selectedMetal: 'yellow_gold',
        selectedCarat: 0.5,
        quantity: 1,
        unitPrice: 1600,
        totalPrice: 1600,
      },
    ],
  })

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

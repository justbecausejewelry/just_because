import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendAdminOrderNotificationEmail } from '@/lib/email/templates/adminOrderNotification'
import { sendOrderConfirmationEmail } from '@/lib/email/templates/orderConfirmation'
import { CheckoutValidationError, computeCheckoutLines, computeDiscount } from '@/lib/server/orderPricing'
import { checkRateLimit, rateLimitResponse } from '@/lib/server/rateLimit'
import { requireUser } from '@/lib/server/security'
import { getAuthedUserOrGuest } from '@/lib/auth/getAuthedUserOrGuest'

const lineItemSchema = z.object({
  productId: z.string().min(1),
  productSlug: z.string().max(180).optional(),
  productTitle: z.string().max(180).optional(),
  productImage: z.string().max(1000).optional(),
  selectedMetal: z.string().max(80).optional(),
  selectedCarat: z.coerce.number().finite().positive().max(50).optional(),
  selectedShape: z.string().max(80).optional(),
  selectedColor: z.string().max(80).optional(),
  selectedClarity: z.string().max(80).optional(),
  ringSize: z.string().max(20).optional(),
  engraving: z.string().max(80).optional(),
  quantity: z.coerce.number().int().positive().max(10),
})

const orderSchema = z.object({
  customerName: z.string().trim().min(1).max(160),
  customerEmail: z.string().trim().email().max(254),
  customerPhone: z.string().trim().max(40).optional(),
  shippingAddress: z.object({
    firstName: z.string().trim().max(80).optional(),
    lastName: z.string().trim().max(80).optional(),
    addressLine1: z.string().trim().min(1).max(180),
    addressLine2: z.string().trim().max(180).optional(),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().min(1).max(100),
    zipCode: z.string().trim().min(1).max(30),
    country: z.string().trim().min(1).max(80),
    method: z.enum(['standard', 'express']).optional(),
  }),
  items: z.array(lineItemSchema).min(1).max(50),
  discountCode: z.string().trim().max(80).optional(),
})

type CreatedOrder = {
  id: string
  orderNumber?: string | null
  createdAt?: string | null
}

function normalizePersonName(value?: string | null) {
  return (value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function firstNameFromEmail(email?: string | null) {
  return normalizePersonName(
    email
      ?.split('@')[0]
      ?.split(/[._+-]/)[0]
  )
}

function normalizeCheckoutName(value: string, email?: string | null) {
  const normalized = normalizePersonName(value)
  const parts = normalized.split(/\s+/).filter(Boolean)
  if (parts.length >= 2 && parts[0].toLowerCase() === parts[parts.length - 1].toLowerCase()) {
    const emailFirstName = firstNameFromEmail(email)
    if (emailFirstName && emailFirstName.toLowerCase() !== parts[0].toLowerCase()) {
      return [emailFirstName, ...parts.slice(1)].join(' ')
    }
  }
  return normalized
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if ('error' in auth) return auth.error
  const identity = await getAuthedUserOrGuest(request)
  if (!identity.authed) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
  }

  const limit = checkRateLimit({
    key: `checkout:${auth.user.id}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  })
  if (!limit.ok) return rateLimitResponse(limit.resetAt)

  const parsed = orderSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return NextResponse.json({
      error: {
        code: 'INVALID_CHECKOUT_PAYLOAD',
        field: issue?.path.join('.') || 'checkout',
        message: issue?.message || 'Invalid checkout payload',
      },
    }, { status: 400 })
  }

  const userEmail = identity.email
  if (!userEmail || parsed.data.customerEmail.toLowerCase() !== userEmail) {
    return NextResponse.json({
      error: {
        code: 'EMAIL_MISMATCH',
        field: 'customerEmail',
        message: 'Checkout email must match the signed-in account.',
      },
    }, { status: 400 })
  }

  const { data: profile, error: profileError } = await auth.admin
    .from('UserProfile')
    .select('email_verified')
    .eq('userId', auth.user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[order-create] email verification profile query failed:', profileError)
    return NextResponse.json({
      error: {
        code: 'PROFILE_LOOKUP_FAILED',
        field: 'customerEmail',
        message: 'Unable to verify your account before checkout.',
      },
    }, { status: 500 })
  }

  const verifiedProfile = profile as { email_verified?: boolean | null } | null
  if (verifiedProfile?.email_verified !== true) {
    return NextResponse.json({
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        field: 'customerEmail',
        message: 'Please verify your email before placing an order.',
      },
    }, { status: 403 })
  }

  let computed
  let discount
  try {
    computed = await computeCheckoutLines(auth.admin, parsed.data.items)
    discount = await computeDiscount(auth.admin, parsed.data.discountCode, computed.subtotal)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to price checkout'
    if (error instanceof CheckoutValidationError) {
      return NextResponse.json({
        error: {
          code: error.code,
          field: error.field,
          message,
        },
      }, { status: 400 })
    }
    return NextResponse.json({
      error: {
        code: 'CHECKOUT_PRICING_FAILED',
        field: 'cart_items',
        message,
      },
    }, { status: 400 })
  }

  const shippingAmount = parsed.data.shippingAddress.method === 'express' ? 25 : 0
  const taxableSubtotal = Math.max(0, computed.subtotal - discount.amount)
  const taxAmount = Math.round(taxableSubtotal * 0.08)
  const total = taxableSubtotal + shippingAmount + taxAmount
  const orderNumber = `JB-${Date.now().toString().slice(-6)}`
  const normalizedCustomerName = normalizeCheckoutName(parsed.data.customerName, userEmail)
  const normalizedShippingName = normalizeCheckoutName(
    `${parsed.data.shippingAddress.firstName || ''} ${parsed.data.shippingAddress.lastName || ''}`,
    userEmail
  )
  const [normalizedShippingFirstName = '', ...normalizedShippingLastNameParts] = normalizedShippingName.split(/\s+/).filter(Boolean)
  const normalizedShippingLastName = normalizedShippingLastNameParts.join(' ')
  const normalizedShippingAddress = {
    ...parsed.data.shippingAddress,
    firstName: normalizedShippingFirstName || undefined,
    lastName: normalizedShippingLastName || undefined,
  }

  const { data: order, error: orderError } = await auth.admin
    .from('Order')
    .insert({
      orderNumber,
      customerName: normalizedCustomerName,
      customerEmail: userEmail,
      customerPhone: parsed.data.customerPhone || null,
      userId: auth.user.id,
      isGuest: false,
      guestEmail: null,
      guestName: null,
      shippingAddress: normalizedShippingAddress,
      subtotal: computed.subtotal,
      shippingAmount,
      taxAmount,
      discountAmount: discount.amount,
      total,
      status: 'confirmed',
      paymentMethod: 'pending',
      paymentStatus: 'pending',
      internalNotes: discount.code ? `Discount code: ${discount.code}` : null,
    })
    .select()
    .single()

  if (orderError) {
    console.error('[order-create] order insert failed:', orderError)
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  const orderId = (order as CreatedOrder).id
  const orderItems = computed.lines.map((item) => ({
    orderId,
    productId: item.productId,
    productTitle: item.productTitle,
    productImage: item.productImage,
    selectedMetal: item.selectedMetal,
    selectedCarat: item.selectedCarat,
    selectedShape: item.selectedShape,
    selectedColor: item.selectedColor,
    selectedClarity: item.selectedClarity,
    ringSize: item.ringSize,
    engraving: item.engraving,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    priceBreakdown: item.priceBreakdown,
  }))

  const { error: itemsError } = await auth.admin.from('OrderItem').insert(orderItems)
  if (itemsError) {
    console.error('[order-create] order item insert failed:', itemsError)
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  const emailPayload = {
    order: {
      id: orderId,
      orderNumber: (order as CreatedOrder).orderNumber || orderNumber,
      createdAt: (order as CreatedOrder).createdAt || new Date().toISOString(),
      subtotal: computed.subtotal,
      discountAmount: discount.amount,
      shippingAmount,
      taxAmount,
      total,
      paymentStatus: 'paid',
      shippingAddress: normalizedShippingAddress,
    },
    customer: {
      fullName: normalizedCustomerName,
      email: userEmail,
      firstName: normalizedCustomerName.split(/\s+/)[0],
    },
    items: computed.lines.map((item) => ({
      title: item.productTitle,
      selectedMetal: item.selectedMetal,
      selectedCarat: item.selectedCarat,
      selectedShape: item.selectedShape,
      selectedColor: item.selectedColor,
      selectedClarity: item.selectedClarity,
      ringSize: item.ringSize,
      engraving: item.engraving,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      productImage: item.productImage,
    })),
  }

  console.log('[order-create] sending customer order confirmation email:', {
    orderId,
    orderNumber: emailPayload.order.orderNumber,
    to: userEmail,
  })
  try {
    await sendOrderConfirmationEmail(emailPayload)
    console.log('[order-create] customer order confirmation email sent:', {
      orderId,
      orderNumber: emailPayload.order.orderNumber,
      to: userEmail,
    })
  } catch (error) {
    console.error('[order-create] customer order confirmation email failed:', error)
  }

  console.log('[order-create] sending admin order notification email:', {
    orderId,
    orderNumber: emailPayload.order.orderNumber,
    to: 'admin@justbecausejewelry.com',
  })
  try {
    await sendAdminOrderNotificationEmail(emailPayload)
    console.log('[order-create] admin order notification email sent:', {
      orderId,
      orderNumber: emailPayload.order.orderNumber,
      to: 'admin@justbecausejewelry.com',
    })
  } catch (error) {
    console.error('[order-create] admin order notification email failed:', error)
  }

  return NextResponse.json({
    order,
    orderNumber: (order as CreatedOrder).orderNumber || orderNumber,
    totals: {
      subtotal: computed.subtotal,
      discountAmount: discount.amount,
      shippingAmount,
      taxAmount,
      total,
    },
  })
}

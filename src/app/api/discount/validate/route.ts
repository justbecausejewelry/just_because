import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthedUserOrGuest } from '@/lib/auth/getAuthedUserOrGuest'
import { validateDiscountCode, type DiscountCartItem } from '@/lib/discountValidation'
import { CheckoutValidationError, computeCheckoutLines } from '@/lib/server/orderPricing'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rateLimit'
import { createServiceRoleClient } from '@/lib/server/security'

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

const validateSchema = z.object({
  code: z.string().trim().min(1).max(80),
  cartItems: z.array(lineItemSchema).min(1).max(50),
  country: z.string().trim().max(80).optional(),
})

export async function POST(request: NextRequest) {
  const admin = createServiceRoleClient()
  if (!admin) {
    return NextResponse.json({ error: 'Supabase environment is not configured' }, { status: 500 })
  }

  const identity = await getAuthedUserOrGuest(request)
  const ipAddress = getClientIp(request)
  const limit = checkRateLimit({
    key: `discount-validate:${identity.authed ? identity.userId : ipAddress}`,
    limit: 10,
    windowMs: 60 * 1000,
  })
  if (!limit.ok) return rateLimitResponse(limit.resetAt)

  const parsed = validateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({
      error: parsed.error.issues[0]?.message || 'Invalid discount payload',
      code: 'INVALID_PAYLOAD',
    }, { status: 400 })
  }

  try {
    const computed = await computeCheckoutLines(admin, parsed.data.cartItems)
    const cartItems: DiscountCartItem[] = computed.lines.map((line, index) => ({
      sourceProductId: parsed.data.cartItems[index]?.productId || line.productId || '',
      productId: line.productId,
      productTitle: line.productTitle,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      totalPrice: line.totalPrice,
    }))
    const result = await validateDiscountCode({
      supabase: admin,
      code: parsed.data.code,
      userId: identity.authed ? identity.userId : null,
      userEmail: identity.authed ? identity.email : null,
      cartItems,
      subtotal: computed.subtotal,
      ipAddress,
      country: parsed.data.country,
    })

    if (!result.valid) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: result.code === 'RATE_LIMITED' ? 429 : 400 })
    }

    return NextResponse.json({
      valid: true,
      code: result.discount.code,
      discount: result.discount,
      discountAmount: result.discount.discountAmount,
      freeShipping: result.discount.freeShipping,
      freeGift: result.discount.freeGift,
      applicableSubtotal: result.discount.applicableSubtotal,
      subtotal: computed.subtotal,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to validate discount code'
    if (error instanceof CheckoutValidationError) {
      return NextResponse.json({ error: message, code: error.code, field: error.field }, { status: 400 })
    }
    return NextResponse.json({ error: message, code: 'SERVER_ERROR' }, { status: 500 })
  }
}

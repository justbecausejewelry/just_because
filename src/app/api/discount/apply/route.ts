import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateDiscountCode, type DiscountCartItem } from '@/lib/discountValidation'
import { CheckoutValidationError, computeCheckoutLines, type CheckoutLineInput } from '@/lib/server/orderPricing'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rateLimit'
import { requireUser } from '@/lib/server/security'

type UserCartRow = {
  productId: string
  productSlug?: string | null
  productTitle?: string | null
  productImage?: string | null
  selectedMetal?: string | null
  selectedCarat?: number | null
  selectedShape?: string | null
  selectedColor?: string | null
  selectedClarity?: string | null
  ringSize?: string | null
  engraving?: string | null
  quantity?: number | null
}

const applySchema = z.object({
  code: z.string().trim().min(1).max(80),
  country: z.string().trim().max(80).optional(),
})

function cartRowToLine(row: UserCartRow): CheckoutLineInput {
  return {
    productId: row.productId,
    productSlug: row.productSlug || undefined,
    productTitle: row.productTitle || undefined,
    productImage: row.productImage || undefined,
    selectedMetal: row.selectedMetal || undefined,
    selectedCarat: row.selectedCarat || undefined,
    selectedShape: row.selectedShape || undefined,
    selectedColor: row.selectedColor || undefined,
    selectedClarity: row.selectedClarity || undefined,
    ringSize: row.ringSize || undefined,
    engraving: row.engraving || undefined,
    quantity: row.quantity || 1,
  }
}

async function loadCartDiscount(request: NextRequest) {
  const auth = await requireUser(request)
  if ('error' in auth) return auth

  const { data, error } = await auth.admin
    .from('CartDiscount')
    .select('*')
    .eq('userId', auth.user.id)
    .maybeSingle()

  if (error) {
    return {
      error: NextResponse.json({ error: 'Unable to load applied discount' }, { status: 500 }),
    }
  }

  return { auth, discount: data }
}

export async function GET(request: NextRequest) {
  const result = await loadCartDiscount(request)
  if ('error' in result) return result.error

  return NextResponse.json({ discount: result.discount || null })
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if ('error' in auth) return auth.error

  const ipAddress = getClientIp(request)
  const limit = checkRateLimit({
    key: `discount-apply:${auth.user.id}`,
    limit: 10,
    windowMs: 60 * 1000,
  })
  if (!limit.ok) return rateLimitResponse(limit.resetAt)

  const parsed = applySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid discount payload' }, { status: 400 })
  }

  const { data: cartData, error: cartError } = await auth.admin
    .from('UserCart')
    .select('productId,productSlug,productTitle,productImage,selectedMetal,selectedCarat,selectedShape,selectedColor,selectedClarity,ringSize,engraving,quantity')
    .eq('userId', auth.user.id)

  if (cartError) {
    return NextResponse.json({ error: 'Unable to load cart' }, { status: 500 })
  }

  const cartRows = (cartData || []) as UserCartRow[]
  if (!cartRows.length) {
    return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 })
  }

  try {
    const inputLines = cartRows.map(cartRowToLine)
    const computed = await computeCheckoutLines(auth.admin, inputLines)
    const cartItems: DiscountCartItem[] = computed.lines.map((line, index) => ({
      sourceProductId: inputLines[index]?.productId || line.productId || '',
      productId: line.productId,
      productTitle: line.productTitle,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      totalPrice: line.totalPrice,
    }))
    const result = await validateDiscountCode({
      supabase: auth.admin,
      code: parsed.data.code,
      userId: auth.user.id,
      userEmail: auth.user.email,
      cartItems,
      subtotal: computed.subtotal,
      ipAddress,
      country: parsed.data.country,
    })

    if (!result.valid) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: result.code === 'RATE_LIMITED' ? 429 : 400 })
    }

    const { error: saveError } = await auth.admin
      .from('CartDiscount')
      .upsert({
        userId: auth.user.id,
        discountCodeId: result.discount.id,
        code: result.discount.code,
        discountSnapshot: result.discount.snapshot,
        updatedAt: new Date().toISOString(),
      }, { onConflict: 'userId' })

    if (saveError) {
      return NextResponse.json({ error: 'Unable to apply discount code' }, { status: 500 })
    }

    return NextResponse.json({
      valid: true,
      code: result.discount.code,
      discount: result.discount,
      discountAmount: result.discount.discountAmount,
      freeShipping: result.discount.freeShipping,
      freeGift: result.discount.freeGift,
      subtotal: computed.subtotal,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to apply discount code'
    if (error instanceof CheckoutValidationError) {
      return NextResponse.json({ error: message, code: error.code, field: error.field }, { status: 400 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

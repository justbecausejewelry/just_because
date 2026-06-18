import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUserOrGuest } from '@/lib/auth/getAuthedUserOrGuest'
import { createServiceRoleClient } from '@/lib/server/security'

type DiscountCodeRow = {
  id: string
  code: string
  type?: string | null
  value?: number | null
  minOrderAmt?: number | null
  maxUses?: number | null
  maxUsesPerUser?: number | null
  firstTimeOnly?: boolean | null
  usedCount?: number | null
  expiresAt?: string | null
}

function isExpired(value?: string | null) {
  if (!value) return false
  const expiry = new Date(value.includes('T') ? value : `${value}T23:59:59.999`)
  return Number.isFinite(expiry.getTime()) && expiry.getTime() < Date.now()
}

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase environment is not configured' }, { status: 500 })
  }

  const body = (await request.json()) as { code?: string; subtotal?: number }
  const code = body.code?.trim().toUpperCase()
  const subtotal = body.subtotal || 0

  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('DiscountCode')
    .select('id,code,type,value,minOrderAmt,maxUses,maxUsesPerUser,firstTimeOnly,usedCount,expiresAt')
    .eq('code', code)
    .eq('isActive', true)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 404 })
  }

  const discount = data as DiscountCodeRow
  if (isExpired(discount.expiresAt)) {
    return NextResponse.json({ error: 'Code has expired' }, { status: 400 })
  }

  if (subtotal < Number(discount.minOrderAmt || 0)) {
    return NextResponse.json({ error: 'Minimum order amount not met' }, { status: 400 })
  }

  if (discount.maxUses !== null && discount.maxUses !== undefined && Number(discount.usedCount || 0) >= discount.maxUses) {
    return NextResponse.json({ error: 'Discount code usage limit reached' }, { status: 400 })
  }

  const requiresCustomerCheck = Boolean(discount.firstTimeOnly) || (
    discount.maxUsesPerUser !== null &&
    discount.maxUsesPerUser !== undefined
  )

  if (requiresCustomerCheck) {
    const identity = await getAuthedUserOrGuest(request)
    if (!identity.authed) {
      return NextResponse.json({ error: 'Please sign in to use this discount code' }, { status: 401 })
    }

    if (discount.firstTimeOnly) {
      const { count, error: orderCountError } = await supabase
        .from('Order')
        .select('id', { count: 'exact', head: true })
        .eq('userId', identity.userId)
        .neq('status', 'cancelled')

      if (orderCountError) {
        return NextResponse.json({ error: 'Unable to validate discount code' }, { status: 500 })
      }

      if ((count || 0) > 0) {
        return NextResponse.json({ error: 'This code is only for first-time customers' }, { status: 400 })
      }
    }

    if (discount.maxUsesPerUser !== null && discount.maxUsesPerUser !== undefined) {
      const { count, error: usageCountError } = await supabase
        .from('DiscountCodeUsage')
        .select('id', { count: 'exact', head: true })
        .eq('userId', identity.userId)
        .eq('discountCodeId', discount.id)

      if (usageCountError) {
        return NextResponse.json({ error: 'Unable to validate discount code' }, { status: 500 })
      }

      if ((count || 0) >= discount.maxUsesPerUser) {
        return NextResponse.json({ error: 'You have already used this code' }, { status: 400 })
      }
    }
  }

  const discountAmount =
    discount.type === 'percentage'
      ? Math.round((subtotal * Number(discount.value)) / 100)
      : Number(discount.value)

  return NextResponse.json({
    code: discount.code,
    discountAmount: Math.min(discountAmount, subtotal),
  })
}

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { code?: string; subtotal?: number }
  const code = body.code?.trim().toUpperCase()
  const subtotal = body.subtotal || 0

  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('DiscountCode')
    .select('*')
    .eq('code', code)
    .eq('isActive', true)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 404 })
  }

  if (data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Code has expired' }, { status: 400 })
  }

  if (subtotal < Number(data.minOrderAmt || 0)) {
    return NextResponse.json({ error: 'Minimum order amount not met' }, { status: 400 })
  }

  const discountAmount =
    data.type === 'percentage'
      ? Math.round((subtotal * Number(data.value)) / 100)
      : Number(data.value)

  return NextResponse.json({
    code: data.code,
    discountAmount: Math.min(discountAmount, subtotal),
  })
}

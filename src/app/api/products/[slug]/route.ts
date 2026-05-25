import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data: product, error } = await supabase
    .from('Product')
    .select('*')
    .eq('slug', slug)
    .eq('isActive', true)
    .single()

  if (error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const { data: reviews } = await supabase
    .from('Review')
    .select('*')
    .eq('productId', product.id)
    .eq('isApproved', true)
    .order('createdAt', { ascending: false })

  return NextResponse.json({ product, reviews: reviews || [] })
}

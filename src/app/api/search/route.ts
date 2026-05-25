import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

type SearchProduct = {
  id: string
  title: string
  slug: string
  category: string
  productType: string
  basePrice: number
  images: string[] | null
  isActive: boolean
}

type SearchDiamond = {
  id: string
  shape: string
  carat: number
  color: string
  clarity: string
  price: number
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim().toLowerCase()
  const limit = Number.parseInt(searchParams.get('limit') || '8', 10)

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const safeQuery = query.replace(/[%_,]/g, ' ')

  const { data: products } = await supabase
    .from('Product')
    .select('id, title, slug, category, productType, basePrice, images, isActive')
    .eq('isActive', true)
    .or(
      `title.ilike.%${safeQuery}%,` +
        `category.ilike.%${safeQuery}%,` +
        `productType.ilike.%${safeQuery}%,` +
        `description.ilike.%${safeQuery}%`
    )
    .limit(limit)
    .returns<SearchProduct[]>()

  const diamondKeywords = [
    'round',
    'oval',
    'cushion',
    'princess',
    'emerald',
    'pear',
    'marquise',
    'heart',
    'asscher',
    'diamond',
    'carat',
  ]
  const isDiamondSearch = diamondKeywords.some((keyword) => query.includes(keyword))

  let diamonds: SearchDiamond[] = []
  if (isDiamondSearch) {
    const { data } = await supabase
      .from('Diamond')
      .select('id, shape, carat, color, clarity, price')
      .eq('isAvailable', true)
      .ilike('shape', `%${safeQuery}%`)
      .limit(4)
      .returns<SearchDiamond[]>()
    diamonds = data || []
  }

  const scoredProducts = (products || [])
    .map((product) => ({
      ...product,
      score: product.title.toLowerCase().startsWith(query) ? 2 : 1,
      type: 'product' as const,
    }))
    .sort((a, b) => b.score - a.score)

  return NextResponse.json({
    results: scoredProducts,
    diamonds,
    query,
    total: scoredProducts.length,
  })
}

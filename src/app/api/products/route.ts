import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TYPE_MAP: Record<string, string[]> = {
  engagement_ring: ['engagement_ring'],
  engagement_rings: ['engagement_ring'],
  engagement: ['engagement_ring'],
  ring: ['ring', 'wedding_ring', 'engagement_ring'],
  rings: ['ring', 'wedding_ring', 'engagement_ring'],
  wedding_ring: ['wedding_ring'],
  wedding: ['wedding_ring'],
  necklace: ['necklace', 'tennis_necklace', 'pendant'],
  necklaces: ['necklace', 'tennis_necklace', 'pendant'],
  earring: ['earring', 'stud'],
  earrings: ['earring', 'stud'],
  bracelet: ['bracelet', 'tennis_bracelet', 'bangle'],
  bracelets: ['bracelet', 'tennis_bracelet', 'bangle'],
  pendant: ['pendant', 'necklace'],
  pendants: ['pendant'],
  diamond: ['diamond'],
  diamonds: ['diamond'],
}

type MetalPricingEntry = {
  enabled?: boolean
  modifier?: number
}

type ProductRow = {
  title?: string | null
  description?: string | null
  productType?: string | null
  category?: string | null
  availableMetals?: string[] | null
  availableShapes?: string[] | null
  metalPricing?: Record<string, MetalPricingEntry> | null
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function getTypeDbValues(value: string) {
  const normalized = normalizeToken(value)
  const singular = normalized.replace(/s$/, '')
  return TYPE_MAP[normalized] || TYPE_MAP[singular] || [singular || normalized]
}

function productMatchesMetal(product: ProductRow, metal: string) {
  const selected = normalizeToken(metal)
  const availableMetals = product.availableMetals || []
  const pricingMetals = Object.keys(product.metalPricing || {})

  return [...availableMetals, ...pricingMetals].some((item) => {
    const normalized = normalizeToken(item)
    return normalized === selected || normalized.includes(selected) || selected.includes(normalized)
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const featured = searchParams.get('featured')
  const type = searchParams.get('type')
  const category = searchParams.get('category')
  const shape = searchParams.get('shape')
  const metal = searchParams.get('metal')
  const search = searchParams.get('q')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const sort = searchParams.get('sort') || 'featured'
  const limit = Number.parseInt(searchParams.get('limit') || '20')
  const offset = Number.parseInt(searchParams.get('offset') || '0')

  let query = supabase
    .from('Product')
    .select('*')
    .eq('isActive', true)

  if (featured === 'true') {
    query = query.eq('isFeatured', true)
  }

  if (type) {
    const dbTypes = getTypeDbValues(type)
    query = query.or(dbTypes.map((dbType) => `productType.eq.${dbType}`).join(','))
  }

  if (category && !type) {
    const cleanCategory = normalizeToken(category)
    const singularCategory = cleanCategory.replace(/s$/, '')
    const dbTypes = TYPE_MAP[cleanCategory] || TYPE_MAP[singularCategory]
    if (dbTypes) {
      query = query.or(dbTypes.map((dbType) => `productType.eq.${dbType}`).join(','))
    } else {
      query = query.eq('category', cleanCategory)
    }
  }

  if (minPrice) {
    query = query.gte('basePrice', Number(minPrice))
  }

  if (maxPrice) {
    query = query.lte('basePrice', Number(maxPrice))
  }

  if (sort === 'price_low' || sort === 'price-asc') {
    query = query.order('basePrice', { ascending: true })
  } else if (sort === 'price_high' || sort === 'price-desc') {
    query = query.order('basePrice', { ascending: false })
  } else if (sort === 'newest') {
    query = query.order('createdAt', { ascending: false })
  } else {
    query = query
      .order('isFeatured', { ascending: false })
      .order('sortOrder', { ascending: true })
      .order('createdAt', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let products = (data || []) as ProductRow[]

  if (shape) {
    const cleanShape = normalizeToken(shape)
    products = products.filter((product) =>
      product.availableShapes?.some((item) => normalizeToken(item) === cleanShape)
    )
  }

  if (metal) {
    products = products.filter((product) => productMatchesMetal(product, metal))
  }

  if (search) {
    const cleanSearch = search.toLowerCase()
    products = products.filter((product) =>
      [
        product.title || '',
        product.description || '',
        product.category || '',
        product.productType || '',
      ].some((value) => value.toLowerCase().includes(cleanSearch))
    )
  }

  return NextResponse.json({
    products: products.slice(offset, offset + limit),
    totalCount: products.length,
  })
}

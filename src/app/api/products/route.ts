import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getGeneralErrorMessage } from '@/lib/errors'

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
  id?: string | null
  title?: string | null
  description?: string | null
  productType?: string | null
  category?: string | null
  basePrice?: number | null
  images?: string[] | null
  metalImages?: unknown
  availableMetals?: string[] | null
  availableShapes?: string[] | null
  metalPricing?: Record<string, MetalPricingEntry> | null
  isBestSeller?: boolean | null
  isFeatured?: boolean | null
  isNewArrival?: boolean | null
  isGift?: boolean | null
  collections?: string[] | null
}

type ProductLoadResult =
  | {
      products: ProductRow[]
      totalCount: number
    }
  | {
      error: {
        message: string
      }
    }

const BROKEN_UNSPLASH_IMAGE_ID = 'photo-1573408301185'
const PRODUCT_IMAGE_FALLBACK = '/images/hero-ring.jpg'
const PRODUCT_TYPE_CATEGORY_MAP: Record<string, string> = {
  engagement_ring: 'engagement_ring',
  wedding_ring: 'wedding_ring',
}
const COLLECTION_COLUMNS = ['isBestSeller', 'isGift', 'collections']

function getMissingColumn(message: string) {
  const quotedColumn = message.match(/'([^']+)' column/)
  if (quotedColumn?.[1]) {
    return quotedColumn[1]
  }

  const schemaCacheColumn = message.match(/Could not find the '([^']+)' column/)
  if (schemaCacheColumn?.[1]) {
    return schemaCacheColumn[1]
  }

  const postgresColumn = message.match(/column Product\.([A-Za-z0-9_]+) does not exist/)
  return postgresColumn?.[1] || null
}

function isMissingCollectionColumn(message: string) {
  const missingColumn = getMissingColumn(message)
  return COLLECTION_COLUMNS.includes(missingColumn || '')
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

function replaceBrokenImageValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.includes(BROKEN_UNSPLASH_IMAGE_ID) ? PRODUCT_IMAGE_FALLBACK : value
  }

  if (Array.isArray(value)) {
    return value.map(replaceBrokenImageValue)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, replaceBrokenImageValue(nestedValue)])
    )
  }

  return value
}

function sanitizeProductImages(product: ProductRow): ProductRow {
  return {
    ...product,
    images: replaceBrokenImageValue(product.images) as string[] | null | undefined,
    metalImages: replaceBrokenImageValue(product.metalImages),
  }
}

async function loadProducts(request: NextRequest, useCollectionFields: boolean): Promise<ProductLoadResult> {
  const { searchParams } = new URL(request.url)
  const featured = searchParams.get('featured')
  const bestSeller = searchParams.get('bestSeller')
  const newArrival = searchParams.get('newArrival')
  const gift = searchParams.get('gift')
  const collection = searchParams.get('collection')
  const exclude = searchParams.get('exclude')
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

  if (!useCollectionFields && (bestSeller === 'true' || gift === 'true' || collection)) {
    return { products: [], totalCount: 0 }
  }

  let query = supabase
    .from('Product')
    .select('*')
    .eq('isActive', true)

  if (featured === 'true') {
    query = useCollectionFields
      ? query.or('isBestSeller.eq.true,isFeatured.eq.true')
      : query.eq('isFeatured', true)
  }

  if (useCollectionFields && bestSeller === 'true') {
    query = query.eq('isBestSeller', true)
  }

  if (newArrival === 'true') {
    query = query.eq('isNewArrival', true)
  }

  if (useCollectionFields && gift === 'true') {
    query = query.eq('isGift', true)
  }

  if (useCollectionFields && collection) {
    query = query.contains('collections', [normalizeToken(collection)])
  }

  if (exclude) {
    query = query.neq('id', exclude).neq('slug', exclude)
  }

  if (type) {
    const dbTypes = getTypeDbValues(type)
    query = query.or(dbTypes.map((dbType) => `productType.eq.${dbType}`).join(','))
  }

  if (category) {
    const cleanCategory = normalizeToken(category)
    const productTypeCategory = PRODUCT_TYPE_CATEGORY_MAP[cleanCategory]
    query = productTypeCategory
      ? query.eq('productType', productTypeCategory)
      : query.eq('category', cleanCategory)
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
  } else if (sort === 'newest' || sort === 'new') {
    query = query.order('createdAt', { ascending: false })
  } else {
    if (useCollectionFields) {
      query = query.order('isBestSeller', { ascending: false })
    }

    query = query
      .order('isFeatured', { ascending: false })
      .order('sortOrder', { ascending: true })
      .order('createdAt', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    return { error: { message: error.message } }
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

  if (useCollectionFields && bestSeller === 'priority') {
    products = [...products].sort((left, right) => Number(Boolean(right.isBestSeller)) - Number(Boolean(left.isBestSeller)))
  }

  return {
    products: products.slice(offset, offset + limit).map(sanitizeProductImages),
    totalCount: products.length,
  }
}

export async function GET(request: NextRequest) {
  const result = await loadProducts(request, true)

  if ('error' in result) {
    if (isMissingCollectionColumn(result.error.message)) {
      const fallback = await loadProducts(request, false)
      if (!('error' in fallback)) {
        return NextResponse.json({
          ...fallback,
          omittedColumns: [getMissingColumn(result.error.message)],
        })
      }

      console.error('[api/products] fallback load failed:', fallback.error)
      return NextResponse.json({ error: getGeneralErrorMessage(fallback.error) }, { status: 500 })
    }

    console.error('[api/products] load failed:', result.error)
    return NextResponse.json({ error: getGeneralErrorMessage(result.error) }, { status: 500 })
  }

  return NextResponse.json(result)
}

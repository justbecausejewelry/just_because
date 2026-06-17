import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { normalizeMetalSelection, normalizeToken } from '@/config/productOptions'

type ModifierMap = Record<string, { enabled?: boolean; modifier?: number }>

type ProductPricing = {
  basePrice: number
  metalPricing?: unknown
  caratPricing?: unknown
  shapePricing?: unknown
  colorPricing?: unknown
  clarityPricing?: unknown
}

type PriceSelections = {
  metal?: string
  carat?: number
  shape?: string
  color?: string
  clarity?: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getModifier(pricing: unknown, key?: string | number) {
  if (key === undefined || key === null || typeof pricing !== 'object' || pricing === null) {
    return 0
  }

  const modifiers = pricing as ModifierMap
  const lookupKey = String(key)
  const normalizedKey = normalizeMetalSelection(lookupKey) || normalizeToken(lookupKey)
  const matchedKey = Object.keys(modifiers).find((candidate) => {
    const normalizedCandidate = normalizeMetalSelection(candidate) || normalizeToken(candidate)
    return candidate === lookupKey || normalizedCandidate === normalizedKey
  })
  const value = matchedKey ? modifiers[matchedKey] : undefined
  if (!value?.enabled) {
    return 0
  }

  return typeof value.modifier === 'number' ? value.modifier : 0
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    productId?: string
    selections?: PriceSelections
  }

  if (!body.productId) {
    return NextResponse.json({ error: 'Product id is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('Product')
    .select('*')
    .eq('id', body.productId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const product = data as ProductPricing
  const selections = body.selections || {}
  const metalMod = getModifier(product.metalPricing, selections.metal)
  const caratMod = getModifier(product.caratPricing, selections.carat)
  const shapeMod = getModifier(product.shapePricing, selections.shape)
  const colorMod = getModifier(product.colorPricing, selections.color)
  const clarityMod = getModifier(product.clarityPricing, selections.clarity)

  const breakdown = {
    base: product.basePrice,
    metal: metalMod,
    carat: caratMod,
    shape: shapeMod,
    color: colorMod,
    clarity: clarityMod,
  }

  const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0)

  return NextResponse.json({
    breakdown,
    total,
    formatted: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(total),
  })
}

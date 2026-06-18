import type { SupabaseClient } from '@supabase/supabase-js'
import {
  LOOSE_DIAMOND_VALUE,
  metalMatches,
  normalizeDiamondClarity,
  normalizeDiamondColor,
  normalizeDiamondShape,
  normalizeMetalSelection,
  normalizeToken,
  optionMatches,
} from '@/config/productOptions'

type ModifierMap = Record<string, { enabled?: boolean; modifier?: number }>

export type CheckoutLineInput = {
  productId: string
  productSlug?: string
  productTitle?: string
  productImage?: string
  selectedMetal?: string
  selectedCarat?: number
  selectedShape?: string
  selectedColor?: string
  selectedClarity?: string
  ringSize?: string
  engraving?: string
  quantity: number
}

export type ComputedLine = {
  productId: string | null
  productTitle: string
  productImage: string | null
  selectedMetal?: string
  selectedCarat?: number
  selectedShape?: string
  selectedColor?: string
  selectedClarity?: string
  ringSize?: string
  engraving?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  priceBreakdown: {
    base: number
    metal: number
    carat: number
    shape: number
    color: number
    clarity: number
  }
}

type ProductRow = {
  id: string
  productType?: string | null
  category?: string | null
  title?: string | null
  images?: string[] | null
  basePrice?: number | null
  pricePerCarat?: number | null
  defaultCarat?: number | null
  metalPricing?: unknown
  caratPricing?: unknown
  shapePricing?: unknown
  colorPricing?: unknown
  clarityPricing?: unknown
  availableMetals?: string[] | null
  availableCarats?: number[] | null
  availableShapes?: string[] | null
  availableColors?: string[] | null
  availableClarities?: string[] | null
  availableSizes?: string[] | null
}

type DiamondRow = {
  id: string
  shape?: string | null
  carat?: number | null
  color?: string | null
  clarity?: string | null
  price?: number | null
  imageUrl?: string | null
  isAvailable?: boolean | null
}

type DiscountRow = {
  id: string
  code: string
  type?: string | null
  value?: number | null
  minOrderAmt?: number | null
  maxUses?: number | null
  maxUsesPerUser?: number | null
  firstTimeOnly?: boolean | null
  usedCount?: number | null
  isActive?: boolean | null
  expiresAt?: string | null
}

const RING_SIZES = [
  '3', '3.5', '4', '4.5', '5', '5.5',
  '6', '6.5', '7', '7.5', '8', '8.5',
  '9', '9.5', '10', '10.5', '11', '11.5',
  '12', '12.5', '13',
]

export class CheckoutValidationError extends Error {
  code: string
  field: string

  constructor(code: string, field: string, message: string) {
    super(message)
    this.name = 'CheckoutValidationError'
    this.code = code
    this.field = field
  }
}

function getModifier(pricing: unknown, key?: string | number) {
  if (key === undefined || key === null || typeof pricing !== 'object' || pricing === null) {
    return 0
  }

  const map = pricing as ModifierMap
  const stringKey = String(key)
  const normalizedMetal = normalizeMetalSelection(stringKey)
  const normalizedToken = normalizeToken(stringKey)
  const matchedKey = Object.keys(map).find((candidate) => (
    candidate === stringKey ||
    (normalizedMetal && normalizeMetalSelection(candidate) === normalizedMetal) ||
    (normalizedToken && normalizeToken(candidate) === normalizedToken)
  ))
  const value = matchedKey ? map[matchedKey] : undefined
  if (!value?.enabled) return 0
  return typeof value.modifier === 'number' && Number.isFinite(value.modifier) ? value.modifier : 0
}

function includesValue(values: string[] | number[] | null | undefined, value: string | number | undefined, matcher?: (left: string, right: string) => boolean) {
  if (value === undefined || value === null || !values?.length) return true
  const selected = String(value)
  if (values.map(String).includes(selected)) return true
  if (!matcher) return false
  return values.map(String).some((candidate) => matcher(candidate, selected))
}

function hasOptions(values: string[] | number[] | null | undefined) {
  return Array.isArray(values) && values.length > 0
}

function assertAllowed(condition: boolean, code: string, field: string, message: string) {
  if (!condition) throw new CheckoutValidationError(code, field, message)
}

function productImage(product: ProductRow) {
  return Array.isArray(product.images) ? product.images[0] || null : null
}

function isRingProduct(product: ProductRow) {
  const type = (product.productType || '').toLowerCase()
  const category = (product.category || '').toLowerCase()
  return ['engagement_ring', 'wedding_ring', 'ring'].includes(type) || category === 'engagement' || category === 'wedding'
}

function supportsShapeSelection(product: ProductRow) {
  return isRingProduct(product) || (product.productType || '').toLowerCase() === 'diamond'
}

function itemField(index: number, field: string) {
  return `cart_items[${index}].${field}`
}

function isDiscountExpired(value?: string | null) {
  if (!value) return false
  const expiry = new Date(value.includes('T') ? value : `${value}T23:59:59.999`)
  return Number.isFinite(expiry.getTime()) && expiry.getTime() < Date.now()
}

async function enforceDiscountCustomerLimits(admin: SupabaseClient, discount: DiscountRow, userId?: string) {
  const requiresCustomerCheck = Boolean(discount.firstTimeOnly) || (
    discount.maxUsesPerUser !== null &&
    discount.maxUsesPerUser !== undefined
  )
  if (!requiresCustomerCheck) return

  if (!userId) {
    throw new Error('Please sign in to use this discount code')
  }

  if (discount.firstTimeOnly) {
    const { count, error } = await admin
      .from('Order')
      .select('id', { count: 'exact', head: true })
      .eq('userId', userId)
      .neq('status', 'cancelled')

    if (error) throw new Error('Unable to validate discount code')
    if ((count || 0) > 0) {
      throw new Error('This code is only for first-time customers')
    }
  }

  if (discount.maxUsesPerUser !== null && discount.maxUsesPerUser !== undefined) {
    const { count, error } = await admin
      .from('DiscountCodeUsage')
      .select('id', { count: 'exact', head: true })
      .eq('userId', userId)
      .eq('discountCodeId', discount.id)

    if (error) throw new Error('Unable to validate discount code')
    if ((count || 0) >= discount.maxUsesPerUser) {
      throw new Error('You have already used this code')
    }
  }
}

async function computeProductLine(admin: SupabaseClient, item: CheckoutLineInput, index: number): Promise<ComputedLine> {
  const { data, error } = await admin
    .from('Product')
    .select('id,productType,category,title,images,basePrice,pricePerCarat,defaultCarat,metalPricing,caratPricing,shapePricing,colorPricing,clarityPricing,availableMetals,availableCarats,availableShapes,availableColors,availableClarities,availableSizes')
    .eq('id', item.productId)
    .maybeSingle()

  if (error || !data) throw new Error('Product not found')

  const product = data as ProductRow
  const selectedMetal = normalizeMetalSelection(item.selectedMetal)
  const selectedShape = normalizeDiamondShape(item.selectedShape) || item.selectedShape
  const selectedColor = normalizeDiamondColor(item.selectedColor) || item.selectedColor
  const selectedClarity = normalizeDiamondClarity(item.selectedClarity) || item.selectedClarity
  const ringProduct = isRingProduct(product)
  const shapeProduct = supportsShapeSelection(product)
  const selectedCarat = ringProduct ? undefined : item.selectedCarat
  const lineSelectedShape = shapeProduct ? selectedShape : undefined
  const hasMetalOptions = hasOptions(product.availableMetals)
  const hasCaratOptions = hasOptions(product.availableCarats)
  const hasShapeOptions = hasOptions(product.availableShapes)
  const hasColorOptions = hasOptions(product.availableColors)
  const hasClarityOptions = hasOptions(product.availableClarities)
  const hasSizeOptions = ringProduct || hasOptions(product.availableSizes)

  if (hasMetalOptions) {
    assertAllowed(Boolean(selectedMetal), 'INVALID_METAL', itemField(index, 'selectedMetal'), 'Selected metal is not available')
    assertAllowed(includesValue(product.availableMetals, selectedMetal, metalMatches), 'INVALID_METAL', itemField(index, 'selectedMetal'), 'Selected metal is not available')
  }

  if (!ringProduct && hasCaratOptions) {
    assertAllowed(selectedCarat !== undefined, 'INVALID_CARAT', itemField(index, 'selectedCarat'), 'Please select a carat for this product')
    assertAllowed(includesValue(product.availableCarats, selectedCarat), 'INVALID_CARAT', itemField(index, 'selectedCarat'), `${selectedCarat}ct is not available for this product`)
  }

  if (shapeProduct && hasShapeOptions && selectedShape !== undefined && selectedShape !== null && selectedShape !== '') {
    assertAllowed(includesValue(product.availableShapes, selectedShape, optionMatches), 'INVALID_SHAPE', itemField(index, 'selectedShape'), 'Selected shape is not available')
  }

  if (hasColorOptions && selectedColor !== undefined && selectedColor !== null && selectedColor !== '') {
    assertAllowed(includesValue(product.availableColors, selectedColor, (left, right) => left.toUpperCase() === right.toUpperCase()), 'INVALID_COLOR', itemField(index, 'selectedColor'), 'Selected color is not available')
  }

  if (hasClarityOptions && selectedClarity !== undefined && selectedClarity !== null && selectedClarity !== '') {
    assertAllowed(includesValue(product.availableClarities, selectedClarity, (left, right) => left.toUpperCase() === right.toUpperCase()), 'INVALID_CLARITY', itemField(index, 'selectedClarity'), 'Selected clarity is not available')
  }

  if (hasSizeOptions && item.ringSize !== undefined && item.ringSize !== null) {
    assertAllowed(includesValue(ringProduct ? RING_SIZES : product.availableSizes, item.ringSize), 'INVALID_SIZE', itemField(index, 'ringSize'), 'Selected size is not available')
  }

  const base = Number(product.basePrice || 0)
  const configuredCaratModifier = ringProduct ? 0 : getModifier(product.caratPricing, selectedCarat)
  const caratDelta = !ringProduct && selectedCarat && !configuredCaratModifier
    ? Math.max(0, selectedCarat - Number(product.defaultCarat || 0)) * Number(product.pricePerCarat || 300)
    : configuredCaratModifier

  const breakdown = {
    base,
    metal: getModifier(product.metalPricing, selectedMetal),
    carat: caratDelta,
    shape: getModifier(product.shapePricing, lineSelectedShape),
    color: getModifier(product.colorPricing, selectedColor),
    clarity: getModifier(product.clarityPricing, selectedClarity),
  }
  const unitPrice = Math.round(Object.values(breakdown).reduce((sum, value) => sum + value, 0))

  return {
    productId: product.id,
    productTitle: product.title || item.productTitle || 'Just Because piece',
    productImage: productImage(product) || item.productImage || null,
    selectedMetal,
    selectedCarat,
    selectedShape: lineSelectedShape,
    selectedColor,
    selectedClarity,
    ringSize: item.ringSize,
    engraving: item.engraving,
    quantity: item.quantity,
    unitPrice,
    totalPrice: unitPrice * item.quantity,
    priceBreakdown: breakdown,
  }
}

async function computeDiamondLine(admin: SupabaseClient, item: CheckoutLineInput, index: number): Promise<ComputedLine> {
  const { data, error } = await admin
    .from('Diamond')
    .select('id,shape,carat,color,clarity,price,imageUrl,isAvailable')
    .eq('id', item.productId)
    .maybeSingle()

  if (error || !data) throw new Error('Diamond not found')
  const diamond = data as DiamondRow
  assertAllowed(diamond.isAvailable !== false, 'DIAMOND_UNAVAILABLE', itemField(index, 'productId'), 'Diamond is no longer available')

  const unitPrice = Math.round(Number(diamond.price || 0))
  return {
    productId: null,
    productTitle: item.productTitle || `${diamond.carat || item.selectedCarat || ''}ct ${diamond.shape || item.selectedShape || ''} Diamond`.trim(),
    productImage: diamond.imageUrl || item.productImage || null,
    selectedMetal: LOOSE_DIAMOND_VALUE,
    selectedCarat: Number(diamond.carat || item.selectedCarat || 0),
    selectedShape: diamond.shape || item.selectedShape,
    selectedColor: diamond.color || item.selectedColor,
    selectedClarity: diamond.clarity || item.selectedClarity,
    ringSize: item.ringSize,
    engraving: item.engraving,
    quantity: item.quantity,
    unitPrice,
    totalPrice: unitPrice * item.quantity,
    priceBreakdown: {
      base: unitPrice,
      metal: 0,
      carat: 0,
      shape: 0,
      color: 0,
      clarity: 0,
    },
  }
}

export async function computeCheckoutLines(admin: SupabaseClient, items: CheckoutLineInput[]) {
  const lines = await Promise.all(
    items.map((item, index) =>
      normalizeMetalSelection(item.selectedMetal) === LOOSE_DIAMOND_VALUE
        ? computeDiamondLine(admin, item, index)
        : computeProductLine(admin, item, index)
    )
  )
  const subtotal = lines.reduce((sum, line) => sum + line.totalPrice, 0)
  return { lines, subtotal }
}

export async function computeDiscount(admin: SupabaseClient, code: string | undefined, subtotal: number, userId?: string) {
  const normalizedCode = code?.trim().toUpperCase()
  if (!normalizedCode) return { id: null, code: null, amount: 0 }

  const { data, error } = await admin
    .from('DiscountCode')
    .select('id,code,type,value,minOrderAmt,maxUses,maxUsesPerUser,firstTimeOnly,usedCount,isActive,expiresAt')
    .eq('code', normalizedCode)
    .eq('isActive', true)
    .maybeSingle()

  if (error || !data) throw new Error('Invalid discount code')

  const discount = data as DiscountRow
  if (isDiscountExpired(discount.expiresAt)) {
    throw new Error('Discount code has expired')
  }
  if (subtotal < Number(discount.minOrderAmt || 0)) {
    throw new Error('Minimum order amount not met')
  }
  if (discount.maxUses !== null && discount.maxUses !== undefined && Number(discount.usedCount || 0) >= discount.maxUses) {
    throw new Error('Discount code usage limit reached')
  }
  await enforceDiscountCustomerLimits(admin, discount, userId)

  const rawAmount = discount.type === 'percentage'
    ? Math.round((subtotal * Number(discount.value || 0)) / 100)
    : Number(discount.value || 0)

  return {
    id: discount.id,
    code: discount.code,
    amount: Math.max(0, Math.min(Math.round(rawAmount), subtotal)),
  }
}

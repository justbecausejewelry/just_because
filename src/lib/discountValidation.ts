import type { SupabaseClient } from '@supabase/supabase-js'

export type DiscountType = 'percentage' | 'fixed' | 'free_shipping' | 'free_gift'
export type DiscountAppliesTo = 'all' | 'specific_products' | 'specific_categories' | 'specific_types'
export type DiscountCustomerSegment = 'all' | 'new' | 'returning' | 'vip' | 'win_back' | 'specific_emails'
export type DiscountValidationCode =
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'INACTIVE'
  | 'NOT_YET_ACTIVE'
  | 'EXPIRED'
  | 'MAXED_OUT'
  | 'USER_LIMIT'
  | 'SEGMENT_INVALID'
  | 'NOT_ELIGIBLE'
  | 'MIN_NOT_MET'
  | 'MIN_ITEMS_NOT_MET'
  | 'NO_APPLICABLE_ITEMS'
  | 'INVALID_CONFIG'
  | 'SERVER_ERROR'

export type DiscountCartItem = {
  sourceProductId: string
  productId: string | null
  productTitle: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category?: string | null
  productType?: string | null
  isSaleItem?: boolean | null
}

export type ValidationInput = {
  supabase: SupabaseClient
  code: string
  userId?: string | null
  userEmail?: string | null
  cartItems: DiscountCartItem[]
  subtotal: number
  ipAddress: string
  country?: string | null
  logAttempts?: boolean
  now?: Date
}

export type ValidDiscount = {
  id: string
  code: string
  type: DiscountType
  value: number
  discountAmount: number
  applicableSubtotal: number
  freeShipping: boolean
  freeGift: unknown | null
  canStackWithOthers: boolean
  snapshot: Record<string, unknown>
}

export type ValidationResult =
  | { valid: true; discount: ValidDiscount }
  | { valid: false; error: string; code: DiscountValidationCode }

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
  currentUses?: number | null
  isActive?: boolean | null
  expiresAt?: string | null
  startDate?: string | null
  minItemCount?: number | null
  maxDiscountAmount?: number | null
  appliesTo?: string | null
  applicableProductIds?: string[] | null
  applicableCategories?: string[] | null
  applicableTypes?: string[] | null
  excludedProductIds?: string[] | null
  excludeSaleItems?: boolean | null
  canStackWithOthers?: boolean | null
  freeShipping?: boolean | null
  freeGift?: unknown | null
  customerSegment?: string | null
  specificEmails?: string[] | null
  minCustomerLifetimeValue?: number | null
  countryRestrictions?: string[] | null
  campaignSource?: string | null
  internalNotes?: string | null
  isArchived?: boolean | null
  pausedForFraud?: boolean | null
  tierThresholds?: unknown | null
}

type ProductMeta = {
  id: string
  category?: string | null
  productType?: string | null
  tags?: string[] | null
  isActive?: boolean | null
}

type AttemptRow = {
  id: string
}

type Tier = {
  threshold: number
  type: 'percentage' | 'fixed'
  value: number
}

function normalizeCode(value: string) {
  return value.trim().toUpperCase()
}

function normalizeToken(value?: string | null) {
  return (value || '').trim().toLowerCase()
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.toLowerCase())
    : []
}

function isDiscountType(value?: string | null): value is DiscountType {
  return value === 'percentage' || value === 'fixed' || value === 'free_shipping' || value === 'free_gift'
}

function isAppliesTo(value?: string | null): value is DiscountAppliesTo {
  return value === 'all' || value === 'specific_products' || value === 'specific_categories' || value === 'specific_types'
}

function isCustomerSegment(value?: string | null): value is DiscountCustomerSegment {
  return value === 'all' || value === 'new' || value === 'returning' || value === 'vip' || value === 'win_back' || value === 'specific_emails'
}

function isExpired(value: string | null | undefined, now: Date) {
  if (!value) return false
  const expiry = new Date(value.includes('T') ? value : `${value}T23:59:59.999`)
  return Number.isFinite(expiry.getTime()) && expiry.getTime() < now.getTime()
}

function isFuture(value: string | null | undefined, now: Date) {
  if (!value) return false
  const start = new Date(value)
  return Number.isFinite(start.getTime()) && start.getTime() > now.getTime()
}

async function logAttempt(
  supabase: SupabaseClient,
  code: string,
  userId: string | null | undefined,
  ipAddress: string,
  wasValid: boolean
) {
  const { data } = await supabase
    .from('DiscountCodeAttempts')
    .insert({
      codeAttempted: code,
      userId: userId || null,
      ipAddress,
      wasValid,
    })
    .select('id')
    .single()

  return (data as AttemptRow | null)?.id || null
}

async function markAttemptValid(supabase: SupabaseClient, attemptId: string | null) {
  if (!attemptId) return
  await supabase
    .from('DiscountCodeAttempts')
    .update({ wasValid: true })
    .eq('id', attemptId)
}

async function countAttempts(supabase: SupabaseClient, ipAddress: string, since: string, code?: string) {
  let query = supabase
    .from('DiscountCodeAttempts')
    .select('id', { count: 'exact', head: true })
    .eq('ipAddress', ipAddress)
    .gte('attemptedAt', since)

  if (code) {
    query = query.ilike('codeAttempted', code)
  }

  const { count, error } = await query
  if (error) return 0
  return count || 0
}

async function getUserEmail(supabase: SupabaseClient, userId?: string | null, fallbackEmail?: string | null) {
  if (fallbackEmail) return fallbackEmail.toLowerCase()
  if (!userId) return null

  const { data } = await supabase
    .from('UserProfile')
    .select('email')
    .eq('userId', userId)
    .maybeSingle()

  const row = data as { email?: string | null } | null
  return row?.email?.toLowerCase() || null
}

async function orderStats(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('Order')
    .select('id,total,createdAt,status')
    .eq('userId', userId)
    .neq('status', 'cancelled')

  if (error) return { count: 0, lifetimeValue: 0, lastOrderAt: null as Date | null }

  const orders = (data || []) as Array<{ total?: number | null; createdAt?: string | null }>
  const lastOrderAt = orders.reduce<Date | null>((latest, order) => {
    if (!order.createdAt) return latest
    const date = new Date(order.createdAt)
    if (!Number.isFinite(date.getTime())) return latest
    if (!latest || date.getTime() > latest.getTime()) return date
    return latest
  }, null)

  return {
    count: orders.length,
    lifetimeValue: orders.reduce((sum, order) => sum + asNumber(order.total), 0),
    lastOrderAt,
  }
}

async function validateCustomerSegment(
  supabase: SupabaseClient,
  discount: DiscountRow,
  userId: string | null | undefined,
  userEmail: string | null | undefined,
  now: Date
) {
  const segment = isCustomerSegment(discount.customerSegment) ? discount.customerSegment : 'all'
  if (segment === 'all') return { valid: true, reason: '' }

  const email = await getUserEmail(supabase, userId, userEmail)

  if (segment === 'specific_emails') {
    const allowed = asStringArray(discount.specificEmails)
    if (email && allowed.includes(email)) return { valid: true, reason: '' }
    return { valid: false, reason: 'This code is not available for your account' }
  }

  if (!userId) {
    return { valid: false, reason: 'Please sign in to use this discount code' }
  }

  const stats = await orderStats(supabase, userId)
  if (segment === 'new' || discount.firstTimeOnly) {
    return stats.count === 0
      ? { valid: true, reason: '' }
      : { valid: false, reason: 'This code is only for first-time customers' }
  }

  if (segment === 'returning') {
    return stats.count > 0
      ? { valid: true, reason: '' }
      : { valid: false, reason: 'This code is for returning customers' }
  }

  if (segment === 'vip') {
    const threshold = asNumber(discount.minCustomerLifetimeValue, 5000)
    return stats.lifetimeValue >= threshold
      ? { valid: true, reason: '' }
      : { valid: false, reason: `This code requires ${threshold.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} lifetime spend` }
  }

  if (segment === 'win_back') {
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    return stats.count > 0 && stats.lastOrderAt && stats.lastOrderAt.getTime() <= sixMonthsAgo.getTime()
      ? { valid: true, reason: '' }
      : { valid: false, reason: 'This code is for customers returning after six months' }
  }

  return { valid: true, reason: '' }
}

async function augmentCartItems(supabase: SupabaseClient, cartItems: DiscountCartItem[]) {
  const productIds = Array.from(new Set(cartItems.map((item) => item.sourceProductId).filter(Boolean)))
  if (!productIds.length) return cartItems

  const { data } = await supabase
    .from('Product')
    .select('id,category,productType,tags,isActive')
    .in('id', productIds)

  const products = new Map(
    ((data || []) as ProductMeta[]).map((product) => [product.id, product])
  )

  return cartItems.map((item) => {
    const product = products.get(item.sourceProductId)
    const saleTags = asStringArray(product?.tags)
    return {
      ...item,
      category: item.category || product?.category || null,
      productType: item.productType || product?.productType || null,
      isSaleItem: item.isSaleItem || saleTags.includes('sale') || saleTags.includes('discount'),
    }
  })
}

function filterApplicableItems(cartItems: DiscountCartItem[], discount: DiscountRow) {
  const appliesTo = isAppliesTo(discount.appliesTo) ? discount.appliesTo : 'all'
  const applicableProductIds = asStringArray(discount.applicableProductIds)
  const applicableCategories = asStringArray(discount.applicableCategories)
  const applicableTypes = asStringArray(discount.applicableTypes)
  const excludedProductIds = asStringArray(discount.excludedProductIds)

  return cartItems.filter((item) => {
    const productId = item.sourceProductId.toLowerCase()
    if (excludedProductIds.includes(productId)) return false
    if (discount.excludeSaleItems !== false && item.isSaleItem) return false

    if (appliesTo === 'all') return true
    if (appliesTo === 'specific_products') return applicableProductIds.includes(productId)
    if (appliesTo === 'specific_categories') return applicableCategories.includes(normalizeToken(item.category))
    if (appliesTo === 'specific_types') return applicableTypes.includes(normalizeToken(item.productType))
    return false
  })
}

function parseTiers(value: unknown): Tier[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const threshold = Number(record.threshold)
      const tierType = record.type === 'fixed' ? 'fixed' : 'percentage'
      const tierValue = Number(record.value)

      if (!Number.isFinite(threshold) || threshold < 0 || !Number.isFinite(tierValue) || tierValue <= 0) {
        return null
      }

      return { threshold, type: tierType, value: tierValue }
    })
    .filter((tier): tier is Tier => Boolean(tier))
    .sort((left, right) => right.threshold - left.threshold)
}

function computeTierDiscount(applicableSubtotal: number, tiers: Tier[]) {
  const tier = tiers.find((candidate) => applicableSubtotal >= candidate.threshold)
  if (!tier) return 0

  return tier.type === 'percentage'
    ? Math.round((applicableSubtotal * tier.value) / 100)
    : Math.round(tier.value)
}

function computeDiscountAmount(discount: DiscountRow, applicableSubtotal: number) {
  const type = isDiscountType(discount.type) ? discount.type : 'percentage'
  const tiers = parseTiers(discount.tierThresholds)
  let discountAmount = 0

  if (tiers.length) {
    discountAmount = computeTierDiscount(applicableSubtotal, tiers)
  } else if (type === 'percentage') {
    discountAmount = Math.round((applicableSubtotal * asNumber(discount.value)) / 100)
  } else if (type === 'fixed') {
    discountAmount = Math.round(asNumber(discount.value))
  }

  if (discount.maxDiscountAmount) {
    discountAmount = Math.min(discountAmount, asNumber(discount.maxDiscountAmount))
  }

  return Math.max(0, Math.min(discountAmount, applicableSubtotal))
}

function snapshotDiscount(discount: DiscountRow) {
  return {
    id: discount.id,
    code: discount.code,
    type: isDiscountType(discount.type) ? discount.type : 'percentage',
    value: asNumber(discount.value),
    minOrderAmt: asNumber(discount.minOrderAmt),
    minItemCount: discount.minItemCount || 1,
    maxDiscountAmount: discount.maxDiscountAmount || null,
    appliesTo: isAppliesTo(discount.appliesTo) ? discount.appliesTo : 'all',
    applicableProductIds: discount.applicableProductIds || [],
    applicableCategories: discount.applicableCategories || [],
    applicableTypes: discount.applicableTypes || [],
    excludedProductIds: discount.excludedProductIds || [],
    excludeSaleItems: discount.excludeSaleItems !== false,
    customerSegment: isCustomerSegment(discount.customerSegment) ? discount.customerSegment : 'all',
    canStackWithOthers: Boolean(discount.canStackWithOthers),
    freeShipping: Boolean(discount.freeShipping || discount.type === 'free_shipping'),
    freeGift: discount.freeGift || null,
    tierThresholds: discount.tierThresholds || null,
  }
}

async function maybePauseForFraud(supabase: SupabaseClient, discount: DiscountRow, ipAddress: string, now: Date) {
  const code = normalizeCode(discount.code)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
  const dayAttempts = await countAttempts(supabase, ipAddress, oneDayAgo, code)
  const hourAttempts = await countAttempts(supabase, ipAddress, oneHourAgo, code)

  if (dayAttempts > 10 || hourAttempts > 100) {
    await supabase
      .from('DiscountCode')
      .update({
        pausedForFraud: true,
        isActive: false,
        fraudReason: dayAttempts > 10
          ? 'More than 10 validation attempts from the same IP in 24 hours'
          : 'Abnormal validation spike in one hour',
      })
      .eq('id', discount.id)
  }
}

export async function validateDiscountCode({
  supabase,
  code,
  userId,
  userEmail,
  cartItems,
  subtotal,
  ipAddress,
  country,
  logAttempts = true,
  now = new Date(),
}: ValidationInput): Promise<ValidationResult> {
  const normalizedCode = normalizeCode(code)
  if (!normalizedCode) {
    return { valid: false, error: 'Code is required', code: 'NOT_FOUND' }
  }

  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
  const attemptsLastHour = await countAttempts(supabase, ipAddress, oneHourAgo)
  if (attemptsLastHour > 20) {
    return { valid: false, error: 'Too many code attempts. Please try later.', code: 'RATE_LIMITED' }
  }

  const attemptId = logAttempts
    ? await logAttempt(supabase, normalizedCode, userId, ipAddress, false)
    : null

  const { data, error } = await supabase
    .from('DiscountCode')
    .select('*')
    .ilike('code', normalizedCode)
    .eq('isArchived', false)
    .maybeSingle()

  if (error || !data) {
    return { valid: false, error: 'Invalid discount code', code: 'NOT_FOUND' }
  }

  const discount = data as DiscountRow
  const type = isDiscountType(discount.type) ? discount.type : null
  if (!type) {
    return { valid: false, error: 'Discount code is misconfigured', code: 'INVALID_CONFIG' }
  }

  if (!discount.isActive || discount.pausedForFraud) {
    return { valid: false, error: 'This code is no longer active', code: 'INACTIVE' }
  }

  if (isFuture(discount.startDate, now)) {
    return { valid: false, error: 'This code is not yet active', code: 'NOT_YET_ACTIVE' }
  }

  if (isExpired(discount.expiresAt, now)) {
    return { valid: false, error: 'This code has expired', code: 'EXPIRED' }
  }

  if (discount.maxUses !== null && discount.maxUses !== undefined) {
    const { data: canUse, error: availabilityError } = await supabase.rpc('check_discount_availability', {
      code_id: discount.id,
    })
    if (availabilityError || canUse !== true) {
      return { valid: false, error: 'This code has reached its usage limit', code: 'MAXED_OUT' }
    }
  }

  if (userId && discount.maxUsesPerUser !== null && discount.maxUsesPerUser !== undefined) {
    const { count, error: usageError } = await supabase
      .from('DiscountCodeUsage')
      .select('id', { count: 'exact', head: true })
      .eq('userId', userId)
      .eq('discountCodeId', discount.id)

    if (usageError) {
      return { valid: false, error: 'Unable to validate discount code', code: 'SERVER_ERROR' }
    }

    if ((count || 0) >= discount.maxUsesPerUser) {
      return { valid: false, error: 'You have already used this code', code: 'USER_LIMIT' }
    }
  }

  const segment = await validateCustomerSegment(supabase, discount, userId, userEmail, now)
  if (!segment.valid) {
    return { valid: false, error: segment.reason, code: 'SEGMENT_INVALID' }
  }

  const allowedEmails = asStringArray(discount.specificEmails)
  if (allowedEmails.length) {
    const email = await getUserEmail(supabase, userId, userEmail)
    if (!email || !allowedEmails.includes(email)) {
      return { valid: false, error: 'This code is not available for your account', code: 'NOT_ELIGIBLE' }
    }
  }

  const allowedCountries = asStringArray(discount.countryRestrictions)
  if (allowedCountries.length && !allowedCountries.includes(normalizeToken(country))) {
    return { valid: false, error: 'This code is not available in your shipping country', code: 'NOT_ELIGIBLE' }
  }

  const minimumOrder = asNumber(discount.minOrderAmt)
  if (subtotal < minimumOrder) {
    const shortBy = Math.max(0, minimumOrder - subtotal)
    return {
      valid: false,
      error: `Minimum order of ${minimumOrder.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} required. Add ${shortBy.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} more to qualify.`,
      code: 'MIN_NOT_MET',
    }
  }

  const minItemCount = discount.minItemCount || 1
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  if (totalItems < minItemCount) {
    return { valid: false, error: `Minimum ${minItemCount} items required`, code: 'MIN_ITEMS_NOT_MET' }
  }

  const augmentedItems = await augmentCartItems(supabase, cartItems)
  const applicableItems = filterApplicableItems(augmentedItems, discount)
  if (!applicableItems.length) {
    return { valid: false, error: 'This code does not apply to items in your cart', code: 'NO_APPLICABLE_ITEMS' }
  }

  const applicableSubtotal = applicableItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const freeShipping = Boolean(discount.freeShipping || type === 'free_shipping')
  const discountAmount = type === 'free_shipping' || type === 'free_gift'
    ? 0
    : computeDiscountAmount(discount, applicableSubtotal)

  await markAttemptValid(supabase, attemptId)
  await maybePauseForFraud(supabase, discount, ipAddress, now)

  return {
    valid: true,
    discount: {
      id: discount.id,
      code: discount.code,
      type,
      value: asNumber(discount.value),
      discountAmount,
      applicableSubtotal,
      freeShipping,
      freeGift: discount.freeGift || null,
      canStackWithOthers: Boolean(discount.canStackWithOthers),
      snapshot: snapshotDiscount(discount),
    },
  }
}

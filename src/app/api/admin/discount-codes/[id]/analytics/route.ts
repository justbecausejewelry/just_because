import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server/security'

type RouteContext = {
  params: Promise<{ id: string }>
}

type UsageRow = {
  discountAmount?: number | null
  usedAt?: string | null
  userId?: string | null
  orderId?: string | null
}

type AttemptRow = {
  wasValid?: boolean | null
  attemptedAt?: string | null
  ipAddress?: string | null
}

type OrderRow = {
  id: string
  total?: number | null
  customerEmail?: string | null
  shippingAddress?: { country?: string | null } | null
}

type OrderItemRow = {
  productTitle?: string | null
  quantity?: number | null
}

function dayHour(value?: string | null) {
  const date = value ? new Date(value) : null
  if (!date || !Number.isFinite(date.getTime())) return 'Unknown'
  return `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${date.getHours()}:00`
}

function increment(map: Map<string, number>, key: string, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount)
}

function topMap(map: Map<string, number>, limit = 10) {
  return Array.from(map.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }))
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await context.params
  const { data: code, error: codeError } = await auth.admin
    .from('DiscountCode')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (codeError || !code) {
    return NextResponse.json({ error: 'Discount code not found' }, { status: 404 })
  }

  const codeText = String((code as { code?: string | null }).code || '')
  const [{ data: usageData }, { data: attemptData }] = await Promise.all([
    auth.admin
      .from('DiscountCodeUsage')
      .select('discountAmount,usedAt,userId,orderId')
      .eq('discountCodeId', id)
      .order('usedAt', { ascending: false }),
    auth.admin
      .from('DiscountCodeAttempts')
      .select('wasValid,attemptedAt,ipAddress')
      .ilike('codeAttempted', codeText)
      .order('attemptedAt', { ascending: false })
      .limit(500),
  ])

  const usage = (usageData || []) as UsageRow[]
  const attempts = (attemptData || []) as AttemptRow[]
  const orderIds = usage.map((row) => row.orderId).filter((value): value is string => Boolean(value))

  const [{ data: ordersData }, { data: itemsData }] = await Promise.all([
    orderIds.length
      ? auth.admin.from('Order').select('id,total,customerEmail,shippingAddress').in('id', orderIds)
      : Promise.resolve({ data: [] }),
    orderIds.length
      ? auth.admin.from('OrderItem').select('orderId,productTitle,quantity').in('orderId', orderIds)
      : Promise.resolve({ data: [] }),
  ])

  const orders = (ordersData || []) as OrderRow[]
  const items = (itemsData || []) as Array<OrderItemRow & { orderId?: string | null }>
  const ordersById = new Map(orders.map((order) => [order.id, order]))
  const customerMap = new Map<string, number>()
  const productMap = new Map<string, number>()
  const geographyMap = new Map<string, number>()
  const timeMap = new Map<string, number>()

  usage.forEach((row) => {
    const order = row.orderId ? ordersById.get(row.orderId) : null
    if (order?.customerEmail) increment(customerMap, order.customerEmail)
    if (order?.shippingAddress?.country) increment(geographyMap, order.shippingAddress.country)
    increment(timeMap, dayHour(row.usedAt))
  })

  items.forEach((item) => {
    if (item.productTitle) increment(productMap, item.productTitle, item.quantity || 1)
  })

  const totalRevenueImpact = usage.reduce((sum, row) => sum + Number(row.discountAmount || 0), 0)
  const orderTotals = orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
  const validAttempts = attempts.filter((attempt) => attempt.wasValid).length
  const totalAttempts = attempts.length
  const suspiciousIps = new Map<string, number>()
  attempts.forEach((attempt) => {
    if (attempt.ipAddress) increment(suspiciousIps, attempt.ipAddress)
  })

  return NextResponse.json({
    code,
    metrics: {
      totalUses: usage.length,
      totalRevenueImpact,
      averageOrderValue: orders.length ? Math.round(orderTotals / orders.length) : 0,
      conversionRate: totalAttempts ? validAttempts / totalAttempts : 0,
      validAttempts,
      totalAttempts,
    },
    topCustomers: topMap(customerMap),
    topProducts: topMap(productMap),
    geographicDistribution: topMap(geographyMap),
    dayHourUsage: topMap(timeMap, 24),
    suspiciousIps: topMap(suspiciousIps),
    recentAttempts: attempts.slice(0, 50),
  })
}

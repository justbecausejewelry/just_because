import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server/security'

type AccountOrder = {
  id: string
  createdAt?: string | null
}

const ORDER_SELECT = '*, OrderItem(*)'

function dedupeAndSortOrders(orders: AccountOrder[]) {
  const byId = new Map<string, AccountOrder>()

  orders.forEach((order) => {
    byId.set(order.id, order)
  })

  return Array.from(byId.values()).sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bTime - aTime
  })
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if ('error' in auth) return auth.error

  const email = auth.user.email?.toLowerCase()

  const byUserId = auth.admin
    .from('Order')
    .select(ORDER_SELECT)
    .eq('userId', auth.user.id)

  const byEmail = email
    ? auth.admin
      .from('Order')
      .select(ORDER_SELECT)
      .eq('customerEmail', email)
    : Promise.resolve({ data: [], error: null })

  const [userResult, emailResult] = await Promise.all([byUserId, byEmail])

  if (userResult.error) {
    console.error('[account-orders] userId query failed:', userResult.error)
    return NextResponse.json({ error: 'Unable to load orders' }, { status: 500 })
  }

  if (emailResult.error) {
    console.error('[account-orders] email query failed:', emailResult.error)
    return NextResponse.json({ error: 'Unable to load orders' }, { status: 500 })
  }

  const orders = dedupeAndSortOrders([
    ...((userResult.data || []) as AccountOrder[]),
    ...((emailResult.data || []) as AccountOrder[]),
  ])

  return NextResponse.json({ orders })
}

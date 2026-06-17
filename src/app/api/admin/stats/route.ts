import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server/security'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { data, error } = await auth.admin
    .from('Order')
    .select('*, items:OrderItem(id)')
    .order('createdAt', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ orders: data || [] })
}

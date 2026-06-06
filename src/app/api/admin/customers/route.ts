import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

type ProfileRow = {
  id?: string
  userId?: string
  email?: string | null
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  signupSource?: string | null
  signup_source?: string | null
  ringSize?: string | null
  createdAt?: string | null
}

type OrderRow = {
  customerEmail?: string | null
  total?: number | null
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const [{ data: profiles, error: profilesError }, { data: orders, error: ordersError }] = await Promise.all([
    supabase.from('UserProfile').select('*').order('createdAt', { ascending: false }),
    supabase.from('Order').select('customerEmail,total'),
  ])

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 })
  }

  const orderRows = (orders || []) as OrderRow[]
  const customers = ((profiles || []) as ProfileRow[]).map((profile) => {
    const email = profile.email || ''
    const userOrders = orderRows.filter((order) => order.customerEmail === email)

    return {
      ...profile,
      email,
      orderCount: userOrders.length,
      totalSpent: userOrders.reduce((sum, order) => sum + (order.total || 0), 0),
    }
  })

  return NextResponse.json({ customers })
}

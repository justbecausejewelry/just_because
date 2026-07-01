import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server/security'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const [
    profilesResponse,
    adminsResponse,
    ordersResponse,
    cartEventsResponse,
    pageViewsResponse,
    productsResponse,
    diamondsResponse,
  ] = await Promise.all([
    auth.admin.from('UserProfile').select('id,userId,email,createdAt'),
    auth.admin.from('AdminUser').select('email,role'),
    auth.admin.from('Order').select('id,customerEmail,total,status,createdAt').order('createdAt', { ascending: true }),
    auth.admin.from('cart_events').select('*').order('created_at', { ascending: true }),
    auth.admin.from('page_views').select('*').order('created_at', { ascending: true }),
    auth.admin.from('Product').select('id,title,basePrice,productType,images'),
    auth.admin.from('Diamond').select('id,shape,carat,price,imageUrl'),
  ])

  const errors = [
    profilesResponse.error,
    adminsResponse.error,
    ordersResponse.error,
    cartEventsResponse.error,
    pageViewsResponse.error,
    productsResponse.error,
    diamondsResponse.error,
  ].filter(Boolean)

  if (errors.length) {
    return NextResponse.json(
      { error: errors.map((error) => error?.message).join(' | ') },
      { status: 500 }
    )
  }

  return NextResponse.json({
    admins: adminsResponse.data || [],
    cartEvents: cartEventsResponse.data || [],
    diamonds: diamondsResponse.data || [],
    orders: ordersResponse.data || [],
    pageViews: pageViewsResponse.data || [],
    products: productsResponse.data || [],
    profiles: profilesResponse.data || [],
  })
}

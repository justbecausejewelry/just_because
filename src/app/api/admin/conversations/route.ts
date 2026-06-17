import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server/security'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const type = searchParams.get('type')

  let query = auth.admin
    .from('Conversation')
    .select('*')
    .order('updatedAt', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (type === 'product') {
    query = query.eq('conversationType', 'product')
  }

  if (type === 'general') {
    query = query.eq('conversationType', 'general')
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ conversations: data || [] })
}

import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server/security'

export async function DELETE(request: NextRequest) {
  const auth = await requireUser(request)
  if ('error' in auth) return auth.error

  const { error } = await auth.admin
    .from('CartDiscount')
    .delete()
    .eq('userId', auth.user.id)

  if (error) {
    return NextResponse.json({ error: 'Unable to remove discount code' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

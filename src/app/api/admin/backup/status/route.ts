import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server/security'

type SystemLogRow = {
  createdAt?: string | null
  message?: string | null
  metadata?: Record<string, unknown> | null
  status?: string | null
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { data, error } = await auth.admin
    .from('SystemLog')
    .select('status,message,metadata,createdAt')
    .eq('type', 'order_backup')
    .order('createdAt', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({
      lastBackup: null,
      nextBackup: 'Tonight at 9:00 PM CST',
      status: 'unknown',
      warning: error.message,
    })
  }

  const lastBackup = data as SystemLogRow | null

  return NextResponse.json({
    lastBackup,
    nextBackup: 'Tonight at 9:00 PM CST',
    status: lastBackup?.status || 'not_run',
  })
}

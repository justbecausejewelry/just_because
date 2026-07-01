import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/server/adminAuth'

export async function GET(request: NextRequest) {
  const auth = await verifyAdminRequest(request)

  if (auth.error || !auth.user) {
    return NextResponse.json(
      { isAdmin: false, role: null, adminData: null },
      { status: auth.status === 403 ? 403 : 401 }
    )
  }

  return NextResponse.json({
    isAdmin: true,
    role: auth.user.role,
    adminData: auth.adminData,
  })
}

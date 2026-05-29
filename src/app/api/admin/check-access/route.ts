import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return NextResponse.json({ isAdmin: false, role: null, adminData: null }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)

  if (authError || !user?.email) {
    return NextResponse.json({ isAdmin: false, role: null, adminData: null }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('AdminUser')
    .select('*')
    .eq('email', user.email.toLowerCase())
    .single()

  if (error || !data) {
    return NextResponse.json({ isAdmin: false, role: null, adminData: null }, { status: 403 })
  }

  return NextResponse.json({
    isAdmin: true,
    role: data.role,
    adminData: data,
  })
}

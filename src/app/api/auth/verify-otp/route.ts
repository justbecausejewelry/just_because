import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type VerifyOtpBody = {
  email?: unknown
  code?: unknown
}

type OtpRow = {
  id: string
}

type ProfileRow = {
  id?: string
  userId?: string | null
}

const OTP_PURPOSE = 'email_verification'

function isRecord(value: unknown): value is VerifyOtpBody {
  return typeof value === 'object' && value !== null
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeCode(value: unknown) {
  return typeof value === 'string' ? value.replace(/\D/g, '') : ''
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'OTP service is not configured' }, { status: 500 })
  }

  const body: unknown = await request.json().catch(() => null)
  if (!isRecord(body)) {
    return NextResponse.json({ error: 'Invalid verification payload' }, { status: 400 })
  }

  const email = normalizeEmail(body.email)
  const code = normalizeCode(body.code)

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{4}$/.test(code)) {
    return NextResponse.json({ error: 'Enter the 4-digit code sent to your email.' }, { status: 400 })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: otpData, error: otpError } = await supabaseAdmin
    .from('email_otps')
    .select('id')
    .eq('email', email)
    .eq('purpose', OTP_PURPOSE)
    .eq('otp_code', code)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (otpError) {
    return NextResponse.json({ error: otpError.message }, { status: 500 })
  }

  if (!otpData) {
    return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 400 })
  }

  const { error: markUsedError } = await supabaseAdmin
    .from('email_otps')
    .update({ used: true })
    .eq('id', (otpData as OtpRow).id)
    .eq('used', false)

  if (markUsedError) {
    return NextResponse.json({ error: markUsedError.message }, { status: 500 })
  }

  const { data: profileData, error: profileLookupError } = await supabaseAdmin
    .from('UserProfile')
    .select('id,userId')
    .eq('email', email)
    .maybeSingle()

  if (profileLookupError) {
    return NextResponse.json({ error: profileLookupError.message }, { status: 500 })
  }

  if (!profileData) {
    return NextResponse.json({ error: 'Account profile was not found.' }, { status: 404 })
  }

  const profile = profileData as ProfileRow
  const { error: profileError } = await supabaseAdmin
    .from('UserProfile')
    .update({
      email_verified: true,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', profile.id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, userId: profile.userId || null })
}

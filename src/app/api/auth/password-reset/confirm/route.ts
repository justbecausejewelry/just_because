import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getAuthErrorMessage, getGeneralErrorMessage } from '@/lib/errors'
import { checkRateLimit, rateLimitResponse } from '@/lib/server/rateLimit'

export const runtime = 'nodejs'

type ConfirmPasswordResetBody = {
  email?: unknown
  code?: unknown
  password?: unknown
}

const passwordResetConfirmSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(254),
  code: z.string().trim().regex(/^\d{4}$/, 'Enter the 4-digit code sent to your email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
})

type OtpRow = {
  id: string
}

type ProfileRow = {
  userId?: string | null
}

const OTP_PURPOSE = 'password_reset'

function isRecord(value: unknown): value is ConfirmPasswordResetBody {
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
    return NextResponse.json({ error: getGeneralErrorMessage() }, { status: 500 })
  }

  const body: unknown = await request.json().catch(() => null)
  const parsed = passwordResetConfirmSchema.safeParse(isRecord(body) ? body : {})
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return NextResponse.json({ error: getAuthErrorMessage(issue?.message) }, { status: 400 })
  }
  const email = normalizeEmail(parsed.data.email)
  const code = normalizeCode(parsed.data.code)
  const password = parsed.data.password

  const limit = checkRateLimit({
    key: `password-reset-confirm:${email}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  })
  if (!limit.ok) return rateLimitResponse(limit.resetAt)

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
    console.error('[password-reset/confirm] OTP lookup failed:', otpError)
    return NextResponse.json({ error: getGeneralErrorMessage(otpError) }, { status: 500 })
  }

  if (!otpData) {
    return NextResponse.json({ error: 'Invalid or expired password reset code.' }, { status: 400 })
  }

  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('UserProfile')
    .select('userId')
    .eq('email', email)
    .maybeSingle()

  if (profileError) {
    console.error('[password-reset/confirm] profile lookup failed:', profileError)
    return NextResponse.json({ error: getGeneralErrorMessage(profileError) }, { status: 500 })
  }

  const profile = profileData as ProfileRow | null
  if (!profile?.userId) {
    return NextResponse.json({ error: 'Invalid or expired password reset code.' }, { status: 400 })
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(profile.userId, {
    password,
  })

  if (updateError) {
    console.error('[password-reset/confirm] password update failed:', updateError)
    return NextResponse.json({ error: getAuthErrorMessage(updateError) }, { status: 500 })
  }

  const { error: markUsedError } = await supabaseAdmin
    .from('email_otps')
    .update({ used: true })
    .eq('id', (otpData as OtpRow).id)
    .eq('used', false)

  if (markUsedError) {
    console.error('[password-reset/confirm] mark used failed:', markUsedError)
    return NextResponse.json({ error: getGeneralErrorMessage(markUsedError) }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

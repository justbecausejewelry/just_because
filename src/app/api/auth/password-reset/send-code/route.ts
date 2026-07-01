import { randomInt } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getAuthErrorMessage, getPasswordResetMessage } from '@/lib/errors'
import { OTP_WINDOW_MINUTES, sendBrandedOtpEmail } from '@/lib/otpEmail'
import { checkRateLimit, rateLimitResponse } from '@/lib/server/rateLimit'

export const runtime = 'nodejs'

type SendPasswordResetCodeBody = {
  email?: unknown
}

const passwordResetSendSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(254),
})

type ProfileRow = {
  userId?: string | null
  firstName?: string | null
  lastName?: string | null
}

const OTP_PURPOSE = 'password_reset'
const RESEND_LIMIT = 3
const RESEND_WINDOW_MS = 60 * 60 * 1000

function isRecord(value: unknown): value is SendPasswordResetCodeBody {
  return typeof value === 'object' && value !== null
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function profileName(profile: ProfileRow | null, email: string) {
  const name = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
  return name || email.split('@')[0] || ''
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[password-reset/send-code] service is not configured')
    return NextResponse.json({ ok: true })
  }

  const body: unknown = await request.json().catch(() => null)
  const parsed = passwordResetSendSchema.safeParse(isRecord(body) ? body : {})
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return NextResponse.json({ error: getAuthErrorMessage(issue?.message) }, { status: 400 })
  }
  const email = normalizeEmail(parsed.data.email)

  const limit = checkRateLimit({
    key: `password-reset:${email}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  })
  if (!limit.ok) return rateLimitResponse(limit.resetAt)

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('UserProfile')
    .select('userId,firstName,lastName')
    .eq('email', email)
    .maybeSingle()

  if (profileError) {
    console.error('[password-reset/send-code] profile lookup failed:', profileError)
    return NextResponse.json({ ok: true })
  }

  const profile = profileData as ProfileRow | null
  if (!profile?.userId) {
    return NextResponse.json({ ok: true })
  }

  const oneHourAgo = new Date(Date.now() - RESEND_WINDOW_MS).toISOString()
  const { count, error: countError } = await supabaseAdmin
    .from('email_otps')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .eq('purpose', OTP_PURPOSE)
    .gte('created_at', oneHourAgo)

  if (countError) {
    console.error('[password-reset/send-code] OTP count failed:', countError)
    return NextResponse.json({ ok: true })
  }

  if ((count || 0) >= RESEND_LIMIT) {
    return NextResponse.json({ error: getPasswordResetMessage() }, { status: 429 })
  }

  await supabaseAdmin
    .from('email_otps')
    .update({ used: true })
    .eq('email', email)
    .eq('purpose', OTP_PURPOSE)
    .eq('used', false)

  const otpCode = String(randomInt(1000, 10000))
  const expiresAt = new Date(Date.now() + OTP_WINDOW_MINUTES * 60 * 1000).toISOString()
  const { data: otpData, error: insertError } = await supabaseAdmin
    .from('email_otps')
    .insert({
      email,
      otp_code: otpCode,
      purpose: OTP_PURPOSE,
      expires_at: expiresAt,
      used: false,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[password-reset/send-code] OTP insert failed:', insertError)
    return NextResponse.json({ ok: true })
  }

  const sendResult = await sendBrandedOtpEmail({
    to: email,
    code: otpCode,
    name: profileName(profile, email),
    subject: `${otpCode} is your Just Because password reset code`,
    eyebrow: 'Password Reset',
    heading: 'Reset your password',
    message: 'enter this 4-digit code to set a new password for your Just Because account.',
  })

  if (!sendResult.ok) {
    await supabaseAdmin
      .from('email_otps')
      .update({ used: true })
      .eq('id', (otpData as { id: string }).id)

    console.error('[password-reset/send-code] email send failed:', sendResult.error)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true, expiresAt })
}

import { randomInt } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { OTP_WINDOW_MINUTES, sendBrandedOtpEmail } from '@/lib/otpEmail'
import { checkRateLimit, rateLimitResponse } from '@/lib/server/rateLimit'

export const runtime = 'nodejs'

type SendOtpBody = {
  email?: unknown
  name?: unknown
  userId?: unknown
}

const sendOtpSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(254),
  name: z.string().trim().max(120).optional(),
  userId: z.string().uuid().optional(),
})

type ProfileRow = {
  id?: string
  userId?: string | null
  email?: string | null
  email_verified?: boolean | null
}

const RESEND_LIMIT = 3
const RESEND_WINDOW_MS = 60 * 60 * 1000
const OTP_PURPOSE = 'email_verification'

function isRecord(value: unknown): value is SendOtpBody {
  return typeof value === 'object' && value !== null
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function splitName(name: string, email: string) {
  const fallback = email.split('@')[0] || ''
  const parts = (name.trim() || fallback).split(/\s+/)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  }
}

export async function POST(req: Request) {
  console.log('[send-otp] step 1: handler entered')

  let step = 'handler-entered'

  try {
    step = 'check-env'
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('OTP service is not configured')
    }
    console.log('[send-otp]', step, 'OK')

    step = 'parse-body'
    const body: unknown = await req.json()
    console.log('[send-otp] step 2: body parsed')
    console.log('[send-otp]', step, 'OK')

    step = 'validate-body'
    const parsed = sendOtpSchema.safeParse(isRecord(body) ? body : {})
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      console.log('[send-otp]', step, 'invalid payload', issue?.path.join('.') || 'send-otp')
      return NextResponse.json({ error: issue?.message || 'Invalid OTP payload' }, { status: 400 })
    }

    const email = normalizeEmail(parsed.data.email)
    const name = parsed.data.name || ''
    const userId = parsed.data.userId || ''
    console.log('[send-otp]', step, 'OK', { email, hasName: !!name, hasUserId: !!userId })

    step = 'rate-limit'
    const limit = checkRateLimit({
      key: `send-otp:${email}`,
      limit: 10,
      windowMs: 60 * 60 * 1000,
    })
    console.log('[send-otp]', step, 'OK', limit)
    if (!limit.ok) {
      console.log('[send-otp]', step, 'blocked until', limit.resetAt)
      return rateLimitResponse(limit.resetAt)
    }

    step = 'init-supabase'
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    console.log('[send-otp] step 3: supabase admin client created')
    console.log('[send-otp]', step, 'OK')

    if (userId) {
      step = 'get-auth-user'
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (authError) throw new Error(`getUserById failed: ${authError.message}`)
      if (!authData.user || (authData.user.email || '').toLowerCase() !== email) {
        throw new Error('OTP payload does not match auth user')
      }
      console.log('[send-otp]', step, 'OK', {
        userId: authData.user.id,
        email: authData.user.email,
      })
    }

    step = 'query-profile'
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('UserProfile')
      .select('id,userId,email,email_verified')
      .eq('email', email)
      .maybeSingle()
    if (profileError) throw new Error(`UserProfile query failed: ${profileError.message}`)
    console.log('[send-otp]', step, 'OK', profileData)

    let profile = profileData as ProfileRow | null

    if (!profile && !userId) {
      console.log('[send-otp]', step, 'no profile and no userId; returning ok')
      return NextResponse.json({ ok: true })
    }

    if (!profile && userId) {
      step = 'insert-profile'
      const { firstName, lastName } = splitName(name, email)
      const { data: createdProfile, error: createProfileError } = await supabaseAdmin
        .from('UserProfile')
        .insert({
          userId,
          email,
          firstName,
          lastName,
          signupSource: 'direct',
          signup_source: 'direct',
          email_verified: false,
        })
        .select('id,userId,email,email_verified')
        .single()
      if (createProfileError) throw new Error(`UserProfile insert failed: ${createProfileError.message}`)
      console.log('[send-otp]', step, 'OK', createdProfile)

      profile = createdProfile as ProfileRow
    }

    if (profile?.email_verified) {
      console.log('[send-otp] email already verified')
      return NextResponse.json({ ok: true, alreadyVerified: true })
    }

    step = 'count-recent-otps'
    const oneHourAgo = new Date(Date.now() - RESEND_WINDOW_MS).toISOString()
    const { count, error: countError } = await supabaseAdmin
      .from('email_otps')
      .select('id', { count: 'exact', head: true })
      .eq('email', email)
      .eq('purpose', OTP_PURPOSE)
      .gte('created_at', oneHourAgo)
    if (countError) throw new Error(`OTP count failed: ${countError.message}`)
    console.log('[send-otp]', step, 'OK', { count })

    if ((count || 0) >= RESEND_LIMIT) {
      console.log('[send-otp]', step, 'resend limit reached', count)
      return NextResponse.json({ error: 'Too many codes requested. Please try again later.' }, { status: 429 })
    }

    step = 'mark-old-otps-used'
    const { error: markUsedError } = await supabaseAdmin
      .from('email_otps')
      .update({ used: true })
      .eq('email', email)
      .eq('purpose', OTP_PURPOSE)
      .eq('used', false)
    if (markUsedError) throw new Error(`Mark old OTPs used failed: ${markUsedError.message}`)
    console.log('[send-otp]', step, 'OK')

    step = 'insert-otp'
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
    if (insertError) throw new Error(`OTP insert failed: ${insertError.message}`)
    console.log('[send-otp]', step, 'OK', otpData)

    step = 'send-resend-email'
    const sendResult = await sendBrandedOtpEmail({
      to: email,
      code: otpCode,
      name,
      subject: `${otpCode} is your Just Because verification code`,
      eyebrow: 'Email Verification',
      heading: 'Your private code',
      message: 'enter this 4-digit code to verify your Just Because account.',
    })
    console.log('[send-otp]', step, 'result', sendResult)
    if (!sendResult.ok) {
      step = 'cleanup-failed-resend-otp'
      const { error: failedOtpError } = await supabaseAdmin
        .from('email_otps')
        .update({ used: true })
        .eq('id', (otpData as { id: string }).id)
      if (failedOtpError) {
        console.error('[send-otp]', step, 'cleanup failed', failedOtpError)
      } else {
        console.log('[send-otp]', step, 'OK')
      }

      throw new Error(`Resend failed: ${sendResult.error}`)
    }
    console.log('[send-otp] send-resend-email OK')

    step = 'return-success'
    console.log('[send-otp]', step, 'OK', { expiresAt })
    return NextResponse.json({ ok: true, expiresAt })
  } catch (err) {
    console.error('[send-otp] FAILED at step:', step)
    console.error('[send-otp] Error:', err)
    console.error('[send-otp] Message:', err instanceof Error ? err.message : 'Unknown')
    console.error('[send-otp] Stack:', err instanceof Error ? err.stack : '')
    console.error('[send-otp] Full error:', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

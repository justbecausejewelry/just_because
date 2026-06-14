import { randomInt } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OTP_WINDOW_MINUTES, sendBrandedOtpEmail } from '@/lib/otpEmail'

export const runtime = 'nodejs'

type SendOtpBody = {
  email?: unknown
  name?: unknown
  userId?: unknown
}

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

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'OTP service is not configured' }, { status: 500 })
  }

  const body: unknown = await request.json().catch(() => null)
  if (!isRecord(body)) {
    return NextResponse.json({ error: 'Invalid OTP payload' }, { status: 400 })
  }

  const email = normalizeEmail(body.email)
  const name = typeof body.name === 'string' ? body.name.slice(0, 120) : ''
  const userId = typeof body.userId === 'string' ? body.userId.trim() : ''

  if (!isEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  if (userId) {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (authError || !authData.user || (authData.user.email || '').toLowerCase() !== email) {
      return NextResponse.json({ error: 'OTP payload does not match auth user' }, { status: 403 })
    }
  }

  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('UserProfile')
    .select('id,userId,email,email_verified')
    .eq('email', email)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  let profile = profileData as ProfileRow | null

  if (!profile && !userId) {
    return NextResponse.json({ ok: true })
  }

  if (!profile && userId) {
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

    if (createProfileError) {
      return NextResponse.json({ error: createProfileError.message }, { status: 500 })
    }

    profile = createdProfile as ProfileRow
  }

  if (profile?.email_verified) {
    return NextResponse.json({ ok: true, alreadyVerified: true })
  }

  const oneHourAgo = new Date(Date.now() - RESEND_WINDOW_MS).toISOString()
  const { count, error: countError } = await supabaseAdmin
    .from('email_otps')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .eq('purpose', OTP_PURPOSE)
    .gte('created_at', oneHourAgo)

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 })
  }

  if ((count || 0) >= RESEND_LIMIT) {
    return NextResponse.json({ error: 'Too many codes requested. Please try again later.' }, { status: 429 })
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
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const sendResult = await sendBrandedOtpEmail({
    to: email,
    code: otpCode,
    name,
    subject: `${otpCode} is your Just Because verification code`,
    eyebrow: 'Email Verification',
    heading: 'Your private code',
    message: 'enter this 4-digit code to verify your Just Because account.',
  })
  if (!sendResult.ok) {
    await supabaseAdmin
      .from('email_otps')
      .update({ used: true })
      .eq('id', (otpData as { id: string }).id)

    return NextResponse.json({ error: sendResult.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, expiresAt })
}

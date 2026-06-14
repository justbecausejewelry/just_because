import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type SignupBody = {
  email?: unknown
  password?: unknown
  name?: unknown
  phone?: unknown
  signupSource?: unknown
}

function isRecord(value: unknown): value is SignupBody {
  return typeof value === 'object' && value !== null
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function splitName(name: string, email: string) {
  const fallback = email.split('@')[0] || ''
  const parts = (name.trim() || fallback).split(/\s+/)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  }
}

async function readApiError(response: Response) {
  const body: unknown = await response.json().catch(() => null)
  if (typeof body === 'object' && body !== null && 'error' in body) {
    const message = (body as { error?: unknown }).error
    if (typeof message === 'string' && message.trim()) return message
  }

  return 'Unable to send verification code'
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Signup service is not configured' }, { status: 500 })
  }

  const body: unknown = await request.json().catch(() => null)
  if (!isRecord(body)) {
    return NextResponse.json({ error: 'Invalid signup payload' }, { status: 400 })
  }

  const email = normalizeEmail(body.email)
  const password = typeof body.password === 'string' ? body.password : ''
  const name = cleanText(body.name, 120)
  const phone = cleanText(body.phone, 40)
  const signupSource = cleanText(body.signupSource, 40) || 'direct'

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  if (!name) {
    return NextResponse.json({ error: 'Please enter your name' }, { status: 400 })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: createdUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      full_name: name,
    },
  })

  if (createError) {
    const message = createError.message.toLowerCase().includes('already')
      ? 'This email already has an account. Please sign in instead.'
      : createError.message
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const user = createdUserData.user
  if (!user) {
    return NextResponse.json({ error: 'Unable to create account' }, { status: 500 })
  }

  const { firstName, lastName } = splitName(name, email)
  const { error: profileError } = await supabaseAdmin
    .from('UserProfile')
    .upsert({
      userId: user.id,
      email,
      firstName,
      lastName,
      phone: phone || null,
      signupSource,
      signup_source: signupSource,
      email_verified: false,
      updatedAt: new Date().toISOString(),
    }, { onConflict: 'userId' })

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  const otpResponse = await fetch(new URL('/api/auth/send-otp', request.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      name,
      userId: user.id,
    }),
  })

  if (!otpResponse.ok) {
    await supabaseAdmin
      .from('UserProfile')
      .delete()
      .eq('userId', user.id)
    await supabaseAdmin.auth.admin.deleteUser(user.id)
    return NextResponse.json({ error: await readApiError(otpResponse) }, { status: otpResponse.status })
  }

  return NextResponse.json({ ok: true, userId: user.id })
}

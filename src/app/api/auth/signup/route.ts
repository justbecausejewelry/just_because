import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rateLimit'

export const runtime = 'nodejs'

type SignupBody = {
  email?: unknown
  password?: unknown
  name?: unknown
  phone?: unknown
  signupSource?: unknown
}

const signupSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  name: z.string().trim().min(1, 'Please enter your name').max(120),
  phone: z.string().trim().max(40).optional(),
  signupSource: z.string().trim().max(40).optional(),
})

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

export async function POST(req: Request) {
  console.log('[signup] step 1: handler entered')

  let step = 'handler-entered'

  try {
    step = 'parse-body'
    const body: unknown = await req.json()
    console.log('[signup] step 2: body parsed')
    console.log('[signup]', step, 'OK')

    step = 'rate-limit'
    const limit = checkRateLimit({
      key: `signup:${getClientIp(req)}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    })
    console.log('[signup]', step, 'OK', limit)
    if (!limit.ok) {
      console.log('[signup]', step, 'blocked until', limit.resetAt)
      return rateLimitResponse(limit.resetAt)
    }

    step = 'check-env'
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Signup service is not configured')
    }
    console.log('[signup]', step, 'OK')

    step = 'validate-body'
    const parsed = signupSchema.safeParse(isRecord(body) ? body : {})
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      console.log('[signup]', step, 'invalid payload', issue?.path.join('.') || 'signup')
      return NextResponse.json({ error: issue?.message || 'Invalid signup payload' }, { status: 400 })
    }

    const email = normalizeEmail(parsed.data.email)
    const password = parsed.data.password
    const name = cleanText(parsed.data.name, 120)
    const phone = cleanText(parsed.data.phone, 40)
    const signupSource = cleanText(parsed.data.signupSource, 40) || 'direct'
    console.log('[signup]', step, 'OK', {
      email,
      hasPassword: !!password,
      hasName: !!name,
      hasPhone: !!phone,
      signupSource,
    })

    step = 'init-supabase'
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    console.log('[signup] step 3: supabase admin client created')
    console.log('[signup]', step, 'OK')

    step = 'create-auth-user'
    const { data: createdUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        full_name: name,
      },
    })
    if (createError) throw new Error(`createUser failed: ${createError.message}`)
    console.log('[signup]', step, 'OK', {
      userId: createdUserData.user?.id,
      email: createdUserData.user?.email,
    })

    const user = createdUserData.user
    if (!user) {
      throw new Error('createUser returned no user')
    }

    step = 'upsert-user-profile'
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
      console.error('[signup]', step, 'failed; deleting auth user', {
        userId: user.id,
        profileError,
      })
      step = 'cleanup-auth-user-after-profile-failure'
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      if (deleteUserError) {
        console.error('[signup]', step, 'cleanup failed', deleteUserError)
      } else {
        console.log('[signup]', step, 'OK')
      }

      throw new Error(`UserProfile upsert failed: ${profileError.message}`)
    }
    console.log('[signup]', step, 'OK', { userId: user.id })

    step = 'call-send-otp'
    const sendOtpUrl = new URL('/api/auth/send-otp', req.url)
    console.log('[signup]', step, 'request', sendOtpUrl.toString())
    const otpResponse = await fetch(sendOtpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name,
        userId: user.id,
      }),
    })
    console.log('[signup]', step, 'response', {
      ok: otpResponse.ok,
      status: otpResponse.status,
      statusText: otpResponse.statusText,
    })

    if (!otpResponse.ok) {
      const otpError = await readApiError(otpResponse)
      console.error('[signup]', step, 'failed', {
        status: otpResponse.status,
        error: otpError,
      })

      step = 'cleanup-profile-after-otp-failure'
      const { error: deleteProfileError } = await supabaseAdmin
        .from('UserProfile')
        .delete()
        .eq('userId', user.id)
      if (deleteProfileError) {
        console.error('[signup]', step, 'cleanup failed', deleteProfileError)
      } else {
        console.log('[signup]', step, 'OK')
      }

      step = 'cleanup-auth-user-after-otp-failure'
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      if (deleteUserError) {
        console.error('[signup]', step, 'cleanup failed', deleteUserError)
      } else {
        console.log('[signup]', step, 'OK')
      }

      throw new Error(`send-otp failed: ${otpError}`)
    }
    console.log('[signup] call-send-otp OK')

    step = 'return-success'
    console.log('[signup]', step, 'OK', { userId: user.id })
    return NextResponse.json({ ok: true, userId: user.id })
  } catch (err) {
    console.error('[signup] FAILED at step:', step)
    console.error('[signup] Error:', err)
    console.error('[signup] Message:', err instanceof Error ? err.message : 'Unknown')
    console.error('[signup] Stack:', err instanceof Error ? err.stack : '')
    console.error('[signup] Full error:', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

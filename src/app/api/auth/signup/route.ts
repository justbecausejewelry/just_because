import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getAuthErrorMessage } from '@/lib/errors'
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
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Signup service is not configured')
    }
    console.log('[signup]', step, 'OK')

    step = 'validate-body'
    const parsed = signupSchema.safeParse(isRecord(body) ? body : {})
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      console.log('[signup]', step, 'invalid payload', issue?.path.join('.') || 'signup')
      return NextResponse.json({ error: getAuthErrorMessage(issue?.message) }, { status: 400 })
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
    const supabasePublic = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    console.log('[signup] step 3: supabase admin client created')
    console.log('[signup]', step, 'OK')

    step = 'create-auth-user'
    const redirectUrl = new URL('/auth/callback', req.url)
    redirectUrl.searchParams.set('next', '/account')
    const { data: createdUserData, error: createError } = await supabasePublic.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl.toString(),
        data: {
          name,
          full_name: name,
        },
      },
    })
    if (createError) throw createError

    if (createdUserData.user?.identities && createdUserData.user.identities.length === 0) {
      return NextResponse.json({ error: 'User already registered' }, { status: 409 })
    }

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
        email_verified: Boolean(user.email_confirmed_at),
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

      throw profileError
    }
    console.log('[signup]', step, 'OK', { userId: user.id })

    step = 'return-success'
    console.log('[signup]', step, 'OK', { userId: user.id })
    return NextResponse.json({ ok: true, userId: user.id })
  } catch (err) {
    console.error('[signup] FAILED at step:', step)
    console.error('[signup] Error:', err)
    console.error('[signup] Message:', err instanceof Error ? err.message : 'Unknown')
    console.error('[signup] Stack:', err instanceof Error ? err.stack : '')
    console.error('[signup] Full error:', err)
    return Response.json({ error: getAuthErrorMessage(err) }, { status: 500 })
  }
}

import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType, User } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const allowedOtpTypes = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
])

function safeRedirectPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/account'
  }

  return value
}

function normalizeOtpType(value: string | null): EmailOtpType | null {
  if (!value) return null

  const otpType = value as EmailOtpType
  return allowedOtpTypes.has(otpType) ? otpType : null
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const otpType = normalizeOtpType(searchParams.get('type'))
  const next = safeRedirectPath(searchParams.get('next'))
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  console.log('[auth/callback] route hit:', {
    hasCode: Boolean(code),
    hasTokenHash: Boolean(tokenHash),
    type: searchParams.get('type'),
    next,
    error,
  })

  if (error) {
    console.error('[auth/callback] provider returned error:', error, errorDescription)
    return NextResponse.redirect(`${origin}/login?error=verification_failed`)
  }

  const cookieStore = await cookies()
  let response = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          response = NextResponse.redirect(`${origin}${next}`)

          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = {
              ...options,
              path: options.path ?? '/',
            }

            cookieStore.set(name, value, cookieOptions)
            response.cookies.set(name, value, cookieOptions)
          })
        },
      },
    }
  )

  const ensureVerifiedProfile = async (user: User | null) => {
    if (!user?.email) return

    const name = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : user.email.split('@')[0]
    const nameParts = name.trim().split(/\s+/)
    const now = new Date().toISOString()
    const { data: existingProfile, error: profileLookupError } = await supabase
      .from('UserProfile')
      .select('userId')
      .eq('userId', user.id)
      .maybeSingle()

    if (profileLookupError) {
      console.error('[auth/callback] profile lookup failed:', profileLookupError.message)
      return
    }

    if (existingProfile) {
      const { error: updateProfileError } = await supabase
        .from('UserProfile')
        .update({
          email_verified: true,
          updatedAt: now,
        })
        .eq('userId', user.id)

      if (updateProfileError) {
        console.error('[auth/callback] profile verification update failed:', updateProfileError.message)
      }
      return
    }

    const { error: insertProfileError } = await supabase
      .from('UserProfile')
      .insert({
        userId: user.id,
        email: user.email,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' '),
        signupSource: 'direct',
        signup_source: 'direct',
        email_verified: true,
        updatedAt: now,
      })

    if (insertProfileError) {
      console.error('[auth/callback] verified profile insert failed:', insertProfileError.message)
    }
  }

  try {
    if (tokenHash && otpType) {
      console.log('[auth/callback] verifying token hash before session cookie write')
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType,
      })

      if (verifyError) {
        console.error('[auth/callback] verifyOtp failed:', verifyError.message)
        return NextResponse.redirect(`${origin}/login?error=verification_failed`)
      }

      await ensureVerifiedProfile(data.user)
      console.log('[auth/callback] verifyOtp succeeded; redirecting with session cookies')
      return response
    }

    if (code) {
      console.log('[auth/callback] exchanging code before session cookie write')
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('[auth/callback] exchangeCodeForSession failed:', exchangeError.message)
        return NextResponse.redirect(`${origin}/login?error=verification_failed`)
      }

      await ensureVerifiedProfile(data.session?.user || data.user)
      console.log('[auth/callback] exchangeCodeForSession succeeded; redirecting with session cookies')
      return response
    }

    console.error('[auth/callback] missing code or token_hash parameters')
  } catch (callbackError) {
    console.error('[auth/callback] unexpected failure:', callbackError)
  }

  return NextResponse.redirect(`${origin}/login?error=verification_failed`)
}

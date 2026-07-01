'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { BrandLogo } from '@/components/ui/BrandLogo'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { getAuthErrorMessage, readFriendlyApiError } from '@/lib/errors'
import { supabase } from '@/lib/supabase'

const AUTH_TIMEOUT_MS = 10000

type VerifyResponse = {
  ok?: unknown
  email?: unknown
  magicToken?: unknown
  magicType?: unknown
}

function delay(ms: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms))
}

function withTimeout<T>(promise: PromiseLike<T>, label: string, timeoutMs = AUTH_TIMEOUT_MS): Promise<T> {
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | null = null

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      reject(new Error(label))
    }, timeoutMs)
  })

  return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() => {
    if (timeoutId) {
      globalThis.clearTimeout(timeoutId)
    }
  })
}

function getPendingEmail(searchEmail: string | null) {
  if (searchEmail) return searchEmail.trim().toLowerCase()
  if (typeof window === 'undefined') return ''
  return (window.localStorage.getItem('pendingVerifyEmail') || '').trim().toLowerCase()
}

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const pendingEmail = getPendingEmail(searchParams.get('email'))
    if (!pendingEmail) return

    setEmail(pendingEmail)
    window.localStorage.setItem('pendingVerifyEmail', pendingEmail)
  }, [searchParams])

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (loading || isRedirecting) return

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedCode = code.replace(/\D/g, '')

    if (!normalizedEmail) {
      setError('Enter the email address you used to sign up.')
      return
    }

    if (!/^\d{4}$/.test(normalizedCode)) {
      setError('Enter the 4-digit code sent to your email.')
      return
    }

    setLoading(true)
    setError('')
    setNotice('')

    try {
      const verifyResponse = await withTimeout(fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, code: normalizedCode }),
      }), 'Verification timed out. Please try again.')

      if (!verifyResponse.ok) {
        setError(await readFriendlyApiError(verifyResponse, getAuthErrorMessage))
        return
      }

      const verifyBody = (await verifyResponse.json().catch(() => ({}))) as VerifyResponse
      const magicToken = typeof verifyBody.magicToken === 'string' ? verifyBody.magicToken : ''
      const verifiedEmail = typeof verifyBody.email === 'string' ? verifyBody.email.trim().toLowerCase() : normalizedEmail

      if (!magicToken) {
        console.error('[verify] missing magic token after OTP validation')
        setError('We verified your code, but could not sign you in. Please try signing in.')
        return
      }

      const { error: otpError } = await withTimeout(
        supabase.auth.verifyOtp({
          email: verifiedEmail,
          token: magicToken,
          type: 'magiclink',
        }),
        'Session creation timed out. Please try again.'
      )

      if (otpError) {
        console.error('[verify] magic token exchange failed:', otpError)
        setError('Verification succeeded but sign-in failed. Please sign in.')
        setIsRedirecting(true)
        router.replace('/login')
        return
      }

      await delay(500)

      window.localStorage.removeItem('pendingVerifyEmail')
      setIsRedirecting(true)
      router.replace('/account')
    } catch (caught) {
      console.error('[verify] verification failed:', caught)
      setError(caught instanceof Error ? caught.message : getAuthErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      setError('Enter your email address so we can resend the code.')
      return
    }

    setResendLoading(true)
    setError('')
    setNotice('')

    try {
      const response = await withTimeout(fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      }), 'Resend request timed out. Please try again.')

      if (!response.ok) {
        setError(await readFriendlyApiError(response, getAuthErrorMessage))
        return
      }

      window.localStorage.setItem('pendingVerifyEmail', normalizedEmail)
      setNotice('Code sent!')
    } catch (caught) {
      console.error('[verify] resend code failed:', caught)
      setError(caught instanceof Error ? caught.message : getAuthErrorMessage(caught))
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <main style={{ background: '#FBF5F0', minHeight: '100vh', padding: '40px 20px', color: '#1A1014' }}>
      <div style={{ maxWidth: '440px', margin: '0 auto', minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <BrandLogo size="lg" href="/" />
        </div>

        <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '36px 28px' }}>
          <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.3em', margin: '0 0 18px', textAlign: 'center' }}>
            VERIFY EMAIL
          </p>
          <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '34px', fontWeight: 400, lineHeight: 1.1, margin: '0 0 14px', textAlign: 'center' }}>
            Enter your code
          </h1>
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '14px', lineHeight: 1.8, margin: '0 0 28px', textAlign: 'center' }}>
            We sent a 4-digit verification code to your email. Enter it below to activate your account.
          </p>

          {error ? <ErrorMessage message={error} /> : null}

          {notice ? (
            <div style={{
              background: '#FBF5F0',
              border: '0.5px solid #EDD9AF',
              color: '#1A1014',
              fontFamily: 'var(--font-inter)',
              fontSize: '13px',
              marginBottom: '18px',
              padding: '12px 14px',
              textAlign: 'center',
            }}>
              {notice}
            </div>
          ) : null}

          <form onSubmit={(event) => void handleVerify(event)}>
            <label style={{ display: 'block', marginBottom: '18px' }}>
              <span style={{ display: 'block', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.25em', marginBottom: '8px' }}>
                EMAIL ADDRESS
              </span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                style={{
                  background: '#FBF5F0',
                  border: '0.5px solid #EDD9AF',
                  boxSizing: 'border-box',
                  color: '#1A1014',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '14px',
                  outline: 'none',
                  padding: '14px 16px',
                  width: '100%',
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '24px' }}>
              <span style={{ display: 'block', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.25em', marginBottom: '8px' }}>
                VERIFICATION CODE
              </span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                style={{
                  background: '#FBF5F0',
                  border: '0.5px solid #EDD9AF',
                  boxSizing: 'border-box',
                  color: '#1A1014',
                  fontFamily: 'var(--font-playfair)',
                  fontSize: '28px',
                  letterSpacing: '0.4em',
                  outline: 'none',
                  padding: '12px 16px',
                  textAlign: 'center',
                  width: '100%',
                }}
              />
            </label>

            <button
              type="submit"
              disabled={loading || isRedirecting}
              style={{
                background: loading || isRedirecting ? '#575757' : '#1A1014',
                border: 'none',
                color: '#FBF5F0',
                cursor: loading || isRedirecting ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                letterSpacing: '0.22em',
                padding: '16px',
                transition: 'background 0.3s ease',
                width: '100%',
              }}
            >
              {loading || isRedirecting ? 'VERIFYING...' : 'VERIFY EMAIL'}
            </button>
          </form>

          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.8, margin: '22px 0 0', textAlign: 'center' }}>
            Did not receive it?{' '}
            <button
              type="button"
              onClick={() => void handleResendCode()}
              disabled={resendLoading}
              style={{
                background: 'none',
                border: 'none',
                color: '#C9A961',
                cursor: resendLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              {resendLoading ? 'sending...' : 'resend code'}
            </button>
          </p>

          <p style={{ margin: '22px 0 0', textAlign: 'center' }}>
            <Link href="/login" style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', textDecoration: 'none' }}>
              Back to sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<main style={{ background: '#FBF5F0', minHeight: '100vh' }} />}>
      <VerifyContent />
    </Suspense>
  )
}

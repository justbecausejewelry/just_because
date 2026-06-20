"use client"

import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { supabaseAuth } from '@/lib/auth'
import { useToast } from '@/context/ToastContext'
import { useFormPersistence } from '@/hooks/useFormPersistence'
import { BrandLogo } from '@/components/ui/BrandLogo'

function strengthFor(password: string) {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  return score
}

type SignupFieldErrors = Partial<Record<'name' | 'email' | 'password' | 'confirmPassword' | 'terms', string>>

function validateSignupFields({
  name,
  email,
  password,
  confirmPassword,
  termsAccepted,
}: {
  name: string
  email: string
  password: string
  confirmPassword: string
  termsAccepted: boolean
}) {
  const errors: SignupFieldErrors = {}
  const normalizedEmail = email.trim().toLowerCase()

  if (!name.trim()) {
    errors.name = 'Enter your full name.'
  }

  if (!normalizedEmail) {
    errors.email = 'Enter your email address.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!password) {
    errors.password = 'Enter a password.'
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm your password.'
  } else if (password && password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  if (!termsAccepted) {
    errors.terms = 'You must agree to the Terms of Service and Privacy Policy to continue.'
  }

  return errors
}

async function readApiError(response: Response, fallback: string) {
  const body: unknown = await response.json().catch(() => null)
  if (typeof body === 'object' && body !== null && 'error' in body) {
    const message = (body as { error?: unknown }).error
    if (typeof message === 'string' && message.trim()) return message
  }

  return fallback
}

export default function SignupPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({})
  const [showVerifyScreen, setShowVerifyScreen] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [resendMessage, setResendMessage] = useState('')
  const strength = useMemo(() => strengthFor(password), [password])
  const strengthColor = strength <= 1 ? '#A85C6A' : strength === 2 ? '#B7791F' : strength === 3 ? '#C9A961' : '#7A8F72'
  const signupDraft = useMemo(() => ({
    name,
    email,
    termsAccepted,
    showVerifyScreen,
  }), [email, name, showVerifyScreen, termsAccepted])
  const clearPersistedSignup = useFormPersistence('signup_form_v1', signupDraft, (updater) => {
    const next = typeof updater === 'function' ? updater(signupDraft) : updater
    if (typeof next.name === 'string') setName(next.name)
    if (typeof next.email === 'string') setEmail(next.email)
    if (typeof next.termsAccepted === 'boolean') setTermsAccepted(next.termsAccepted)
    if (typeof next.showVerifyScreen === 'boolean') setShowVerifyScreen(next.showVerifyScreen)
  })

  useEffect(() => {
    const verifyEmail = new URLSearchParams(window.location.search).get('verifyEmail')
    if (!verifyEmail) return

    setEmail(verifyEmail)
    setShowVerifyScreen(true)
    setFieldErrors({})
    setError('Please verify your email before signing in.')
  }, [])

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setError('')
    setResendMessage('')
    const normalizedEmail = email.trim().toLowerCase()
    const validationErrors = validateSignupFields({
      name,
      email: normalizedEmail,
      password,
      confirmPassword,
      termsAccepted,
    })

    setFieldErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setLoading(true)

    const signupResponse = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
        name: name.trim(),
        signupSource: 'direct',
      }),
    })

    setLoading(false)

    if (!signupResponse.ok) {
      setError(await readApiError(signupResponse, 'Unable to create account. Please try again.'))
      return
    }

    setEmail(normalizedEmail)
    setVerificationCode('')
    setShowVerifyScreen(true)
    showToast('A 4-digit verification code was sent to your email.', 'success')
  }

  const handleVerifyEmail = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    const code = verificationCode.replace(/\D/g, '')

    setError('')
    setResendMessage('')

    if (!normalizedEmail || code.length !== 4) {
      setError('Enter the 4-digit code sent to your email.')
      return
    }

    setLoading(true)

    const verifyResponse = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        code,
      }),
    })

    if (!verifyResponse.ok) {
      setError(await readApiError(verifyResponse, 'Invalid or expired verification code.'))
      setLoading(false)
      return
    }

    if (password) {
      const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (signInError) {
        clearPersistedSignup()
        showToast('Email verified. Please sign in to continue.', 'success')
        router.push(`/login?verified=1&email=${encodeURIComponent(normalizedEmail)}`)
        return
      }

      clearPersistedSignup()
      showToast('Email verified. Welcome to Just Because.', 'success')
      router.push('/account')
      return
    }

    clearPersistedSignup()
    showToast('Email verified. Please sign in to continue.', 'success')
    router.push(`/login?verified=1&email=${encodeURIComponent(normalizedEmail)}`)
  }

  const handleResendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase()

    setError('')
    setResendMessage('')

    if (!normalizedEmail) {
      setError('Enter your email address to resend the code.')
      return
    }

    setLoading(true)

    const resendResponse = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        name: name.trim(),
      }),
    })

    setLoading(false)

    if (!resendResponse.ok) {
      setError(await readApiError(resendResponse, 'Unable to resend a verification code.'))
      return
    }

    setEmail(normalizedEmail)
    setVerificationCode('')
    setResendMessage('A fresh 4-digit verification code has been sent.')
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .login-wrap {
            display: block !important;
          }

          .login-left {
            display: none !important;
          }

          .login-right {
            width: 100% !important;
            height: 100vh !important;
            padding: 40px 28px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: stretch !important;
            overflow: hidden !important;
            border-left: none !important;
          }

          .login-form-inner {
            max-width: 100% !important;
            margin: 0 auto;
          }

          .mobile-logo {
            display: block !important;
          }

          .signup-input {
            font-size: 16px !important;
          }

          .login-right button {
            min-height: 52px;
          }
        }
      `}</style>

      <div className="login-wrap" style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#FBF5F0',
    }}>
      <div className="login-left" style={{
        width: '52%',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <Image
          src="/images/login-hero.jpg"
          alt="Just Because diamond ring"
          fill
          sizes="(max-width: 900px) 100vw, 45vw"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority
          quality={95}
        />

        <div style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(
            to bottom,
            rgba(26,16,20,0.72) 0%,
            rgba(26,16,20,0.15) 35%,
            rgba(26,16,20,0.08) 55%,
            rgba(26,16,20,0.65) 100%
          )`,
        }} />

        <div style={{
          position: 'absolute',
          top: '40px',
          left: '48px',
          zIndex: 2,
        }}>
          <AuthLogo />
        </div>

        <div style={{
          position: 'absolute',
          bottom: '48px',
          left: '48px',
          right: '48px',
          zIndex: 2,
        }}>
          <div style={{
            width: '40px',
            height: '1px',
            background: '#C9A961',
            marginBottom: '16px',
          }} />

          <h2 style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '52px',
            fontWeight: 400,
            color: '#FBF5F0',
            lineHeight: 1,
            marginBottom: '8px',
          }}>
            Begin your
          </h2>
          <h2 style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '52px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: '#C9A961',
            lineHeight: 1,
            marginBottom: '24px',
          }}>
            story.
          </h2>

          <p style={{
            fontSize: '13px',
            color: 'rgba(251,245,240,0.7)',
            fontFamily: 'var(--font-inter)',
            letterSpacing: '0.05em',
            marginBottom: '28px',
          }}>
            Create your Just Because account.
          </p>

          <div style={{
            width: '100%',
            height: '0.5px',
            background: 'rgba(201,169,97,0.3)',
            marginBottom: '24px',
          }} />

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            {[
              { q: '"The most beautiful buying experience."', name: 'Priya M.' },
              { q: '"Quietly luxurious, from start to finish."', name: 'Sarah K.' },
            ].map((r, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}>
                <span style={{
                  color: '#C9A961',
                  fontSize: '12px',
                  flexShrink: 0,
                  marginTop: '1px',
                }}>★</span>
                <div>
                  <p style={{
                    fontFamily: 'var(--font-playfair)',
                    fontStyle: 'italic',
                    fontSize: '13px',
                    color: 'rgba(251,245,240,0.9)',
                    lineHeight: 1.5,
                    marginBottom: '3px',
                  }}>{r.q}</p>
                  <span style={{
                    fontSize: '11px',
                    color: 'rgba(201,169,97,0.7)',
                    fontFamily: 'var(--font-inter)',
                    letterSpacing: '0.08em',
                  }}>{r.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          position: 'absolute',
          top: '40px',
          right: '32px',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '3px',
        }}>
          <div style={{ width: '24px', height: '0.5px', background: 'rgba(201,169,97,0.4)' }} />
          <div style={{ width: '16px', height: '0.5px', background: 'rgba(201,169,97,0.3)' }} />
          <div style={{ width: '8px', height: '0.5px', background: 'rgba(201,169,97,0.2)' }} />
        </div>
      </div>

      <div className="login-right" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '34px 64px',
        background: '#FFFFFF',
        borderLeft: '0.5px solid #EDD9AF',
        overflow: 'hidden',
      }}>
        <div className="mobile-logo" style={{
          display: 'none',
          marginBottom: '36px',
        }}>
          <BrandLogo size="lg" href="/" />
        </div>

        {showVerifyScreen ? (
          <form
            className="login-form-inner"
            onSubmit={(event) => void handleVerifyEmail(event)}
            style={{
              width: '100%',
              maxWidth: '400px',
            }}
          >
            <div style={{ marginBottom: '26px' }}>
              <p style={{
                color: '#C9A961',
                fontFamily: 'var(--font-inter)',
                fontSize: '10px',
                letterSpacing: '0.3em',
                marginBottom: '10px',
              }}>
                EMAIL VERIFICATION
              </p>
              <h1 style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: '34px',
                fontWeight: 400,
                color: '#1A1014',
                marginBottom: '8px',
                lineHeight: 1.1,
              }}>
                Verify your email
              </h1>
              <p style={{
                fontSize: '13px',
                color: '#1A1014',
                fontFamily: 'var(--font-inter)',
                lineHeight: 1.6,
              }}>
                Enter the 4-digit code sent to {email || 'your email address'}.
              </p>
            </div>

            {error && (
              <div style={{
                background: '#FCF0F4',
                border: '1px solid #A85C6A',
                padding: '10px 14px',
                marginBottom: '14px',
                fontSize: '12px',
                color: '#A85C6A',
                fontFamily: 'var(--font-inter)',
              }}>
                {error}
              </div>
            )}

            {resendMessage && (
              <div style={{
                background: '#FDF8F2',
                border: '1px solid #7A8F72',
                padding: '10px 14px',
                marginBottom: '14px',
                fontSize: '12px',
                color: '#7A8F72',
                fontFamily: 'var(--font-inter)',
              }}>
                {resendMessage}
              </div>
            )}

            <AuthInput
              label="EMAIL ADDRESS"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="your@email.com"
            />

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '9px',
                letterSpacing: '0.25em',
                color: '#1A1014',
                fontFamily: 'var(--font-inter)',
                marginBottom: '8px',
              }}>
                VERIFICATION CODE
              </label>
              <input
                className="signup-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                maxLength={4}
                style={inputStyle}
                onFocus={(event) => {
                  event.target.style.borderColor = '#1A1014'
                }}
                onBlur={(event) => {
                  event.target.style.borderColor = '#D4C4B0'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 4}
              style={{
                width: '100%',
                padding: '16px',
                background: loading || verificationCode.length !== 4 ? '#B8A090' : '#1A1014',
                color: '#FBF5F0',
                border: 'none',
                fontSize: '12px',
                letterSpacing: '0.2em',
                fontFamily: 'var(--font-inter)',
                cursor: loading || verificationCode.length !== 4 ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s',
                marginBottom: '12px',
              }}
            >
              {loading ? 'VERIFYING...' : 'VERIFY EMAIL'}
            </button>

            <button
              type="button"
              onClick={() => void handleResendCode()}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                color: '#1A1014',
                border: '1px solid #EDD9AF',
                fontSize: '11px',
                letterSpacing: '0.18em',
                fontFamily: 'var(--font-inter)',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '12px',
              }}
            >
              RESEND CODE
            </button>

            <button
              type="button"
              onClick={() => {
                setShowVerifyScreen(false)
                setVerificationCode('')
                setError('')
                setResendMessage('')
              }}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                color: 'var(--color-muted-text)',
                border: 'none',
                fontSize: '11px',
                letterSpacing: '0.18em',
                fontFamily: 'var(--font-inter)',
                cursor: 'pointer',
              }}
            >
              CREATE ACCOUNT AGAIN
            </button>
          </form>
        ) : (
        <form
          className="login-form-inner"
          onSubmit={(event) => void handleSubmit(event)}
          style={{
            width: '100%',
            maxWidth: '400px',
          }}
        >
          <div style={{ marginBottom: '26px' }}>
            <h1 style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '34px',
              fontWeight: 400,
              color: '#1A1014',
              marginBottom: '8px',
              lineHeight: 1.1,
            }}>
              Create account
            </h1>
            <p style={{
              fontSize: '13px',
              color: '#1A1014',
              fontFamily: 'var(--font-inter)',
            }}>
              Already have an account?{' '}
              <Link href="/login" style={{
                color: '#C9A961',
                textDecoration: 'none',
                fontWeight: 600,
              }}>
                Sign in →
              </Link>
            </p>
          </div>

          {error && (
            <div style={{
              background: '#FFF0F0',
              border: '1px solid #A85C6A',
              padding: '10px 14px',
              marginBottom: '14px',
              fontSize: '12px',
              color: '#A85C6A',
              fontFamily: 'var(--font-inter)',
            }}>
              {error}
            </div>
          )}

          <AuthInput
            label="FULL NAME"
            type="text"
            value={name}
            onChange={(value) => {
              setName(value)
              setFieldErrors((current) => ({ ...current, name: undefined }))
            }}
            placeholder="Your name"
            error={fieldErrors.name}
          />
          <AuthInput
            label="EMAIL ADDRESS"
            type="email"
            value={email}
            onChange={(value) => {
              setEmail(value)
              setFieldErrors((current) => ({ ...current, email: undefined }))
            }}
            placeholder="your@email.com"
            error={fieldErrors.email}
          />

          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '9px',
              letterSpacing: '0.25em',
              color: '#1A1014',
              fontFamily: 'var(--font-inter)',
              marginBottom: '8px',
            }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="signup-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setFieldErrors((current) => ({ ...current, password: undefined, confirmPassword: undefined }))
                }}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={(event) => {
                  event.target.style.borderColor = '#1A1014'
                }}
                onBlur={(event) => {
                  event.target.style.borderColor = '#D4C4B0'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--color-muted-text)',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{
              color: password.length >= 8 ? '#7A8F72' : 'var(--color-muted-text)',
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              lineHeight: 1.5,
              marginTop: '8px',
            }}>
              At least 8 characters
            </div>
            {fieldErrors.password ? (
              <div style={fieldErrorStyle}>{fieldErrors.password}</div>
            ) : null}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {Array.from({ length: 4 }, (_, index) => (
              <span key={index} style={{ backgroundColor: index < strength ? strengthColor : '#EDD9AF', height: '4px' }} />
            ))}
          </div>

          <AuthInput
            label="CONFIRM PASSWORD"
            type="password"
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value)
              setFieldErrors((current) => ({ ...current, confirmPassword: undefined }))
            }}
            placeholder="••••••••"
            error={fieldErrors.confirmPassword}
          />

          <label style={{
            color: '#1A1014',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontFamily: 'var(--font-inter)',
            fontSize: '12px',
            lineHeight: 1.5,
            margin: '4px 0 6px',
          }}>
            <input
              checked={termsAccepted}
              onChange={(event) => {
                setTermsAccepted(event.target.checked)
                setFieldErrors((current) => ({ ...current, terms: undefined }))
              }}
              type="checkbox"
              style={{ accentColor: '#C9A961', marginTop: '3px' }}
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" target="_blank" rel="noreferrer" style={{ color: '#C9A961', textDecoration: 'none' }}>
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy-policy" target="_blank" rel="noreferrer" style={{ color: '#C9A961', textDecoration: 'none' }}>
                Privacy Policy
              </Link>
            </span>
          </label>
          {fieldErrors.terms ? (
            <div style={{ ...fieldErrorStyle, marginBottom: '16px' }}>{fieldErrors.terms}</div>
          ) : (
            <div style={{ marginBottom: '16px' }} />
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#888' : '#1A1014',
              color: '#FBF5F0',
              border: 'none',
              fontSize: '12px',
              letterSpacing: '0.2em',
              fontFamily: 'var(--font-inter)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s',
              marginBottom: '18px',
            }}
          >
            {loading ? 'CREATING...' : 'CREATE ACCOUNT →'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              padding: '14px',
              background: 'transparent',
              color: '#1A1014',
              border: '1px solid #1A1014',
              fontSize: '11px',
              letterSpacing: '0.18em',
              fontFamily: 'var(--font-inter)',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = '#1A1014'
              event.currentTarget.style.color = '#FBF5F0'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = 'transparent'
              event.currentTarget.style.color = '#1A1014'
            }}
          >
            CONTINUE AS GUEST →
          </button>
        </form>
        )}
      </div>
    </div>
    </>
  )
}

function AuthInput({
  label,
  type,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  error?: string
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '9px',
        letterSpacing: '0.25em',
        color: '#1A1014',
        fontFamily: 'var(--font-inter)',
        marginBottom: '8px',
      }}>
        {label}
      </label>
      <input
        className="signup-input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={(event) => {
          event.target.style.borderColor = '#1A1014'
        }}
        onBlur={(event) => {
          event.target.style.borderColor = '#D4C4B0'
        }}
      />
      {error ? (
        <div style={fieldErrorStyle}>{error}</div>
      ) : null}
    </div>
  )
}

const fieldErrorStyle: CSSProperties = {
  color: '#A85C6A',
  fontFamily: 'var(--font-inter)',
  fontSize: '11px',
  lineHeight: 1.5,
  marginTop: '6px',
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  background: '#FFFFFF',
  border: '1px solid #D4C4B0',
  color: '#1A1014',
  fontSize: '14px',
  fontFamily: 'var(--font-inter)',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
}

function AuthLogo() {
  return <BrandLogo size="lg" href="/" />
}

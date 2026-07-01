"use client"

import type { CSSProperties, FormEvent } from 'react'
import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { supabaseAuth } from '@/lib/auth'
import { getAuthErrorMessage, isAlreadyRegisteredError, readFriendlyApiError } from '@/lib/errors'
import { useToast } from '@/context/ToastContext'
import { useFormPersistence } from '@/hooks/useFormPersistence'
import { BrandLogo } from '@/components/ui/BrandLogo'
import ErrorMessage from '@/components/ui/ErrorMessage'

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
    errors.password = 'Please choose a password that is at least 8 characters long.'
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
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState('')
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({})
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const [resendMessage, setResendMessage] = useState('')
  const strength = useMemo(() => strengthFor(password), [password])
  const strengthColor = strength <= 1 ? '#A85C6A' : strength === 2 ? '#B7791F' : strength === 3 ? '#C9A961' : '#7A8F72'
  const signupDraft = useMemo(() => ({
    name,
    email,
    termsAccepted,
  }), [email, name, termsAccepted])
  const clearPersistedSignup = useFormPersistence('signup_form_v1', signupDraft, (updater) => {
    const next = typeof updater === 'function' ? updater(signupDraft) : updater
    if (typeof next.name === 'string') setName(next.name)
    if (typeof next.email === 'string') setEmail(next.email)
    if (typeof next.termsAccepted === 'boolean') setTermsAccepted(next.termsAccepted)
  })

  const handleResend = async () => {
    const targetEmail = (confirmationEmail || email).trim().toLowerCase()
    if (!targetEmail) {
      setError('Enter your email address so we can resend the confirmation link.')
      return
    }

    setResendLoading(true)
    setError('')
    setResendMessage('')

    const { error: resendError } = await supabaseAuth.auth.resend({
      type: 'signup',
      email: targetEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    })

    setResendLoading(false)

    if (resendError) {
      setError(getAuthErrorMessage(resendError))
      return
    }

    setResendMessage('We sent a fresh confirmation link.')
    showToast('Confirmation email resent.', 'success')
  }

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setError('')
    setAlreadyRegistered(false)
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

    try {
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
        const message = await readFriendlyApiError(signupResponse, getAuthErrorMessage)
        setAlreadyRegistered(isAlreadyRegisteredError(message))
        setError(message)
        return
      }

      setEmail(normalizedEmail)
      setConfirmationEmail(normalizedEmail)
      clearPersistedSignup()
      showToast('Check your email for your confirmation link.', 'success')
    } catch (caught) {
      console.error('[signup] account creation failed:', caught)
      setLoading(false)
      setError(getAuthErrorMessage(caught))
    }
  }

  if (confirmationEmail) {
    return (
      <div style={{
        background: '#FBF5F0',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <p style={{
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: '#C9A961',
            marginBottom: '24px',
          }}>
            CHECK YOUR EMAIL
          </p>
          <h1 style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '28px',
            color: '#1A1014',
            fontWeight: 400,
            marginBottom: '16px',
          }}>
            One last step.
          </h1>
          <p style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '14px',
            color: '#B8A090',
            lineHeight: '1.8',
            marginBottom: '32px',
          }}>
            We sent a confirmation link to <strong style={{ color: '#1A1014' }}>{confirmationEmail}</strong>.
            Click the link in that email to activate your account and start shopping.
          </p>
          {error ? <ErrorMessage message={error} /> : null}
          {resendMessage ? (
            <p style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              color: '#7A8F72',
              marginBottom: '16px',
            }}>
              {resendMessage}
            </p>
          ) : null}
          <p style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '12px',
            color: '#B8A090',
            lineHeight: 1.7,
          }}>
            Did not receive it? Check your spam folder or{' '}
            <button
              onClick={() => void handleResend()}
              disabled={resendLoading}
              style={{
                color: '#C9A961',
                background: 'none',
                border: 'none',
                cursor: resendLoading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              {resendLoading ? 'sending...' : 'resend the email'}
            </button>
          </p>
        </div>
      </div>
    )
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
                  }}>*</span>
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
        </div>

        <div className="login-right" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '34px 64px',
          background: '#FDF8F2',
          borderLeft: '0.5px solid #EDD9AF',
          overflow: 'hidden',
        }}>
          <div className="mobile-logo" style={{
            display: 'none',
            marginBottom: '36px',
          }}>
            <BrandLogo size="lg" href="/" />
          </div>

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
                  fontWeight: 500,
                }}>
                  Sign in &gt;
                </Link>
              </p>
            </div>

            {alreadyRegistered ? (
              <>
                <ErrorMessage
                  message="It looks like you already have an account with us."
                  action={{
                    label: 'Sign in instead ->',
                    href: '/login',
                  }}
                />
                <ErrorMessage
                  message="Forgot your password?"
                  action={{
                    label: 'Reset it here ->',
                    href: '/forgot-password',
                  }}
                />
              </>
            ) : error ? (
              <ErrorMessage message={error} />
            ) : null}

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
                  placeholder="Min. 8 characters"
                  style={inputStyle}
                  onFocus={(event) => {
                    event.target.style.borderColor = '#1A1014'
                  }}
                  onBlur={(event) => {
                    event.target.style.borderColor = '#EDD9AF'
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
              placeholder="Repeat password"
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
                background: loading ? '#B8A090' : '#1A1014',
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
              {loading ? 'CREATING...' : 'CREATE ACCOUNT >'}
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
              CONTINUE AS GUEST &gt;
            </button>
          </form>
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
          event.target.style.borderColor = '#EDD9AF'
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
  background: '#FBF5F0',
  border: '0.5px solid #EDD9AF',
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

"use client"

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Sparkles } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'

function getStrength(password: string) {
  if (password.length === 0) {
    return { label: '', level: 0 }
  }

  if (password.length < 8) {
    return { label: 'Too short', level: 1 }
  }

  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) {
    return { label: 'Strong', level: 4 }
  }

  if (/[A-Z0-9]/.test(password)) {
    return { label: 'Good', level: 3 }
  }

  return { label: 'Weak', level: 2 }
}

async function readApiError(response: Response, fallback: string) {
  const body: unknown = await response.json().catch(() => null)
  if (typeof body === 'object' && body !== null && 'error' in body) {
    const message = (body as { error?: unknown }).error
    if (typeof message === 'string' && message.trim()) return message
  }

  return fallback
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const strength = useMemo(() => getStrength(password), [password])

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (!done) return

    const timer = window.setTimeout(() => {
      router.push('/login?passwordUpdated=1')
    }, 1800)

    return () => window.clearTimeout(timer)
  }, [done, router])

  const handleReset = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedCode = code.replace(/\D/g, '')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter the email address for your account.')
      return
    }

    if (normalizedCode.length !== 4) {
      setError('Enter the 4-digit code sent to your email.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')

    const resetResponse = await fetch('/api/auth/password-reset/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        code: normalizedCode,
        password,
      }),
    })

    if (!resetResponse.ok) {
      setError(await readApiError(resetResponse, 'Unable to reset your password. Please try again.'))
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  return (
    <>
      <style>{`
        .reset-page-shell {
          min-height: 100vh;
          background: #FBF5F0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 56px 20px;
          font-family: var(--font-inter);
        }

        .reset-page-card {
          width: 100%;
          max-width: 440px;
        }

        .reset-panel {
          background: #FDF8F2;
          border: 0.5px solid #EDD9AF;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(26,16,20,0.06);
        }

        .reset-input {
          width: 100%;
          padding: 14px 16px;
          background: #FBF5F0;
          border: 0.5px solid #EDD9AF;
          color: #1A1014;
          font-size: 14px;
          font-family: var(--font-inter);
          outline: none;
          box-sizing: border-box;
          transition: border-color 400ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .reset-input:focus {
          border-color: #C9A961;
        }

        .reset-input::placeholder {
          color: var(--color-muted-text);
        }

        .reset-primary-button {
          width: 100%;
          min-height: 52px;
          padding: 16px;
          background: #1A1014;
          color: #FBF5F0;
          border: 0;
          font-size: 11px;
          letter-spacing: 0.18em;
          cursor: pointer;
          font-family: var(--font-inter);
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 400ms cubic-bezier(0.4, 0, 0.2, 1), color 400ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .reset-primary-button:disabled {
          background: #B8A090;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .reset-page-shell {
            align-items: stretch;
            padding: 40px 20px;
          }

          .reset-page-card {
            margin: auto 0;
          }

          .reset-panel {
            padding: 32px 24px;
          }

          .reset-input {
            font-size: 16px;
          }
        }
      `}</style>

      <div className="reset-page-shell">
        <div className="reset-page-card">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <BrandLogo size="lg" href="/" />
          </div>

          <div className="reset-panel">
            {!done ? (
              <form onSubmit={(event) => void handleReset(event)}>
                <h1
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '28px',
                    fontWeight: 400,
                    color: '#1A1014',
                    marginBottom: '8px',
                    lineHeight: 1.1,
                  }}
                >
                  Reset password
                </h1>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-muted-text)',
                    marginBottom: '28px',
                    lineHeight: 1.6,
                  }}
                >
                  Enter the 4-digit code from your email and choose a new password.
                </p>

                {error && (
                  <div
                    role="alert"
                    style={{
                      background: '#FCF0F4',
                      border: '0.5px solid #E8C4D0',
                      padding: '12px 16px',
                      marginBottom: '20px',
                      fontSize: '13px',
                      color: '#1A1014',
                      lineHeight: 1.5,
                    }}
                  >
                    {error}
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label
                    htmlFor="reset-email"
                    style={{
                      display: 'block',
                      fontSize: '9px',
                      letterSpacing: '0.25em',
                      color: '#1A1014',
                      marginBottom: '8px',
                    }}
                  >
                    EMAIL ADDRESS
                  </label>
                  <input
                    id="reset-email"
                    className="reset-input"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setError('')
                    }}
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label
                    htmlFor="reset-code"
                    style={{
                      display: 'block',
                      fontSize: '9px',
                      letterSpacing: '0.25em',
                      color: '#1A1014',
                      marginBottom: '8px',
                    }}
                  >
                    4-DIGIT CODE
                  </label>
                  <input
                    id="reset-code"
                    className="reset-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(event) => {
                      setCode(event.target.value.replace(/\D/g, '').slice(0, 4))
                      setError('')
                    }}
                    placeholder="0000"
                    maxLength={4}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label
                    htmlFor="new-password"
                    style={{
                      display: 'block',
                      fontSize: '9px',
                      letterSpacing: '0.25em',
                      color: '#1A1014',
                      marginBottom: '8px',
                    }}
                  >
                    NEW PASSWORD
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="new-password"
                      className="reset-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value)
                        setError('')
                      }}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      style={{ paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 0,
                        cursor: 'pointer',
                        color: 'var(--color-muted-text)',
                        display: 'flex',
                        padding: '6px',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label
                    htmlFor="confirm-password"
                    style={{
                      display: 'block',
                      fontSize: '9px',
                      letterSpacing: '0.25em',
                      color: '#1A1014',
                      marginBottom: '8px',
                    }}
                  >
                    CONFIRM PASSWORD
                  </label>
                  <input
                    id="confirm-password"
                    className="reset-input"
                    type="password"
                    value={confirm}
                    onChange={(event) => {
                      setConfirm(event.target.value)
                      setError('')
                    }}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                  />
                  {confirm && password !== confirm && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-muted-text)',
                        marginTop: '6px',
                      }}
                    >
                      Passwords do not match
                    </div>
                  )}
                </div>

                {strength.level > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <div
                      aria-hidden="true"
                      style={{
                        display: 'flex',
                        gap: '4px',
                        marginBottom: '6px',
                      }}
                    >
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          style={{
                            flex: 1,
                            height: '3px',
                            background: step <= strength.level ? '#C9A961' : '#EDD9AF',
                            transition: 'background 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        />
                      ))}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-muted-text)',
                      }}
                    >
                      {strength.label}
                    </div>
                  </div>
                )}

                <button className="reset-primary-button" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Sparkles size={15} strokeWidth={1.5} />
                      UPDATING...
                    </>
                  ) : (
                    <>
                      UPDATE PASSWORD
                      <ArrowRight size={14} strokeWidth={1.5} />
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '18px' }}>
                  <Link
                    href="/forgot-password"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: 'var(--color-muted-text)',
                      textDecoration: 'none',
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    <ArrowLeft size={13} strokeWidth={1.5} />
                    Request a new code
                  </Link>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    background: '#FCF0F4',
                    border: '0.5px solid #EDD9AF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    color: '#C9A961',
                  }}
                >
                  <Check size={24} strokeWidth={1.5} />
                </div>
                <h2
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '24px',
                    fontWeight: 400,
                    color: '#1A1014',
                    marginBottom: '12px',
                  }}
                >
                  Password updated
                </h2>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-muted-text)',
                    lineHeight: 1.7,
                  }}
                >
                  Redirecting you to sign in...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: '#FBF5F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C9A961',
          }}
        >
          <Sparkles size={32} strokeWidth={1.5} />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}

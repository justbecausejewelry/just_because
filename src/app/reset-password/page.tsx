"use client"

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Eye, EyeOff, Sparkles } from 'lucide-react'
import { supabaseAuth } from '@/lib/auth'

function getStrength(password: string) {
  if (password.length === 0) {
    return { label: '', level: 0 }
  }

  if (password.length < 6) {
    return { label: 'Too short', level: 1 }
  }

  if (password.length < 8) {
    return { label: 'Weak', level: 2 }
  }

  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) {
    return { label: 'Strong', level: 4 }
  }

  return { label: 'Good', level: 3 }
}

function ResetPasswordContent() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const strength = useMemo(() => getStrength(password), [password])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseAuth.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setError('')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!done) return

    const timer = window.setTimeout(() => {
      router.push('/account')
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [done, router])

  const handleReset = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    if (!password) {
      setError('Please enter a password')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    const { error: updateError } = await supabaseAuth.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
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
          max-width: 420px;
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
          color: #B8A090;
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
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              display: 'block',
              textAlign: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-italianno)',
                fontSize: '44px',
                color: '#C9A961',
                lineHeight: 0.85,
              }}
            >
              just
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '4px',
              }}
            >
              <div style={{ width: '14px', height: '0.5px', background: '#1A1014' }} />
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '10px',
                  letterSpacing: '0.38em',
                  color: '#1A1014',
                }}
              >
                BECAUSE
              </span>
              <div style={{ width: '14px', height: '0.5px', background: '#1A1014' }} />
            </div>
          </Link>

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
                  Set new password
                </h1>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#B8A090',
                    marginBottom: '28px',
                    lineHeight: 1.6,
                  }}
                >
                  Choose a strong password for your Just Because account.
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
                      placeholder="Min. 6 characters"
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
                        color: '#B8A090',
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
                        color: '#B8A090',
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
                        color: '#B8A090',
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
                    color: '#B8A090',
                    lineHeight: 1.7,
                  }}
                >
                  Redirecting you to your account...
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

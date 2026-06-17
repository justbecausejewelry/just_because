"use client"

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Mail, Sparkles } from 'lucide-react'

async function readApiError(response: Response, fallback: string) {
  const body: unknown = await response.json().catch(() => null)
  if (typeof body === 'object' && body !== null && 'error' in body) {
    const message = (body as { error?: unknown }).error
    if (typeof message === 'string' && message.trim()) return message
  }

  return fallback
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email')
      return
    }

    setLoading(true)
    setError('')

    const resetResponse = await fetch('/api/auth/password-reset/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmedEmail }),
    })

    if (!resetResponse.ok) {
      setError(await readApiError(resetResponse, 'Unable to send a reset code. Please try again.'))
      setLoading(false)
      return
    }

    setEmail(trimmedEmail)
    setSent(true)
    setLoading(false)
  }

  return (
    <>
      <style>{`
        .password-page-shell {
          min-height: 100vh;
          background: #FBF5F0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 56px 20px;
          font-family: var(--font-inter);
        }

        .password-page-card {
          width: 100%;
          max-width: 420px;
        }

        .password-panel {
          background: #FDF8F2;
          border: 0.5px solid #EDD9AF;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(26,16,20,0.06);
        }

        .password-input {
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

        .password-input:focus {
          border-color: #C9A961;
        }

        .password-input::placeholder {
          color: var(--color-muted-text);
        }

        .password-primary-button {
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

        .password-primary-button:disabled {
          background: #B8A090;
          cursor: not-allowed;
        }

        .password-secondary-button {
          width: 100%;
          min-height: 44px;
          background: transparent;
          border: 0.5px solid #EDD9AF;
          color: #1A1014;
          padding: 12px 20px;
          font-size: 11px;
          letter-spacing: 0.18em;
          cursor: pointer;
          font-family: var(--font-inter);
          font-weight: 500;
          transition: border-color 400ms cubic-bezier(0.4, 0, 0.2, 1), color 400ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .password-secondary-button:hover {
          border-color: #C9A961;
          color: #C9A961;
        }

        @media (max-width: 768px) {
          .password-page-shell {
            align-items: stretch;
            padding: 40px 20px;
          }

          .password-page-card {
            margin: auto 0;
          }

          .password-panel {
            padding: 32px 24px;
          }

          .password-input {
            font-size: 16px;
          }
        }
      `}</style>

      <div className="password-page-shell">
        <div className="password-page-card">
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

          <div className="password-panel">
            {!sent ? (
              <form onSubmit={(event) => void handleSubmit(event)}>
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
                  Forgot password?
                </h1>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-muted-text)',
                    marginBottom: '28px',
                    lineHeight: 1.6,
                  }}
                >
                  Enter your email and we will send you a 4-digit code to reset your password.
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

                <div style={{ marginBottom: '24px' }}>
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
                    className="password-input"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setError('')
                    }}
                    placeholder="your@email.com"
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <button className="password-primary-button" type="submit" disabled={loading}>
                  <Mail size={15} strokeWidth={1.5} />
                  {loading ? 'SENDING...' : 'SEND RESET CODE'}
                  {!loading && <ArrowRight size={14} strokeWidth={1.5} />}
                </button>

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <Link
                    href="/login"
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
                    Back to sign in
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
                  <Sparkles size={24} strokeWidth={1.5} />
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
                  Check your email
                </h2>

                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-muted-text)',
                    lineHeight: 1.7,
                    marginBottom: '8px',
                  }}
                >
                  We sent a 4-digit reset code to
                </p>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#1A1014',
                    fontWeight: 500,
                    marginBottom: '28px',
                  }}
                >
                  {email}
                </p>

                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-muted-text)',
                    lineHeight: 1.6,
                    marginBottom: '28px',
                  }}
                >
                  Enter the code on the reset password page. Check your spam folder if
                  you do not see it.
                </p>

                <Link
                  href={`/reset-password?email=${encodeURIComponent(email)}`}
                  className="password-primary-button"
                  style={{
                    textDecoration: 'none',
                    marginBottom: '16px',
                  }}
                >
                  ENTER RESET CODE
                  <ArrowRight size={14} strokeWidth={1.5} />
                </Link>

                <button
                  className="password-secondary-button"
                  type="button"
                  onClick={() => {
                    setSent(false)
                    setError('')
                  }}
                  style={{ marginBottom: '16px' }}
                >
                  RESEND EMAIL
                </button>

                <Link
                  href="/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: 'var(--color-muted-text)',
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  <ArrowLeft size={13} strokeWidth={1.5} />
                  Back to sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

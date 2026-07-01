"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'
import { supabaseAuth } from '@/lib/auth'
import { clearCart, getCart } from '@/lib/cart'
import { getAuthErrorMessage } from '@/lib/errors'
import { mergeGuestCart } from '@/lib/mergeGuestCart'
import { BrandLogo } from '@/components/ui/BrandLogo'
import ErrorMessage from '@/components/ui/ErrorMessage'

const AUTH_TIMEOUT_MS = 8000

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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [unverifiedEmail, setUnverifiedEmail] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    if (emailParam) setEmail(emailParam)
    if (params.get('verified') === '1') {
      setNotice('Email verified. Please sign in to continue.')
    }
    if (params.get('passwordUpdated') === '1') {
      setNotice('Password updated. Please sign in to continue.')
    }
  }, [])

  const handleSignIn = async () => {
    if (loading || isRedirecting) return

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    setError('')
    setNotice('')
    setUnverifiedEmail('')

    try {
      const { data, error: signInError } = await withTimeout(
        supabaseAuth.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        }),
        'Sign in timed out. Please try again.'
      )

      if (signInError) {
        const message = signInError.message.toLowerCase()
        if (message.includes('email not confirmed') || message.includes('not confirmed')) {
          setError('Please verify your email first.')
          setUnverifiedEmail(normalizedEmail)
          return
        }

        if (!message.includes('invalid login credentials') && !message.includes('invalid credentials')) {
          console.error('[login] signInWithPassword failed:', signInError)
        }

        setError(getAuthErrorMessage(signInError))
        return
      }

      if (!data.user) {
        setError('The email or password you entered is incorrect. Please try again.')
        return
      }

      const accessToken = data.session?.access_token
      const refreshToken = data.session?.refresh_token
      if (!accessToken || !refreshToken) {
        setError('We could not finish signing you in. Please try again.')
        return
      }

      const cookieResponse = await withTimeout(fetch('/api/auth/session-cookie', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken, refreshToken }),
      }), 'Saving your session timed out. Please try again.')

      if (!cookieResponse.ok) {
        console.error('[login] session cookie route failed:', await cookieResponse.text().catch(() => 'No response body'))
        setError('We could not finish signing you in. Please try again.')
        return
      }

      await delay(600)

      const { data: sessionData, error: sessionError } = await withTimeout(
        supabaseAuth.auth.getSession(),
        'Checking your session timed out. Please try again.'
      )

      if (sessionError || !sessionData.session) {
        console.error('[login] session check failed:', sessionError)
        setError('We could not keep you signed in. Please try again.')
        return
      }

      const guestCart = getCart()
      if (guestCart.length > 0) {
        await withTimeout(mergeGuestCart(data.user.id, guestCart), 'Cart sync timed out. Please try again.')
        clearCart()
      }

      const redirect = new URLSearchParams(window.location.search).get('redirect')
      setIsRedirecting(true)
      router.replace(redirect || '/account')
    } catch (caught) {
      console.error('[login] sign in failed:', caught)
      setError(caught instanceof Error ? caught.message : getAuthErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    const targetEmail = (unverifiedEmail || email).trim().toLowerCase()

    if (!targetEmail) {
      setError('Enter your email address so we can resend the verification code.')
      return
    }

    setResendLoading(true)
    setError('')
    setNotice('')

    try {
      const resendResponse = await withTimeout(fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      }), 'Resend request timed out. Please try again.')

      if (!resendResponse.ok) {
        setError(await resendResponse.json().then((body: unknown) => {
          if (body && typeof body === 'object' && 'error' in body) {
            return getAuthErrorMessage((body as { error?: unknown }).error)
          }
          return getAuthErrorMessage(body)
        }).catch(() => getAuthErrorMessage('network')))
        return
      }

      setUnverifiedEmail(targetEmail)
      setNotice('Code sent!')
    } catch (caught) {
      console.error('[login] resend verification code failed:', caught)
      setError(caught instanceof Error ? caught.message : getAuthErrorMessage(caught))
    } finally {
      setResendLoading(false)
    }
  }

  const handleGoToVerification = () => {
    const targetEmail = (unverifiedEmail || email).trim().toLowerCase()

    if (!targetEmail || isRedirecting) return

    window.localStorage.setItem('pendingVerifyEmail', targetEmail)
    setIsRedirecting(true)
    router.replace(`/verify?email=${encodeURIComponent(targetEmail)}`)
  }

  return (
    <>
      <style>{`
        .playfair-heading {
          font-family: var(--font-playfair), Georgia, serif !important;
          font-weight: 400 !important;
        }

        .playfair-italic {
          font-family: var(--font-playfair), Georgia, serif !important;
          font-weight: 400 !important;
          font-style: italic !important;
        }

        .login-input {
          width: 100%;
          padding: 14px 16px;
          background: #FFFFFF;
          border: 1px solid #D4C4B0;
          color: #1A1014;
          font-size: 14px;
          font-family: var(--font-inter), sans-serif;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .login-input:focus {
          border-color: #1A1014;
        }
        .login-input::placeholder {
          color: var(--color-muted-text);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

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

          .login-input {
            font-size: 16px !important;
          }

          .login-right button {
            min-height: 52px;
          }
        }
      `}</style>

      <div className="login-wrap" style={{
        display: 'grid',
        gridTemplateColumns: '52% 48%',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#FBF5F0',
      }}>

        <div className="login-left" style={{
          position: 'relative',
          overflow: 'hidden',
        }}>
          <Image
            src="/images/login-hero.jpg"
            alt="Just Because"
            fill
            sizes="(max-width: 900px) 100vw, 45vw"
            style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
            priority
            quality={95}
          />

          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(
              to bottom,
              rgba(26,16,20,0.80) 0%,
              rgba(26,16,20,0.10) 30%,
              rgba(26,16,20,0.05) 55%,
              rgba(26,16,20,0.75) 100%
            )`,
          }} />

          <div style={{
            position: 'absolute',
            top: '36px', left: '44px',
            zIndex: 3,
          }}>
            <BrandLogo size="lg" href="/" />
          </div>

          <div style={{
            position: 'absolute',
            bottom: '44px', left: '44px', right: '44px',
            zIndex: 3,
          }}>
            <div style={{
              width: '36px', height: '1.5px',
              background: '#C9A961',
              marginBottom: '18px',
            }} />

            <div className="playfair-heading" style={{
              fontSize: '54px',
              color: '#FBF5F0',
              lineHeight: 1.0,
              marginBottom: '2px',
              animation: 'fadeIn 0.8s ease 0.3s both',
            }}>
              Welcome
            </div>
            <div className="playfair-italic" style={{
              fontSize: '54px',
              color: '#EDD9AF',
              lineHeight: 1.0,
              marginBottom: '20px',
              animation: 'fadeIn 0.8s ease 0.5s both',
            }}>
              back.
            </div>

            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: 'rgba(251,245,240,0.65)',
              marginBottom: '24px',
              letterSpacing: '0.03em',
              animation: 'fadeIn 0.8s ease 0.7s both',
            }}>
              Sign in to your Just Because account.
            </p>

            <div style={{
              width: '100%', height: '0.5px',
              background: 'rgba(201,169,97,0.25)',
              marginBottom: '20px',
            }} />

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              animation: 'fadeIn 0.8s ease 0.9s both',
            }}>
              {[
                { q: '"The most beautiful buying experience."', n: 'Priya M.' },
                { q: '"Quietly luxurious, from start to finish."', n: 'Sarah K.' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#C9A961', fontSize: '11px', flexShrink: 0, marginTop: '2px' }}>★</span>
                  <div>
                    <p className="playfair-italic" style={{
                      fontSize: '13px',
                      color: 'rgba(251,245,240,0.88)',
                      lineHeight: 1.45,
                      marginBottom: '3px',
                    }}>{r.q}</p>
                    <span style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '10px',
                      color: 'rgba(201,169,97,0.75)',
                      letterSpacing: '0.08em',
                    }}>{r.n}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="login-right" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0 64px',
          background: '#FFFFFF',
          borderLeft: '0.5px solid #EDD9AF',
          overflowY: 'auto',
        }}>
          <div className="mobile-logo" style={{
            display: 'none',
            marginBottom: '36px',
          }}>
            <BrandLogo size="lg" href="/" />
          </div>

          <div className="login-form-inner" style={{
            width: '100%',
            maxWidth: '380px',
            animation: 'fadeIn 0.8s ease 0.2s both',
          }}>

            <h1 className="playfair-heading" style={{
              fontSize: '38px',
              color: '#1A1014',
              marginBottom: '8px',
              lineHeight: 1.0,
            }}>
              {unverifiedEmail ? 'Your email is not verified yet.' : 'Sign in'}
            </h1>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#1A1014',
              marginBottom: '36px',
            }}>
              {unverifiedEmail ? (
                <>We sent a code to <strong>{unverifiedEmail}</strong>.</>
              ) : (
                <>
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" style={{
                    color: '#C9A961',
                    textDecoration: 'none',
                    fontWeight: 600,
                    borderBottom: '1px solid #EDD9AF',
                    paddingBottom: '1px',
                  }}>Create one &gt;</Link>
                </>
              )}
            </p>

            {error && <ErrorMessage message={error} />}

            {unverifiedEmail ? (
              <div style={{ display: 'grid', gap: '14px', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={handleGoToVerification}
                  disabled={isRedirecting}
                  style={{
                    width: '100%',
                    padding: '15px 16px',
                    background: '#1A1014',
                    color: '#FBF5F0',
                    border: 'none',
                    fontSize: '11px',
                    letterSpacing: '0.16em',
                    fontFamily: 'Inter, sans-serif',
                    cursor: isRedirecting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                  }}
                >
                  {isRedirecting ? 'OPENING...' : 'ENTER VERIFICATION CODE'}
                </button>
                <p style={{ color: '#B8A090', fontFamily: 'Inter, sans-serif', fontSize: '12px', lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
                  Need a new code?{' '}
                  <button
                    type="button"
                    onClick={() => void handleResendCode()}
                    disabled={resendLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#C9A961',
                      cursor: resendLoading ? 'not-allowed' : 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '12px',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    {resendLoading ? 'sending...' : 'Resend code'}
                  </button>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setUnverifiedEmail('')
                    setError('')
                    setNotice('')
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#1A1014',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    padding: 0,
                  }}
                >
                  Back to sign in
                </button>
              </div>
            ) : null}

            {notice && (
              <div style={{
                background: '#FDF8F2',
                border: '1px solid #7A8F72',
                padding: '12px 16px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#7A8F72',
                fontFamily: 'Inter, sans-serif',
              }}>{notice}</div>
            )}

            {!unverifiedEmail ? (
              <>
            <div style={{ marginBottom: '18px' }}>
              <div style={{
                fontSize: '9px',
                letterSpacing: '0.25em',
                color: '#1A1014',
                fontFamily: 'Inter, sans-serif',
                marginBottom: '8px',
              }}>EMAIL ADDRESS</div>
              <input
                className="login-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSignIn()
                }}
                placeholder="your@email.com"
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{
                fontSize: '9px',
                letterSpacing: '0.25em',
                color: '#1A1014',
                fontFamily: 'Inter, sans-serif',
                marginBottom: '8px',
              }}>PASSWORD</div>
              <div style={{ position: 'relative' }}>
                <input
                  className="login-input"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleSignIn()
                  }}
                  placeholder="••••••••"
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute',
                    right: '14px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--color-muted-text)', padding: '4px',
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: '28px' }}>
              <Link href="/forgot-password" style={{
                fontSize: '12px', color: '#1A1014',
                textDecoration: 'none', fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#C9A961'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#1A1014'
              }}
              >Forgot password?</Link>
            </div>

            <button
              onClick={() => void handleSignIn()}
              disabled={loading || isRedirecting}
              style={{
                width: '100%',
                padding: '16px',
                background: loading || isRedirecting ? '#888' : '#1A1014',
                color: '#FBF5F0',
                border: 'none',
                fontSize: '11px',
                letterSpacing: '0.22em',
                fontFamily: 'Inter, sans-serif',
                cursor: loading || isRedirecting ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s',
                marginBottom: '24px',
              }}
            >
              {loading || isRedirecting ? 'SIGNING IN...' : 'SIGN IN >'}
            </button>

            <div style={{
              display: 'flex', alignItems: 'center',
              gap: '14px', marginBottom: '16px',
            }}>
              <div style={{ flex: 1, height: '0.5px', background: '#EDD9AF' }} />
              <span style={{
                fontSize: '11px', color: '#888',
                fontFamily: 'Inter, sans-serif',
              }}>or</span>
              <div style={{ flex: 1, height: '0.5px', background: '#EDD9AF' }} />
            </div>

            <button
              onClick={() => {
                if (isRedirecting) return
                setIsRedirecting(true)
                router.push('/')
              }}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                color: '#1A1014',
                border: '1px solid #1A1014',
                fontSize: '10px',
                letterSpacing: '0.2em',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1A1014'
                e.currentTarget.style.color = '#FBF5F0'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#1A1014'
              }}
            >
              CONTINUE AS GUEST →
            </button>

            <p style={{
              textAlign: 'center',
              fontSize: '11px', color: '#888',
              fontFamily: 'Inter, sans-serif',
              marginTop: '10px',
            }}>
              Browse our collection without an account
            </p>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}

"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'
import { Eye, EyeOff } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    router.push('/')
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#FBF5F0',
    }}>
      <div style={{
        width: '52%',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <Image
          src="/images/login-hero.jpg"
          alt="Just Because diamond ring"
          fill
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
            Welcome
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
            back.
          </h2>

          <p style={{
            fontSize: '13px',
            color: 'rgba(251,245,240,0.7)',
            fontFamily: 'var(--font-inter)',
            letterSpacing: '0.05em',
            marginBottom: '28px',
          }}>
            Sign in to your Just Because account.
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

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px 64px',
        background: '#FBF5F0',
        overflow: 'hidden',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
        }}>
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '36px',
              fontWeight: 400,
              color: '#1A1014',
              marginBottom: '8px',
              lineHeight: 1.1,
            }}>
              Sign in
            </h1>
            <p style={{
              fontSize: '13px',
              color: '#B8A090',
              fontFamily: 'var(--font-inter)',
            }}>
              Don&apos;t have an account?{' '}
              <Link href="/signup" style={{
                color: '#C9A961',
                textDecoration: 'none',
                fontWeight: 500,
              }}>
                Create one →
              </Link>
            </p>
          </div>

          {error && (
            <div style={{
              background: '#FFF0F0',
              border: '1px solid #A85C6A',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#A85C6A',
              fontFamily: 'var(--font-inter)',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '9px',
              letterSpacing: '0.25em',
              color: '#C9A961',
              fontFamily: 'var(--font-inter)',
              marginBottom: '8px',
            }}>
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleSignIn()
              }}
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#FDF8F2',
                border: '1px solid #EDD9AF',
                color: '#1A1014',
                fontSize: '14px',
                fontFamily: 'var(--font-inter)',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(event) => {
                event.target.style.borderColor = '#1A1014'
              }}
              onBlur={(event) => {
                event.target.style.borderColor = '#EDD9AF'
              }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{
              display: 'block',
              fontSize: '9px',
              letterSpacing: '0.25em',
              color: '#C9A961',
              fontFamily: 'var(--font-inter)',
              marginBottom: '8px',
            }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void handleSignIn()
                }}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '14px 48px 14px 16px',
                  background: '#FDF8F2',
                  border: '1px solid #EDD9AF',
                  color: '#1A1014',
                  fontSize: '14px',
                  fontFamily: 'var(--font-inter)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
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
                  color: '#B8A090',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{
            textAlign: 'right',
            marginBottom: '28px',
          }}>
            <Link
              href="/forgot-password"
              style={{
                fontSize: '12px',
                color: '#B8A090',
                textDecoration: 'none',
                fontFamily: 'var(--font-inter)',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.color = '#C9A961'
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.color = '#B8A090'
              }}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="button"
            onClick={() => void handleSignIn()}
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
              marginBottom: '20px',
            }}
            onMouseEnter={(event) => {
              if (!loading) event.currentTarget.style.background = '#2A1E24'
            }}
            onMouseLeave={(event) => {
              if (!loading) event.currentTarget.style.background = '#1A1014'
            }}
          >
            {loading ? 'SIGNING IN...' : 'SIGN IN →'}
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
          }}>
            <div style={{ flex: 1, height: '0.5px', background: '#EDD9AF' }} />
            <span style={{
              fontSize: '11px',
              color: '#B8A090',
              fontFamily: 'var(--font-inter)',
              whiteSpace: 'nowrap',
            }}>or</span>
            <div style={{ flex: 1, height: '0.5px', background: '#EDD9AF' }} />
          </div>

          <button
            type="button"
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              padding: '14px',
              background: 'transparent',
              color: '#B8A090',
              border: '1px solid #EDD9AF',
              fontSize: '11px',
              letterSpacing: '0.18em',
              fontFamily: 'var(--font-inter)',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.borderColor = '#1A1014'
              event.currentTarget.style.color = '#1A1014'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.borderColor = '#EDD9AF'
              event.currentTarget.style.color = '#B8A090'
            }}
          >
            CONTINUE AS GUEST →
          </button>

          <p style={{
            textAlign: 'center',
            fontSize: '11px',
            color: '#B8A090',
            fontFamily: 'var(--font-inter)',
            marginTop: '12px',
          }}>
            Browse our collection without an account
          </p>
        </div>
      </div>
    </div>
  )
}

function AuthLogo() {
  return (
    <Link href="/" style={{
      textDecoration: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: '0px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '0px',
      }}>
        <span style={{
          fontFamily: 'var(--font-italianno)',
          fontSize: '42px',
          color: '#FBF5F0',
          lineHeight: 0.9,
          letterSpacing: '-0.01em',
        }}>just</span>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          width: '20px',
          height: '0.5px',
          background: '#C9A961',
        }} />
        <span style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '11px',
          letterSpacing: '0.45em',
          color: '#C9A961',
          fontWeight: 400,
        }}>BECAUSE</span>
        <div style={{
          width: '20px',
          height: '0.5px',
          background: '#C9A961',
        }} />
      </div>
    </Link>
  )
}

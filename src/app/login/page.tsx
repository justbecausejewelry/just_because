"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Italianno&family=Playfair+Display:ital,wght@0,400;1,400&display=swap');

        .logo-script {
          font-family: 'Italianno', cursive !important;
          font-size: 44px !important;
          color: #FBF5F0 !important;
          line-height: 0.85 !important;
        }

        .logo-script-dark {
          font-family: 'Italianno', cursive !important;
          font-size: 36px !important;
          color: #1A1014 !important;
          line-height: 0.85 !important;
        }

        .playfair-heading {
          font-family: 'Playfair Display', Georgia, serif !important;
          font-weight: 400 !important;
        }

        .playfair-italic {
          font-family: 'Playfair Display', Georgia, serif !important;
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
          font-family: Inter, sans-serif;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .login-input:focus {
          border-color: #1A1014;
        }
        .login-input::placeholder {
          color: #B8A090;
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
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div>
                <span className="logo-script">just</span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '2px',
                }}>
                  <div style={{
                    width: '16px', height: '0.5px',
                    background: 'rgba(251,245,240,0.5)',
                  }} />
                  <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '10px',
                    letterSpacing: '0.42em',
                    color: 'rgba(251,245,240,0.75)',
                    fontWeight: 400,
                  }}>BECAUSE</span>
                  <div style={{
                    width: '16px', height: '0.5px',
                    background: 'rgba(251,245,240,0.5)',
                  }} />
                </div>
              </div>
            </Link>
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
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div style={{
                fontFamily: "'Italianno', cursive",
                fontSize: '40px',
                color: '#1A1014',
                lineHeight: 0.85,
              }}>just</div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginTop: '3px',
              }}>
                <div style={{ width: '12px', height: '0.5px', background: '#1A1014' }} />
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '9px',
                  letterSpacing: '0.4em',
                  color: '#1A1014',
                }}>BECAUSE</span>
                <div style={{ width: '12px', height: '0.5px', background: '#1A1014' }} />
              </div>
            </Link>
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
              Sign in
            </h1>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#1A1014',
              marginBottom: '36px',
            }}>
              Don&apos;t have an account?{' '}
              <Link href="/signup" style={{
                color: '#C9A961',
                textDecoration: 'none',
                fontWeight: 600,
                borderBottom: '1px solid #EDD9AF',
                paddingBottom: '1px',
              }}>Create one →</Link>
            </p>

            {error && (
              <div style={{
                background: '#FFF0F0',
                border: '1px solid #A85C6A',
                padding: '12px 16px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#A85C6A',
                fontFamily: 'Inter, sans-serif',
              }}>{error}</div>
            )}

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
                    cursor: 'pointer', color: '#B8A090', padding: '4px',
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
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? '#888' : '#1A1014',
                color: '#FBF5F0',
                border: 'none',
                fontSize: '11px',
                letterSpacing: '0.22em',
                fontFamily: 'Inter, sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s',
                marginBottom: '24px',
              }}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN →'}
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
              onClick={() => router.push('/')}
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
          </div>
        </div>
      </div>
    </>
  )
}

"use client"

import type { CSSProperties, FormEvent } from 'react'
import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Eye, EyeOff } from 'lucide-react'
import { getOrCreateProfile } from '@/lib/userProfile'
import { useToast } from '@/context/ToastContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function strengthFor(password: string) {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  return score
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
  const strength = useMemo(() => strengthFor(password), [password])
  const strengthColor = strength <= 1 ? '#A85C6A' : strength === 2 ? '#B7791F' : strength === 3 ? '#C9A961' : '#7A8F72'

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setError('')

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!termsAccepted) {
      setError('Please accept the terms to continue')
      return
    }

    setLoading(true)

    const emailRedirectTo = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      : `${window.location.origin}/auth/callback`

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await getOrCreateProfile(data.user.id, data.user.email || email, name)
    }

    showToast('Account created! Welcome to Just Because ✦', 'success')
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

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '34px 64px',
        background: '#FBF5F0',
        overflow: 'hidden',
      }}>
        <form
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
              color: '#B8A090',
              fontFamily: 'var(--font-inter)',
            }}>
              Already have an account?{' '}
              <Link href="/login" style={{
                color: '#C9A961',
                textDecoration: 'none',
                fontWeight: 500,
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
            onChange={setName}
            placeholder="Your name"
          />
          <AuthInput
            label="EMAIL ADDRESS"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="your@email.com"
          />

          <div style={{ marginBottom: '12px' }}>
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
                placeholder="••••••••"
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
                  color: '#B8A090',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
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
            onChange={setConfirmPassword}
            placeholder="••••••••"
          />

          <label style={{
            color: '#B8A090',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontFamily: 'var(--font-inter)',
            fontSize: '12px',
            lineHeight: 1.5,
            margin: '4px 0 20px',
          }}>
            <input
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              type="checkbox"
              style={{ accentColor: '#1A1014', marginTop: '3px' }}
            />
            I agree to the Terms of Service and Privacy Policy
          </label>

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
              color: '#B8A090',
              border: '1px solid #EDD9AF',
              fontSize: '11px',
              letterSpacing: '0.18em',
              fontFamily: 'var(--font-inter)',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          >
            CONTINUE AS GUEST →
          </button>
        </form>
      </div>
    </div>
  )
}

function AuthInput({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '9px',
        letterSpacing: '0.25em',
        color: '#C9A961',
        fontFamily: 'var(--font-inter)',
        marginBottom: '8px',
      }}>
        {label}
      </label>
      <input
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
    </div>
  )
}

const inputStyle: CSSProperties = {
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

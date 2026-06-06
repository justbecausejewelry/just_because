'use client'

import { useEffect, useState } from 'react'
import { LockKeyhole } from 'lucide-react'
import { supabaseAuth } from '@/lib/auth'

type AuthMode = 'choice' | 'signin' | 'create'

type Props = {
  email: string
  name: string
  phone?: string
  onSuccess: () => void
}

const inputStyle = {
  background: '#FDF8F2',
  border: '0.5px solid #EDD9AF',
  color: '#1A1014',
  fontFamily: 'var(--font-inter)',
  fontSize: '13px',
  outline: 'none',
  padding: '13px 15px',
  width: '100%',
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  }
}

export function CheckoutAuthWall({ email, name, phone = '', onSuccess }: Props) {
  const [mode, setMode] = useState<AuthMode>('choice')
  const [formEmail, setFormEmail] = useState(email)
  const [formName, setFormName] = useState(name)
  const [formPhone, setFormPhone] = useState(phone)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setFormEmail((current) => current || email)
    setFormName((current) => current || name)
    setFormPhone((current) => current || phone)
  }, [email, name, phone])

  async function handleSignIn() {
    if (!formEmail || !password) {
      setError('Please enter email and password.')
      return
    }

    setLoading(true)
    setError('')

    const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: formEmail.trim(),
      password,
    })

    if (signInError) {
      setError('Incorrect email or password. Try again or create a new account.')
    } else {
      onSuccess()
    }

    setLoading(false)
  }

  async function handleCreateAccount() {
    const cleanEmail = formEmail.trim()
    const cleanName = formName.trim()
    const cleanPhone = formPhone.trim()

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email.')
      return
    }

    if (!cleanName) {
      setError('Please enter your name.')
      return
    }

    if (!cleanPhone) {
      setError('Please enter your phone number.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')

    const { firstName, lastName } = splitName(cleanName)
    const { data, error: signUpError } = await supabaseAuth.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: cleanName, name: cleanName },
        emailRedirectTo: `${window.location.origin}/account`,
      },
    })

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already')) {
        setError('This email already has an account. Please sign in instead.')
        setMode('signin')
      } else {
        setError(signUpError.message)
      }
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Unable to create account. Please try again.')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabaseAuth.from('UserProfile').upsert({
      userId: data.user.id,
      email: cleanEmail,
      firstName,
      lastName,
      phone: cleanPhone,
      signupSource: 'checkout',
      signup_source: 'checkout',
      updatedAt: new Date().toISOString(),
    }, { onConflict: 'userId' })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (signInError) {
        setError('Account created. Please check your email or sign in to continue.')
        setMode('signin')
        setLoading(false)
        return
      }
    }

    onSuccess()
    setLoading(false)
  }

  return (
    <div style={{ background: '#FBF5F0', border: '0.5px solid #EDD9AF', borderRadius: '2px', overflow: 'hidden', marginBottom: '24px' }}>
      <div style={{ background: '#1A1014', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#C9A961', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <LockKeyhole size={16} color="#1A1014" />
        </div>
        <div>
          <p style={{ color: '#FBF5F0', fontSize: '14px', fontWeight: 500, letterSpacing: '0.04em', margin: 0 }}>
            Sign in to continue to payment
          </p>
          <p style={{ color: 'rgba(251,245,240,0.68)', fontSize: '12px', margin: '2px 0 0' }}>
            We need your account to save your order and send updates.
          </p>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {mode === 'choice' ? (
          <div>
            <p style={{ fontSize: '14px', color: '#B8A090', marginBottom: '20px', lineHeight: 1.7 }}>
              To complete your purchase, create an account or sign in before payment. This keeps your order history and delivery updates in one place.
            </p>

            <div className="checkout-auth-options" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <button type="button" onClick={() => setMode('create')} style={{ background: '#1A1014', color: '#FBF5F0', border: 'none', padding: '20px 16px', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#C9A961', fontWeight: 500 }}>NEW CUSTOMER</span>
                <span style={{ fontSize: '18px', fontFamily: 'var(--font-playfair)', fontWeight: 400 }}>Create Account</span>
                <span style={{ fontSize: '12px', color: 'rgba(251,245,240,0.68)', lineHeight: 1.5 }}>Fast setup, order tracking, saved wishlist.</span>
              </button>

              <button type="button" onClick={() => setMode('signin')} style={{ background: 'transparent', color: '#1A1014', border: '0.5px solid #EDD9AF', padding: '20px 16px', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#C9A961', fontWeight: 500 }}>RETURNING CUSTOMER</span>
                <span style={{ fontSize: '18px', fontFamily: 'var(--font-playfair)', fontWeight: 400 }}>Sign In</span>
                <span style={{ fontSize: '12px', color: '#B8A090', lineHeight: 1.5 }}>Continue with your existing account.</span>
              </button>
            </div>

            <p style={{ fontSize: '11px', color: '#B8A090', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
              Your information is encrypted and secure. We never share your data.
            </p>
          </div>
        ) : null}

        {mode === 'create' ? (
          <div>
            <button type="button" onClick={() => setMode('choice')} style={{ background: 'none', border: 'none', color: '#B8A090', fontSize: '12px', cursor: 'pointer', marginBottom: '16px', padding: 0, letterSpacing: '0.06em' }}>
              Back
            </button>
            <p style={{ fontSize: '11px', letterSpacing: '0.18em', color: '#C9A961', fontWeight: 500, marginBottom: '16px' }}>CREATE YOUR ACCOUNT</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Full Name *" value={formName} onChange={(event) => setFormName(event.target.value)} className="input-luxury" style={inputStyle} />
              <input type="email" placeholder="Email Address *" value={formEmail} onChange={(event) => setFormEmail(event.target.value)} className="input-luxury" style={inputStyle} />
              <input type="tel" placeholder="Phone Number * (for delivery updates)" value={formPhone} onChange={(event) => setFormPhone(event.target.value)} className="input-luxury" style={inputStyle} />
              <input type="password" placeholder="Create Password * (min 8 characters)" value={password} onChange={(event) => setPassword(event.target.value)} className="input-luxury" style={inputStyle} />
              <input type="password" placeholder="Confirm Password *" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="input-luxury" style={inputStyle} />
            </div>
            {error ? <p style={{ color: '#A85C6A', fontSize: '13px', marginTop: '12px', padding: '10px', background: 'rgba(168,92,106,0.08)' }}>{error}</p> : null}
            <button type="button" onClick={() => void handleCreateAccount()} disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '16px', height: '52px', fontSize: '12px', letterSpacing: '0.12em', justifyContent: 'center', opacity: loading ? 0.72 : 1 }}>
              {loading ? 'Creating Account...' : 'Create Account & Continue'}
            </button>
          </div>
        ) : null}

        {mode === 'signin' ? (
          <div>
            <button type="button" onClick={() => setMode('choice')} style={{ background: 'none', border: 'none', color: '#B8A090', fontSize: '12px', cursor: 'pointer', marginBottom: '16px', padding: 0, letterSpacing: '0.06em' }}>
              Back
            </button>
            <p style={{ fontSize: '11px', letterSpacing: '0.18em', color: '#C9A961', fontWeight: 500, marginBottom: '16px' }}>SIGN IN TO YOUR ACCOUNT</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="email" placeholder="Email Address *" value={formEmail} onChange={(event) => setFormEmail(event.target.value)} className="input-luxury" style={inputStyle} />
              <input
                type="password"
                placeholder="Password *"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void handleSignIn()
                }}
                className="input-luxury"
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <a href="/forgot-password" style={{ fontSize: '12px', color: '#C9A961' }}>Forgot password?</a>
            </div>
            {error ? <p style={{ color: '#A85C6A', fontSize: '13px', marginTop: '12px', padding: '10px', background: 'rgba(168,92,106,0.08)' }}>{error}</p> : null}
            <button type="button" onClick={() => void handleSignIn()} disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '16px', height: '52px', fontSize: '12px', letterSpacing: '0.12em', justifyContent: 'center', opacity: loading ? 0.72 : 1 }}>
              {loading ? 'Signing In...' : 'Sign In & Continue'}
            </button>
            <p style={{ fontSize: '12px', color: '#B8A090', textAlign: 'center', marginTop: '12px' }}>
              Don&apos;t have an account?{' '}
              <button type="button" onClick={() => setMode('create')} style={{ background: 'none', border: 'none', color: '#C9A961', fontSize: '12px', cursor: 'pointer', padding: 0 }}>
                Create one
              </button>
            </p>
          </div>
        ) : null}
      </div>

      <style jsx>{`
        @media (max-width: 680px) {
          .checkout-auth-options {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { LockKeyhole } from 'lucide-react'
import { supabaseAuth } from '@/lib/auth'
import { getAuthErrorMessage, getErrorText, isAlreadyRegisteredError, readFriendlyApiError } from '@/lib/errors'
import ErrorMessage from '@/components/ui/ErrorMessage'

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

export function CheckoutAuthWall({ email, name, phone = '', onSuccess }: Props) {
  const [mode, setMode] = useState<AuthMode>('choice')
  const [formEmail, setFormEmail] = useState(email)
  const [formName, setFormName] = useState(name)
  const [formPhone, setFormPhone] = useState(phone)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

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

    const cleanEmail = formEmail.trim().toLowerCase()
    const { data, error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: cleanEmail,
      password,
    }).catch((caught: unknown) => {
      console.error('[checkout-auth] sign in failed:', caught)
      return { data: { user: null }, error: caught }
    })

    if (signInError) {
      const message = getErrorText(signInError).toLowerCase()
      if (message.includes('email not confirmed') || message.includes('not confirmed')) {
        setError('Please check your email and click the confirmation link we sent you before continuing.')
        setLoading(false)
        return
      }

      setError(getAuthErrorMessage(signInError))
    } else {
      if (!data.user) {
        setError('The email or password you entered is incorrect. Please try again.')
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabaseAuth
        .from('UserProfile')
        .select('email_verified')
        .eq('userId', data.user.id)
        .maybeSingle()

      if (profileError) {
        console.error('[checkout-auth] profile lookup failed:', profileError)
        setError(getAuthErrorMessage(profileError))
        setLoading(false)
        return
      }

      if (!data.user.email_confirmed_at) {
        await supabaseAuth.auth.signOut()
        setError('Please check your email and click the confirmation link we sent you before continuing.')
        setLoading(false)
        return
      }

      if (!profile || (profile as { email_verified?: boolean | null }).email_verified !== true) {
        const { error: profileUpdateError } = await supabaseAuth
          .from('UserProfile')
          .update({
            email_verified: true,
            updatedAt: new Date().toISOString(),
          })
          .eq('userId', data.user.id)

        if (profileUpdateError) {
          console.error('[checkout-auth] profile verification sync failed:', profileUpdateError)
        }
      }

      onSuccess()
    }

    setLoading(false)
  }

  async function handleCreateAccount() {
    const cleanEmail = formEmail.trim().toLowerCase()
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
      setError('Please choose a password that is at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    setNotice('')

    const signupResponse = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password,
        name: cleanName,
        phone: cleanPhone,
        signupSource: 'checkout',
      }),
    }).catch((caught: unknown) => {
      console.error('[checkout-auth] create account request failed:', caught)
      return null
    })

    if (!signupResponse?.ok) {
      const message = signupResponse
        ? await readFriendlyApiError(signupResponse, getAuthErrorMessage)
        : getAuthErrorMessage('network')
      if (isAlreadyRegisteredError(message) || message.toLowerCase().includes('already have an account')) {
        setMode('signin')
      }
      setError(message)
      setLoading(false)
      return
    }

    setMode('choice')
    setNotice('Account created. Please check your email and click the confirmation link before continuing to payment.')
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
            <p style={{ fontSize: '16px', color: 'var(--color-muted-text)', marginBottom: '20px', lineHeight: 1.625 }}>
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
                <span style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: 1.5 }}>Continue with your existing account.</span>
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
              Your information is encrypted and secure. We never share your data.
            </p>
          </div>
        ) : null}

        {mode === 'create' ? (
          <div>
            <button type="button" onClick={() => setMode('choice')} style={{ background: 'none', border: 'none', color: 'var(--color-muted-text)', fontSize: '12px', cursor: 'pointer', marginBottom: '16px', padding: 0, letterSpacing: '0.06em' }}>
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
            {error ? <ErrorMessage message={error} /> : null}
            {notice ? (
              <div style={{ background: '#FDF8F2', border: '0.5px solid #7A8F72', color: '#7A8F72', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.6, marginTop: '14px', padding: '12px 14px' }}>
                {notice}
              </div>
            ) : null}
            <button type="button" onClick={() => void handleCreateAccount()} disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '16px', height: '52px', fontSize: '12px', letterSpacing: '0.12em', justifyContent: 'center', opacity: loading ? 0.72 : 1 }}>
              {loading ? 'Creating Account...' : 'Create Account & Continue'}
            </button>
          </div>
        ) : null}

        {mode === 'signin' ? (
          <div>
            <button type="button" onClick={() => setMode('choice')} style={{ background: 'none', border: 'none', color: 'var(--color-muted-text)', fontSize: '12px', cursor: 'pointer', marginBottom: '16px', padding: 0, letterSpacing: '0.06em' }}>
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
            {error ? <ErrorMessage message={error} /> : null}
            {notice ? (
              <div style={{ background: '#FDF8F2', border: '0.5px solid #7A8F72', color: '#7A8F72', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.6, marginTop: '14px', padding: '12px 14px' }}>
                {notice}
              </div>
            ) : null}
            <button type="button" onClick={() => void handleSignIn()} disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '16px', height: '52px', fontSize: '12px', letterSpacing: '0.12em', justifyContent: 'center', opacity: loading ? 0.72 : 1 }}>
              {loading ? 'Signing In...' : 'Sign In & Continue'}
            </button>
            <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', textAlign: 'center', marginTop: '12px' }}>
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

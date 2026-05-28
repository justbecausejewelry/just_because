'use client'

import { FormEvent, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabaseAuth } from '@/lib/auth'
import { getOrCreateProfile } from '@/lib/userProfile'
import { useToast } from '@/context/ToastContext'

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
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const strength = useMemo(() => strengthFor(password), [password])
  const strengthColor = strength <= 1 ? '#A85C6A' : strength === 2 ? '#B7791F' : strength === 3 ? '#C9A961' : '#7A8F72'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!termsAccepted) {
      setError('Please accept the terms to continue.')
      return
    }

    setIsLoading(true)
    const emailRedirectTo = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      : `${window.location.origin}/auth/callback`

    const { data, error: signUpError } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo,
      },
    })
    setIsLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    if (data?.user && !signUpError) {
      await getOrCreateProfile(data.user.id, data.user.email || email, name)
      showToast('Account created! Welcome to Just Because *', 'success')

      if (!data.session) {
        setShowConfirmation(true)
        return
      }

      router.push('/')
    }
  }

  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
      }}>
        <Image
          src="/images/login-hero.jpg"
          alt="Just Because diamonds"
          fill
          style={{ objectFit: 'cover' }}
          priority
          quality={95}
        />

        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(26,16,20,0.05) 0%, rgba(26,16,20,0.55) 100%)',
        }} />

        <div style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '52px 48px',
        }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{
              fontFamily: 'var(--font-italianno)',
              fontSize: '32px',
              color: '#FBF5F0',
              lineHeight: 1,
            }}>just</span>
            <span style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '13px',
              letterSpacing: '0.28em',
              color: '#FBF5F0',
              fontWeight: 500,
            }}>BECAUSE</span>
          </Link>

          <div>
            <h2 style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '44px',
              fontWeight: 400,
              color: '#FBF5F0',
              lineHeight: 1.1,
              marginBottom: '12px',
            }}>
              Begin your story.
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'rgba(251,245,240,0.75)',
              fontFamily: 'var(--font-inter)',
              lineHeight: 1.6,
              marginBottom: '40px',
            }}>
              Create an account for wishlists, saved designs, and order updates.
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}>
              {[
                { q: '"The most beautiful buying experience I have had online."', name: 'Priya M.' },
                { q: '"It felt personal, considered, and quietly luxurious."', name: 'Sarah K.' },
                { q: '"Everything about it felt like a boutique appointment."', name: 'Aaron L.' },
              ].map((r, i) => (
                <div key={i}>
                  <div style={{ fontSize: '13px', color: '#C9A961', marginBottom: '3px' }}>★</div>
                  <p style={{
                    fontFamily: 'var(--font-playfair)',
                    fontStyle: 'italic',
                    fontSize: '13px',
                    color: 'rgba(251,245,240,0.9)',
                    lineHeight: 1.5,
                    marginBottom: '3px',
                  }}>{r.q}</p>
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(251,245,240,0.5)',
                    fontFamily: 'var(--font-inter)',
                    letterSpacing: '0.05em',
                  }}>{r.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="flex flex-1 items-center justify-center px-6 py-12 lg:w-[55%] lg:px-[60px]" style={{ backgroundColor: '#FBF5F0' }}>
        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }} className="w-full max-w-[420px]">
          <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '32px', fontWeight: 400, marginBottom: '8px' }}>Create your account</h2>
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px', marginBottom: '30px' }}>
            Already have one? <Link href="/login" style={{ color: '#C9A961', textDecoration: 'none' }}>Sign in →</Link>
          </p>

          {showConfirmation && (
            <div style={{
              background: '#FDF8F2',
              border: '1px solid #C9A961',
              borderRadius: '2px',
              padding: '20px 24px',
              textAlign: 'center',
              marginBottom: '18px',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', color: '#C9A961' }}>*</div>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', color: '#1A1014', marginBottom: '8px' }}>
                Check your email
              </div>
              <p style={{ fontSize: '13px', color: '#B8A090', fontFamily: 'var(--font-inter)', lineHeight: 1.6, marginBottom: '16px' }}>
                We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
              </p>
              <button type="button" onClick={() => router.push('/')} className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                RETURN TO HOMEPAGE
              </button>
            </div>
          )}

          {error && <div style={{ backgroundColor: '#FFF0F0', border: '1px solid #A85C6A', borderRadius: '2px', color: '#A85C6A', fontFamily: 'var(--font-inter)', fontSize: '13px', marginBottom: '18px', padding: '12px 16px' }}>{error}</div>}

          {[
            ['FULL NAME', name, setName, 'text'],
            ['EMAIL ADDRESS', email, setEmail, 'email'],
          ].map(([label, value, setter, type]) => (
            <div key={label as string}>
              <label style={{ color: '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '10px' }}>{label as string}</label>
              <input value={value as string} onChange={(event) => (setter as (next: string) => void)(event.target.value)} type={type as string} required style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF', borderRadius: '2px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '14px', marginBottom: '18px', outlineColor: '#1A1014', padding: '14px 16px', width: '100%' }} />
            </div>
          ))}

          <label style={{ color: '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '10px' }}>PASSWORD</label>
          <div style={{ marginBottom: '10px', position: 'relative' }}>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} required style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF', borderRadius: '2px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '14px', outlineColor: '#1A1014', padding: '14px 48px 14px 16px', width: '100%' }} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} style={{ color: '#B8A090', position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          <div className="mb-5 grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }, (_, index) => <span key={index} style={{ backgroundColor: index < strength ? strengthColor : '#EDD9AF', height: '4px' }} />)}
          </div>

          <label style={{ color: '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '10px' }}>CONFIRM PASSWORD</label>
          <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" required style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF', borderRadius: '2px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '14px', marginBottom: '18px', outlineColor: '#1A1014', padding: '14px 16px', width: '100%' }} />

          <label className="mb-6 flex items-start gap-3" style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.6 }}>
            <input checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} type="checkbox" required style={{ accentColor: '#1A1014', marginTop: '3px' }} />
            I agree to the Terms of Service and Privacy Policy
          </label>

          <button disabled={isLoading} style={{ backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', height: '52px', letterSpacing: '0.2em', opacity: isLoading ? 0.7 : 1, width: '100%' }}>
            {isLoading ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>

          <div style={{ backgroundColor: '#EDD9AF', height: '0.5px', marginTop: '18px', width: '100%' }} />
          <button
            type="button"
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              height: '52px',
              background: 'transparent',
              border: '1px solid #EDD9AF',
              color: '#B8A090',
              fontSize: '11px',
              letterSpacing: '0.2em',
              cursor: 'pointer',
              marginTop: '12px',
              fontFamily: 'var(--font-inter)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.borderColor = '#C9A961'
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
            marginTop: '12px',
            fontFamily: 'var(--font-inter)',
          }}>
            Browse our collection without an account
          </p>
        </motion.form>
      </section>
    </main>
  )
}

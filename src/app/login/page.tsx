'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { signIn, supabaseAuth } from '@/lib/auth'

const adminEmail = 'ujjwalbana@gmail.com'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    const { data, error: signInError } = await signIn(email, password)
    setIsLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    if (data.user?.email === adminEmail) {
      router.push('/admin')
      return
    }

    router.push(searchParams.get('next') || '/account')
  }

  const handleGoogle = async () => {
    await supabaseAuth.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/account` },
    })
  }

  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      <motion.section
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col justify-center px-8 py-12 lg:w-[45%] lg:px-[60px]"
        style={{ backgroundColor: '#1A1014' }}
      >
        <div className="mb-12 flex items-baseline gap-2">
          <span style={{ color: '#C9A961', fontFamily: 'var(--font-italianno)', fontSize: '36px', lineHeight: 1 }}>just</span>
          <span style={{ color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '14px', fontWeight: 500, letterSpacing: '0.28em' }}>BECAUSE</span>
        </div>
        <h1 style={{ color: '#FBF5F0', fontFamily: 'var(--font-playfair)', fontSize: '48px', fontWeight: 400, lineHeight: 1.05, marginBottom: '14px' }}>Welcome back.</h1>
        <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '14px', lineHeight: 1.8 }}>Sign in to your Just Because account.</p>

        <div className="mt-14 grid gap-5">
          {[
            ['The most beautiful buying experience I have had online.', 'Priya M.'],
            ['It felt personal, considered, and quietly luxurious.', 'Sarah K.'],
            ['Everything about it felt like a boutique appointment.', 'Aaron L.'],
          ].map(([quote, author]) => (
            <div key={quote}>
              <div className="mb-2 flex items-center gap-1">
                <Star size={13} fill="#C9A961" color="#C9A961" />
              </div>
              <p style={{ color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>&ldquo;{quote}&rdquo;</p>
              <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', marginTop: '5px' }}>{author}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <section className="flex flex-1 items-center justify-center px-6 py-12 lg:w-[55%] lg:px-[60px]" style={{ backgroundColor: '#FBF5F0' }}>
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-[420px]"
        >
          <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '32px', fontWeight: 400, marginBottom: '8px' }}>Sign in</h2>
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px', marginBottom: '30px' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ color: '#C9A961', textDecoration: 'none' }}>Create one →</Link>
          </p>

          {error && (
            <div style={{ backgroundColor: '#FFF0F0', border: '1px solid #A85C6A', borderRadius: '2px', color: '#A85C6A', fontFamily: 'var(--font-inter)', fontSize: '13px', marginBottom: '18px', padding: '12px 16px' }}>
              {error}
            </div>
          )}

          <label style={{ color: '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '10px' }}>EMAIL ADDRESS</label>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF', borderRadius: '2px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '14px', marginBottom: '18px', outlineColor: '#1A1014', padding: '14px 16px', width: '100%' }} />

          <label style={{ color: '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '10px' }}>PASSWORD</label>
          <div style={{ marginBottom: '8px', position: 'relative' }}>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} required style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF', borderRadius: '2px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '14px', outlineColor: '#1A1014', padding: '14px 48px 14px 16px', width: '100%' }} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} style={{ color: '#B8A090', position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="mb-6 flex justify-end">
            <Link href="#" style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', textDecoration: 'none' }}>Forgot password?</Link>
          </div>

          <button disabled={isLoading} style={{ backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', height: '52px', letterSpacing: '0.2em', opacity: isLoading ? 0.7 : 1, width: '100%' }}>
            {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>

          <div className="my-7 flex items-center gap-4">
            <span style={{ backgroundColor: '#EDD9AF', height: '0.5px', flex: 1 }} />
            <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px' }}>or continue with</span>
            <span style={{ backgroundColor: '#EDD9AF', height: '0.5px', flex: 1 }} />
          </div>

          <button type="button" onClick={handleGoogle} className="flex items-center justify-center gap-3" style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px', height: '52px', width: '100%' }}>
            <span style={{ color: '#C9A961', fontWeight: 500 }}>G</span>
            Continue with Google
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

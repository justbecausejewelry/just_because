'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { supabaseAuth } from '@/lib/auth'
import { getSettledBrowserSession } from '@/lib/supabase'
import { getOrCreateProfile } from '@/lib/userProfile'
import { useToast } from '@/context/ToastContext'

type SavedAddress = {
  id: string
  userId: string
  label: string
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string | null
  isDefault: boolean
}

type AddressForm = Omit<SavedAddress, 'id' | 'userId'>

const ringSizes = Array.from({ length: 25 }, (_, index) => String(3 + index * 0.5))

const emptyAddress: AddressForm = {
  label: 'Home',
  firstName: '',
  lastName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'United States',
  phone: '',
  isDefault: false,
}

function strengthFor(password: string) {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  return score
}

export default function AccountSettingsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressForm, setAddressForm] = useState<AddressForm>(emptyAddress)
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    ringSize: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const loadedUserIdRef = useRef<string | null>(null)

  const passwordStrength = useMemo(() => strengthFor(passwordForm.newPassword), [passwordForm.newPassword])
  const strengthColor = passwordStrength <= 1 ? '#A85C6A' : passwordStrength === 2 ? '#B7791F' : passwordStrength === 3 ? '#C9A961' : '#7A8F72'

  useEffect(() => {
    let cancelled = false

    const loadForUser = async (currentUser: User) => {
      if (loadedUserIdRef.current === currentUser.id) return
      loadedUserIdRef.current = currentUser.id

      try {
        setIsLoading(true)
        setUser(currentUser)
        const currentProfile = await getOrCreateProfile(
          currentUser.id,
          currentUser.email || '',
          typeof currentUser.user_metadata?.name === 'string' ? currentUser.user_metadata.name : undefined
        )

        if (cancelled) return

        setProfileForm({
          fullName: `${currentProfile?.firstName || ''} ${currentProfile?.lastName || ''}`.trim(),
          email: currentUser.email || '',
          phone: currentProfile?.phone || '',
          ringSize: currentProfile?.ringSize || '',
        })

        const { data: savedAddresses } = await supabaseAuth
          .from('SavedAddress')
          .select('*')
          .eq('userId', currentUser.id)
          .order('isDefault', { ascending: false })

        if (!cancelled) {
          setAddresses((savedAddresses || []) as SavedAddress[])
        }
      } catch (error) {
        console.error('Settings load error:', error)
        showToast('Unable to load settings', 'error')
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void getSettledBrowserSession().then((session) => {
      if (cancelled) return
      if (session?.user) {
        void loadForUser(session.user)
      }
    })

    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((event, session) => {
      if (cancelled) return

      if (event === 'SIGNED_OUT' || !session?.user) {
        void getSettledBrowserSession().then((settledSession) => {
          if (cancelled) return
          if (settledSession?.user) {
            void loadForUser(settledSession.user)
            return
          }
          router.replace('/login?redirect=/account/settings')
        })
        return
      }

      void loadForUser(session.user)
    })

    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled && !loadedUserIdRef.current) {
        void getSettledBrowserSession().then((session) => {
          if (cancelled || loadedUserIdRef.current) return
          if (session?.user) {
            void loadForUser(session.user)
            return
          }
          router.replace('/login?redirect=/account/settings')
        })
      }
    }, 5000)

    return () => {
      cancelled = true
      window.clearTimeout(fallbackTimer)
      subscription.unsubscribe()
    }
  }, [router, showToast])

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return

    setIsSavingProfile(true)

    try {
      const [firstName = '', ...lastNameParts] = profileForm.fullName.trim().split(/\s+/)
      const lastName = lastNameParts.join(' ')
      const { data: existing } = await supabaseAuth
        .from('UserProfile')
        .select('id')
        .eq('userId', user.id)
        .single()

      if (existing) {
        const { error } = await supabaseAuth
          .from('UserProfile')
          .update({
            firstName,
            lastName,
            phone: profileForm.phone,
            ringSize: profileForm.ringSize,
            updatedAt: new Date().toISOString(),
          })
          .eq('userId', user.id)

        if (error) throw error
      } else {
        const { error } = await supabaseAuth
          .from('UserProfile')
          .insert({
            userId: user.id,
            email: user.email,
            firstName,
            lastName,
            phone: profileForm.phone,
            ringSize: profileForm.ringSize,
          })

        if (error) throw error
      }

      showToast('Profile updated successfully *', 'success')
    } catch (err) {
      console.error('Profile update error:', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      showToast(`Unable to update profile: ${message}`, 'error')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const saveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return

    if (addressForm.isDefault) {
      await supabaseAuth
        .from('SavedAddress')
        .update({ isDefault: false })
        .eq('userId', user.id)
    }

    const { data, error } = await supabaseAuth
      .from('SavedAddress')
      .insert({ ...addressForm, userId: user.id })
      .select()
      .single()

    if (error) {
      showToast('Unable to save address', 'error')
      return
    }

    const saved = data as SavedAddress
    setAddresses((prev) => saved.isDefault ? [saved, ...prev.map((item) => ({ ...item, isDefault: false }))] : [saved, ...prev])
    setAddressForm(emptyAddress)
    setShowAddressForm(false)
    showToast('Address saved *', 'success')
  }

  const deleteAddress = async (id: string) => {
    if (!user) return
    setAddresses((prev) => prev.filter((item) => item.id !== id))
    await supabaseAuth.from('SavedAddress').delete().eq('id', id).eq('userId', user.id)
  }

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }

    const { error } = await supabaseAuth.auth.updateUser({ password: passwordForm.newPassword })
    if (error) {
      showToast(error.message, 'error')
      return
    }

    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    showToast('Password updated *', 'success')
  }

  const requestDelete = async () => {
    if (deleteConfirm !== 'DELETE') {
      showToast('Type DELETE to confirm', 'error')
      return
    }
    await supabaseAuth.auth.signOut()
    showToast('Contact support to complete deletion', 'info')
    router.push('/')
  }

  if (isLoading || !user) {
    return (
      <main style={{ minHeight: '100vh', background: '#FBF5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-text)', fontFamily: 'var(--font-playfair)', fontSize: '20px' }}>
        Loading settings...
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FBF5F0', maxWidth: '700px', margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '28px' }}>
        <Link href="/account" style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em' }}>Account</Link>
        <span style={{ color: '#EDD9AF' }}>/</span>
        <Link href="/account/returns" style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em' }}>Returns</Link>
        <span style={{ color: '#EDD9AF' }}>/</span>
        <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.08em' }}>Settings</span>
      </div>

      <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '36px', fontWeight: 400, margin: '0 0 28px' }}>Account Settings</h1>

      <form onSubmit={saveProfile} style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '28px', marginBottom: '20px' }}>
        <p className="eyebrow-luxury" style={{ marginBottom: '18px' }}>PERSONAL INFORMATION</p>
        <div className="mt-4 grid gap-4">
          <label><span className="eyebrow-luxury" style={{ display: 'block', marginBottom: '8px' }}>FULL NAME</span><input className="input-luxury" value={profileForm.fullName} onChange={(event) => setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))} /></label>
          <label><span className="eyebrow-luxury" style={{ display: 'block', marginBottom: '8px' }}>EMAIL</span><input className="input-luxury" value={profileForm.email} disabled readOnly /></label>
          <label><span className="eyebrow-luxury" style={{ display: 'block', marginBottom: '8px' }}>PHONE NUMBER</span><input className="input-luxury" value={profileForm.phone} onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))} /></label>
          <label>
            <span className="eyebrow-luxury" style={{ display: 'block', marginBottom: '8px' }}>RING SIZE</span>
            <select className="select-luxury" value={profileForm.ringSize} onChange={(event) => setProfileForm((prev) => ({ ...prev, ringSize: event.target.value }))}>
              <option value="">Select a size</option>
              {ringSizes.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
        </div>
        <button className="btn-primary" disabled={isSavingProfile} style={{ marginTop: '20px' }}>
          {isSavingProfile ? 'SAVING...' : 'SAVE CHANGES'}
        </button>
      </form>

      <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '28px', marginBottom: '20px' }}>
        <p className="eyebrow-luxury" style={{ marginBottom: '18px' }}>SAVED ADDRESSES</p>
        {addresses.map((address) => (
          <div key={address.id} style={{ background: '#FBF5F0', border: '0.5px solid #EDD9AF', padding: '16px 20px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', gap: '18px' }}>
            <div>
              <span style={{ color: '#C9A961', border: '0.5px solid #C9A961', borderRadius: '4px', fontFamily: 'var(--font-inter)', fontSize: '10px', padding: '3px 9px' }}>{address.label}</span>
              <p style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px', margin: '10px 0 4px' }}>{address.firstName} {address.lastName}</p>
              <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>
                {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}<br />
                {address.city}, {address.state} {address.zipCode}<br />
                {address.country}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              {address.isDefault && <span style={{ color: '#6B4A10', background: '#EDD9AF', fontFamily: 'var(--font-inter)', fontSize: '10px', padding: '4px 8px' }}>Default</span>}
              <button aria-label="Edit address" style={{ color: 'var(--color-muted-text)' }}><Pencil size={15} /></button>
              <button aria-label="Delete address" onClick={() => void deleteAddress(address.id)} style={{ color: '#A85C6A' }}><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        <button type="button" className="btn-outline" onClick={() => setShowAddressForm((open) => !open)}>
          {showAddressForm ? 'CANCEL' : 'ADD NEW ADDRESS'}
        </button>
        {showAddressForm && (
          <form onSubmit={saveAddress} style={{ display: 'grid', gap: '14px', marginTop: '18px' }}>
            <input className="input-luxury" placeholder="Label (Home / Work / Other)" value={addressForm.label} onChange={(event) => setAddressForm((prev) => ({ ...prev, label: event.target.value }))} />
            <div className="grid gap-4 md:grid-cols-2">
              <input className="input-luxury" placeholder="First name" value={addressForm.firstName} onChange={(event) => setAddressForm((prev) => ({ ...prev, firstName: event.target.value }))} required />
              <input className="input-luxury" placeholder="Last name" value={addressForm.lastName} onChange={(event) => setAddressForm((prev) => ({ ...prev, lastName: event.target.value }))} required />
            </div>
            <input className="input-luxury" placeholder="Address line 1" value={addressForm.addressLine1} onChange={(event) => setAddressForm((prev) => ({ ...prev, addressLine1: event.target.value }))} required />
            <input className="input-luxury" placeholder="Address line 2" value={addressForm.addressLine2 || ''} onChange={(event) => setAddressForm((prev) => ({ ...prev, addressLine2: event.target.value }))} />
            <div className="grid gap-4 md:grid-cols-2">
              <input className="input-luxury" placeholder="City" value={addressForm.city} onChange={(event) => setAddressForm((prev) => ({ ...prev, city: event.target.value }))} required />
              <input className="input-luxury" placeholder="State" value={addressForm.state} onChange={(event) => setAddressForm((prev) => ({ ...prev, state: event.target.value }))} required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input className="input-luxury" placeholder="ZIP" value={addressForm.zipCode} onChange={(event) => setAddressForm((prev) => ({ ...prev, zipCode: event.target.value }))} required />
              <input className="input-luxury" placeholder="Country" value={addressForm.country} onChange={(event) => setAddressForm((prev) => ({ ...prev, country: event.target.value }))} required />
            </div>
            <input className="input-luxury" placeholder="Phone" value={addressForm.phone || ''} onChange={(event) => setAddressForm((prev) => ({ ...prev, phone: event.target.value }))} />
            <label style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px' }}><input type="checkbox" checked={addressForm.isDefault} onChange={(event) => setAddressForm((prev) => ({ ...prev, isDefault: event.target.checked }))} style={{ accentColor: '#1A1014', marginRight: '8px' }} />Set as default address</label>
            <button className="btn-primary">SAVE ADDRESS</button>
          </form>
        )}
      </section>

      <form onSubmit={updatePassword} style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '28px', marginBottom: '20px' }}>
        <p className="eyebrow-luxury" style={{ marginBottom: '18px' }}>CHANGE PASSWORD</p>
        <div style={{ display: 'grid', gap: '14px' }}>
          <input className="input-luxury" type="password" placeholder="Current password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))} />
          <input className="input-luxury" type="password" placeholder="New password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))} />
          <div className="grid grid-cols-4 gap-2">{Array.from({ length: 4 }, (_, index) => <span key={index} style={{ backgroundColor: index < passwordStrength ? strengthColor : '#EDD9AF', height: '4px' }} />)}</div>
          <input className="input-luxury" type="password" placeholder="Confirm new password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))} />
        </div>
        <button className="btn-primary" style={{ marginTop: '18px' }}>UPDATE PASSWORD</button>
      </form>

      <section style={{ background: '#FCF0F4', border: '0.5px solid #A85C6A', borderRadius: '4px', padding: '28px' }}>
        <p style={{ color: '#A85C6A', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '14px' }}>DANGER ZONE</p>
        <p style={{ color: 'var(--color-muted-text)', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.7 }}>Type DELETE to confirm. We will sign you out and support will complete account deletion.</p>
        <input className="input-luxury" value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} placeholder="DELETE" style={{ margin: '10px 0 14px', borderColor: '#A85C6A' }} />
        <button type="button" className="btn-outline" onClick={requestDelete} style={{ borderColor: '#A85C6A', color: '#A85C6A' }}>Delete my account</button>
      </section>
    </main>
  )
}

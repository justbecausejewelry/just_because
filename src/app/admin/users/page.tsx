'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ShieldCheck, UserRound } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { adminFetch } from '@/lib/adminSession'
import { useRole } from '@/hooks/useRole'
import { BrandLogo } from '@/components/ui/BrandLogo'

type AdminRole = 'user' | 'admin' | 'super_admin'

type AdminUserRow = {
  id: string
  email: string
  name: string
  phone: string | null
  role: AdminRole
  createdAt: string | null
}

type UsersResponse = {
  users?: AdminUserRow[]
  error?: string
}

function isUsersResponse(value: unknown): value is UsersResponse {
  return typeof value === 'object' && value !== null
}

function roleLabel(role: AdminRole) {
  if (role === 'super_admin') return 'Super Admin'
  if (role === 'admin') return 'Admin'
  return 'User'
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { isSuperAdmin, loading: roleLoading } = useRole()
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingEmail, setUpdatingEmail] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)

    try {
      const response = await adminFetch('/api/admin/users')
      const payload = await response.json() as unknown

      if (!isUsersResponse(payload) || !response.ok) {
        const message = isUsersResponse(payload) && payload.error ? payload.error : 'Unable to load users'
        showToast(message, 'error')
        return
      }

      setUsers(payload.users || [])
    } catch {
      showToast('Unable to load users', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (roleLoading) return
    if (!isSuperAdmin) {
      router.replace('/admin')
      return
    }

    void loadUsers()
  }, [isSuperAdmin, loadUsers, roleLoading, router])

  const updateRole = async (email: string, role: 'user' | 'admin') => {
    setUpdatingEmail(email)

    try {
      const response = await adminFetch('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ email, role }),
      })
      const payload = await response.json() as unknown

      if (!response.ok) {
        const message = isUsersResponse(payload) && payload.error ? payload.error : 'Unable to update role'
        showToast(message, 'error')
        return
      }

      showToast(role === 'admin' ? 'User promoted to admin' : 'Admin access removed', 'success')
      await loadUsers()
    } catch {
      showToast('Unable to update role', 'error')
    } finally {
      setUpdatingEmail(null)
    }
  }

  if (roleLoading || loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF5F0' }}>
        <div style={{ textAlign: 'center' }}>
          <BrandLogo size="lg" />
          <div style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', marginTop: '8px' }}>
            LOADING USERS...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.3em', margin: '0 0 8px', textTransform: 'uppercase' }}>
          Super Admin
        </p>
        <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '34px', fontWeight: 400, margin: 0 }}>
          User Roles
        </h1>
        <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px', lineHeight: 1.7, margin: '10px 0 0', maxWidth: '680px' }}>
          Promote customers to admin or remove admin access. Super admin accounts are protected from changes here.
        </p>
      </div>

      <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', overflow: 'hidden' }}>
        <div className="admin-users-header" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 0.8fr 0.8fr 1fr', gap: '16px', padding: '14px 18px', borderBottom: '0.5px solid #EDD9AF', color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Joined</span>
          <span>Actions</span>
        </div>

        {users.map((user) => {
          const isUpdating = updatingEmail === user.email
          const isProtected = user.role === 'super_admin'

          return (
            <div
              key={user.email}
              className="admin-users-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1.5fr 0.8fr 0.8fr 1fr',
                gap: '16px',
                alignItems: 'center',
                padding: '16px 18px',
                borderBottom: '0.5px solid rgba(237,217,175,0.7)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <span style={{ width: '34px', height: '34px', borderRadius: '4px', background: 'rgba(201,169,97,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {user.role === 'super_admin' ? <ShieldCheck size={16} color="#C9A961" strokeWidth={1.5} /> : <UserRound size={16} color="#C9A961" strokeWidth={1.5} />}
                </span>
                <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </span>
              </div>
              <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </span>
              <span
                style={{
                  width: 'fit-content',
                  border: '0.5px solid rgba(201,169,97,0.45)',
                  borderRadius: '4px',
                  color: user.role === 'user' ? '#B8A090' : '#C9A961',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  padding: '5px 8px',
                  textTransform: 'uppercase',
                }}
              >
                {roleLabel(user.role)}
              </span>
              <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{formatDate(user.createdAt)}</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {isProtected ? (
                  <span style={{ color: 'rgba(201,169,97,0.65)', fontFamily: 'var(--font-inter)', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={13} strokeWidth={1.5} />
                    Protected
                  </span>
                ) : user.role === 'admin' ? (
                  <button
                    onClick={() => updateRole(user.email, 'user')}
                    disabled={isUpdating}
                    style={{
                      background: 'transparent',
                      border: '0.5px solid #EDD9AF',
                      borderRadius: '4px',
                      color: '#A85C6A',
                      cursor: isUpdating ? 'wait' : 'pointer',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '10px',
                      fontWeight: 500,
                      letterSpacing: '0.14em',
                      padding: '8px 10px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Revoke
                  </button>
                ) : (
                  <button
                    onClick={() => updateRole(user.email, 'admin')}
                    disabled={isUpdating}
                    style={{
                      background: '#1A1014',
                      border: '0.5px solid #1A1014',
                      borderRadius: '4px',
                      color: '#FBF5F0',
                      cursor: isUpdating ? 'wait' : 'pointer',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '10px',
                      fontWeight: 500,
                      letterSpacing: '0.14em',
                      padding: '8px 10px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Promote
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {!users.length && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>
            No users found.
          </div>
        )}
      </section>

      <style>{`
        @media (max-width: 900px) {
          .admin-users-header {
            display: none !important;
          }

          .admin-users-row {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
        }

        @media (max-width: 640px) {
          div[style*="padding: 32px"] {
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  )
}

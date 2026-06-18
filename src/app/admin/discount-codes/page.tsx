'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, Diamond, Eye, EyeOff, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { supabase } from '@/lib/supabase'

type DiscountType = 'percentage' | 'fixed'

type DiscountCode = {
  id: string
  code: string
  type: DiscountType
  value: number
  minOrderAmount: number
  maxUses: number | null
  maxUsesPerUser: number | null
  firstTimeOnly: boolean
  usesCount: number
  isActive: boolean
  expiresAt: string | null
  createdAt: string | null
}

type DiscountCodesResponse = {
  codes?: DiscountCode[]
  error?: string
}

type FormState = {
  code: string
  type: DiscountType
  value: string
  minOrderAmount: string
  maxUses: string
  maxUsesPerUser: string
  firstTimeOnly: boolean
  expiresAt: string
  isActive: boolean
}

const emptyForm: FormState = {
  code: '',
  type: 'percentage',
  value: '',
  minOrderAmount: '',
  maxUses: '',
  maxUsesPerUser: '',
  firstTimeOnly: false,
  expiresAt: '',
  isActive: true,
}

function isDiscountCodesResponse(value: unknown): value is DiscountCodesResponse {
  return typeof value === 'object' && value !== null
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string | null) {
  if (!value) return 'Never'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function generateRandomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''

  for (let index = 0; index < 6; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)]
  }

  return `JB-${suffix}`
}

function isPastDate(value: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(`${value}T00:00:00`)
  return expiry < today
}

export default function AdminDiscountCodesPage() {
  const { showToast } = useToast()
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], [])
  const expiresToday = form.isActive && form.expiresAt === todayISO

  const getAccessToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    return session?.access_token || null
  }, [])

  const apiRequest = useCallback(async (
    path: string,
    init: RequestInit = {}
  ) => {
    const token = await getAccessToken()
    if (!token) {
      throw new Error('Missing auth session')
    }

    return fetch(path, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
    })
  }, [getAccessToken])

  const loadCodes = useCallback(async () => {
    setLoading(true)

    try {
      const response = await apiRequest('/api/admin/discount-codes')
      const payload = await response.json() as unknown

      if (!isDiscountCodesResponse(payload) || !response.ok) {
        const message = isDiscountCodesResponse(payload) && payload.error ? payload.error : 'Unable to load discount codes'
        showToast(message, 'error')
        return
      }

      setCodes(payload.codes || [])
    } catch {
      showToast('Unable to load discount codes', 'error')
    } finally {
      setLoading(false)
    }
  }, [apiRequest, showToast])

  useEffect(() => {
    void loadCodes()
  }, [loadCodes])

  const stats = useMemo(() => {
    const totalUses = codes.reduce((sum, code) => sum + code.usesCount, 0)
    const averageDiscount = codes.length
      ? codes.reduce((sum, code) => sum + code.value, 0) / codes.length
      : 0

    return {
      total: codes.length,
      active: codes.filter((code) => code.isActive).length,
      totalUses,
      averageDiscount,
    }
  }, [codes])

  const resetForm = () => {
    setForm(emptyForm)
    setShowForm(false)
  }

  const createCode = async () => {
    const value = Number(form.value || 0)
    const maxUses = form.maxUses ? Number(form.maxUses) : null
    const maxUsesPerUser = form.maxUsesPerUser ? Number(form.maxUsesPerUser) : null

    if (!form.code.trim() || value <= 0) {
      showToast('Code and value are required', 'error')
      return
    }

    if ((maxUses !== null && maxUses < 1) || (maxUsesPerUser !== null && maxUsesPerUser < 1)) {
      showToast('Usage limits must be at least 1 or blank', 'error')
      return
    }

    if (form.expiresAt && isPastDate(form.expiresAt)) {
      showToast('Expiry date must be today or in the future', 'error')
      return
    }

    if (expiresToday) {
      showToast('This active code will expire at midnight today', 'info')
    }

    setSaving(true)

    try {
      const response = await apiRequest('/api/admin/discount-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value,
          minOrderAmount: Number(form.minOrderAmount || 0),
          maxUses,
          maxUsesPerUser,
          firstTimeOnly: form.firstTimeOnly,
          expiresAt: form.expiresAt || null,
          isActive: form.isActive,
        }),
      })
      const payload = await response.json() as unknown

      if (!response.ok) {
        const message = isDiscountCodesResponse(payload) && payload.error ? payload.error : 'Unable to create discount code'
        showToast(message, 'error')
        return
      }

      showToast('Discount code created', 'success')
      resetForm()
      await loadCodes()
    } catch {
      showToast('Unable to create discount code', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleCode = async (code: DiscountCode) => {
    setUpdatingId(code.id)

    try {
      const response = await apiRequest('/api/admin/discount-codes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: code.id, isActive: !code.isActive }),
      })
      const payload = await response.json() as unknown

      if (!response.ok) {
        const message = isDiscountCodesResponse(payload) && payload.error ? payload.error : 'Unable to update discount code'
        showToast(message, 'error')
        return
      }

      showToast(code.isActive ? 'Code set inactive' : 'Code set active', 'success')
      await loadCodes()
    } catch {
      showToast('Unable to update discount code', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      showToast('Copied!', 'success')
    } catch {
      showToast('Unable to copy code', 'error')
    }
  }

  const deleteCode = async (code: DiscountCode) => {
    if (!window.confirm(`Delete ${code.code}? This cannot be undone.`)) return

    setUpdatingId(code.id)

    try {
      const response = await apiRequest(`/api/admin/discount-codes?id=${encodeURIComponent(code.id)}`, {
        method: 'DELETE',
      })
      const payload = await response.json() as unknown

      if (!response.ok) {
        const message = isDiscountCodesResponse(payload) && payload.error ? payload.error : 'Unable to delete discount code'
        showToast(message, 'error')
        return
      }

      showToast('Discount code deleted', 'success')
      await loadCodes()
    } catch {
      showToast('Unable to delete discount code', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1240px', margin: '0 auto' }}>
      <div className="discount-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '18px', marginBottom: '28px' }}>
        <div>
          <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.3em', margin: '0 0 8px', textTransform: 'uppercase' }}>
            Admin Tools
          </p>
          <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '34px', fontWeight: 400, margin: 0 }}>
            Discount Codes
          </h1>
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px', lineHeight: 1.7, margin: '10px 0 0', maxWidth: '640px' }}>
            Create and manage customer offers for checkout promotions.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          style={{
            alignItems: 'center',
            background: '#1A1014',
            border: '0.5px solid #1A1014',
            borderRadius: '4px',
            color: '#FBF5F0',
            cursor: 'pointer',
            display: 'flex',
            flexShrink: 0,
            fontFamily: 'var(--font-inter)',
            fontSize: '11px',
            fontWeight: 500,
            gap: '8px',
            letterSpacing: '0.16em',
            padding: '12px 16px',
            textTransform: 'uppercase',
          }}
        >
          <Plus size={14} strokeWidth={1.5} />
          Create Code
        </button>
      </div>

      <section className="discount-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          ['Total Codes', String(stats.total)],
          ['Active Codes', String(stats.active)],
          ['Total Uses', String(stats.totalUses)],
          ['Avg Discount', stats.averageDiscount ? stats.averageDiscount.toFixed(1) : '0'],
        ].map(([label, value]) => (
          <div key={label} style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '18px' }}>
            <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.16em', margin: 0, textTransform: 'uppercase' }}>{label}</p>
            <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '26px', margin: '8px 0 0' }}>{value}</p>
          </div>
        ))}
      </section>

      <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '52px 20px', textAlign: 'center', color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            Loading codes...
          </div>
        ) : codes.length ? (
          <>
            <div className="discount-table-header" style={{ display: 'grid', gridTemplateColumns: '1fr 0.85fr 0.75fr 0.9fr 0.8fr 0.95fr 0.8fr 0.75fr 1fr', gap: '14px', padding: '14px 18px', borderBottom: '0.5px solid #EDD9AF', color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              <span>Code</span>
              <span>Type</span>
              <span>Value</span>
              <span>Min Order</span>
              <span>Uses</span>
              <span>Restriction</span>
              <span>Expires</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {codes.map((code) => {
              const isUpdating = updatingId === code.id

              return (
                <div
                  key={code.id}
                  className="discount-table-row"
                  style={{
                    alignItems: 'center',
                    borderBottom: '0.5px solid rgba(237,217,175,0.7)',
                    display: 'grid',
                    gap: '14px',
                    gridTemplateColumns: '1fr 0.85fr 0.75fr 0.9fr 0.8fr 0.95fr 0.8fr 0.75fr 1fr',
                    padding: '16px 18px',
                  }}
                >
                  <span style={{ color: '#C9A961', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '13px', fontWeight: 700 }}>
                    {code.code}
                  </span>
                  <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>
                    {code.type === 'percentage' ? `${code.value}% off` : `${formatCurrency(code.value)} off`}
                  </span>
                  <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>
                    {code.type === 'percentage' ? `${code.value}%` : formatCurrency(code.value)}
                  </span>
                  <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>
                    {code.minOrderAmount > 0 ? `Min ${formatCurrency(code.minOrderAmount)}` : 'No minimum'}
                  </span>
                  <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>
                    {code.usesCount} / {code.maxUses ?? 'Unlimited'}
                  </span>
                  <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>
                    {code.firstTimeOnly ? 'First-time only' : code.maxUsesPerUser ? `${code.maxUsesPerUser} per user` : 'No per-user cap'}
                  </span>
                  <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>
                    {formatDate(code.expiresAt)}
                  </span>
                  <span style={{ background: code.isActive ? 'rgba(122,143,114,0.14)' : 'rgba(184,160,144,0.14)', borderRadius: '4px', color: code.isActive ? '#7A8F72' : '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.12em', padding: '5px 8px', textTransform: 'uppercase', width: 'fit-content' }}>
                    {code.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button aria-label={code.isActive ? 'Deactivate code' : 'Activate code'} disabled={isUpdating} onClick={() => toggleCode(code)} className="discount-icon-button">
                      {code.isActive ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
                    </button>
                    <button aria-label="Copy code" onClick={() => copyCode(code.code)} className="discount-icon-button">
                      <Copy size={15} strokeWidth={1.5} />
                    </button>
                    <button aria-label="Delete code" disabled={isUpdating} onClick={() => deleteCode(code)} className="discount-icon-button discount-danger-button">
                      <Trash2 size={15} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              )
            })}
          </>
        ) : (
          <div style={{ padding: '64px 20px', textAlign: 'center' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '4px', border: '0.5px solid #EDD9AF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: '#C9A961' }}>
              <Diamond size={24} strokeWidth={1.3} />
            </div>
            <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, margin: 0 }}>
              No discount codes yet
            </h2>
            <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px', lineHeight: 1.7, margin: '10px auto 22px', maxWidth: '360px' }}>
              Create your first discount code to reward your customers.
            </p>
            <button onClick={() => setShowForm(true)} style={{ background: '#1A1014', border: '0.5px solid #1A1014', borderRadius: '4px', color: '#FBF5F0', cursor: 'pointer', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.16em', padding: '12px 16px', textTransform: 'uppercase' }}>
              Create Code
            </button>
          </div>
        )}
      </section>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', justifyContent: 'flex-end' }}>
          <button aria-label="Close create code panel" onClick={resetForm} style={{ position: 'absolute', inset: 0, border: 'none', background: 'rgba(26,16,20,0.62)', cursor: 'pointer' }} />
          <aside className="discount-form-panel" style={{ position: 'relative', width: '420px', maxWidth: '100%', height: '100%', background: '#FBF5F0', borderLeft: '0.5px solid #EDD9AF', padding: '28px', overflowY: 'auto', boxShadow: '-12px 0 40px rgba(26,16,20,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '18px', marginBottom: '24px' }}>
              <div>
                <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em', margin: '0 0 8px', textTransform: 'uppercase' }}>
                  New Offer
                </p>
                <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 400, margin: 0 }}>
                  Create Code
                </h2>
              </div>
              <button onClick={resetForm} aria-label="Close form" className="discount-icon-button">
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <label className="discount-field">
                <span>Code</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={form.code}
                    onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                    placeholder="WELCOME10"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, code: generateRandomCode() }))}
                    aria-label="Generate random discount code"
                    className="discount-generate-button"
                  >
                    <Sparkles size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </label>

              <div className="discount-field">
                <span>Type</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    ['percentage', 'Percentage %'],
                    ['fixed', 'Fixed Amount $'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, type: value as DiscountType }))}
                      style={{
                        background: form.type === value ? '#1A1014' : '#FDF8F2',
                        border: '0.5px solid #EDD9AF',
                        borderRadius: '4px',
                        color: form.type === value ? '#FBF5F0' : '#1A1014',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        padding: '11px 10px',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="discount-field">
                <span>Value ({form.type === 'percentage' ? '%' : '$'})</span>
                <input
                  type="number"
                  min="0"
                  value={form.value}
                  onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
                  placeholder={form.type === 'percentage' ? '10' : '500'}
                />
              </label>

              <label className="discount-field">
                <span>Min Order Amount</span>
                <input
                  type="number"
                  min="0"
                  value={form.minOrderAmount}
                  onChange={(event) => setForm((current) => ({ ...current, minOrderAmount: event.target.value }))}
                  placeholder="0"
                />
              </label>

              <label className="discount-field">
                <span>Max Uses</span>
                <input
                  type="number"
                  min="1"
                  value={form.maxUses}
                  onChange={(event) => setForm((current) => ({ ...current, maxUses: event.target.value }))}
                  placeholder="Blank = unlimited"
                />
              </label>

              <label className="discount-field">
                <span>Max Uses Per User</span>
                <input
                  type="number"
                  min="1"
                  value={form.maxUsesPerUser}
                  onChange={(event) => setForm((current) => ({ ...current, maxUsesPerUser: event.target.value }))}
                  placeholder="Blank = unlimited"
                />
              </label>

              <label style={{ display: 'grid', gap: '6px', background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '14px' }}>
                <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 500 }}>First-time customers only</span>
                <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.55 }}>Only customers with no previous orders can use this code.</span>
                <input
                  type="checkbox"
                  checked={form.firstTimeOnly}
                  onChange={(event) => setForm((current) => ({ ...current, firstTimeOnly: event.target.checked }))}
                  style={{ marginTop: '4px' }}
                />
              </label>

              <label className="discount-field">
                <span>Expiry Date</span>
                <input
                  type="date"
                  min={todayISO}
                  value={form.expiresAt}
                  onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))}
                />
              </label>

              {expiresToday && (
                <div style={{ background: '#EDD9AF', border: '0.5px solid #C9A961', borderRadius: '4px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.55, padding: '12px 14px' }}>
                  This active code expires at midnight today.
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '14px' }}>
                <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 500 }}>Active on creation</span>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                />
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  onClick={createCode}
                  disabled={saving}
                  style={{ flex: 1, background: '#1A1014', border: '0.5px solid #1A1014', borderRadius: '4px', color: '#FBF5F0', cursor: saving ? 'wait' : 'pointer', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.16em', padding: '13px 14px', textTransform: 'uppercase' }}
                >
                  {saving ? 'Creating...' : 'Create Code'}
                </button>
                <button
                  onClick={resetForm}
                  style={{ background: 'transparent', border: '0.5px solid #EDD9AF', borderRadius: '4px', color: '#B8A090', cursor: 'pointer', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.16em', padding: '13px 14px', textTransform: 'uppercase' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <style>{`
        .discount-icon-button {
          align-items: center;
          background: transparent;
          border: 0.5px solid #EDD9AF;
          border-radius: 4px;
          color: #B8A090;
          cursor: pointer;
          display: inline-flex;
          height: 32px;
          justify-content: center;
          padding: 0;
          transition: all 0.2s ease;
          width: 32px;
        }

        .discount-icon-button:hover {
          border-color: #C9A961;
          color: #C9A961;
        }

        .discount-danger-button:hover {
          border-color: #A85C6A;
          color: #A85C6A;
        }

        .discount-generate-button {
          align-items: center;
          background: #FDF8F2;
          border: 0.5px solid #EDD9AF;
          border-radius: 4px;
          color: #C9A961;
          cursor: pointer;
          display: inline-flex;
          flex-shrink: 0;
          justify-content: center;
          width: 44px;
        }

        .discount-field {
          display: grid;
          gap: 7px;
        }

        .discount-field > span {
          color: #B8A090;
          font-family: var(--font-inter);
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .discount-field input {
          background: #FDF8F2;
          border: 0.5px solid #EDD9AF;
          border-radius: 4px;
          color: #1A1014;
          font-family: var(--font-inter);
          font-size: 13px;
          outline: none;
          padding: 12px 12px;
          width: 100%;
        }

        .discount-field input:focus {
          border-color: #C9A961;
        }

        @media (max-width: 1040px) {
          .discount-table-header {
            display: none !important;
          }

          .discount-table-row {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 768px) {
          .discount-header {
            flex-direction: column !important;
          }

          .discount-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 520px) {
          .discount-stats-grid,
          .discount-table-row {
            grid-template-columns: 1fr !important;
          }

          .discount-form-panel {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}

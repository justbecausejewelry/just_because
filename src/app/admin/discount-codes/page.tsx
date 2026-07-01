'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Copy, Diamond, Eye, EyeOff, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { getSettledBrowserSession } from '@/lib/supabase'

type DiscountType = 'percentage' | 'fixed' | 'free_shipping' | 'free_gift'
type AppliesTo = 'all' | 'specific_products' | 'specific_categories' | 'specific_types'
type CustomerSegment = 'all' | 'new' | 'returning' | 'vip' | 'win_back' | 'specific_emails'
type DiscountTab = 'basics' | 'limits' | 'applies' | 'customers' | 'schedule' | 'tiers' | 'reporting'

type DiscountCode = {
  id: string
  code: string
  type: DiscountType
  value: number
  maxDiscountAmount: number | null
  minOrderAmount: number
  minItemCount: number
  maxUses: number | null
  maxUsesPerUser: number | null
  firstTimeOnly: boolean
  canStackWithOthers: boolean
  excludeSaleItems: boolean
  appliesTo: AppliesTo
  applicableProductIds: string[]
  applicableCategories: string[]
  applicableTypes: string[]
  excludedProductIds: string[]
  customerSegment: CustomerSegment
  specificEmails: string[]
  minCustomerLifetimeValue: number | null
  countryRestrictions: string[]
  campaignSource: string
  internalNotes: string
  startDate: string | null
  usesCount: number
  totalRevenueImpact?: number
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
  maxDiscountAmount: string
  internalNotes: string
  campaignSource: string
  minOrderAmount: string
  minItemCount: string
  maxUses: string
  maxUsesPerUser: string
  firstTimeOnly: boolean
  canStackWithOthers: boolean
  excludeSaleItems: boolean
  appliesTo: AppliesTo
  applicableProductIds: string
  applicableCategories: string
  applicableTypes: string
  excludedProductIds: string
  customerSegment: CustomerSegment
  specificEmails: string
  minCustomerLifetimeValue: string
  countryRestrictions: string
  startDate: string
  timezone: string
  tierThresholds: Array<{ threshold: string; type: 'percentage' | 'fixed'; value: string }>
  expiresAt: string
  isActive: boolean
}

const emptyForm: FormState = {
  code: '',
  type: 'percentage',
  value: '',
  maxDiscountAmount: '',
  internalNotes: '',
  campaignSource: '',
  minOrderAmount: '',
  minItemCount: '1',
  maxUses: '',
  maxUsesPerUser: '',
  firstTimeOnly: false,
  canStackWithOthers: false,
  excludeSaleItems: true,
  appliesTo: 'all',
  applicableProductIds: '',
  applicableCategories: '',
  applicableTypes: '',
  excludedProductIds: '',
  customerSegment: 'all',
  specificEmails: '',
  minCustomerLifetimeValue: '',
  countryRestrictions: '',
  startDate: '',
  timezone: 'America/Chicago',
  tierThresholds: [],
  expiresAt: '',
  isActive: true,
}

const discountTabs: Array<{ id: DiscountTab; label: string }> = [
  { id: 'basics', label: 'Basics' },
  { id: 'limits', label: 'Usage Limits' },
  { id: 'applies', label: 'Applies To' },
  { id: 'customers', label: 'Customers' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'tiers', label: 'Tiers' },
  { id: 'reporting', label: 'Reporting' },
]

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

function parseList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function discountTypeLabel(value: DiscountType) {
  if (value === 'free_shipping') return 'Free Shipping'
  if (value === 'free_gift') return 'Free Gift'
  if (value === 'fixed') return 'Fixed Amount $'
  return 'Percentage %'
}

export default function AdminDiscountCodesPage() {
  const { showToast } = useToast()
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<DiscountTab>('basics')
  const [form, setForm] = useState<FormState>(emptyForm)
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], [])
  const expiresToday = form.isActive && form.expiresAt === todayISO

  const getAccessToken = useCallback(async () => {
    const session = await getSettledBrowserSession()
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
    setActiveTab('basics')
    setShowForm(false)
  }

  const createCode = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const codeValue = form.code.trim().toUpperCase()
    const rawValue = form.value.trim()
    const rawMinOrderAmount = form.minOrderAmount.trim()
    const rawMaxDiscountAmount = form.maxDiscountAmount.trim()
    const rawMinItemCount = form.minItemCount.trim()
    const rawMaxUses = form.maxUses.trim()
    const rawMaxUsesPerUser = form.maxUsesPerUser.trim()
    const expiresAt = form.expiresAt.trim()
    const startDate = form.startDate.trim()
    const value = Number(rawValue)
    const maxDiscountAmount = rawMaxDiscountAmount ? Number(rawMaxDiscountAmount) : null
    const minItemCount = Number(rawMinItemCount || 1)
    const maxUses = rawMaxUses ? Number(rawMaxUses) : null
    const maxUsesPerUser = rawMaxUsesPerUser ? Number(rawMaxUsesPerUser) : null
    const minCustomerLifetimeValue = form.minCustomerLifetimeValue ? Number(form.minCustomerLifetimeValue) : null
    const tierThresholds = form.tierThresholds
      .map((tier) => ({
        threshold: Number(tier.threshold),
        type: tier.type,
        value: Number(tier.value),
      }))
      .filter((tier) => Number.isFinite(tier.threshold) && tier.threshold >= 0 && Number.isFinite(tier.value) && tier.value > 0)

    if (!codeValue) {
      showToast('Please enter or generate a discount code', 'error')
      setActiveTab('basics')
      return
    }

    if (form.type !== 'free_shipping' && form.type !== 'free_gift' && (!rawValue || !Number.isFinite(value) || value <= 0)) {
      showToast('Please enter a valid discount value greater than 0', 'error')
      setActiveTab('basics')
      return
    }

    if (form.type === 'percentage' && value > 100) {
      showToast('Percentage discounts cannot exceed 100%', 'error')
      setActiveTab('basics')
      return
    }

    if (maxDiscountAmount !== null && (!Number.isFinite(maxDiscountAmount) || maxDiscountAmount <= 0)) {
      showToast('Max discount amount must be greater than 0 or blank', 'error')
      setActiveTab('basics')
      return
    }

    if (
      (maxUses !== null && (!Number.isFinite(maxUses) || maxUses < 1)) ||
      (maxUsesPerUser !== null && (!Number.isFinite(maxUsesPerUser) || maxUsesPerUser < 1)) ||
      (!Number.isFinite(minItemCount) || minItemCount < 1)
    ) {
      showToast('Usage limits must be at least 1 or blank', 'error')
      setActiveTab('limits')
      return
    }

    if (startDate && expiresAt && new Date(`${startDate}T00:00:00`).getTime() > new Date(`${expiresAt}T23:59:59`).getTime()) {
      showToast('Start date cannot be after end date', 'error')
      setActiveTab('schedule')
      return
    }

    if (expiresAt && isPastDate(expiresAt)) {
      showToast('Expiry date must be today or in the future', 'error')
      setActiveTab('schedule')
      return
    }

    if (form.appliesTo === 'specific_products' && parseList(form.applicableProductIds).length === 0) {
      showToast('Choose at least one product id', 'error')
      setActiveTab('applies')
      return
    }

    if (form.appliesTo === 'specific_categories' && parseList(form.applicableCategories).length === 0) {
      showToast('Choose at least one category', 'error')
      setActiveTab('applies')
      return
    }

    if (form.appliesTo === 'specific_types' && parseList(form.applicableTypes).length === 0) {
      showToast('Choose at least one product type', 'error')
      setActiveTab('applies')
      return
    }

    if (form.customerSegment === 'specific_emails' && parseList(form.specificEmails).length === 0) {
      showToast('Add at least one eligible email', 'error')
      setActiveTab('customers')
      return
    }

    if (form.isActive && expiresAt === todayISO) {
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
          code: codeValue,
          type: form.type,
          value: form.type === 'free_shipping' || form.type === 'free_gift' ? 0 : value,
          maxDiscountAmount,
          internalNotes: form.internalNotes,
          campaignSource: form.campaignSource,
          minOrderAmount: Number(rawMinOrderAmount || 0),
          minItemCount,
          maxUses,
          maxUsesPerUser,
          firstTimeOnly: form.firstTimeOnly,
          canStackWithOthers: form.canStackWithOthers,
          excludeSaleItems: form.excludeSaleItems,
          appliesTo: form.appliesTo,
          applicableProductIds: parseList(form.applicableProductIds),
          applicableCategories: parseList(form.applicableCategories),
          applicableTypes: parseList(form.applicableTypes),
          excludedProductIds: parseList(form.excludedProductIds),
          customerSegment: form.customerSegment,
          specificEmails: parseList(form.specificEmails),
          minCustomerLifetimeValue,
          countryRestrictions: parseList(form.countryRestrictions),
          startDate: startDate || null,
          expiresAt: expiresAt || null,
          timezone: form.timezone,
          isActive: form.isActive,
          freeShipping: form.type === 'free_shipping',
          freeGift: form.type === 'free_gift' ? { label: 'Complimentary gift' } : null,
          tierThresholds,
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

  const addTier = () => {
    setForm((current) => ({
      ...current,
      tierThresholds: [...current.tierThresholds, { threshold: '', type: 'percentage', value: '' }],
    }))
  }

  const updateTier = (index: number, patch: Partial<FormState['tierThresholds'][number]>) => {
    setForm((current) => ({
      ...current,
      tierThresholds: current.tierThresholds.map((tier, tierIndex) => (
        tierIndex === index ? { ...tier, ...patch } : tier
      )),
    }))
  }

  const removeTier = (index: number) => {
    setForm((current) => ({
      ...current,
      tierThresholds: current.tierThresholds.filter((_, tierIndex) => tierIndex !== index),
    }))
  }

  const renderTabFields = () => {
    if (activeTab === 'basics') {
      return (
        <>
          <label className="discount-field">
            <span>Code</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} placeholder="WELCOME10" style={{ flex: 1 }} />
              <button type="button" onClick={() => setForm((current) => ({ ...current, code: generateRandomCode() }))} aria-label="Generate random discount code" className="discount-generate-button">
                <Sparkles size={14} strokeWidth={1.5} />
              </button>
            </div>
          </label>

          <div className="discount-field">
            <span>Type</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {(['percentage', 'fixed', 'free_shipping', 'free_gift'] as DiscountType[]).map((value) => (
                <button key={value} type="button" onClick={() => setForm((current) => ({ ...current, type: value }))} className="discount-choice-button" data-active={form.type === value}>
                  {discountTypeLabel(value)}
                </button>
              ))}
            </div>
          </div>

          {form.type !== 'free_shipping' && form.type !== 'free_gift' && (
            <label className="discount-field">
              <span>Value ({form.type === 'percentage' ? '%' : '$'})</span>
              <input type="number" min="0" value={form.value} onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))} placeholder={form.type === 'percentage' ? '10' : '500'} />
            </label>
          )}

          <label className="discount-field">
            <span>Max Discount Amount</span>
            <input type="number" min="0" value={form.maxDiscountAmount} onChange={(event) => setForm((current) => ({ ...current, maxDiscountAmount: event.target.value }))} placeholder="Optional cap for percentage codes" />
          </label>
          <label className="discount-field">
            <span>Campaign Source</span>
            <input value={form.campaignSource} onChange={(event) => setForm((current) => ({ ...current, campaignSource: event.target.value }))} placeholder="Instagram Campaign Q4 2026" />
          </label>
          <label className="discount-field">
            <span>Internal Notes</span>
            <textarea value={form.internalNotes} onChange={(event) => setForm((current) => ({ ...current, internalNotes: event.target.value }))} placeholder="Admin-only context" />
          </label>
        </>
      )
    }

    if (activeTab === 'limits') {
      return (
        <>
          <label className="discount-field"><span>Max Total Uses</span><input type="number" min="1" value={form.maxUses} onChange={(event) => setForm((current) => ({ ...current, maxUses: event.target.value }))} placeholder="Blank = unlimited" /></label>
          <label className="discount-field"><span>Max Uses Per User</span><input type="number" min="1" value={form.maxUsesPerUser} onChange={(event) => setForm((current) => ({ ...current, maxUsesPerUser: event.target.value }))} placeholder="Blank = unlimited" /></label>
          <label className="discount-field"><span>Min Order Amount</span><input type="number" min="0" value={form.minOrderAmount} onChange={(event) => setForm((current) => ({ ...current, minOrderAmount: event.target.value }))} placeholder="0" /></label>
          <label className="discount-field"><span>Min Item Count</span><input type="number" min="1" value={form.minItemCount} onChange={(event) => setForm((current) => ({ ...current, minItemCount: event.target.value }))} /></label>
          <label className="discount-checkbox"><input type="checkbox" checked={form.firstTimeOnly} onChange={(event) => setForm((current) => ({ ...current, firstTimeOnly: event.target.checked, customerSegment: event.target.checked ? 'new' : current.customerSegment }))} /> First-time customers only</label>
          <label className="discount-checkbox"><input type="checkbox" checked={form.canStackWithOthers} onChange={(event) => setForm((current) => ({ ...current, canStackWithOthers: event.target.checked }))} /> Can stack with other codes</label>
          <label className="discount-checkbox"><input type="checkbox" checked={!form.excludeSaleItems} onChange={(event) => setForm((current) => ({ ...current, excludeSaleItems: !event.target.checked }))} /> Apply to sale/discounted items</label>
        </>
      )
    }

    if (activeTab === 'applies') {
      return (
        <>
          <div className="discount-field">
            <span>Applies To</span>
            {([
              ['all', 'All products'],
              ['specific_products', 'Specific products'],
              ['specific_categories', 'Specific categories'],
              ['specific_types', 'Specific product types'],
            ] as Array<[AppliesTo, string]>).map(([value, label]) => (
              <label key={value} className="discount-radio"><input type="radio" checked={form.appliesTo === value} onChange={() => setForm((current) => ({ ...current, appliesTo: value }))} /> {label}</label>
            ))}
          </div>
          {form.appliesTo === 'specific_products' && <label className="discount-field"><span>Product IDs</span><textarea value={form.applicableProductIds} onChange={(event) => setForm((current) => ({ ...current, applicableProductIds: event.target.value }))} placeholder="One UUID per line or comma-separated" /></label>}
          {form.appliesTo === 'specific_categories' && <label className="discount-field"><span>Categories</span><textarea value={form.applicableCategories} onChange={(event) => setForm((current) => ({ ...current, applicableCategories: event.target.value }))} placeholder="ring, earring, necklace" /></label>}
          {form.appliesTo === 'specific_types' && <label className="discount-field"><span>Product Types</span><textarea value={form.applicableTypes} onChange={(event) => setForm((current) => ({ ...current, applicableTypes: event.target.value }))} placeholder="engagement_ring, bracelet" /></label>}
          <label className="discount-field"><span>Exclude Product IDs</span><textarea value={form.excludedProductIds} onChange={(event) => setForm((current) => ({ ...current, excludedProductIds: event.target.value }))} placeholder="Products that should never receive this code" /></label>
        </>
      )
    }

    if (activeTab === 'customers') {
      return (
        <>
          <div className="discount-field">
            <span>Customer Targeting</span>
            {([
              ['all', 'All customers'],
              ['new', 'New customers'],
              ['returning', 'Returning customers'],
              ['vip', 'VIP customers'],
              ['win_back', 'Win-back customers'],
              ['specific_emails', 'Specific emails'],
            ] as Array<[CustomerSegment, string]>).map(([value, label]) => (
              <label key={value} className="discount-radio"><input type="radio" checked={form.customerSegment === value} onChange={() => setForm((current) => ({ ...current, customerSegment: value, firstTimeOnly: value === 'new' ? true : current.firstTimeOnly }))} /> {label}</label>
            ))}
          </div>
          {form.customerSegment === 'vip' && <label className="discount-field"><span>Minimum Lifetime Value</span><input type="number" min="0" value={form.minCustomerLifetimeValue} onChange={(event) => setForm((current) => ({ ...current, minCustomerLifetimeValue: event.target.value }))} placeholder="5000" /></label>}
          {form.customerSegment === 'specific_emails' && <label className="discount-field"><span>Specific Emails</span><textarea value={form.specificEmails} onChange={(event) => setForm((current) => ({ ...current, specificEmails: event.target.value }))} placeholder="customer@example.com" /></label>}
          <label className="discount-field"><span>Country Restrictions</span><textarea value={form.countryRestrictions} onChange={(event) => setForm((current) => ({ ...current, countryRestrictions: event.target.value }))} placeholder="Blank = all countries" /></label>
        </>
      )
    }

    if (activeTab === 'schedule') {
      const preview = `This code will be ${form.isActive ? 'active' : 'inactive'}${form.startDate ? ` from ${form.startDate}` : ''}${form.expiresAt ? ` to ${form.expiresAt}` : ''}.`
      return (
        <>
          <label className="discount-field"><span>Start Date</span><input type="date" min={todayISO} value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} /></label>
          <label className="discount-field"><span>End Date</span><input type="date" min={todayISO} value={form.expiresAt} onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))} /></label>
          <label className="discount-field"><span>Time Zone</span><input value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} /></label>
          <label className="discount-checkbox"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} /> Active on creation</label>
          <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.6, padding: '12px' }}>{preview}</div>
        </>
      )
    }

    if (activeTab === 'tiers') {
      return (
        <>
          <button type="button" onClick={addTier} className="discount-secondary-button">Add tier</button>
          {form.tierThresholds.length === 0 && <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.6 }}>Tier discounts are optional. Add a tier to override the base value at spend thresholds.</p>}
          {form.tierThresholds.map((tier, index) => (
            <div key={index} style={{ display: 'grid', gap: '8px', background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '12px' }}>
              <label className="discount-field"><span>Spend Threshold</span><input type="number" min="0" value={tier.threshold} onChange={(event) => updateTier(index, { threshold: event.target.value })} /></label>
              <label className="discount-field"><span>Tier Type</span><select value={tier.type} onChange={(event) => updateTier(index, { type: event.target.value as 'percentage' | 'fixed' })}><option value="percentage">Percentage</option><option value="fixed">Fixed</option></select></label>
              <label className="discount-field"><span>Tier Value</span><input type="number" min="0" value={tier.value} onChange={(event) => updateTier(index, { value: event.target.value })} /></label>
              <button type="button" onClick={() => removeTier(index)} className="discount-secondary-button">Remove tier</button>
            </div>
          ))}
        </>
      )
    }

    return (
      <div style={{ display: 'grid', gap: '12px' }}>
        <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.6 }}>Reporting appears for saved codes in the list and analytics page.</p>
        <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '14px' }}>
          <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Tracked Metrics</p>
          <p style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.7, margin: '8px 0 0' }}>Total uses, revenue impact, AOV, validation conversion rate, top customers, products, geography, timing, and suspicious IPs.</p>
        </div>
      </div>
    )
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
                    {code.type === 'percentage' ? `${code.value}% off` : code.type === 'fixed' ? `${formatCurrency(code.value)} off` : discountTypeLabel(code.type)}
                  </span>
                  <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>
                    {code.type === 'percentage' ? `${code.value}%` : code.type === 'fixed' ? formatCurrency(code.value) : 'Included'}
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

            <form onSubmit={createCode} style={{ display: 'grid', gap: '16px' }}>
              <div className="discount-tabs">
                {discountTabs.map((tab) => (
                  <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} data-active={activeTab === tab.id}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {renderTabFields()}

              {expiresToday && activeTab !== 'schedule' && (
                <div style={{ background: '#EDD9AF', border: '0.5px solid #C9A961', borderRadius: '4px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.55, padding: '12px 14px' }}>
                  This active code expires at midnight today.
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ flex: 1, background: '#1A1014', border: '0.5px solid #1A1014', borderRadius: '4px', color: '#FBF5F0', cursor: saving ? 'wait' : 'pointer', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.16em', padding: '13px 14px', textTransform: 'uppercase' }}
                >
                  {saving ? 'Creating...' : 'Create Code'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{ background: 'transparent', border: '0.5px solid #EDD9AF', borderRadius: '4px', color: '#B8A090', cursor: 'pointer', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.16em', padding: '13px 14px', textTransform: 'uppercase' }}
                >
                  Cancel
                </button>
              </div>
            </form>
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

        .discount-field textarea,
        .discount-field select {
          background: #FDF8F2;
          border: 0.5px solid #EDD9AF;
          border-radius: 4px;
          color: #1A1014;
          font-family: var(--font-inter);
          font-size: 13px;
          min-height: 86px;
          outline: none;
          padding: 12px 12px;
          resize: vertical;
          width: 100%;
        }

        .discount-field select {
          min-height: 44px;
        }

        .discount-field input:focus,
        .discount-field textarea:focus,
        .discount-field select:focus {
          border-color: #C9A961;
        }

        .discount-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .discount-tabs button,
        .discount-choice-button,
        .discount-secondary-button {
          background: #FDF8F2;
          border: 0.5px solid #EDD9AF;
          border-radius: 4px;
          color: #1A1014;
          cursor: pointer;
          font-family: var(--font-inter);
          font-size: 10px;
          letter-spacing: 0.1em;
          padding: 10px 11px;
          text-transform: uppercase;
        }

        .discount-tabs button[data-active="true"],
        .discount-choice-button[data-active="true"] {
          background: #1A1014;
          border-color: #1A1014;
          color: #FBF5F0;
        }

        .discount-checkbox,
        .discount-radio {
          align-items: center;
          background: #FDF8F2;
          border: 0.5px solid #EDD9AF;
          border-radius: 4px;
          color: #1A1014;
          display: flex;
          font-family: var(--font-inter);
          font-size: 12px;
          gap: 8px;
          padding: 12px;
        }

        .discount-checkbox input,
        .discount-radio input {
          accent-color: #1A1014;
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

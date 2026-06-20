'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, BarChart3 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type DiscountCode = {
  id: string
  code: string
  maxUses: number | null
  usesCount: number
  totalRevenueImpact?: number
  expiresAt: string | null
  isActive: boolean
  pausedForFraud?: boolean
  fraudReason?: string
}

type CodesResponse = {
  codes?: DiscountCode[]
  error?: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function daysUntil(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return null
  return Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
}

export default function DiscountAnalyticsPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadCodes = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/admin/discount-codes', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      })
      const payload = await response.json() as CodesResponse
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to load discount analytics')
      }
      setCodes(payload.codes || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load discount analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCodes()
  }, [loadCodes])

  const metrics = useMemo(() => {
    const totalRevenueImpact = codes.reduce((sum, code) => sum + Number(code.totalRevenueImpact || 0), 0)
    const totalUses = codes.reduce((sum, code) => sum + code.usesCount, 0)
    const nearingExpiration = codes.filter((code) => {
      const days = daysUntil(code.expiresAt)
      return days !== null && days >= 0 && days <= 7
    })
    const plateaued = codes.filter((code) => code.isActive && code.usesCount === 0)
    const abused = codes.filter((code) => code.pausedForFraud)

    return { totalRevenueImpact, totalUses, nearingExpiration, plateaued, abused }
  }, [codes])

  return (
    <div style={{ padding: '32px', maxWidth: '1240px', margin: '0 auto' }}>
      <Link href="/admin/discount-codes" style={{ alignItems: 'center', color: '#B8A090', display: 'inline-flex', fontFamily: 'var(--font-inter)', fontSize: '12px', gap: '8px', marginBottom: '24px', textDecoration: 'none' }}>
        <ArrowLeft size={14} /> Back to discount codes
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '18px', marginBottom: '26px' }}>
        <div>
          <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.3em', margin: '0 0 8px', textTransform: 'uppercase' }}>Discount Intelligence</p>
          <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '34px', fontWeight: 400, margin: 0 }}>Analytics</h1>
        </div>
        <BarChart3 color="#C9A961" size={28} strokeWidth={1.4} />
      </div>

      {error && <p style={{ color: '#A85C6A', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>{error}</p>}
      {loading ? (
        <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Loading analytics...</p>
      ) : (
        <>
          <section className="discount-analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {[
              ['Total Uses', String(metrics.totalUses)],
              ['Revenue Given Away', formatCurrency(metrics.totalRevenueImpact)],
              ['Expiring Soon', String(metrics.nearingExpiration.length)],
              ['Fraud Paused', String(metrics.abused.length)],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '18px' }}>
                <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.16em', margin: 0, textTransform: 'uppercase' }}>{label}</p>
                <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '26px', margin: '8px 0 0' }}>{value}</p>
              </div>
            ))}
          </section>

          <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', overflow: 'hidden' }}>
            {codes.map((code) => {
              const days = daysUntil(code.expiresAt)
              const statusColor = code.pausedForFraud ? '#A85C6A' : code.isActive ? '#7A8F72' : '#B8A090'
              return (
                <div key={code.id} style={{ alignItems: 'center', borderBottom: '0.5px solid #EDD9AF', display: 'grid', gap: '14px', gridTemplateColumns: '1fr 0.8fr 0.8fr 0.8fr 1fr', padding: '16px 18px' }}>
                  <span style={{ color: '#C9A961', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '13px', fontWeight: 700 }}>{code.code}</span>
                  <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{code.usesCount} / {code.maxUses ?? 'Unlimited'}</span>
                  <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{formatCurrency(Number(code.totalRevenueImpact || 0))}</span>
                  <span style={{ color: days !== null && days <= 7 ? '#A85C6A' : '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{days === null ? 'No expiry' : `${days} days`}</span>
                  <span style={{ alignItems: 'center', color: statusColor, display: 'flex', fontFamily: 'var(--font-inter)', fontSize: '12px', gap: '8px' }}>{code.pausedForFraud && <AlertTriangle size={14} />} {code.pausedForFraud ? code.fraudReason || 'Paused for fraud' : code.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              )
            })}
          </section>
        </>
      )}

      <style>{`
        @media (max-width: 900px) {
          .discount-analytics-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 560px) {
          .discount-analytics-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

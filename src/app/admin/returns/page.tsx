'use client'

import { useEffect, useMemo, useState } from 'react'
import { Eye, RotateCcw, X } from 'lucide-react'
import { adminFetch } from '@/lib/adminSession'
import {
  RETURN_STATUS_LABELS,
  normalizeReturnStatus,
  returnReasonLabel,
  type ReturnStatus,
} from '@/lib/returnEligibility'

type ReturnRequest = {
  id: string
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail: string
  itemName: string
  itemPrice: number
  reason: string
  reasonDetails: string
  status: ReturnStatus
  authorizationNumber: string
  adminNotes: string
  rejectionReason: string
  refundAmount: number
  createdAt: string
  updatedAt: string
  approvedAt: string
  receivedAt: string
  refundedAt: string
}

type AdminAction = 'approve' | 'reject' | 'mark_received' | 'refund' | 'under_review'

const filters: Array<{ label: string; value: 'all' | ReturnStatus }> = [
  { label: 'All', value: 'all' },
  { label: 'Requested', value: 'requested' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Received', value: 'item_received' },
  { label: 'Refunded', value: 'refunded' },
]

function formatCurrency(value = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  if (!value) return 'Pending'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function relativeDate(value: string) {
  if (!value) return 'Pending'
  const diff = Date.now() - new Date(value).getTime()
  const days = Math.max(0, Math.floor(diff / 86400000))
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function statusStyle(status: ReturnStatus) {
  if (status === 'approved' || status === 'refunded') return { background: 'rgba(122,143,114,0.14)', color: '#3F5F38' }
  if (status === 'rejected') return { background: '#FCF0F4', color: '#A85C6A' }
  if (status === 'item_received') return { background: 'rgba(184,160,144,0.16)', color: '#6B5B4E' }
  if (status === 'closed') return { background: '#F5E8ED', color: '#B8A090' }
  return { background: '#EDD9AF', color: '#6B4A10' }
}

function normalizeReturn(row: ReturnRequest): ReturnRequest {
  return {
    ...row,
    status: normalizeReturnStatus(row.status),
    itemPrice: Number(row.itemPrice || 0),
    refundAmount: Number(row.refundAmount || 0),
  }
}

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null)
  const [filter, setFilter] = useState<'all' | ReturnStatus>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rejectingReturn, setRejectingReturn] = useState<ReturnRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [refundInputs, setRefundInputs] = useState<Record<string, string>>({})

  const fetchReturns = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await adminFetch('/api/admin/returns')
      const payload = await response.json() as {
        returns?: ReturnRequest[]
        error?: string
      }

      if (!response.ok) throw new Error(payload.error || 'Unable to load returns.')

      const rows = (payload.returns || []).map(normalizeReturn)
      setReturns(rows)
      setRefundInputs(Object.fromEntries(rows.map((item) => [item.id, String(item.refundAmount || item.itemPrice || '')])))
    } catch (caught) {
      setReturns([])
      setError(caught instanceof Error ? caught.message : 'Unable to load returns.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchReturns()
  }, [])

  const filteredReturns = useMemo(() => (
    filter === 'all'
      ? returns
      : returns.filter((item) => item.status === filter)
  ), [filter, returns])

  const stats = useMemo(() => {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    return {
      total: returns.length,
      pending: returns.filter((item) => item.status === 'requested' || item.status === 'under_review').length,
      approved: returns.filter((item) => item.status === 'approved').length,
      refundedThisMonth: returns.filter((item) => item.status === 'refunded' && item.refundedAt && new Date(item.refundedAt) >= monthStart).length,
    }
  }, [returns])

  const runAction = async (returnRequest: ReturnRequest, action: AdminAction, extra?: { rejectionReason?: string; refundAmount?: number }) => {
    setReturns((current) => current.map((item) => {
      if (item.id !== returnRequest.id) return item
      if (action === 'approve') return { ...item, status: 'approved' }
      if (action === 'reject') return { ...item, status: 'rejected', rejectionReason: extra?.rejectionReason || item.rejectionReason }
      if (action === 'mark_received') return { ...item, status: 'item_received' }
      if (action === 'refund') return { ...item, status: 'refunded', refundAmount: extra?.refundAmount || item.refundAmount }
      return { ...item, status: 'under_review' }
    }))

    const response = await adminFetch('/api/admin/returns', {
      method: 'PATCH',
      body: JSON.stringify({
        returnId: returnRequest.id,
        action,
        ...extra,
      }),
    })

    if (!response.ok) {
      const payload = await response.json() as { error?: string }
      setError(payload.error || 'Unable to update return request.')
    }

    await fetchReturns()
  }

  const submitRejection = async () => {
    if (!rejectingReturn) return
    await runAction(rejectingReturn, 'reject', { rejectionReason })
    setRejectingReturn(null)
    setRejectionReason('')
  }

  const processRefund = async (returnRequest: ReturnRequest) => {
    const refundAmount = Number(refundInputs[returnRequest.id] || returnRequest.itemPrice || 0)
    await runAction(returnRequest, 'refund', { refundAmount })
  }

  return (
    <main style={{ background: '#FBF5F0', minHeight: '100vh', padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '32px', fontWeight: 400, margin: 0 }}>Returns</h1>
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', margin: '8px 0 0' }}>Review and manage return authorizations.</p>
        </div>
        <button onClick={() => void fetchReturns()} className="btn-outline" style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
          <RotateCcw size={15} />
          REFRESH
        </button>
      </div>

      {error ? (
        <div style={{ background: '#FCF0F4', border: '0.5px solid #A85C6A', color: '#A85C6A', fontFamily: 'var(--font-inter)', fontSize: '13px', marginBottom: '18px', padding: '14px 16px' }}>
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" style={{ marginBottom: '24px' }}>
        {[
          ['TOTAL REQUESTS', stats.total.toString()],
          ['PENDING', stats.pending.toString()],
          ['APPROVED', stats.approved.toString()],
          ['REFUNDED THIS MONTH', stats.refundedThisMonth.toString()],
        ].map(([label, value]) => (
          <div key={label} style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '20px 24px' }}>
            <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '10px' }}>{label}</div>
            <div style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '28px', lineHeight: 1.1 }}>{value}</div>
          </div>
        ))}
      </section>

      <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '18px 20px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {filters.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              style={{
                background: filter === item.value ? '#1A1014' : 'transparent',
                border: '0.5px solid #EDD9AF',
                color: filter === item.value ? '#FBF5F0' : '#B8A090',
                cursor: 'pointer',
                fontSize: '11px',
                letterSpacing: '0.08em',
                padding: '9px 13px',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '1120px', width: '100%' }}>
          <thead>
            <tr>
              {['RETURN ID', 'CUSTOMER', 'ORDER #', 'ITEM', 'REASON', 'REQUESTED', 'STATUS', 'ACTIONS'].map((header) => (
                <th key={header} style={{ borderBottom: '0.5px solid #EDD9AF', color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.2em', padding: '14px 16px', textAlign: 'left' }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ color: '#B8A090', padding: '28px 16px' }}>Loading return requests...</td></tr>
            ) : filteredReturns.length ? filteredReturns.map((item) => (
              <tr key={item.id} style={{ borderBottom: '0.5px solid #EDD9AF' }}>
                <td style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '12px', padding: '16px' }}>{item.id.slice(0, 8)}</td>
                <td style={{ padding: '16px' }}>
                  <div style={{ color: '#1A1014', fontSize: '13px' }}>{item.customerName || item.customerEmail}</div>
                  <div style={{ color: '#B8A090', fontSize: '11px', marginTop: '3px' }}>{item.customerEmail}</div>
                </td>
                <td style={{ color: '#1A1014', fontSize: '13px', padding: '16px' }}>{item.orderNumber}</td>
                <td style={{ color: '#1A1014', fontSize: '13px', maxWidth: '190px', padding: '16px' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.itemName}</div>
                  <div style={{ color: '#B8A090', fontSize: '11px', marginTop: '3px' }}>{formatCurrency(item.itemPrice)}</div>
                </td>
                <td style={{ color: '#1A1014', fontSize: '12px', padding: '16px' }}>{returnReasonLabel(item.reason)}</td>
                <td style={{ padding: '16px' }}>
                  <div style={{ color: '#1A1014', fontSize: '12px' }}>{formatDate(item.createdAt)}</div>
                  <div style={{ color: '#B8A090', fontSize: '11px', marginTop: '3px' }}>{relativeDate(item.createdAt)}</div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ ...statusStyle(item.status), borderRadius: '999px', display: 'inline-block', fontSize: '10px', letterSpacing: '0.08em', padding: '7px 10px', textTransform: 'uppercase' }}>
                    {RETURN_STATUS_LABELS[item.status]}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(item.status === 'requested' || item.status === 'under_review') ? (
                      <>
                        <button onClick={() => void runAction(item, 'approve')} style={{ background: 'rgba(122,143,114,0.14)', color: '#3F5F38', fontSize: '10px', padding: '8px 10px' }}>APPROVE</button>
                        <button onClick={() => setRejectingReturn(item)} style={{ background: 'transparent', border: '0.5px solid #A85C6A', color: '#A85C6A', fontSize: '10px', padding: '8px 10px' }}>REJECT</button>
                      </>
                    ) : null}
                    {item.status === 'approved' ? (
                      <button onClick={() => void runAction(item, 'mark_received')} style={{ background: '#EDD9AF', color: '#6B4A10', fontSize: '10px', padding: '8px 10px' }}>MARK RECEIVED</button>
                    ) : null}
                    {item.status === 'item_received' ? (
                      <span style={{ display: 'inline-flex', gap: '6px' }}>
                        <input
                          value={refundInputs[item.id] || ''}
                          onChange={(event) => setRefundInputs((current) => ({ ...current, [item.id]: event.target.value }))}
                          style={{ background: '#FBF5F0', border: '0.5px solid #EDD9AF', color: '#1A1014', fontSize: '11px', height: '32px', padding: '0 8px', width: '82px' }}
                        />
                        <button onClick={() => void processRefund(item)} style={{ background: 'rgba(122,143,114,0.14)', color: '#3F5F38', fontSize: '10px', padding: '8px 10px' }}>REFUND</button>
                      </span>
                    ) : null}
                    <button onClick={() => setSelectedReturn(item)} aria-label="View return details" style={{ background: 'transparent', color: '#1A1014' }}><Eye size={17} /></button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={8} style={{ color: '#B8A090', padding: '28px 16px' }}>No return requests found.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {selectedReturn ? (
        <ReturnDetailPanel returnRequest={selectedReturn} onClose={() => setSelectedReturn(null)} />
      ) : null}

      {rejectingReturn ? (
        <div style={{ alignItems: 'center', background: 'rgba(26,16,20,0.42)', display: 'flex', inset: 0, justifyContent: 'center', padding: '24px', position: 'fixed', zIndex: 400 }}>
          <section style={{ background: '#FBF5F0', border: '0.5px solid #EDD9AF', maxWidth: '460px', padding: '24px', width: '100%' }}>
            <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, margin: 0 }}>Reject Return</h2>
            <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px', lineHeight: 1.6 }}>Add a brief reason for the customer email.</p>
            <textarea
              className="input-luxury"
              rows={4}
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              style={{ height: 'auto', marginBottom: '16px', padding: '12px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-outline" onClick={() => setRejectingReturn(null)}>CANCEL</button>
              <button className="btn-primary" onClick={() => void submitRejection()}>REJECT RETURN</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

function ReturnDetailPanel({
  returnRequest,
  onClose,
}: {
  returnRequest: ReturnRequest
  onClose: () => void
}) {
  return (
    <div style={{ background: 'rgba(26,16,20,0.4)', display: 'flex', inset: 0, justifyContent: 'flex-end', position: 'fixed', zIndex: 300 }} onClick={onClose}>
      <aside style={{ background: '#FBF5F0', boxShadow: '-12px 0 40px rgba(26,16,20,0.18)', height: '100vh', overflowY: 'auto', padding: '26px 28px', width: 'min(100vw, 480px)' }} onClick={(event) => event.stopPropagation()}>
        <div style={{ borderBottom: '0.5px solid #EDD9AF', display: 'flex', gap: '18px', justifyContent: 'space-between', paddingBottom: '18px' }}>
          <div>
            <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '22px', fontWeight: 400, margin: 0 }}>Return {returnRequest.id.slice(0, 8)}</h2>
            <div style={{ color: '#B8A090', fontSize: '11px', marginTop: '6px' }}>{formatDate(returnRequest.createdAt)}</div>
            <span style={{ ...statusStyle(returnRequest.status), display: 'inline-block', fontSize: '10px', letterSpacing: '0.1em', marginTop: '10px', padding: '5px 9px', textTransform: 'uppercase' }}>{RETURN_STATUS_LABELS[returnRequest.status]}</span>
          </div>
          <button onClick={onClose} aria-label="Close return details" style={{ background: 'transparent', color: '#B8A090', cursor: 'pointer', height: '28px' }}><X size={20} /></button>
        </div>

        {[
          ['CUSTOMER', `${returnRequest.customerName || returnRequest.customerEmail}\n${returnRequest.customerEmail}`],
          ['ORDER', `${returnRequest.orderNumber}\n${returnRequest.itemName}\n${formatCurrency(returnRequest.itemPrice)}`],
          ['REASON', `${returnReasonLabel(returnRequest.reason)}\n${returnRequest.reasonDetails || 'No details provided.'}`],
          ['AUTHORIZATION', returnRequest.authorizationNumber || 'Not issued yet'],
          ['ADMIN NOTES', returnRequest.adminNotes || 'No admin notes.'],
          ['REJECTION REASON', returnRequest.rejectionReason || 'None'],
        ].map(([title, value]) => (
          <section key={title} style={{ borderBottom: '0.5px solid #EDD9AF', padding: '22px 0' }}>
            <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '12px' }}>{title}</div>
            <div style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{value}</div>
          </section>
        ))}
      </aside>
    </div>
  )
}

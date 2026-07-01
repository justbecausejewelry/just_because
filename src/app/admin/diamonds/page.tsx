'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { Diamond as DiamondIcon, Edit, Eye, Plus, Search, Trash2 } from 'lucide-react'
import { getAdminAccessToken } from '@/lib/adminSession'
import { getDiamondImage } from '@/lib/diamondImages'

type DiamondRecord = {
  id: string
  sku?: string | null
  shape: string
  carat: number
  color: string
  clarity: string
  cut?: string | null
  polish?: string | null
  symmetry?: string | null
  fluorescence?: string | null
  price: number
  depthPercent?: number | null
  tablePercent?: number | null
  measurements?: string | null
  certificateNumber?: string | null
  certificateType?: string | null
  certificateUrl?: string | null
  isAvailable?: boolean | null
  isLabGrown?: boolean | null
}

type DiamondForm = {
  shape: string
  carat: string
  color: string
  clarity: string
  cut: string
  polish: string
  symmetry: string
  fluorescence: string
  price: string
  depthPercent: string
  tablePercent: string
  measurements: string
  certificateNumber: string
  certificateType: string
  certificateUrl: string
  isAvailable: boolean
  isLabGrown: boolean
}

type DiamondListResponse = {
  diamonds?: DiamondRecord[]
  error?: string
}

type DiamondMutationResponse = {
  diamond?: DiamondRecord
  error?: string
}

const SHAPES = ['Round', 'Princess', 'Cushion', 'Oval', 'Emerald', 'Pear', 'Radiant', 'Asscher', 'Heart', 'Marquise']
const COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
const CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1']
const CUTS = ['Ideal', 'Excellent', 'Very Good', 'Good', 'Fair']
const POLISH_OPTIONS = ['Excellent', 'Very Good', 'Good']
const SYMMETRY_OPTIONS = ['Excellent', 'Very Good', 'Good']
const FLUORESCENCE_OPTIONS = ['None', 'Faint', 'Medium', 'Strong', 'Very Strong']

const emptyForm: DiamondForm = {
  shape: 'Round',
  carat: '',
  color: 'G',
  clarity: 'VS1',
  cut: 'Excellent',
  polish: 'Excellent',
  symmetry: 'Excellent',
  fluorescence: 'None',
  price: '',
  depthPercent: '',
  tablePercent: '',
  measurements: '',
  certificateNumber: '',
  certificateType: 'IGI',
  certificateUrl: '',
  isAvailable: true,
  isLabGrown: true,
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#FDF8F2',
  border: '0.5px solid #EDD9AF',
  color: '#1A1014',
  fontSize: '13px',
  fontFamily: 'var(--font-inter)',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: CSSProperties = {
  fontSize: '9px',
  letterSpacing: '0.22em',
  color: '#C9A961',
  marginBottom: '6px',
  display: 'block',
  fontFamily: 'var(--font-inter)',
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

async function getAdminToken() {
  return getAdminAccessToken()
}

function formFromDiamond(diamond: DiamondRecord): DiamondForm {
  return {
    shape: diamond.shape || 'Round',
    carat: diamond.carat?.toString() || '',
    color: diamond.color || 'G',
    clarity: diamond.clarity || 'VS1',
    cut: diamond.cut || 'Excellent',
    polish: diamond.polish || 'Excellent',
    symmetry: diamond.symmetry || 'Excellent',
    fluorescence: diamond.fluorescence || 'None',
    price: diamond.price?.toString() || '',
    depthPercent: diamond.depthPercent?.toString() || '',
    tablePercent: diamond.tablePercent?.toString() || '',
    measurements: diamond.measurements || '',
    certificateNumber: diamond.certificateNumber || '',
    certificateType: diamond.certificateType || 'IGI',
    certificateUrl: diamond.certificateUrl || '',
    isAvailable: diamond.isAvailable !== false,
    isLabGrown: diamond.isLabGrown !== false,
  }
}

function savePayload(form: DiamondForm, id?: string) {
  return {
    id,
    shape: form.shape,
    carat: Number(form.carat),
    color: form.color,
    clarity: form.clarity,
    cut: form.cut,
    polish: form.polish || 'Excellent',
    symmetry: form.symmetry || 'Excellent',
    fluorescence: form.fluorescence || 'None',
    price: Number(form.price),
    depthPercent: form.depthPercent ? Number(form.depthPercent) : null,
    tablePercent: form.tablePercent ? Number(form.tablePercent) : null,
    measurements: form.measurements.trim() || null,
    certificateNumber: form.certificateNumber.trim() || `IGI${Math.floor(Math.random() * 9000000 + 1000000)}`,
    certificateType: form.certificateType || 'IGI',
    certificateUrl: form.certificateUrl.trim() || null,
    imageUrl: getDiamondImage(form.shape),
    isAvailable: form.isAvailable,
    isLabGrown: true,
  }
}

export default function AdminDiamondsPage() {
  const [diamonds, setDiamonds] = useState<DiamondRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterShape, setFilterShape] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingDiamond, setEditingDiamond] = useState<DiamondRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState<DiamondForm>(emptyForm)

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3000)
  }, [])

  const fetchDiamonds = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getAdminToken()
      if (!token) {
        showToast('Admin session expired. Please sign in again.')
        setDiamonds([])
        return
      }

      const response = await fetch('/api/admin/diamonds?all=true', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = (await response.json()) as DiamondListResponse
      setDiamonds(response.ok ? payload.diamonds || [] : [])
      if (!response.ok) showToast(payload.error || 'Could not load diamonds')
    } catch {
      showToast('Could not load diamonds')
      setDiamonds([])
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    void fetchDiamonds()
  }, [fetchDiamonds])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    return diamonds.filter((diamond) => {
      const matchShape = filterShape === 'all' || diamond.shape === filterShape
      const searchText = [
        diamond.shape,
        diamond.sku || '',
        diamond.certificateNumber || '',
        diamond.color,
        diamond.clarity,
        diamond.cut || '',
      ].join(' ').toLowerCase()

      return matchShape && (!term || searchText.includes(term))
    })
  }, [diamonds, filterShape, search])

  const availableCount = diamonds.filter((diamond) => diamond.isAvailable !== false).length
  const averagePrice = diamonds.length
    ? Math.round(diamonds.reduce((sum, diamond) => sum + (diamond.price || 0), 0) / diamonds.length)
    : 0
  const shapeCount = new Set(diamonds.map((diamond) => diamond.shape)).size

  const resetForm = () => {
    setForm(emptyForm)
  }

  const startNewDiamond = () => {
    setEditingDiamond(null)
    resetForm()
    setShowForm((open) => !open)
  }

  const handleEdit = (diamond: DiamondRecord) => {
    setEditingDiamond(diamond)
    setForm(formFromDiamond(diamond))
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingDiamond(null)
    resetForm()
  }

  const handleSave = async () => {
    if (!form.carat || !form.price) {
      showToast('Carat weight and price are required')
      return
    }

    setSaving(true)
    try {
      const token = await getAdminToken()
      if (!token) {
        showToast('Admin session expired. Please sign in again.')
        return
      }

      const response = await fetch('/api/admin/diamonds', {
        method: editingDiamond ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(savePayload(form, editingDiamond?.id)),
      })
      const payload = (await response.json()) as DiamondMutationResponse

      if (!response.ok || !payload.diamond) {
        showToast(payload.error || 'Could not save diamond')
        return
      }

      const savedDiamond = payload.diamond
      setDiamonds((items) => {
        if (editingDiamond) {
          return items.map((item) => (item.id === savedDiamond.id ? savedDiamond : item))
        }

        return [savedDiamond, ...items]
      })
      showToast(editingDiamond ? 'Diamond updated' : 'Diamond added')
      closeForm()
    } catch {
      showToast('Could not save diamond')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (diamond: DiamondRecord) => {
    if (!window.confirm(`Delete ${diamond.carat}ct ${diamond.shape} diamond?`)) return

    const token = await getAdminToken()
    if (!token) {
      showToast('Admin session expired. Please sign in again.')
      return
    }

    const response = await fetch(`/api/admin/diamonds?id=${encodeURIComponent(diamond.id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const payload = (await response.json()) as { error?: string }

    if (!response.ok) {
      showToast(payload.error || 'Could not delete diamond')
      return
    }

    setDiamonds((items) => items.filter((item) => item.id !== diamond.id))
    showToast('Diamond deleted')
  }

  const stats = [
    ['TOTAL DIAMONDS', diamonds.length.toLocaleString(), '#1A1014'],
    ['AVAILABLE', availableCount.toLocaleString(), '#7A8F72'],
    ['AVG PRICE', formatMoney(averagePrice), '#C9A961'],
    ['SHAPES', shapeCount.toLocaleString(), '#1A1014'],
  ] as const

  return (
    <main style={{ padding: '32px clamp(16px, 4vw, 48px)', background: '#FBF5F0', minHeight: '100vh', fontFamily: 'var(--font-inter)' }}>
      <style>{`
        @media (max-width: 900px) {
          .admin-diamond-header,
          .admin-diamond-toolbar {
            align-items: stretch !important;
            flex-direction: column !important;
          }
          .admin-diamond-form-grid,
          .admin-diamond-stats {
            grid-template-columns: 1fr !important;
          }
          .admin-diamond-row {
            grid-template-columns: 140px 80px 80px 90px 110px 80px 80px 120px 132px !important;
          }
        }
      `}</style>

      {toast ? (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#1A1014', color: '#FBF5F0', padding: '12px 20px', fontSize: '13px', zIndex: 1000, border: '0.5px solid rgba(201,169,97,0.3)' }}>
          {toast}
        </div>
      ) : null}

      <div className="admin-diamond-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '32px' }}>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#C9A961', marginBottom: '6px' }}>ADMIN</div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '32px', fontWeight: 400, color: '#1A1014', margin: '0 0 4px' }}>Diamonds</h1>
          <div style={{ fontSize: '13px', color: '#B8A090' }}>{diamonds.length} diamonds in catalog</div>
        </div>

        <button
          onClick={startNewDiamond}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#1A1014', color: '#FBF5F0', border: 'none', padding: '12px 24px', fontSize: '11px', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}
        >
          <Plus size={16} />
          ADD DIAMOND
        </button>
      </div>

      {showForm ? (
        <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '32px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 400, color: '#1A1014', margin: 0 }}>
              {editingDiamond ? 'Edit Diamond' : 'Add New Diamond'}
            </h2>
            <button onClick={closeForm} aria-label="Close form" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B8A090', fontSize: '22px' }}>
              x
            </button>
          </div>

          <div className="admin-diamond-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <label>
              <span style={labelStyle}>SHAPE</span>
              <select value={form.shape} onChange={(event) => setForm({ ...form, shape: event.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {SHAPES.map((shape) => <option key={shape} value={shape}>{shape}</option>)}
              </select>
            </label>
            <label>
              <span style={labelStyle}>CARAT WEIGHT *</span>
              <input type="number" step="0.01" placeholder="e.g. 1.51" value={form.carat} onChange={(event) => setForm({ ...form, carat: event.target.value })} style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>PRICE (USD) *</span>
              <input type="number" placeholder="e.g. 1200" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>COLOR</span>
              <select value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
              </select>
            </label>
            <label>
              <span style={labelStyle}>CLARITY</span>
              <select value={form.clarity} onChange={(event) => setForm({ ...form, clarity: event.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {CLARITIES.map((clarity) => <option key={clarity} value={clarity}>{clarity}</option>)}
              </select>
            </label>
            <label>
              <span style={labelStyle}>CUT</span>
              <select value={form.cut} onChange={(event) => setForm({ ...form, cut: event.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {CUTS.map((cut) => <option key={cut} value={cut}>{cut}</option>)}
              </select>
            </label>
            <label>
              <span style={labelStyle}>POLISH</span>
              <select value={form.polish} onChange={(event) => setForm({ ...form, polish: event.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {POLISH_OPTIONS.map((polish) => <option key={polish} value={polish}>{polish}</option>)}
              </select>
            </label>
            <label>
              <span style={labelStyle}>SYMMETRY</span>
              <select value={form.symmetry} onChange={(event) => setForm({ ...form, symmetry: event.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {SYMMETRY_OPTIONS.map((symmetry) => <option key={symmetry} value={symmetry}>{symmetry}</option>)}
              </select>
            </label>
            <label>
              <span style={labelStyle}>FLUORESCENCE</span>
              <select value={form.fluorescence} onChange={(event) => setForm({ ...form, fluorescence: event.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {FLUORESCENCE_OPTIONS.map((fluorescence) => <option key={fluorescence} value={fluorescence}>{fluorescence}</option>)}
              </select>
            </label>
            <label>
              <span style={labelStyle}>DEPTH %</span>
              <input type="number" step="0.1" placeholder="e.g. 62.3" value={form.depthPercent} onChange={(event) => setForm({ ...form, depthPercent: event.target.value })} style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>TABLE %</span>
              <input type="number" step="0.1" placeholder="e.g. 56" value={form.tablePercent} onChange={(event) => setForm({ ...form, tablePercent: event.target.value })} style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>MEASUREMENTS (mm)</span>
              <input type="text" placeholder="e.g. 7.23 x 7.25 x 4.48" value={form.measurements} onChange={(event) => setForm({ ...form, measurements: event.target.value })} style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>CERTIFICATE #</span>
              <input type="text" placeholder="e.g. IGI-2026-009999" value={form.certificateNumber} onChange={(event) => setForm({ ...form, certificateNumber: event.target.value })} style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>CERTIFICATE TYPE</span>
              <input type="text" placeholder="IGI" value={form.certificateType} onChange={(event) => setForm({ ...form, certificateType: event.target.value })} style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>CERTIFICATE URL</span>
              <input type="url" placeholder="https://igi.org/cert/..." value={form.certificateUrl} onChange={(event) => setForm({ ...form, certificateUrl: event.target.value })} style={inputStyle} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '22px' }}>
              <input type="checkbox" checked={form.isAvailable} onChange={(event) => setForm({ ...form, isAvailable: event.target.checked })} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#1A1014' }} />
              <span style={{ fontSize: '13px', color: '#1A1014', cursor: 'pointer' }}>Available for purchase</span>
            </label>
          </div>

          <div style={{ marginTop: '20px', padding: '16px 20px', background: 'rgba(201,169,97,0.08)', border: '0.5px solid rgba(201,169,97,0.3)', display: 'inline-flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: '96px', height: '96px', background: '#FBF5F0', border: '0.5px solid #EDD9AF', position: 'relative', flexShrink: 0 }}>
              <Image src={getDiamondImage(form.shape)} alt={`${form.shape} diamond preview`} fill sizes="96px" style={{ objectFit: 'contain', padding: '14px' }} />
            </div>
            <div>
              <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#C9A961', marginBottom: '4px' }}>DIAMOND PREVIEW</div>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', color: '#1A1014' }}>
                {form.carat || '0.00'}ct {form.shape} - {form.color} - {form.clarity} - {form.cut}
              </div>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', color: '#C9A961' }}>
                {formatMoney(Number(form.price) || 0)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '24px' }}>
            <button onClick={() => void handleSave()} disabled={saving} style={{ padding: '12px 32px', background: saving ? '#B8A090' : '#1A1014', color: '#FBF5F0', border: 'none', fontSize: '11px', letterSpacing: '0.2em', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-inter)' }}>
              {saving ? 'SAVING...' : editingDiamond ? 'UPDATE DIAMOND' : 'ADD DIAMOND'}
            </button>
            <button onClick={closeForm} style={{ padding: '12px 24px', background: 'transparent', color: '#B8A090', border: '0.5px solid #EDD9AF', fontSize: '11px', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              CANCEL
            </button>
          </div>
        </section>
      ) : null}

      <div className="admin-diamond-toolbar" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={14} color="#B8A090" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by shape, IGI, color..." style={{ ...inputStyle, paddingLeft: '36px' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['all', ...SHAPES].map((shape) => (
            <button key={shape} onClick={() => setFilterShape(shape)} style={{ padding: '7px 14px', background: filterShape === shape ? '#1A1014' : 'transparent', color: filterShape === shape ? '#FBF5F0' : '#B8A090', border: `0.5px solid ${filterShape === shape ? '#1A1014' : '#EDD9AF'}`, fontSize: '10px', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'var(--font-inter)', textTransform: 'capitalize' }}>
              {shape === 'all' ? 'ALL' : shape}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-diamond-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {stats.map(([label, value, color]) => (
          <div key={label} style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '16px 20px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.22em', color: '#C9A961', marginBottom: '6px' }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', color }}>{value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#B8A090' }}>Loading diamonds...</div>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <section style={{ textAlign: 'center', padding: '80px 24px', background: '#FDF8F2', border: '0.5px solid #EDD9AF' }}>
          <DiamondIcon size={48} color="#EDD9AF" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', color: '#1A1014', marginBottom: '8px' }}>No diamonds found</div>
          <div style={{ fontSize: '13px', color: '#B8A090', marginBottom: '24px' }}>{search ? 'Try a different search' : 'Add your first diamond'}</div>
          <button onClick={startNewDiamond} style={{ padding: '12px 28px', background: '#1A1014', color: '#FBF5F0', border: 'none', fontSize: '11px', letterSpacing: '0.2em', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
            ADD FIRST DIAMOND
          </button>
        </section>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <section style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', overflowX: 'auto' }}>
          <div className="admin-diamond-row" style={{ display: 'grid', gridTemplateColumns: '140px 80px 80px 90px 110px 80px 80px 120px 132px', padding: '12px 20px', background: '#FBF5F0', borderBottom: '0.5px solid #EDD9AF', gap: '8px', minWidth: '912px' }}>
            {['SHAPE', 'CARAT', 'COLOR', 'CLARITY', 'CUT', 'DEPTH', 'TABLE', 'PRICE', 'ACTIONS'].map((heading) => (
              <div key={heading} style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#C9A961' }}>{heading}</div>
            ))}
          </div>
          {filtered.map((diamond, index) => (
            <div key={diamond.id} className="admin-diamond-row" style={{ display: 'grid', gridTemplateColumns: '140px 80px 80px 90px 110px 80px 80px 120px 132px', padding: '14px 20px', borderBottom: index < filtered.length - 1 ? '0.5px solid #EDD9AF' : 'none', alignItems: 'center', gap: '8px', minWidth: '912px' }}>
              <div style={{ fontSize: '13px', color: '#1A1014', fontWeight: 500 }}>{diamond.shape}</div>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '14px', color: '#C9A961' }}>{diamond.carat}ct</div>
              <div style={{ fontSize: '13px', color: '#1A1014', fontWeight: 500 }}>{diamond.color}</div>
              <div style={{ fontSize: '13px', color: '#1A1014' }}>{diamond.clarity}</div>
              <div style={{ fontSize: '12px', color: '#B8A090' }}>{diamond.cut || '-'}</div>
              <div style={{ fontSize: '12px', color: '#B8A090' }}>{diamond.depthPercent ? `${diamond.depthPercent}%` : '-'}</div>
              <div style={{ fontSize: '12px', color: '#B8A090' }}>{diamond.tablePercent ? `${diamond.tablePercent}%` : '-'}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '15px', color: '#1A1014' }}>{formatMoney(diamond.price || 0)}</div>
                <div style={{ fontSize: '10px', color: '#B8A090' }}>
                  ${Math.round((diamond.price || 0) / (diamond.carat || 1)).toLocaleString()}/ct
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span title={diamond.isAvailable !== false ? 'Available' : 'Unavailable'} style={{ width: '8px', height: '8px', borderRadius: '50%', background: diamond.isAvailable !== false ? '#7A8F72' : '#A85C6A', flexShrink: 0 }} />
                <a href={`/diamonds/${diamond.id}`} target="_blank" rel="noopener noreferrer" title="View on site" style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '0.5px solid #EDD9AF', cursor: 'pointer', color: '#B8A090', textDecoration: 'none' }}>
                  <Eye size={13} />
                </a>
                <button onClick={() => handleEdit(diamond)} title="Edit" style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '0.5px solid #EDD9AF', cursor: 'pointer', color: '#B8A090' }}>
                  <Edit size={13} />
                </button>
                <button onClick={() => void handleDelete(diamond)} title="Delete" style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '0.5px solid #EDD9AF', cursor: 'pointer', color: '#A85C6A' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div style={{ marginTop: '12px', textAlign: 'right', fontSize: '11px', color: '#B8A090' }}>
          Showing {filtered.length} of {diamonds.length} diamonds
        </div>
      ) : null}
    </main>
  )
}

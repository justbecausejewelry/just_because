'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, Trash2, Upload } from 'lucide-react'
import {
  RING_SETTING_METALS,
  RING_SETTING_SHAPES,
  RING_SETTING_STYLES,
  normalizeImageKey,
  normalizeRingSetting,
  type RingSetting,
  type RingSettingImages,
  type RingSettingPayload,
} from '@/lib/ringSettings'
import { adminFetch } from '@/lib/adminSession'
import { useToast } from '@/context/ToastContext'

type RingSettingFormProps = {
  mode: 'new' | 'edit'
  setting?: RingSetting
}

type UploadTarget = 'imageUrl' | keyof RingSettingImages

const fieldStyle = {
  backgroundColor: '#FDF8F2',
  border: '0.5px solid #EDD9AF',
  borderRadius: '2px',
  color: '#1A1014',
  fontFamily: 'var(--font-inter)',
  fontSize: '13px',
  outline: 'none',
  padding: '12px 14px',
  width: '100%',
}

function blankPayload(): RingSettingPayload {
  return {
    basePrice: 0,
    compatibleShapes: [...RING_SETTING_SHAPES],
    description: null,
    imageUrl: null,
    images: {},
    isActive: true,
    metals: [...RING_SETTING_METALS],
    name: '',
    sortOrder: 0,
    style: 'Solitaire',
  }
}

function labelStyle() {
  return {
    color: '#1A1014',
    display: 'grid',
    fontFamily: 'var(--font-inter)',
    fontSize: '12px',
    gap: '8px',
  }
}

function CheckboxPill({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label
      style={{
        alignItems: 'center',
        backgroundColor: checked ? 'rgba(201,169,97,0.12)' : '#FDF8F2',
        border: checked ? '0.5px solid #C9A961' : '0.5px solid #EDD9AF',
        borderRadius: '4px',
        color: '#1A1014',
        cursor: 'pointer',
        display: 'flex',
        fontFamily: 'var(--font-inter)',
        fontSize: '12px',
        gap: '8px',
        padding: '10px 12px',
      }}
    >
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        style={{ accentColor: '#C9A961' }}
        type="checkbox"
      />
      {label}
    </label>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        backgroundColor: checked ? '#C9A961' : '#D8CFC8',
        borderRadius: '999px',
        height: '24px',
        padding: '2px',
        transition: 'all 0.2s',
        width: '46px',
      }}
    >
      <span
        style={{
          backgroundColor: '#FBF5F0',
          borderRadius: '50%',
          display: 'block',
          height: '20px',
          transform: checked ? 'translateX(22px)' : 'translateX(0)',
          transition: 'all 0.2s',
          width: '20px',
        }}
      />
    </button>
  )
}

export function RingSettingForm({ mode, setting }: RingSettingFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const normalized = setting ? normalizeRingSetting(setting) : null
  const [form, setForm] = useState<RingSettingPayload>(() => normalized ? {
    basePrice: normalized.basePrice,
    compatibleShapes: normalized.compatibleShapes,
    description: normalized.description,
    imageUrl: normalized.imageUrl,
    images: normalized.images,
    isActive: normalized.isActive,
    metals: normalized.metals,
    name: normalized.name,
    sortOrder: normalized.sortOrder,
    style: normalized.style || 'Solitaire',
  } : blankPayload())
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<UploadTarget | null>(null)
  const [metalImagesOpen, setMetalImagesOpen] = useState(false)

  const setField = <K extends keyof RingSettingPayload>(key: K, value: RingSettingPayload[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const toggleListValue = (field: 'metals' | 'compatibleShapes', value: string, checked: boolean) => {
    setForm((current) => {
      const currentList = current[field]
      return {
        ...current,
        [field]: checked
          ? Array.from(new Set([...currentList, value]))
          : currentList.filter((item) => item !== value),
      }
    })
  }

  const uploadImage = async (file: File, target: UploadTarget) => {
    setUploading(target)
    try {
      const data = new FormData()
      data.set('file', file)
      data.set('bucket', 'ring-settings')
      data.set('slug', form.name || 'setting')

      const response = await adminFetch('/api/admin/upload', {
        body: data,
        method: 'POST',
      })
      const payload = (await response.json()) as { publicUrl?: string; error?: string }

      if (!response.ok || !payload.publicUrl) {
        throw new Error(payload.error || 'Upload failed.')
      }

      if (target === 'imageUrl') {
        setField('imageUrl', payload.publicUrl)
      } else {
        setField('images', { ...form.images, [target]: payload.publicUrl })
      }
      showToast('Image uploaded', 'success')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Upload failed.', 'error')
    } finally {
      setUploading(null)
    }
  }

  const saveSetting = async () => {
    setSaving(true)
    try {
      const response = await adminFetch(mode === 'new' ? '/api/admin/ring-settings' : `/api/admin/ring-settings/${setting?.id}`, {
        body: JSON.stringify(form),
        method: mode === 'new' ? 'POST' : 'PUT',
      })
      const payload = (await response.json()) as { setting?: RingSetting; error?: string }

      if (!response.ok || !payload.setting) {
        throw new Error(payload.error || 'Unable to save setting.')
      }

      showToast(mode === 'new' ? 'Ring setting created' : 'Ring setting saved', 'success')
      router.push('/admin/ring-settings')
      router.refresh()
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Unable to save setting.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteSetting = async () => {
    if (!setting || !window.confirm('Delete this ring setting? This cannot be undone.')) return

    setSaving(true)
    try {
      const response = await adminFetch(`/api/admin/ring-settings/${setting.id}`, {
        method: 'DELETE',
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to delete setting.')
      }

      showToast('Ring setting deleted', 'success')
      router.push('/admin/ring-settings')
      router.refresh()
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Unable to delete setting.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '30px', fontWeight: 400, margin: 0 }}>
            {mode === 'new' ? 'Add Ring Setting' : 'Edit Ring Setting'}
          </h2>
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px', lineHeight: 1.7, margin: '6px 0 0' }}>
            Mountings shown only in the ring builder.
          </p>
        </div>
        <Link href="/admin/ring-settings" style={{ border: '0.5px solid #EDD9AF', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.14em', padding: '12px 16px', textDecoration: 'none' }}>
          CANCEL
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="grid gap-5" style={{ backgroundColor: '#FBF5F0', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '24px' }}>
          <label style={labelStyle()}>
            Setting Name*
            <input
              onChange={(event) => setField('name', event.target.value)}
              placeholder="e.g. Solitaire, Halo, Pave Band"
              style={fieldStyle}
              value={form.name}
            />
          </label>

          <label style={labelStyle()}>
            Style*
            <select onChange={(event) => setField('style', event.target.value)} style={fieldStyle} value={form.style}>
              {RING_SETTING_STYLES.map((style) => <option key={style} value={style}>{style}</option>)}
            </select>
          </label>

          <label style={labelStyle()}>
            Description
            <textarea
              onChange={(event) => setField('description', event.target.value)}
              placeholder="Brief description shown to customers"
              rows={4}
              style={{ ...fieldStyle, resize: 'vertical' }}
              value={form.description || ''}
            />
          </label>

          <label style={labelStyle()}>
            Setting price (before diamond)*
            <input
              min={0}
              onChange={(event) => setField('basePrice', Number(event.target.value))}
              placeholder="0"
              style={fieldStyle}
              type="number"
              value={form.basePrice}
            />
          </label>

          <div>
            <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.24em', marginBottom: '12px' }}>AVAILABLE METALS</p>
            <div className="grid gap-2 md:grid-cols-2">
              {RING_SETTING_METALS.map((metal) => (
                <CheckboxPill
                  checked={form.metals.includes(metal)}
                  key={metal}
                  label={metal}
                  onChange={(checked) => toggleListValue('metals', metal, checked)}
                />
              ))}
            </div>
          </div>

          <div>
            <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.24em', marginBottom: '12px' }}>COMPATIBLE DIAMOND SHAPES</p>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {RING_SETTING_SHAPES.map((shape) => (
                <CheckboxPill
                  checked={form.compatibleShapes.includes(shape)}
                  key={shape}
                  label={shape}
                  onChange={(checked) => toggleListValue('compatibleShapes', shape, checked)}
                />
              ))}
            </div>
          </div>

          <label style={labelStyle()}>
            Display order in ring builder (lower = first)
            <input
              onChange={(event) => setField('sortOrder', Number(event.target.value))}
              style={fieldStyle}
              type="number"
              value={form.sortOrder}
            />
          </label>
        </section>

        <aside className="grid content-start gap-5">
          <section style={{ backgroundColor: '#FBF5F0', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '20px' }}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>Show in ring builder</span>
              <Toggle checked={form.isActive} onChange={(checked) => setField('isActive', checked)} />
            </div>
            <button
              disabled={saving}
              onClick={saveSetting}
              style={{ backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.18em', opacity: saving ? 0.6 : 1, padding: '14px', width: '100%' }}
            >
              {saving ? 'SAVING...' : 'SAVE SETTING'}
            </button>
            {mode === 'edit' ? (
              <button
                disabled={saving}
                onClick={deleteSetting}
                style={{ alignItems: 'center', border: '0.5px solid #A85C6A', color: '#A85C6A', display: 'flex', fontFamily: 'var(--font-inter)', fontSize: '11px', gap: '8px', justifyContent: 'center', letterSpacing: '0.14em', marginTop: '12px', opacity: saving ? 0.6 : 1, padding: '12px', width: '100%' }}
              >
                <Trash2 size={14} />
                DELETE SETTING
              </button>
            ) : null}
          </section>

          <section style={{ backgroundColor: '#FBF5F0', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '20px' }}>
            <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.24em', marginBottom: '12px' }}>PRIMARY SETTING IMAGE</p>
            <div style={{ aspectRatio: '1', backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', marginBottom: '12px', position: 'relative' }}>
              {form.imageUrl ? <Image alt="Primary setting image" fill sizes="320px" src={form.imageUrl} style={{ objectFit: 'cover' }} /> : null}
            </div>
            <label style={{ alignItems: 'center', border: '0.5px solid #EDD9AF', color: '#1A1014', cursor: 'pointer', display: 'flex', fontFamily: 'var(--font-inter)', fontSize: '11px', gap: '8px', justifyContent: 'center', letterSpacing: '0.14em', padding: '12px' }}>
              <Upload size={14} />
              {uploading === 'imageUrl' ? 'UPLOADING...' : 'UPLOAD IMAGE'}
              <input
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void uploadImage(file, 'imageUrl')
                  event.target.value = ''
                }}
                type="file"
              />
            </label>
          </section>

          <section style={{ backgroundColor: '#FBF5F0', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '20px' }}>
            <button
              className="flex w-full items-center justify-between gap-3"
              onClick={() => setMetalImagesOpen((open) => !open)}
              style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', letterSpacing: '0.12em' }}
              type="button"
            >
              IMAGES PER METAL (OPTIONAL)
              <ChevronDown size={16} style={{ transform: metalImagesOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} />
            </button>
            {metalImagesOpen ? (
              <div className="mt-4 grid gap-4">
                {RING_SETTING_METALS.map((metal) => {
                  const key = normalizeImageKey(metal)
                  return (
                    <div key={metal}>
                      <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', marginBottom: '8px' }}>{metal}</p>
                      <div style={{ aspectRatio: '1.4', backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', marginBottom: '8px', position: 'relative' }}>
                        {form.images[key] ? <Image alt={`${metal} setting`} fill sizes="280px" src={form.images[key]} style={{ objectFit: 'cover' }} /> : null}
                      </div>
                      <label style={{ border: '0.5px solid #EDD9AF', color: '#1A1014', cursor: 'pointer', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.12em', padding: '10px', textAlign: 'center' }}>
                        {uploading === key ? 'UPLOADING...' : `UPLOAD ${metal.toUpperCase()} IMAGE`}
                        <input
                          accept="image/png,image/jpeg,image/webp"
                          hidden
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) void uploadImage(file, key)
                            event.target.value = ''
                          }}
                          type="file"
                        />
                      </label>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </main>
  )
}

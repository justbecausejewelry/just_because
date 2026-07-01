'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Gem, Pencil, Plus, Trash2 } from 'lucide-react'
import { formatRingSettingMoney, normalizeRingSetting, type RingSetting } from '@/lib/ringSettings'
import { getAdminAccessToken } from '@/lib/adminSession'
import { useToast } from '@/context/ToastContext'

async function getAdminToken() {
  return getAdminAccessToken()
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{ backgroundColor: checked ? '#C9A961' : '#D8CFC8', borderRadius: '999px', height: '22px', padding: '2px', transition: 'all 0.2s', width: '42px' }}>
      <span style={{ backgroundColor: '#FBF5F0', borderRadius: '50%', display: 'block', height: '18px', transform: checked ? 'translateX(20px)' : 'translateX(0)', transition: 'all 0.2s', width: '18px' }} />
    </button>
  )
}

export default function AdminRingSettingsPage() {
  const { showToast } = useToast()
  const [settings, setSettings] = useState<RingSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSettings = async () => {
    setLoading(true)
    setError('')
    const token = await getAdminToken()
    if (!token) {
      setError('Admin session expired. Please sign in again.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/ring-settings', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = (await response.json()) as { settings?: RingSetting[]; error?: string }
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to load ring settings.')
      }
      setSettings((payload.settings || []).map(normalizeRingSetting))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load ring settings.')
      setSettings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSettings()
  }, [])

  const patchSetting = async (setting: RingSetting, payload: Partial<RingSetting>) => {
    const next = normalizeRingSetting({ ...setting, ...payload })
    setSettings((items) => items.map((item) => item.id === setting.id ? next : item))
    const token = await getAdminToken()
    if (!token) return

    const response = await fetch(`/api/admin/ring-settings/${setting.id}`, {
      body: JSON.stringify(next),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'PUT',
    })

    if (!response.ok) {
      showToast('Unable to update ring setting', 'error')
      void loadSettings()
    }
  }

  const deleteSetting = async (setting: RingSetting) => {
    if (!window.confirm(`Delete ${setting.name}?`)) return
    const token = await getAdminToken()
    if (!token) return

    const response = await fetch(`/api/admin/ring-settings/${setting.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      method: 'DELETE',
    })
    const payload = (await response.json()) as { error?: string }

    if (!response.ok) {
      showToast(payload.error || 'Unable to delete ring setting', 'error')
      return
    }

    setSettings((items) => items.filter((item) => item.id !== setting.id))
    showToast('Ring setting deleted', 'success')
  }

  return (
    <main className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '30px', fontWeight: 400, margin: 0 }}>Ring Settings</h2>
          <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px', lineHeight: 1.7, margin: '6px 0 0' }}>
            Mountings used only in the ring builder.
          </p>
        </div>
        <Link href="/admin/ring-settings/new" style={{ alignItems: 'center', backgroundColor: '#1A1014', color: '#FBF5F0', display: 'flex', fontFamily: 'var(--font-inter)', fontSize: '11px', gap: '8px', letterSpacing: '0.18em', padding: '13px 18px', textDecoration: 'none' }}>
          <Plus size={14} />
          ADD SETTING
        </Link>
      </div>

      {loading ? (
        <div style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', padding: '40px 0' }}>Loading ring settings...</div>
      ) : error ? (
        <div style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', color: '#A85C6A', fontFamily: 'var(--font-inter)', fontSize: '13px', lineHeight: 1.7, padding: '24px' }}>{error}</div>
      ) : settings.length === 0 ? (
        <div style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '42px 24px', textAlign: 'center' }}>
          <Gem color="#C9A961" size={42} strokeWidth={1.2} />
          <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, margin: '16px 0 8px' }}>No ring settings yet. Add your first mounting to enable the ring builder.</p>
          <Link href="/admin/ring-settings/new" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.15em', textDecoration: 'none' }}>+ Add Setting</Link>
        </div>
      ) : (
        <div className="overflow-x-auto" style={{ backgroundColor: '#FBF5F0', border: '0.5px solid #EDD9AF', borderRadius: '4px' }}>
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr>
                {['Image', 'Name', 'Style', 'Price', 'Active', 'Actions'].map((heading) => (
                  <th key={heading} style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.14em', padding: '16px', textTransform: 'uppercase' }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {settings.map((setting) => (
                <tr key={setting.id} style={{ borderTop: '0.5px solid #EDD9AF' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ backgroundColor: '#F5E8ED', height: '56px', position: 'relative', width: '56px' }}>
                      {setting.imageUrl ? <Image src={setting.imageUrl} alt={setting.name} fill sizes="56px" style={{ objectFit: 'cover' }} /> : <div className="flex h-full items-center justify-center"><Gem color="#C9A961" size={21} /></div>}
                    </div>
                  </td>
                  <td style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '17px' }}>{setting.name}</td>
                  <td style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{setting.style || 'Setting'}</td>
                  <td style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{formatRingSettingMoney(setting.basePrice)}</td>
                  <td><Toggle checked={setting.isActive} onChange={() => void patchSetting(setting, { isActive: !setting.isActive })} /></td>
                  <td>
                    <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
                      <Link href={`/admin/ring-settings/${setting.id}/edit`} title="Edit setting" style={{ alignItems: 'center', border: '0.5px solid #EDD9AF', borderRadius: '2px', color: '#C9A961', display: 'flex', height: '32px', justifyContent: 'center', width: '32px' }}><Pencil size={16} /></Link>
                      <button onClick={() => void deleteSetting(setting)} title="Delete setting" style={{ alignItems: 'center', border: '0.5px solid #EDD9AF', borderRadius: '2px', color: '#A85C6A', display: 'flex', height: '32px', justifyContent: 'center', width: '32px' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

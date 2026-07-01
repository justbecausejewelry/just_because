'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { RingSettingForm } from '@/components/admin/RingSettingForm'
import { normalizeRingSetting, type RingSetting } from '@/lib/ringSettings'
import { getSettledBrowserSession } from '@/lib/supabase'

type RingSettingPayload = {
  setting?: RingSetting
  error?: string
}

export default function EditRingSettingPage() {
  const params = useParams<{ id: string }>()
  const [setting, setSetting] = useState<RingSetting | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSetting = async () => {
      const session = await getSettledBrowserSession()
      const token = session?.access_token
      if (!token) {
        setError('Admin session expired. Please sign in again.')
        return
      }

      const response = await fetch(`/api/admin/ring-settings/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = (await response.json()) as RingSettingPayload
      if (!response.ok || !payload.setting) {
        setError(payload.error || 'Ring setting not found.')
        return
      }

      setSetting(normalizeRingSetting(payload.setting))
    }

    void loadSetting()
  }, [params.id])

  if (error) {
    return <main className="p-6 lg:p-8" style={{ color: '#A85C6A', fontFamily: 'var(--font-inter)' }}>{error}</main>
  }

  if (!setting) {
    return <main className="p-6 lg:p-8" style={{ color: '#B8A090', fontFamily: 'var(--font-inter)' }}>Loading ring setting...</main>
  }

  return <RingSettingForm mode="edit" setting={setting} />
}

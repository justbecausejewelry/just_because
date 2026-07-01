'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type UserRole = 'user' | 'admin' | 'super_admin'

function normalizeRole(role: string | null | undefined): UserRole {
  if (role === 'admin' || role === 'super_admin') return role
  return 'user'
}

export function useRole() {
  const [role, setRole] = useState<UserRole>('user')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchRole = async () => {
      setLoading(true)

      try {
        await new Promise((resolve) => globalThis.setTimeout(resolve, 500))

        const {
          data: { session },
        } = await supabase.auth.getSession()

        const user = session?.user || null

        if (!user?.email) {
          if (!cancelled) {
            setRole('user')
            setLoading(false)
          }
          return
        }

        const { data } = await supabase
          .from('AdminUser')
          .select('role')
          .eq('email', user.email.toLowerCase())
          .maybeSingle()

        if (!cancelled) {
          setRole(normalizeRole(data?.role))
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setRole('user')
          setLoading(false)
        }
      }
    }

    void fetchRole()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void fetchRole()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return {
    role,
    loading,
    isUser: role === 'user',
    isAdmin: role === 'admin' || role === 'super_admin',
    isSuperAdmin: role === 'super_admin',
  }
}

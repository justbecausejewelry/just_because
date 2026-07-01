'use client'

import { useEffect, useRef, useState } from 'react'
import { getSettledBrowserSession, supabase } from '@/lib/supabase'

export type UserRole = 'user' | 'admin' | 'super_admin'
const ROLE_CACHE_KEY = 'jb_user_role_v1'

function normalizeRole(role: string | null | undefined): UserRole {
  if (role === 'admin' || role === 'super_admin') return role
  return 'user'
}

function readCachedRole(): UserRole {
  if (typeof window === 'undefined') return 'user'

  try {
    return normalizeRole(window.sessionStorage.getItem(ROLE_CACHE_KEY))
  } catch {
    return 'user'
  }
}

export function useRole() {
  const [role, setRoleState] = useState<UserRole>(readCachedRole)
  const [loading, setLoading] = useState(true)
  const roleRef = useRef<UserRole>(role)

  const setRole = (nextRole: UserRole) => {
    roleRef.current = nextRole
    setRoleState(nextRole)

    if (typeof window !== 'undefined') {
      try {
        if (nextRole === 'user') {
          window.sessionStorage.removeItem(ROLE_CACHE_KEY)
        } else {
          window.sessionStorage.setItem(ROLE_CACHE_KEY, nextRole)
        }
      } catch {
        // Session storage can be unavailable; the in-memory role still works.
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    const fetchRole = async () => {
      setLoading(true)

      try {
        await new Promise((resolve) => globalThis.setTimeout(resolve, 500))

        const session = await getSettledBrowserSession()
        const user = session?.user || null

        if (!user?.email || !session?.access_token) {
          if (!cancelled) {
            if (roleRef.current === 'user') {
              setRole('user')
            }
            setLoading(false)
          }
          return
        }

        const response = await fetch('/api/admin/check-access', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const data = await response.json().catch(() => null) as { isAdmin?: boolean; role?: string | null } | null

        if (!cancelled) {
          if (response.ok && data?.isAdmin) {
            setRole(normalizeRole(data.role))
          } else if (response.status === 403) {
            setRole('user')
          }
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
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

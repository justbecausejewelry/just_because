import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface AdminRecord {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export async function checkIsAdmin(): Promise<{
  isAdmin: boolean
  role: string | null
  adminData: AdminRecord | null
}> {
  try {
    const { data: { user }, error: authError } =
      await supabase.auth.getUser()

    if (authError || !user?.email) {
      return { isAdmin: false, role: null, adminData: null }
    }

    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      return { isAdmin: false, role: null, adminData: null }
    }

    const response = await fetch('/api/admin/check-access', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      return { isAdmin: false, role: null, adminData: null }
    }

    return await response.json() as {
      isAdmin: boolean
      role: string | null
      adminData: AdminRecord | null
    }
  } catch (err) {
    console.error('Admin check error:', err)
    return { isAdmin: false, role: null, adminData: null }
  }
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { isAdmin } = await checkIsAdmin()
  return isAdmin
}

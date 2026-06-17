import { createClient } from '@supabase/supabase-js'

type AuthedUser = {
  authed: true
  userId: string
  email: string
  name?: string
}

type GuestUser = {
  authed: false
}

function bearerToken(req: Request) {
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length).trim() || null
}

export async function getAuthedUserOrGuest(req: Request): Promise<AuthedUser | GuestUser> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) return { authed: false }

  const token = bearerToken(req)
  if (!token) return { authed: false }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  const { data, error } = await supabase.auth.getUser(token)
  const user = data.user

  if (error || !user?.id || !user.email) return { authed: false }

  return {
    authed: true,
    userId: user.id,
    email: user.email.toLowerCase(),
    name: typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : undefined,
  }
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const SUPABASE_AUTH_STORAGE_KEY = 'sb-xayiwdexbykvbvcgudne-auth-token'

let supabaseInstance: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: SUPABASE_AUTH_STORAGE_KEY,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  })

  return supabaseInstance
}

export const supabase = typeof window !== 'undefined'
  ? getSupabase()
  : createClient(supabaseUrl, supabaseAnonKey)

export default supabase

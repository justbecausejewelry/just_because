import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const SUPABASE_AUTH_STORAGE_KEY = 'sb-xayiwdexbykvbvcgudne-auth-token'

let supabaseInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
      storageKey: SUPABASE_AUTH_STORAGE_KEY,
    },
  })

  return supabaseInstance
}

export const getSupabase = getSupabaseClient

export const supabase = getSupabaseClient()

export default supabase

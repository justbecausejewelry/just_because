import { getSupabase } from '@/lib/supabase'

export const supabaseAuth = getSupabase()

export async function signIn(email: string, password: string) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabaseAuth.auth.signOut()
  return { error }
}

export async function getUser() {
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()
  return user
}

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  })
  return { data, error }
}

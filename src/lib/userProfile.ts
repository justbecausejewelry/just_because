import { supabase } from '@/lib/supabase'

export type UserProfile = {
  id?: string
  userId: string
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  ringSize?: string | null
  birthday?: string | null
  anniversary?: string | null
  createdAt?: string
  updatedAt?: string
}

export async function getOrCreateProfile(userId: string, email: string, name?: string) {
  const { data: existing } = await supabase
    .from('UserProfile')
    .select('*')
    .eq('userId', userId)
    .maybeSingle()

  if (existing) return existing as UserProfile

  const nameParts = (name || email.split('@')[0]).split(' ')
  const { data: newProfile } = await supabase
    .from('UserProfile')
    .insert({
      userId,
      email,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
    })
    .select()
    .single()

  return newProfile as UserProfile | null
}

export async function updateProfile(userId: string, updates: {
  firstName?: string
  lastName?: string
  phone?: string
  ringSize?: string
  birthday?: string
  anniversary?: string
}) {
  const { data, error } = await supabase
    .from('UserProfile')
    .update({ ...updates, updatedAt: new Date().toISOString() })
    .eq('userId', userId)
    .select()
    .single()

  return { data: data as UserProfile | null, error }
}

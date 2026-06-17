'use client'

import { Dispatch, SetStateAction, useEffect, useRef } from 'react'

type SetState<T> = Dispatch<SetStateAction<T>>

export function useFormPersistence<T>(
  key: string,
  state: T,
  setState: SetState<T>,
  options: { debounceMs?: number; enabled?: boolean } = {}
) {
  const debounceMs = options.debounceMs ?? 300
  const enabled = options.enabled ?? true
  const hydrated = useRef(false)

  useEffect(() => {
    if (!enabled || hydrated.current || typeof window === 'undefined') return
    hydrated.current = true

    try {
      const raw = window.sessionStorage.getItem(key)
      if (!raw) return

      const parsed = JSON.parse(raw) as Partial<T>
      setState((current) => ({ ...current, ...parsed }))
    } catch {
      window.sessionStorage.removeItem(key)
    }
  }, [enabled, key, setState])

  useEffect(() => {
    if (!enabled || !hydrated.current || typeof window === 'undefined') return

    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(key, JSON.stringify(state))
    }, debounceMs)

    return () => window.clearTimeout(timer)
  }, [debounceMs, enabled, key, state])

  return () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(key)
    }
  }
}

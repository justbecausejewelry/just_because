'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export interface WishlistItem {
  id: string
  productSlug: string
  productTitle: string
  productImage: string
  basePrice: number
  category: string
  productType: string
}

type WishlistRow = {
  id: string
  productId?: string | null
  productSlug?: string | null
  productTitle?: string | null
  productImage?: string | null
  basePrice?: number | null
  category?: string | null
  productType?: string | null
}

interface WishlistContextType {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => Promise<boolean>
  removeItem: (slug: string) => Promise<boolean>
  toggleItem: (item: WishlistItem) => Promise<boolean>
  isWishlisted: (slug: string) => boolean
  itemCount: number
  loading: boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

function mapWishlistRow(row: WishlistRow): WishlistItem {
  return {
    id: row.productId || row.id,
    productSlug: row.productSlug || '',
    productTitle: row.productTitle || '',
    productImage: row.productImage || '',
    basePrice: row.basePrice || 0,
    category: row.category || row.productType || 'saved',
    productType: row.productType || row.category || '',
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setItems([])
        setUserId(null)
      } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        setUserId(session?.user?.id || null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) {
      setItems([])
      return
    }

    const loadWishlist = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('Wishlist')
          .select('*')
          .eq('userId', userId)
          .order('createdAt', { ascending: false })

        if (error) {
          console.error('[wishlist] fetch failed:', error)
          return
        }

        setItems(((data || []) as WishlistRow[]).map(mapWishlistRow).filter((item) => item.productSlug))
      } finally {
        setLoading(false)
      }
    }

    void loadWishlist()
  }, [userId])

  const addItem = async (item: WishlistItem) => {
    if (!userId) {
      console.error('[wishlist] add blocked: missing authenticated user')
      return false
    }

    const { data: existing, error: existingError } = await supabase
      .from('Wishlist')
      .select('id')
      .eq('userId', userId)
      .eq('productId', item.id)
      .maybeSingle()

    if (existingError) {
      console.error('[wishlist] existing lookup failed:', existingError)
      return false
    }

    if (existing) {
      setItems((prev) => {
        if (prev.find((saved) => saved.productSlug === item.productSlug)) return prev
        return [item, ...prev]
      })
      return true
    }

    setItems((prev) => {
      if (prev.find((existing) => existing.productSlug === item.productSlug)) {
        return prev
      }
      return [item, ...prev]
    })

    const { error } = await supabase
      .from('Wishlist')
      .insert({
        userId,
        productId: item.id,
        productSlug: item.productSlug,
        productTitle: item.productTitle,
        productImage: item.productImage,
        basePrice: item.basePrice,
      })

    if (error) {
      console.error('[wishlist] insert failed:', error)
      setItems((prev) => prev.filter((existing) => existing.productSlug !== item.productSlug))
      return false
    }

    return true
  }

  const removeItem = async (slug: string) => {
    if (!userId) {
      console.error('[wishlist] remove blocked: missing authenticated user')
      return false
    }

    const previous = items
    setItems((prev) => prev.filter((item) => item.productSlug !== slug))

    const { error } = await supabase
      .from('Wishlist')
      .delete()
      .eq('userId', userId)
      .eq('productSlug', slug)

    if (error) {
      console.error('[wishlist] delete failed:', error)
      setItems(previous)
      return false
    }

    return true
  }

  const toggleItem = async (item: WishlistItem) => {
    const exists = items.find((existing) => existing.productSlug === item.productSlug)
    if (exists) {
      return removeItem(item.productSlug)
    }

    return addItem(item)
  }

  const isWishlisted = (slug: string) =>
    items.some((item) => item.productSlug === slug)

  return (
    <WishlistContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        toggleItem,
        isWishlisted,
        itemCount: items.length,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider')
  }
  return context
}

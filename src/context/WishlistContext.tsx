'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface WishlistItem {
  id: string
  productSlug: string
  productTitle: string
  productImage: string
  basePrice: number
  category: string
  productType: string
}

interface WishlistContextType {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (slug: string) => void
  toggleItem: (item: WishlistItem) => void
  isWishlisted: (slug: string) => boolean
  itemCount: number
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('just-because-wishlist')
    if (saved) {
      try {
        setItems(JSON.parse(saved) as WishlistItem[])
      } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('just-because-wishlist', JSON.stringify(items))
  }, [items])

  const addItem = (item: WishlistItem) => {
    setItems((prev) => {
      if (prev.find((existing) => existing.productSlug === item.productSlug)) {
        return prev
      }
      return [...prev, item]
    })
  }

  const removeItem = (slug: string) => {
    setItems((prev) => prev.filter((item) => item.productSlug !== slug))
  }

  const toggleItem = (item: WishlistItem) => {
    setItems((prev) => {
      if (prev.find((existing) => existing.productSlug === item.productSlug)) {
        return prev.filter((existing) => existing.productSlug !== item.productSlug)
      }
      return [...prev, item]
    })
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

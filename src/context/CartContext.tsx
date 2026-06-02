'use client'

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { supabase } from '@/lib/supabase'
import {
  addToCart as addGuestCartItem,
  clearCart as clearGuestCart,
  getCart as getGuestCart,
  removeFromCart as removeGuestCartItem,
  updateCartQuantity as updateGuestCartQuantity,
  type CartItem as GuestCartItem,
} from '@/lib/cart'

export interface CartItem {
  id: string
  productId: string
  productSlug: string
  productTitle: string
  productImage: string
  selectedMetal: string
  selectedCarat: number
  selectedShape: string
  selectedColor?: string
  selectedClarity?: string
  ringSize?: string
  engraving?: string
  quantity: number
  unitPrice: number
  priceBreakdown: {
    base: number
    metal: number
    carat: number
    shape: number
    color: number
    clarity: number
  }
}

type CartRow = {
  id: string
  productId: string
  productSlug: string
  productTitle: string
  productImage?: string | null
  selectedMetal: string
  selectedCarat: number
  selectedShape: string
  selectedColor?: string | null
  selectedClarity?: string | null
  ringSize?: string | null
  engraving?: string | null
  quantity: number
  unitPrice: number
  priceBreakdown?: CartItem['priceBreakdown'] | null
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateQuantity: (id: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  openCart: () => void
  closeCart: () => void
  isMiniCartOpen: boolean
  itemCount: number
  subtotal: number
  loading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function defaultBreakdown(): CartItem['priceBreakdown'] {
  return {
    base: 0,
    metal: 0,
    carat: 0,
    shape: 0,
    color: 0,
    clarity: 0,
  }
}

function mapCartRow(row: CartRow): CartItem {
  return {
    id: row.id,
    productId: row.productId,
    productSlug: row.productSlug,
    productTitle: row.productTitle,
    productImage: row.productImage || '',
    selectedMetal: row.selectedMetal,
    selectedCarat: row.selectedCarat,
    selectedShape: row.selectedShape,
    selectedColor: row.selectedColor || undefined,
    selectedClarity: row.selectedClarity || undefined,
    ringSize: row.ringSize || undefined,
    engraving: row.engraving || undefined,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    priceBreakdown: row.priceBreakdown || defaultBreakdown(),
  }
}

function guestToCartItem(item: GuestCartItem): CartItem {
  return {
    id: item.id,
    productId: item.productId || item.id,
    productSlug: item.productSlug || item.id,
    productTitle: item.productTitle || item.name,
    productImage: item.productImage || item.imageUrl,
    selectedMetal: item.selectedMetal || (item.type === 'diamond' ? 'Loose diamond' : 'White Gold'),
    selectedCarat: item.selectedCarat ?? item.carat ?? 0,
    selectedShape: item.selectedShape || item.shape || 'Round',
    selectedColor: item.selectedColor,
    selectedClarity: item.selectedClarity,
    ringSize: item.ringSize,
    engraving: item.engraving,
    quantity: item.quantity,
    unitPrice: item.unitPrice ?? item.price,
    priceBreakdown: item.priceBreakdown || defaultBreakdown(),
  }
}

function cartItemToGuestItem(item: Omit<CartItem, 'id'>, id: string): GuestCartItem {
  const isDiamond = item.selectedMetal === 'Loose diamond'

  return {
    id,
    type: isDiamond ? 'diamond' : 'product',
    name: item.productTitle,
    price: item.unitPrice,
    imageUrl: item.productImage,
    carat: item.selectedCarat,
    shape: item.selectedShape,
    quantity: item.quantity,
    productId: item.productId,
    productSlug: item.productSlug,
    productTitle: item.productTitle,
    productImage: item.productImage,
    selectedMetal: item.selectedMetal,
    selectedCarat: item.selectedCarat,
    selectedShape: item.selectedShape,
    selectedColor: item.selectedColor,
    selectedClarity: item.selectedClarity,
    ringSize: item.ringSize,
    engraving: item.engraving,
    unitPrice: item.unitPrice,
    priceBreakdown: item.priceBreakdown,
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false)

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
      const loadGuestCart = () => {
        setItems(getGuestCart().map(guestToCartItem))
      }

      loadGuestCart()
      window.addEventListener('cart-updated', loadGuestCart)
      return () => window.removeEventListener('cart-updated', loadGuestCart)
    }

    let cancelled = false

    const loadCart = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('UserCart')
          .select('*')
          .eq('userId', userId)
          .order('createdAt', { ascending: false })

        if (!cancelled && !error && data) {
          setItems((data as CartRow[]).map(mapCartRow))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadCart()

    return () => {
      cancelled = true
    }
  }, [userId])

  const addItem = async (item: Omit<CartItem, 'id'>) => {
    if (!userId) {
      const guestId = `${item.productId}-${item.selectedMetal}-${item.selectedCarat}-${item.selectedShape}-${item.selectedColor || ''}-${item.selectedClarity || ''}-${item.ringSize || ''}-${item.engraving || ''}`
      addGuestCartItem(cartItemToGuestItem(item, guestId))
      setItems(getGuestCart().map(guestToCartItem))
      setIsMiniCartOpen(true)
      window.setTimeout(() => setIsMiniCartOpen(false), 3000)
      return
    }

    const { data, error } = await supabase
      .from('UserCart')
      .insert({
        userId,
        productId: item.productId,
        productSlug: item.productSlug,
        productTitle: item.productTitle,
        productImage: item.productImage,
        selectedMetal: item.selectedMetal,
        selectedCarat: item.selectedCarat,
        selectedShape: item.selectedShape,
        selectedColor: item.selectedColor,
        selectedClarity: item.selectedClarity,
        ringSize: item.ringSize,
        engraving: item.engraving,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        priceBreakdown: item.priceBreakdown,
      })
      .select()
      .single()

    if (!error && data) {
      setItems((prev) => [...prev, { ...item, id: (data as CartRow).id }])
      setIsMiniCartOpen(true)
      window.setTimeout(() => setIsMiniCartOpen(false), 3000)
    }
  }

  const removeItem = async (id: string) => {
    if (!userId) {
      removeGuestCartItem(id)
      setItems(getGuestCart().map(guestToCartItem))
      return
    }

    const previous = items
    setItems((prev) => prev.filter((item) => item.id !== id))

    const { error } = await supabase
      .from('UserCart')
      .delete()
      .eq('id', id)
      .eq('userId', userId)

    if (error) {
      setItems(previous)
    }
  }

  const updateQuantity = async (id: string, quantity: number) => {
    if (!userId) {
      updateGuestCartQuantity(id, quantity)
      setItems(getGuestCart().map(guestToCartItem))
      return
    }

    if (quantity <= 0) {
      await removeItem(id)
      return
    }

    const previous = items
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    )

    const { error } = await supabase
      .from('UserCart')
      .update({ quantity })
      .eq('id', id)
      .eq('userId', userId)

    if (error) {
      setItems(previous)
    }
  }

  const clearCart = async () => {
    setItems([])
    if (!userId) {
      clearGuestCart()
      return
    }

    await supabase
      .from('UserCart')
      .delete()
      .eq('userId', userId)
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  )

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart: () => setIsMiniCartOpen(true),
    closeCart: () => setIsMiniCartOpen(false),
    isMiniCartOpen,
    itemCount,
    subtotal,
    loading,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

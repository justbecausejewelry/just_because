import { supabase } from '@/lib/supabase'

export type CartPriceBreakdown = {
  base: number
  metal: number
  carat: number
  shape: number
  color: number
  clarity: number
}

export type CartItem = {
  id: string
  type: 'diamond' | 'product'
  name: string
  price: number
  imageUrl: string
  carat?: number
  shape?: string
  quantity: number
  productId?: string
  productSlug?: string
  productTitle?: string
  productImage?: string
  selectedMetal?: string
  selectedCarat?: number
  selectedShape?: string
  selectedColor?: string
  selectedClarity?: string
  ringSize?: string
  engraving?: string
  unitPrice?: number
  priceBreakdown?: CartPriceBreakdown
}

const CART_KEY = 'jb_cart'
const SESSION_KEY = 'jb_session'

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server'

  let sessionId = sessionStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = `sess_${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem(SESSION_KEY, sessionId)
  }

  return sessionId
}

export async function trackCartEvent(
  action: 'added' | 'removed' | 'purchased' | 'abandoned',
  item: CartItem,
  userId?: string | null
) {
  try {
    const { error } = await supabase.from('cart_events').insert({
      user_id: userId || null,
      session_id: getSessionId(),
      item_type: item.type,
      item_name: item.name,
      item_price: item.unitPrice ?? item.price,
      product_id: item.type === 'product' ? item.productId || item.id : null,
      diamond_id: item.type === 'diamond' ? item.productId || item.id : null,
      action,
    })
    if (error) {
      console.error('Analytics error:', error)
    }
  } catch (error) {
    console.error('Analytics error:', error)
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('cart-updated'))
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]') as unknown
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : []
  } catch {
    return []
  }
}

export function addToCart(item: CartItem) {
  const existing = getCart()
  const idx = existing.findIndex((cartItem) => cartItem.id === item.id)

  if (idx >= 0) {
    existing[idx] = {
      ...existing[idx],
      quantity: existing[idx].quantity + 1,
    }
  } else {
    existing.push({ ...item, quantity: item.quantity || 1 })
  }

  saveCart(existing)
  void trackCartEvent('added', item)
}

export function updateCartQuantity(id: string, quantity: number) {
  const existing = getCart()
  const currentItem = existing.find((item) => item.id === id)
  const nextItems = quantity <= 0
    ? existing.filter((item) => item.id !== id)
    : existing.map((item) => (item.id === id ? { ...item, quantity } : item))

  saveCart(nextItems)
  if (quantity <= 0 && currentItem) {
    void trackCartEvent('removed', currentItem)
  }
}

export function removeFromCart(id: string) {
  const existing = getCart()
  const removedItem = existing.find((item) => item.id === id)
  saveCart(existing.filter((item) => item.id !== id))
  if (removedItem) {
    void trackCartEvent('removed', removedItem)
  }
}

export function clearCart() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CART_KEY)
  window.dispatchEvent(new Event('cart-updated'))
}

function isCartItem(item: unknown): item is CartItem {
  if (!item || typeof item !== 'object') return false
  const candidate = item as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    (candidate.type === 'diamond' || candidate.type === 'product') &&
    typeof candidate.name === 'string' &&
    typeof candidate.price === 'number' &&
    typeof candidate.imageUrl === 'string' &&
    typeof candidate.quantity === 'number'
  )
}

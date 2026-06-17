import { supabase } from '@/lib/supabase'
import { LOOSE_DIAMOND_VALUE, normalizeMetalSelection } from '@/config/productOptions'

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
  priceAtAdd?: number
  addedAt?: string
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
    const lockedPrice = getLockedPrice(item)
    const { error } = await supabase.from('cart_events').insert({
      user_id: userId || null,
      session_id: getSessionId(),
      item_type: item.type,
      item_name: item.name,
      item_price: lockedPrice ?? 0,
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
    return Array.isArray(parsed)
      ? parsed.map(normalizeCartItem).filter((item): item is CartItem => Boolean(item))
      : []
  } catch {
    return []
  }
}

export function addToCart(item: CartItem) {
  const normalizedItem = normalizeCartItem(item)
  if (!normalizedItem) return

  const existing = getCart()
  const idx = existing.findIndex((cartItem) => cartItem.id === normalizedItem.id)

  if (idx >= 0) {
    existing[idx] = {
      ...existing[idx],
      quantity: existing[idx].quantity + 1,
    }
  } else {
    existing.push({ ...normalizedItem, quantity: normalizedItem.quantity || 1 })
  }

  saveCart(existing)
  void trackCartEvent('added', normalizedItem)
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

function getLockedPrice(item: CartItem): number | null {
  const price = item.priceAtAdd ?? item.unitPrice ?? item.price
  return Number.isFinite(price) ? price : null
}

function normalizeCartItem(item: unknown): CartItem | null {
  if (!item || typeof item !== 'object') return null
  const candidate = item as Record<string, unknown>
  const lockedPrice = [
    candidate.priceAtAdd,
    candidate.unitPrice,
    candidate.price,
  ].find((value): value is number => typeof value === 'number' && Number.isFinite(value))

  if (
    typeof candidate.id !== 'string' ||
    (candidate.type !== 'diamond' && candidate.type !== 'product') ||
    typeof candidate.name !== 'string' ||
    typeof candidate.imageUrl !== 'string' ||
    typeof candidate.quantity !== 'number' ||
    !Number.isFinite(candidate.quantity) ||
    lockedPrice === undefined
  ) {
    return null
  }

  return {
    ...(candidate as CartItem),
    selectedMetal: normalizeMetalSelection(candidate.selectedMetal as string | undefined) || (candidate.type === 'diamond' ? LOOSE_DIAMOND_VALUE : 'white_gold'),
    price: lockedPrice,
    unitPrice: lockedPrice,
    priceAtAdd: lockedPrice,
    addedAt: typeof candidate.addedAt === 'string' ? candidate.addedAt : new Date().toISOString(),
  }
}

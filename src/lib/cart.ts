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
}

export function updateCartQuantity(id: string, quantity: number) {
  const existing = getCart()
  const nextItems = quantity <= 0
    ? existing.filter((item) => item.id !== id)
    : existing.map((item) => (item.id === id ? { ...item, quantity } : item))

  saveCart(nextItems)
}

export function removeFromCart(id: string) {
  saveCart(getCart().filter((item) => item.id !== id))
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

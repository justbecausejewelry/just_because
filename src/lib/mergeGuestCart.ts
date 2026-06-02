import { supabase } from '@/lib/supabase'
import type { CartItem as GuestCartItem, CartPriceBreakdown } from '@/lib/cart'

type UserCartRow = {
  id: string
  productId: string
  productSlug: string
  selectedMetal: string
  selectedCarat: number
  selectedShape: string
  selectedColor?: string | null
  selectedClarity?: string | null
  ringSize?: string | null
  engraving?: string | null
  quantity: number
}

function defaultBreakdown(): CartPriceBreakdown {
  return {
    base: 0,
    metal: 0,
    carat: 0,
    shape: 0,
    color: 0,
    clarity: 0,
  }
}

function guestToUserCartPayload(userId: string, item: GuestCartItem) {
  return {
    userId,
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

function sameCartSelection(row: UserCartRow, item: GuestCartItem) {
  return (
    row.productId === (item.productId || item.id) &&
    row.productSlug === (item.productSlug || item.id) &&
    row.selectedMetal === (item.selectedMetal || (item.type === 'diamond' ? 'Loose diamond' : 'White Gold')) &&
    Number(row.selectedCarat) === Number(item.selectedCarat ?? item.carat ?? 0) &&
    row.selectedShape === (item.selectedShape || item.shape || 'Round') &&
    (row.selectedColor || '') === (item.selectedColor || '') &&
    (row.selectedClarity || '') === (item.selectedClarity || '') &&
    (row.ringSize || '') === (item.ringSize || '') &&
    (row.engraving || '') === (item.engraving || '')
  )
}

export async function mergeGuestCart(userId: string, guestCart: GuestCartItem[]) {
  if (!guestCart.length) return

  const { data, error } = await supabase
    .from('UserCart')
    .select('id, productId, productSlug, selectedMetal, selectedCarat, selectedShape, selectedColor, selectedClarity, ringSize, engraving, quantity')
    .eq('userId', userId)

  if (error) {
    throw error
  }

  const existingRows = (data || []) as UserCartRow[]

  for (const item of guestCart) {
    const existing = existingRows.find((row) => sameCartSelection(row, item))

    if (existing) {
      const quantity = existing.quantity + item.quantity
      const { error: updateError } = await supabase
        .from('UserCart')
        .update({ quantity })
        .eq('id', existing.id)
        .eq('userId', userId)

      if (updateError) throw updateError
      existing.quantity = quantity
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('UserCart')
        .insert(guestToUserCartPayload(userId, item))
        .select('id, productId, productSlug, selectedMetal, selectedCarat, selectedShape, selectedColor, selectedClarity, ringSize, engraving, quantity')
        .single()

      if (insertError) throw insertError
      if (inserted) existingRows.push(inserted as UserCartRow)
    }
  }
}

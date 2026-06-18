import { LOOSE_DIAMOND_LABEL, LOOSE_DIAMOND_VALUE, METALS, METAL_VALUES, getMetalLabel, isMetalValue, metalMatches, normalizeMetalSelection, normalizeMetalValue } from '@/config/metals'
import type { MetalValue } from '@/config/metals'

export { LOOSE_DIAMOND_LABEL, LOOSE_DIAMOND_VALUE, METALS, METAL_VALUES, getMetalLabel, isMetalValue, metalMatches, normalizeMetalSelection, normalizeMetalValue }
export type { MetalValue }

export const DIAMOND_SHAPES = [
  { value: 'round', label: 'Round' },
  { value: 'oval', label: 'Oval' },
  { value: 'cushion', label: 'Cushion' },
  { value: 'princess', label: 'Princess' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'pear', label: 'Pear' },
  { value: 'marquise', label: 'Marquise' },
  { value: 'heart', label: 'Heart' },
  { value: 'radiant', label: 'Radiant' },
  { value: 'asscher', label: 'Asscher' },
] as const

export const DIAMOND_COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J'] as const
export const DIAMOND_CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'] as const

export const DIAMOND_CUTS = [
  { value: 'ideal', label: 'Ideal' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'very_good', label: 'Very Good' },
  { value: 'good', label: 'Good' },
] as const

export const PRODUCT_CATEGORIES = [
  { value: 'engagement', label: 'Engagement' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'rings', label: 'Rings' },
  { value: 'earrings', label: 'Earrings' },
  { value: 'necklaces', label: 'Necklaces' },
  { value: 'bracelets', label: 'Bracelets' },
  { value: 'diamonds', label: 'Diamonds' },
  { value: 'gifts', label: 'Gifts' },
] as const

export const PRODUCT_SUBCATEGORIES = [
  { value: 'engagement_ring', label: 'Engagement Ring' },
  { value: 'wedding_ring', label: 'Wedding Ring' },
  { value: 'ring', label: 'Ring' },
  { value: 'stud', label: 'Stud' },
  { value: 'earring', label: 'Earring' },
  { value: 'bracelet', label: 'Bracelet' },
  { value: 'tennis_bracelet', label: 'Tennis Bracelet' },
  { value: 'necklace', label: 'Necklace' },
  { value: 'tennis_necklace', label: 'Tennis Necklace' },
  { value: 'pendant', label: 'Pendant' },
] as const

export type DiamondShapeValue = (typeof DIAMOND_SHAPES)[number]['value']

export function normalizeToken(value: string | null | undefined) {
  return (value || '').trim().toLowerCase().replace(/^(10k|14k|18k)_?/, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

export function normalizeDiamondShape(value: string | null | undefined): DiamondShapeValue | undefined {
  const normalized = normalizeToken(value)
  return DIAMOND_SHAPES.find((shape) => shape.value === normalized)?.value
}

export function getDiamondShapeLabel(value: string | null | undefined) {
  const normalized = normalizeDiamondShape(value)
  return DIAMOND_SHAPES.find((shape) => shape.value === normalized)?.label ?? value ?? ''
}

export function normalizeDiamondColor(value: string | null | undefined) {
  const normalized = (value || '').trim().toUpperCase()
  return DIAMOND_COLORS.includes(normalized as (typeof DIAMOND_COLORS)[number]) ? normalized : undefined
}

export function normalizeDiamondClarity(value: string | null | undefined) {
  const normalized = (value || '').trim().toUpperCase()
  return DIAMOND_CLARITIES.includes(normalized as (typeof DIAMOND_CLARITIES)[number]) ? normalized : undefined
}

export function normalizeDiamondCut(value: string | null | undefined) {
  const normalized = normalizeToken(value)
  return DIAMOND_CUTS.find((cut) => cut.value === normalized)?.value
}

export function getDiamondCutLabel(value: string | null | undefined) {
  const normalized = normalizeDiamondCut(value)
  return DIAMOND_CUTS.find((cut) => cut.value === normalized)?.label ?? value ?? ''
}

export function normalizeProductCategory(value: string | null | undefined) {
  const normalized = normalizeToken(value)
  return PRODUCT_CATEGORIES.find((category) => category.value === normalized)?.value
}

export function normalizeProductSubcategory(value: string | null | undefined) {
  const normalized = normalizeToken(value)
  return PRODUCT_SUBCATEGORIES.find((category) => category.value === normalized)?.value
}

export function optionMatches(left: string | null | undefined, right: string | null | undefined) {
  return Boolean(normalizeToken(left) && normalizeToken(left) === normalizeToken(right))
}

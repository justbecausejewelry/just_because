export const METALS = [
  { value: 'white_gold', label: '14K White Gold', hex: '#E8E8E8' },
  { value: 'yellow_gold', label: '14K Yellow Gold', hex: '#C9A961' },
  { value: 'rose_gold', label: '14K Rose Gold', hex: '#E8B4A0' },
  { value: 'platinum', label: 'Platinum', hex: '#F0F0F0' },
] as const

export const LOOSE_DIAMOND_VALUE = 'loose_diamond'
export const LOOSE_DIAMOND_LABEL = 'Loose diamond'

export type MetalValue = (typeof METALS)[number]['value']

export const METAL_VALUES = METALS.map((metal) => metal.value)

const legacyMetalAliases: Record<string, MetalValue> = {
  '14k white gold': 'white_gold',
  '18k white gold': 'white_gold',
  'white gold': 'white_gold',
  white_gold: 'white_gold',
  '14k yellow gold': 'yellow_gold',
  '18k yellow gold': 'yellow_gold',
  'yellow gold': 'yellow_gold',
  yellow_gold: 'yellow_gold',
  '14k rose gold': 'rose_gold',
  '18k rose gold': 'rose_gold',
  'rose gold': 'rose_gold',
  rose_gold: 'rose_gold',
  platinum: 'platinum',
}

function optionKey(value: string) {
  return value.trim().toLowerCase().replace(/[-\s]+/g, '_')
}

export function normalizeMetalValue(value: string | null | undefined): MetalValue | undefined {
  if (!value) return undefined

  const trimmed = value.trim()
  const key = optionKey(trimmed)
  const lower = trimmed.toLowerCase()

  return legacyMetalAliases[key] || legacyMetalAliases[lower]
}

export function normalizeMetalSelection(value: string | null | undefined) {
  if (!value) return undefined
  if (value.trim().toLowerCase().replace(/[-\s]+/g, '_') === LOOSE_DIAMOND_VALUE) {
    return LOOSE_DIAMOND_VALUE
  }
  if (value.trim().toLowerCase() === LOOSE_DIAMOND_LABEL.toLowerCase()) {
    return LOOSE_DIAMOND_VALUE
  }
  return normalizeMetalValue(value)
}

export function isMetalValue(value: string | null | undefined): value is MetalValue {
  return Boolean(value && METAL_VALUES.includes(value as MetalValue))
}

export function getMetalLabel(value: string | null | undefined) {
  if (!value) return ''
  if (normalizeMetalSelection(value) === LOOSE_DIAMOND_VALUE) return LOOSE_DIAMOND_LABEL
  const normalized = normalizeMetalValue(value)
  return METALS.find((metal) => metal.value === normalized)?.label ?? value
}

export function metalMatches(left: string | null | undefined, right: string | null | undefined) {
  const normalizedLeft = normalizeMetalSelection(left)
  const normalizedRight = normalizeMetalSelection(right)
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight)
}

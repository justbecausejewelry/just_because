export const RING_SETTING_STYLES = [
  'Solitaire',
  'Halo',
  'Hidden Halo',
  'Pave',
  'Three Stone',
  'Side Stone',
  'Vintage',
  'Modern',
  'Band',
] as const

export const RING_SETTING_METALS = ['White Gold', 'Yellow Gold', 'Rose Gold', 'Platinum'] as const

export const RING_SETTING_SHAPES = [
  'Round',
  'Oval',
  'Princess',
  'Cushion',
  'Emerald',
  'Pear',
  'Marquise',
  'Heart',
  'Radiant',
  'Asscher',
] as const

export type RingSettingStyle = (typeof RING_SETTING_STYLES)[number]
export type RingSettingMetal = (typeof RING_SETTING_METALS)[number]
export type RingSettingShape = (typeof RING_SETTING_SHAPES)[number]

export type RingSettingImages = Partial<Record<'white_gold' | 'yellow_gold' | 'rose_gold' | 'platinum', string>>

export type RingSetting = {
  id: string
  name: string
  style: string | null
  description: string | null
  basePrice: number
  metals: string[]
  compatibleShapes: string[]
  imageUrl: string | null
  images: RingSettingImages
  isActive: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export type RingSettingPayload = {
  name: string
  style: string
  description: string | null
  basePrice: number
  metals: string[]
  compatibleShapes: string[]
  imageUrl: string | null
  images: RingSettingImages
  isActive: boolean
  sortOrder: number
}

export function formatRingSettingMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

export function normalizeImageKey(metal: string) {
  return metal.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') as keyof RingSettingImages
}

export function normalizeRingSetting(row: Partial<RingSetting>): RingSetting {
  const images = row.images && typeof row.images === 'object' && !Array.isArray(row.images)
    ? row.images
    : {}

  return {
    basePrice: Number(row.basePrice || 0),
    compatibleShapes: Array.isArray(row.compatibleShapes) ? row.compatibleShapes : [],
    createdAt: row.createdAt,
    description: row.description || null,
    id: row.id || '',
    imageUrl: row.imageUrl || null,
    images,
    isActive: row.isActive !== false,
    metals: Array.isArray(row.metals) && row.metals.length ? row.metals : [...RING_SETTING_METALS],
    name: row.name || '',
    sortOrder: Number(row.sortOrder || 0),
    style: row.style || null,
    updatedAt: row.updatedAt,
  }
}

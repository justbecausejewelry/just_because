import { DIAMOND_IMAGE_MAP } from '@/lib/diamondImages'

export type Diamond = {
  id: string
  shape: string
  carat: number
  color: string
  clarity: string
  cut: string
  price: number
  polish?: string | null
  symmetry?: string | null
  fluorescence?: string | null
  depthPercent: string
  tablePercent: string
  measurements: string
  certificateNumber: string
  certificateType?: string | null
  certificateUrl?: string | null
  img: string
}

export const SHAPE_DATA = [
  {
    name: 'Round',
    img: DIAMOND_IMAGE_MAP.Round,
  },
  {
    name: 'Oval',
    img: DIAMOND_IMAGE_MAP.Oval,
  },
  {
    name: 'Emerald',
    img: DIAMOND_IMAGE_MAP.Emerald,
  },
  {
    name: 'Cushion',
    img: DIAMOND_IMAGE_MAP.Cushion,
  },
  {
    name: 'Princess',
    img: DIAMOND_IMAGE_MAP.Princess,
  },
  {
    name: 'Pear',
    img: DIAMOND_IMAGE_MAP.Pear,
  },
  {
    name: 'Marquise',
    img: DIAMOND_IMAGE_MAP.Marquise,
  },
  {
    name: 'Heart',
    img: DIAMOND_IMAGE_MAP.Heart,
  },
  {
    name: 'Radiant',
    img: DIAMOND_IMAGE_MAP.Radiant,
  },
  {
    name: 'Asscher',
    img: DIAMOND_IMAGE_MAP.Asscher,
  },
] as const

function seededValue(index: number, salt: number) {
  const value = Math.sin(index * 9301 + salt * 49297) * 233280
  return value - Math.floor(value)
}

function pick<T>(items: T[], index: number, salt: number) {
  return items[Math.floor(seededValue(index, salt) * items.length)]
}

export function generateDiamonds() {
  const shapes = ['Round', 'Oval', 'Emerald', 'Cushion', 'Princess', 'Pear', 'Marquise', 'Heart']
  const colors = ['D', 'E', 'F', 'G', 'H', 'I']
  const clarities = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1']
  const cuts = ['Ideal', 'Excellent', 'Very Good', 'Good']
  const diamonds: Diamond[] = []

  for (let i = 0; i < 48; i += 1) {
    const carat = Number((0.5 + seededValue(i + 1, 11) * 3.5).toFixed(2))
    const color = pick(colors, i + 1, 21)
    const clarity = pick(clarities, i + 1, 31)
    const cut = pick(cuts, i + 1, 41)
    const shape = pick(shapes, i + 1, 51)
    const basePrice = carat * 800
    const colorMultiplier = color === 'D' ? 1.5 : color === 'E' ? 1.35 : color === 'F' ? 1.2 : color === 'G' ? 1 : 0.85
    const clarityMultiplier = clarity === 'IF' ? 1.6 : clarity === 'VVS1' ? 1.4 : clarity === 'VVS2' ? 1.25 : clarity === 'VS1' ? 1.1 : clarity === 'VS2' ? 1 : 0.88
    const price = Math.round(basePrice * colorMultiplier * clarityMultiplier)
    const shapeImage = SHAPE_DATA.find((item) => item.name === shape)?.img || SHAPE_DATA[0].img

    diamonds.push({
      id: `DIA-${String(i + 1).padStart(4, '0')}`,
      shape,
      carat,
      color,
      clarity,
      cut,
      price,
      polish: 'Excellent',
      symmetry: 'Excellent',
      fluorescence: 'None',
      depthPercent: (58 + seededValue(i + 1, 61) * 8).toFixed(1),
      tablePercent: (54 + seededValue(i + 1, 71) * 10).toFixed(0),
      measurements: `${(carat * 4.5 + 2).toFixed(2)} x ${(carat * 4.35 + 2).toFixed(2)} x ${(carat * 2.8 + 1.5).toFixed(2)}`,
      certificateNumber: `IGI${Math.floor(seededValue(i + 1, 81) * 9000000 + 1000000)}`,
      certificateType: 'IGI',
      certificateUrl: null,
      img: shapeImage,
    })
  }

  return diamonds.sort((a, b) => a.price - b.price)
}

export const ALL_DIAMONDS = generateDiamonds()

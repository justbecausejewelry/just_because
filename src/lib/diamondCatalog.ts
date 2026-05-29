export type Diamond = {
  id: string
  shape: string
  carat: number
  color: string
  clarity: string
  cut: string
  price: number
  depth: string
  table: string
  measurements: string
  igi: string
  img: string
}

export const SHAPE_DATA = [
  {
    name: 'Round',
    img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&q=90',
  },
  {
    name: 'Oval',
    img: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&q=90',
  },
  {
    name: 'Emerald',
    img: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400&q=90',
  },
  {
    name: 'Cushion',
    img: 'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=400&q=90',
  },
  {
    name: 'Princess',
    img: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400&q=90',
  },
  {
    name: 'Pear',
    img: 'https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=400&q=90',
  },
  {
    name: 'Marquise',
    img: 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=400&q=90',
  },
  {
    name: 'Heart',
    img: 'https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=400&q=90',
  },
  {
    name: 'Radiant',
    img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=90',
  },
  {
    name: 'Asscher',
    img: 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=400&q=90',
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
      depth: (58 + seededValue(i + 1, 61) * 8).toFixed(1),
      table: (54 + seededValue(i + 1, 71) * 10).toFixed(0),
      measurements: `${(carat * 4.5 + 2).toFixed(2)} x ${(carat * 4.35 + 2).toFixed(2)} x ${(carat * 2.8 + 1.5).toFixed(2)}`,
      igi: `IGI${Math.floor(seededValue(i + 1, 81) * 9000000 + 1000000)}`,
      img: shapeImage,
    })
  }

  return diamonds.sort((a, b) => a.price - b.price)
}

export const ALL_DIAMONDS = generateDiamonds()

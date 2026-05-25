export type Product = {
  id: string
  name: string
  slug: string
  category: 'rings' | 'bracelets' | 'necklaces' | 'earrings'
  description: string
  basePrice: number
  metalPrices: {
    'White Gold': number
    'Yellow Gold': number
    'Rose Gold': number
    'Platinum': number
  }
  caratOptions: {
    carat: number
    priceAdd: number
  }[]
  shapes: string[]
  images: string[]
  badge?: string
  isActive: boolean
  metal: string
  carat: number
  rating: number
  reviews: number
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Solis',
    slug: 'solis',
    category: 'rings',
    description:
      'A timeless round brilliant solitaire set in 18k recycled gold. Clean lines, extraordinary brilliance.',
    basePrice: 4200,
    metalPrices: {
      'White Gold': 0,
      'Yellow Gold': 200,
      'Rose Gold': 150,
      Platinum: 800,
    },
    caratOptions: [
      { carat: 6, priceAdd: 0 },
      { carat: 9, priceAdd: 3000 },
      { carat: 12, priceAdd: 7000 },
    ],
    shapes: ['Round'],
    images: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=90',
    ],
    badge: 'NEW',
    isActive: true,
    metal: 'White Gold',
    carat: 6,
    rating: 4.9,
    reviews: 284,
  },
  {
    id: '2',
    name: 'Vela',
    slug: 'vela',
    category: 'rings',
    description:
      'An elegant oval cut that elongates the finger. Timeless and distinctly modern.',
    basePrice: 4200,
    metalPrices: {
      'White Gold': 0,
      'Yellow Gold': 200,
      'Rose Gold': 150,
      Platinum: 800,
    },
    caratOptions: [
      { carat: 6, priceAdd: 0 },
      { carat: 9, priceAdd: 3000 },
      { carat: 12, priceAdd: 7000 },
    ],
    shapes: ['Oval'],
    images: [
      'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800&q=90',
    ],
    badge: undefined,
    isActive: true,
    metal: 'Yellow Gold',
    carat: 9,
    rating: 4.8,
    reviews: 156,
  },
  {
    id: '3',
    name: 'Lumi',
    slug: 'lumi',
    category: 'rings',
    description:
      'A soft cushion cut with a romantic halo. Warm, brilliant, unforgettable.',
    basePrice: 3900,
    metalPrices: {
      'White Gold': 0,
      'Yellow Gold': 200,
      'Rose Gold': 150,
      Platinum: 800,
    },
    caratOptions: [
      { carat: 6, priceAdd: 0 },
      { carat: 9, priceAdd: 3000 },
      { carat: 12, priceAdd: 7000 },
    ],
    shapes: ['Cushion'],
    images: [
      'https://images.unsplash.com/photo-1573408301185-9519f94815b1?w=800&q=90',
    ],
    badge: undefined,
    isActive: true,
    metal: 'Rose Gold',
    carat: 6,
    rating: 4.9,
    reviews: 203,
  },
  {
    id: '4',
    name: 'Orla',
    slug: 'orla',
    category: 'rings',
    description:
      'A striking marquise cut for those who wear their confidence visibly.',
    basePrice: 4100,
    metalPrices: {
      'White Gold': 0,
      'Yellow Gold': 200,
      'Rose Gold': 150,
      Platinum: 800,
    },
    caratOptions: [
      { carat: 6, priceAdd: 0 },
      { carat: 9, priceAdd: 3000 },
      { carat: 12, priceAdd: 7000 },
    ],
    shapes: ['Marquise'],
    images: [
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=90',
    ],
    badge: undefined,
    isActive: true,
    metal: 'Platinum',
    carat: 12,
    rating: 4.7,
    reviews: 89,
  },
  {
    id: '5',
    name: 'Coeur',
    slug: 'coeur',
    category: 'rings',
    description:
      'A heart cut diamond. Because sometimes love needs no metaphor.',
    basePrice: 3800,
    metalPrices: {
      'White Gold': 0,
      'Yellow Gold': 200,
      'Rose Gold': 150,
      Platinum: 800,
    },
    caratOptions: [
      { carat: 6, priceAdd: 0 },
      { carat: 9, priceAdd: 3000 },
      { carat: 12, priceAdd: 7000 },
    ],
    shapes: ['Heart'],
    images: [
      'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=800&q=90',
    ],
    badge: 'NEW',
    isActive: true,
    metal: 'Rose Gold',
    carat: 9,
    rating: 4.9,
    reviews: 312,
  },
  {
    id: '6',
    name: 'Etoile',
    slug: 'etoile',
    category: 'rings',
    description: 'A three-stone setting representing past, present, and future.',
    basePrice: 5200,
    metalPrices: {
      'White Gold': 0,
      'Yellow Gold': 200,
      'Rose Gold': 150,
      Platinum: 800,
    },
    caratOptions: [
      { carat: 6, priceAdd: 0 },
      { carat: 9, priceAdd: 3000 },
      { carat: 12, priceAdd: 7000 },
    ],
    shapes: ['Round', 'Oval'],
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=90',
    ],
    badge: undefined,
    isActive: true,
    metal: 'White Gold',
    carat: 6,
    rating: 4.8,
    reviews: 178,
  },
  {
    id: '7',
    name: 'Continuum',
    slug: 'continuum',
    category: 'bracelets',
    description: 'An endless tennis bracelet. Diamonds that move with you.',
    basePrice: 3200,
    metalPrices: {
      'White Gold': 0,
      'Yellow Gold': 200,
      'Rose Gold': 150,
      Platinum: 800,
    },
    caratOptions: [
      { carat: 6, priceAdd: 0 },
      { carat: 9, priceAdd: 3000 },
      { carat: 12, priceAdd: 7000 },
    ],
    shapes: ['Round'],
    images: [
      'https://images.unsplash.com/photo-1573408301185-9519f94815b1?w=800&q=90',
    ],
    badge: undefined,
    isActive: true,
    metal: 'White Gold',
    carat: 6,
    rating: 4.9,
    reviews: 145,
  },
  {
    id: '8',
    name: 'Stella',
    slug: 'stella',
    category: 'bracelets',
    description: 'A delicate bangle with pavé diamonds. Subtle every day luxury.',
    basePrice: 1800,
    metalPrices: {
      'White Gold': 0,
      'Yellow Gold': 200,
      'Rose Gold': 150,
      Platinum: 800,
    },
    caratOptions: [
      { carat: 6, priceAdd: 0 },
      { carat: 9, priceAdd: 3000 },
      { carat: 12, priceAdd: 7000 },
    ],
    shapes: ['Round'],
    images: [
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=90',
    ],
    badge: undefined,
    isActive: true,
    metal: 'Yellow Gold',
    carat: 6,
    rating: 4.7,
    reviews: 92,
  },
  {
    id: '9',
    name: 'Solène',
    slug: 'solene',
    category: 'necklaces',
    description: 'A single diamond pendant on a fine gold chain. Worn forever.',
    basePrice: 1400,
    metalPrices: {
      'White Gold': 0,
      'Yellow Gold': 200,
      'Rose Gold': 150,
      Platinum: 800,
    },
    caratOptions: [
      { carat: 6, priceAdd: 0 },
      { carat: 9, priceAdd: 3000 },
      { carat: 12, priceAdd: 7000 },
    ],
    shapes: ['Round', 'Oval', 'Pear'],
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=90',
    ],
    badge: undefined,
    isActive: true,
    metal: 'Yellow Gold',
    carat: 6,
    rating: 4.8,
    reviews: 267,
  },
  {
    id: '10',
    name: 'Constellation',
    slug: 'constellation',
    category: 'necklaces',
    description:
      'A cluster of diamonds arranged like stars. Worn for no reason at all.',
    basePrice: 2800,
    metalPrices: {
      'White Gold': 0,
      'Yellow Gold': 200,
      'Rose Gold': 150,
      Platinum: 800,
    },
    caratOptions: [
      { carat: 6, priceAdd: 0 },
      { carat: 9, priceAdd: 3000 },
      { carat: 12, priceAdd: 7000 },
    ],
    shapes: ['Round'],
    images: [
      'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800&q=90',
    ],
    badge: 'NEW',
    isActive: true,
    metal: 'White Gold',
    carat: 6,
    rating: 4.9,
    reviews: 134,
  },
  {
    id: '11',
    name: 'Astra',
    slug: 'astra',
    category: 'rings',
    description: 'A pavé diamond band. Worn alone or stacked.',
    basePrice: 1800,
    metalPrices: {
      'White Gold': 0,
      'Yellow Gold': 200,
      'Rose Gold': 150,
      Platinum: 800,
    },
    caratOptions: [
      { carat: 6, priceAdd: 0 },
      { carat: 9, priceAdd: 3000 },
      { carat: 12, priceAdd: 7000 },
    ],
    shapes: ['Round'],
    images: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=90',
    ],
    badge: undefined,
    isActive: true,
    metal: 'Rose Gold',
    carat: 6,
    rating: 4.7,
    reviews: 198,
  },
  {
    id: '12',
    name: 'Soleil',
    slug: 'soleil',
    category: 'rings',
    description: 'An emerald cut for those who appreciate clean architecture.',
    basePrice: 4600,
    metalPrices: {
      'White Gold': 0,
      'Yellow Gold': 200,
      'Rose Gold': 150,
      Platinum: 800,
    },
    caratOptions: [
      { carat: 6, priceAdd: 0 },
      { carat: 9, priceAdd: 3000 },
      { carat: 12, priceAdd: 7000 },
    ],
    shapes: ['Emerald'],
    images: [
      'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=800&q=90',
    ],
    badge: undefined,
    isActive: true,
    metal: 'White Gold',
    carat: 6,
    rating: 4.8,
    reviews: 211,
  },
]

export function getProductsByCategory(category: string) {
  return products.filter((product) => product.category === category && product.isActive)
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug)
}

export function getFeaturedProducts(limit = 5) {
  return products.filter((product) => product.isActive).slice(0, limit)
}

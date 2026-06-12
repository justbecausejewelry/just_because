import { loadEnvFile } from 'node:process'

loadEnvFile('.env.local')

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ringMetalPricing = {
  'White Gold': { enabled: true, modifier: 0 },
  'Yellow Gold': { enabled: true, modifier: 200 },
  'Rose Gold': { enabled: true, modifier: 150 },
  Platinum: { enabled: true, modifier: 800 },
}
const ringCaratPricing = {
  '6': { enabled: true, modifier: 0 },
  '9': { enabled: true, modifier: 3000 },
  '12': { enabled: true, modifier: 7000 },
}

const weddingClassicCaratPricing = {
  '6': { enabled: true, modifier: 0 },
  '9': { enabled: true, modifier: 2000 },
}

const ringShapePricing = {
  Round: { enabled: true, modifier: 0 },
  Oval: { enabled: true, modifier: 200 },
  Cushion: { enabled: true, modifier: 150 },
  Princess: { enabled: true, modifier: 100 },
  Emerald: { enabled: true, modifier: 180 },
  Pear: { enabled: true, modifier: 160 },
  Marquise: { enabled: true, modifier: 140 },
  Heart: { enabled: true, modifier: 120 },
  Asscher: { enabled: true, modifier: 170 },
}

const ringColorPricing = {
  D: { enabled: true, modifier: 800 },
  E: { enabled: true, modifier: 500 },
  F: { enabled: true, modifier: 300 },
  G: { enabled: true, modifier: 0 },
  H: { enabled: true, modifier: -200 },
  I: { enabled: true, modifier: -400 },
}

const ringClarityPricing = {
  IF: { enabled: true, modifier: 600 },
  VVS1: { enabled: true, modifier: 400 },
  VVS2: { enabled: true, modifier: 200 },
  VS1: { enabled: true, modifier: 0 },
  VS2: { enabled: true, modifier: -150 },
}

const cutPricing = {
  Excellent: { enabled: true, modifier: 0 },
  'Very Good': { enabled: true, modifier: -100 },
  Good: { enabled: true, modifier: -200 },
}

const ringOptions = {
  availableMetals: ['White Gold', 'Yellow Gold', 'Rose Gold', 'Platinum'],
  availableCarats: [6, 9, 12],
  availableShapes: [
    'Round',
    'Oval',
    'Cushion',
    'Princess',
    'Emerald',
    'Pear',
    'Marquise',
    'Heart',
    'Asscher',
  ],
  availableColors: ['D', 'E', 'F', 'G', 'H', 'I'],
  availableClarities: ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2'],
  availableCuts: ['Excellent', 'Very Good', 'Good'],
  availableSizes: ['4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9'],
  engravingAllowed: true,
  engravingMaxChars: 20,
}

const defaultPricing = {
  metalPricing: ringMetalPricing,
  caratPricing: ringCaratPricing,
  shapePricing: ringShapePricing,
  colorPricing: ringColorPricing,
  clarityPricing: ringClarityPricing,
  cutPricing,
}

const productImages = [
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=900&q=90',
  'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=900&q=90',
  'https://images.unsplash.com/photo-1573408301185-9519f94815b1?w=900&q=90',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=900&q=90',
]

type SeedProduct = {
  slug: string
  sku: string
  productType: string
  category: string
  title: string
  description: string
  basePrice: number
  isFeatured: boolean
  isNewArrival?: boolean
  tags?: string[]
  availableCarats?: number[]
  availableShapes?: string[]
  caratPricing?: typeof ringCaratPricing | typeof weddingClassicCaratPricing
}

const engagementRings: SeedProduct[] = [
  {
    slug: 'solis-solitaire',
    sku: 'JB-ENG-001',
    productType: 'engagement_ring',
    category: 'solitaire',
    title: 'Solis Solitaire',
    description:
      'A timeless solitaire that lets the diamond speak for itself. Clean lines, endless light.',
    basePrice: 2800,
    isFeatured: true,
    isNewArrival: true,
    tags: ['bestseller', 'solitaire', 'classic'],
  },
  {
    slug: 'vela-pave',
    sku: 'JB-ENG-002',
    productType: 'engagement_ring',
    category: 'pave',
    title: 'Vela Pavé',
    description:
      'A river of diamonds follows the band, making every angle a new moment of brilliance.',
    basePrice: 3200,
    isFeatured: true,
    tags: ['pave', 'sparkle', 'popular'],
  },
  {
    slug: 'lumi-halo',
    sku: 'JB-ENG-003',
    productType: 'engagement_ring',
    category: 'halo',
    title: 'Lumi Halo',
    description: 'A crown of light surrounds your center stone, doubling its presence.',
    basePrice: 3600,
    isFeatured: true,
    tags: ['halo', 'glamour'],
  },
  {
    slug: 'orla-three-stone',
    sku: 'JB-ENG-004',
    productType: 'engagement_ring',
    category: 'three_stone',
    title: 'Orla Three Stone',
    description: 'Past, present, and future. Three stones, one story.',
    basePrice: 4200,
    isFeatured: true,
    tags: ['three-stone', 'meaningful'],
  },
  {
    slug: 'coeur-hidden-halo',
    sku: 'JB-ENG-005',
    productType: 'engagement_ring',
    category: 'hidden_halo',
    title: 'Coeur Hidden Halo',
    description:
      'The secret is what makes it special. A hidden halo reveals itself only to those who look closely.',
    basePrice: 3900,
    isFeatured: false,
    tags: ['hidden-halo', 'unique'],
  },
  {
    slug: 'etoile-channel-set',
    sku: 'JB-ENG-006',
    productType: 'engagement_ring',
    category: 'channel_set',
    title: 'Etoile Channel Set',
    description:
      'Diamonds nestled in a sleek channel of gold. Modern, architectural, forever.',
    basePrice: 3100,
    isFeatured: false,
    tags: ['channel-set', 'modern'],
  },
  {
    slug: 'astra-side-stone',
    sku: 'JB-ENG-007',
    productType: 'engagement_ring',
    category: 'side_stone',
    title: 'Astra Side Stone',
    description: 'Flanked by brilliant side stones, your center diamond commands attention.',
    basePrice: 2950,
    isFeatured: false,
    tags: ['side-stone', 'classic'],
  },
  {
    slug: 'soleil-custom',
    sku: 'JB-ENG-008',
    productType: 'engagement_ring',
    category: 'custom',
    title: 'Soleil Custom',
    description: 'Your vision, realized. Start with Soleil and make it entirely your own.',
    basePrice: 5000,
    isFeatured: false,
    tags: ['custom', 'bespoke'],
  },
]

const weddingRings: SeedProduct[] = [
  {
    slug: 'continuum-classic',
    sku: 'JB-WED-001',
    productType: 'wedding_ring',
    category: 'classic',
    title: 'Continuum Classic Band',
    description: 'Simple. Pure. Eternal.',
    basePrice: 1200,
    isFeatured: false,
    caratPricing: weddingClassicCaratPricing,
    availableCarats: [6, 9],
    availableShapes: ['Round'],
  },
  {
    slug: 'stella-diamond-band',
    sku: 'JB-WED-002',
    productType: 'wedding_ring',
    category: 'diamond',
    title: 'Stella Diamond Band',
    description: 'A full circle of light. Every step you take, it sparkles.',
    basePrice: 1800,
    isFeatured: true,
  },
  {
    slug: 'ligne-eternity',
    sku: 'JB-WED-003',
    productType: 'wedding_ring',
    category: 'eternity',
    title: 'Ligne Eternity Band',
    description: 'Diamonds without end. For love without end.',
    basePrice: 2400,
    isFeatured: false,
  },
  {
    slug: 'aurora-stackable',
    sku: 'JB-WED-004',
    productType: 'wedding_ring',
    category: 'stackable',
    title: 'Aurora Stackable',
    description: 'Mix, match, layer. Your love story, your stack.',
    basePrice: 980,
    isFeatured: false,
  },
  {
    slug: 'maritime-curved',
    sku: 'JB-WED-005',
    productType: 'wedding_ring',
    category: 'curved',
    title: 'Maritime Curved Band',
    description: 'Contoured to hug your engagement ring perfectly.',
    basePrice: 1400,
    isFeatured: false,
  },
]

const necklaces: SeedProduct[] = [
  {
    slug: 'solene-pendant',
    sku: 'JB-NECK-001',
    title: 'Solène Pendant',
    productType: 'necklace',
    category: 'pendant',
    basePrice: 980,
    isFeatured: true,
    description: 'A single diamond, suspended in light. Worn close to the heart.',
  },
  {
    slug: 'petit-diamant-choker',
    sku: 'JB-NECK-002',
    title: 'Petit Diamant Choker',
    productType: 'necklace',
    category: 'choker',
    basePrice: 1400,
    isFeatured: false,
    description:
      'Delicate diamonds trace the collarbone. Understated and unforgettable.',
  },
  {
    slug: 'constellation-tennis',
    sku: 'JB-NECK-003',
    title: 'Constellation Tennis Necklace',
    productType: 'necklace',
    category: 'tennis',
    basePrice: 2800,
    isFeatured: true,
    description:
      'An unbroken line of diamonds. Like a constellation worn around your neck.',
  },
  {
    slug: 'drop-of-light',
    sku: 'JB-NECK-004',
    title: 'Drop of Light',
    productType: 'necklace',
    category: 'pendant',
    basePrice: 1650,
    isFeatured: false,
    description: 'A pear-shaped diamond falls like a single drop of light.',
  },
]

const bracelets: SeedProduct[] = [
  {
    slug: 'continuum-tennis-bracelet',
    sku: 'JB-BRAC-001',
    title: 'Continuum Tennis Bracelet',
    productType: 'bracelet',
    category: 'tennis',
    basePrice: 2200,
    isFeatured: true,
    description:
      'The classic tennis bracelet, elevated. Every diamond lab-grown, every one perfect.',
  },
  {
    slug: 'stella-bangle',
    sku: 'JB-BRAC-002',
    title: 'Stella Bangle',
    productType: 'bracelet',
    category: 'bangle',
    basePrice: 1600,
    isFeatured: false,
    description: 'A solid arc of gold, kissed with diamonds.',
  },
  {
    slug: 'ligne-cuff',
    sku: 'JB-BRAC-003',
    title: 'Ligne Cuff',
    productType: 'bracelet',
    category: 'cuff',
    basePrice: 1900,
    isFeatured: false,
    description: 'Architectural and bold. A cuff that makes a statement.',
  },
]

const earrings: SeedProduct[] = [
  {
    slug: 'solis-studs',
    sku: 'JB-EAR-001',
    title: 'Solis Studs',
    productType: 'earring',
    category: 'stud',
    basePrice: 1200,
    isFeatured: true,
    description: "Two perfect diamonds. The most versatile pieces you'll ever own.",
  },
  {
    slug: 'etoile-drop-earrings',
    sku: 'JB-EAR-002',
    title: 'Etoile Drop Earrings',
    productType: 'earring',
    category: 'drop',
    basePrice: 1800,
    isFeatured: false,
    description: 'Diamonds that dance with every movement. Designed to be noticed.',
  },
]

const diamonds = [
  ['Round', 0.5, 'D', 'IF', 'Excellent', 800],
  ['Round', 0.75, 'E', 'VVS1', 'Excellent', 1400],
  ['Round', 1.0, 'F', 'VVS2', 'Excellent', 2400],
  ['Round', 1.5, 'G', 'VS1', 'Very Good', 4200],
  ['Round', 2.0, 'H', 'VS2', 'Excellent', 6800],
  ['Oval', 1.0, 'D', 'VVS1', 'Excellent', 2800],
  ['Oval', 1.75, 'F', 'VS1', 'Very Good', 5400],
  ['Oval', 2.5, 'G', 'VS2', 'Excellent', 9300],
  ['Cushion', 1.2, 'E', 'VVS2', 'Excellent', 3100],
  ['Cushion', 2.0, 'H', 'VS1', 'Very Good', 6200],
  ['Princess', 0.9, 'F', 'VS1', 'Excellent', 2100],
  ['Princess', 1.8, 'D', 'VVS2', 'Excellent', 6500],
  ['Emerald', 1.4, 'E', 'VVS1', 'Excellent', 4800],
  ['Emerald', 3.0, 'G', 'VS2', 'Very Good', 12000],
  ['Pear', 1.6, 'H', 'VS1', 'Excellent', 5000],
] as const

const reviews = [
  {
    productSlug: 'solis-solitaire',
    rating: 5,
    customerName: 'Priya M.',
    title: 'Just because it was Tuesday',
    comment:
      'I bought this for myself on a Tuesday. No occasion. Just because. Best decision of the year. The diamond is absolutely flawless.',
  },
  {
    productSlug: 'solis-solitaire',
    rating: 5,
    customerName: 'Sarah K.',
    title: 'Better than my old one',
    comment:
      'The packaging alone made me cry. The diamond outshines my old mined one and it cost half the price. I feel good about this choice.',
  },
  {
    productSlug: 'lumi-halo',
    rating: 5,
    customerName: 'Aaron L.',
    title: 'She said yes',
    comment:
      'Customer service walked me through every step. It felt less like e-commerce and more like a friend helping me choose.',
  },
  {
    productSlug: 'vela-pave',
    rating: 4,
    customerName: 'Ananya R.',
    title: 'Stunning piece',
    comment:
      'The pavé setting catches light from every angle. I get compliments every single day.',
  },
  {
    productSlug: 'orla-three-stone',
    rating: 5,
    customerName: 'James T.',
    title: 'Worth every penny',
    comment:
      'For our 10th anniversary. She recognized the meaning immediately — past, present, future. Perfect.',
  },
  {
    productSlug: 'constellation-tennis',
    rating: 5,
    customerName: 'Meera S.',
    title: 'A dream necklace',
    comment:
      'I have wanted a tennis necklace for years. This one is beyond what I imagined.',
  },
  {
    productSlug: 'continuum-tennis-bracelet',
    rating: 5,
    customerName: 'Lisa W.',
    title: 'Classic and perfect',
    comment:
      'Exactly what a tennis bracelet should be. Timeless, elegant, and guilt-free.',
  },
  {
    productSlug: 'solis-studs',
    rating: 4,
    customerName: 'Kavya P.',
    title: 'My everyday diamonds',
    comment: 'Been wearing these every day for 3 months. Still perfect. Worth every rupee.',
  },
]

function addMonths(months: number) {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return date
}

function productData(product: SeedProduct, index: number) {
  return {
    sku: product.sku,
    productType: product.productType,
    category: product.category,
    title: product.title,
    description: product.description,
    basePrice: product.basePrice,
    ...defaultPricing,
    caratPricing: product.caratPricing ?? ringCaratPricing,
    availableMetals: ringOptions.availableMetals,
    availableCarats: product.availableCarats ?? ringOptions.availableCarats,
    availableShapes: product.availableShapes ?? ringOptions.availableShapes,
    availableColors: ringOptions.availableColors,
    availableClarities: ringOptions.availableClarities,
    availableCuts: ringOptions.availableCuts,
    availableSizes: ringOptions.availableSizes,
    engravingAllowed: ringOptions.engravingAllowed,
    engravingMaxChars: ringOptions.engravingMaxChars,
    images: [productImages[index % productImages.length]],
    hoverImage: productImages[(index + 1) % productImages.length],
    videos: [],
    certificateUrl: null,
    modelUrl: null,
    isActive: true,
    isFeatured: product.isFeatured,
    isNewArrival: product.isNewArrival ?? false,
    internalNotes: null,
    tags: product.tags ?? [product.category, product.productType],
    sortOrder: index,
    seoTitle: `${product.title} | Just Because`,
    seoDescription: product.description,
    slug: product.slug,
  }
}

async function clearData() {
  console.log('Clearing existing data...')
  await prisma.review.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.priceLog.deleteMany()
  await prisma.discountCode.deleteMany()
  await prisma.diamond.deleteMany()
  await prisma.adminUser.deleteMany()
  await prisma.product.deleteMany()
}

async function seedProducts() {
  console.log('Seeding products...')
  const allProducts = [
    ...engagementRings,
    ...weddingRings,
    ...necklaces,
    ...bracelets,
    ...earrings,
  ]

  for (const [index, product] of allProducts.entries()) {
    const data = productData(product, index)
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: data,
      create: data,
    })
  }

  console.log(`Seeded ${allProducts.length} products.`)
}

async function seedDiamonds() {
  console.log('Seeding diamonds...')

  for (const [index, diamond] of diamonds.entries()) {
    const [shape, carat, color, clarity, cut, price] = diamond
    const sku = `JB-DIA-${String(index + 1).padStart(3, '0')}`

    await prisma.diamond.upsert({
      where: { sku },
      update: {
        shape,
        carat,
        color,
        clarity,
        cut,
        price,
        isAvailable: true,
        isLabGrown: true,
      },
      create: {
        sku,
        shape,
        carat,
        color,
        clarity,
        cut,
        polish: index % 3 === 0 ? 'Excellent' : 'Very Good',
        symmetry: index % 2 === 0 ? 'Excellent' : 'Very Good',
        fluorescence: index % 4 === 0 ? 'None' : 'Faint',
        certificateNumber: `IGI-2026-${String(482000 + index).padStart(6, '0')}`,
        certificateType: 'IGI',
        certificateUrl: `https://certificates.justbecause.local/IGI-2026-${String(482000 + index).padStart(6, '0')}`,
        price,
        isAvailable: true,
        isLabGrown: true,
        videoUrl: null,
        imageUrl: productImages[index % productImages.length],
        measurements: `${(5.1 + index * 0.2).toFixed(1)} x ${(5.0 + index * 0.2).toFixed(1)} x ${(3.1 + index * 0.12).toFixed(1)} mm`,
        depthPercent: 60 + (index % 5),
        tablePercent: 55 + (index % 6),
      },
    })
  }

  console.log(`Seeded ${diamonds.length} diamonds.`)
}

async function seedReviews() {
  console.log('Seeding reviews...')

  for (const review of reviews) {
    const product = await prisma.product.findUnique({
      where: { slug: review.productSlug },
    })

    if (!product) {
      throw new Error(`Product not found for review: ${review.productSlug}`)
    }

    await prisma.review.create({
      data: {
        productId: product.id,
        customerName: review.customerName,
        customerEmail: null,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        isVerified: true,
        isApproved: true,
        isHidden: false,
      },
    })
  }

  console.log(`Seeded ${reviews.length} reviews.`)
}

async function seedDiscountCodes() {
  console.log('Seeding discount codes...')

  const discountCodes = [
    {
      code: 'WELCOME30',
      type: 'percentage',
      value: 30,
      minOrderAmt: 0,
      maxUses: 1000,
      isActive: true,
      expiresAt: addMonths(3),
    },
    {
      code: 'JUSTBECAUSE',
      type: 'fixed',
      value: 500,
      minOrderAmt: 3000,
      maxUses: 500,
      isActive: true,
      expiresAt: addMonths(6),
    },
    {
      code: 'LABGROWN15',
      type: 'percentage',
      value: 15,
      minOrderAmt: 1000,
      maxUses: 2000,
      isActive: true,
      expiresAt: addMonths(2),
    },
  ]

  for (const code of discountCodes) {
    await prisma.discountCode.upsert({
      where: { code: code.code },
      update: code,
      create: code,
    })
  }

  console.log(`Seeded ${discountCodes.length} discount codes.`)
}

async function seedAdminUser() {
  console.log('Seeding admin user...')
  await prisma.adminUser.upsert({
    where: { email: 'admin@justbecause.com' },
    update: {
      name: 'Ujjwal Bana',
      role: 'super_admin',
    },
    create: {
      email: 'admin@justbecause.com',
      name: 'Ujjwal Bana',
      role: 'super_admin',
    },
  })
  console.log('Seeded admin user.')
}

async function main() {
  await clearData()
  await seedProducts()
  await seedDiamonds()
  await seedReviews()
  await seedDiscountCodes()
  await seedAdminUser()
  console.log('Database seed complete.')
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

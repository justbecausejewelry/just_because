import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function clearData() {
  console.log('Clearing existing data...')
  await supabase.from('Review').delete().neq('id', '')
  await supabase.from('CartItem').delete().neq('id', '')
  await supabase.from('OrderItem').delete().neq('id', '')
  await supabase.from('Order').delete().neq('id', '')
  await supabase.from('PriceLog').delete().neq('id', '')
  await supabase.from('DiscountCode').delete().neq('id', '')
  await supabase.from('Diamond').delete().neq('id', '')
  await supabase.from('AdminUser').delete().neq('id', '')
  await supabase.from('Product').delete().neq('id', '')
  console.log('✓ Cleared all data')
}

const ringMetalPricing = {
  'White Gold': { enabled: true, modifier: 0 },
  'Yellow Gold': { enabled: true, modifier: 200 },
  'Rose Gold': { enabled: true, modifier: 150 },
  'Platinum': { enabled: true, modifier: 800 },
}

const ringCaratPricing = {
  '6': { enabled: true, modifier: 0 },
  '9': { enabled: true, modifier: 3000 },
  '12': { enabled: true, modifier: 7000 },
}

const ringShapePricing = {
  'Round': { enabled: true, modifier: 0 },
  'Oval': { enabled: true, modifier: 200 },
  'Cushion': { enabled: true, modifier: 150 },
  'Princess': { enabled: true, modifier: 100 },
  'Emerald': { enabled: true, modifier: 180 },
  'Pear': { enabled: true, modifier: 160 },
  'Marquise': { enabled: true, modifier: 140 },
  'Heart': { enabled: true, modifier: 120 },
  'Asscher': { enabled: true, modifier: 170 },
}

const ringColorPricing = {
  'D': { enabled: true, modifier: 800 },
  'E': { enabled: true, modifier: 500 },
  'F': { enabled: true, modifier: 300 },
  'G': { enabled: true, modifier: 0 },
  'H': { enabled: true, modifier: -200 },
  'I': { enabled: true, modifier: -400 },
}

const ringClarityPricing = {
  'IF': { enabled: true, modifier: 600 },
  'VVS1': { enabled: true, modifier: 400 },
  'VVS2': { enabled: true, modifier: 200 },
  'VS1': { enabled: true, modifier: 0 },
  'VS2': { enabled: true, modifier: -150 },
}

const engagementRingBase = {
  productType: 'engagement_ring',
  availableMetals: ['White Gold', 'Yellow Gold', 'Rose Gold', 'Platinum'],
  availableCarats: [6, 9, 12],
  availableShapes: ['Round', 'Oval', 'Cushion', 'Princess', 'Emerald', 'Pear', 'Marquise', 'Heart', 'Asscher'],
  availableColors: ['D', 'E', 'F', 'G', 'H', 'I'],
  availableClarities: ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2'],
  availableSizes: ['4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9'],
  engravingAllowed: true,
  engravingMaxChars: 20,
  metalPricing: ringMetalPricing,
  caratPricing: ringCaratPricing,
  shapePricing: ringShapePricing,
  colorPricing: ringColorPricing,
  clarityPricing: ringClarityPricing,
  cutPricing: {},
  isActive: true,
  images: [],
  videos: [],
  tags: [],
  sortOrder: 0,
}

async function seedProducts() {
  console.log('Seeding products...')

  const products = [
    // ENGAGEMENT RINGS
    {
      ...engagementRingBase,
      sku: 'JB-ENG-001',
      slug: 'solis-solitaire',
      category: 'solitaire',
      title: 'Solis Solitaire',
      description: 'A timeless solitaire that lets the diamond speak for itself. Clean lines, endless light.',
      basePrice: 2800,
      isFeatured: true,
      isNewArrival: true,
      tags: ['bestseller', 'solitaire', 'classic'],
    },
    {
      ...engagementRingBase,
      sku: 'JB-ENG-002',
      slug: 'vela-pave',
      category: 'pave',
      title: 'Vela Pavé',
      description: 'A river of diamonds follows the band, making every angle a new moment of brilliance.',
      basePrice: 3200,
      isFeatured: true,
      isNewArrival: false,
      tags: ['pave', 'sparkle', 'popular'],
    },
    {
      ...engagementRingBase,
      sku: 'JB-ENG-003',
      slug: 'lumi-halo',
      category: 'halo',
      title: 'Lumi Halo',
      description: 'A crown of light surrounds your center stone, doubling its presence.',
      basePrice: 3600,
      isFeatured: true,
      isNewArrival: false,
      tags: ['halo', 'glamour'],
    },
    {
      ...engagementRingBase,
      sku: 'JB-ENG-004',
      slug: 'orla-three-stone',
      category: 'three_stone',
      title: 'Orla Three Stone',
      description: 'Past, present, and future. Three stones, one story.',
      basePrice: 4200,
      isFeatured: true,
      isNewArrival: false,
      tags: ['three-stone', 'meaningful'],
    },
    {
      ...engagementRingBase,
      sku: 'JB-ENG-005',
      slug: 'coeur-hidden-halo',
      category: 'hidden_halo',
      title: 'Coeur Hidden Halo',
      description: 'The secret is what makes it special.',
      basePrice: 3900,
      isFeatured: false,
      isNewArrival: false,
      tags: ['hidden-halo', 'unique'],
    },
    {
      ...engagementRingBase,
      sku: 'JB-ENG-006',
      slug: 'etoile-channel-set',
      category: 'channel_set',
      title: 'Etoile Channel Set',
      description: 'Diamonds nestled in a sleek channel of gold. Modern, architectural, forever.',
      basePrice: 3100,
      isFeatured: false,
      isNewArrival: false,
      tags: ['channel-set', 'modern'],
    },
    {
      ...engagementRingBase,
      sku: 'JB-ENG-007',
      slug: 'astra-side-stone',
      category: 'side_stone',
      title: 'Astra Side Stone',
      description: 'Flanked by brilliant side stones, your center diamond commands attention.',
      basePrice: 2950,
      isFeatured: false,
      isNewArrival: false,
      tags: ['side-stone', 'classic'],
    },
    {
      ...engagementRingBase,
      sku: 'JB-ENG-008',
      slug: 'soleil-custom',
      category: 'custom',
      title: 'Soleil Custom',
      description: 'Your vision, realized. Start with Soleil and make it entirely your own.',
      basePrice: 5000,
      isFeatured: false,
      isNewArrival: false,
      tags: ['custom', 'bespoke'],
    },
    // WEDDING RINGS
    {
      ...engagementRingBase,
      sku: 'JB-WED-001',
      slug: 'continuum-classic',
      productType: 'wedding_ring',
      category: 'classic',
      title: 'Continuum Classic Band',
      description: 'Simple. Pure. Eternal.',
      basePrice: 1200,
      isFeatured: false,
      isNewArrival: false,
      availableCarats: [6, 9],
      tags: ['classic', 'wedding'],
    },
    {
      ...engagementRingBase,
      sku: 'JB-WED-002',
      slug: 'stella-diamond-band',
      productType: 'wedding_ring',
      category: 'diamond',
      title: 'Stella Diamond Band',
      description: 'A full circle of light. Every step you take, it sparkles.',
      basePrice: 1800,
      isFeatured: true,
      isNewArrival: false,
      tags: ['diamond-band', 'wedding'],
    },
    {
      ...engagementRingBase,
      sku: 'JB-WED-003',
      slug: 'ligne-eternity',
      productType: 'wedding_ring',
      category: 'eternity',
      title: 'Ligne Eternity Band',
      description: 'Diamonds without end. For love without end.',
      basePrice: 2400,
      isFeatured: false,
      isNewArrival: false,
      tags: ['eternity', 'wedding'],
    },
    // NECKLACES
    {
      ...engagementRingBase,
      sku: 'JB-NECK-001',
      slug: 'solene-pendant',
      productType: 'necklace',
      category: 'pendant',
      title: 'Solène Pendant',
      description: 'A single diamond, suspended in light. Worn close to the heart.',
      basePrice: 980,
      isFeatured: true,
      isNewArrival: false,
      tags: ['pendant', 'necklace'],
    },
    {
      ...engagementRingBase,
      sku: 'JB-NECK-002',
      slug: 'constellation-tennis-necklace',
      productType: 'necklace',
      category: 'tennis',
      title: 'Constellation Tennis Necklace',
      description: 'An unbroken line of diamonds. Like a constellation worn around your neck.',
      basePrice: 2800,
      isFeatured: true,
      isNewArrival: false,
      tags: ['tennis', 'necklace'],
    },
    // BRACELETS
    {
      ...engagementRingBase,
      sku: 'JB-BRAC-001',
      slug: 'continuum-tennis-bracelet',
      productType: 'bracelet',
      category: 'tennis',
      title: 'Continuum Tennis Bracelet',
      description: 'The classic tennis bracelet, elevated.',
      basePrice: 2200,
      isFeatured: true,
      isNewArrival: false,
      tags: ['tennis', 'bracelet'],
    },
    {
      ...engagementRingBase,
      sku: 'JB-BRAC-002',
      slug: 'stella-bangle',
      productType: 'bracelet',
      category: 'bangle',
      title: 'Stella Bangle',
      description: 'A solid arc of gold, kissed with diamonds.',
      basePrice: 1600,
      isFeatured: false,
      isNewArrival: false,
      tags: ['bangle', 'bracelet'],
    },
    // EARRINGS
    {
      ...engagementRingBase,
      sku: 'JB-EAR-001',
      slug: 'solis-studs',
      productType: 'earring',
      category: 'stud',
      title: 'Solis Studs',
      description: 'Two perfect diamonds. The most versatile pieces you will ever own.',
      basePrice: 1200,
      isFeatured: true,
      isNewArrival: false,
      tags: ['studs', 'earrings'],
    },
  ]

  const { error } = await supabase.from('Product').insert(products)
  if (error) {
    console.error('Error seeding products:', error)
    throw error
  }
  console.log(`✓ Seeded ${products.length} products`)
}

async function seedDiamonds() {
  console.log('Seeding diamonds...')

  const diamonds = [
    { sku: 'JB-DIA-001', shape: 'Round', carat: 1.0, color: 'D', clarity: 'IF', cut: 'Excellent', price: 8500, certificateNumber: 'IGI-2026-001001', certificateType: 'IGI', isLabGrown: true, isAvailable: true },
    { sku: 'JB-DIA-002', shape: 'Round', carat: 0.8, color: 'E', clarity: 'VVS1', cut: 'Excellent', price: 5200, certificateNumber: 'IGI-2026-001002', certificateType: 'IGI', isLabGrown: true, isAvailable: true },
    { sku: 'JB-DIA-003', shape: 'Round', carat: 1.5, color: 'F', clarity: 'VVS2', cut: 'Excellent', price: 11000, certificateNumber: 'IGI-2026-001003', certificateType: 'IGI', isLabGrown: true, isAvailable: true },
    { sku: 'JB-DIA-004', shape: 'Round', carat: 0.5, color: 'G', clarity: 'VS1', cut: 'Very Good', price: 2800, certificateNumber: 'IGI-2026-001004', certificateType: 'IGI', isLabGrown: true, isAvailable: true },
    { sku: 'JB-DIA-005', shape: 'Round', carat: 2.0, color: 'H', clarity: 'VS2', cut: 'Very Good', price: 9800, certificateNumber: 'IGI-2026-001005', certificateType: 'IGI', isLabGrown: true, isAvailable: true },
    { sku: 'JB-DIA-006', shape: 'Oval', carat: 1.2, color: 'D', clarity: 'VVS1', cut: 'Excellent', price: 9200, certificateNumber: 'IGI-2026-001006', certificateType: 'IGI', isLabGrown: true, isAvailable: true },
    { sku: 'JB-DIA-007', shape: 'Oval', carat: 0.9, color: 'E', clarity: 'VS1', cut: 'Excellent', price: 5800, certificateNumber: 'IGI-2026-001007', certificateType: 'IGI', isLabGrown: true, isAvailable: true },
    { sku: 'JB-DIA-008', shape: 'Oval', carat: 1.8, color: 'G', clarity: 'VS2', cut: 'Very Good', price: 8400, certificateNumber: 'IGI-2026-001008', certificateType: 'IGI', isLabGrown: true, isAvailable: true },
    { sku: 'JB-DIA-009', shape: 'Cushion', carat: 1.1, color: 'F', clarity: 'VVS2', cut: 'Excellent', price: 7600, certificateNumber: 'IGI-2026-001009', certificateType: 'IGI', isLabGrown: true, isAvailable: true },
    { sku: 'JB-DIA-010', shape: 'Cushion', carat: 0.7, color: 'H', clarity: 'VS1', cut: 'Very Good', price: 3200, certificateNumber: 'IGI-2026-001010', certificateType: 'IGI', isLabGrown: true, isAvailable: true },
    { sku: 'JB-DIA-011', shape: 'Princess', carat: 1.0, color: 'D', clarity: 'IF', cut: 'Excellent', price: 8800, certificateNumber: 'IGI-2026-001011', certificateType: 'IGI', isLabGrown: true, isAvailable: true },
    { sku: 'JB-DIA-012', shape: 'Princess', carat: 1.3, color: 'E', clarity: 'VVS1', cut: 'Excellent', price: 10200, certificateNumber: 'IGI-2026-001012', certificateType: 'IGI', isLabGrown: true, isAvailable: true },
    { sku: 'JB-DIA-013', shape: 'Emerald', carat: 1.5, color: 'F', clarity: 'VVS2', cut: 'Excellent', price: 11500, certificateNumber: 'IGI-2026-001013', certificateType: 'IGI', isLabGrown: true, isAvailable: true },
    { sku: 'JB-DIA-014', shape: 'Pear', carat: 0.8, color: 'G', clarity: 'VS1', cut: 'Very Good', price: 4200, certificateNumber: 'IGI-2026-001014', certificateType: 'IGI', isLabGrown: true, isAvailable: true },
    { sku: 'JB-DIA-015', shape: 'Marquise', carat: 1.2, color: 'H', clarity: 'VS2', cut: 'Very Good', price: 6800, certificateNumber: 'IGI-2026-001015', certificateType: 'IGI', isLabGrown: true, isAvailable: true },
  ]

  const { error } = await supabase.from('Diamond').insert(diamonds)
  if (error) {
    console.error('Error seeding diamonds:', error)
    throw error
  }
  console.log(`✓ Seeded ${diamonds.length} diamonds`)
}

async function seedDiscountCodes() {
  console.log('Seeding discount codes...')

  const now = new Date()
  const codes = [
    {
      code: 'WELCOME30',
      type: 'percentage',
      value: 30,
      minOrderAmt: 0,
      maxUses: 1000,
      isActive: true,
      expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
    },
    {
      code: 'JUSTBECAUSE',
      type: 'fixed',
      value: 500,
      minOrderAmt: 3000,
      maxUses: 500,
      isActive: true,
      expiresAt: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
    },
    {
      code: 'LABGROWN15',
      type: 'percentage',
      value: 15,
      minOrderAmt: 1000,
      maxUses: 2000,
      isActive: true,
      expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
    },
  ]

  const { error } = await supabase.from('DiscountCode').insert(codes)
  if (error) {
    console.error('Error seeding discount codes:', error)
    throw error
  }
  console.log(`✓ Seeded ${codes.length} discount codes`)
}

async function seedAdminUser() {
  console.log('Seeding admin user...')

  const { error } = await supabase.from('AdminUser').insert([
    {
      email: 'admin@justbecause.com',
      name: 'Ujjwal Bana',
      role: 'super_admin',
    },
  ])
  if (error) {
    console.error('Error seeding admin:', error)
    throw error
  }
  console.log('✓ Seeded admin user')
}

async function seedReviews() {
  console.log('Seeding reviews...')

  const { data: products } = await supabase
    .from('Product')
    .select('id, slug')

  if (!products || products.length === 0) {
    console.log('No products found, skipping reviews')
    return
  }

  const productMap = Object.fromEntries(
    products.map((p: { slug: string; id: string }) => [p.slug, p.id])
  )

  const reviews = [
    {
      productId: productMap['solis-solitaire'],
      customerName: 'Priya M.',
      rating: 5,
      title: 'Just because it was Tuesday',
      comment: 'I bought this for myself on a Tuesday. No occasion. Just because. Best decision of the year.',
      isVerified: true,
      isApproved: true,
    },
    {
      productId: productMap['solis-solitaire'],
      customerName: 'Sarah K.',
      rating: 5,
      title: 'Better than my old one',
      comment: 'The packaging alone made me cry. The diamond outshines my old mined one and it cost half.',
      isVerified: true,
      isApproved: true,
    },
    {
      productId: productMap['lumi-halo'],
      customerName: 'Aaron L.',
      rating: 5,
      title: 'She said yes',
      comment: 'Customer service walked me through every step. Felt less like e-commerce, more like a friend.',
      isVerified: true,
      isApproved: true,
    },
    {
      productId: productMap['vela-pave'],
      customerName: 'Ananya R.',
      rating: 4,
      title: 'Stunning piece',
      comment: 'The pavé setting catches light from every angle. I get compliments every single day.',
      isVerified: true,
      isApproved: true,
    },
    {
      productId: productMap['constellation-tennis-necklace'],
      customerName: 'Meera S.',
      rating: 5,
      title: 'A dream necklace',
      comment: 'I have wanted a tennis necklace for years. This one is beyond what I imagined.',
      isVerified: true,
      isApproved: true,
    },
    {
      productId: productMap['continuum-tennis-bracelet'],
      customerName: 'Lisa W.',
      rating: 5,
      title: 'Classic and perfect',
      comment: 'Exactly what a tennis bracelet should be. Timeless, elegant, and guilt-free.',
      isVerified: true,
      isApproved: true,
    },
    {
      productId: productMap['solis-studs'],
      customerName: 'Kavya P.',
      rating: 4,
      title: 'My everyday diamonds',
      comment: 'Been wearing these every day for 3 months. Still perfect.',
      isVerified: true,
      isApproved: true,
    },
  ].filter((r) => r.productId)

  const { error } = await supabase.from('Review').insert(reviews)
  if (error) {
    console.error('Error seeding reviews:', error)
    throw error
  }
  console.log(`✓ Seeded ${reviews.length} reviews`)
}

async function main() {
  console.log('Starting seed...')
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

  await clearData()
  await seedProducts()
  await seedDiamonds()
  await seedDiscountCodes()
  await seedAdminUser()
  await seedReviews()

  console.log('✅ Seed complete!')
}

main().catch((err) => {
  console.error('Fatal seed error:', err)
  process.exit(1)
})

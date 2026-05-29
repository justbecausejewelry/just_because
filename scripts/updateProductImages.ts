import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })
config({ path: '.env' })

type ProductRecord = {
  id: string
  slug: string | null
  title: string | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const productImages: Record<string, string[]> = {
  'solis-solitaire': [
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&q=95',
    'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1200&q=95',
    'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=1200&q=95',
    'https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=1200&q=95',
  ],
  'vela-pave': [
    'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=1200&q=95',
    'https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=1200&q=95',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&q=95',
    'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1200&q=95',
  ],
  'lumi-halo': [
    'https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=1200&q=95',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&q=95',
    'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=1200&q=95',
    'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1200&q=95',
  ],
  'orla-three-stone': [
    'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=1200&q=95',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&q=95',
    'https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=1200&q=95',
    'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=1200&q=95',
  ],
  'coeur-hidden-halo': [
    'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=1200&q=95',
    'https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=1200&q=95',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&q=95',
    'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=1200&q=95',
  ],
  'bellora-pave-hidden-halo': [
    'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1200&q=95',
    'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=1200&q=95',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&q=95',
    'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1200&q=95',
  ],
  'aurora-eternity': [
    'https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=1200&q=95',
    'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=1200&q=95',
    'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1200&q=95',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&q=95',
  ],
  'solis-studs': [
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1200&q=95',
    'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=1200&q=95',
    'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=1200&q=95',
    'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=1200&q=95',
  ],
  'hoop-earrings': [
    'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=1200&q=95',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1200&q=95',
    'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=1200&q=95',
    'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=1200&q=95',
  ],
  'celestia-drop-earrings': [
    'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=1200&q=95',
    'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=1200&q=95',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1200&q=95',
    'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=1200&q=95',
  ],
  'constellation-tennis-necklace': [
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&q=95',
    'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=1200&q=95',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&q=95',
    'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=1200&q=95',
  ],
  'women-tennis-necklace': [
    'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=1200&q=95',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&q=95',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&q=95',
    'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=1200&q=95',
  ],
  'luna-pendant': [
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&q=95',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&q=95',
    'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=1200&q=95',
    'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=1200&q=95',
  ],
  'continuum-tennis-bracelet': [
    'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=1200&q=95',
    'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=1200&q=95',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&q=95',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&q=95',
  ],
  'tennis-bracelet': [
    'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=1200&q=95',
    'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=1200&q=95',
    'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=1200&q=95',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&q=95',
  ],
}

function imagesForProduct(product: ProductRecord) {
  const slug = product.slug || ''
  const exactImages = productImages[slug]

  if (exactImages) {
    return exactImages
  }

  const matchingKey = Object.keys(productImages).find((key) =>
    slug.includes(key) || key.includes(slug)
  )

  if (matchingKey) {
    return productImages[matchingKey]
  }

  const title = product.title?.toLowerCase() || ''
  if (title.includes('ring') || title.includes('engagement')) {
    return productImages['solis-solitaire']
  }
  if (title.includes('earring') || title.includes('stud')) {
    return productImages['solis-studs']
  }
  if (title.includes('necklace') || title.includes('tennis')) {
    return productImages['constellation-tennis-necklace']
  }
  if (title.includes('bracelet')) {
    return productImages['continuum-tennis-bracelet']
  }

  return productImages['solis-solitaire']
}

async function updateAllProducts() {
  console.log('Fetching all products...')

  const { data: products, error } = await supabase
    .from('Product')
    .select('id, slug, title')
    .returns<ProductRecord[]>()

  if (error) {
    console.error('Error fetching products:', error)
    return
  }

  console.log(`Found ${products?.length || 0} products`)

  for (const product of products || []) {
    const images = imagesForProduct(product)

    const { error: updateError } = await supabase
      .from('Product')
      .update({ images })
      .eq('id', product.id)

    if (updateError) {
      console.error(`Failed to update ${product.slug}:`, updateError)
    } else {
      console.log(`Updated: ${product.title} (${product.slug})`)
    }
  }

  console.log('All products updated!')
}

void updateAllProducts()

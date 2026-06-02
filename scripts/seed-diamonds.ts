import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { createClient } from '@supabase/supabase-js'

type DiamondSeed = {
  sku: string
  shape: string
  carat: number
  color: string
  clarity: string
  cut: string
  polish: string
  symmetry: string
  fluorescence: string
  price: number
  certificateNumber: string
  certificateType: string
  isAvailable: boolean
  isLabGrown: boolean
  imageUrl: string
  measurements: string
  depthPercent: number
  tablePercent: number
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const shapeImages: Record<string, string> = {
  Asscher: '/images/diamonds/asscher.png',
  Cushion: '/images/diamonds/cushion.png',
  Emerald: '/images/diamonds/emerald.png',
  Heart: '/images/diamonds/heart.png',
  Marquise: '/images/diamonds/marquise.png',
  Oval: '/images/diamonds/oval.png',
  Pear: '/images/diamonds/pear.png',
  Princess: '/images/diamonds/princess.png',
  Radiant: '/images/diamonds/radiant.png',
  Round: '/images/diamonds/round-diamond.png',
}

function priceForCarat(carat: number) {
  return Math.ceil((carat ** 1.9 * 3800) / 10) * 10
}

function cert(index: number) {
  return `IGI-${4726100 + index}`
}

const diamonds: DiamondSeed[] = [
  { sku: 'JB-DIA-ROUND-034', shape: 'Round', carat: 0.34, color: 'F', clarity: 'VS1', cut: 'Excellent', polish: 'Excellent', symmetry: 'Excellent', fluorescence: 'None', measurements: '4.52 x 4.49 x 2.77 mm', depthPercent: 61.7, tablePercent: 57, certificateNumber: cert(1), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Round, price: priceForCarat(0.34) },
  { sku: 'JB-DIA-ROUND-072', shape: 'Round', carat: 0.72, color: 'E', clarity: 'VVS2', cut: 'Excellent', polish: 'Excellent', symmetry: 'Very Good', fluorescence: 'Faint', measurements: '5.82 x 5.79 x 3.58 mm', depthPercent: 61.8, tablePercent: 56, certificateNumber: cert(2), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Round, price: priceForCarat(0.72) },
  { sku: 'JB-DIA-ROUND-102', shape: 'Round', carat: 1.02, color: 'D', clarity: 'VVS1', cut: 'Excellent', polish: 'Excellent', symmetry: 'Excellent', fluorescence: 'None', measurements: '6.53 x 6.50 x 3.99 mm', depthPercent: 61.3, tablePercent: 56, certificateNumber: cert(3), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Round, price: priceForCarat(1.02) },
  { sku: 'JB-DIA-ROUND-224', shape: 'Round', carat: 2.24, color: 'G', clarity: 'VS1', cut: 'Excellent', polish: 'Very Good', symmetry: 'Excellent', fluorescence: 'Faint', measurements: '8.44 x 8.39 x 5.16 mm', depthPercent: 61.5, tablePercent: 58, certificateNumber: cert(4), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Round, price: priceForCarat(2.24) },
  { sku: 'JB-DIA-OVAL-055', shape: 'Oval', carat: 0.55, color: 'G', clarity: 'VS2', cut: 'Excellent', polish: 'Excellent', symmetry: 'Very Good', fluorescence: 'None', measurements: '6.10 x 4.35 x 2.66 mm', depthPercent: 61.2, tablePercent: 58, certificateNumber: cert(5), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Oval, price: priceForCarat(0.55) },
  { sku: 'JB-DIA-OVAL-131', shape: 'Oval', carat: 1.31, color: 'F', clarity: 'VS1', cut: 'Excellent', polish: 'Excellent', symmetry: 'Excellent', fluorescence: 'Medium', measurements: '8.44 x 6.07 x 3.70 mm', depthPercent: 61.0, tablePercent: 59, certificateNumber: cert(6), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Oval, price: priceForCarat(1.31) },
  { sku: 'JB-DIA-OVAL-302', shape: 'Oval', carat: 3.02, color: 'H', clarity: 'VS2', cut: 'Very Good', polish: 'Excellent', symmetry: 'Very Good', fluorescence: 'Faint', measurements: '11.15 x 8.08 x 4.97 mm', depthPercent: 61.5, tablePercent: 60, certificateNumber: cert(7), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Oval, price: priceForCarat(3.02) },
  { sku: 'JB-DIA-CUSH-088', shape: 'Cushion', carat: 0.88, color: 'I', clarity: 'SI1', cut: 'Very Good', polish: 'Very Good', symmetry: 'Very Good', fluorescence: 'None', measurements: '5.82 x 5.70 x 3.55 mm', depthPercent: 62.3, tablePercent: 58, certificateNumber: cert(8), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Cushion, price: priceForCarat(0.88) },
  { sku: 'JB-DIA-CUSH-154', shape: 'Cushion', carat: 1.54, color: 'E', clarity: 'VVS2', cut: 'Excellent', polish: 'Excellent', symmetry: 'Excellent', fluorescence: 'None', measurements: '7.10 x 6.94 x 4.31 mm', depthPercent: 62.1, tablePercent: 57, certificateNumber: cert(9), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Cushion, price: priceForCarat(1.54) },
  { sku: 'JB-DIA-CUSH-251', shape: 'Cushion', carat: 2.51, color: 'G', clarity: 'VS1', cut: 'Excellent', polish: 'Excellent', symmetry: 'Very Good', fluorescence: 'Faint', measurements: '8.42 x 8.20 x 5.08 mm', depthPercent: 62.0, tablePercent: 59, certificateNumber: cert(10), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Cushion, price: priceForCarat(2.51) },
  { sku: 'JB-DIA-PRIN-046', shape: 'Princess', carat: 0.46, color: 'D', clarity: 'IF', cut: 'Excellent', polish: 'Excellent', symmetry: 'Excellent', fluorescence: 'None', measurements: '4.45 x 4.42 x 3.20 mm', depthPercent: 72.4, tablePercent: 68, certificateNumber: cert(11), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Princess, price: priceForCarat(0.46) },
  { sku: 'JB-DIA-PRIN-118', shape: 'Princess', carat: 1.18, color: 'F', clarity: 'VVS1', cut: 'Excellent', polish: 'Excellent', symmetry: 'Excellent', fluorescence: 'Faint', measurements: '5.98 x 5.95 x 4.31 mm', depthPercent: 72.5, tablePercent: 69, certificateNumber: cert(12), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Princess, price: priceForCarat(1.18) },
  { sku: 'JB-DIA-PRIN-335', shape: 'Princess', carat: 3.35, color: 'H', clarity: 'VS2', cut: 'Very Good', polish: 'Very Good', symmetry: 'Excellent', fluorescence: 'Medium', measurements: '8.45 x 8.38 x 6.05 mm', depthPercent: 72.2, tablePercent: 70, certificateNumber: cert(13), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Princess, price: priceForCarat(3.35) },
  { sku: 'JB-DIA-EMER-095', shape: 'Emerald', carat: 0.95, color: 'E', clarity: 'VVS1', cut: 'Excellent', polish: 'Excellent', symmetry: 'Excellent', fluorescence: 'None', measurements: '6.62 x 4.85 x 3.11 mm', depthPercent: 64.1, tablePercent: 65, certificateNumber: cert(14), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Emerald, price: priceForCarat(0.95) },
  { sku: 'JB-DIA-EMER-182', shape: 'Emerald', carat: 1.82, color: 'G', clarity: 'VS1', cut: 'Excellent', polish: 'Excellent', symmetry: 'Very Good', fluorescence: 'Faint', measurements: '7.95 x 5.78 x 3.73 mm', depthPercent: 64.5, tablePercent: 66, certificateNumber: cert(15), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Emerald, price: priceForCarat(1.82) },
  { sku: 'JB-DIA-PEAR-112', shape: 'Pear', carat: 1.12, color: 'F', clarity: 'VS1', cut: 'Excellent', polish: 'Excellent', symmetry: 'Very Good', fluorescence: 'None', measurements: '8.62 x 5.66 x 3.45 mm', depthPercent: 61.0, tablePercent: 58, certificateNumber: cert(16), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Pear, price: priceForCarat(1.12) },
  { sku: 'JB-DIA-PEAR-201', shape: 'Pear', carat: 2.01, color: 'I', clarity: 'SI1', cut: 'Good', polish: 'Very Good', symmetry: 'Very Good', fluorescence: 'Medium', measurements: '10.52 x 6.88 x 4.25 mm', depthPercent: 61.8, tablePercent: 60, certificateNumber: cert(17), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Pear, price: priceForCarat(2.01) },
  { sku: 'JB-DIA-RADI-143', shape: 'Radiant', carat: 1.43, color: 'D', clarity: 'VVS2', cut: 'Excellent', polish: 'Excellent', symmetry: 'Excellent', fluorescence: 'None', measurements: '7.20 x 5.82 x 3.62 mm', depthPercent: 62.2, tablePercent: 64, certificateNumber: cert(18), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Radiant, price: priceForCarat(1.43) },
  { sku: 'JB-DIA-RADI-274', shape: 'Radiant', carat: 2.74, color: 'H', clarity: 'VS2', cut: 'Very Good', polish: 'Excellent', symmetry: 'Very Good', fluorescence: 'Faint', measurements: '8.92 x 7.02 x 4.37 mm', depthPercent: 62.3, tablePercent: 65, certificateNumber: cert(19), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Radiant, price: priceForCarat(2.74) },
  { sku: 'JB-DIA-ASSC-164', shape: 'Asscher', carat: 1.64, color: 'E', clarity: 'VVS1', cut: 'Excellent', polish: 'Excellent', symmetry: 'Excellent', fluorescence: 'None', measurements: '6.77 x 6.72 x 4.34 mm', depthPercent: 64.6, tablePercent: 63, certificateNumber: cert(20), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Asscher, price: priceForCarat(1.64) },
  { sku: 'JB-DIA-ASSC-401', shape: 'Asscher', carat: 4.01, color: 'G', clarity: 'VS1', cut: 'Excellent', polish: 'Excellent', symmetry: 'Very Good', fluorescence: 'Faint', measurements: '9.78 x 9.70 x 6.31 mm', depthPercent: 65.1, tablePercent: 64, certificateNumber: cert(21), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Asscher, price: priceForCarat(4.01) },
  { sku: 'JB-DIA-HEART-078', shape: 'Heart', carat: 0.78, color: 'H', clarity: 'VS2', cut: 'Very Good', polish: 'Very Good', symmetry: 'Very Good', fluorescence: 'Faint', measurements: '5.93 x 5.80 x 3.55 mm', depthPercent: 61.3, tablePercent: 58, certificateNumber: cert(22), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Heart, price: priceForCarat(0.78) },
  { sku: 'JB-DIA-HEART-375', shape: 'Heart', carat: 3.75, color: 'F', clarity: 'VS1', cut: 'Excellent', polish: 'Excellent', symmetry: 'Excellent', fluorescence: 'None', measurements: '9.65 x 9.48 x 5.82 mm', depthPercent: 61.4, tablePercent: 59, certificateNumber: cert(23), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Heart, price: priceForCarat(3.75) },
  { sku: 'JB-DIA-MARQ-069', shape: 'Marquise', carat: 0.69, color: 'I', clarity: 'SI1', cut: 'Good', polish: 'Very Good', symmetry: 'Very Good', fluorescence: 'Medium', measurements: '8.22 x 4.17 x 2.55 mm', depthPercent: 61.2, tablePercent: 57, certificateNumber: cert(24), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Marquise, price: priceForCarat(0.69) },
  { sku: 'JB-DIA-MARQ-452', shape: 'Marquise', carat: 4.52, color: 'E', clarity: 'VVS2', cut: 'Excellent', polish: 'Excellent', symmetry: 'Excellent', fluorescence: 'None', measurements: '15.12 x 7.65 x 4.69 mm', depthPercent: 61.3, tablePercent: 58, certificateNumber: cert(25), certificateType: 'IGI', isAvailable: true, isLabGrown: true, imageUrl: shapeImages.Marquise, price: priceForCarat(4.52) },
]

async function main() {
  console.log('Clearing existing Diamond records...')
  const { error: deleteError } = await supabase.from('Diamond').delete().neq('id', '')

  if (deleteError) {
    throw deleteError
  }

  console.log(`Inserting ${diamonds.length} diamonds...`)
  const { data, error: insertError } = await supabase
    .from('Diamond')
    .insert(diamonds)
    .select('id, shape, imageUrl')

  if (insertError) {
    throw insertError
  }

  const shapeCounts = (data || []).reduce<Record<string, number>>((counts, diamond) => {
    const shape = String(diamond.shape)
    return { ...counts, [shape]: (counts[shape] || 0) + 1 }
  }, {})

  console.log(`Seeded ${data?.length || 0} diamonds.`)
  console.log(shapeCounts)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})

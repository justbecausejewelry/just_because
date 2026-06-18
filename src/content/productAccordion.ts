export type ProductAccordionStaticSection = {
  id: string
  title: string
  paragraphs?: string[]
  bullets?: string[]
  link?: {
    href: string
    label: string
  }
}

export const PRODUCT_ACCORDION_STATIC_SECTIONS: ProductAccordionStaticSection[] = [
  {
    id: 'materials-care',
    title: 'MATERIALS & CARE',
    paragraphs: [
      'Every Just Because piece is crafted with lab-grown diamonds that share the same optical, chemical, and physical properties as mined diamonds.',
      'Each stone is selected for brilliance and set in precious metal designed for daily wear, gifting, and quiet keepsake moments.',
    ],
    bullets: [
      'Clean with warm water, mild dish soap, and a soft brush.',
      'Avoid ultrasonic cleaners for prong-set stones.',
      'Store separately to prevent scratching.',
      'Remove before swimming, exercising, or sleeping.',
    ],
  },
  {
    id: 'shipping-delivery',
    title: 'SHIPPING & DELIVERY',
    bullets: [
      'Free shipping on orders over $200.',
      'Estimated delivery: 5-7 business days within US.',
      'Discreet packaging in signature Just Because gift box.',
      'Tracking provided via email once order ships.',
      'Signature required on delivery for security.',
    ],
  },
  {
    id: 'returns-warranty',
    title: 'RETURNS & WARRANTY',
    bullets: [
      '30-day return policy on unworn, undamaged items.',
      'Original packaging required for returns.',
      'Lifetime warranty against manufacturing defects.',
      'Free resizing within 60 days of purchase for rings only.',
      'Email returns@justbecausejewelry.com to initiate.',
    ],
  },
  {
    id: 'certifications',
    title: 'CERTIFICATIONS',
    bullets: [
      'IGI certified lab-grown diamond.',
      'Certificate number provided with shipment.',
      'Conflict-free, ethically sourced.',
      'Zero mining, sustainable production.',
    ],
    link: {
      href: '/certifications',
      label: 'View sample certificate',
    },
  },
  {
    id: 'why-lab-grown',
    title: 'WHY LAB-GROWN',
    bullets: [
      'Chemically, optically, and physically identical to mined diamonds.',
      'More affordable, typically 60-80% less than mined diamonds.',
      'Environmentally responsible with zero land disruption.',
      'Ethically clean supply chain.',
      'Same brilliance, fire, and durability.',
    ],
  },
]

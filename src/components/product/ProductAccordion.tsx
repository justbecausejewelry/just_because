'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { getMetalLabel } from '@/config/productOptions'
import { PRODUCT_ACCORDION_STATIC_SECTIONS } from '@/content/productAccordion'

type ProductAccordionProduct = {
  totalCaratWeight?: string | number | null
  diamondShape?: string | null
  colorGrade?: string | null
  clarity?: string | null
  cut?: string | null
  metalKarat?: string | null
  settingStyle?: string | null
  dimensions?: string | null
}

type AccordionSection = {
  id: string
  title: string
  content: ReactNode
}

function hasValue(value: string | number | null | undefined) {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

function formatValue(value: string | number | null | undefined) {
  if (!hasValue(value)) return 'Not specified'
  return String(value)
}

function ProductDetailRows({ product, selectedMetal }: { product: ProductAccordionProduct; selectedMetal?: string }) {
  const rows = [
    ['Total Carat Weight', product.totalCaratWeight],
    ['Diamond Shape', product.diamondShape],
    ['Diamond Type', 'Lab-Grown'],
    ['Certification', 'IGI Certified'],
    ['Color Grade', product.colorGrade],
    ['Clarity', product.clarity],
    ['Cut', product.cut],
    ['Metal', getMetalLabel(selectedMetal) || null],
    ['Metal Karat', product.metalKarat],
    ['Setting Style', product.settingStyle],
    ['Dimensions', product.dimensions],
  ] as [string, string | number | null | undefined][]

  return (
    <dl style={{ display: 'grid', gap: '12px', margin: 0 }}>
      {rows.map(([label, value]) => (
        <div
          key={label}
          style={{
            display: 'grid',
            gap: '6px',
            gridTemplateColumns: 'minmax(130px, 0.42fr) 1fr',
          }}
        >
          <dt
            style={{
              color: '#B8A090',
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </dt>
          <dd
            style={{
              color: '#1A1014',
              fontFamily: 'var(--font-inter)',
              fontSize: '15px',
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            {formatValue(value)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function StaticSectionContent({ section }: { section: (typeof PRODUCT_ACCORDION_STATIC_SECTIONS)[number] }) {
  return (
    <div style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '15px', lineHeight: 1.7 }}>
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph} style={{ margin: '0 0 12px' }}>
          {paragraph}
        </p>
      ))}
      {section.bullets?.length ? (
        <ul style={{ display: 'grid', gap: '9px', margin: 0, paddingLeft: '18px' }}>
          {section.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
      {section.link ? (
        <Link
          href={section.link.href}
          style={{
            color: '#C9A961',
            display: 'inline-block',
            fontFamily: 'var(--font-inter)',
            fontSize: '12px',
            letterSpacing: '0.14em',
            marginTop: '14px',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}
        >
          {section.link.label}
        </Link>
      ) : null}
    </div>
  )
}

export default function ProductAccordion({
  product,
  selectedMetal,
}: {
  product: ProductAccordionProduct
  selectedMetal?: string
}) {
  const [openSection, setOpenSection] = useState('product-details')
  const sections: AccordionSection[] = [
    {
      id: 'product-details',
      title: 'PRODUCT DETAILS',
      content: <ProductDetailRows product={product} selectedMetal={selectedMetal} />,
    },
    ...PRODUCT_ACCORDION_STATIC_SECTIONS.map((section) => ({
      id: section.id,
      title: section.title,
      content: <StaticSectionContent section={section} />,
    })),
  ]

  return (
    <section
      style={{
        background: '#FBF5F0',
        borderTop: '0.5px solid #EDD9AF',
        marginTop: '24px',
      }}
    >
      {sections.map((section) => {
        const isOpen = openSection === section.id
        return (
          <div key={section.id} style={{ borderBottom: '0.5px solid #EDD9AF' }}>
            <button
              type="button"
              onClick={() => setOpenSection(isOpen ? '' : section.id)}
              aria-expanded={isOpen}
              style={{
                alignItems: 'center',
                background: 'transparent',
                border: 'none',
                color: '#C9A961',
                cursor: 'pointer',
                display: 'flex',
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                justifyContent: 'space-between',
                letterSpacing: '0.24em',
                padding: '18px 0',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <span>{section.title}</span>
              <span
                aria-hidden="true"
                style={{
                  color: '#C9A961',
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '24px',
                  lineHeight: 1,
                }}
              >
                {isOpen ? '-' : '+'}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '0 0 20px' }}>
                    {section.content}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )
      })}
    </section>
  )
}

import Link from 'next/link'
import { Camera, Music, Share2 } from 'lucide-react'

const columns = [
  { title: 'SHOP', links: ['Engagement', 'Rings', 'Necklaces', 'Earrings', 'Bracelets'] },
  { title: 'LEARN', links: ['Our process', 'The 4 Cs', 'Education', 'Journal'] },
  { title: 'SUPPORT', links: ['Contact', 'Returns', 'Ring sizing', 'Care guide'] },
]

export function Footer() {
  return (
    <footer className="px-6 pb-7 pt-12 md:px-10 md:py-[60px] lg:px-20" style={{ backgroundColor: '#1A1014', color: '#A89890' }}>
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="text-center md:text-left">
          <Link href="/" className="flex items-baseline justify-center gap-1 md:justify-start">
            <span className="text-[30px] leading-none" style={{ color: '#C9A961', fontFamily: 'var(--font-italianno)' }}>
              just
            </span>
            <span className="text-[13px] tracking-[0.28em]" style={{ color: '#E8C4D0', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
              BECAUSE
            </span>
          </Link>
          <p className="mx-auto mt-3 max-w-[230px] text-[11px] leading-[1.7] md:mx-0" style={{ color: '#A89890', fontFamily: 'var(--font-inter)' }}>
            Lab-grown diamonds and recycled gold, crafted for every moment that
            does not need a name.
          </p>
          <div className="mt-4 flex justify-center gap-[14px] md:justify-start" style={{ color: '#E8C4D0' }}>
            <Camera size={18} color="#E8C4D0" strokeWidth={1.5} />
            <Share2 size={18} color="#E8C4D0" strokeWidth={1.5} />
            <Music size={18} color="#E8C4D0" strokeWidth={1.5} />
          </div>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="mb-4 text-[9px] tracking-[0.22em]" style={{ color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
              {column.title}
            </h3>
            <div className="flex flex-col gap-2">
              {column.links.map((link) => (
                <Link key={link} href="/products" className="text-[13px] leading-[2.2] md:text-[11px]" style={{ color: '#D4C8C0', fontFamily: 'var(--font-inter)' }}>
                  {link}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col justify-between gap-3 border-t pt-5 text-center text-[10px] md:flex-row md:text-left" style={{ borderColor: 'rgba(201,169,97,0.2)', fontFamily: 'var(--font-inter)' }}>
        <div style={{ color: '#A89890' }}>© 2026 Just Because. All rights reserved.</div>
        <div
          style={{
            color: '#C9A961',
            fontSize: '10px',
            letterSpacing: '0.1em',
          }}
        >
          IGI Certified · GCAL Verified · Carbon Neutral
        </div>
      </div>
    </footer>
  )
}

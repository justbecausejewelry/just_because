import Link from 'next/link'

const columns = [
  { title: 'SHOP', links: ['Engagement', 'Rings', 'Necklaces', 'Earrings', 'Bracelets'] },
  { title: 'LEARN', links: ['Our process', 'The 4 Cs', 'Education', 'Journal'] },
  { title: 'SUPPORT', links: ['Contact', 'Returns', 'Ring sizing', 'Care guide'] },
]

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="#E8C4D0" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke="#E8C4D0" strokeWidth="1.5" />
      <circle cx="17" cy="7" r="1" fill="#E8C4D0" />
    </svg>
  )
}

function TwitterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 18.5c5.6.3 10.6-3.2 11.6-8.8v-.5l3.1-3.7-3.8 1.2A4.2 4.2 0 0 0 7.7 10c0 .3 0 .6.1.9A11.7 11.7 0 0 1 4 8.9s-.9 4.6 3.1 6.3A8.4 8.4 0 0 1 4 18.5Z" stroke="#E8C4D0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 8h2V4h-3c-3 0-5 2-5 5v3H6v4h2v5h4v-5h3l1-4h-4V9c0-.6.4-1 1-1h1Z" stroke="#E8C4D0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="site-footer px-6 pb-7 pt-12 md:px-10 md:py-[60px] lg:px-20" style={{ backgroundColor: '#1A1014', color: '#B8A090' }}>
      <div className="footer-grid grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="text-center md:text-left">
          <Link href="/" className="flex items-baseline justify-center gap-1 md:justify-start">
            <span className="text-[30px] leading-none" style={{ color: '#C9A961', fontFamily: 'var(--font-italianno)' }}>
              just
            </span>
            <span className="text-[13px] tracking-[0.28em]" style={{ color: '#E8C4D0', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
              BECAUSE
            </span>
          </Link>
          <p className="mx-auto mt-3 max-w-[230px] text-[11px] leading-[1.7] md:mx-0" style={{ color: '#B8A090', fontFamily: 'var(--font-inter)' }}>
            Lab-grown diamonds and recycled gold, crafted for every moment that
            does not need a name.
          </p>
          <div className="mt-4 flex justify-center gap-[14px] md:justify-start" style={{ color: '#E8C4D0' }}>
            <Link href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer" style={{ color: '#E8C4D0', display: 'flex' }}>
              <InstagramIcon />
            </Link>
            <Link href="https://twitter.com" aria-label="Twitter" target="_blank" rel="noopener noreferrer" style={{ color: '#E8C4D0', display: 'flex' }}>
              <TwitterIcon />
            </Link>
            <Link href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer" style={{ color: '#E8C4D0', display: 'flex' }}>
              <FacebookIcon />
            </Link>
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

      <div className="footer-bottom mt-10 flex flex-col justify-between gap-3 border-t pt-5 text-center text-[10px] md:flex-row md:text-left" style={{ borderColor: 'rgba(201,169,97,0.2)', fontFamily: 'var(--font-inter)' }}>
        <div style={{ color: '#B8A090' }}>© 2026 Just Because. All rights reserved.</div>
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

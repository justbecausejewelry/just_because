import Link from 'next/link'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  href?: string
  className?: string
}

const SIZES = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-4xl',
  xl: 'text-5xl',
}

export function BrandLogo({ size = 'md', href, className = '' }: BrandLogoProps) {
  const logo = (
    <span
      style={{
        fontFamily: "'Italianno', 'Cormorant Garamond', Georgia, serif",
        fontStyle: 'italic',
        color: '#C9A961',
        whiteSpace: 'nowrap',
        display: 'inline-block',
        lineHeight: 1.2,
        letterSpacing: '0.02em',
      }}
      className={`${SIZES[size]} ${className}`}
    >
      Just Because
    </span>
  )

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none' }}>
        {logo}
      </Link>
    )
  }

  return logo
}

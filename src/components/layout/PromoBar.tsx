export function PromoBar() {
  const marqueeItems = [
    '+1 (800) 555-0192',
    'Sign up · 30% off your first piece',
    'Free shipping over $200',
    'IGI Certified Lab Diamonds',
    'Zero Mining · 100% Renewable',
    'Lifetime Warranty',
    '30-Day Returns',
  ]

  return (
    <div
      className="promo-marquee-strip"
      style={{
        background: '#1A1014',
        padding: '11px 0',
        overflow: 'hidden',
        position: 'relative',
        borderBottom: '0.5px solid rgba(201,169,97,0.2)',
      }}
    >
      <div
        className="promo-marquee-track"
        style={{
          display: 'flex',
          whiteSpace: 'nowrap',
          animation: 'promoMarquee 30s linear infinite',
          width: 'max-content',
        }}
      >
        {Array.from({ length: 6 }, (_, groupIndex) => (
          <span
            key={groupIndex}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {marqueeItems.map((text) => (
              <span
                key={`${groupIndex}-${text}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <span
                  style={{
                    color: '#C9A961',
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    paddingLeft: '24px',
                  }}
                >
                  ✦
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    letterSpacing: '0.2em',
                    color: 'rgba(237,217,175,0.85)',
                    fontFamily: 'var(--font-inter)',
                    fontWeight: 400,
                    textTransform: 'uppercase',
                  }}
                >
                  {text}
                </span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

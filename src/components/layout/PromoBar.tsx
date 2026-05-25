export function PromoBar() {
  return (
    <div
      className="flex min-h-10 items-center justify-center px-5 py-[9px] text-center text-[11px] leading-tight sm:justify-between sm:px-10"
      style={{
        backgroundColor: '#1A1014',
        color: '#5C4F47',
        fontFamily: 'var(--font-inter)',
        letterSpacing: '0.1em',
      }}
    >
      <span className="hidden sm:inline">+91 91284 87999</span>
      <span style={{ color: '#C9A961', fontWeight: 500 }}>
        Sign up and receive 30% off your first piece
      </span>
      <span className="hidden sm:inline">Free shipping over $200</span>
    </div>
  )
}

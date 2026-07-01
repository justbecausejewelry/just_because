export function ProductBadges({
  isBestSeller,
  isNewArrival,
}: {
  isBestSeller?: boolean | null
  isNewArrival?: boolean | null
}) {
  if (!isBestSeller && !isNewArrival) return null

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        left: '12px',
        position: 'absolute',
        top: '12px',
        zIndex: 5,
      }}
    >
      {isNewArrival ? (
        <span
          style={{
            background: '#C9A961',
            borderRadius: '999px',
            color: '#FBF5F0',
            fontFamily: 'var(--font-inter)',
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.14em',
            lineHeight: 1,
            padding: '6px 10px',
            textTransform: 'uppercase',
          }}
        >
          NEW
        </span>
      ) : null}
      {isBestSeller ? (
        <span
          style={{
            background: '#1A1014',
            borderRadius: '999px',
            color: '#FBF5F0',
            fontFamily: 'var(--font-inter)',
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.14em',
            lineHeight: 1,
            padding: '6px 10px',
            textTransform: 'uppercase',
          }}
        >
          BEST SELLER
        </span>
      ) : null}
    </div>
  )
}

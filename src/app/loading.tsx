export default function Loading() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0A0612',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{
          fontFamily: "'Italianno', cursive",
          fontSize: '64px',
          color: '#C9A961',
          lineHeight: 0.85,
          animation: 'breathe 1.5s ease-in-out infinite',
        }}>just</span>
        <span style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '18px',
          letterSpacing: '0.35em',
          color: 'rgba(201,169,97,0.7)',
          fontWeight: 400,
          marginLeft: '4px',
        }}>BECAUSE</span>
      </div>
      <div style={{
        width: '40px',
        height: '1px',
        background: 'linear-gradient(to right, transparent, #C9A961, transparent)',
        animation: 'expandLine 1.5s ease-in-out infinite',
        marginTop: '8px',
      }} />
      <style>{`
        @keyframes breathe {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        @keyframes expandLine {
          0%,100% { width: 20px; opacity: 0.3; }
          50% { width: 60px; opacity: 1; }
        }
      `}</style>
    </div>
  )
}

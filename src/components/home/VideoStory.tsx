export function VideoStory() {
  return (
    <section className="grid items-center gap-10 px-6 py-12 md:grid-cols-2 md:px-10 md:py-[60px] lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:px-20 lg:py-20" style={{ backgroundColor: '#1A1014' }}>
      <div
        style={{
          position: 'relative',
          aspectRatio: '16/9',
          overflow: 'hidden',
          borderRadius: '2px',
          background: '#2A1E24',
        }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        >
          <source src="/videos/crafting.mp4" type="video/mp4" />
        </video>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(26,16,20,0.20)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(251,245,240,0.92)',
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '5px 0 5px 9px',
              borderColor: 'transparent transparent transparent #C9A961',
            }}
          />
          <span
            style={{
              fontSize: '10px',
              color: '#1A1014',
              letterSpacing: '0.15em',
              fontFamily: 'var(--font-inter)',
              fontWeight: 500,
            }}
          >
            Watch the process
          </span>
        </div>
      </div>

      <div>
        <p className="mb-3 text-[9px] tracking-[0.32em] md:text-[10px]" style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
          CULTIVATED, NOT COMPROMISED
        </p>
        <h2 className="mb-4 text-[26px] leading-[1.1] md:text-[32px]" style={{ color: '#FBF5F0', fontFamily: 'var(--font-playfair)', fontWeight: 400 }}>
          This is the future
          <br />
          of jewelry.
        </h2>
        <p className="mb-6 text-[13px] leading-[1.7]" style={{ color: '#B8A090', fontFamily: 'var(--font-inter)' }}>
          Every diamond is grown in our solar-powered foundry over 6-10 weeks.
          Same carbon, same brilliance, zero mining. Watch how a single crystal
          becomes the ring you will wear forever.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 'clamp(14px, 4vw, 32px)',
            paddingTop: '20px',
            borderTop: '0.5px solid rgba(201,169,97,0.25)',
          }}
        >
          {[
            ['0', 'MINING'],
            ['100%', 'RENEWABLE'],
            ['IGI', 'CERTIFIED'],
          ].map(([value, label]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div
                style={{
                  color: '#C9A961',
                  fontFamily: 'var(--font-playfair)',
                  fontSize: 'clamp(22px, 5vw, 28px)',
                  fontWeight: 400,
                  lineHeight: 1,
                }}
              >
                {value}
              </div>
              <div
                style={{
                  color: '#B8A090',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '9px',
                  letterSpacing: '0.2em',
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

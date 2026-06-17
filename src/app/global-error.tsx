'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <main style={{ alignItems: 'center', background: '#FBF5F0', color: '#1A1014', display: 'flex', minHeight: '100vh', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
          <section style={{ maxWidth: '520px' }}>
            <p style={{ color: '#C9A961', fontFamily: 'Arial,sans-serif', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase' }}>Just Because</p>
            <h1 style={{ color: '#1A1014', fontFamily: 'Georgia,serif', fontSize: '34px', fontWeight: 400, margin: '12px 0' }}>We hit an unexpected error.</h1>
            <button onClick={reset} style={{ background: '#1A1014', border: 'none', color: '#FBF5F0', cursor: 'pointer', fontFamily: 'Arial,sans-serif', fontSize: '11px', letterSpacing: '0.18em', padding: '13px 22px', textTransform: 'uppercase' }}>Reload</button>
          </section>
        </main>
      </body>
    </html>
  )
}

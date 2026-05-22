export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-12 bg-verde-cream">

      <div className="text-center">
        <span className="font-script text-4xl text-verde-emerald">just </span>
        <span className="font-body text-2xl tracking-eyebrow text-verde-emerald">BECAUSE</span>
      </div>

      <h1 className="font-display text-6xl text-verde-ink text-center">
        A reason, in itself.
      </h1>

      <p className="font-body text-base text-verde-stone">
        Phase 1 verification — Verde palette and fonts
      </p>

      <div className="flex gap-6 mt-4">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16" style={{backgroundColor: '#F4ECE2', border: '1px solid #E8DFD2'}}></div>
          <span className="font-body text-xs text-verde-ink">Cream</span>
          <span className="font-body text-xs text-verde-stone">#F4ECE2</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16" style={{backgroundColor: '#2D5246'}}></div>
          <span className="font-body text-xs text-verde-ink">Emerald</span>
          <span className="font-body text-xs text-verde-stone">#2D5246</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16" style={{backgroundColor: '#C9A961'}}></div>
          <span className="font-body text-xs text-verde-ink">Gold</span>
          <span className="font-body text-xs text-verde-stone">#C9A961</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16" style={{backgroundColor: '#1A1A14'}}></div>
          <span className="font-body text-xs text-verde-cream">Ink</span>
          <span className="font-body text-xs text-verde-stone">#1A1A14</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16" style={{backgroundColor: '#B5A88F'}}></div>
          <span className="font-body text-xs text-verde-ink">Stone</span>
          <span className="font-body text-xs text-verde-stone">#B5A88F</span>
        </div>
      </div>

    </main>
  )
}

import Link from 'next/link'

const cutGrades = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor']

const colorGroups = [
  { grade: 'D E F', label: 'Colorless (Best)' },
  { grade: 'G H I', label: 'Near Colorless (Recommended)' },
  { grade: 'J K', label: 'Faint Yellow' },
  { grade: 'L-Z', label: 'Light Yellow' },
]

const clarityGrades = [
  { grade: 'FL, IF', label: 'Flawless (Extremely rare)' },
  { grade: 'VVS1, VVS2', label: 'Very Very Slightly Included' },
  { grade: 'VS1, VS2', label: 'Very Slightly Included (Recommended)' },
  { grade: 'SI1, SI2', label: 'Slightly Included (Eye clean possible)' },
  { grade: 'I1, I2, I3', label: 'Included (Visible to naked eye)' },
]

const caratSizes = [
  { carat: '0.5ct', size: '~5.2mm', radius: 24 },
  { carat: '0.75ct', size: '~5.9mm', radius: 30 },
  { carat: '1.0ct', size: '~6.5mm', radius: 36 },
  { carat: '1.5ct', size: '~7.4mm', radius: 43 },
  { carat: '2.0ct', size: '~8.2mm', radius: 50 },
  { carat: '3.0ct', size: '~9.4mm', radius: 59 },
]

const labStats = [
  '60-80% less expensive than mined',
  'Chemically identical - same carbon atoms',
  'IGI certified - same grading standards',
  '0 mining - grown in a lab, not the earth',
]

function CutVisual() {
  return (
    <div className="fourcs-visual-panel">
      <svg className="fourcs-diamond-svg" viewBox="0 0 360 230" fill="none" aria-label="Diamond cut light reflection diagram" role="img">
        <path d="M180 32L286 88L245 198H115L74 88L180 32Z" stroke="#1A1014" strokeWidth="2" />
        <path d="M74 88H286M115 198L180 32L245 198M115 198L144 88M245 198L216 88M144 88L180 32L216 88" stroke="#C9A961" strokeWidth="1.5" />
        <path d="M128 24L162 78M232 24L198 78M180 14V76" stroke="#EDD9AF" strokeLinecap="round" strokeWidth="1.5" />
        <path d="M135 35L115 47M225 35L245 47M180 18L180 42" stroke="#C9A961" strokeLinecap="round" strokeWidth="2" />
      </svg>
      <div className="cut-scale" aria-label="Cut grade scale">
        {cutGrades.map((grade, index) => (
          <div className={index < 2 ? 'cut-grade cut-grade-active' : 'cut-grade'} key={grade}>
            <span>{grade}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ColorVisual() {
  return (
    <div className="fourcs-visual-panel">
      <div className="color-gradient" aria-hidden="true" />
      <div className="color-scale">
        {colorGroups.map((group) => (
          <div className="color-group" key={group.grade}>
            <strong>{group.grade}</strong>
            <span>{group.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ClarityVisual() {
  return (
    <div className="fourcs-visual-panel">
      <svg className="clarity-gem" viewBox="0 0 280 170" fill="none" aria-label="Diamond clarity diagram" role="img">
        <path d="M140 18L244 66L206 150H74L36 66L140 18Z" stroke="#1A1014" strokeWidth="2" />
        <path d="M36 66H244M74 150L140 18L206 150M74 150L103 66M206 150L177 66M103 66L140 18L177 66" stroke="#C9A961" strokeWidth="1.4" />
        <circle cx="128" cy="84" r="3" fill="#C9A961" />
        <path d="M160 108L175 122M168 98L154 116" stroke="#B8A090" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
      <div className="clarity-list">
        {clarityGrades.map((item) => (
          <div className={item.grade === 'VS1, VS2' ? 'clarity-row clarity-row-active' : 'clarity-row'} key={item.grade}>
            <strong>{item.grade}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CaratVisual() {
  return (
    <div className="fourcs-visual-panel">
      <div className="carat-grid" aria-label="Approximate diamond millimeter sizes">
        {caratSizes.map((item) => (
          <div className="carat-item" key={item.carat}>
            <svg viewBox="0 0 130 130" fill="none" aria-hidden="true">
              <circle cx="65" cy="65" r={item.radius} stroke="#C9A961" strokeWidth="2" />
              <circle cx="65" cy="65" r={Math.max(item.radius - 8, 12)} stroke="#EDD9AF" strokeWidth="1" />
            </svg>
            <strong>{item.carat}</strong>
            <span>{item.size}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FourCSection({
  body,
  children,
  heading,
  label,
  note,
  number,
  reverse = false,
}: {
  body: string[]
  children: React.ReactNode
  heading: string
  label: string
  note: string
  number: string
  reverse?: boolean
}) {
  return (
    <section className={reverse ? 'fourcs-section fourcs-section-reverse' : 'fourcs-section'}>
      <div className="fourcs-section-rule" />
      <div className="fourcs-section-grid">
        <div className="fourcs-copy">
          <span className="fourcs-bg-number">{number}</span>
          <p className="fourcs-label">{label}</p>
          <h2>{heading}</h2>
          {body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p className="fourcs-note">{note}</p>
        </div>
        {children}
      </div>
    </section>
  )
}

export default function FourCsPage() {
  return (
    <main className="fourcs-page">
      <style>{`
        html {
          scroll-behavior: smooth;
        }

        .fourcs-page {
          background: #FBF5F0;
          color: #1A1014;
          min-height: 100vh;
        }

        .fourcs-hero,
        .fourcs-section,
        .fourcs-lab,
        .fourcs-cta {
          padding-left: 24px;
          padding-right: 24px;
        }

        .fourcs-hero {
          padding-bottom: clamp(56px, 8vw, 104px);
          padding-top: clamp(64px, 9vw, 120px);
          text-align: center;
        }

        .fourcs-container,
        .fourcs-section-grid {
          margin: 0 auto;
          max-width: 1180px;
          width: 100%;
        }

        .fourcs-label {
          color: #C9A961 !important;
          font-family: var(--font-inter);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.3em;
          margin: 0 0 16px;
          text-transform: uppercase;
        }

        .fourcs-hero h1,
        .fourcs-copy h2,
        .fourcs-lab h2,
        .fourcs-cta h2 {
          color: #1A1014;
          font-family: var(--font-playfair);
          font-weight: 400;
          letter-spacing: 0;
          margin: 0;
        }

        .fourcs-hero h1 {
          font-size: clamp(42px, 7vw, 76px);
          line-height: 1.04;
          margin-bottom: 22px;
        }

        .fourcs-hero p,
        .fourcs-copy p,
        .fourcs-lab p,
        .fourcs-note,
        .fourcs-cta p {
          color: #1A1014;
          font-family: var(--font-inter);
          font-size: 14px;
          font-weight: 400;
          line-height: 1.8;
        }

        .fourcs-hero-copy {
          margin: 0 auto;
          max-width: 620px;
        }

        .fourcs-section {
          padding-bottom: clamp(64px, 8vw, 110px);
        }

        .fourcs-section-rule {
          background: #C9A961;
          height: 1px;
          margin: 0 auto clamp(48px, 6vw, 72px);
          max-width: 1180px;
          opacity: 0.55;
          width: 100%;
        }

        .fourcs-section-grid {
          align-items: center;
          display: grid;
          gap: clamp(36px, 6vw, 80px);
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        }

        .fourcs-section-reverse .fourcs-copy {
          grid-column: 2;
        }

        .fourcs-section-reverse .fourcs-visual-panel {
          grid-column: 1;
          grid-row: 1;
        }

        .fourcs-copy {
          position: relative;
        }

        .fourcs-bg-number {
          color: rgba(26,16,20,0.10);
          font-family: var(--font-playfair);
          font-size: clamp(92px, 14vw, 168px);
          font-weight: 400;
          left: -10px;
          line-height: 0.8;
          position: absolute;
          top: -36px;
          z-index: 0;
        }

        .fourcs-copy > *:not(.fourcs-bg-number) {
          position: relative;
          z-index: 1;
        }

        .fourcs-copy h2 {
          font-size: clamp(30px, 4vw, 48px);
          line-height: 1.1;
          margin-bottom: 24px;
        }

        .fourcs-copy p {
          margin: 0 0 18px;
        }

        .fourcs-note {
          border-left: 0.5px solid #C9A961;
          color: #1A1014 !important;
          font-style: italic;
          margin-top: 26px !important;
          padding-left: 18px;
        }

        .fourcs-visual-panel {
          background: #FDF8F2;
          border: 0.5px solid #EDD9AF;
          border-radius: 4px;
          box-shadow: 0 4px 20px rgba(26,16,20,0.06);
          padding: clamp(24px, 4vw, 42px);
        }

        .fourcs-diamond-svg,
        .clarity-gem {
          display: block;
          margin: 0 auto 28px;
          max-width: 100%;
          width: 100%;
        }

        .cut-scale {
          display: grid;
          gap: 10px;
        }

        .cut-grade,
        .clarity-row,
        .color-group {
          align-items: center;
          border: 0.5px solid #EDD9AF;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 16px;
        }

        .cut-grade {
          background: #FBF5F0;
        }

        .cut-grade-active,
        .clarity-row-active {
          border-color: #C9A961;
          box-shadow: inset 3px 0 0 #C9A961;
        }

        .cut-grade span,
        .color-group span,
        .clarity-row span,
        .carat-item span {
          color: #B8A090;
          font-family: var(--font-inter);
          font-size: 12px;
          line-height: 1.5;
        }

        .color-gradient {
          background: linear-gradient(90deg, #FBF5F0 0%, #FDF8F2 34%, #EDD9AF 72%, #C9A961 100%);
          border: 0.5px solid #EDD9AF;
          height: 28px;
          margin-bottom: 24px;
        }

        .color-scale,
        .clarity-list {
          display: grid;
          gap: 12px;
        }

        .color-group,
        .clarity-row {
          background: #FBF5F0;
        }

        .color-group strong,
        .clarity-row strong,
        .carat-item strong {
          color: #1A1014;
          font-family: var(--font-inter);
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .carat-grid {
          align-items: end;
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .carat-item {
          align-items: center;
          display: grid;
          gap: 8px;
          justify-items: center;
          text-align: center;
        }

        .carat-item svg {
          height: 112px;
          width: 112px;
        }

        .fourcs-lab {
          background: #FDF8F2;
          border-bottom: 0.5px solid #EDD9AF;
          border-top: 0.5px solid #EDD9AF;
          padding-bottom: clamp(64px, 8vw, 104px);
          padding-top: clamp(64px, 8vw, 104px);
        }

        .fourcs-lab-grid {
          display: grid;
          gap: clamp(32px, 6vw, 72px);
          grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
          margin: 0 auto;
          max-width: 1180px;
        }

        .fourcs-lab h2,
        .fourcs-cta h2 {
          font-size: clamp(32px, 5vw, 54px);
          line-height: 1.1;
          margin-bottom: 22px;
        }

        .fourcs-stat-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .fourcs-stat {
          background: #FBF5F0;
          border: 0.5px solid #EDD9AF;
          color: #1A1014;
          font-family: var(--font-inter);
          font-size: 13px;
          line-height: 1.7;
          min-height: 126px;
          padding: 24px;
        }

        .fourcs-stat strong {
          color: #C9A961;
          display: block;
          font-family: var(--font-playfair);
          font-size: 34px;
          font-weight: 400;
          line-height: 1;
          margin-bottom: 14px;
        }

        .fourcs-cta {
          padding-bottom: clamp(64px, 8vw, 104px);
          padding-top: clamp(64px, 8vw, 104px);
          text-align: center;
        }

        .fourcs-cta-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          justify-content: center;
          margin-top: 30px;
        }

        .fourcs-button {
          align-items: center;
          display: inline-flex;
          font-family: var(--font-inter);
          font-size: 11px;
          font-weight: 500;
          justify-content: center;
          letter-spacing: 0.18em;
          min-height: 48px;
          padding: 14px 30px;
          text-decoration: none;
          text-transform: uppercase;
          transition: background 400ms cubic-bezier(0.4,0,0.2,1), color 400ms cubic-bezier(0.4,0,0.2,1), border-color 400ms cubic-bezier(0.4,0,0.2,1);
        }

        .fourcs-button-primary {
          background: #1A1014;
          color: #FBF5F0;
        }

        .fourcs-button-primary:hover {
          background: #2A1E24;
        }

        .fourcs-button-secondary {
          background: transparent;
          border: 0.5px solid #EDD9AF;
          color: #1A1014;
        }

        .fourcs-button-secondary:hover {
          border-color: #C9A961;
          color: #C9A961;
        }

        @media (max-width: 900px) {
          .fourcs-section-grid,
          .fourcs-section-reverse .fourcs-copy,
          .fourcs-section-reverse .fourcs-visual-panel,
          .fourcs-lab-grid {
            grid-column: auto;
            grid-row: auto;
            grid-template-columns: 1fr;
          }

          .fourcs-section-reverse .fourcs-visual-panel {
            grid-row: 2;
          }

          .fourcs-stat-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .fourcs-hero,
          .fourcs-section,
          .fourcs-lab,
          .fourcs-cta {
            padding-left: 20px;
            padding-right: 20px;
          }

          .cut-grade,
          .clarity-row,
          .color-group {
            align-items: flex-start;
            flex-direction: column;
            gap: 6px;
          }

          .carat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .carat-item svg {
            height: 96px;
            width: 96px;
          }

          .fourcs-cta-actions,
          .fourcs-button {
            width: 100%;
          }
        }
      `}</style>

      <section className="fourcs-hero">
        <div className="fourcs-container">
          <p className="fourcs-label">EDUCATION</p>
          <h1>The 4 Cs of Diamonds</h1>
          <p className="fourcs-hero-copy">Everything you need to know to choose your perfect diamond with confidence.</p>
        </div>
      </section>

      <FourCSection
        body={[
          "Cut refers to how well a diamond's facets interact with light. It is the only C determined by human craftsmanship - not nature. A perfectly cut diamond will appear brilliant and alive, regardless of its other grades.",
          'A well-cut diamond reflects light from one facet to another and disperses it through the top of the stone. A poorly cut diamond allows light to escape from the sides and bottom, making it appear dull and lifeless.',
        ]}
        heading="The most important C"
        label="01 - CUT"
        note="We only carry Excellent and Very Good cut lab-grown diamonds. Life is too short for a dull diamond."
        number="01"
      >
        <CutVisual />
      </FourCSection>

      <FourCSection
        body={[
          'Diamond color is graded on a scale from D (completely colorless) to Z (light yellow or brown). The closer to D, the rarer and more valuable the stone.',
          'For lab-grown diamonds, we recommend staying in the D-H range for a bright, white appearance. The difference between D and G is virtually invisible to the naked eye but significant in price.',
        ]}
        heading="Less color, more value"
        label="02 - COLOR"
        note="Our sweet spot: F-H color. Maximum brilliance, excellent value."
        number="02"
        reverse
      >
        <ColorVisual />
      </FourCSection>

      <FourCSection
        body={[
          'Clarity refers to the presence of internal inclusions or external blemishes. Every diamond has unique characteristics formed during its creation - in nature or in a lab.',
          'Most inclusions are microscopic and invisible to the naked eye. A VS1 diamond looks identical to a Flawless diamond in real life, but costs significantly less.',
        ]}
        heading="Flaws you will never see"
        label="03 - CLARITY"
        note="Our recommendation: VS1-VS2. Eye clean, beautiful, and great value."
        number="03"
      >
        <ClarityVisual />
      </FourCSection>

      <FourCSection
        body={[
          'Carat refers to the weight of a diamond, not its size. One carat equals 0.2 grams. While carat weight affects price significantly, two diamonds of equal carat can look very different in size depending on their cut.',
          'A well-cut 0.9ct diamond can appear larger than a poorly cut 1.0ct stone. Always prioritize cut over carat.',
        ]}
        heading="Size is not everything"
        label="04 - CARAT"
        note="Lab-grown diamonds are 60-80% less expensive than mined diamonds of the same carat weight. This means you can go bigger without compromise."
        number="04"
        reverse
      >
        <CaratVisual />
      </FourCSection>

      <section className="fourcs-lab">
        <div className="fourcs-lab-grid">
          <div>
            <p className="fourcs-label">LAB GROWN</p>
            <h2>Why lab-grown changes everything</h2>
            <p>
              Lab-grown diamonds are chemically, physically and optically identical to mined diamonds. The same carbon atoms. The same crystal structure. The same fire and brilliance.
            </p>
            <p>
              The difference? No mining. No conflict. No environmental destruction. And a price that makes sense.
            </p>
          </div>
          <div className="fourcs-stat-grid">
            {labStats.map((stat, index) => (
              <div className="fourcs-stat" key={stat}>
                <strong>{String(index + 1).padStart(2, '0')}</strong>
                {stat}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fourcs-cta">
        <div className="fourcs-container">
          <h2>Ready to find your diamond?</h2>
          <div className="fourcs-cta-actions">
            <Link className="fourcs-button fourcs-button-primary" href="/diamonds">
              SHOP DIAMONDS
            </Link>
            <Link className="fourcs-button fourcs-button-secondary" href="/build">
              BUILD A RING
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

"use client"

import Image from 'next/image'
import Link from 'next/link'

const sizeRows = [
  ['3', 'F', '44', '14.0'],
  ['3.5', 'G1/2', '45.5', '14.4'],
  ['4', 'H', '46.7', '14.8'],
  ['4.5', 'I1/2', '48', '15.2'],
  ['5', 'J1/2', '49.3', '15.7'],
  ['5.5', 'K1/2', '50.6', '16.1'],
  ['6', 'L1/2', '51.9', '16.5'],
  ['6.5', 'M1/2', '53.1', '16.9'],
  ['7', 'N1/2', '54.4', '17.3'],
  ['7.5', 'O1/2', '55.7', '17.7'],
  ['8', 'P1/2', '57', '18.1'],
  ['8.5', 'Q1/2', '58.3', '18.5'],
  ['9', 'R1/2', '59.5', '18.9'],
  ['9.5', 'S1/2', '60.8', '19.4'],
  ['10', 'T1/2', '62.1', '19.8'],
]

const methods = [
  {
    num: '01',
    title: 'Existing ring',
    desc: 'Measure the inside diameter of a ring you already wear comfortably on the correct finger.',
    detail: 'Most accurate method',
  },
  {
    num: '02',
    title: 'String method',
    desc: 'Wrap a string or strip of paper around the base of your finger. Mark where it overlaps.',
    detail: 'No tools needed',
  },
  {
    num: '03',
    title: 'Free ring sizer',
    desc: 'Request our complimentary plastic ring sizer mailed directly to your address.',
    detail: 'Most reliable',
  },
]

export default function RingSizeGuidePage() {
  return (
    <div style={{ background: '#FBF5F0', minHeight: '100vh' }}>
      <style>{`
        .ring-size-hero,
        .ring-size-tips {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        .method-card:hover {
          border-color: #C9A961 !important;
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(26,16,20,0.06);
        }

        @media (max-width: 768px) {
          .ring-size-hero,
          .ring-size-tips {
            grid-template-columns: 1fr;
          }

          .ring-size-hero-copy,
          .ring-size-section,
          .ring-size-dark-cta {
            padding-left: 28px !important;
            padding-right: 28px !important;
          }

          .ring-size-hero-image {
            height: 340px !important;
            order: -1;
          }

          .ring-size-methods {
            grid-template-columns: 1fr !important;
          }

          .ring-size-chart {
            overflow-x: auto;
          }

          .ring-size-chart-row {
            min-width: 620px;
          }
        }
      `}</style>

      <section className="ring-size-hero" style={{ minHeight: '70vh', alignItems: 'center' }}>
        <div className="ring-size-hero-copy" style={{ padding: '0 80px' }}>
          <Link href="/" style={{ fontSize: '11px', color: 'var(--color-muted-text)', textDecoration: 'none', letterSpacing: '0.1em', fontFamily: 'var(--font-inter)' }}>
            Back to home
          </Link>

          <div style={{ fontSize: '10px', letterSpacing: '0.32em', color: '#C9A961', marginTop: '40px', marginBottom: '14px', fontFamily: 'var(--font-inter)' }}>
            EDUCATION / RING SIZE GUIDE
          </div>

          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 400, color: '#1A1014', lineHeight: 1, marginBottom: '8px' }}>
            Find your
          </h1>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 400, fontStyle: 'italic', color: '#C9A961', lineHeight: 1, marginBottom: '24px' }}>
            perfect fit.
          </h1>

          <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', lineHeight: 1.85, maxWidth: '460px', marginBottom: '32px', fontFamily: 'var(--font-inter)' }}>
            A ring that fits well sits snugly without pinching, slides over your knuckle with gentle resistance, and feels invisible on your finger.
          </p>

          <a href="#measure" style={{ display: 'inline-block', background: '#1A1014', color: '#FBF5F0', padding: '14px 32px', fontSize: '11px', letterSpacing: '0.2em', textDecoration: 'none', fontFamily: 'var(--font-inter)' }}>
            MEASURE NOW
          </a>
        </div>

        <div className="ring-size-hero-image" style={{ height: '70vh', overflow: 'hidden', position: 'relative' }}>
          <Image
            src="https://images.unsplash.com/photo-1591209627864-d2c34a36e0c5?w=900&q=85"
            alt="Ring sizing"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
      </section>

      <section id="measure" className="ring-size-section" style={{ padding: '96px 80px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.32em', color: '#C9A961', marginBottom: '14px', fontFamily: 'var(--font-inter)' }}>
            THREE WAYS TO MEASURE
          </div>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(32px,4vw,48px)', fontWeight: 400, color: '#1A1014' }}>
            Choose your method
          </h2>
        </div>

        <div className="ring-size-methods" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
          {methods.map((method) => (
            <div key={method.num} className="method-card" style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '40px 32px', textAlign: 'left', transition: 'all 0.3s' }}>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '36px', color: '#C9A961', marginBottom: '16px', lineHeight: 1 }}>
                {method.num}
              </div>
              <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', fontWeight: 400, color: '#1A1014', marginBottom: '12px' }}>
                {method.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: 1.75, marginBottom: '20px', fontFamily: 'var(--font-inter)' }}>
                {method.desc}
              </p>
              <div style={{ fontSize: '10px', letterSpacing: '0.18em', color: '#C9A961', fontFamily: 'var(--font-inter)', paddingTop: '16px', borderTop: '0.5px solid #EDD9AF' }}>
                {method.detail}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="ring-size-section" style={{ background: '#FDF8F2', padding: '96px 80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.32em', color: '#C9A961', marginBottom: '14px', fontFamily: 'var(--font-inter)' }}>
              CONVERSION CHART
            </div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px,3vw,38px)', fontWeight: 400, color: '#1A1014' }}>
              International ring sizes
            </h2>
          </div>

          <div className="ring-size-chart" style={{ background: '#FBF5F0', border: '0.5px solid #EDD9AF', overflow: 'hidden' }}>
            <div className="ring-size-chart-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '14px 24px', background: '#1A1014', color: '#C9A961', fontSize: '10px', letterSpacing: '0.18em', fontFamily: 'var(--font-inter)' }}>
              <div>US SIZE</div>
              <div>UK SIZE</div>
              <div>EU SIZE</div>
              <div>DIAMETER (MM)</div>
            </div>

            {sizeRows.map((row, index) => (
              <div key={row[0]} className="ring-size-chart-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '14px 24px', borderBottom: index < sizeRows.length - 1 ? '0.5px solid #EDD9AF' : 'none', fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#1A1014', background: index % 2 === 0 ? '#FBF5F0' : '#FDF8F2' }}>
                <div style={{ fontWeight: 500, color: '#C9A961' }}>{row[0]}</div>
                <div>{row[1]}</div>
                <div>{row[2]}</div>
                <div>{row[3]} mm</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ring-size-section" style={{ padding: '96px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div className="ring-size-tips" style={{ gap: '64px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '0.32em', color: '#C9A961', marginBottom: '14px', fontFamily: 'var(--font-inter)' }}>
              SIZING TIPS
            </div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px,3vw,38px)', fontWeight: 400, color: '#1A1014', marginBottom: '24px', lineHeight: 1.1 }}>
              For the best measurement
            </h2>

            <ul style={{ listStyle: 'none', padding: 0, fontSize: '14px', color: '#1A1014', lineHeight: 2, fontFamily: 'var(--font-inter)' }}>
              {[
                'Measure at the end of the day when fingers are largest',
                'Avoid measuring when cold because fingers shrink',
                'Measure the exact finger you will wear it on',
                'Knuckle larger than base? Size up half a step',
                'Wider bands over 4mm fit tighter, so size up',
                'Resize once free within 60 days of purchase',
              ].map((tip) => (
                <li key={tip} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ color: '#C9A961', flexShrink: 0 }}>+</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ background: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '40px 32px' }}>
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', color: '#1A1014', marginBottom: '8px' }}>
              Need a free sizer?
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: 1.75, marginBottom: '24px', fontFamily: 'var(--font-inter)' }}>
              We will mail you a complimentary plastic ring sizer with 27 ring sizes to find your perfect fit.
            </p>

            <input
              placeholder="your@email.com"
              style={{ width: '100%', padding: '12px 16px', background: '#FBF5F0', border: '0.5px solid #EDD9AF', fontSize: '13px', marginBottom: '12px', outline: 'none', fontFamily: 'var(--font-inter)', color: '#1A1014' }}
            />
            <button style={{ width: '100%', padding: '14px', background: '#1A1014', color: '#FBF5F0', border: 'none', fontSize: '11px', letterSpacing: '0.2em', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
              REQUEST FREE SIZER
            </button>

            <p style={{ fontSize: '10px', color: 'var(--color-muted-text)', marginTop: '12px', textAlign: 'center', fontFamily: 'var(--font-inter)' }}>
              Ships in 2-3 days / Free worldwide
            </p>
          </div>
        </div>
      </section>

      <section className="ring-size-dark-cta" style={{ background: '#1A1014', padding: '64px 80px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', fontSize: 'clamp(24px,3vw,36px)', color: '#FBF5F0', marginBottom: '8px' }}>
          Found your size?
        </div>
        <p style={{ fontSize: '13px', color: 'rgba(184,160,144,0.8)', marginBottom: '28px', fontFamily: 'var(--font-inter)' }}>
          Browse our complete ring collection
        </p>
        <Link href="/products?type=engagement_ring" style={{ display: 'inline-block', background: '#FBF5F0', color: '#1A1014', padding: '14px 36px', fontSize: '11px', letterSpacing: '0.2em', textDecoration: 'none', fontFamily: 'var(--font-inter)' }}>
          SHOP RINGS
        </Link>
      </section>
    </div>
  )
}

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Gem, Heart, Search, ShoppingBag, Sparkles } from 'lucide-react'
import { gsap } from 'gsap'
import Lenis from 'lenis'
import * as THREE from 'three'

const palette = {
  pearl: '#FBF5F0',
  gold: '#C9A961',
  blush: '#E8C4D0',
  noir: '#1A1014',
  taupe: '#B8A090',
  ivory: '#FDF8F2',
  petal: '#FCF0F4',
  rose: '#F5E8ED',
  goldTint: '#EDD9AF',
} as const

const jewelryImages = [
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1603974372039-adc49044b6bd?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1589674781759-c21c37956a44?auto=format&fit=crop&w=900&q=85',
]

const featurePanels = [
  {
    eyebrow: 'CULTIVATED LIGHT',
    title: 'Solar-grown brilliance, cut for everyday ceremony.',
    body: 'Each lab-grown diamond is selected for fire, balance, and quiet drama before being set in recycled gold.',
    stat: '0',
    statLabel: 'MINING REQUIRED',
    img: jewelryImages[1],
  },
  {
    eyebrow: 'PRIVATE APPOINTMENT ENERGY',
    title: 'A digital boutique that feels composed, cinematic, and personal.',
    body: 'Choose the silhouette, metal, and mood, then move from inspiration to selection without breaking the spell.',
    stat: '48',
    statLabel: 'COUNTRIES SERVED',
    img: jewelryImages[4],
  },
]

const shapes = ['Round', 'Oval', 'Emerald', 'Cushion', 'Pear', 'Marquise', 'Princess', 'Asscher', 'Heart']

const reviews = [
  { name: 'Priya M.', place: 'Mumbai', quote: 'Just because. Best decision.', img: jewelryImages[0], height: 260 },
  { name: 'Sarah K.', place: 'Brooklyn', quote: 'The diamond outshines everything.', img: jewelryImages[1], height: 340 },
  { name: 'Aisha R.', place: 'Dubai', quote: 'Three compliments at dinner.', img: jewelryImages[2], height: 300 },
  { name: 'Emma L.', place: 'London', quote: 'Quietly luxurious.', img: jewelryImages[3], height: 380 },
  { name: 'Mia C.', place: 'Paris', quote: 'Worth every penny.', img: jewelryImages[4], height: 320 },
  { name: 'Aaron L.', place: 'Toronto', quote: 'Like a boutique appointment.', img: jewelryImages[5], height: 280 },
  { name: 'Yuki T.', place: 'Tokyo', quote: 'Packaging made me cry.', img: jewelryImages[6], height: 360 },
  { name: 'Zara N.', place: 'New York', quote: 'My everyday ring.', img: jewelryImages[7], height: 310 },
]

function createDiamondGeometry(scale: number) {
  const positions: number[] = []
  const indices: number[] = []
  const girdleRadius = scale
  const tableRadius = 0.56 * scale
  const crownHeight = 0.38 * scale
  const pavilionHeight = 1.08 * scale
  const girdleCount = 32
  const tableCount = 8

  for (let index = 0; index < girdleCount; index += 1) {
    const angle = (index / girdleCount) * Math.PI * 2
    positions.push(Math.cos(angle) * girdleRadius, 0.015 * scale, Math.sin(angle) * girdleRadius)
    positions.push(Math.cos(angle) * girdleRadius, -0.015 * scale, Math.sin(angle) * girdleRadius)
  }

  const tableStart = girdleCount * 2
  for (let index = 0; index < tableCount; index += 1) {
    const angle = (index / tableCount) * Math.PI * 2 + Math.PI / tableCount
    positions.push(Math.cos(angle) * tableRadius, crownHeight, Math.sin(angle) * tableRadius)
  }

  positions.push(0, crownHeight, 0)
  const tableCenterIndex = tableStart + tableCount
  positions.push(0, -pavilionHeight, 0)
  const culetIndex = tableCenterIndex + 1

  for (let index = 0; index < girdleCount; index += 1) {
    const g0 = index * 2
    const g1 = ((index + 1) % girdleCount) * 2
    const t0 = tableStart + (Math.floor((index * tableCount) / girdleCount) % tableCount)
    const t1 = tableStart + ((Math.floor((index * tableCount) / girdleCount) + 1) % tableCount)
    indices.push(g0, g1, t0)
    if (index % (girdleCount / tableCount) === girdleCount / tableCount - 1) {
      indices.push(t0, g1, t1)
    }
  }

  for (let index = 0; index < tableCount; index += 1) {
    indices.push(tableCenterIndex, tableStart + index, tableStart + ((index + 1) % tableCount))
  }

  for (let index = 0; index < girdleCount; index += 1) {
    const g0 = index * 2 + 1
    const g1 = ((index + 1) % girdleCount) * 2 + 1
    indices.push(g0, culetIndex, g1)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function useCounters(isLoaded: boolean) {
  const [counters, setCounters] = useState({ customers: 0, reviews: 0, countries: 0, mining: 0 })

  useEffect(() => {
    if (!isLoaded) return

    const targets = { customers: 29847, reviews: 2847, countries: 48, mining: 0 }
    const duration = 2500
    const start = performance.now()
    let rafId = 0

    const tick = (time: number) => {
      const progress = Math.min((time - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 4
      setCounters({
        customers: Math.floor(targets.customers * eased),
        reviews: Math.floor(targets.reviews * eased),
        countries: Math.floor(targets.countries * eased),
        mining: 0,
      })

      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isLoaded])

  return counters
}

export default function TestExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const scrollRef = useRef(0)
  const [loaded, setLoaded] = useState(false)
  const [activeShape, setActiveShape] = useState('Round')
  const counters = useCounters(loaded)

  const galleryRow = useMemo(() => [...jewelryImages, ...jewelryImages], [])

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.35,
      easing: (value: number) => Math.min(1, 1.001 - 2 ** (-10 * value)),
      smoothWheel: true,
    })

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }

    const handleMouse = (event: MouseEvent) => {
      mouseRef.current = {
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2,
      }
    }

    const handleScroll = () => {
      scrollRef.current = window.scrollY
    }

    rafId = requestAnimationFrame(raf)
    window.addEventListener('mousemove', handleMouse)
    window.addEventListener('scroll', handleScroll)

    const timer = window.setTimeout(() => setLoaded(true), 520)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      window.clearTimeout(timer)
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    if (!loaded) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.scene-reveal',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.1 }
      )
    })

    return () => ctx.revert()
  }, [loaded])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x1a1014, 0.045)

    const camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 0.2, 5.6)

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x1a1014, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.85

    const diamondGeometry = createDiamondGeometry(1)
    const diamondMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xfdf8f2,
      metalness: 0,
      roughness: 0.03,
      transmission: 1,
      thickness: 2.2,
      ior: 2.42,
      reflectivity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0,
      iridescence: 0.35,
      iridescenceIOR: 1.8,
      transparent: true,
      opacity: 0.98,
      envMapIntensity: 4,
      side: THREE.DoubleSide,
    })
    const diamond = new THREE.Mesh(diamondGeometry, diamondMaterial)
    scene.add(diamond)

    const glowGeometry = createDiamondGeometry(1.08)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xc9a961,
      transparent: true,
      opacity: 0.045,
      side: THREE.BackSide,
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    scene.add(glow)

    scene.add(new THREE.AmbientLight(0x1a1014, 2.6))

    const key = new THREE.PointLight(0xc9a961, 18, 24)
    key.position.set(4, 6, 4)
    scene.add(key)

    const fill = new THREE.PointLight(0xedd9af, 12, 22)
    fill.position.set(-4, 2, 3)
    scene.add(fill)

    const rim = new THREE.PointLight(0xe8c4d0, 8, 18)
    rim.position.set(0, -3, -5)
    scene.add(rim)

    const sparkles = Array.from({ length: 4 }, (_, index) => {
      const sparkle = new THREE.PointLight(index % 2 === 0 ? 0xc9a961 : 0xe8c4d0, 3, 8)
      scene.add(sparkle)
      return sparkle
    })

    const particleCount = 650
    const particlePositions = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)
    const colors = [new THREE.Color(0xc9a961), new THREE.Color(0xedd9af), new THREE.Color(0xe8c4d0), new THREE.Color(0xfbf5f0)]

    for (let index = 0; index < particleCount; index += 1) {
      const angle = Math.random() * Math.PI * 2
      const radius = 3 + Math.random() * 12
      particlePositions[index * 3] = Math.cos(angle) * radius
      particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 18
      particlePositions[index * 3 + 2] = Math.sin(angle) * radius - 4

      const color = colors[Math.floor(Math.random() * colors.length)]
      particleColors[index * 3] = color.r
      particleColors[index * 3 + 1] = color.g
      particleColors[index * 3 + 2] = color.b
    }

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))

    const particleMaterial = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.055,
      transparent: true,
      opacity: 0.82,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    })

    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    const startTime = performance.now()
    let rafId = 0

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      const time = (performance.now() - startTime) / 1000
      const mouse = mouseRef.current
      const scroll = scrollRef.current

      diamond.rotation.y += (mouse.x * 0.5 + time * 0.12 - diamond.rotation.y) * 0.025
      diamond.rotation.x += (mouse.y * 0.25 - diamond.rotation.x) * 0.025
      diamond.position.y = Math.sin(time * 0.45) * 0.16

      glow.rotation.copy(diamond.rotation)
      glow.position.copy(diamond.position)

      camera.position.z = 5.6 + Math.min(scroll / 220, 2.6)
      camera.position.y = -scroll * 0.002
      camera.lookAt(0, -scroll * 0.002, 0)

      sparkles.forEach((sparkle, index) => {
        const angle = time * (0.8 + index * 0.16) + index
        sparkle.position.set(Math.cos(angle) * 2.4, Math.sin(angle * 0.7) * 1.7, Math.sin(angle) * 2.4)
        sparkle.intensity = 2.2 + Math.sin(time * 2 + index) * 1.4
      })

      const positionAttribute = particles.geometry.attributes.position
      for (let index = 0; index < particleCount; index += 1) {
        positionAttribute.array[index * 3 + 1] += 0.004
        if (positionAttribute.array[index * 3 + 1] > 9) {
          positionAttribute.array[index * 3 + 1] = -9
        }
      }
      positionAttribute.needsUpdate = true
      particles.rotation.y += 0.0005

      renderer.render(scene, camera)
    }

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    animate()
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      diamondGeometry.dispose()
      diamondMaterial.dispose()
      glowGeometry.dispose()
      glowMaterial.dispose()
      particleGeometry.dispose()
      particleMaterial.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <main className="experience-page">
      {!loaded && (
        <div className="loader">
          <div className="loader-logo">
            <span>just</span>
            <strong>BECAUSE</strong>
          </div>
          <div className="loader-line" />
        </div>
      )}

      <canvas ref={canvasRef} className="diamond-canvas" aria-hidden="true" />

      <header className="topbar scene-reveal">
        <Link href="/" className="logo-lockup" aria-label="Just Because home">
          <span>just</span>
          <strong>BECAUSE</strong>
        </Link>
        <nav className="desktop-nav" aria-label="Test experience navigation">
          {['Collection', 'Diamonds', 'Build', 'Story'].map((item) => (
            <a key={item} href="#collection">
              {item}
            </a>
          ))}
        </nav>
        <div className="icon-row" aria-label="Shopping tools">
          <Search size={18} strokeWidth={1.5} />
          <Heart size={18} strokeWidth={1.5} />
          <ShoppingBag size={18} strokeWidth={1.5} />
        </div>
      </header>

      <section className="hero">
        <div className="hero-vignette" />
        <div className="hero-copy">
          <p className="eyebrow scene-reveal">LAB-GROWN DIAMONDS / 18K RECYCLED GOLD</p>
          <h1 className="scene-reveal">
            A reason,
            <span>in itself.</span>
          </h1>
          <p className="hero-body scene-reveal">
            Cinematic lab-grown diamond jewelry for the moment that arrives before the explanation.
          </p>
          <div className="cta-row scene-reveal">
            <Link href="/products" className="primary-cta">
              SHOP THE COLLECTION
            </Link>
            <Link href="/build" className="secondary-cta">
              BUILD A RING
            </Link>
          </div>
        </div>
        <aside className="floating-card scene-reveal" aria-label="Featured product">
          <div>
            <span>FEATURED CUT</span>
            <strong>Solis Oval Ring</strong>
          </div>
          <p>IGI certified / 9 ct / recycled gold</p>
        </aside>
        <div className="igi-badge scene-reveal">
          <Gem size={18} strokeWidth={1.5} />
          <span>IGI CERTIFIED</span>
        </div>
      </section>

      <section className="marquee-band" aria-label="Brand promises">
        <div>
          {Array.from({ length: 2 }).map((_, groupIndex) => (
            <span key={groupIndex}>
              LAB-GROWN LIGHT / RECYCLED GOLD / IGI CERTIFIED / NO MINING / A REASON IN ITSELF /
            </span>
          ))}
        </div>
      </section>

      <section className="stats-section">
        {[
          { value: `${counters.customers.toLocaleString()}+`, label: 'CUSTOMERS' },
          { value: counters.reviews.toLocaleString(), label: 'REVIEWS' },
          { value: counters.countries.toString(), label: 'COUNTRIES' },
          { value: counters.mining.toString(), label: 'MINING' },
        ].map((item) => (
          <div className="stat-card scene-reveal" key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </section>

      <section className="gallery-section" id="collection">
        <div className="section-heading scene-reveal">
          <p className="eyebrow">THE CINEMATIC EDIT</p>
          <h2>
            Jewelry with <span>motion</span> and memory.
          </h2>
        </div>
        <div className="infinite-gallery">
          <div className="gallery-row scroll-left">
            {galleryRow.map((src, index) => (
              <Image key={`${src}-a-${index}`} src={src} alt="" width={320} height={420} sizes="320px" />
            ))}
          </div>
          <div className="gallery-row scroll-right">
            {galleryRow.map((src, index) => (
              <Image key={`${src}-b-${index}`} src={src} alt="" width={320} height={420} sizes="320px" />
            ))}
          </div>
        </div>
      </section>

      {featurePanels.map((feature, index) => (
        <section className="feature-section" key={feature.eyebrow}>
          <div className={`feature-grid ${index % 2 === 1 ? 'is-reversed' : ''}`}>
            <div className="feature-copy scene-reveal">
              <p className="eyebrow">{feature.eyebrow}</p>
              <h2>{feature.title}</h2>
              <p>{feature.body}</p>
              <div className="corner-stat">
                <strong>{feature.stat}</strong>
                <span>{feature.statLabel}</span>
              </div>
            </div>
            <div className="feature-image scene-reveal">
              <Image src={feature.img} alt={feature.title} fill sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
          </div>
        </section>
      ))}

      <section className="shape-section">
        <div className="section-heading scene-reveal">
          <p className="eyebrow">FIND YOUR DIAMOND</p>
          <h2>
            Find your diamond&apos;s <span>silhouette.</span>
          </h2>
        </div>
        <div className="shape-strip scene-reveal">
          {shapes.map((shape) => (
            <button
              className={activeShape === shape ? 'is-active' : ''}
              key={shape}
              type="button"
              onClick={() => setActiveShape(shape)}
            >
              <Sparkles size={22} strokeWidth={1.4} />
              <span>{shape.toUpperCase()}</span>
            </button>
          ))}
        </div>
        <div className="selected-shape scene-reveal">
          <span>
            Selected: <strong>{activeShape} Cut</strong>
          </span>
          <Link href={`/diamonds?shape=${activeShape.toLowerCase()}`}>SHOP {activeShape.toUpperCase()}</Link>
        </div>
      </section>

      <section className="masonry-section">
        <div className="section-heading scene-reveal">
          <p className="eyebrow">REAL WEARERS</p>
          <h2>
            Words from real <span>wearers.</span>
          </h2>
          <p className="stars">★★★★★</p>
          <small>4.9 / 5 - 2,847 verified reviews</small>
        </div>
        <div className="masonry-grid">
          {reviews.map((item) => (
            <article className="review-tile scene-reveal" key={`${item.name}-${item.place}`} style={{ height: item.height }}>
              <Image src={item.img} alt={`${item.name} wearing Just Because jewelry`} fill sizes="(max-width: 900px) 50vw, 25vw" />
              <div>
                <span>★★★★★</span>
                <p>&quot;{item.quote}&quot;</p>
                <small>
                  {item.name} / {item.place}
                </small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="manifesto-section">
        <p className="eyebrow scene-reveal">JUST BECAUSE</p>
        <h2 className="scene-reveal">
          You do not need a reason.
          <span>That is exactly the point.</span>
        </h2>
        <div className="cta-row scene-reveal">
          <Link href="/products" className="primary-cta">
            START YOUR STORY
          </Link>
          <Link href="/diamonds" className="secondary-cta">
            BROWSE DIAMONDS
          </Link>
        </div>
      </section>

      <footer className="experience-footer">
        <div className="footer-grid">
          <div>
            <Link href="/" className="logo-lockup">
              <span>just</span>
              <strong>BECAUSE</strong>
            </Link>
            <p>Lab-grown diamonds and recycled gold, for every moment that does not need a name.</p>
          </div>
          {[
            ['SHOP', 'Engagement', 'Rings', 'Necklaces', 'Earrings'],
            ['LEARN', 'Our Process', 'The 4 Cs', 'Lab vs Natural', 'IGI Certs'],
            ['SUPPORT', 'Contact', 'Returns', 'Sizing', 'Shipping'],
          ].map(([title, ...links]) => (
            <div key={title}>
              <h3>{title}</h3>
              {links.map((label) => (
                <Link key={label} href="/products">
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>2026 Just Because - All rights reserved</span>
          <span>IGI CERTIFIED / GCAL VERIFIED / CARBON NEUTRAL</span>
        </div>
      </footer>

      <style jsx global>{`
        body:has(.experience-page) > header,
        body:has(.experience-page) > footer,
        body:has(.experience-page) > div:has(button[aria-label='Chat with us']) {
          display: none !important;
        }

        body:has(.experience-page) > main {
          background: ${palette.noir};
          margin: 0;
          padding: 0;
        }
      `}</style>

      <style jsx>{`
        .experience-page {
          background: ${palette.noir};
          color: ${palette.pearl};
          font-family: var(--font-inter), sans-serif;
          min-height: 100vh;
          overflow: hidden;
          position: relative;
        }

        .loader {
          align-items: center;
          background: ${palette.noir};
          display: flex;
          flex-direction: column;
          gap: 18px;
          inset: 0;
          justify-content: center;
          position: fixed;
          z-index: 100;
        }

        .loader-logo,
        .logo-lockup {
          align-items: baseline;
          color: ${palette.gold};
          display: inline-flex;
          gap: 8px;
          text-decoration: none;
        }

        .loader-logo span,
        .logo-lockup span {
          font-family: var(--font-italianno), cursive;
          font-size: 42px;
          line-height: 0.8;
        }

        .loader-logo strong,
        .logo-lockup strong {
          color: ${palette.pearl};
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.34em;
        }

        .loader-line {
          animation: expandLine 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          background: linear-gradient(90deg, rgba(201, 169, 97, 0), ${palette.gold}, rgba(201, 169, 97, 0));
          height: 1px;
          width: 48px;
        }

        .diamond-canvas {
          height: 100vh;
          inset: 0;
          position: fixed;
          width: 100vw;
          z-index: 1;
        }

        .topbar {
          align-items: center;
          display: flex;
          justify-content: space-between;
          left: 0;
          padding: 28px clamp(24px, 5vw, 72px);
          position: fixed;
          right: 0;
          top: 0;
          z-index: 20;
        }

        .desktop-nav {
          display: flex;
          gap: 30px;
        }

        .desktop-nav a,
        .footer-grid a {
          color: rgba(251, 245, 240, 0.68);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-decoration: none;
          transition: color 400ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .desktop-nav a:hover,
        .footer-grid a:hover {
          color: ${palette.gold};
        }

        .icon-row {
          color: ${palette.pearl};
          display: flex;
          gap: 18px;
        }

        .hero {
          align-items: center;
          display: flex;
          min-height: 100vh;
          padding: 120px clamp(24px, 7vw, 96px) 80px;
          position: relative;
          z-index: 5;
        }

        .hero-vignette {
          background:
            radial-gradient(circle at 72% 48%, rgba(201, 169, 97, 0.18), rgba(201, 169, 97, 0) 32%),
            linear-gradient(90deg, ${palette.noir} 0%, rgba(26, 16, 20, 0.82) 42%, rgba(26, 16, 20, 0.16) 100%);
          inset: 0;
          pointer-events: none;
          position: absolute;
          z-index: -1;
        }

        .hero-copy {
          max-width: 640px;
        }

        .eyebrow {
          color: ${palette.gold};
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.3em;
          margin: 0 0 18px;
        }

        .hero h1,
        .section-heading h2,
        .feature-copy h2,
        .manifesto-section h2 {
          font-family: var(--font-playfair), serif;
          font-weight: 400;
        }

        .hero h1 {
          font-size: clamp(62px, 11vw, 136px);
          letter-spacing: 0;
          line-height: 0.9;
          margin: 0;
        }

        .hero h1 span,
        .section-heading h2 span,
        .manifesto-section h2 span {
          color: ${palette.gold};
          display: block;
          font-style: italic;
        }

        .hero-body {
          color: rgba(184, 160, 144, 0.8);
          font-size: clamp(14px, 1.3vw, 18px);
          line-height: 1.9;
          margin: 32px 0 0;
          max-width: 520px;
        }

        .cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 42px;
        }

        .primary-cta,
        .secondary-cta {
          align-items: center;
          border: 0.5px solid ${palette.goldTint};
          display: inline-flex;
          font-size: 11px;
          font-weight: 500;
          justify-content: center;
          letter-spacing: 0.18em;
          min-height: 52px;
          padding: 0 30px;
          text-decoration: none;
          transition:
            background-color 500ms cubic-bezier(0.4, 0, 0.2, 1),
            color 500ms cubic-bezier(0.4, 0, 0.2, 1),
            transform 500ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .primary-cta {
          background: ${palette.gold};
          color: ${palette.noir};
        }

        .secondary-cta {
          background: rgba(251, 245, 240, 0.02);
          color: ${palette.pearl};
        }

        .primary-cta:hover,
        .secondary-cta:hover {
          transform: translateY(-3px);
        }

        .floating-card,
        .igi-badge {
          backdrop-filter: blur(18px);
          background: rgba(251, 245, 240, 0.045);
          border: 0.5px solid rgba(237, 217, 175, 0.32);
          position: absolute;
          z-index: 8;
        }

        .floating-card {
          bottom: 11%;
          padding: 22px;
          right: clamp(24px, 7vw, 110px);
          width: min(280px, calc(100vw - 48px));
        }

        .floating-card span,
        .floating-card p,
        .igi-badge span {
          color: rgba(184, 160, 144, 0.82);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
        }

        .floating-card strong {
          color: ${palette.pearl};
          display: block;
          font-family: var(--font-playfair), serif;
          font-size: 22px;
          font-weight: 400;
          margin-top: 8px;
        }

        .floating-card p {
          line-height: 1.7;
          margin: 18px 0 0;
        }

        .igi-badge {
          align-items: center;
          color: ${palette.gold};
          display: flex;
          gap: 8px;
          padding: 14px 18px;
          right: clamp(24px, 12vw, 180px);
          top: 24%;
        }

        .marquee-band {
          background: ${palette.gold};
          color: ${palette.noir};
          overflow: hidden;
          padding: 16px 0;
          position: relative;
          z-index: 6;
        }

        .marquee-band div {
          animation: marquee 22s linear infinite;
          display: flex;
          white-space: nowrap;
          width: max-content;
        }

        .marquee-band span {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.24em;
          padding-right: 48px;
        }

        .stats-section {
          background: ${palette.noir};
          border-bottom: 0.5px solid rgba(237, 217, 175, 0.18);
          border-top: 0.5px solid rgba(237, 217, 175, 0.18);
          display: grid;
          gap: 1px;
          grid-template-columns: repeat(4, 1fr);
          padding: 0 clamp(20px, 5vw, 72px);
          position: relative;
          z-index: 6;
        }

        .stat-card {
          padding: 52px 16px;
          text-align: center;
        }

        .stat-card strong {
          color: ${palette.gold};
          display: block;
          font-family: var(--font-playfair), serif;
          font-size: clamp(34px, 4vw, 58px);
          font-weight: 400;
          line-height: 1;
        }

        .stat-card span {
          color: rgba(184, 160, 144, 0.72);
          display: block;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.24em;
          margin-top: 12px;
        }

        .gallery-section,
        .shape-section,
        .masonry-section,
        .manifesto-section {
          background: ${palette.noir};
          padding: clamp(72px, 10vw, 128px) clamp(20px, 5vw, 80px);
          position: relative;
          z-index: 6;
        }

        .section-heading {
          margin: 0 auto 56px;
          max-width: 780px;
          text-align: center;
        }

        .section-heading h2,
        .manifesto-section h2 {
          color: ${palette.pearl};
          font-size: clamp(34px, 5vw, 68px);
          line-height: 1.08;
          margin: 0;
        }

        .infinite-gallery {
          display: grid;
          gap: 14px;
          margin-inline: calc(clamp(20px, 5vw, 80px) * -1);
          overflow: hidden;
        }

        .gallery-row {
          display: flex;
          gap: 14px;
          width: max-content;
        }

        .gallery-row img {
          aspect-ratio: 4 / 5;
          border: 0.5px solid rgba(237, 217, 175, 0.18);
          height: 280px;
          object-fit: cover;
          transition:
            border-color 500ms cubic-bezier(0.4, 0, 0.2, 1),
            transform 500ms cubic-bezier(0.4, 0, 0.2, 1);
          width: 220px;
        }

        .gallery-row img:hover {
          border-color: ${palette.gold};
          transform: translateY(-6px);
        }

        .scroll-left {
          animation: scrollLeft 36s linear infinite;
        }

        .scroll-right {
          animation: scrollRight 40s linear infinite;
        }

        .feature-section {
          background: ${palette.noir};
          padding: clamp(64px, 10vw, 120px) clamp(20px, 6vw, 96px);
          position: relative;
          z-index: 6;
        }

        .feature-grid {
          align-items: center;
          display: grid;
          gap: clamp(36px, 7vw, 96px);
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
          margin: 0 auto;
          max-width: 1240px;
        }

        .feature-grid.is-reversed .feature-copy {
          order: 2;
        }

        .feature-grid.is-reversed .feature-image {
          order: 1;
        }

        .feature-copy h2 {
          color: ${palette.pearl};
          font-size: clamp(34px, 4vw, 58px);
          line-height: 1.08;
          margin: 0 0 24px;
        }

        .feature-copy > p:not(.eyebrow) {
          color: rgba(184, 160, 144, 0.78);
          font-size: 15px;
          line-height: 1.9;
          margin: 0 0 36px;
          max-width: 520px;
        }

        .corner-stat {
          border: 0.5px solid rgba(237, 217, 175, 0.35);
          display: inline-block;
          padding: 24px 32px;
          position: relative;
        }

        .corner-stat strong {
          color: ${palette.gold};
          display: block;
          font-family: var(--font-playfair), serif;
          font-size: 56px;
          font-weight: 400;
          line-height: 1;
        }

        .corner-stat span {
          color: rgba(184, 160, 144, 0.7);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
        }

        .feature-image {
          aspect-ratio: 4 / 5;
          border: 0.5px solid rgba(237, 217, 175, 0.28);
          overflow: hidden;
          position: relative;
        }

        .feature-image::after,
        .review-tile::after {
          background: linear-gradient(180deg, rgba(26, 16, 20, 0.04), rgba(26, 16, 20, 0.78));
          content: '';
          inset: 0;
          position: absolute;
        }

        .feature-image img,
        .review-tile img {
          object-fit: cover;
        }

        .shape-strip {
          display: flex;
          gap: 12px;
          margin: 0 auto 32px;
          max-width: 1120px;
          overflow-x: auto;
          padding: 4px 0 12px;
          scrollbar-width: none;
        }

        .shape-strip::-webkit-scrollbar {
          display: none;
        }

        .shape-strip button {
          align-items: center;
          background: rgba(251, 245, 240, 0.035);
          border: 0.5px solid rgba(237, 217, 175, 0.2);
          color: rgba(251, 245, 240, 0.65);
          display: flex;
          flex: 0 0 132px;
          flex-direction: column;
          gap: 14px;
          height: 118px;
          justify-content: center;
          transition:
            background-color 500ms cubic-bezier(0.4, 0, 0.2, 1),
            border-color 500ms cubic-bezier(0.4, 0, 0.2, 1),
            color 500ms cubic-bezier(0.4, 0, 0.2, 1),
            transform 500ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .shape-strip button span {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
        }

        .shape-strip button:hover,
        .shape-strip button.is-active {
          background: rgba(201, 169, 97, 0.12);
          border-color: ${palette.gold};
          color: ${palette.gold};
          transform: translateY(-4px);
        }

        .selected-shape {
          align-items: center;
          border: 0.5px solid rgba(237, 217, 175, 0.24);
          display: flex;
          gap: 18px;
          justify-content: center;
          margin: 0 auto;
          max-width: max-content;
          padding: 18px 24px;
        }

        .selected-shape span {
          color: rgba(184, 160, 144, 0.8);
          font-size: 13px;
        }

        .selected-shape strong,
        .selected-shape a {
          color: ${palette.pearl};
          font-weight: 500;
        }

        .selected-shape a {
          color: ${palette.gold};
          font-size: 11px;
          letter-spacing: 0.16em;
          text-decoration: none;
        }

        .stars {
          color: ${palette.gold};
          letter-spacing: 0.18em;
          margin: 18px 0 6px;
        }

        .section-heading small {
          color: rgba(184, 160, 144, 0.66);
          font-size: 12px;
        }

        .masonry-grid {
          column-count: 4;
          column-gap: 14px;
          margin: 0 auto;
          max-width: 1360px;
        }

        .review-tile {
          border: 0.5px solid rgba(237, 217, 175, 0.18);
          break-inside: avoid;
          margin-bottom: 14px;
          overflow: hidden;
          position: relative;
          transition:
            border-color 500ms cubic-bezier(0.4, 0, 0.2, 1),
            transform 500ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .review-tile:hover {
          border-color: ${palette.gold};
          transform: translateY(-4px);
        }

        .review-tile div {
          bottom: 0;
          left: 0;
          padding: 18px;
          position: absolute;
          right: 0;
          z-index: 2;
        }

        .review-tile span {
          color: ${palette.gold};
          display: block;
          font-size: 11px;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }

        .review-tile p {
          color: ${palette.pearl};
          font-family: var(--font-playfair), serif;
          font-size: 16px;
          font-style: italic;
          line-height: 1.35;
          margin: 0 0 8px;
        }

        .review-tile small {
          color: rgba(237, 217, 175, 0.78);
          font-size: 10px;
          letter-spacing: 0.12em;
        }

        .manifesto-section {
          text-align: center;
        }

        .manifesto-section h2 {
          margin: 0 auto;
          max-width: 920px;
        }

        .manifesto-section .cta-row {
          justify-content: center;
        }

        .experience-footer {
          background: ${palette.noir};
          border-top: 0.5px solid rgba(237, 217, 175, 0.18);
          padding: 80px clamp(24px, 6vw, 80px) 32px;
          position: relative;
          z-index: 6;
        }

        .footer-grid {
          display: grid;
          gap: 48px;
          grid-template-columns: 1.5fr repeat(3, 1fr);
          margin: 0 auto 48px;
          max-width: 1240px;
        }

        .footer-grid p {
          color: rgba(184, 160, 144, 0.7);
          font-size: 12px;
          line-height: 1.8;
          max-width: 280px;
        }

        .footer-grid h3 {
          color: rgba(237, 217, 175, 0.78);
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.3em;
          margin: 0 0 18px;
        }

        .footer-grid a {
          display: block;
          line-height: 2.5;
        }

        .footer-bottom {
          border-top: 0.5px solid rgba(237, 217, 175, 0.12);
          color: rgba(184, 160, 144, 0.52);
          display: flex;
          font-size: 10px;
          gap: 24px;
          justify-content: space-between;
          margin: 0 auto;
          max-width: 1240px;
          padding-top: 24px;
        }

        @keyframes expandLine {
          0%,
          100% {
            opacity: 0.4;
            width: 42px;
          }
          50% {
            opacity: 1;
            width: 92px;
          }
        }

        @keyframes marquee {
          to {
            transform: translateX(-50%);
          }
        }

        @keyframes scrollLeft {
          to {
            transform: translateX(-50%);
          }
        }

        @keyframes scrollRight {
          from {
            transform: translateX(-50%);
          }
          to {
            transform: translateX(0);
          }
        }

        @media (max-width: 1024px) {
          .desktop-nav {
            display: none;
          }

          .floating-card {
            bottom: 7%;
          }

          .stats-section {
            grid-template-columns: repeat(2, 1fr);
          }

          .feature-grid,
          .feature-grid.is-reversed {
            grid-template-columns: 1fr;
          }

          .feature-grid.is-reversed .feature-copy,
          .feature-grid.is-reversed .feature-image {
            order: initial;
          }

          .masonry-grid {
            column-count: 2;
          }

          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 720px) {
          .topbar {
            padding: 20px;
          }

          .icon-row {
            gap: 12px;
          }

          .logo-lockup span {
            font-size: 34px;
          }

          .logo-lockup strong {
            font-size: 9px;
            letter-spacing: 0.26em;
          }

          .hero {
            align-items: flex-start;
            min-height: 100svh;
            padding: 132px 20px 56px;
          }

          .hero-vignette {
            background:
              radial-gradient(circle at 50% 56%, rgba(201, 169, 97, 0.14), rgba(201, 169, 97, 0) 34%),
              linear-gradient(180deg, ${palette.noir} 0%, rgba(26, 16, 20, 0.72) 58%, ${palette.noir} 100%);
          }

          .hero h1 {
            font-size: clamp(54px, 18vw, 84px);
          }

          .floating-card {
            bottom: 24px;
            left: 20px;
            right: 20px;
            width: auto;
          }

          .igi-badge {
            display: none;
          }

          .stats-section {
            grid-template-columns: 1fr;
          }

          .stat-card {
            padding: 34px 16px;
          }

          .selected-shape,
          .footer-bottom {
            align-items: flex-start;
            flex-direction: column;
          }

          .masonry-grid {
            column-count: 1;
          }

          .footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import * as THREE from 'three'

const scenePalette = {
  background: '#0A0612',
  surface: '#1A1014',
  pearl: '#FBF5F0',
  gold: '#C9A961',
  brightGold: '#EDD9AF',
  blush: '#E8C4D0',
  fire: '#B8D4F8',
  taupe: '#B8A090',
}

function buildDiamondGeometry(scale = 1) {
  const positions: number[] = []
  const indices: number[] = []
  const girdleRadius = 1 * scale
  const tableRadius = 0.55 * scale
  const crownHeight = 0.38 * scale
  const pavilionHeight = 1.05 * scale
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
    if (index % (girdleCount / tableCount) === (girdleCount / tableCount) - 1) {
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

export default function TestExperience() {
  const heroCanvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const scrollRef = useRef(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (value: number) => Math.min(1, 1.001 - 2 ** (-10 * value)),
      smoothWheel: true,
    })

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    const handleScroll = () => {
      scrollRef.current = window.scrollY
    }

    const handleMouse = (event: MouseEvent) => {
      mouseRef.current = {
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2,
      }
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('mousemove', handleMouse)

    const loadingTimer = window.setTimeout(() => setLoaded(true), 300)

    return () => {
      lenis.destroy()
      cancelAnimationFrame(rafId)
      window.clearTimeout(loadingTimer)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouse)
    }
  }, [])

  useEffect(() => {
    if (!loaded) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.scene-reveal',
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          stagger: 0.12,
        }
      )
    })

    return () => ctx.revert()
  }, [loaded])

  useEffect(() => {
    const canvas = heroCanvasRef.current
    if (!canvas) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x0a0612, 0.035)

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 0, 6)

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.8
    renderer.setClearColor(0x0a0612, 0)

    const diamondGeometry = buildDiamondGeometry(1)
    const diamondMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0,
      transmission: 1,
      thickness: 2.5,
      ior: 2.42,
      reflectivity: 1,
      iridescence: 0.6,
      iridescenceIOR: 1.8,
      clearcoat: 1,
      clearcoatRoughness: 0,
      transparent: true,
      opacity: 1,
      envMapIntensity: 4,
      side: THREE.DoubleSide,
    })

    const diamond = new THREE.Mesh(diamondGeometry, diamondMaterial)
    scene.add(diamond)

    const keyLight = new THREE.PointLight(0xc9a961, 18, 25)
    keyLight.position.set(4, 6, 4)
    scene.add(keyLight)

    const fillLight = new THREE.PointLight(0xb8d4f8, 10, 20)
    fillLight.position.set(-4, 2, 3)
    scene.add(fillLight)

    const rimLight = new THREE.PointLight(0xe8c4d0, 8, 18)
    rimLight.position.set(0, -3, -5)
    scene.add(rimLight)

    const topLight = new THREE.DirectionalLight(0xfffdf5, 4)
    topLight.position.set(0, 10, 5)
    scene.add(topLight)
    scene.add(new THREE.AmbientLight(0x1a1014, 1.5))

    const sparkles: THREE.PointLight[] = []
    for (let index = 0; index < 4; index += 1) {
      const sparkle = new THREE.PointLight(index % 2 ? 0xc9a961 : 0xffffff, 3, 8)
      sparkles.push(sparkle)
      scene.add(sparkle)
    }

    const beams: THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial>[] = []
    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2
      const geometry = new THREE.ConeGeometry(0.15, 12, 4, 1, true)
      geometry.translate(0, 6, 0)
      const material = new THREE.MeshBasicMaterial({
        color: 0xc9a961,
        transparent: true,
        opacity: 0.04,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
      const beam = new THREE.Mesh(geometry, material)
      beam.rotation.z = angle * 0.4
      beam.rotation.x = Math.PI / 3
      beam.position.set(Math.cos(angle) * 3, 0, Math.sin(angle) * 3)
      beams.push(beam)
      scene.add(beam)
    }

    const particleCount = 800
    const particlePositions = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)
    const gold = new THREE.Color(0xc9a961)
    const blush = new THREE.Color(0xe8c4d0)
    const pearl = new THREE.Color(0xfbf5f0)
    const fire = new THREE.Color(0xb8d4f8)

    for (let index = 0; index < particleCount; index += 1) {
      const angle = Math.random() * Math.PI * 2
      const radius = 3 + Math.random() * 14
      const height = (Math.random() - 0.5) * 20
      particlePositions[index * 3] = Math.cos(angle) * radius
      particlePositions[index * 3 + 1] = height
      particlePositions[index * 3 + 2] = Math.sin(angle) * radius - 4

      const random = Math.random()
      const color = random > 0.7 ? gold : random > 0.5 ? blush : random > 0.3 ? fire : pearl
      particleColors[index * 3] = color.r
      particleColors[index * 3 + 1] = color.g
      particleColors[index * 3 + 2] = color.b
    }

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))

    const particleMaterial = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.06,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    })

    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const envScene = new THREE.Scene()
    const envLights = [
      { color: 0xc9a961, position: [5, 5, 5] as const, intensity: 20 },
      { color: 0xb8d4f8, position: [-5, 3, -5] as const, intensity: 15 },
      { color: 0xe8c4d0, position: [3, -4, 4] as const, intensity: 10 },
      { color: 0xfffdf5, position: [0, 8, -3] as const, intensity: 12 },
    ]
    envLights.forEach(({ color, position, intensity }) => {
      const light = new THREE.PointLight(color, intensity)
      light.position.set(position[0], position[1], position[2])
      envScene.add(light)
      envScene.add(new THREE.AmbientLight(color, 1))
    })
    const envMap = pmrem.fromScene(envScene).texture
    scene.environment = envMap
    pmrem.dispose()

    const startTime = performance.now()
    let rafId = 0

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      const time = (performance.now() - startTime) / 1000
      const mouse = mouseRef.current
      const scroll = scrollRef.current

      diamond.rotation.y += (mouse.x * 0.5 - diamond.rotation.y + time * 0.15) * 0.02
      diamond.rotation.x += (mouse.y * 0.3 - diamond.rotation.x) * 0.02
      diamond.position.y = Math.sin(time * 0.4) * 0.15

      camera.position.z = 6 + Math.min(scroll / 200, 4)
      camera.position.y = -scroll * 0.003
      camera.lookAt(0, -scroll * 0.003, 0)

      sparkles.forEach((sparkle, index) => {
        const angle = time * (0.8 + index * 0.2) + index
        sparkle.position.set(Math.cos(angle) * 2.5, Math.sin(angle * 0.7) * 1.8, Math.sin(angle) * 2.5)
        sparkle.intensity = 2 + Math.sin(time * 2 + index) * 1.5
      })

      keyLight.intensity = 16 + Math.sin(time * 0.8) * 3

      beams.forEach((beam, index) => {
        beam.rotation.y = time * 0.1 + index
        beam.material.opacity = 0.03 + Math.sin(time * 0.5 + index) * 0.02
      })

      const positionAttribute = particles.geometry.attributes.position
      for (let index = 0; index < particleCount; index += 1) {
        positionAttribute.array[index * 3 + 1] += 0.004
        if (positionAttribute.array[index * 3 + 1] > 10) {
          positionAttribute.array[index * 3 + 1] = -10
        }
      }
      positionAttribute.needsUpdate = true
      particles.rotation.y += 0.0004

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      diamondGeometry.dispose()
      diamondMaterial.dispose()
      particleGeometry.dispose()
      particleMaterial.dispose()
      beams.forEach((beam) => {
        beam.geometry.dispose()
        beam.material.dispose()
      })
      envMap.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div style={{ background: scenePalette.background, color: scenePalette.pearl, overflow: 'hidden' }}>
      {!loaded && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: scenePalette.background,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontFamily: 'var(--font-italianno)', fontSize: '72px', color: scenePalette.gold, animation: 'breathe 1.5s ease-in-out infinite' }}>
            just
          </div>
        </div>
      )}

      <section className="test-hero" style={{ position: 'relative', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <canvas
          ref={heroCanvasRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 1,
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(10,6,18,0.6) 100%)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        <header className="test-topbar">
          <Link href="/" className="test-logo" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(-10px)' }}>
            <div style={{ fontFamily: 'var(--font-italianno)', fontSize: '34px', color: scenePalette.pearl, lineHeight: 0.85 }}>just</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <div style={{ width: '14px', height: '0.5px', background: 'rgba(201,169,97,0.5)' }} />
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.4em', color: scenePalette.gold }}>BECAUSE</span>
              <div style={{ width: '14px', height: '0.5px', background: 'rgba(201,169,97,0.5)' }} />
            </div>
          </Link>

          <nav className="test-nav" style={{ opacity: loaded ? 1 : 0 }}>
            {['Collection', 'Diamonds', 'Build', 'Story'].map((label) => (
              <a
                key={label}
                href="#collection"
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.18em',
                  color: 'rgba(251,245,240,0.7)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-inter)',
                  transition: 'color 0.3s',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.color = scenePalette.gold
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.color = 'rgba(251,245,240,0.7)'
                }}
              >
                {label.toUpperCase()}
              </a>
            ))}
          </nav>

          <div className="test-icons" style={{ opacity: loaded ? 1 : 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-8.84a5.5 5.5 0 0 0 1.06-7.78z" />
            </svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
        </header>

        <div className="test-hero-copy">
          <div className="hero-kicker" style={{ opacity: loaded ? 1 : 0 }}>LAB-GROWN DIAMONDS / 18K RECYCLED GOLD</div>
          <h1 className="hero-title" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(30px)' }}>
            A reason,
          </h1>
          <h1 className="hero-title hero-title-gold" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(30px)' }}>
            in itself.
          </h1>
          <p className="hero-subcopy" style={{ opacity: loaded ? 1 : 0 }}>
            Diamonds grown in solar foundries. Set in 18K recycled gold. Crafted for the moments that do not ask for an occasion.
          </p>
        </div>

        <div className="scroll-cue" style={{ opacity: loaded ? 1 : 0 }}>
          <div>SCROLL</div>
          <span />
        </div>
      </section>

      <section className="scene-section scene-process">
        <div className="scene-grid">
          <div className="scene-reveal">
            <div className="section-kicker">THE PROCESS</div>
            <h2 className="section-title">Born from</h2>
            <h2 className="section-title section-title-gold">starlight.</h2>
            <p className="section-copy">
              Six weeks in a solar-powered foundry. Carbon atoms layer one at a time, forming the same crystal lattice that took the earth four billion years to make. Identical in every way except for the cost.
            </p>
            <div className="stat-row">
              {[
                ['100%', 'RENEWABLE'],
                ['6 WK', 'TIMELINE'],
                ['IGI', 'CERTIFIED'],
              ].map(([value, label]) => (
                <div key={label}>
                  <div className="stat-value">{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel scene-reveal">
            {[
              { num: '01', label: 'CARBON SEED', desc: 'A pristine carbon seed enters the chamber' },
              { num: '02', label: 'PLASMA HEAT', desc: 'Microwave plasma reaches eight thousand degrees' },
              { num: '03', label: 'CRYSTAL GROWTH', desc: 'Atoms layer one by one, six weeks of patience' },
              { num: '04', label: 'CUT AND POLISH', desc: 'Master cutters reveal 57 facets of fire' },
            ].map((step, index) => (
              <div key={step.num} className="process-step" style={{ borderBottom: index < 3 ? '0.5px solid rgba(201,169,97,0.15)' : 'none' }}>
                <div className="process-num">{step.num}</div>
                <div>
                  <div className="process-label">{step.label}</div>
                  <div className="process-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="collection" className="scene-section">
        <div className="collection-heading scene-reveal">
          <div className="section-kicker">THE COLLECTION</div>
          <h2 className="collection-title">Each piece, <span>a story.</span></h2>
        </div>
        <div className="product-grid">
          {[
            { name: 'Solis Solitaire', cat: 'ENGAGEMENT', price: 'From $2,800' },
            { name: 'Lumi Halo', cat: 'ENGAGEMENT', price: 'From $3,600' },
            { name: 'Vela Pave', cat: 'ENGAGEMENT', price: 'From $3,200' },
          ].map((product) => (
            <article key={product.name} className="product-card scene-reveal">
              <div className="product-orbit">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,97,0.45)" strokeWidth="0.8">
                  <path d="M6 3h12l4 6-10 13L2 9z" />
                  <path d="M2 9h20" />
                  <path d="M12 22V9" />
                  <path d="M12 22L6 9" />
                  <path d="M12 22L18 9" />
                </svg>
              </div>
              <div className="product-copy">
                <div>{product.cat}</div>
                <h3>{product.name}</h3>
                <p>{product.price}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="manifesto-section scene-reveal">
        <div className="section-kicker">MANIFESTO</div>
        <h2>
          You do not need a milestone.
          <br />
          You do not need permission.
          <br />
          <span>You do not need a reason.</span>
        </h2>
        <div className="script-lockup">
          <div />
          <span>just because</span>
          <div />
        </div>
      </section>

      <footer className="test-footer">
        <div className="footer-grid">
          <div>
            <div style={{ fontFamily: 'var(--font-italianno)', fontSize: '40px', color: scenePalette.gold, marginBottom: '4px' }}>just</div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.4em', color: scenePalette.gold, marginBottom: '24px' }}>BECAUSE</div>
            <p>Lab-grown diamonds and recycled gold, crafted for every moment that does not need a name.</p>
          </div>
          {[
            { title: 'SHOP', links: ['Engagement', 'Rings', 'Necklaces', 'Earrings'] },
            { title: 'LEARN', links: ['Our Process', 'The 4 Cs', 'Education', 'Journal'] },
            { title: 'SUPPORT', links: ['Contact', 'Returns', 'Sizing', 'Care'] },
          ].map((column) => (
            <div key={column.title}>
              <div className="footer-title">{column.title}</div>
              {column.links.map((link) => (
                <div key={link} className="footer-link">{link}</div>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <div>2026 Just Because / All rights reserved</div>
          <div>IGI CERTIFIED / GCAL VERIFIED / CARBON NEUTRAL</div>
        </div>
      </footer>

      <style jsx global>{`
        html {
          scroll-behavior: auto;
        }

        body {
          overflow-x: hidden;
        }

        @keyframes breathe {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        @keyframes scrollLine {
          0%, 100% { transform: scaleY(0.6); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }

        .test-topbar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 32px 48px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 10;
        }

        .test-logo {
          text-decoration: none;
          transition: all 1s ease 0.6s;
        }

        .test-nav {
          display: flex;
          gap: 32px;
          transition: opacity 1s ease 0.8s;
        }

        .test-icons {
          display: flex;
          gap: 20px;
          align-items: center;
          color: ${scenePalette.pearl};
          transition: opacity 1s ease 1s;
        }

        .test-hero-copy {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 10;
          pointer-events: none;
          width: 90%;
          max-width: 760px;
        }

        .hero-kicker {
          font-size: 10px;
          letter-spacing: 0.5em;
          color: ${scenePalette.gold};
          margin-bottom: 24px;
          font-family: var(--font-inter);
          transition: opacity 1.2s ease 1.2s;
        }

        .hero-title {
          font-family: var(--font-playfair);
          font-size: clamp(64px, 9vw, 130px);
          font-weight: 400;
          color: ${scenePalette.pearl};
          line-height: 0.92;
          margin: 0 0 8px;
          transition: all 1.4s ease 1.4s;
        }

        .hero-title-gold {
          color: ${scenePalette.gold};
          font-style: italic;
          margin-bottom: 40px;
          transition-delay: 1.6s;
        }

        .hero-subcopy {
          font-size: 15px;
          color: rgba(251,245,240,0.55);
          max-width: 430px;
          margin: 0 auto;
          line-height: 1.85;
          font-family: var(--font-inter);
          transition: opacity 1.4s ease 1.8s;
        }

        .scroll-cue {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          text-align: center;
          transition: opacity 1s ease 2.4s;
          font-family: var(--font-inter);
          color: rgba(201,169,97,0.65);
          font-size: 9px;
          letter-spacing: 0.4em;
        }

        .scroll-cue span {
          display: block;
          width: 1px;
          height: 60px;
          background: linear-gradient(to bottom, ${scenePalette.gold}, transparent);
          margin: 12px auto 0;
          animation: scrollLine 2s ease-in-out infinite;
        }

        .scene-section {
          position: relative;
          z-index: 5;
          padding: 160px 60px;
          background: ${scenePalette.background};
        }

        .scene-process {
          min-height: 100vh;
          background: linear-gradient(to bottom, transparent, rgba(10,6,18,0.95) 28%, ${scenePalette.background});
        }

        .scene-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 100px;
          align-items: center;
        }

        .section-kicker {
          font-size: 10px;
          letter-spacing: 0.4em;
          color: ${scenePalette.gold};
          margin-bottom: 20px;
          font-family: var(--font-inter);
        }

        .section-title {
          font-family: var(--font-playfair);
          font-size: clamp(40px, 5vw, 72px);
          font-weight: 400;
          color: ${scenePalette.pearl};
          line-height: 1.05;
          margin: 0 0 12px;
        }

        .section-title-gold {
          color: ${scenePalette.gold};
          font-style: italic;
          margin-bottom: 32px;
        }

        .section-copy {
          font-size: 15px;
          color: rgba(184,160,144,0.8);
          line-height: 1.9;
          max-width: 460px;
          font-family: var(--font-inter);
          margin-bottom: 40px;
        }

        .stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          padding-top: 32px;
          border-top: 0.5px solid rgba(201,169,97,0.2);
        }

        .stat-value {
          font-family: var(--font-playfair);
          font-size: 36px;
          color: ${scenePalette.gold};
          font-weight: 400;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 9px;
          letter-spacing: 0.25em;
          color: rgba(184,160,144,0.6);
          font-family: var(--font-inter);
        }

        .glass-panel {
          background: rgba(251,245,240,0.03);
          backdrop-filter: blur(20px);
          border: 0.5px solid rgba(201,169,97,0.2);
          padding: 48px 40px;
          border-radius: 2px;
        }

        .process-step {
          display: flex;
          gap: 24px;
          padding-bottom: 24px;
          margin-bottom: 24px;
        }

        .process-num {
          font-family: var(--font-playfair);
          font-size: 24px;
          color: ${scenePalette.gold};
          min-width: 40px;
        }

        .process-label {
          font-size: 11px;
          letter-spacing: 0.25em;
          color: ${scenePalette.pearl};
          margin-bottom: 6px;
          font-family: var(--font-inter);
          font-weight: 500;
        }

        .process-desc {
          font-size: 13px;
          color: rgba(184,160,144,0.7);
          line-height: 1.7;
          font-family: var(--font-inter);
        }

        .collection-heading {
          text-align: center;
          margin-bottom: 80px;
        }

        .collection-title {
          font-family: var(--font-playfair);
          font-size: clamp(40px, 5vw, 64px);
          font-weight: 400;
          color: ${scenePalette.pearl};
          margin: 0;
        }

        .collection-title span {
          color: ${scenePalette.gold};
          font-style: italic;
        }

        .product-grid {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        .product-card {
          background: rgba(251,245,240,0.02);
          border: 0.5px solid rgba(201,169,97,0.15);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.6s ease;
        }

        .product-card:hover {
          border-color: rgba(201,169,97,0.5);
          transform: translateY(-8px);
          background: rgba(251,245,240,0.04);
          box-shadow: 0 24px 60px rgba(201,169,97,0.15);
        }

        .product-orbit {
          aspect-ratio: 1;
          background: linear-gradient(135deg, rgba(201,169,97,0.08), rgba(232,196,208,0.08));
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .product-copy {
          padding: 24px;
        }

        .product-copy div {
          font-size: 9px;
          letter-spacing: 0.3em;
          color: ${scenePalette.gold};
          margin-bottom: 10px;
          font-family: var(--font-inter);
        }

        .product-copy h3 {
          font-family: var(--font-playfair);
          font-size: 20px;
          color: ${scenePalette.pearl};
          margin: 0 0 8px;
          font-weight: 400;
        }

        .product-copy p {
          font-size: 13px;
          color: rgba(184,160,144,0.7);
          font-family: var(--font-inter);
          margin: 0;
        }

        .manifesto-section {
          position: relative;
          padding: 180px 60px;
          background: linear-gradient(to bottom, ${scenePalette.background}, ${scenePalette.surface}, ${scenePalette.background});
          text-align: center;
          z-index: 5;
        }

        .manifesto-section h2 {
          font-family: var(--font-playfair);
          font-size: clamp(36px, 5vw, 56px);
          font-weight: 400;
          color: ${scenePalette.pearl};
          line-height: 1.3;
          margin: 0;
        }

        .manifesto-section h2 span {
          color: ${scenePalette.gold};
          font-style: italic;
        }

        .script-lockup {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-top: 60px;
        }

        .script-lockup div {
          width: 60px;
          height: 0.5px;
          background: ${scenePalette.gold};
        }

        .script-lockup span {
          font-family: var(--font-italianno);
          font-size: 48px;
          color: ${scenePalette.gold};
          line-height: 1;
        }

        .test-footer {
          background: ${scenePalette.surface};
          padding: 100px 60px 40px;
          position: relative;
          z-index: 5;
        }

        .footer-grid {
          max-width: 1200px;
          margin: 0 auto 60px;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 60px;
        }

        .footer-grid p {
          font-size: 12px;
          color: rgba(184,160,144,0.6);
          line-height: 1.8;
          max-width: 260px;
          font-family: var(--font-inter);
        }

        .footer-title {
          font-size: 9px;
          letter-spacing: 0.3em;
          color: rgba(251,245,240,0.5);
          margin-bottom: 20px;
          font-family: var(--font-inter);
        }

        .footer-link {
          font-size: 12px;
          line-height: 2.5;
          color: rgba(184,160,144,0.7);
          cursor: pointer;
          font-family: var(--font-inter);
          transition: color 0.2s;
        }

        .footer-link:hover {
          color: ${scenePalette.gold};
        }

        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding-top: 32px;
          border-top: 0.5px solid rgba(201,169,97,0.15);
          display: flex;
          justify-content: space-between;
          gap: 24px;
          font-size: 10px;
          color: rgba(184,160,144,0.4);
          font-family: var(--font-inter);
        }

        @media (max-width: 900px) {
          .test-topbar {
            padding: 24px;
          }

          .test-nav {
            display: none;
          }

          .hero-title {
            font-size: clamp(54px, 17vw, 86px);
          }

          .scene-section,
          .manifesto-section,
          .test-footer {
            padding-left: 28px;
            padding-right: 28px;
          }

          .scene-grid,
          .product-grid,
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 36px;
          }

          .stat-row {
            grid-template-columns: 1fr;
          }

          .footer-bottom {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

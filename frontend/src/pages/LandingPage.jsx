import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, BarChart3, Shield, Sparkles, Zap, TrendingUp, Moon, Sun } from 'lucide-react'
import styles from './LandingPage.module.css'

function BullBearScene({ theme }) {
  const mountRef = useRef(null)
  const mouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100)
    camera.position.set(0, 1.3, 8)

    const ambient = new THREE.HemisphereLight(0xffffff, 0x0b0d1a, 0.85)
    scene.add(ambient)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8)
    keyLight.position.set(6, 7, 5)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x7b61ff, 0.75)
    fillLight.position.set(-6, 2, 4)
    scene.add(fillLight)

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshStandardMaterial({ color: 0x080910, roughness: 0.88, metalness: 0.05, opacity: 0.92, transparent: true })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.58
    scene.add(floor)

    const grid = new THREE.GridHelper(16, 24, 0x2a2c40, 0x13141f)
    grid.position.y = -1.57
    scene.add(grid)

    const bullMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x7b61ff,
      metalness: 0.78,
      roughness: 0.14,
      clearcoat: 0.92,
      clearcoatRoughness: 0.06,
      emissive: 0x27106f,
      emissiveIntensity: 0.08,
    })

    const bearMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00d084,
      metalness: 0.6,
      roughness: 0.18,
      clearcoat: 0.7,
      emissive: 0x004d33,
      emissiveIntensity: 0.08,
    })

    const bull = new THREE.Group()
    const bullBody = new THREE.Mesh(new THREE.SphereGeometry(0.75, 32, 32), bullMaterial)
    bullBody.scale.set(1.82, 1.06, 0.98)
    bull.add(bullBody)

    const bullHead = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 24), bullMaterial)
    bullHead.position.set(1.04, 0.12, 0)
    bullHead.scale.set(1, 0.86, 0.86)
    bull.add(bullHead)

    const bullHornA = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.64, 18), new THREE.MeshPhysicalMaterial({ color: 0xfbe6d2, metalness: 0.82, roughness: 0.16 }))
    bullHornA.position.set(1.4, 0.34, 0.24)
    bullHornA.rotation.set(0, 0, -0.45)
    bull.add(bullHornA)

    const bullHornB = bullHornA.clone()
    bullHornB.position.set(1.4, 0.34, -0.24)
    bullHornB.rotation.set(0, 0, 0.45)
    bull.add(bullHornB)

    const bullLegA = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.92, 16), bullMaterial)
    bullLegA.position.set(0.77, -0.96, 0.33)
    bull.add(bullLegA)

    const bullLegB = bullLegA.clone()
    bullLegB.position.set(0.77, -0.96, -0.33)
    bull.add(bullLegB)

    bull.position.set(-1.88, -0.79, 0)
    scene.add(bull)

    const bear = new THREE.Group()
    const bearBody = new THREE.Mesh(new THREE.SphereGeometry(0.82, 34, 34), bearMaterial)
    bearBody.scale.set(1.46, 1.02, 1.04)
    bear.add(bearBody)

    const bearHead = new THREE.Mesh(new THREE.SphereGeometry(0.36, 30, 30), bearMaterial)
    bearHead.position.set(-1.03, 0.12, 0)
    bear.add(bearHead)

    const earA = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 18), bearMaterial)
    earA.position.set(-1.35, 0.41, 0.25)
    bear.add(earA)

    const earB = earA.clone()
    earB.position.set(-1.35, 0.41, -0.25)
    bear.add(earB)

    const bearLegA = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.92, 16), bearMaterial)
    bearLegA.position.set(-0.9, -0.96, 0.34)
    bear.add(bearLegA)

    const bearLegB = bearLegA.clone()
    bearLegB.position.set(-0.9, -0.96, -0.34)
    bear.add(bearLegB)

    bear.position.set(1.6, -0.78, 0)
    bear.rotation.y = Math.PI * 0.14
    scene.add(bear)

    const bars = new THREE.Group()
    const barData = [
      { x: -2.8, height: 1.36, color: 0x00d084 },
      { x: -1.25, height: 1.96, color: 0xff4d6a },
      { x: 0.28, height: 1.42, color: 0x00d084 },
      { x: 1.65, height: 2.06, color: 0x00d084 },
    ]
    barData.forEach((item) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.18, item.height, 0.18), new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.18, metalness: 0.3 }))
      bar.position.set(item.x, item.height / 2 - 1.5, 0)
      bars.add(bar)
      const wick = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.32, 0.05), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.12 }))
      wick.position.set(item.x, item.height - 1.05, 0)
      bars.add(wick)
    })
    scene.add(bars)

    let frameId = null
    const animate = () => {
      const tx = mouse.current.x * 0.12
      const ty = mouse.current.y * 0.08
      bull.rotation.y += 0.003
      bear.rotation.y -= 0.003
      bars.rotation.y += 0.002
      camera.position.x += (tx - camera.position.x) * 0.05
      camera.position.y += (ty + 0.3 - camera.position.y) * 0.05
      camera.lookAt(0, -0.22, 0)
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    const handleMove = (event) => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', handleMove, { passive: true })

    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('resize', handleResize)
      if (container && renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [theme])

  return <div ref={mountRef} className={styles.sceneCanvas} />
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('tp-theme') || 'dark' } catch { return 'dark' }
  })
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0])
  const isDark = theme === 'dark'

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem('tp-theme', next) } catch {}
      return next
    })
  }, [])

  const features = [
    { icon: <Zap size={20} />, title: 'Market intelligence', desc: 'Live momentum signals, sentiment alerts, and order-flow clarity.', color: '#7b61ff' },
    { icon: <BarChart3 size={20} />, title: 'Trade orchestration', desc: 'Multi-asset execution, custom triggers and one-click scaled orders.', color: '#00d084' },
    { icon: <Shield size={20} />, title: 'Institutional security', desc: 'JWT auth, TOTP, device control, and versioned sessions with emergency stop controls.', color: '#f7a841' },
    { icon: <TrendingUp size={20} />, title: 'Premium analytics', desc: 'Heatmaps, liquidity flow, risk-weighted signals, and portfolio insight.', color: '#ff6b9d' },
  ]

  return (
    <div className={`${styles.page} ${isDark ? styles.dark : styles.light}`}>
      <motion.div className={styles.heroBackdrop} style={{ opacity: heroOpacity }} />

      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.brand}>Trade<span>Pro</span></div>
          <div className={styles.navLinks}>
            <button type="button" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</button>
            <button type="button" onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' })}>Start</button>
          </div>
          <div className={styles.navActions}>
            <button className={styles.themeBtn} onClick={toggleTheme} aria-label="Toggle theme">
              <AnimatePresence mode="wait">
                {isDark ? (
                  <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.3 }}>
                    <Sun size={16} />
                  </motion.span>
                ) : (
                  <motion.span key="moon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.3 }}>
                    <Moon size={16} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button className={styles.btnGhost} onClick={() => navigate('/login')}>Sign in</button>
            <button className={styles.btnPrimary} onClick={() => navigate('/register')}>Get started</button>
          </div>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.heroBadge}>Bull & Bear market intelligence</span>
          <h1 className={styles.heroTitle}>A premium stock market studio built for motion and clarity.</h1>
          <p className={styles.heroText}>Live trade flow, risk-aware order controls, and elegant analytics — all in a smooth, premium interface.</p>

          <div className={styles.heroActions}>
            <button className={styles.btnPrimary} onClick={() => navigate('/register')}>
              Open account now <ArrowRight size={16} />
            </button>
            <button className={styles.btnSecondary} onClick={() => navigate('/login')}>
              Secure sign in
            </button>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStatCard}>
              <span>Daily volume</span>
              <strong>₹2.8K Cr</strong>
            </div>
            <div className={styles.heroStatCard}>
              <span>Execution</span>
              <strong>0.003s</strong>
            </div>
            <div className={styles.heroStatCard}>
              <span>Active traders</span>
              <strong>48K+</strong>
            </div>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <BullBearScene theme={theme} />
        </div>
      </section>

      <section className={styles.gridSection} id="features">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Why TradePro</span>
          <h2>Premium market analytics, beautiful execution, and instant control.</h2>
        </div>

        <div className={styles.featuresGrid}>
          {features.map((feature) => (
            <motion.div key={feature.title} className={styles.featureCard} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}>
              <div className={styles.featureIcon} style={{ background: `${feature.color}22`, color: feature.color }}>
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className={styles.ctaSection} id="cta">
        <div className={styles.ctaCard}>
          <div className={styles.ctaTop}>
            <Sparkles size={18} className={styles.ctaSparkle} />
            <span>Premium onboarding</span>
          </div>
          <h2>Launch your professional trading workspace.</h2>
          <p>Fast onboarding with polished dashboards, secure controls, and premium market visibility.</p>
          <button className={styles.ctaButton} onClick={() => navigate('/register')}>
            Create free account
          </button>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>Trade<span>Pro</span></div>
        <div className={styles.footerLinks}>
          <button type="button" onClick={() => navigate('/login')}>Sign in</button>
          <button type="button" onClick={() => navigate('/register')}>Register</button>
          <button type="button" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</button>
        </div>
        <p>© 2026 TradePro. Built for traders who value speed, security, and refined execution.</p>
      </footer>
    </div>
  )
}

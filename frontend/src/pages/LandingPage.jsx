import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './LandingPage.module.css'

export default function LandingPage() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const glowRef = useRef(null)
  const [counters, setCounters] = useState({ vol: 0, users: 0 })

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let particles = []
    let raf

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.2 + 0.3,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        o: Math.random() * 0.4 + 0.1,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.022)'
      ctx.lineWidth = 0.5
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
      }
      // Particles
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(123,97,255,${p.o})`
        ctx.fill()
      })
      // Connections
      ctx.lineWidth = 0.5
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 100) {
            ctx.globalAlpha = (1 - d / 100) * 0.25
            ctx.strokeStyle = 'rgba(123,97,255,1)'
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // Mouse glow
  useEffect(() => {
    const onMove = (e) => {
      if (glowRef.current) {
        glowRef.current.style.left = e.clientX + 'px'
        glowRef.current.style.top = e.clientY + 'px'
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Counters
  useEffect(() => {
    let frame
    let start = null
    const duration = 1800
    const targets = { vol: 2847, users: 48291 }
    const animate = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCounters({
        vol: Math.round(ease * targets.vol),
        users: Math.round(ease * targets.users),
      })
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    const timeout = setTimeout(() => { frame = requestAnimationFrame(animate) }, 400)
    return () => { clearTimeout(timeout); cancelAnimationFrame(frame) }
  }, [])

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add(styles.revealed); io.unobserve(e.target) } }),
      { threshold: 0.1 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className={styles.page}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div ref={glowRef} className={styles.mouseGlow} />

      {/* NAV */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>Trade<span>Pro</span></div>
        <div className={styles.navLinks}>
          <a href="#features">Features</a>
          <a href="#security">Security</a>
        </div>
        <div className={styles.navActions}>
          <button className={styles.navSecondary} onClick={() => navigate('/login')}>Sign in</button>
          <button className={styles.navPrimary} onClick={() => navigate('/register')}>Get started →</button>
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          Now in early access · Built for serious traders
        </div>

        <h1 className={styles.h1}>
          Trade with<br />
          <span className={styles.gradientText}>institutional</span><br />
          precision
        </h1>

        <p className={styles.sub}>
          TradePro brings enterprise-grade security, AI risk management,
          and sub-millisecond execution to every investor.
        </p>

        <div className={styles.cta}>
          <button className={styles.btnPrimary} onClick={() => navigate('/register')}>
            Start trading free →
          </button>
          <button className={styles.btnSecondary} onClick={() => navigate('/login')}>
            Sign in
          </button>
        </div>

        <div className={styles.statsRow}>
          {[
            { val: `₹${counters.vol.toLocaleString('en-IN')}Cr`, label: 'Daily Volume' },
            { val: '0.003s', label: 'Avg Execution' },
            { val: `${counters.users.toLocaleString('en-IN')}+`, label: 'Active Traders' },
            { val: '99.99%', label: 'Uptime SLA' },
          ].map((s) => (
            <div key={s.label} className={styles.stat}>
              <div className={styles.statVal}>{s.val}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className={styles.section}>
        <div className={styles.sectionHead} data-reveal>
          <div className={styles.sectionLabel}>Features</div>
          <h2 className={styles.sectionH2}>Engineered for the edge</h2>
        </div>
        <div className={styles.featGrid} data-reveal>
          {FEATURES.map((f) => (
            <div key={f.title} className={`${styles.featCard} ${f.wide ? styles.wide : ''}`}>
              <div className={styles.featIcon} style={{ background: f.bg, color: f.color }}>{f.icon}</div>
              <div className={styles.featTitle}>{f.title}</div>
              <div className={styles.featDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className={styles.section}>
        <div className={styles.secGrid}>
          <div data-reveal>
            <div className={styles.sectionLabel}>Security</div>
            <h2 className={styles.sectionH2}>Bank-grade.<br />Not bank-slow.</h2>
            <p className={styles.secDesc}>
              Every layer of the stack is hardened. JWT tokens, TOTP 2FA,
              device binding, BCrypt hashing, and a kill switch for emergencies.
            </p>
            <button className={styles.btnSecondary} onClick={() => navigate('/register')}>
              Get protected →
            </button>
          </div>
          <div className={styles.secCards} data-reveal>
            {SECURITY_ITEMS.map((s) => (
              <div key={s.title} className={styles.secCard}>
                <div className={styles.secIcon} style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <div>
                  <div className={styles.secTitle}>{s.title}</div>
                  <div className={styles.secDesc2}>{s.desc}</div>
                </div>
                <div className={styles.secBadge}>ACTIVE</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>Trade<span>Pro</span></div>
        <p className={styles.footerSub}>Built for traders who don't compromise.</p>
        <button className={styles.btnPrimary} onClick={() => navigate('/register')}>
          Request early access →
        </button>
        <div className={styles.footerMeta}>SEBI Registered · NSE · BSE · MCX · ISO 27001</div>
      </footer>
    </div>
  )
}

const FEATURES = [
  { icon: '⚡', title: 'GTT Orders', desc: 'Good-Till-Triggered orders with multi-condition support. Set ABOVE/BELOW triggers with custom expiry.', bg: 'rgba(123,97,255,0.12)', color: '#a390ff', wide: true },
  { icon: '◉', title: 'AI Risk Nudges', desc: 'Intelligent pre-trade alerts for overexposure, risky stocks, and daily limit breaches.', bg: 'rgba(0,208,132,0.12)', color: '#00d084' },
  { icon: '⊞', title: 'Multi-Segment', desc: 'Equity, Futures, Options, Currency, Commodity — all in one unified interface.', bg: 'rgba(247,168,65,0.12)', color: '#f7a841' },
  { icon: '◈', title: 'Kill Switch', desc: 'One tap halts all trades, cancels orders, and logs out all sessions instantly.', bg: 'rgba(255,77,106,0.12)', color: '#ff4d6a' },
  { icon: '⬡', title: 'P&L Intelligence', desc: 'Brokerage, STT, GST, exchange charges — every cost tracked automatically.', bg: 'rgba(123,97,255,0.12)', color: '#a390ff' },
  { icon: '◳', title: 'Session Control', desc: 'Auto-logout, device binding, and trusted device management built in.', bg: 'rgba(0,208,132,0.12)', color: '#00d084' },
]

const SECURITY_ITEMS = [
  { icon: '◉', title: 'TOTP / 2FA', desc: 'Google Authenticator compatible time-based OTP', bg: 'rgba(123,97,255,0.12)', color: '#a390ff' },
  { icon: '⊛', title: 'JWT + Refresh Tokens', desc: 'Short-lived access tokens with secure 7-day rotation', bg: 'rgba(0,208,132,0.12)', color: '#00d084' },
  { icon: '◈', title: 'Device Binding', desc: 'New devices require verification before first access', bg: 'rgba(247,168,65,0.12)', color: '#f7a841' },
  { icon: '⬡', title: 'Visual KYC', desc: 'Face verification with liveness detection', bg: 'rgba(123,97,255,0.12)', color: '#a390ff' },
  { icon: '◳', title: 'BCrypt Hashing', desc: 'Adaptive cost-factor hashing — no plaintext ever stored', bg: 'rgba(0,208,132,0.12)', color: '#00d084' },
]

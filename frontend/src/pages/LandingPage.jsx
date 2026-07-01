import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart3, Shield, Sparkles, Zap, TrendingUp } from 'lucide-react'
import styles from './LandingPage.module.css'

export default function LandingPage() {
  const navigate = useNavigate()

  const features = [
    { icon: <Zap size={20} />,       title: 'Live Market Data',         desc: 'Real-time quotes for equities, F&O, commodities, forex and crypto — refreshed every 5 seconds.', color: 'var(--green)' },
    { icon: <BarChart3 size={20} />, title: 'Trade Execution',          desc: 'Place market, limit, stop-loss and GTT orders across NSE, BSE and MCX segments instantly.', color: 'var(--red)' },
    { icon: <Shield size={20} />,    title: 'Institutional Security',   desc: 'JWT auth, TOTP 2FA, device binding and emergency kill switch to protect your capital.', color: 'var(--amber)' },
    { icon: <TrendingUp size={20} />,title: 'Portfolio Analytics',      desc: 'P&L tracking, allocation charts, win rate analysis and full order history in one dashboard.', color: 'var(--accent)' },
  ]

  return (
    <div className={styles.page}>

      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.brand}>Trade<span>Pro</span></div>
          <div className={styles.navLinks}>
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</button>
            <button onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' })}>Get Started</button>
          </div>
          <div className={styles.navActions}>
            <button className={styles.btnGhost} onClick={() => navigate('/login')}>Sign in</button>
            <button className={styles.btnPrimary} onClick={() => navigate('/register')}>
              Open Account <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        {/* Left copy */}
        <div className={styles.heroCopy}>
          <div className={styles.heroBadge}>
            <span className={styles.bullDot} />
            Live market intelligence platform
          </div>

          <h1 className={styles.heroTitle}>
            Trade with the <span className={styles.bullWord}>Bulls</span>.
            <br />
            Survive the <span className={styles.bearWord}>Bears</span>.
          </h1>

          <p className={styles.heroText}>
            A professional-grade trading platform with real-time market data,
            smart order execution, risk controls and portfolio analytics — all in one place.
          </p>

          <div className={styles.heroActions}>
            <button className={styles.btnPrimary} onClick={() => navigate('/register')}>
              Start Trading Free <ArrowRight size={16} />
            </button>
            <button className={styles.btnSecondary} onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <span className={styles.statVal}>₹2.8K Cr</span>
              <span className={styles.statLabel}>Daily Volume</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statVal}>5s</span>
              <span className={styles.statLabel}>Data Refresh</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statVal}>48K+</span>
              <span className={styles.statLabel}>Active Traders</span>
            </div>
          </div>
        </div>

        {/* Right — Bull Bear image */}
        <div className={styles.heroVisual}>
          <img
            src="/bull-bear.webp"
            alt="Bull vs Bear market — TradePro"
            className={styles.heroImg}
          />
          {/* Floating ticker cards */}
          <div className={`${styles.floatCard} ${styles.floatBull}`}>
            <span className={styles.floatLabel}>NIFTY 50</span>
            <span className={styles.floatVal}>24,380</span>
            <span className={styles.floatChange}>▲ +1.24%</span>
          </div>
          <div className={`${styles.floatCard} ${styles.floatBear}`}>
            <span className={styles.floatLabel}>INFY</span>
            <span className={styles.floatVal}>1,678</span>
            <span className={styles.floatChangeDn}>▼ -0.82%</span>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={styles.featuresSection} id="features">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Why TradePro</span>
          <h2>Everything you need to trade smarter</h2>
          <p>From live quotes to risk management — built for serious traders.</p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon} style={{ background: f.color + '18', color: f.color }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection} id="cta">
        <div className={styles.ctaCard}>
          <Sparkles size={28} className={styles.ctaIcon} />
          <h2>Launch your trading workspace today</h2>
          <p>Free account. No credit card. Full platform access from day one.</p>
          <button className={styles.ctaBtn} onClick={() => navigate('/register')}>
            Create Free Account <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.brand}>Trade<span>Pro</span></div>
        <div className={styles.footerLinks}>
          <button onClick={() => navigate('/login')}>Sign In</button>
          <button onClick={() => navigate('/register')}>Register</button>
          <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</button>
        </div>
        <p>© 2026 TradePro · Built for traders who value speed, security and clarity.</p>
      </footer>
    </div>
  )
}

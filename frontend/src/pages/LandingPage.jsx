import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart3, Shield, Sparkles, Zap, TrendingUp, TrendingDown } from 'lucide-react'
import styles from './LandingPage.module.css'

export default function LandingPage() {
  const navigate = useNavigate()

  const features = [
    { icon: <Zap size={20} />,       title: 'Live Market Data',         desc: 'Real-time quotes for equities, F&O, commodities, forex and crypto — refreshed every 5 seconds.', color: '#2563eb' },
    { icon: <BarChart3 size={20} />, title: 'Smart Trade Execution',    desc: 'Place market, limit, stop-loss and GTT orders across NSE, BSE and MCX segments instantly.', color: '#7c3aed' },
    { icon: <Shield size={20} />,    title: 'Bank-Level Security',      desc: 'JWT auth, TOTP 2FA, device binding and emergency kill switch to protect your capital.', color: '#f59e0b' },
    { icon: <TrendingUp size={20} />,title: 'Portfolio Intelligence',   desc: 'P&L tracking, allocation charts, win rate analysis and full order history in one dashboard.', color: '#06b6d4' },
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
        <div className={styles.heroCopy}>
          <div className={styles.heroBadge}>
            <span className={styles.bullDot} />
            Live Markets
          </div>
          <h1 className={styles.heroTitle}>
            Trade with <span className={styles.bullWord}>clarity</span>, not <span className={styles.bearWord}>chaos</span>
          </h1>
          <p className={styles.heroText}>
            Professional-grade trading platform with real-time data, smart screeners, and portfolio insights. Built for traders who take investing seriously.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.btnPrimary} onClick={() => navigate('/register')}>
              Get Started Free <ArrowRight size={15} />
            </button>
            <button className={styles.btnSecondary} onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <span className={styles.statVal}>2M+</span>
              <span className={styles.statLabel}>Data Points/Day</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statVal}>40ms</span>
              <span className={styles.statLabel}>Avg Latency</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statVal}>50K+</span>
              <span className={styles.statLabel}>Active Traders</span>
            </div>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.heroVisualsContainer}>
            <div className={`${styles.floatCard} ${styles.floatBull}`}>
              <span className={styles.floatLabel}>NIFTY 50</span>
              <span className={styles.floatVal}>24,856.45</span>
              <span className={styles.floatChange}>+2.14%</span>
            </div>
            <div className={styles.heroChartPlaceholder} />
            <div className={`${styles.floatCard} ${styles.floatBear}`}>
              <span className={styles.floatLabel}>NIFTY BANK</span>
              <span className={styles.floatVal}>52,341.80</span>
              <span className={styles.floatChangeDn}>-1.23%</span>
            </div>
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
          {features.map((f, i) => (
            <div key={f.title} className={styles.featureCard} style={{ '--feature-color': f.color, '--feature-bg': f.color + '15' }}>
              <div className={styles.featureIcon}>{f.icon}</div>
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

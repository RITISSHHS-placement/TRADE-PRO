import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronDown, Plus, Minus, BookOpen, Zap, TrendingUp, Shield, Activity } from 'lucide-react'
import { FadeIn, Stagger } from '../components/animations'
import ParticleBackground from '../components/ParticleBackground'
import { GlassCard, GlassButton, GlassBadge } from '../components/Glassmorphism'
import styles from './LandingPage.module.css'

export default function LandingPage({ setPage, indices, onOpenAuth }) {
  const navigate = useNavigate()
  const [activeFaq, setActiveFaq] = useState(null)

  const nifty = indices?.['NIFTY 50']
  const bank  = indices?.['NIFTY BANK']

  const handleNav = (target) => {
    if ((target === 'login' || target === 'register') && onOpenAuth) {
      onOpenAuth(target)
    } else {
      if (setPage) {
        setPage(target)
      }
      navigate(`/${target}`)
    }
  }

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

  // Sample data to match Screenshot 1
  const trendingStocks = [
    { name: 'Reliance Industries', sym: 'RELIANCE', price: 2450.40, change: 1.25, up: true },
    { name: 'TCS', sym: 'TCS', price: 3420.15, change: -0.45, up: false },
    { name: 'HDFC Bank', sym: 'HDFCBANK', price: 1610.80, change: 0.85, up: true },
    { name: 'Infosys', sym: 'INFY', price: 1480.20, change: -1.15, up: false },
    { name: 'Bharti Airtel', sym: 'BHARTIARTL', price: 920.65, change: 2.10, up: true }
  ]

  const themes = [
    {
      title: 'Space Economy',
      icon: '🚀',
      stocks: [
        { name: 'Space Exploration Tech', price: '₹14,241', change: '+2.35%', up: true },
        { name: 'Rocket Lab USA Inc', price: '₹600.01', change: '+4.20%', up: true },
        { name: 'Astra Space', price: '₹70.31', change: '-1.09%', up: false }
      ]
    },
    {
      title: 'AI Leaders',
      icon: '🤖',
      stocks: [
        { name: 'NVIDIA Corporation', price: '₹20,420', change: '+0.40%', up: true },
        { name: 'Microsoft Corporation', price: '₹30,351', change: '-1.90%', up: false },
        { name: 'Alphabet Inc Class A', price: '₹13,541', change: '+0.46%', up: true }
      ]
    },
    {
      title: 'Core Semiconductors',
      icon: '🔌',
      stocks: [
        { name: 'NVIDIA Corporation', price: '₹20,420', change: '+0.40%', up: true },
        { name: 'Taiwan Semiconductor', price: '₹41,257', change: '-0.65%', up: false },
        { name: 'Broadcom Inc', price: '₹88,007', change: '+1.59%', up: true }
      ]
    },
    {
      title: 'Commodities & Metals',
      icon: '🪙',
      stocks: [
        { name: 'SPDR Gold Shares', price: '₹31,379', change: '+1.81%', up: true },
        { name: 'Global X Uranium ETF', price: '₹4,120', change: '+1.57%', up: true },
        { name: 'iShares Silver Trust', price: '₹5,822', change: '+2.04%', up: true }
      ]
    }
  ]

  const articles = [
    { title: 'What Should First-Time Global Investors Choose?', date: '2026-01-22', readTime: '5 min read' },
    { title: 'How to invest in US Stocks from India: Step-by-Step Guide', date: '2026-01-23', readTime: '6 min read' },
    { title: 'Why Indian Investors are Increasingly Investing in US Stocks?', date: '2026-01-24', readTime: '4 min read' },
    { title: 'Understanding Tickertape\'s Pricing for Investing in US Stocks', date: '2026-01-25', readTime: '3 min read' }
  ]

  const faqs = [
    { q: 'How can I invest in US stocks from India?', a: 'You can easily invest in fractional shares of top US tech companies through our integrated trading gateway. All accounts are compliant with RBI LRS regulations, allowing you to invest up to $250,000 per year.' },
    { q: 'How does TradePro enable access to the US stock market?', a: 'TradePro partners with licensed custodians and brokerage partners to route and settle orders directly on US exchanges, ensuring high-speed execution and safety for capital assets.' },
    { q: 'What charges apply for investing in US stocks & ETFs?', a: 'TradePro offers zero-commission investing for US stocks. There are no account maintenance fees, though standard regulatory charges, foreign currency conversion fees, and wire fees apply.' },
    { q: 'Is investing in US stocks legal in India?', a: 'Yes. The Reserve Bank of India permits resident individuals to acquire shares of listed foreign companies under the Liberalised Remittance Scheme (LRS) framework.' },
    { q: 'Why do I need a different broker account?', a: 'Under Indian regulations, domestic brokerages require a dedicated clearing partnership to handle foreign security custody. Creating a TradePro profile automatically establishes this global access node.' }
  ]

  return (
    <div className={styles.page}>
      {/* Particle Background */}
      <ParticleBackground theme="dark" particleCount={1500} connectionDistance={120} mouseInteraction={true} />

      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.brand} onClick={() => handleNav('home')} style={{ cursor: 'pointer' }}>
            <span className={styles.logoIcon} /> Trade<span>Pro</span>
          </div>
          <div className={styles.navLinks}>
            <button onClick={() => document.getElementById('trending')?.scrollIntoView({ behavior: 'smooth' })}>Markets</button>
            <button onClick={() => document.getElementById('themes')?.scrollIntoView({ behavior: 'smooth' })}>Themes</button>
            <button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}>FAQs</button>
          </div>
          <div className={styles.navActions}>
            <button className={styles.btnGhost} onClick={() => handleNav('login')}>Sign in</button>
            <button className={styles.btnPrimary} onClick={() => handleNav('register')}>
              Open Account <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <FadeIn className={styles.hero} y={20} duration={0.8}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <div className={styles.heroBadge}>
              <span className={styles.bullDot} /> Live Global Quotes
            </div>
            <h1 className={styles.heroTitle}>
              Invest in US Stocks<br />& ETFs from India
            </h1>
            <p className={styles.heroText}>
              Access a premium brokerage interface designed for convinction. Track global sectors, place instant fractional orders, and build conviction with zero friction.
            </p>
            <div className={styles.heroActions}>
              <button className={styles.heroBtnWhite} onClick={() => handleNav('register')}>
                Get Started
              </button>
              <button className={styles.btnSecondary} onClick={() => handleNav('login')}>
                Explore Platform
              </button>
            </div>
            <div className={styles.heroCompliancy}>
              100% compliant with RBI LRS regulations · Direct SEC-registered custody
            </div>
          </div>

          <div className={styles.heroVisual}>
            {/* Orbiting assets visual */}
            <div className={styles.orbitWrapper}>
              <div className={styles.orbitGlobe} />
              <div className={styles.orbitRing}>
                {/* Tesla */}
                <div className={styles.orbitItem} style={{ background: '#fef2f2' }} title="Tesla">
                  <span style={{ color: '#e63946', fontWeight: 900, fontSize: 16 }}>T</span>
                </div>
                {/* Nvidia */}
                <div className={styles.orbitItem} style={{ background: '#f0fdf4' }} title="Nvidia">
                  <span style={{ color: '#10b981', fontWeight: 900, fontSize: 16 }}>N</span>
                </div>
                {/* Amazon */}
                <div className={styles.orbitItem} style={{ background: '#fffbeb' }} title="Amazon">
                  <span style={{ color: '#f59e0b', fontWeight: 900, fontSize: 16 }}>a</span>
                </div>
                {/* Google */}
                <div className={styles.orbitItem} style={{ background: '#eff6ff' }} title="Google">
                  <span style={{ color: '#3b82f6', fontWeight: 900, fontSize: 16 }}>G</span>
                </div>
                {/* Apple */}
                <div className={styles.orbitItem} style={{ background: '#f9fafb' }} title="Apple">
                  <span style={{ color: '#1f2937', fontWeight: 900, fontSize: 16 }}></span>
                </div>
              </div>

              {/* Floating index tags */}
              <div className={`${styles.floatCard} ${styles.floatBull}`}>
                <span className={styles.floatLabel}>NIFTY 50</span>
                <span className={styles.floatVal}>
                  {nifty ? Number(nifty.price).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '24,856.45'}
                </span>
                <span className={(nifty?.changePct ?? 2.14) >= 0 ? styles.floatChange : styles.floatChangeDn}>
                  {nifty ? `${nifty.changePct >= 0 ? '+' : ''}${nifty.changePct.toFixed(2)}%` : '+2.14%'}
                </span>
              </div>
              <div className={`${styles.floatCard} ${styles.floatBear}`}>
                <span className={styles.floatLabel}>NIFTY BANK</span>
                <span className={styles.floatVal}>
                  {bank ? Number(bank.price).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '52,341.80'}
                </span>
                <span className={(bank?.changePct ?? -1.23) >= 0 ? styles.floatChange : styles.floatChangeDn}>
                  {bank ? `${bank.changePct >= 0 ? '+' : ''}${bank.changePct.toFixed(2)}%` : '-1.23%'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ── TRENDING STOCKS ── */}
      <section className={styles.trendingSection} id="trending">
        <FadeIn y={30} duration={0.6}>
          <h2 className={styles.sectionTitle}>Trending Stocks</h2>
        </FadeIn>
        <Stagger stagger={0.1} duration={0.5} className={styles.stocksGrid}>
          {trendingStocks.map((stock) => (
            <GlassCard key={stock.sym} className={styles.stockCard} onClick={() => handleNav('login')} intensity="light">
              <div className={styles.stockIcon}>
                {stock.sym.slice(0, 2)}
              </div>
              <div className={styles.stockInfo}>
                <span className={styles.stockName}>{stock.name}</span>
                <GlassBadge variant={stock.up ? 'success' : 'danger'}>
                  {stock.up ? '▲' : '▼'} {Math.abs(stock.change).toFixed(2)}%
                </GlassBadge>
              </div>
            </GlassCard>
          ))}
        </Stagger>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section className={styles.themesSection}>
        <div className={styles.themesInner}>
          <FadeIn y={30} duration={0.6}>
            <h2 className={styles.sectionTitle}>Why TradePro?</h2>
            <p style={{ color: '#6b7280', marginTop: 8, marginBottom: 32 }}>
              Experience the future of trading with cutting-edge technology
            </p>
          </FadeIn>
          <Stagger stagger={0.15} duration={0.5} className={styles.themesGrid}>
            {[
              { icon: Zap, title: 'Lightning Fast', desc: 'Execute trades in milliseconds with our low-latency infrastructure', color: 'indigo' },
              { icon: TrendingUp, title: 'Advanced Analytics', desc: 'Real-time market data with professional-grade charting tools', color: 'green' },
              { icon: Shield, title: 'Bank-Grade Security', desc: 'Military-grade encryption with 2FA and biometric authentication', color: 'blue' },
              { icon: Activity, title: 'Real-Time Alerts', desc: 'Instant notifications for price movements and market events', color: 'purple' },
            ].map((feature, i) => (
              <GlassCard key={i} className={styles.themeCard} intensity="medium">
                <div className={styles.themeHeader}>
                  <div className={styles.themeIconBox} style={{ background: `rgba(99, 102, 241, 0.1)`, color: '#6366f1' }}>
                    <feature.icon size={20} />
                  </div>
                  <h3 className={styles.themeTitle}>{feature.title}</h3>
                </div>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                  {feature.desc}
                </p>
              </GlassCard>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── TRENDING THEMES ── */}
      <section className={styles.themesSection} id="themes">
        <div className={styles.themesInner}>
          <FadeIn y={30} duration={0.6}>
            <h2 className={styles.sectionTitle}>Trending Themes</h2>
          </FadeIn>
          <Stagger stagger={0.15} duration={0.5} className={styles.themesGrid}>
            {themes.map((theme) => (
              <GlassCard key={theme.title} className={styles.themeCard} intensity="light">
                <div className={styles.themeHeader}>
                  <div className={styles.themeIconBox}>{theme.icon}</div>
                  <h3 className={styles.themeTitle}>{theme.title}</h3>
                </div>
                <div className={styles.themeHoldings}>
                  {theme.stocks.map((item) => (
                    <div key={item.name} className={styles.holdingRow}>
                      <div className={styles.holdingDetails}>
                        <span className={styles.holdingIcon}>{item.name.charAt(0)}</span>
                        <span className={styles.holdingName}>{item.name}</span>
                      </div>
                      <div className={styles.holdingValues}>
                        <span className={styles.holdingPrice}>{item.price}</span>
                        <GlassBadge variant={item.up ? 'success' : 'danger'}>{item.change}</GlassBadge>
                      </div>
                    </div>
                  ))}
                </div>
                <button className={styles.themeLink} onClick={() => handleNav('login')}>
                  See holdings <ArrowRight size={13} />
                </button>
              </GlassCard>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── LEARN MORE (ARTICLES) ── */}
      <section className={styles.learnSection}>
        <FadeIn y={30} duration={0.6}>
          <h2 className={styles.sectionTitle}>Learn More</h2>
        </FadeIn>
        <Stagger stagger={0.1} duration={0.5} className={styles.learnGrid}>
          {articles.map((art) => (
            <GlassCard key={art.title} className={styles.articleCard} intensity="light">
              <div className={styles.articleImg}>
                <BookOpen size={32} />
              </div>
              <h3 className={styles.articleTitle}>{art.title}</h3>
              <div className={styles.articleFooter}>
                <span>{art.date}</span>
                <GlassBadge variant="info">{art.readTime}</GlassBadge>
              </div>
            </GlassCard>
          ))}
        </Stagger>
      </section>

      {/* ── FAQs ── */}
      <section className={styles.faqSection} id="faq">
        <div className={styles.faqInner}>
          <FadeIn y={30} duration={0.6}>
            <h2 className={styles.sectionTitle} style={{ textAlign: 'center' }}>Frequently Asked Questions</h2>
          </FadeIn>
          <Stagger stagger={0.1} duration={0.4} className={styles.faqList}>
            {faqs.map((faq, index) => (
              <GlassCard key={index} className={`${styles.faqItem} ${activeFaq === index ? styles.faqItemActive : ''}`} intensity="light">
                <button className={styles.faqHeader} onClick={() => toggleFaq(index)}>
                  <span>{faq.q}</span>
                  {activeFaq === index ? <Minus size={16} className={styles.faqIcon} /> : <Plus size={16} className={styles.faqIcon} />}
                </button>
                {activeFaq === index && (
                  <div className={styles.faqContent}>
                    {faq.a}
                  </div>
                )}
              </GlassCard>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── MOBILE BANNER ── */}
      <section className={styles.downloadSection}>
        <div className={styles.downloadInner}>
          <FadeIn y={30} duration={0.6}>
            <div className={styles.downloadCopy}>
              <h2 className={styles.downloadTitle}>
                Everything you need to<br />redefine your investing
              </h2>
              <div className={styles.downloadStats}>
                <div className={styles.dStat}>
                  <span className={styles.dStatVal}>60,500 Cr+</span>
                  <span className={styles.dStatLbl}>Assets Tracked</span>
                </div>
                <div className={styles.dStat}>
                  <span className={styles.dStatVal}>6.2M+</span>
                  <span className={styles.dStatLbl}>Traders Onboarded</span>
                </div>
              </div>
              <div className={styles.downloadBtns}>
                <GlassButton variant="primary" onClick={() => handleNav('register')}>Download App</GlassButton>
                <GlassButton variant="secondary" onClick={() => handleNav('register')}>Learn More</GlassButton>
              </div>
            </div>
          </FadeIn>
          <div className={styles.downloadVisual}>
            <div className={styles.mobileMockup}>
              <div className={styles.mockHeader} />
              <div className={styles.mockScreen}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Your Portfolio</div>
                <div className={styles.mockPrice}>₹20,27,567.00</div>
                <div style={{ color: '#00b386', fontSize: 12, fontWeight: 700 }}>▲ +2.14% Today</div>
                <div className={styles.mockCard}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>EQUITY MOVER</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Reliance Ind.</span>
                    <span style={{ color: '#00b386', fontWeight: 700 }}>+1.40%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        {/* Main columns */}
        <div className={styles.footerInner}>
          {/* About */}
          <div className={styles.footerAbout}>
            <div className={styles.footerBrand} onClick={() => handleNav('home')}>
              <span className={styles.footerLogoBox}>T</span>
              <span className={styles.footerLogoText}>TradePro</span>
            </div>
            <div className={styles.footerSmallcase}>from ⊕ smallcase</div>
            <p className={styles.footerDesc}>
              TradePro provides data, information &amp; content for Indian stocks, mutual funds, ETFs &amp; indices.
            </p>
            <div className={styles.footerAddress}>
              TradePro Technologies Private Limited,<br />
              #51, 3rd Floor, Le Parc Richmonde,<br />
              Richmond Road, Shenthala Nagar,<br />
              Richmond Town, Bangalore - 560025
            </div>
          </div>

          {/* Products */}
          <div className={styles.footerCol}>
            <span className={styles.footerColTitle}>Products</span>
            {['IN Stocks','Mutual Funds','US Stocks','LAS','LAMF','Digital Gold'].map(t => (
              <button key={t} onClick={() => handleNav('login')}>{t}</button>
            ))}
          </div>

          {/* Tools */}
          <div className={styles.footerCol}>
            <span className={styles.footerColTitle}>Tools</span>
            {['MMI','Stock Screener','MF Screener','US Screener','Market Movers','Stock Collections','Mutual Fund Collections'].map(t => (
              <button key={t} onClick={() => handleNav('login')}>{t}</button>
            ))}
          </div>

          {/* Learn & Share */}
          <div className={styles.footerCol}>
            <span className={styles.footerColTitle}>Learn &amp; Share</span>
            {['Social','Learn','Blog','Glossary','Stock Collections','Mutual Fund Collections'].map(t => (
              <button key={t} onClick={() => handleNav('login')}>{t}</button>
            ))}
          </div>

          {/* Fine Print */}
          <div className={styles.footerCol}>
            <span className={styles.footerColTitle}>Fine Print</span>
            {['Pricing','Disclosures','Terms & Conditions','Privacy Policy','Analytical & Information Tools','Community Guidelines'].map(t => (
              <button key={t} onClick={() => handleNav('login')}>{t}</button>
            ))}
          </div>
        </div>

        {/* Social / Support / Rating row */}
        <div className={styles.footerMid}>
          <div className={styles.footerSocialCol}>
            <div className={styles.footerMidLabel}>Find Us On</div>
            <div className={styles.footerSocialRow}>
              {[
                { label: 'YouTube', sym: '▶' },
                { label: 'Instagram', sym: '◉' },
                { label: 'X', sym: '𝕏' },
                { label: 'LinkedIn', sym: 'in' },
              ].map(s => (
                <button key={s.label} className={styles.socialIcon} aria-label={s.label}>{s.sym}</button>
              ))}
            </div>
          </div>
          <div className={styles.footerSupportCol}>
            <div className={styles.footerMidLabel}>Help and Support</div>
            <a href="mailto:support@tradepro.in" className={styles.footerEmail}>support@tradepro.in</a>
          </div>
          <div className={styles.footerRatingCol}>
            <div className={styles.footerMidLabel}>Loving TradePro? Rate Us</div>
            <div className={styles.footerRating}>
              <span className={styles.footerRatingDl}>65L+ downloads</span>
              <span className={styles.footerRatingStar}>⭐ 4.2 App Rating</span>
            </div>
          </div>
        </div>

        {/* Explore accordion */}
        <div className={styles.footerExplore}>
          <div className={styles.footerExploreTitle}>Explore | Most Popular on TradePro</div>
          <div className={styles.footerAccordionGrid}>
            {[
              'Stock Collections','Indices','Sectoral Mutual Funds','Trending ETFs',
              'ETF Collections','Equity Mutual Funds','Debt Mutual Funds','Hybrid Mutual Funds',
              'Trending Stocks','US Stocks','US ETFs','Screeners',
            ].map(item => (
              <button key={item} className={styles.footerAccordionItem}>
                <span>{item}</span>
                <ChevronDown size={14} style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>© 2026 TradePro. SEBI Investment Adviser registration INA200029581.</p>
        </div>
      </footer>
    </div>
  )
}

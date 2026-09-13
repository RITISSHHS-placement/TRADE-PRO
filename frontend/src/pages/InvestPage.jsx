import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Clock, BarChart2, Lock, TrendingUp, Cpu, Landmark, Globe, ChevronRight } from 'lucide-react'
import CompanyLogo from '../components/CompanyLogo'
import { TitleBar, Section, Pill } from '../components/primitive'
import styles from './InvestPage.module.css'

const INVEST_OPTIONS = [
  { id: 'mf', icon: '📊', title: 'Mutual Funds', desc: '₹0 commission · Direct plans · 16,000+ schemes', badge: 'Popular', color: 'var(--purple)', colorBg: 'var(--purple-dim)', paymentName: 'Mutual Fund', paymentType: 'Mutual Fund', min: 500, features: ['SIP from ₹500/month', 'Direct plans only', 'AMFI registered', '0% exit load schemes'] },
  { id: 'stock', icon: '📈', title: 'Equity Stocks', desc: 'NSE & BSE · ₹0 delivery brokerage · All segments', badge: null, color: 'var(--blue)', colorBg: 'var(--blue-dim)', paymentName: 'Equity Investment', paymentType: 'Stock', min: 1, features: ['₹0 delivery brokerage', 'NSE + BSE both', 'Real-time execution', 'GTT orders'], goTo: '/dashboard/trade' },
  { id: 'gold', icon: '🪙', title: 'Digital Gold', desc: '24K · 99.9% purity · No storage fee', badge: 'New', color: 'var(--amber, #b7791f)', colorBg: 'rgba(183,121,31,.08)', paymentName: 'Digital Gold', paymentType: 'Digital Gold', min: 100, features: ['99.9% pure 24K gold', 'No storage charges', 'Start from ₹100', 'Sell anytime'], goTo: '/dashboard/digital-gold' },
  { id: 'fd', icon: '🏛️', title: 'Fixed Deposits', desc: 'Up to 9.5% p.a. · DICGC insured · Flexible tenure', badge: null, color: 'var(--teal)', colorBg: 'rgba(13,148,136,.08)', paymentName: 'Fixed Deposit', paymentType: 'Fixed Deposit', min: 5000, features: ['Up to 9.5% p.a.', 'DICGC insured up to ₹5L', 'Flexible 7 days–10 yrs', 'Auto-renewal option'] },
  { id: 'smallcase', icon: '📋', title: 'Smallcases', desc: 'Curated stock baskets · Theme-based investing', badge: null, color: 'var(--green)', colorBg: 'var(--green-dim)', paymentName: 'Smallcase Investment', paymentType: 'Smallcase', min: 2000, features: ['SEBI-registered managers', 'One-click rebalance', 'Thematic baskets', 'SIP mode available'], goTo: '/dashboard/smallcases' },
  { id: 'ipo', icon: '🚀', title: 'IPO', desc: 'Apply for mainboard & SME IPOs · ASBA process', badge: null, color: 'var(--amber)', colorBg: 'rgba(217,119,6,.08)', paymentName: 'IPO Application', paymentType: 'IPO', min: 14000, features: ['Mainboard & SME IPOs', 'ASBA / UPI mandate', 'Allotment tracking', 'GMP live updates'], goTo: '/dashboard/ipo-watch' },
]

const POPULAR_STOCKS = [
  { sym: 'RELIANCE', name: 'Reliance Industries', price: 2450.40, chg: 1.25 },
  { sym: 'TCS', name: 'TCS', price: 3420.15, chg: -0.45 },
  { sym: 'HDFCBANK', name: 'HDFC Bank', price: 1610.80, chg: 0.85 },
  { sym: 'INFY', name: 'Infosys', price: 1480.20, chg: -1.15 },
  { sym: 'ICICIBANK', name: 'ICICI Bank', price: 1264.50, chg: 2.10 },
  { sym: 'SBIN', name: 'SBI', price: 698.25, chg: -0.80 },
  { sym: 'BAJFINANCE', name: 'Bajaj Finance', price: 7084.55, chg: 1.85 },
  { sym: 'WIPRO', name: 'Wipro', price: 540.70, chg: 0.60 },
]
const POPULAR_MF = [
  { code: 'PPFCF', name: 'Parag Parikh Flexi Cap', nav: '78.42', category: 'Flexi Cap', ret1y: '+23.4%' },
  { code: 'HMOF', name: 'HDFC Mid-Cap Opp.', nav: '132.80', category: 'Mid Cap', ret1y: '+31.2%' },
  { code: 'SNIF', name: 'SBI Nifty Index Fund', nav: '245.60', category: 'Index', ret1y: '+18.7%' },
  { code: 'ABF', name: 'Axis Bluechip Fund', nav: '56.80', category: 'Large Cap', ret1y: '+15.2%' },
]

export default function InvestPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')

  const goToPayment = (opt, name, nav, category) => {
    const params = new URLSearchParams({
      name: name || opt.paymentName,
      type: opt.paymentType,
      min: String(opt.min),
      ...(nav ? { nav } : {}),
      ...(category ? { category } : {}),
    })
    navigate(`/dashboard/payment?${params.toString()}`)
  }
  const handleInvest = (opt) => {
    if (opt.goTo) navigate(opt.goTo)
    else goToPayment(opt)
  }

  const visibleOptions = INVEST_OPTIONS.filter(o => {
    if (activeTab === 'all') return true
    if (activeTab === 'stocks') return o.id === 'stock'
    if (activeTab === 'mf') return o.id === 'mf'
    if (activeTab === 'gold') return o.id === 'gold'
    if (activeTab === 'fixed') return o.id === 'fd'
    return true
  })

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <TitleBar title="Invest" subtitle="Choose how you want to grow your money — all investments go through secure payment" />

        <div className={styles.tabs}>
          {['all', 'stocks', 'mf', 'gold', 'fixed'].map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'all' ? 'All Products' : tab === 'mf' ? 'Mutual Funds' : tab === 'gold' ? 'Digital Gold' : tab === 'fixed' ? 'Fixed Income' : 'Stocks'}
            </button>
          ))}
        </div>

        <div className={styles.optionsGrid}>
          {visibleOptions.map((opt) => (
            <div key={opt.id} className={styles.optionCard} style={{ ['--accent']: opt.color }}>
              {opt.badge && (
                <Pill variant={opt.badge === 'Popular' ? 'up' : 'blue'} size="sm" className={styles.badge}>{opt.badge}</Pill>
              )}
              <div className={styles.optionIcon} dangerouslySetInnerHTML={{ __html: opt.icon }} />
              <h3 className={styles.optionTitle}>{opt.title}</h3>
              <p className={styles.optionDesc}>{opt.desc}</p>
              <div className={styles.features}>
                {opt.features.map((f) => (
                  <span key={f} className={styles.feature} style={{ ['--accent']: opt.color }}>{f}</span>
                ))}
              </div>
              <button className={styles.ctaBtn} onClick={() => handleInvest(opt)}>
                {opt.goTo ? `Explore ${opt.title}` : `Invest in ${opt.title}`}
                <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Popular stocks */}
        <Section title="Quick-Invest: Top Stocks" subtitle="One-click invest via secure payment">
          <div className={styles.actionRow}>
            <button className={styles.ghostBtn} onClick={() => navigate('/dashboard/trade')}>View All →</button>
          </div>
          <div className={styles.stocksGrid}>
            {POPULAR_STOCKS.map((s) => {
              const up = s.chg >= 0
              return (
                <div
                  key={s.sym}
                  className={styles.stockTile}
                  onClick={() => goToPayment(INVEST_OPTIONS.find((o) => o.id === 'stock'), s.name, String(s.price), 'Equity')}
                >
                  <CompanyLogo symbol={s.sym} name={s.name} size={36} borderRadius={8} />
                  <div className={styles.stockInfo}>
                    <div className={styles.stockSym}>{s.sym}</div>
                    <div className={styles.stockName}>{s.name}</div>
                  </div>
                  <div className={styles.stockPrice}>
                    <div className={styles.stockVal}>₹{s.price.toLocaleString('en-IN')}</div>
                    <div className={up ? styles.green : styles.red}>{up ? '+' : ''}{s.chg.toFixed(2)}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        {/* Top MFs */}
        <Section title="Top Performing Mutual Funds" subtitle="Direct plans · ₹0 commission">
          <div className={styles.actionRow}>
            <button className={styles.ghostBtn} onClick={() => navigate('/dashboard/mf')}>View All →</button>
          </div>
          <div className={styles.mfList}>
            {POPULAR_MF.map((f) => (
              <div
                key={f.code}
                className={styles.mfRow}
                onClick={() => goToPayment(INVEST_OPTIONS.find((o) => o.id === 'mf'), f.name, f.nav, f.category)}
              >
                <div className={styles.mfLogo}>📊</div>
                <div className={styles.mfInfo}>
                  <div className={styles.mfName}>{f.name}</div>
                  <div className={styles.mfCat}>{f.category} · NAV ₹{f.nav}</div>
                </div>
                <div className={styles.mfRet}>
                  <div className={styles.green}>{f.ret1y}</div>
                  <div className={styles.mfRetLabel}>1Y returns</div>
                </div>
                <button className={styles.inlineBtn} onClick={(e) => { e.stopPropagation(); goToPayment(INVEST_OPTIONS.find((o) => o.id === 'mf'), f.name, f.nav, f.category) }}>Invest</button>
              </div>
            ))}
          </div>
        </Section>

        {/* Trust badges */}
        <Section title="Why invest with TradePro?" noBorder>
          <div className={styles.trustGrid}>
            {[
              { icon: <ShieldCheck size={20} />, label: 'Bank-grade Security', desc: 'SEBI regulated · 256-bit SSL encryption' },
              { icon: <Clock size={20} />, label: 'Instant Execution', desc: 'Orders executed in under 50ms on NSE' },
              { icon: <BarChart2 size={20} />, label: '16,000+ Schemes', desc: 'All direct mutual funds from every AMC' },
              { icon: <TrendingUp size={20} />, label: 'Zero Commission', desc: 'No hidden charges on MF & equity delivery' },
              { icon: <Lock size={20} />, label: 'Regulated', desc: 'SEBI-registered intermediary' },
              { icon: <Cpu size={20} />, label: 'AI Insights', desc: 'Personalised recommendations' },
            ].map((f) => (
              <div key={f.label} className={styles.trustItem}>
                <div className={styles.trustIcon}>{f.icon}</div>
                <div>
                  <div className={styles.trustLabel}>{f.label}</div>
                  <div className={styles.trustDesc}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

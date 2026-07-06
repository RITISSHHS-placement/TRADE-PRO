import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight } from 'lucide-react'
import styles from './PricingPage.module.css'

const CHARGES = [
  {
    amount: '0',
    title: 'Free equity delivery',
    sub: 'NSE · BSE',
    desc: 'All equity delivery investments are absolutely free — ₹0 brokerage, ₹0 commission.',
    color: '#f59e0b',
    features: ['No brokerage', 'Unlimited trades', 'NSE & BSE', 'Real-time prices'],
  },
  {
    amount: '20',
    title: 'Intraday & F&O',
    sub: 'Equity · Currency · Commodity',
    desc: 'Flat ₹20 or 0.03% (whichever is lower) per executed order across all intraday and derivative segments.',
    color: '#f59e0b',
    highlight: true,
    features: ['₹20 flat or 0.03%', 'Equity intraday', 'Futures & Options', 'Currency & Commodity'],
  },
  {
    amount: '0',
    title: 'Direct mutual funds',
    sub: 'AMFI registered · All AMCs',
    desc: 'All direct mutual fund investments are absolutely free — ₹0 commission, ₹0 DP charges, ₹0 redemption fee.',
    color: '#f59e0b',
    features: ['₹0 commission', 'All AMCs', 'SIP from ₹500', 'Instant redemption'],
  },
]

const TAXES = [
  { name: 'STT/CTT',         equity: '0.1% on buy & sell', fo: '0.02% on sell side (F)', note: 'Securities Transaction Tax' },
  { name: 'Transaction',     equity: 'NSE: 0.00297%',       fo: 'NSE: 0.00297%',         note: 'Exchange transaction charges' },
  { name: 'GST',             equity: '18% on brokerage',    fo: '18% on brokerage',      note: 'On brokerage + transaction charges' },
  { name: 'SEBI charges',    equity: '₹10/crore',           fo: '₹10/crore',             note: 'SEBI regulatory fee' },
  { name: 'Stamp duty',      equity: '0.015% on buy',       fo: '0.002% on buy',         note: 'State stamp duty on buy side' },
  { name: 'DP charges',      equity: '₹15.93/scrip on sell', fo: 'N/A',                  note: 'Depository participant charges' },
]

export default function PricingPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Charges & Pricing</h1>
        <p className={styles.sub}>Transparent, flat-fee pricing with no hidden charges</p>
      </div>

      {/* ── Main charges ── */}
      <div className={styles.chargesGrid}>
        {CHARGES.map((c) => (
          <div key={c.title} className={`${styles.chargeCard} ${c.highlight ? styles.chargeHighlight : ''}`}>
            {c.highlight && <div className={styles.popularBadge}>Most common</div>}
            <div className={styles.chargeBig}>
              <span className={styles.rupee}>₹</span>
              <span className={styles.amount}>{c.amount}</span>
            </div>
            <h2 className={styles.chargeTitle}>{c.title}</h2>
            <p className={styles.chargeSub}>{c.sub}</p>
            <p className={styles.chargeDesc}>{c.desc}</p>
            <ul className={styles.featureList}>
              {c.features.map((f) => (
                <li key={f} className={styles.featureItem}>
                  <CheckCircle size={14} className={styles.check} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── CTA ── */}
      <div className={styles.cta}>
        <h2 className={styles.ctaTitle}>Start trading with zero brokerage on equity delivery</h2>
        <p className={styles.ctaSub}>Open a free account in minutes. No minimum balance required.</p>
        <div className={styles.ctaBtns}>
          <button className={styles.btnPrimary} onClick={() => navigate('/dashboard/trade')}>
            Start Trading <ArrowRight size={15} />
          </button>
          <button className={styles.btnSecondary} onClick={() => navigate('/dashboard/mf')}>
            Explore Mutual Funds
          </button>
        </div>
      </div>

      {/* ── Taxes table ── */}
      <div className={styles.taxSection}>
        <h2 className={styles.taxTitle}>Taxes & Regulatory Charges</h2>
        <p className={styles.taxSub}>Charged by government / exchange — same across all brokers</p>
        <div className={styles.taxTable}>
          <div className={styles.taxHead}>
            <span>Charge</span>
            <span>Equity Delivery / Intraday</span>
            <span>F&O</span>
            <span>Note</span>
          </div>
          {TAXES.map((t) => (
            <div key={t.name} className={styles.taxRow}>
              <span className={styles.taxName}>{t.name}</span>
              <span>{t.equity}</span>
              <span>{t.fo}</span>
              <span className={styles.taxNote}>{t.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <p className={styles.disclaimer}>
        All charges are subject to change. GST, STT and other statutory charges are levied by the government/exchange and are non-negotiable across all brokers. Brokerage is charged on the executed quantity only.
      </p>
    </div>
  )
}

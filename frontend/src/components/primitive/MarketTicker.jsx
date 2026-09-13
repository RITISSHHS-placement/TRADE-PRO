import React, { useMemo } from 'react'
import { useMarketData } from '../../hooks'
import styles from './MarketTicker.module.css'

// Global markets the spec asks for (static fallback / simulated prices).
// Indian indices are merged from live NSE data when available.
const GLOBAL_TICKERS = [
  { sym: 'NIFTY 50',      price: 24856.45, chg: 2.14, currency: '₹', color: 'up' },
  { sym: 'SENSEX',        price: 81450.30, chg: 1.87, currency: '₹', color: 'up' },
  { sym: 'NIFTY BANK',    price: 52341.80, chg: -1.23, currency: '₹', color: 'down' },
  { sym: 'NASDAQ',        price: 19872.50, chg: 1.12, currency: '$', color: 'up' },
  { sym: 'S&P 500',       price: 5682.70, chg: 0.73, currency: '$', color: 'up' },
  { sym: 'BAJFINANCE',    price: 7124.55, chg: 1.85, currency: '₹', color: 'up' },
  { sym: 'BTC',           price: 68245.60, chg: 2.40, currency: '₹', color: 'up' },
  { sym: 'GOLD',          price: 72500.00, chg: 0.51, currency: '₹', color: 'up' },
  { sym: 'USD/INR',       price: 83.42, chg: -0.18, currency: '₹', color: 'down' },
]

const fmt = (n, d = 2) =>
  Number(n || 0).toLocaleString(typeof n === 'string' && n.includes('.') ? 'en-US' : 'en-IN', {
    minimumFractionDigits: d, maximumFractionDigits: d,
  })

function tickItem(t, i) {
  const up = t.chg >= 0
  return (
    <span key={`${t.sym}-${i}`} className={styles.item} title={t.sym}>
      <span className={styles.sym}>{t.sym}</span>
      <span className={styles.price}>{t.currency === '₹' ? '₹' : '$'}{fmt(t.price, t.sym === 'USD/INR' ? 2 : undefined)}</span>
      <span className={up ? styles.up : styles.down}>{up ? '▲' : '▼'} {Math.abs(t.chg).toFixed(2)}%</span>
      <span className={styles.sep}>|</span>
    </span>
  )
}

/**
 * MarketTicker — continuous marquee.
 * Merges live NSE indices (from useMarketData) over the static global list.
 * Falls back to static when data not yet loaded.
 *
 * Two copies of the items are laid end-to-end and scrolled by one full
 * track width (-100%) so the second copy slides in exactly where the first
 * one exits — a seamless, gapless loop.
 */
export default function MarketTicker() {
  const { indices, stocks } = useMarketData()

  const items = useMemo(() => {
    return GLOBAL_TICKERS.map((t) => {
      const live = indices?.[t.sym] || stocks?.[t.sym]
      if (live && live.price != null && live.price > 0) {
        return { ...t, price: live.price, chg: live.changePct ?? live.change ?? t.chg }
      }
      return t
    })
  }, [indices, stocks])

  // Duplicate once for a seamless infinite scroll (avoids the index-bleed
  // bug from stamping the array index onto the symbol label).
  const doubled = [...items, ...items]
  return (
    <div className={styles.wrap} role="marquee" aria-label="Market ticker">
      <div className={styles.track}>
        {doubled.map((t, i) => tickItem(t, i))}
      </div>
    </div>
  )
}

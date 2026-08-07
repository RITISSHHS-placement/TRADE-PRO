import React, { memo } from 'react'
import { useSelector } from 'react-redux'
import { SYMBOL_LABELS } from '../services/marketData'
import { Card } from './ui'
import styles from './MarketWatch.module.css'

const WATCH_SYMBOLS = [
  'NIFTY 50', 'NIFTY BANK', 'RELIANCE', 'INFY',
  'HDFCBANK', 'TCS', 'WIPRO', 'ICICIBANK',
]

function MiniBar({ pct }) {
  const up = pct >= 0
  const h = Math.min(88, Math.max(20, Math.abs(pct) * 9 + 20))
  return (
    <div className={styles.barWrap}>
      <span
        className={`${styles.bar} ${up ? styles.barUp : styles.barDown}`}
        style={{ height: `${h}%` }}
      />
    </div>
  )
}

const MarketWatch = memo(function MarketWatch() {
  const indices     = useSelector(s => s.market?.indices || {})
  const stocks      = useSelector(s => s.market?.stocks  || {})
  const lastUpdated = useSelector(s => s.market?.lastUpdated)
  const quotes = { ...indices, ...stocks }

  const fmtTime = ts =>
    ts ? new Date(ts).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }) : 'Connecting…'

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Market Pulse</h2>
          <div className={styles.meta}>
            <span className={styles.liveDot} />
            <span className={styles.liveText}>Live · auto-refresh every 5s</span>
            <span className={styles.time}>{fmtTime(lastUpdated)}</span>
          </div>
        </div>
      </div>

      <div className={styles.list}>
        {WATCH_SYMBOLS.map(sym => {
          const q  = quotes[sym]
          const up = (q?.changePct ?? 0) >= 0
          return (
            <div key={sym} className={styles.row}>
              <div className={styles.info}>
                <div className={styles.name}>{SYMBOL_LABELS[sym] || sym}</div>
                <div className={styles.sub}>
                  {sym === 'NIFTY 50' || sym === 'NIFTY BANK' ? 'Index' : 'NSE'}
                </div>
              </div>
              <div className={styles.right}>
                <div className={styles.price}>
                  {q ? `₹${(q.price ?? 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2, maximumFractionDigits: 2,
                  })}` : '—'}
                </div>
                <div className={`${styles.change} ${up ? styles.up : styles.down}`}>
                  {q ? `${up ? '↑' : '↓'} ${Math.abs(q.changePct ?? 0).toFixed(2)}%` : '—'}
                </div>
              </div>
              <MiniBar pct={q?.changePct ?? 0} />
            </div>
          )
        })}
      </div>
    </Card>
  )
})

export default MarketWatch

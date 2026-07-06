import React, { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Search, RefreshCw, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { useMarketData } from '../hooks'
import { Card, Spinner } from '../components/ui'
import { SYMBOL_LABELS, INDEX_KEYS } from '../services/marketData'
import styles from './MarketPage.module.css'

const fmt2 = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmt0 = (n) => (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
const fmtVol = (n) => {
  if (!n) return '—'
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `${(n / 1e5).toFixed(2)}L`
  return n.toLocaleString('en-IN')
}
const fmtTime = (ts) =>
  ts ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--'

const TABS = ['Indices', 'NIFTY 50', 'Gainers', 'Losers']

export default function MarketPage() {
  const { indices, stocks, gainers, losers, loading, lastUpdated, refresh } = useMarketData()
  const [tab,     setTab]     = useState('Indices')
  const [search,  setSearch]  = useState('')
  const [selected, setSelected] = useState(null)

  const indicesList = Object.values(indices)
  const stocksList  = Object.values(stocks)

  const getList = () => {
    let list = []
    if (tab === 'Indices')  list = indicesList
    if (tab === 'NIFTY 50') list = stocksList
    if (tab === 'Gainers')  list = gainers.map(g => ({ ...g, price: g.price, changePct: g.changePct }))
    if (tab === 'Losers')   list = losers.map(l =>  ({ ...l, price: l.price, changePct: l.changePct }))
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter(x => (x.name || x.symbol || '').toLowerCase().includes(q))
  }

  const rows = getList()
  const sel  = selected ? (indices[selected] || stocks[selected] || gainers.find(g => g.symbol === selected) || losers.find(l => l.symbol === selected)) : null

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Market Hub</h1>
          <p className={styles.sub}>
            {loading && !lastUpdated ? 'Connecting to NSE live data…'
              : `NSE India live data · ${fmtTime(lastUpdated)}`}
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={refresh} disabled={loading}>
          <RefreshCw size={14} className={loading ? styles.spinning : ''} />
          Refresh
        </button>
      </div>

      {/* ── Ticker strip ── */}
      <div className={styles.ticker}>
        {Object.entries(INDEX_KEYS).slice(0, 8).map(([key, label]) => {
          const q  = indices[key]
          const up = (q?.changePct ?? 0) >= 0
          return (
            <div key={key} className={styles.chip} onClick={() => setSelected(key)}>
              <span className={styles.chipSym}>{label}</span>
              <span className={styles.chipPrice}>{q ? fmt2(q.price) : '—'}</span>
              {q && <span className={up ? styles.chipUp : styles.chipDn}>{up ? '▲' : '▼'}{Math.abs(q.changePct ?? 0).toFixed(2)}%</span>}
            </div>
          )
        })}
      </div>

      <div className={styles.body}>

        {/* ── List panel ── */}
        <div className={styles.listPanel}>
          {/* Tabs */}
          <div className={styles.tabs}>
            {TABS.map(t => (
              <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
                onClick={() => { setTab(t); setSearch('') }}>{t}</button>
            ))}
          </div>

          {/* Search */}
          <div className={styles.searchRow}>
            <Search size={13} className={styles.searchIco} />
            <input className={styles.searchIn} placeholder="Search…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Table head */}
          <div className={styles.thead}>
            <span>Name</span><span>Price</span><span>Change</span>
          </div>

          <div className={styles.tbody}>
            {rows.length === 0 ? (
              <div className={styles.empty}>
                {loading ? <Spinner size={20} /> : 'No data yet. Click Refresh.'}
              </div>
            ) : rows.map((row, i) => {
              const sym  = row.symbol || row.name
              const up   = (row.changePct ?? 0) >= 0
              const isSel = selected === sym
              return (
                <div key={sym || i}
                  className={`${styles.row} ${isSel ? styles.rowSel : ''}`}
                  onClick={() => setSelected(sym)}>
                  <div className={styles.rowSym}>
                    <span className={styles.rowName}>{row.name || SYMBOL_LABELS[sym] || sym}</span>
                    {row.symbol && <span className={styles.rowCode}>{row.symbol}</span>}
                  </div>
                  <span className={styles.rowPrice}>{row.price ? fmt2(row.price) : '—'}</span>
                  <span className={up ? styles.rowUp : styles.rowDn}>
                    {row.changePct != null ? `${up ? '+' : ''}${row.changePct.toFixed(2)}%` : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Detail panel ── */}
        <div className={styles.detail}>
          {sel ? (
            <Card className={styles.detailCard}>
              <div className={styles.detailName}>{sel.name || SYMBOL_LABELS[selected] || selected}</div>
              <div className={`${styles.detailPrice} ${(sel.changePct ?? 0) >= 0 ? styles.priceUp : styles.priceDn}`}>
                {fmt2(sel.price)}
                <span>{(sel.changePct ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(sel.changePct ?? 0).toFixed(2)}%</span>
              </div>
              <div className={styles.detailGrid}>
                {[
                  ['Open',       `₹${fmt2(sel.open)}`],
                  ['High',       `₹${fmt2(sel.high)}`],
                  ['Low',        `₹${fmt2(sel.low)}`],
                  ['Prev Close', `₹${fmt2(sel.prevClose)}`],
                  sel.volume   ? ['Volume',   fmtVol(sel.volume)]        : null,
                  sel.yearHigh ? ['52W High', `₹${fmt2(sel.yearHigh)}`]  : null,
                  sel.yearLow  ? ['52W Low',  `₹${fmt2(sel.yearLow)}`]   : null,
                  sel.change   ? ['Change ₹', `${sel.change >= 0 ? '+' : ''}${fmt2(sel.change)}`] : null,
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k} className={styles.detailItem}>
                    <span className={styles.dk}>{k}</span>
                    <span className={styles.dv}>{v}</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className={styles.detailCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
              <span style={{ color: 'var(--gray-4)', fontSize: 14 }}>Click any row to see details</span>
            </Card>
          )}

          {/* Summary cards */}
          <div className={styles.summaryRow}>
            <Card className={styles.summCard}>
              <div className={styles.summHead}><TrendingUp size={14}/> Advances</div>
              <div className={styles.summVal} style={{ color: 'var(--green-dark)' }}>
                {stocksList.filter(s => (s.changePct ?? 0) > 0).length}
              </div>
            </Card>
            <Card className={styles.summCard}>
              <div className={styles.summHead}><TrendingDown size={14}/> Declines</div>
              <div className={styles.summVal} style={{ color: 'var(--red-dark)' }}>
                {stocksList.filter(s => (s.changePct ?? 0) < 0).length}
              </div>
            </Card>
            <Card className={styles.summCard}>
              <div className={styles.summHead}>Unchanged</div>
              <div className={styles.summVal} style={{ color: 'var(--gray-3)' }}>
                {stocksList.filter(s => (s.changePct ?? 0) === 0).length}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

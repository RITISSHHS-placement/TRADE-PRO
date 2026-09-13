import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, TrendingUp, BarChart3, Newspaper, PieChart, Wallet, Zap } from 'lucide-react'
import { useMarketData } from '../../hooks'
import { SYMBOL_LABELS } from '../../services/marketData'
import styles from './CommandPalette.module.css'

// Primary navigation pages surfaced in ⌘K
const PAGES = [
  { id: 'dashboard',   label: 'Dashboard',        to: '/dashboard',        icon: BarChart3 },
  { id: 'trade',       label: 'Trade',            to: '/dashboard/trade',  icon: TrendingUp },
  { id: 'crypto',      label: 'Crypto',           to: '/dashboard/crypto', icon: Wallet },
  { id: 'invest',      label: 'Invest',           to: '/dashboard/invest', icon: PieChart },
  { id: 'portfolio',   label: 'Portfolio',        to: '/dashboard/portfolio', icon: Wallet },
  { id: 'us-stocks',   label: 'US Stocks',        to: '/dashboard/us-stocks', icon: BarChart3 },
  { id: 'screener',    label: 'Stock Screener',   to: '/dashboard/screener',  icon: BarChart3 },
  { id: 'news',        label: 'News',             to: '/dashboard/news',      icon: Newspaper },
  { id: 'ipo',         label: 'IPO Watch',        to: '/dashboard/ipo-watch', icon: Zap },
  { id: 'recovery',    label: 'Revenue Recovery', to: '/dashboard/revenue-recovery', icon: Zap },
]

export default function CommandPalette() {
  const { quotes } = useMarketData()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') { setOpen(false); setQuery('') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [open])

  // Build searchable symbol list from live quotes + SYMBOL_LABELS
  const symbols = useMemo(() => {
    const live = Object.values(quotes || {}).slice(0, 120)
    const list = live.map((q) => ({
      id: `sym-${q.symbol}`, group: 'Quotes', label: SYMBOL_LABELS[q.symbol] || q.symbol || q.name,
      sub: q.name || '', value: q, icon: '📈',
    }))
    // Add a handful of labelled symbols not yet present
    const seen = new Set(live.map((q) => (q.symbol || '').toUpperCase())
      .concat(list.map((l) => l.label)))
    ;(Object.entries(SYMBOL_LABELS).slice(0, 40)).forEach(([sym, label]) => {
      if (!seen.has(sym) && !seen.has(label)) {
        list.push({ id: `sym2-${sym}`, group: 'Symbols', label: label, sub: sym, icon: '📊' })
      }
    })
    return list
  }, [quotes])

  const filtered = useMemo(() => {
    const q = (query || '').trim().toLowerCase()
    if (!q) {
      return { symbols: symbols.slice(0, 8), pages: PAGES.slice(0, 6) }
    }
    const symFilter = symbols.filter((s) =>
      s.label.toLowerCase().includes(q) || s.sub.toLowerCase().includes(q)
    )
    const pageFilter = PAGES.filter((p) => p.label.toLowerCase().includes(q))
    return { symbols: symFilter.slice(0, 10), pages: pageFilter }
  }, [query, symbols])

  const onPick = (to) => {
    navigate(to)
    setOpen(false)
    setQuery('')
  }

  const hasResults = filtered.symbols.length || filtered.pages.length
  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={() => { setOpen(false); setQuery('') }}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.searchWrap}>
          <Search size={16} color="#6b7280" />
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Search stocks, ETFs, mutual funds, crypto… (⌘K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filtered.pages[0]) onPick(filtered.pages[0].to)
            }}
          />
          <kbd className={styles.kbd}>↩</kbd>
        </div>

        {!hasResults && query ? (
          <div className={styles.empty}>No results for "{query}"</div>
        ) : (
          <div className={styles.results}>
            {filtered.symbols.length > 0 && (
              <div className={styles.group}>
                <div className={styles.groupTitle}>Quotes</div>
                {filtered.symbols.map((s) => (
                  <button key={s.id} className={styles.result} onClick={() => onPick('/dashboard/screener')}>
                    <span className={styles.resultIcon}>{s.icon}</span>
                    <div className={styles.resultMain}>
                      <span className={styles.resultLabel}>{s.label}</span>
                      {s.sub && <span className={styles.resultSub}>{s.sub}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {filtered.pages.length > 0 && (
              <div className={styles.group}>
                <div className={styles.groupTitle}>Pages</div>
                {filtered.pages.map((p) => (
                  <button key={p.id} className={styles.result} onClick={() => onPick(p.to)}>
                    <span className={styles.resultIcon}><p.icon size={15} /></span>
                    <span className={styles.resultLabel}>{p.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className={styles.footer}>
          <kbd className={styles.kbd}>⌘</kbd> + <kbd className={styles.kbd}>K</kbd> global search · <kbd className={styles.kbd}>↑ ↓</kbd> navigate · <kbd className={styles.kbd}>↩</kbd> open
        </div>
      </div>
    </div>
  )
}

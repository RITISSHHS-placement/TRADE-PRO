import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Zap, Shield,
  Activity, RefreshCw, Clock, ArrowUpRight, ArrowDownRight,
  BarChart2, Newspaper, Globe, PieChart, Star,
  Wallet, Eye, Target, Flame, ArrowRight, ChevronRight,
  Landmark, Coins, Bitcoin, BarChart3, LineChart,
} from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { setKillSwitchModal } from '../store/slices/uiSlice'
import { useTrades, useMarketData } from '../hooks'
import { SYMBOL_LABELS } from '../services/marketData'
import CompanyLogo from '../components/CompanyLogo'
import TradingViewWidget from '../components/TradingViewWidget'
import styles from './DashboardPage.module.css'

gsap.registerPlugin(ScrollTrigger)

const STATUS_COLORS = {
  PENDING: 'warning', COMPLETE: 'success',
  CANCELLED: 'default', REJECTED: 'danger', PARTIAL: 'accent',
}

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

const TICKER_INDICES = ['NIFTY 50', 'NIFTY BANK', 'SENSEX', 'NIFTY IT', 'INDIA VIX']

const WATCHLIST = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
  'HINDUNILVR', 'SBIN', 'BAJFINANCE', 'BHARTIARTL',
  'KOTAKBANK', 'WIPRO', 'LT', 'ITC', 'TATAMOTORS', 'AXISBANK',
]

/* ── Mini Sparkline SVG ── */
function MiniSparkline({ data, width = 80, height = 28, color = '#22c55e' }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${height} ${points} ${width},${height}`} fill={`${color}15`} stroke="none" />
    </svg>
  )
}

/* ── Animated Counter ── */
function AnimatedCounter({ value, prefix = '', suffix = '', className = '' }) {
  const ref = useRef(null)
  const prevVal = useRef(value)
  useEffect(() => {
    if (!ref.current || value === prevVal.current) return
    const diff = value - prevVal.current
    prevVal.current = value
    const obj = { val: value - diff }
    gsap.to(obj, {
      val: value, duration: 0.8, ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = prefix + fmt0(obj.val) + suffix
        }
      },
    })
  }, [value])
  return <span ref={ref} className={className}>{prefix}{fmt0(value)}{suffix}</span>
}

/* ── GSAP Hooks ── */
function useScrollReveal(selector, deps = []) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const els = ref.current.querySelectorAll(selector)
    if (!els.length) return
    const ctx = gsap.context(() => {
      gsap.fromTo(els,
        { opacity: 0, y: 30, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.6, ease: 'power3.out',
          stagger: 0.06,
          scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
        }
      )
    }, ref)
    return () => ctx.revert()
  }, deps)
  return ref
}

function usePriceFlash(value, up) {
  const ref = useRef(null)
  const prev = useRef(value)
  useEffect(() => {
    if (!ref.current || value === prev.current) return
    prev.current = value
    gsap.timeline()
      .to(ref.current, { color: up ? '#22c55e' : '#ef4444', scale: 1.04, duration: 0.18, ease: 'power2.out' })
      .to(ref.current, { color: 'inherit', scale: 1, duration: 0.5, ease: 'power2.inOut' })
  }, [value])
  return ref
}

/* ── Animated Number Counter ── */
function AnimatedNumber({ value, prefix = '', suffix = '', className = '' }) {
  const ref = useRef(null)
  const prev = useRef(value)
  useEffect(() => {
    if (!ref.current) return
    const diff = value - prev.current
    if (Math.abs(diff) < 0.01) return
    prev.current = value
    const obj = { val: prev.current - diff }
    gsap.to(obj, {
      val: value, duration: 0.8, ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) ref.current.textContent = prefix + fmt0(obj.val) + suffix
      },
    })
  }, [value])
  return <span ref={ref} className={className}>{prefix}{fmt0(value)}{suffix}</span>
}

/* ── Ticker Bar ── */
function TickerBar({ indices, lastUpdated, loading, refresh }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current.children,
      { opacity: 0, x: -10 },
      { opacity: 1, x: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' }
    )
  }, [])
  return (
    <div className={styles.tickerBar} ref={ref}>
      {TICKER_INDICES.map((key) => {
        const q = indices[key]
        const up = (q?.changePct ?? 0) >= 0
        return (
          <div key={key} className={styles.tickerItem}>
            <span className={styles.tickerSym}>{SYMBOL_LABELS[key] || key}</span>
            {q ? (
              <>
                <span className={styles.tickerVal}>{fmt2(q.price)}</span>
                <span className={up ? styles.tickerUp : styles.tickerDown}>
                  {up ? '▲' : '▼'} {Math.abs(q.changePct ?? 0).toFixed(2)}%
                </span>
              </>
            ) : <span className={styles.tickerVal}>—</span>}
          </div>
        )
      })}
      <div className={styles.tickerRight}>
        <span className={styles.tickerLive}>
          <span className={styles.liveDot} />
          LIVE
        </span>
        <span className={styles.tickerTime}><Clock size={11} /> {fmtTime(lastUpdated)}</span>
        <button className={styles.refreshBtn} onClick={refresh} disabled={loading}>
          <RefreshCw size={12} className={loading ? styles.spinning : ''} />
        </button>
      </div>
    </div>
  )
}

/* ── Index Card with Sparkline ── */
function IndexCard({ label, data, onClick, isSelected, delay = 0, color = '#2962ff' }) {
  const ref = useRef(null)
  const up = (data?.changePct ?? 0) >= 0
  const sparkColor = up ? '#22c55e' : '#ef4444'

  // Generate fake sparkline data from price for visual effect
  const sparkData = useMemo(() => {
    if (!data?.price) return null
    const base = data.price
    const pts = []
    for (let i = 0; i < 20; i++) {
      pts.push(base + (Math.sin(i * 0.5) * base * 0.005) + (Math.random() - 0.5) * base * 0.002)
    }
    pts.push(data.price)
    return pts
  }, [data?.price])

  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current,
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, delay, ease: 'power3.out' }
    )
  }, [])

  const priceRef = usePriceFlash(data?.price, up)

  return (
    <div
      ref={ref}
      className={`${styles.indexCard} ${isSelected ? styles.indexCardActive : ''}`}
      onClick={onClick}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className={styles.icGlow} style={{ background: `radial-gradient(circle, ${color}12, transparent 70%)` }} />
      <div className={styles.icHeader}>
        <span className={styles.icLabel}>{label}</span>
        {isSelected && <span className={styles.icActive} style={{ background: color }} />}
      </div>
      <div className={styles.icBody}>
        <div ref={priceRef} className={styles.icPrice}>
          {data ? `₹${fmt2(data.price)}` : '—'}
        </div>
        {sparkData && <MiniSparkline data={sparkData} color={sparkColor} width={90} height={32} />}
      </div>
      <div className={up ? styles.icChangeUp : styles.icChangeDown}>
        {data ? (
          <>
            {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {up ? '+' : ''}{fmt2(data.change)}
            <span className={styles.icPercent}>({up ? '+' : ''}{(data.changePct ?? 0).toFixed(2)}%)</span>
          </>
        ) : '—'}
      </div>
    </div>
  )
}

/* ── Stock Row ── */
function StockRow({ sym, quote, isSelected, onSelect }) {
  const up = (quote?.changePct ?? 0) >= 0
  const name = SYMBOL_LABELS[sym] || sym
  return (
    <div
      className={`${styles.stockRow} ${isSelected ? styles.stockRowActive : ''}`}
      onClick={() => onSelect(sym)}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(sym)}
    >
      <div className={styles.srSym}>
        <CompanyLogo symbol={sym} name={name} size={28} borderRadius={6} style={{marginRight:8,flexShrink:0}} />
        <span className={styles.srName}>{name}</span>
        <span className={styles.srCode}>{sym}</span>
      </div>
      <div className={styles.srPrice}>
        {quote ? `₹${fmt2(quote.price)}` : <span className={styles.srLoading}>—</span>}
      </div>
      <div className={up ? styles.srUp : styles.srDown}>
        {quote ? (
          <>
            {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(quote.change ?? 0).toFixed(2)}
            <span>({up ? '+' : ''}{(quote.changePct ?? 0).toFixed(2)}%)</span>
          </>
        ) : '—'}
      </div>
      <div className={styles.srStats}>
        {quote ? (
          <>
            <span><b>{fmt2(quote.open)}</b></span>
            <span style={{ color: '#22c55e' }}><b>{fmt2(quote.high)}</b></span>
            <span style={{ color: '#ef4444' }}><b>{fmt2(quote.low)}</b></span>
            <span><b>{fmtVol(quote.volume)}</b></span>
          </>
        ) : '—'}
      </div>
    </div>
  )
}

/* ── Quick Action Card ── */
function QuickAction({ icon: Icon, title, desc, color, onClick, delay = 0 }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current,
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, delay, ease: 'power3.out' }
    )
  }, [])
  return (
    <div ref={ref} className={styles.quickCard} onClick={onClick}>
      <div className={styles.quickIconWrap} style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className={styles.quickTitle}>{title}</div>
      <div className={styles.quickDesc}>{desc}</div>
      <ChevronRight size={14} className={styles.quickArrow} />
    </div>
  )
}

/* ── Main Dashboard ── */
export default function DashboardPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)
  const { trades, loading: tradesLoading, loadTrades } = useTrades()
  const { indices, stocks, gainers, losers, loading, lastUpdated, error, refresh } = useMarketData()

  const [selectedSym, setSelectedSym] = useState('NIFTY 50')
  const headerRef = useRef(null)
  const portfolioRef = useRef(null)
  const stocksRef = useScrollReveal('[data-animate]')
  const chargesRef = useScrollReveal('[data-animate]')
  const ordersRef = useScrollReveal('[data-animate]')

  useEffect(() => { loadTrades() }, [])

  // Hero entrance animation
  useEffect(() => {
    if (!headerRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo('.dash-greeting', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 })
        .fromTo('.dash-sub', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, '-=.35')
        .fromTo('.dash-trade-btn', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4 }, '-=.3')
    }, headerRef)
    return () => ctx.revert()
  }, [])

  // Portfolio card entrance
  useEffect(() => {
    if (!portfolioRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.portfolio-stat',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: 'power2.out',
          scrollTrigger: { trigger: portfolioRef.current, start: 'top 90%', once: true } }
      )
    }, portfolioRef)
    return () => ctx.revert()
  }, [])

  const totalPnl = trades.reduce((a, t) => a + (t.pnl || 0), 0)
  const completedTrades = trades.filter((t) => t.status === 'COMPLETE').length
  const investedAmount = trades.reduce((a, t) => a + ((t.quantity || 0) * (t.price || 0)), 0)
  const currentValue = trades.reduce((a, t) => a + ((t.quantity || 0) * (t.executedPrice || t.price || 0)), 0)
  const availableBalance = 500000
  const totalPortfolioValue = availableBalance + currentValue
  const overallReturn = totalPortfolioValue - (availableBalance + investedAmount)
  const returnPercentage = investedAmount > 0 ? (overallReturn / investedAmount) * 100 : 0

  const nifty = indices['NIFTY 50']
  const bank = indices['NIFTY BANK']
  const vix = indices['INDIA VIX']

  const selQuote = indices[selectedSym] || stocks[selectedSym]
  const selUp = (selQuote?.changePct ?? 0) >= 0

  const QUICK_ACTIONS = [
    { icon: BarChart2, title: 'Markets', desc: 'Live NSE/BSE', color: '#2962ff', nav: '/dashboard/market' },
    { icon: Star, title: 'Screener', desc: '50+ filters', color: '#22c55e', nav: '/dashboard/screener' },
    { icon: Newspaper, title: 'News', desc: 'Live updates', color: '#f59e0b', nav: '/dashboard/news' },
    { icon: Globe, title: 'Gold', desc: '24K digital', color: '#eab308', nav: '/dashboard/digital-gold' },
    { icon: PieChart, title: 'Portfolio', desc: 'P&L & holdings', color: '#ec4899', nav: '/dashboard/portfolio' },
    { icon: Shield, title: 'Security', desc: '2FA & TOTP', color: '#ef4444', nav: '/dashboard/security' },
    { icon: Activity, title: 'Risk', desc: 'Kill switch', color: '#8b5cf6', nav: '/dashboard/settings' },
    { icon: Zap, title: 'Kill Switch', desc: 'Halt trading', color: '#ef4444', action: () => dispatch(setKillSwitchModal(true)) },
  ]

  return (
    <div className={styles.page}>

      {/* ── Ticker ── */}
      <TickerBar indices={indices} lastUpdated={lastUpdated} loading={loading} refresh={refresh} />

      {/* ── Header ── */}
      <div className={styles.header} ref={headerRef}>
        <div>
          <h1 className={`dash-greeting ${styles.title}`}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className={`dash-sub ${styles.sub}`}>
            {loading && !lastUpdated ? 'Connecting to NSE live data…'
              : error ? 'Live data unavailable — retrying…'
              : `Live NSE data · Updated ${fmtTime(lastUpdated)}`}
          </p>
        </div>
        <button className={`dash-trade-btn ${styles.tradeBtn}`} onClick={() => navigate('/dashboard/trade')}>
          <TrendingUp size={15} /> Place Order <ArrowRight size={14} />
        </button>
      </div>

      {/* ── Stats Cards with Sparklines ── */}
      <div className={styles.statsRow}>
        {[
          { label: 'NIFTY 50', data: nifty, icon: TrendingUp, color: '#2962ff', sym: 'NIFTY 50' },
          { label: 'BANK NIFTY', data: bank, icon: Activity, color: '#22c55e', sym: 'NIFTY BANK' },
          { label: 'INDIA VIX', data: vix, icon: Eye, color: '#8b5cf6', sym: 'INDIA VIX' },
          { label: 'SENSEX', data: indices['SENSEX'], icon: BarChart3, color: '#e87722', sym: 'SENSEX' },
        ].map((item, i) => (
          <IndexCard
            key={item.label}
            label={item.label}
            data={item.data}
            color={item.color}
            onClick={() => setSelectedSym(item.sym)}
            isSelected={selectedSym === item.sym}
            delay={i * 0.08}
          />
        ))}
      </div>

      {/* ── Portfolio Overview ── */}
      <div className={styles.portfolioCard} ref={portfolioRef}>
        <div className={styles.portfolioHeader}>
          <div className={styles.portfolioHeaderLeft}>
            <Wallet size={18} style={{ color: '#e87722' }} />
            <div>
              <h2 className={styles.portfolioTitle}>Portfolio Overview</h2>
              <p className={styles.portfolioSub}>Your investment performance at a glance</p>
            </div>
          </div>
          <button className={styles.viewAll} onClick={() => navigate('/dashboard/portfolio')}>
            View Portfolio <ArrowRight size={13} />
          </button>
        </div>
        <div className={styles.portfolioGrid}>
          {[
            { label: 'Total Value', value: `₹${fmt0(totalPortfolioValue)}`, accent: false, icon: Wallet },
            { label: 'Available', value: `₹${fmt0(availableBalance)}`, accent: false, icon: Landmark },
            { label: 'Invested', value: `₹${fmt0(investedAmount)}`, accent: false, icon: BarChart2 },
            { label: 'Current', value: `₹${fmt0(currentValue)}`, accent: false, icon: Activity },
            { label: 'Overall Return', value: `${overallReturn >= 0 ? '+' : ''}₹${fmt0(Math.abs(overallReturn))}`, accent: true, up: overallReturn >= 0, icon: overallReturn >= 0 ? TrendingUp : TrendingDown },
            { label: 'Return %', value: `${returnPercentage >= 0 ? '+' : ''}${returnPercentage.toFixed(2)}%`, accent: true, up: returnPercentage >= 0, icon: Target },
          ].map((item) => (
            <div key={item.label} className={`${styles.portfolioItem} portfolio-stat`}>
              <div className={styles.piHeader}>
                <item.icon size={13} style={{ color: item.accent ? (item.up ? '#22c55e' : '#ef4444') : '#9aa0a6' }} />
                <span className={styles.piLabel}>{item.label}</span>
              </div>
              <div className={`${styles.piValue} ${item.accent ? (item.up ? styles.piUp : styles.piDown) : ''}`}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Movers + Quote Detail ── */}
      <div className={styles.moversRow}>
        <div className={styles.moverCard} data-animate>
          <div className={styles.moverHead}>
            <TrendingUp size={14} style={{ color: '#22c55e' }} />
            <span>Top Gainers</span>
          </div>
          {gainers.length === 0
            ? <div className={styles.moverEmpty}>{loading ? 'Loading…' : 'No data'}</div>
            : gainers.slice(0, 5).map((g) => (
              <div key={g.symbol} className={styles.moverRow} onClick={() => setSelectedSym(g.symbol)}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <CompanyLogo symbol={g.symbol} name={SYMBOL_LABELS[g.symbol]||g.symbol} size={22} borderRadius={4} />
                  <span className={styles.moverSym}>{SYMBOL_LABELS[g.symbol] || g.symbol}</span>
                </div>
                <span className={styles.moverUp}>+{(g.changePct ?? 0).toFixed(2)}%</span>
              </div>
            ))
          }
        </div>
        <div className={styles.moverCard} data-animate>
          <div className={styles.moverHead}>
            <TrendingDown size={14} style={{ color: '#ef4444' }} />
            <span>Top Losers</span>
          </div>
          {losers.length === 0
            ? <div className={styles.moverEmpty}>{loading ? 'Loading…' : 'No data'}</div>
            : losers.slice(0, 5).map((l) => (
              <div key={l.symbol} className={styles.moverRow} onClick={() => setSelectedSym(l.symbol)}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <CompanyLogo symbol={l.symbol} name={SYMBOL_LABELS[l.symbol]||l.symbol} size={22} borderRadius={4} />
                  <span className={styles.moverSym}>{SYMBOL_LABELS[l.symbol] || l.symbol}</span>
                </div>
                <span className={styles.moverDown}>{(l.changePct ?? 0).toFixed(2)}%</span>
              </div>
            ))
          }
        </div>

        {/* TradingView Chart + Quote Detail */}
        <div className={styles.quoteDetail} data-animate>
          <div className={styles.qdHeader}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <CompanyLogo symbol={selectedSym} name={SYMBOL_LABELS[selectedSym]||selectedSym} size={32} borderRadius={8} />
              <div>
                <div className={styles.qdSym}>{SYMBOL_LABELS[selectedSym] || selectedSym}</div>
                {selQuote && (
                  <div className={`${styles.qdPrice} ${selUp ? styles.qdUp : styles.qdDown}`} style={{fontSize:16,marginBottom:0}}>
                    ₹{fmt2(selQuote.price)}
                    <span style={{fontSize:11}}>{selUp ? '▲' : '▼'} {Math.abs(selQuote.changePct ?? 0).toFixed(2)}%</span>
                  </div>
                )}
              </div>
            </div>
            <Target size={14} style={{ color: '#e87722' }} />
          </div>
          <TradingViewWidget
            symbol={`NSE:${selectedSym.replace(' ', '')}`}
            height={240}
            theme="light"
          />
          {selQuote && (
            <div className={styles.qdGrid} style={{padding: '12px 18px'}}>
              {[
                { label: 'Open', value: `₹${fmt2(selQuote.open)}` },
                { label: 'High', value: `₹${fmt2(selQuote.high)}`, color: '#22c55e' },
                { label: 'Low', value: `₹${fmt2(selQuote.low)}`, color: '#ef4444' },
                { label: 'Prev Close', value: `₹${fmt2(selQuote.prevClose)}` },
                ...(selQuote.volume ? [{ label: 'Volume', value: fmtVol(selQuote.volume) }] : []),
              ].map((item) => (
                <div key={item.label} className={styles.qdItem}>
                  <span>{item.label}</span>
                  <b style={{ color: item.color || 'inherit' }}>{item.value}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className={styles.quickRow}>
        {QUICK_ACTIONS.map((a, i) => (
          <QuickAction
            key={a.title}
            icon={a.icon}
            title={a.title}
            desc={a.desc}
            color={a.color}
            onClick={a.action || (() => navigate(a.nav))}
            delay={i * 0.05}
          />
        ))}
      </div>

      {/* ── Live Stocks Table ── */}
      <div className={styles.stocksCard} ref={stocksRef}>
        <div className={styles.stocksHeader} data-animate>
          <div>
            <h2 className={styles.stocksTitle}>Live Market Watch</h2>
            <p className={styles.stocksSub}>NSE India live prices · Refreshed every 6 seconds</p>
          </div>
          <div className={styles.stocksRight}>
            {loading && <RefreshCw size={14} className={styles.spinning} />}
            <span className={styles.watchUpdate}>{fmtTime(lastUpdated)}</span>
            <button className={styles.refreshBtn} onClick={refresh} disabled={loading}>
              <RefreshCw size={12} className={loading ? styles.spinning : ''} />
            </button>
          </div>
        </div>
        <div className={styles.stockTableHead}>
          <span>Symbol</span><span>LTP</span>
          <span>Change</span><span>O / H / L / Vol</span><span>Prev Close</span>
        </div>
        <div>
          {WATCHLIST.map((sym) => (
            <StockRow key={sym} sym={sym} quote={stocks[sym]}
              isSelected={selectedSym === sym} onSelect={setSelectedSym} />
          ))}
        </div>
      </div>

      {/* ── Charges ── */}
      <div className={styles.chargesCard} ref={chargesRef}>
        <div className={styles.chargesHeader} data-animate>
          <Flame size={20} style={{ color: '#e87722' }} />
          <div>
            <h2 className={styles.chargesTitle}>Transparent Pricing</h2>
            <p className={styles.chargesSub}>No hidden fees. Ever.</p>
          </div>
        </div>
        <div className={styles.chargesGrid}>
          {[
            { n: '₹0', title: 'Free Equity Delivery', desc: 'All equity delivery investments (NSE, BSE) are absolutely free.', highlight: false },
            { n: '₹20', title: 'Intraday & F&O', desc: 'Flat ₹20 or 0.03% (whichever is lower) per executed order.', highlight: true },
            { n: '₹0', title: 'Free Direct MF', desc: 'All direct mutual fund investments are absolutely free.', highlight: false },
          ].map((c) => (
            <div key={c.title} className={`${styles.chargeItem} ${c.highlight ? styles.chargeHighlight : ''}`} data-animate>
              <div className={styles.chargeNum}>{c.n}</div>
              <h3 className={styles.chargeLabel}>{c.title}</h3>
              <p className={styles.chargeDesc}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Orders ── */}
      <div className={styles.tradesCard} ref={ordersRef}>
        <div className={styles.tradesHeader} data-animate>
          <h2 className={styles.tradesTitle}>Recent Orders</h2>
          <button className={styles.viewAll} onClick={() => navigate('/dashboard/portfolio')}>
            View all <ArrowRight size={13} />
          </button>
        </div>
        {tradesLoading ? (
          <div className={styles.tradesLoading}>Loading…</div>
        ) : trades.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>◳</div>
            <div className={styles.emptyTitle}>No orders yet</div>
            <div className={styles.emptyDesc}>Place your first order to see it here.</div>
          </div>
        ) : (
          <div className={styles.tradesTable}>
            <div className={styles.tableHeader}>
              <span>Symbol</span><span>Type</span><span>Qty</span>
              <span>Price</span><span>Status</span><span>P&L</span>
            </div>
            {trades.slice(0, 8).map((t) => (
              <div key={t.id} className={styles.tableRow} data-animate>
                <div>
                  <div className={styles.symbol}>{t.symbol}</div>
                  <div className={styles.exchange}>{t.exchange} · {t.segment}</div>
                </div>
                <div>
                  <span className={t.side === 'BUY' ? styles.badgeSuccess : styles.badgeDanger}>{t.side}</span>
                </div>
                <div className={styles.qty}>{t.quantity}</div>
                <div className={styles.price}>₹{(t.executedPrice || t.price || 0).toLocaleString('en-IN')}</div>
                <div>
                  <span className={`${styles.badge} ${styles[`badge${t.status}`] || styles.badgeDefault}`}>{t.status}</span>
                </div>
                <div className={t.pnl >= 0 ? styles.pnlUp : styles.pnlDown}>
                  {t.pnl >= 0 ? '+' : ''}₹{(t.pnl || 0).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

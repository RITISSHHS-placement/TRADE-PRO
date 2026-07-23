/**
 * TradePro — World-class trading platform UI
 * Design: Linear × TradingView × Vercel × Stripe
 * Dark theme · Inter/JetBrains Mono · GSAP animations
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Provider, useSelector, useDispatch } from 'react-redux'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { store } from './store'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import {
  TrendingUp, TrendingDown, Search, Bell, LogOut, X, Eye, EyeOff,
  Lock, AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight,
  BarChart3, Wallet, Gauge, FileText, ShieldCheck, BookOpen,
  Activity, ClipboardList, Menu, ChevronRight, Zap, Star,
  RefreshCw, Settings, User, PieChart, Globe, IndianRupee,
} from 'lucide-react'
import { loginUser, logoutUser, registerUser } from './store/slices/authSlice'
import { useTrades, useMarketData } from './hooks'
import { SYMBOL_LABELS } from './services/marketData'

/* ── Page imports ── */
import LandingPage          from './pages/LandingPage'
import LoginPage            from './pages/LoginPage'
import RegisterPage         from './pages/RegisterPage'
import DashboardPage        from './pages/DashboardPage'
import TradePage            from './pages/TradePage'
import MarketPage           from './pages/MarketPage'
import MutualFundsPage      from './pages/MutualFundsPage'
import PortfolioPage        from './pages/PortfolioPage'
import SecurityPage         from './pages/SecurityPage'
import SettingsPage         from './pages/SettingsPage'
import PricingPage          from './pages/PricingPage'
import WatchlistPage        from './pages/WatchlistPage'
import NotFoundPage         from './pages/NotFoundPage'
import DashboardLayout      from './components/layout/DashboardLayout'
import ScreenerLandingPage  from './pages/ScreenerLandingPage'
import DigitalGoldPage      from './pages/DigitalGoldPage'

gsap.registerPlugin(ScrollTrigger)

/* ─────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────── */
const DS = {
  // Backgrounds
  bg:       '#09090b',
  bgSub:    '#0f0f12',
  bgCard:   '#111115',
  bgHover:  '#18181d',
  bgActive: '#1e1e26',
  // Borders
  border:   '#1f1f27',
  borderMd: '#2a2a36',
  borderLg: '#363643',
  // Text
  text:     '#f4f4f6',
  textSub:  '#8b8b9e',
  textMuted:'#52525f',
  // Brand
  accent:   '#6366f1',
  accentDim:'#312e81',
  accentGlow:'rgba(99,102,241,0.2)',
  // Bull/Bear
  bull:     '#22c55e',
  bullDim:  'rgba(34,197,94,0.12)',
  bullDark: '#16a34a',
  bear:     '#ef4444',
  bearDim:  'rgba(239,68,68,0.12)',
  bearDark: '#dc2626',
  // Amber
  amber:    '#f59e0b',
  amberDim: 'rgba(245,158,11,0.12)',
  // Misc
  white:    '#ffffff',
  overlay:  'rgba(9,9,11,0.85)',
}

/* Shared styles */
const S = {
  card: {
    background: DS.bgCard,
    border: `1px solid ${DS.border}`,
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    background: DS.bgSub,
    border: `1px solid ${DS.border}`,
    borderRadius: 8,
    color: DS.text,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .15s',
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '9px 18px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'all .15s',
    fontFamily: 'inherit',
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    color: DS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
    display: 'block',
    marginBottom: 6,
  },
}

/* ─────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────── */
const f2   = n => Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })
const f0   = n => Number(n||0).toLocaleString('en-IN', { maximumFractionDigits:0 })
const fR   = n => '₹' + f2(n)
const fR0  = n => '₹' + f0(n)
const fVol = n => !n ? '—' : n>=1e7 ? `${(n/1e7).toFixed(1)}Cr` : n>=1e5 ? `${(n/1e5).toFixed(1)}L` : f0(n)
const tNow = ts => ts ? new Date(ts).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' }) : '--'

/* Static data */
const ROLES = [
  { id:'CLIENT',     label:'Individual Investor', desc:'Stocks, MF & ETFs' },
  { id:'DEALER',     label:'Dealer / Broker',     desc:'Client order execution' },
  { id:'ANALYST',    label:'Research Analyst',    desc:'Publish reports' },
  { id:'COMPLIANCE', label:'Compliance Officer',  desc:'Regulatory filings' },
  { id:'ADMIN',      label:'Administrator',       desc:'Full platform access' },
]
const NAV = [
  { id:'markets',   icon:Globe,       label:'Markets' },
  { id:'screener',  icon:Search,      label:'Screener' },
  { id:'trade',     icon:Activity,    label:'Trade' },
  { id:'portfolio', icon:PieChart,    label:'Portfolio' },
  { id:'mf',        icon:IndianRupee, label:'Mutual Funds' },
  { id:'watchlist', icon:Star,        label:'Watchlist' },
  { id:'glossary',  icon:BookOpen,    label:'Glossary' },
]
const WATCH_SYMS = ['NIFTY 50','NIFTY BANK','INDIA VIX','RELIANCE','TCS','HDFCBANK','INFY','ITC','WIPRO','SBIN','BHARTIARTL','BAJFINANCE','ADANIENT','MARUTI','TATAMOTORS','AXISBANK','KOTAKBANK','LT','HINDUNILVR','NTPC']
const MF_CODES  = [118825, 120465, 119598, 120505, 118989, 120503, 120716, 125354, 120828, 120847, 100119]
const GLOSSARY  = [
  { term:'SEBI',   full:'Securities & Exchange Board of India',    def:"India's capital-market regulator. Equivalent to the US SEC." },
  { term:'NSE',    full:'National Stock Exchange of India',         def:"India's largest exchange by volume. Home of the NIFTY 50." },
  { term:'BSE',    full:'Bombay Stock Exchange',                    def:"Asia's oldest exchange (est. 1875). Home of the SENSEX." },
  { term:'DEMAT',  full:'Dematerialised Account',                  def:'Electronic account holding shares digitally. Mandatory since 1996.' },
  { term:'P&L',    full:'Profit & Loss',                           def:'Net financial result. Unrealised = open positions; Realised = closed.' },
  { term:'LTCG',   full:'Long-Term Capital Gains',                 def:'Equity gains held >12 months, taxed at 10% above ₹1L per year.' },
  { term:'STCG',   full:'Short-Term Capital Gains',                def:'Equity gains held ≤12 months, taxed at 15% under Sec 111A.' },
  { term:'MTM',    full:'Mark-to-Market',                          def:'Daily revaluation of open positions at current market prices.' },
  { term:'DP',     full:'Depository Participant',                  def:'Intermediary (bank/broker) providing DEMAT account services.' },
  { term:'CDSL',   full:'Central Depository Services Ltd.',        def:'BSE-promoted depository for electronic securities holding.' },
  { term:'NSDL',   full:'National Securities Depository Ltd.',     def:"India's first depository. Facilitates NSE/BSE settlement." },
  { term:'XIRR',   full:'Extended Internal Rate of Return',        def:'Annualised return for irregular cash flows (SIPs, redemptions).' },
  { term:'VIX',    full:'India Volatility Index',                  def:'NSE measure of near-term uncertainty from NIFTY option prices.' },
  { term:'STT',    full:'Securities Transaction Tax',              def:'Tax on equity: 0.1% delivery, 0.025% intraday sell side.' },
  { term:'GTT',    full:'Good Till Triggered',                     def:'Order that stays active until a specified price trigger is hit.' },
  { term:'F&O',    full:'Futures & Options',                       def:'Derivatives: Futures = obligation; Options = right (not obligation).' },
  { term:'SIP',    full:'Systematic Investment Plan',              def:'Fixed-amount MF investment at regular intervals. Rupee-cost averaging.' },
  { term:'NAV',    full:'Net Asset Value',                         def:'MF price = (assets − liabilities) ÷ units outstanding. Daily by AMC.' },
  { term:'T+1',    full:'Trade Plus One Settlement',               def:"India's standard since 2023. Trades settled by the next trading day." },
  { term:'AMFI',   full:'Association of Mutual Funds in India',    def:'Self-regulatory body. Publishes daily NAVs for all MF schemes.' },
]

/* ─────────────────────────────────────────────────────
   GSAP HOOKS
───────────────────────────────────────────────────── */
function useFadeUp(deps = []) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', clearProps: 'all' }
      )
    }, ref)
    return () => ctx.revert()
  }, deps)
  return ref
}

function useStagger(selector = '[data-s]', deps = []) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      const els = ref.current.querySelectorAll(selector)
      if (els.length) gsap.fromTo(els,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.06, clearProps: 'all' }
      )
    }, ref)
    return () => ctx.revert()
  }, deps)
  return ref
}

function usePriceFlash(value, up) {
  const ref  = useRef(null)
  const prev = useRef(value)
  useEffect(() => {
    if (!ref.current || value === prev.current) return
    prev.current = value
    gsap.timeline()
      .to(ref.current, { color: up ? DS.bull : DS.bear, scale: 1.06, duration: 0.18, ease: 'power2.out' })
      .to(ref.current, { color: DS.text, scale: 1, duration: 0.45, ease: 'power2.inOut' })
  }, [value])
  return ref
}

/* ─────────────────────────────────────────────────────
   ATOMS
───────────────────────────────────────────────────── */
function Pill({ children, color = DS.accent, bg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 100,
      background: bg || `${color}18`,
      border: `1px solid ${color}33`,
      fontSize: 11, fontWeight: 700, color, letterSpacing: '0.2px',
    }}>
      {children}
    </span>
  )
}

function LiveBadge({ value, changePct, mono = true }) {
  const up  = (changePct || 0) >= 0
  const ref = usePriceFlash(value, up)
  return (
    <span ref={ref} style={{
      fontFamily: mono ? "'JetBrains Mono',monospace" : 'inherit',
      fontSize: 13, fontWeight: 600, color: DS.text,
      fontVariantNumeric: 'tabular-nums',
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>
      {value > 0 ? f2(value) : '—'}
      {value > 0 && (
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: up ? DS.bull : DS.bear,
          display: 'inline-flex', alignItems: 'center', gap: 1,
        }}>
          {up ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}
          {Math.abs(changePct || 0).toFixed(2)}%
        </span>
      )}
    </span>
  )
}

function StatusBadge({ status }) {
  const map = {
    COMPLETE:  { bg: DS.bullDim,  color: DS.bull },
    PENDING:   { bg: DS.amberDim, color: DS.amber },
    CANCELLED: { bg: `${DS.textMuted}18`, color: DS.textMuted },
    REJECTED:  { bg: DS.bearDim,  color: DS.bear },
  }
  const s = map[status] || map.PENDING
  return <span style={{ ...s, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, display: 'inline-block' }}>{status}</span>
}

function Spinner({ size = 16 }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    gsap.to(ref.current, { rotation: 360, repeat: -1, duration: 0.8, ease: 'none' })
    return () => gsap.killTweensOf(ref.current)
  }, [])
  return (
    <span ref={ref} style={{ display: 'inline-flex', width: size, height: size, borderRadius: '50%', border: `2px solid ${DS.border}`, borderTopColor: DS.accent }}/>
  )
}

/* ─────────────────────────────────────────────────────
   TOP NAVIGATION
───────────────────────────────────────────────────── */
function TopNav({ auth, page, setPage, onLogout }) {
  const ref = useRef(null)
  const [mob, setMob] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current, { y: -56, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' })
  }, [])

  const linkStyle = (id) => ({
    ...S.btn,
    padding: '6px 12px',
    background: page === id ? DS.bgActive : 'transparent',
    color: page === id ? DS.text : DS.textSub,
    border: page === id ? `1px solid ${DS.borderMd}` : '1px solid transparent',
    fontSize: 13,
  })

  const visible = auth ? NAV : NAV.filter(n => ['markets','glossary'].includes(n.id))

  return (
    <header ref={ref} style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: `${DS.bg}e8`,
      backdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: `1px solid ${DS.border}`,
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Logo */}
        <button onClick={() => setPage(auth ? 'dashboard' : 'home')} style={{ display:'flex', alignItems:'center', gap:9, background:'none', border:'none', cursor:'pointer', marginRight:8, padding:0 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(135deg,${DS.accent},#8b5cf6)`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 20px ${DS.accentGlow}` }}>
            <TrendingUp size={15} color="#fff"/>
          </div>
          <span style={{ fontWeight:800, fontSize:15, color:DS.text, letterSpacing:'-0.4px' }}>TradePro</span>
        </button>

        {/* Divider */}
        <div style={{ width:1, height:18, background:DS.border, marginRight:4 }}/>

        {/* Nav links */}
        <nav style={{ display:'flex', alignItems:'center', gap:2, flex:1, overflow:'hidden' }}>
          {visible.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={linkStyle(n.id)}>
              <n.icon size={13}/>{n.label}
            </button>
          ))}
        </nav>

        {/* Right */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          {auth ? (
            <>
              <button style={{ ...S.btn, padding:'6px 10px', background:'transparent', color:DS.textSub, border:`1px solid ${DS.border}` }}>
                <Bell size={15}/>
              </button>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 12px 5px 6px', borderRadius:100, background:DS.bgCard, border:`1px solid ${DS.border}` }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:`linear-gradient(135deg,${DS.accent},#8b5cf6)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff' }}>
                  {(auth.name||'U').charAt(0)}
                </div>
                <span style={{ fontSize:12, fontWeight:600, color:DS.text }}>{auth.name}</span>
              </div>
              <button onClick={onLogout} style={{ ...S.btn, padding:'6px 10px', background:'transparent', color:DS.textSub, border:`1px solid ${DS.border}` }}>
                <LogOut size={14}/>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setPage('login')} style={{ ...S.btn, background:'transparent', color:DS.textSub, border:`1px solid ${DS.border}` }}>Sign In</button>
              <button onClick={() => setPage('register')} style={{ ...S.btn, background:DS.accent, color:'#fff', boxShadow:`0 0 20px ${DS.accentGlow}` }}>Get Started</button>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {mob && auth && (
        <div style={{ borderTop:`1px solid ${DS.border}`, padding:'8px 16px 10px', display:'flex', flexWrap:'wrap', gap:4 }}>
          {NAV.map(n => <button key={n.id} onClick={() => { setPage(n.id); setMob(false) }} style={linkStyle(n.id)}>{n.label}</button>)}
        </div>
      )}
    </header>
  )
}

/* ─────────────────────────────────────────────────────
   MARKET STRIP
───────────────────────────────────────────────────── */
function MarketStrip({ indices, setPage }) {
  const SYMS = ['NIFTY 50','NIFTY BANK','NIFTY NEXT 50','INDIA VIX','NIFTY IT','NIFTY PHARMA','NIFTY AUTO']
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      const chips = ref.current.querySelectorAll('[data-chip]')
      gsap.fromTo(chips, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' })
    }, ref)
    return () => ctx.revert()
  }, [Object.keys(indices).length > 3])

  return (
    <div ref={ref} style={{ background: DS.bgSub, borderBottom:`1px solid ${DS.border}`, overflowX:'auto', scrollbarWidth:'none' }}>
      <div style={{ maxWidth:1400, margin:'0 auto', padding:'0 20px', display:'flex', gap:2, height:40, alignItems:'center', minWidth:'max-content' }}>
        {SYMS.map(sym => {
          const q = indices[sym]
          const up = (q?.changePct||0) >= 0
          return (
            <button key={sym} data-chip onClick={() => setPage('markets')} style={{
              display:'flex', alignItems:'center', gap:8, padding:'5px 12px',
              borderRadius:6, background:'transparent', border:'1px solid transparent',
              cursor:'pointer', transition:'all .15s', whiteSpace:'nowrap',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = DS.bgCard; e.currentTarget.style.borderColor = DS.border }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}>
              <span style={{ fontSize:11, fontWeight:600, color:DS.textMuted }}>{SYMBOL_LABELS[sym]||sym}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:DS.text, fontVariantNumeric:'tabular-nums' }}>{q?f2(q.price):'—'}</span>
              {q && <span style={{ fontSize:10, fontWeight:700, color:up?DS.bull:DS.bear, display:'flex', alignItems:'center', gap:1 }}>
                {up?<ArrowUpRight size={10}/>:<ArrowDownRight size={10}/>}{Math.abs(q.changePct||0).toFixed(2)}%
              </span>}
            </button>
          )
        })}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5, padding:'0 8px' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:DS.bull, display:'inline-block', animation:'pulse 2s infinite' }}/>
          <span style={{ fontSize:10, fontWeight:600, color:DS.textMuted }}>LIVE</span>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   TICKER TAPE
───────────────────────────────────────────────────── */
function TickerTape({ gainers, losers }) {
  const items = [...gainers.slice(0,8), ...losers.slice(0,8)]
  if (!items.length) return null
  const all = [...items, ...items]
  return (
    <div style={{ background: DS.bg, borderTop:`1px solid ${DS.border}`, overflow:'hidden', padding:'5px 0' }}>
      <div style={{ display:'flex', whiteSpace:'nowrap', animation:'marquee 50s linear infinite' }}>
        {all.concat(all).map((it, i) => {
          const up = (it.changePct||0) >= 0
          return (
            <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'0 16px', borderRight:`1px solid ${DS.border}`, fontSize:11, flexShrink:0 }}>
              <span style={{ fontWeight:700, color:DS.textSub }}>{SYMBOL_LABELS[it.symbol]||it.symbol}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", color:DS.text, fontVariantNumeric:'tabular-nums' }}>{it.price>0?f2(it.price):'—'}</span>
              {it.price>0 && <span style={{ fontWeight:700, color:up?DS.bull:DS.bear }}>{up?'▲':'▼'}{Math.abs(it.changePct||0).toFixed(2)}%</span>}
            </span>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   HOME PAGE
───────────────────────────────────────────────────── */
function Home({ setPage, indices }) {
  const heroRef  = useRef(null)
  const statsRef = useRef(null)
  const cardsRef = useStagger('[data-s]')

  useEffect(() => {
    if (!heroRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo('.hp-tag', { opacity:0, y:10 }, { opacity:1, y:0, duration:.45 })
        .fromTo('.hp-h1',  { opacity:0, y:28 }, { opacity:1, y:0, duration:.6 }, '-=.25')
        .fromTo('.hp-sub', { opacity:0, y:18 }, { opacity:1, y:0, duration:.5 }, '-=.35')
        .fromTo('.hp-btns',{ opacity:0, y:12 }, { opacity:1, y:0, duration:.4 }, '-=.3')
        .fromTo('.hp-img', { opacity:0, scale:.9, x:30 }, { opacity:1, scale:1, x:0, duration:.75, ease:'power2.out' }, '-=.6')
    }, heroRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!statsRef.current) return
    const ctx = gsap.context(() => {
      const els = statsRef.current.querySelectorAll('[data-s]')
      gsap.fromTo(els, { opacity:0, y:12 }, { opacity:1, y:0, duration:.4, stagger:.05, ease:'power2.out', scrollTrigger:{ trigger:statsRef.current, start:'top 90%', once:true } })
    }, statsRef)
    return () => ctx.revert()
  }, [])

  const nifty = indices['NIFTY 50']
  const bank  = indices['NIFTY BANK']
  const vix   = indices['INDIA VIX']

  return (
    <div style={{ background:DS.bg, minHeight:'100vh' }}>
      {/* Hero */}
      <section ref={heroRef} style={{ maxWidth:1200, margin:'0 auto', padding:'72px 24px 56px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
        <div>
          <div className="hp-tag" style={{ opacity:0, display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:100, background:DS.accentDim, border:`1px solid ${DS.accent}40`, marginBottom:24 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:DS.bull, display:'inline-block', animation:'pulse 2s infinite' }}/>
            <span style={{ fontSize:12, fontWeight:700, color:DS.accent }}>NSE & BSE · Live Data</span>
          </div>
          <h1 className="hp-h1" style={{ opacity:0, fontSize:'clamp(36px,5vw,60px)', fontWeight:900, color:DS.text, lineHeight:1.08, letterSpacing:'-1.5px', marginBottom:20 }}>
            The professional<br/><span style={{ color:DS.accent }}>trading platform</span><br/>for India.
          </h1>
          <p className="hp-sub" style={{ opacity:0, fontSize:17, color:DS.textSub, lineHeight:1.75, marginBottom:32, maxWidth:460 }}>
            Real-time NSE/BSE data, institutional-grade order execution, portfolio analytics, and mutual funds — all in one place.
          </p>
          <div className="hp-btns" style={{ opacity:0, display:'flex', gap:12, flexWrap:'wrap', marginBottom:48 }}>
            <button onClick={() => setPage('register')} style={{ ...S.btn, background:DS.accent, color:'#fff', padding:'11px 24px', fontSize:14, boxShadow:`0 0 30px ${DS.accentGlow}` }}
              onMouseEnter={e => gsap.to(e.currentTarget, { scale:1.03, duration:.15 })}
              onMouseLeave={e => gsap.to(e.currentTarget, { scale:1, duration:.15 })}>
              Start for free <ChevronRight size={15}/>
            </button>
            <button onClick={() => setPage('markets')} style={{ ...S.btn, background:'transparent', color:DS.text, padding:'11px 24px', fontSize:14, border:`1px solid ${DS.borderMd}` }}>
              Explore Markets
            </button>
          </div>
          {/* Live index chips */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[[nifty,'NIFTY 50'],[bank,'BANK NIFTY'],[vix,'INDIA VIX']].map(([q,l]) => (
              <div key={l} style={{ padding:'8px 14px', borderRadius:8, background:DS.bgCard, border:`1px solid ${DS.border}`, display:'flex', gap:10, alignItems:'center' }}>
                <span style={{ fontSize:11, fontWeight:600, color:DS.textMuted }}>{l}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:DS.text }}>{q?f2(q.price):'—'}</span>
                {q && <span style={{ fontSize:11, fontWeight:700, color:(q.changePct||0)>=0?DS.bull:DS.bear }}>{(q.changePct||0)>=0?'▲':'▼'}{Math.abs(q.changePct||0).toFixed(2)}%</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual */}
        <div className="hp-img" style={{ opacity:0, position:'relative' }}>
          <div style={{ position:'absolute', inset:'-20px', background:`radial-gradient(circle at 50% 50%, ${DS.accentGlow}, transparent 70%)`, borderRadius:24, pointerEvents:'none' }}/>
          <div style={{ borderRadius:20, overflow:'hidden', border:`1px solid ${DS.borderMd}`, boxShadow:`0 24px 60px rgba(0,0,0,.5), 0 0 0 1px ${DS.border}` }}>
            <img src="/bull-bear.webp" alt="Bull vs Bear" style={{ width:'100%', display:'block', filter:'brightness(0.92) contrast(1.05)' }}/>
          </div>
          {/* Floating cards */}
          <div style={{ position:'absolute', bottom:24, left:-20, background:DS.bgCard, border:`1px solid ${DS.borderMd}`, borderRadius:10, padding:'10px 14px', boxShadow:'0 8px 24px rgba(0,0,0,.4)' }}>
            <div style={{ fontSize:10, color:DS.textMuted, marginBottom:3 }}>PORTFOLIO P&L</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:800, color:DS.bull }}>+₹2,34,800</div>
          </div>
          <div style={{ position:'absolute', top:24, right:-16, background:DS.bgCard, border:`1px solid ${DS.borderMd}`, borderRadius:10, padding:'10px 14px', boxShadow:'0 8px 24px rgba(0,0,0,.4)' }}>
            <div style={{ fontSize:10, color:DS.textMuted, marginBottom:3 }}>ORDER EXECUTED</div>
            <div style={{ fontSize:12, fontWeight:700, color:DS.text, display:'flex', alignItems:'center', gap:5 }}><CheckCircle2 size={13} color={DS.bull}/> 100 RELIANCE @ ₹2,612</div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div ref={statsRef} style={{ background:DS.bgCard, borderTop:`1px solid ${DS.border}`, borderBottom:`1px solid ${DS.border}` }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
          {[['₹2,840 Cr+','Daily Volume'],['4.1L+','Active Clients'],['₹0','Equity Delivery'],['50+','Indices Tracked']].map(([v,l],i) => (
            <div key={l} data-s style={{ padding:'20px', borderRight:i<3?`1px solid ${DS.border}`:'none', textAlign:'center' }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:22, fontWeight:900, color:DS.accent }}>{v}</div>
              <div style={{ fontSize:12, color:DS.textMuted, marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <section style={{ maxWidth:1200, margin:'0 auto', padding:'64px 24px' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <h2 style={{ fontSize:36, fontWeight:900, color:DS.text, letterSpacing:'-1px', marginBottom:12 }}>Everything in one terminal</h2>
          <p style={{ fontSize:16, color:DS.textSub }}>Built for traders who demand precision.</p>
        </div>
        <div ref={cardsRef} style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12 }}>
          {[
            { icon:BarChart3, grad:['#6366f1','#8b5cf6'], title:'Markets',      desc:'Live NSE/BSE indices, sector heatmap, top movers.', page:'markets' },
            { icon:Search,    grad:['#22c55e','#16a34a'], title:'Screener',     desc:'Filter 4,000+ stocks with 50+ fundamental filters.', page:'screener' },
            { icon:Activity,  grad:['#f59e0b','#d97706'], title:'Trade',        desc:'Market, limit, SL, bracket & GTT orders.', page:'trade' },
            { icon:PieChart,  grad:['#ec4899','#db2777'], title:'Portfolio',    desc:'Real P&L, XIRR and complete order history.', page:'portfolio' },
            { icon:IndianRupee, grad:['#06b6d4','#0891b2'], title:'Mutual Funds',desc:'₹0 commission, direct plans, 16k+ schemes.', page:'mf' },
            { icon:BookOpen,  grad:['#8b5cf6','#7c3aed'], title:'Glossary',     desc:'SEBI, LTCG, VIX — 20 essential terms.', page:'glossary' },
          ].map(f => (
            <div key={f.title} data-s onClick={() => setPage(f.page)} style={{ ...S.card, padding:24, cursor:'pointer', transition:'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = DS.borderMd; gsap.to(e.currentTarget, { y:-4, duration:.2 }) }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border;   gsap.to(e.currentTarget, { y:0,  duration:.2 }) }}>
              <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,${f.grad[0]},${f.grad[1]})`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, boxShadow:`0 4px 14px ${f.grad[0]}40` }}>
                <f.icon size={19} color="#fff"/>
              </div>
              <h3 style={{ fontSize:14, fontWeight:700, color:DS.text, marginBottom:6 }}>{f.title}</h3>
              <p style={{ fontSize:12, color:DS.textSub, lineHeight:1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   PRIVATE ROUTE GUARD
───────────────────────────────────────────────────── */
function PrivateRoute({ children }) {
  const token = useSelector((s) => s.auth.token)
  return token ? children : <Navigate to="/login" replace />
}

/* ─────────────────────────────────────────────────────
   APP SHELL — wires Redux + Routing
───────────────────────────────────────────────────── */
function AppShell() {
  const { indices } = useMarketData()

  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/"         element={<LandingPage indices={indices} />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── Protected: dashboard shell with sidebar ── */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index                element={<DashboardPage />} />
        <Route path="trade"         element={<TradePage />} />
        <Route path="market"        element={<MarketPage />} />
        <Route path="screener"      element={<MarketPage defaultTab="screener" />} />
        <Route path="news"          element={<MarketPage defaultTab="news" />} />
        <Route path="us-stocks"     element={<MarketPage defaultTab="us" />} />
        <Route path="gold"          element={<MarketPage defaultTab="gold" />} />
        <Route path="mf"            element={<MutualFundsPage />} />
        <Route path="portfolio"     element={<PortfolioPage />} />
        <Route path="security"      element={<SecurityPage />} />
        <Route path="settings"      element={<SettingsPage />} />
        <Route path="pricing"       element={<PricingPage />} />
        <Route path="watchlist"        element={<WatchlistPage />} />
        <Route path="screener-landing" element={<ScreenerLandingPage />} />
        <Route path="digital-gold"     element={<DigitalGoldPage />} />
      </Route>

      {/* ── Fallback ── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

/* ─────────────────────────────────────────────────────
   ROOT EXPORT — Provider wraps everything
───────────────────────────────────────────────────── */
export default function App() {
  return (
    <Provider store={store}>
      <AppShell />
    </Provider>
  )
}

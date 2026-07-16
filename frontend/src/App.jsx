/**
 * TradePro — Tickertape-style UI with GSAP premium animations
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Provider, useSelector, useDispatch } from 'react-redux'
import { store } from './store'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import {
  TrendingUp, TrendingDown, Search, Bell, ChevronRight,
  Eye, EyeOff, Lock, AlertTriangle, CheckCircle2, LogOut,
  X, ArrowUpRight, ArrowDownRight, BarChart3, Wallet,
  Gauge, FileText, ShieldCheck, BookOpen, Activity,
  ClipboardList, Users, Menu, Zap, Star,
} from 'lucide-react'
import { loginUser, logoutUser, registerUser } from './store/slices/authSlice'
import { useTrades, useMarketData } from './hooks'
import { useFadeUp, useStagger, useScrollReveal, useCardHover, usePriceFlash } from './hooks/useGSAP'
import { SYMBOL_LABELS } from './services/marketData'
import './assets/styles/global.css'

gsap.registerPlugin(ScrollTrigger)

/* ── Design tokens (Tickertape palette) ── */
const T = {
  green: '#00B386', greenBg: '#E6F9F4', greenDark: '#007A5E',
  red: '#E84040',   redBg: '#FEF0F0',   redDark: '#B52B2B',
  amber: '#F5A623', amberBg: '#FEF7E6',
  navy: '#0B1437',  navyMid: '#1E2D5A', navyLight: '#2D3F8E',
  blue: '#3B5BDB',  blueBg: '#EEF3FF',
  gray50: '#F8F9FB', gray100: '#F1F3F6', gray200: '#E4E7EC',
  gray400: '#9AA3B2', gray600: '#5A6478', gray800: '#1E2636',
  white: '#FFFFFF',
}

/* ── Helpers ── */
const f2  = n => Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })
const f0  = n => Number(n||0).toLocaleString('en-IN', { maximumFractionDigits:0 })
const fR  = n => '₹' + f2(n)
const fR0 = n => '₹' + f0(n)
const fVol= n => !n ? '—' : n >= 1e7 ? `${(n/1e7).toFixed(1)}Cr` : n >= 1e5 ? `${(n/1e5).toFixed(1)}L` : f0(n)
const tNow= ts => ts ? new Date(ts).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' }) : '--'

/* ── Static data ── */
const ROLES = [
  { id:'CLIENT',     label:'Individual Investor', desc:'Stocks, MF & ETFs' },
  { id:'DEALER',     label:'Dealer / Broker',     desc:'Client execution' },
  { id:'ANALYST',    label:'Research Analyst',    desc:'Publish reports' },
  { id:'COMPLIANCE', label:'Compliance Officer',  desc:'Regulatory filings' },
  { id:'ADMIN',      label:'Administrator',       desc:'Full access' },
]
const NAV_LINKS = [
  { id:'markets',   label:'Markets' },
  { id:'screener',  label:'Screener' },
  { id:'trade',     label:'Trade' },
  { id:'portfolio', label:'Portfolio' },
  { id:'mf',        label:'Mutual Funds' },
  { id:'watchlist', label:'Watchlist' },
  { id:'glossary',  label:'Glossary' },
]
const GLOSSARY = [
  { term:'SEBI',  full:'Securities & Exchange Board of India', def:"India's primary capital-market regulator, equivalent to the US SEC." },
  { term:'NSE',   full:'National Stock Exchange of India',     def:"India's largest exchange by volume. Home of the NIFTY 50 index." },
  { term:'BSE',   full:'Bombay Stock Exchange',                def:"Asia's oldest exchange (est. 1875). Home of the SENSEX." },
  { term:'DEMAT', full:'Dematerialised Account',               def:'Electronic account holding shares digitally. Mandatory since 1996.' },
  { term:'P&L',   full:'Profit & Loss',                        def:'Net result of trading. Unrealised = open; Realised = closed.' },
  { term:'LTCG',  full:'Long-Term Capital Gains',              def:'Equity held >12 months taxed at 10% above ₹1 lakh per year.' },
  { term:'STCG',  full:'Short-Term Capital Gains',             def:'Equity held ≤12 months taxed at 15% under Sec 111A.' },
  { term:'MTM',   full:'Mark-to-Market',                       def:'Daily revaluation of positions at current market prices.' },
  { term:'DP',    full:'Depository Participant',               def:'Intermediary (bank/broker) providing DEMAT services.' },
  { term:'CDSL',  full:'Central Depository Services Ltd.',     def:'BSE-promoted depository for electronic securities holding.' },
  { term:'NSDL',  full:'National Securities Depository Ltd.',  def:"India's first depository. Facilitates NSE/BSE settlement." },
  { term:'XIRR',  full:'Extended Internal Rate of Return',     def:'Annualised return for irregular cash flows like SIPs.' },
  { term:'VIX',   full:'India Volatility Index',               def:'NSE measure of near-term market uncertainty from NIFTY options.' },
  { term:'STT',   full:'Securities Transaction Tax',           def:'Tax: 0.1% delivery, 0.025% intraday sell side.' },
  { term:'GTT',   full:'Good Till Triggered',                  def:'Order stays active until a specific price trigger is hit.' },
  { term:'F&O',   full:'Futures & Options',                    def:'Derivatives: Futures = obligation; Options = right (not obligation).' },
  { term:'SIP',   full:'Systematic Investment Plan',           def:'Fixed-amount MF investment at regular intervals. Rupee-cost averaging.' },
  { term:'NAV',   full:'Net Asset Value',                      def:'MF price = (assets − liabilities) ÷ units. Published daily by AMCs.' },
  { term:'T+1',   full:'Trade Plus One Settlement',            def:"India's settlement standard since 2023. Settled by next trading day." },
  { term:'AMFI',  full:'Assoc. of Mutual Funds in India',      def:'Self-regulatory body for MFs. Publishes daily NAVs.' },
]
const MF_CODES = [118825, 120465, 119598, 120505, 118989, 120503, 120716, 125354, 120828, 120847, 100119]
const WATCH_SYMS = ['NIFTY 50','NIFTY BANK','INDIA VIX','RELIANCE','TCS','HDFCBANK','INFY','ITC','WIPRO','SBIN','BHARTIARTL','BAJFINANCE','ADANIENT','MARUTI','TATAMOTORS']

/* ════════════════════════════════════════
   ANIMATED PRIMITIVES
════════════════════════════════════════ */

/** Animated price display — flashes green/red on change */
function LivePrice({ value, changePct, size = 13 }) {
  const ref = usePriceFlash(value, changePct >= 0)
  const up  = changePct >= 0
  return (
    <span ref={ref} style={{ fontFamily:'monospace', fontSize:size, fontWeight:700,
      color:T.gray800, display:'inline-flex', alignItems:'center', gap:3,
      fontVariantNumeric:'tabular-nums', transition:'color .3s' }}>
      {value > 0 ? f2(value) : '—'}
      {value > 0 && (
        <span style={{ fontSize:size-2, color:up ? T.green : T.red, display:'inline-flex', alignItems:'center' }}>
          {up ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
          {Math.abs(changePct||0).toFixed(2)}%
        </span>
      )}
    </span>
  )
}

/** Badge pill for up/down % */
function ChangeBadge({ changePct, showArrow = true }) {
  const up = (changePct||0) >= 0
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:2, padding:'2px 8px',
      borderRadius:12, fontSize:11, fontWeight:700, fontVariantNumeric:'tabular-nums',
      background:up ? T.greenBg : T.redBg, color:up ? T.greenDark : T.redDark }}>
      {showArrow && (up ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>)}
      {up ? '+' : ''}{(changePct||0).toFixed(2)}%
    </span>
  )
}

/** Animated stat card */
function StatCard({ label, value, changePct, icon: Icon, accent = 'blue' }) {
  const ref  = useCardHover()
  const accMap = {
    green: { bg: T.greenBg, color: T.green },
    red:   { bg: T.redBg,   color: T.red },
    blue:  { bg: T.blueBg,  color: T.blue },
    amber: { bg: T.amberBg, color: T.amber },
  }
  const acc = accMap[accent] || accMap.blue
  return (
    <div data-stagger ref={ref} style={{
      background: T.white, border:`1px solid ${T.gray200}`, borderRadius:12,
      padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontSize:11, fontWeight:600, color:T.gray400, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</span>
        {Icon && <div style={{ width:30, height:30, borderRadius:8, background:acc.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={14} color={acc.color}/>
        </div>}
      </div>
      <div style={{ fontSize:22, fontWeight:800, color:T.gray800, fontFamily:'monospace', fontVariantNumeric:'tabular-nums' }}>{value}</div>
      {changePct !== undefined && <ChangeBadge changePct={changePct}/>}
    </div>
  )
}

/** Section wrapper with scroll reveal */
function Section({ children, style = {} }) {
  const ref = useScrollReveal()
  return <div ref={ref} style={{ opacity:0, ...style }}>{children}</div>
}

/* ════════════════════════════════════════
   MARKET CHIP
════════════════════════════════════════ */
function IndexChip({ sym, indices, onClick }) {
  const q   = indices[sym]
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const enter = () => gsap.to(el, { scale:1.03, y:-1, duration:.18, ease:'power2.out' })
    const leave = () => gsap.to(el, { scale:1,    y:0,  duration:.18, ease:'power2.out' })
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    return () => { el.removeEventListener('mouseenter', enter); el.removeEventListener('mouseleave', leave) }
  }, [])
  return (
    <button ref={ref} onClick={onClick} style={{
      display:'inline-flex', alignItems:'center', gap:7, padding:'5px 12px',
      borderRadius:20, background:T.white, border:`1px solid ${T.gray200}`,
      cursor: onClick ? 'pointer' : 'default', whiteSpace:'nowrap',
      boxShadow:'0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <span style={{ fontSize:11, fontWeight:600, color:T.gray600 }}>{SYMBOL_LABELS[sym]||sym}</span>
      <LivePrice value={q?.price||0} changePct={q?.changePct||0} size={12}/>
    </button>
  )
}

/* ════════════════════════════════════════
   TOP NAV
════════════════════════════════════════ */
function TopNav({ auth, page, setPage, onLogout }) {
  const navRef = useRef(null)
  const [mob, setMob] = useState(false)

  // Animate nav on mount
  useEffect(() => {
    if (!navRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(navRef.current, { y:-60, opacity:0 }, { y:0, opacity:1, duration:.5, ease:'power3.out' })
    }, navRef)
    return () => ctx.revert()
  }, [])

  return (
    <header ref={navRef} style={{
      background:T.navy, position:'sticky', top:0, zIndex:50,
      boxShadow:'0 1px 0 rgba(255,255,255,0.06)',
    }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 20px',
        display:'flex', alignItems:'center', gap:6, height:54 }}>
        {/* Logo */}
        <button onClick={() => setPage(auth ? 'dashboard' : 'home')}
          style={{ display:'flex', alignItems:'center', gap:8, marginRight:12, background:'none', border:'none', cursor:'pointer' }}>
          <div style={{ width:30, height:30, borderRadius:9,
            background:`linear-gradient(135deg,${T.green},${T.blue})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:`0 2px 10px rgba(0,179,134,0.35)` }}>
            <TrendingUp size={15} color="#fff"/>
          </div>
          <span style={{ fontWeight:800, fontSize:16, color:'#fff', letterSpacing:'-0.5px' }}>TradePro</span>
        </button>

        {/* Links */}
        <nav style={{ display:'flex', alignItems:'center', gap:1, flex:1, overflow:'hidden' }}>
          {NAV_LINKS.filter(n => auth || ['markets','glossary'].includes(n.id)).map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              padding:'6px 11px', borderRadius:6, fontSize:13, fontWeight:500, border:'none', cursor:'pointer',
              color: page===n.id ? '#fff' : 'rgba(255,255,255,0.58)',
              background: page===n.id ? 'rgba(255,255,255,0.12)' : 'transparent',
              transition:'all .15s', whiteSpace:'nowrap',
            }}>
              {n.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          {auth ? (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:7, padding:'4px 10px 4px 4px',
                borderRadius:20, background:'rgba(255,255,255,0.08)' }}>
                <div style={{ width:26, height:26, borderRadius:'50%',
                  background:`linear-gradient(135deg,${T.green},${T.blue})`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, fontWeight:800, color:'#fff' }}>
                  {(auth.name||'U').charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize:12, fontWeight:600, color:'#fff' }}>{auth.name}</span>
              </div>
              <button onClick={onLogout} style={{ padding:'6px 8px', borderRadius:6,
                color:'rgba(255,255,255,0.5)', background:'none', border:'none', cursor:'pointer' }}>
                <LogOut size={15}/>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setPage('login')} style={{ padding:'7px 14px', borderRadius:6,
                fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.75)', background:'none', border:'none', cursor:'pointer' }}>
                Sign In
              </button>
              <button onClick={() => setPage('register')} style={{ padding:'7px 16px', borderRadius:7,
                fontSize:13, fontWeight:700, color:'#fff', background:T.green, border:'none', cursor:'pointer',
                boxShadow:`0 2px 10px rgba(0,179,134,0.3)` }}>
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

/* ════════════════════════════════════════
   MARKET STRIP
════════════════════════════════════════ */
function MarketStrip({ indices, setPage }) {
  const ref  = useRef(null)
  const SYMS = ['NIFTY 50','NIFTY BANK','NIFTY NEXT 50','INDIA VIX','NIFTY IT','NIFTY PHARMA','NIFTY AUTO']
  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      const chips = ref.current.querySelectorAll('button')
      gsap.fromTo(chips, { opacity:0, x:-10 }, { opacity:1, x:0, duration:.4, stagger:.04, ease:'power2.out' })
    }, ref)
    return () => ctx.revert()
  }, [Object.keys(indices).length > 0])
  return (
    <div ref={ref} style={{ background:T.white, borderBottom:`1px solid ${T.gray200}`,
      overflowX:'auto', scrollbarWidth:'none' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'7px 20px',
        display:'flex', gap:6, minWidth:'max-content', alignItems:'center' }}>
        {SYMS.map(sym => <IndexChip key={sym} sym={sym} indices={indices} onClick={() => setPage('markets')}/>)}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   TICKER TAPE
════════════════════════════════════════ */
function TickerTape({ gainers, losers }) {
  const items = [...gainers, ...losers, ...gainers, ...losers]
  if (!items.length) return null
  return (
    <div style={{ background:T.gray50, borderTop:`1px solid ${T.gray200}`, overflow:'hidden', padding:'5px 0' }}>
      <div style={{ display:'flex', whiteSpace:'nowrap', animation:'marquee 48s linear infinite' }}>
        {items.concat(items).map((it, i) => {
          const up = (it.changePct||0) >= 0
          return (
            <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:5,
              padding:'0 14px', borderRight:`1px solid ${T.gray200}`, fontSize:11, flexShrink:0 }}>
              <span style={{ fontWeight:700, color:T.gray800, fontFamily:'monospace' }}>
                {SYMBOL_LABELS[it.symbol]||it.symbol}
              </span>
              <span style={{ color:T.gray600, fontFamily:'monospace' }}>{it.price>0?f2(it.price):'—'}</span>
              {it.price > 0 && <span style={{ color:up?T.green:T.red, fontWeight:700 }}>{up?'▲':'▼'}{Math.abs(it.changePct||0).toFixed(2)}%</span>}
            </span>
          )
        })}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   HOME — animated hero
════════════════════════════════════════ */
function Home({ setPage, indices }) {
  const heroRef  = useRef(null)
  const statsRef = useStagger('[data-stagger]')
  const featRef  = useStagger('[data-stagger]')

  useEffect(() => {
    if (!heroRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()
      tl.fromTo('.hero-badge',  { opacity:0, y:12 }, { opacity:1, y:0, duration:.5, ease:'power3.out' })
        .fromTo('.hero-h1',    { opacity:0, y:24 }, { opacity:1, y:0, duration:.65, ease:'power3.out' }, '-=.25')
        .fromTo('.hero-sub',   { opacity:0, y:16 }, { opacity:1, y:0, duration:.5,  ease:'power2.out' }, '-=.35')
        .fromTo('.hero-btns',  { opacity:0, y:12 }, { opacity:1, y:0, duration:.45, ease:'power2.out' }, '-=.3')
        .fromTo('.hero-chips', { opacity:0 },        { opacity:1, duration:.4, stagger:.06 },             '-=.2')
        .fromTo('.hero-img',   { opacity:0, scale:.94, x:20 }, { opacity:1, scale:1, x:0, duration:.75, ease:'power3.out' }, '-=.6')
    }, heroRef)
    return () => ctx.revert()
  }, [])

  const nifty = indices['NIFTY 50']
  const bank  = indices['NIFTY BANK']
  const vix   = indices['INDIA VIX']

  const s = (n, up) => ({ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px',
    borderRadius:20, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)' })

  return (
    <div style={{ background:T.white }}>
      {/* ── Hero ── */}
      <section ref={heroRef} style={{ background:`linear-gradient(140deg,${T.navy} 0%,#1a2a5e 55%,#0d1f4a 100%)`, padding:'64px 20px 52px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:`radial-gradient(circle at 18% 45%, rgba(0,179,134,.18) 0%,transparent 48%), radial-gradient(circle at 82% 28%, rgba(59,91,219,.16) 0%,transparent 48%)`, pointerEvents:'none' }}/>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:52, alignItems:'center', position:'relative' }}>
          <div>
            <div className="hero-badge" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 14px', borderRadius:20, background:'rgba(0,179,134,.14)', border:'1px solid rgba(0,179,134,.3)', marginBottom:20 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:T.green, display:'inline-block', animation:'pulseDot 1.5s infinite' }}/>
              <span style={{ fontSize:12, color:T.green, fontWeight:600 }}>NSE &amp; BSE · Live Data</span>
            </div>
            <h1 className="hero-h1" style={{ fontSize:'clamp(32px,4.5vw,52px)', fontWeight:900, color:'#fff', lineHeight:1.08, letterSpacing:'-1px', marginBottom:16 }}>
              India's smartest<br/><span style={{ color:T.green }}>market intelligence</span><br/>platform
            </h1>
            <p className="hero-sub" style={{ fontSize:16, color:'rgba(255,255,255,.62)', lineHeight:1.75, marginBottom:30, maxWidth:460 }}>
              Real-time NSE/BSE data, screener, portfolio tracker, mutual funds — everything a serious investor needs.
            </p>
            <div className="hero-btns" style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:40 }}>
              <button onClick={() => setPage('register')} style={{ padding:'12px 28px', borderRadius:9, background:T.green, color:'#fff', fontWeight:700, fontSize:15, border:'none', cursor:'pointer', boxShadow:`0 4px 18px rgba(0,179,134,.38)`, transition:'transform .18s,box-shadow .18s' }}
                onMouseEnter={e => gsap.to(e.currentTarget, { scale:1.04, duration:.18 })}
                onMouseLeave={e => gsap.to(e.currentTarget, { scale:1, duration:.18 })}>
                Start free →
              </button>
              <button onClick={() => setPage('markets')} style={{ padding:'12px 28px', borderRadius:9, background:'rgba(255,255,255,.09)', color:'#fff', fontWeight:600, fontSize:15, border:'1px solid rgba(255,255,255,.2)', cursor:'pointer' }}>
                Explore Markets
              </button>
            </div>
            {/* Live chips */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {[['NIFTY 50',nifty],['BANK NIFTY',bank],['INDIA VIX',vix]].map(([l,d]) => (
                <div key={l} className="hero-chips" style={s(d?.changePct||0, (d?.changePct||0)>=0)}>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,.55)', fontWeight:600 }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:800, color:'#fff', fontFamily:'monospace' }}>{d?f2(d.price):'—'}</span>
                  {d && <span style={{ fontSize:11, fontWeight:700, color:(d.changePct||0)>=0?T.green:'#ff8080' }}>{(d.changePct||0)>=0?'▲':'▼'}{Math.abs(d.changePct||0).toFixed(2)}%</span>}
                </div>
              ))}
            </div>
          </div>
          {/* Bull-bear image */}
          <div className="hero-img" style={{ borderRadius:18, overflow:'hidden', boxShadow:'0 12px 48px rgba(0,0,0,.35)', border:'1px solid rgba(255,255,255,.07)' }}>
            <img src="/bull-bear.webp" alt="Bull vs Bear Market" style={{ width:'100%', display:'block' }}/>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div ref={statsRef} style={{ background:T.navy, padding:'20px', borderBottom:`1px solid rgba(255,255,255,.06)` }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:1 }}>
          {[['₹2,840 Cr+','Daily Volume'],['4.1L+','Active Clients'],['50+','Indices Tracked'],['₹0','Delivery Brokerage']].map(([v,l]) => (
            <div key={l} data-stagger style={{ textAlign:'center', padding:'14px', borderRight:`1px solid rgba(255,255,255,.06)` }}>
              <div style={{ fontSize:22, fontWeight:900, color:T.green, fontFamily:'monospace' }}>{v}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.45)', marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feature cards ── */}
      <section ref={featRef} style={{ maxWidth:1100, margin:'0 auto', padding:'52px 20px' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <h2 style={{ fontSize:30, fontWeight:900, color:T.gray800, letterSpacing:'-0.5px' }}>Everything you need to invest better</h2>
          <p style={{ fontSize:15, color:T.gray400, marginTop:8 }}>Research · Trade · Track · Learn</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:14 }}>
          {[
            { icon:BarChart3, color:T.blue,  bg:T.blueBg,  title:'Markets',      desc:'Live NSE/BSE indices, sectors, gainers & losers.', page:'markets' },
            { icon:Search,    color:T.green, bg:T.greenBg, title:'Screener',     desc:'Filter 4,000+ stocks by fundamentals & technicals.', page:'screener' },
            { icon:Activity,  color:T.amber, bg:T.amberBg, title:'Trade',        desc:'Place market, limit, stop-loss and GTT orders.', page:'trade' },
            { icon:Wallet,    color:T.navy,  bg:T.blueBg,  title:'Portfolio',    desc:'Track P&L, XIRR and complete order history.', page:'portfolio' },
            { icon:FileText,  color:'#7C3AED', bg:'#F3EEFF', title:'Mutual Funds', desc:'₹0 commission, 16k+ schemes, direct plans.', page:'mf' },
            { icon:BookOpen,  color:T.green, bg:T.greenBg, title:'Glossary',     desc:'SEBI, LTCG, VIX — 20+ terms explained.', page:'glossary' },
          ].map(f => {
            const cRef = useCardHover()
            return (
              <div key={f.title} data-stagger ref={cRef} onClick={() => setPage(f.page)} style={{
                background:T.white, border:`1px solid ${T.gray200}`, borderRadius:12,
                padding:22, cursor:'pointer', boxShadow:'0 1px 4px rgba(0,0,0,.05)',
              }}>
                <div style={{ width:40, height:40, borderRadius:10, background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                  <f.icon size={19} color={f.color}/>
                </div>
                <h3 style={{ fontSize:14, fontWeight:700, color:T.gray800, marginBottom:5 }}>{f.title}</h3>
                <p style={{ fontSize:12, color:T.gray400, lineHeight:1.6 }}>{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

/* ════════════════════════════════════════
   AUTH PAGES
════════════════════════════════════════ */
function AuthWrap({ children, title, sub }) {
  const ref = useFadeUp()
  const iS  = { width:'100%', padding:'10px 13px', borderRadius:8, border:`1.5px solid ${T.gray200}`, fontSize:14, color:T.gray800, outline:'none', fontFamily:'inherit', boxSizing:'border-box', transition:'border .15s' }
  return (
    <div style={{ minHeight:'calc(100vh - 54px)', background:T.gray50, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div ref={ref} style={{ opacity:0, width:'100%', maxWidth:410, background:T.white, borderRadius:16,
        boxShadow:'0 8px 40px rgba(0,0,0,.1)', border:`1px solid ${T.gray200}`, padding:36 }}>
        <div style={{ textAlign:'center', marginBottom:26 }}>
          <div style={{ width:44, height:44, borderRadius:13,
            background:`linear-gradient(135deg,${T.green},${T.blue})`,
            display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px',
            boxShadow:`0 4px 14px rgba(0,179,134,.3)` }}>
            <TrendingUp size={20} color="#fff"/>
          </div>
          <h1 style={{ fontSize:22, fontWeight:800, color:T.gray800, marginBottom:4 }}>{title}</h1>
          <p style={{ fontSize:13, color:T.gray400 }}>{sub}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

function Login({ setPage }) {
  const dispatch = useDispatch()
  const { loading, error } = useSelector(s => s.auth)
  const [email, setEmail] = useState('')
  const [pw,    setPw]    = useState('')
  const [show,  setShow]  = useState(false)
  const iS = { width:'100%', padding:'10px 13px', borderRadius:8, border:`1.5px solid ${T.gray200}`, fontSize:14, color:T.gray800, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }

  return (
    <AuthWrap title="Welcome back" sub="Sign in to your TradePro account">
      <form onSubmit={async e => { e.preventDefault(); await dispatch(loginUser({ email, password:pw, deviceId:navigator.userAgent.slice(0,64), deviceName:`${navigator.platform} Browser`, userAgent:navigator.userAgent })) }}
        style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:T.gray400, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.5px' }}>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@email.com" style={iS}
            onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=T.gray200}/>
        </div>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:T.gray400, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.5px' }}>Password</label>
          <div style={{ position:'relative' }}>
            <input value={pw} onChange={e=>setPw(e.target.value)} type={show?'text':'password'} placeholder="••••••••" style={{ ...iS, paddingRight:42 }}
              onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=T.gray200}/>
            <button type="button" onClick={()=>setShow(!show)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:T.gray400, cursor:'pointer' }}>
              {show?<EyeOff size={15}/>:<Eye size={15}/>}
            </button>
          </div>
        </div>
        {error && <div style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 12px', borderRadius:8, background:T.redBg, color:T.red, fontSize:12, fontWeight:500 }}>
          <AlertTriangle size={13}/>{error}
        </div>}
        <button type="submit" disabled={loading} style={{ padding:'12px', borderRadius:9, background:T.green, color:'#fff', fontWeight:700, fontSize:14, border:'none', cursor:loading?'not-allowed':'pointer', opacity:loading?.6:1, boxShadow:`0 3px 12px rgba(0,179,134,.3)`, transition:'transform .18s' }}
          onMouseEnter={e=>!loading&&gsap.to(e.currentTarget,{scale:1.02,duration:.15})}
          onMouseLeave={e=>gsap.to(e.currentTarget,{scale:1,duration:.15})}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'center', fontSize:11, color:T.gray400 }}>
          <Lock size={10}/> Secured · JWT · TLS 1.3
        </div>
      </form>
      <p style={{ marginTop:18, textAlign:'center', fontSize:13, color:T.gray400 }}>
        New?{' '}<button onClick={()=>setPage('register')} style={{ color:T.blue, fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>Create account</button>
      </p>
    </AuthWrap>
  )
}

function Register({ setPage }) {
  const dispatch = useDispatch()
  const { loading, error } = useSelector(s => s.auth)
  const [step, setStep]   = useState(1)
  const [done, setDone]   = useState(false)
  const [form, setForm]   = useState({ name:'', email:'', phone:'', password:'', role:'CLIENT' })
  const [errs, setErrs]   = useState({})
  const iS = { width:'100%', padding:'10px 13px', borderRadius:8, fontSize:14, color:T.gray800, outline:'none', fontFamily:'inherit', boxSizing:'border-box', border:`1.5px solid` }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!/^\d{10}$/.test(form.phone)) e.phone = '10 digits'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email'
    if (form.password.length < 6) e.password = 'Min 6 chars'
    setErrs(e); return !Object.keys(e).length
  }
  const submit = async e => {
    e.preventDefault()
    const r = await dispatch(registerUser({ name:form.name, email:form.email, phone:form.phone, password:form.password, deviceId:navigator.userAgent.slice(0,64), deviceName:`${navigator.platform} Browser`, userAgent:navigator.userAgent }))
    if (!r.error) setDone(true)
  }

  if (done) return (
    <AuthWrap title="You're in! 🎉" sub="Account created">
      <div style={{ textAlign:'center', padding:'20px 0' }}>
        <div style={{ width:56, height:56, borderRadius:'50%', background:T.greenBg, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
          <CheckCircle2 size={28} color={T.green}/>
        </div>
        <p style={{ fontSize:13, color:T.gray400 }}>Redirecting to dashboard…</p>
      </div>
    </AuthWrap>
  )
  return (
    <AuthWrap title="Create account" sub={`Step ${step} of 2`}>
      <form onSubmit={step===1 ? e=>{e.preventDefault();if(validate())setStep(2)} : submit}
        style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {step===1 ? (
          <>
            {[['name','Full Name','Rahul Sharma'],['email','Email','you@email.com'],['phone','Phone','9876543210']].map(([k,l,ph]) => (
              <div key={k}>
                <label style={{ fontSize:11, fontWeight:700, color:T.gray400, display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>{l}</label>
                <input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={ph}
                  style={{ ...iS, borderColor:errs[k]?T.red:T.gray200 }}
                  onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=errs[k]?T.red:T.gray200}/>
                {errs[k]&&<p style={{ fontSize:11, color:T.red, marginTop:2 }}>{errs[k]}</p>}
              </div>
            ))}
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:T.gray400, display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>Password</label>
              <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min 6 characters"
                style={{ ...iS, borderColor:errs.password?T.red:T.gray200 }}
                onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=errs.password?T.red:T.gray200}/>
              {errs.password&&<p style={{ fontSize:11, color:T.red, marginTop:2 }}>{errs.password}</p>}
            </div>
          </>
        ) : (
          <>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:T.gray400, display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>Account Type</label>
              <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}
                style={{ ...iS, borderColor:T.gray200, background:T.white, cursor:'pointer' }}>
                {ROLES.map(r=><option key={r.id} value={r.id}>{r.label} — {r.desc}</option>)}
              </select>
            </div>
            <div style={{ padding:'11px 13px', borderRadius:8, background:T.blueBg, border:`1px solid ${T.blue}20`, display:'flex', gap:8 }}>
              <ShieldCheck size={14} color={T.blue} style={{ flexShrink:0, marginTop:1 }}/>
              <p style={{ fontSize:12, color:T.blue, lineHeight:1.5 }}>DEMAT &amp; PAN verification required before trading (SEBI mandate).</p>
            </div>
          </>
        )}
        {error && <div style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 12px', borderRadius:8, background:T.redBg, color:T.red, fontSize:12 }}><AlertTriangle size={13}/>{error}</div>}
        <div style={{ display:'flex', gap:8 }}>
          {step===2&&<button type="button" onClick={()=>setStep(1)} style={{ flex:1, padding:'11px', borderRadius:8, border:`1.5px solid ${T.gray200}`, background:T.white, fontSize:13, fontWeight:600, color:T.gray600, cursor:'pointer' }}>Back</button>}
          <button type="submit" disabled={loading} style={{ flex:1, padding:'11px', borderRadius:8, background:T.green, color:'#fff', fontWeight:700, fontSize:14, border:'none', cursor:loading?'not-allowed':'pointer', opacity:loading?.6:1 }}>
            {step===1?'Continue':loading?'Creating…':'Create Account'}
          </button>
        </div>
      </form>
      <p style={{ marginTop:14, textAlign:'center', fontSize:13, color:T.gray400 }}>
        Have an account?{' '}<button onClick={()=>setPage('login')} style={{ color:T.blue, fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>Sign in</button>
      </p>
    </AuthWrap>
  )
}

/* ════════════════════════════════════════
   MARKETS
════════════════════════════════════════ */
function Markets({ setPage }) {
  const { indices, gainers, losers, loading, lastUpdated, refresh } = useMarketData()
  const [tab, setTab] = useState('indices')
  const tableRef = useStagger('[data-stagger]', [tab])
  const KEY = ['NIFTY 50','NIFTY BANK','NIFTY NEXT 50','NIFTY MIDCAP SELECT','NIFTY IT','NIFTY PHARMA','NIFTY FMCG','NIFTY AUTO','NIFTY METAL','NIFTY REALTY','NIFTY FINANCIAL SERVICES','INDIA VIX']
  const rows = tab==='indices' ? KEY.map(k=>{const q=indices[k];return q?{symbol:k,name:SYMBOL_LABELS[k]||k,...q}:null}).filter(Boolean)
    : tab==='gainers' ? gainers : losers

  return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'24px 20px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:T.gray800 }}>Market Overview</h1>
          <p style={{ fontSize:13, color:T.gray400, marginTop:2 }}>NSE India live data · {tNow(lastUpdated)}</p>
        </div>
        <button onClick={refresh} style={{ padding:'7px 14px', borderRadius:8, background:T.white, border:`1px solid ${T.gray200}`, fontSize:12, fontWeight:600, color:T.gray600, cursor:'pointer' }}>↻ Refresh</button>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
        {[['indices','All Indices'],['gainers',`Gainers (${gainers.length})`],['losers',`Losers (${losers.length})`]].map(([id,lbl]) => (
          <button key={id} onClick={()=>setTab(id)} style={{ padding:'7px 16px', borderRadius:20, fontSize:13, fontWeight:600, border:`1.5px solid ${tab===id?T.blue:T.gray200}`, background:tab===id?T.blueBg:T.white, color:tab===id?T.blue:T.gray600, cursor:'pointer', transition:'all .15s' }}>
            {lbl}
          </button>
        ))}
      </div>
      <div ref={tableRef} style={{ background:T.white, borderRadius:12, border:`1px solid ${T.gray200}`, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr', padding:'9px 20px', background:T.gray50, borderBottom:`1px solid ${T.gray200}`, fontSize:11, fontWeight:700, color:T.gray400, textTransform:'uppercase', letterSpacing:'0.5px' }}>
          <span>Name</span><span style={{textAlign:'right'}}>Price</span><span style={{textAlign:'right'}}>Change</span><span style={{textAlign:'right'}}>High</span><span style={{textAlign:'right'}}>Low</span>
        </div>
        {loading && !rows.length ? <div style={{ padding:40, textAlign:'center', color:T.gray400, fontSize:14 }}>Loading live market data…</div>
        : rows.length === 0 ? <div style={{ padding:40, textAlign:'center', color:T.gray400 }}>No data</div>
        : rows.map((r,i) => {
          const up = (r.changePct||0) >= 0
          return (
            <div key={r.symbol||i} data-stagger style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr', padding:'12px 20px', borderBottom:`1px solid ${T.gray100}`, alignItems:'center', transition:'background .12s', cursor:'default' }}
              onMouseEnter={e=>e.currentTarget.style.background=T.gray50} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.gray800 }}>{r.name}</div>
                {r.symbol&&<div style={{ fontSize:10, color:T.gray400, fontFamily:'monospace', marginTop:1 }}>{r.symbol}</div>}
              </div>
              <div style={{ textAlign:'right' }}><LivePrice value={r.price} changePct={r.changePct} size={13}/></div>
              <div style={{ textAlign:'right' }}>{r.price>0&&<ChangeBadge changePct={r.changePct}/>}</div>
              <div style={{ textAlign:'right', fontFamily:'monospace', fontSize:12, color:T.greenDark }}>{r.high>0?f2(r.high):'—'}</div>
              <div style={{ textAlign:'right', fontFamily:'monospace', fontSize:12, color:T.redDark }}>{r.low>0?f2(r.low):'—'}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   SCREENER
════════════════════════════════════════ */
function Screener() {
  const { gainers, losers, loading } = useMarketData()
  const [search, setSearch] = useState('')
  const ref = useStagger('[data-stagger]', [gainers.length, losers.length, search])
  const all = [...gainers, ...losers]
  const filtered = search ? all.filter(s=>(SYMBOL_LABELS[s.symbol]||s.symbol).toLowerCase().includes(search.toLowerCase())) : all
  return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'24px 20px' }}>
      <h1 style={{ fontSize:22, fontWeight:800, color:T.gray800, marginBottom:4 }}>Stock Screener</h1>
      <p style={{ fontSize:13, color:T.gray400, marginBottom:20 }}>Live NSE stocks · gainers, losers &amp; most active</p>
      <div style={{ position:'relative', marginBottom:18, maxWidth:400 }}>
        <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:T.gray400 }}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search symbol or name…"
          style={{ width:'100%', padding:'9px 12px 9px 36px', borderRadius:8, border:`1.5px solid ${T.gray200}`, fontSize:13, color:T.gray800, outline:'none', boxSizing:'border-box' }}
          onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=T.gray200}/>
      </div>
      <div ref={ref} style={{ background:T.white, borderRadius:12, border:`1px solid ${T.gray200}`, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1.2fr', padding:'9px 20px', background:T.gray50, borderBottom:`1px solid ${T.gray200}`, fontSize:11, fontWeight:700, color:T.gray400, textTransform:'uppercase', letterSpacing:'0.5px' }}>
          <span>Company</span><span style={{textAlign:'right'}}>LTP</span><span style={{textAlign:'right'}}>Change</span><span style={{textAlign:'right'}}>Volume</span>
        </div>
        {loading&&!filtered.length?<div style={{padding:40,textAlign:'center',color:T.gray400}}>Loading…</div>
        :filtered.length===0?<div style={{padding:40,textAlign:'center',color:T.gray400}}>No results for "{search}"</div>
        :filtered.map((s,i)=>(
          <div key={s.symbol||i} data-stagger style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1.2fr', padding:'11px 20px', borderBottom:`1px solid ${T.gray100}`, alignItems:'center', transition:'background .12s' }}
            onMouseEnter={e=>e.currentTarget.style.background=T.gray50} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div style={{ fontSize:13, fontWeight:700, color:T.gray800 }}>{SYMBOL_LABELS[s.symbol]||s.symbol}</div>
            <div style={{ textAlign:'right' }}><LivePrice value={s.price} changePct={s.changePct} size={13}/></div>
            <div style={{ textAlign:'right' }}><ChangeBadge changePct={s.changePct}/></div>
            <div style={{ textAlign:'right', fontFamily:'monospace', fontSize:12, color:T.gray400 }}>{fVol(s.volume)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════ */
function Dashboard({ auth, setPage }) {
  const { indices, gainers, losers, loading, lastUpdated } = useMarketData()
  const { trades, loading:tl, loadTrades } = useTrades()
  const { user } = useSelector(s=>s.auth)
  const pageRef  = useFadeUp()
  const statsRef = useStagger('[data-stagger]', [Object.keys(indices).length])
  useEffect(()=>{loadTrades()},[])

  const pnl   = trades.reduce((s,t)=>s+(t.pnl||0),0)
  const done  = trades.filter(t=>t.status==='COMPLETE').length
  const nifty = indices['NIFTY 50'], bank = indices['NIFTY BANK'], vix = indices['INDIA VIX']

  return (
    <div ref={pageRef} style={{ opacity:0, maxWidth:1280, margin:'0 auto', padding:'24px 20px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:T.gray800 }}>Dashboard</h1>
          <p style={{ fontSize:13, color:T.gray400, marginTop:2 }}>{nifty?`NIFTY 50 · ${f2(nifty.price)} · ${nifty.changePct>=0?'+':''}${nifty.changePct.toFixed(2)}% · ${tNow(lastUpdated)}`:'Connecting…'}</p>
        </div>
        <button onClick={()=>setPage('trade')} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:8, background:T.green, color:'#fff', fontWeight:700, fontSize:13, border:'none', cursor:'pointer', boxShadow:`0 3px 12px rgba(0,179,134,.3)` }}>
          <Activity size={14}/> Place Order
        </button>
      </div>

      <div ref={statsRef} style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12, marginBottom:20 }}>
        {[
          ['NIFTY 50', nifty?f2(nifty.price):'—', nifty?.changePct, BarChart3, nifty?.changePct>=0?'green':'red'],
          ['BANK NIFTY', bank?f2(bank.price):'—', bank?.changePct, Activity, bank?.changePct>=0?'green':'red'],
          ['INDIA VIX', vix?f2(vix.price):'—', vix?.changePct, Gauge, 'amber'],
          ['My P&L', `${pnl>=0?'+':''}${fR0(Math.abs(pnl))}`, undefined, Wallet, pnl>=0?'green':'red'],
        ].map(([l,v,cp,Ic,acc]) => <StatCard key={l} data-stagger label={l} value={v} changePct={cp} icon={Ic} accent={acc}/>)}
      </div>

      {/* Onboarding for new users */}
      {!tl && trades.length===0 && (
        <Section style={{ marginBottom:20 }}>
          <div style={{ background:`linear-gradient(135deg,${T.navy},#1a2a5e)`, borderRadius:12, padding:'24px 28px', color:'#fff' }}>
            <h2 style={{ fontSize:17, fontWeight:800, marginBottom:6 }}>Welcome, {user?.name?.split(' ')[0]}! 👋</h2>
            <p style={{ fontSize:13, color:'rgba(255,255,255,.62)', marginBottom:16 }}>Your account is active. Place your first order to see your portfolio here.</p>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button onClick={()=>setPage('trade')} style={{ padding:'8px 16px', borderRadius:8, background:T.green, color:'#fff', fontWeight:700, fontSize:13, border:'none', cursor:'pointer' }}>Place First Order →</button>
              <button onClick={()=>setPage('markets')} style={{ padding:'8px 16px', borderRadius:8, background:'rgba(255,255,255,.1)', color:'#fff', fontWeight:600, fontSize:13, border:'1px solid rgba(255,255,255,.2)', cursor:'pointer' }}>Explore Markets</button>
            </div>
          </div>
        </Section>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
        {/* Orders */}
        <div style={{ background:T.white, border:`1px solid ${T.gray200}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 18px', borderBottom:`1px solid ${T.gray100}` }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:T.gray800 }}>My Orders</h3>
            <button onClick={()=>setPage('portfolio')} style={{ fontSize:12, color:T.blue, fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>View all →</button>
          </div>
          {tl ? <div style={{ padding:40, textAlign:'center', color:T.gray400 }}>Loading…</div>
          : trades.length===0 ? <div style={{ padding:40, textAlign:'center' }}>
              <ClipboardList size={28} color={T.gray200} style={{ margin:'0 auto 10px', display:'block' }}/>
              <p style={{ fontSize:13, color:T.gray400 }}>No orders yet.</p>
            </div>
          : <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ background:T.gray50, fontSize:11, color:T.gray400, textTransform:'uppercase', letterSpacing:'0.4px' }}>
                {['Symbol','Side','Qty','Price','Status'].map((h,i)=><th key={h} style={{ padding:'9px 16px', fontWeight:600, textAlign:i===0?'left':'right' }}>{h}</th>)}
              </tr></thead>
              <tbody>{trades.slice(0,8).map(t=>(
                <tr key={t.id} style={{ borderBottom:`1px solid ${T.gray100}` }}
                  onMouseEnter={e=>e.currentTarget.style.background=T.gray50} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'11px 16px', fontWeight:700, fontFamily:'monospace', color:T.gray800, fontSize:12 }}>{t.symbol}</td>
                  <td style={{ padding:'9px 16px', textAlign:'right' }}><span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:9, background:t.side==='BUY'?T.greenBg:T.redBg, color:t.side==='BUY'?T.greenDark:T.redDark }}>{t.side}</span></td>
                  <td style={{ padding:'9px 16px', textAlign:'right', fontFamily:'monospace', fontSize:12 }}>{t.quantity}</td>
                  <td style={{ padding:'9px 16px', textAlign:'right', fontFamily:'monospace', fontSize:12 }}>{fR(t.executedPrice||t.price||0)}</td>
                  <td style={{ padding:'9px 16px', textAlign:'right' }}><span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:9, background:{COMPLETE:T.greenBg,PENDING:T.amberBg,CANCELLED:T.gray100,REJECTED:T.redBg}[t.status]||T.gray100, color:{COMPLETE:T.greenDark,PENDING:T.amber,CANCELLED:T.gray400,REJECTED:T.redDark}[t.status]||T.gray400 }}>{t.status}</span></td>
                </tr>
              ))}</tbody>
            </table>}
        </div>
        {/* Movers */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[{title:'Top Gainers',data:gainers,up:true},{title:'Top Losers',data:losers,up:false}].map(({title,data,up})=>(
            <div key={title} style={{ background:T.white, border:`1px solid ${T.gray200}`, borderRadius:12, overflow:'hidden' }}>
              <div style={{ padding:'11px 14px', borderBottom:`1px solid ${T.gray100}`, display:'flex', alignItems:'center', gap:6 }}>
                {up?<TrendingUp size={13} color={T.green}/>:<TrendingDown size={13} color={T.red}/>}
                <span style={{ fontSize:13, fontWeight:700, color:T.gray800 }}>{title}</span>
              </div>
              {data.slice(0,5).map((s,i)=>(
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 14px', borderBottom:`1px solid ${T.gray100}` }}>
                  <span style={{ fontSize:12, fontWeight:700, color:T.gray800, fontFamily:'monospace' }}>{SYMBOL_LABELS[s.symbol]||s.symbol}</span>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:11, fontFamily:'monospace', color:T.gray600 }}>{s.price>0?f2(s.price):'—'}</div>
                    <div style={{ fontSize:10, fontWeight:700, color:up?T.green:T.red }}>{up?'+':''}{(s.changePct||0).toFixed(2)}%</div>
                  </div>
                </div>
              ))}
              {!data.length&&<div style={{ padding:16, textAlign:'center', fontSize:12, color:T.gray400 }}>Loading…</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ════════ TRADE ════════ */
function TradePage() {
  const { stocks, indices } = useMarketData()
  const { place, placing, trades } = useTrades()
  const [sel, setSel] = useState('RELIANCE')
  const [side, setSide] = useState('BUY')
  const [type, setType] = useState('MARKET')
  const [qty, setQty] = useState(10)
  const [price, setPrice] = useState(0)
  const [toast, setToast] = useState(null)
  const pageRef = useFadeUp()
  const q = stocks[sel] || indices[sel]
  const ltp = q?.price || 0
  useEffect(() => { setPrice(ltp) }, [sel, ltp])
  const orderVal = qty * (type === 'MARKET' ? ltp : price)
  const placeOrder = () => {
    if (!ltp) { setToast({ ok: false, msg: 'No live price' }); return }
    place({ symbol: sel, exchange: 'NSE', segment: 'EQUITY', orderType: type, side, quantity: qty, price: type === 'MARKET' ? null : price })
    setToast({ ok: true, msg: `${side} ${qty} ${sel} placed` })
    setTimeout(() => setToast(null), 3000)
  }
  const iS = { width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${T.gray200}`, fontSize: 13, color: T.gray800, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
  return (
    <div ref={pageRef} style={{ opacity: 0, maxWidth: 1280, margin: '0 auto', padding: '24px 20px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: T.gray800, marginBottom: 20 }}>Trading Terminal</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '240px 320px 1fr', gap: 14 }}>
        <div style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.gray100}`, fontSize: 11, fontWeight: 700, color: T.gray400, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Watchlist</div>
          {WATCH_SYMS.map(sym => {
            const sq = stocks[sym] || indices[sym]; const up = (sq?.changePct || 0) >= 0
            return <div key={sym} onClick={() => setSel(sym)} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${T.gray100}`, cursor: 'pointer', background: sel === sym ? T.blueBg : 'transparent', borderLeft: sel === sym ? `3px solid ${T.blue}` : '3px solid transparent', transition: 'all .12s' }}
              onMouseEnter={e => { if (sel !== sym) e.currentTarget.style.background = T.gray50 }} onMouseLeave={e => { if (sel !== sym) e.currentTarget.style.background = 'transparent' }}>
              <div><div style={{ fontSize: 11, fontWeight: 700, color: T.gray800 }}>{SYMBOL_LABELS[sym] || sym}</div></div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: T.gray800 }}>{sq ? f2(sq.price) : '—'}</div>
                {sq && <div style={{ fontSize: 10, fontWeight: 700, color: up ? T.green : T.red }}>{up ? '+' : ''}{sq.changePct.toFixed(2)}%</div>}
              </div>
            </div>
          })}
        </div>
        <div style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 12, padding: 18 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.gray800 }}>{SYMBOL_LABELS[sel] || sel}</div>
            <div style={{ marginTop: 3 }}><LivePrice value={ltp} changePct={q?.changePct || 0} size={22} /></div>
            {q && <div style={{ fontSize: 10, color: T.gray400, fontFamily: 'monospace', marginTop: 3 }}>O:{f2(q.open)} H:{f2(q.high)} L:{f2(q.low)}</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {['BUY', 'SELL'].map(s => <button key={s} onClick={() => setSide(s)} style={{ padding: 10, borderRadius: 8, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', background: side === s ? (s === 'BUY' ? T.green : T.red) : (s === 'BUY' ? T.greenBg : T.redBg), color: side === s ? '#fff' : (s === 'BUY' ? T.greenDark : T.redDark), transition: 'all .15s' }}>{s === 'BUY' ? '▲ BUY' : '▼ SELL'}</button>)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: T.gray400, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order Type</label>
              <select value={type} onChange={e => setType(e.target.value)} style={{ ...iS, background: T.white }}>{['MARKET', 'LIMIT', 'STOP_LOSS', 'GTT'].map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: T.gray400, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quantity</label>
              <input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} style={iS} /></div>
            {type !== 'MARKET' && <div><label style={{ fontSize: 11, fontWeight: 700, color: T.gray400, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price (₹)</label><input type="number" step="0.05" value={price} onChange={e => setPrice(Number(e.target.value))} style={iS} /></div>}
          </div>
          <div style={{ margin: '12px 0', padding: '10px 12px', borderRadius: 8, background: T.gray50, border: `1px solid ${T.gray200}`, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.gray600 }}>
            <span>Order value</span><span style={{ fontWeight: 700, fontFamily: 'monospace', color: T.gray800 }}>{fR(orderVal)}</span>
          </div>
          <button onClick={placeOrder} disabled={placing} style={{ width: '100%', padding: '12px', borderRadius: 9, fontWeight: 700, fontSize: 14, border: 'none', cursor: placing ? 'not-allowed' : 'pointer', background: side === 'BUY' ? T.green : T.red, color: '#fff', opacity: placing ? .6 : 1, transition: 'all .15s' }}
            onMouseEnter={e => !placing && gsap.to(e.currentTarget, { scale: 1.02, duration: .15 })}
            onMouseLeave={e => gsap.to(e.currentTarget, { scale: 1, duration: .15 })}>
            {placing ? 'Placing…' : `Place ${side} Order`}
          </button>
          {toast && <div style={{ marginTop: 10, padding: '9px 12px', borderRadius: 8, background: toast.ok ? T.greenBg : T.redBg, color: toast.ok ? T.greenDark : T.redDark, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            {toast.ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}{toast.msg}
          </div>}
        </div>
        <div style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.gray100}`, fontSize: 13, fontWeight: 700, color: T.gray800 }}>Order Book</div>
          {trades.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: T.gray400, fontSize: 13 }}>No orders yet.</div>
            : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ background: T.gray50, color: T.gray400, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.4px' }}>
                {['Symbol', 'Side', 'Qty', 'Price', 'Status'].map((h, i) => <th key={h} style={{ padding: '9px 14px', fontWeight: 600, textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>)}
              </tr></thead>
              <tbody>{trades.slice(0, 12).map(t => (
                <tr key={t.id} style={{ borderBottom: `1px solid ${T.gray100}` }} onMouseEnter={e => e.currentTarget.style.background = T.gray50} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: T.gray800, fontFamily: 'monospace' }}>{t.symbol}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right' }}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 9, background: t.side === 'BUY' ? T.greenBg : T.redBg, color: t.side === 'BUY' ? T.greenDark : T.redDark }}>{t.side}</span></td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', fontFamily: 'monospace' }}>{t.quantity}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', fontFamily: 'monospace' }}>{f2(t.executedPrice || t.price || 0)}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right' }}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 9, background: { COMPLETE: T.greenBg, PENDING: T.amberBg, CANCELLED: T.gray100, REJECTED: T.redBg }[t.status] || T.gray100, color: { COMPLETE: T.greenDark, PENDING: T.amber, CANCELLED: T.gray400, REJECTED: T.redDark }[t.status] || T.gray400 }}>{t.status}</span></td>
                </tr>
              ))}</tbody>
            </table>}
        </div>
      </div>
    </div>
  )
}

/* ════════ PORTFOLIO ════════ */
function Portfolio() {
  const { trades, loading, loadTrades } = useTrades()
  const { user } = useSelector(s => s.auth)
  const ref = useFadeUp()
  useEffect(() => { loadTrades() }, [])
  const pnl = trades.reduce((s, t) => s + (t.pnl || 0), 0)
  const done = trades.filter(t => t.status === 'COMPLETE').length
  return (
    <div ref={ref} style={{ opacity: 0, maxWidth: 1280, margin: '0 auto', padding: '24px 20px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: T.gray800, marginBottom: 4 }}>Portfolio</h1>
      <p style={{ fontSize: 13, color: T.gray400, marginBottom: 20 }}>Real-time P&L · {user?.email}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
        {[['Total Orders', String(trades.length), null], ['Completed', String(done), true], ['Realised P&L', `${pnl >= 0 ? '+' : ''}${fR0(Math.abs(pnl))}`, pnl >= 0], ['KYC', user?.kycStatus || 'PENDING', user?.kycStatus === 'VERIFIED']].map(([l, v, up]) => (
          <div key={l} style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.gray400, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: up === null ? T.gray800 : up ? T.green : T.red, fontFamily: 'monospace' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '13px 18px', borderBottom: `1px solid ${T.gray100}`, fontSize: 13, fontWeight: 700, color: T.gray800 }}>Trade History ({trades.length})</div>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: T.gray400 }}>Loading…</div>
          : trades.length === 0 ? <div style={{ padding: 40, textAlign: 'center' }}>
            <ClipboardList size={32} color={T.gray200} style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 13, color: T.gray400 }}>No trades yet. Use the Trading Terminal to get started.</p>
          </div>
          : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 600 }}>
            <thead><tr style={{ background: T.gray50, color: T.gray400, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.4px' }}>
              {['Symbol', 'Exchange', 'Side', 'Type', 'Qty', 'Price', 'P&L', 'Status'].map((h, i) => <th key={h} style={{ padding: '9px 14px', fontWeight: 600, textAlign: i <= 1 ? 'left' : 'right' }}>{h}</th>)}
            </tr></thead>
            <tbody>{trades.map(t => (
              <tr key={t.id} style={{ borderBottom: `1px solid ${T.gray100}` }} onMouseEnter={e => e.currentTarget.style.background = T.gray50} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '11px 14px', fontWeight: 700, fontFamily: 'monospace', color: T.gray800 }}>{t.symbol}</td>
                <td style={{ padding: '9px 14px', fontSize: 11, color: T.gray400 }}>{t.exchange}</td>
                <td style={{ padding: '9px 14px', textAlign: 'right' }}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 9, background: t.side === 'BUY' ? T.greenBg : T.redBg, color: t.side === 'BUY' ? T.greenDark : T.redDark }}>{t.side}</span></td>
                <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 11, color: T.gray400 }}>{t.orderType?.replace('_', ' ')}</td>
                <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: 'monospace' }}>{t.quantity}</td>
                <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: 'monospace' }}>{fR(t.executedPrice || t.price || 0)}</td>
                <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: (t.pnl || 0) >= 0 ? T.green : T.red }}>{(t.pnl || 0) === 0 ? '—' : `${(t.pnl || 0) >= 0 ? '+' : ''}${fR0(Math.abs(t.pnl || 0))}`}</td>
                <td style={{ padding: '9px 14px', textAlign: 'right' }}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 9, background: { COMPLETE: T.greenBg, PENDING: T.amberBg, CANCELLED: T.gray100, REJECTED: T.redBg }[t.status] || T.gray100, color: { COMPLETE: T.greenDark, PENDING: T.amber, CANCELLED: T.gray400, REJECTED: T.redDark }[t.status] || T.gray400 }}>{t.status}</span></td>
              </tr>
            ))}</tbody>
          </table></div>}
      </div>
    </div>
  )
}

/* ════════ MUTUAL FUNDS ════════ */
function MutualFunds() {
  const [search, setSearch] = useState('')
  const [mfList, setMfList] = useState([])
  const [navs,   setNavs]   = useState({})
  const [sel,    setSel]    = useState(null)
  const ref  = useFadeUp()
  const grid = useStagger('[data-stagger]', [Object.keys(navs).length])

  useEffect(() => {
    fetch('https://api.mfapi.in/mf').then(r=>r.json()).then(setMfList).catch(()=>{})
    MF_CODES.forEach(code => {
      fetch(`https://api.mfapi.in/mf/${code}`).then(r=>r.json()).then(j => {
        setNavs(p => ({ ...p, [code]: { name:j.meta?.scheme_name||'', nav:parseFloat(j.data?.[0]?.nav||0), date:j.data?.[0]?.date||'', house:j.meta?.fund_house||'' } }))
      }).catch(()=>{})
    })
  }, [])

  const results = search ? mfList.filter(s => s.schemeName?.toLowerCase().includes(search.toLowerCase())).slice(0,20) : []

  return (
    <div ref={ref} style={{ opacity:0, maxWidth:1280, margin:'0 auto', padding:'24px 20px' }}>
      <h1 style={{ fontSize:22, fontWeight:800, color:T.gray800, marginBottom:4 }}>Mutual Funds</h1>
      <p style={{ fontSize:13, color:T.gray400, marginBottom:20 }}>Direct plans · ₹0 commission · AMFI NAV data</p>
      <div style={{ position:'relative', marginBottom:20 }}>
        <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:T.gray400 }}/>
        <input value={search} onChange={e=>{setSearch(e.target.value);setSel(null)}}
          placeholder={`Search ${mfList.length.toLocaleString('en-IN')} fund schemes…`}
          style={{ width:'100%', padding:'11px 12px 11px 38px', borderRadius:10, border:`1.5px solid ${T.gray200}`, fontSize:14, color:T.gray800, outline:'none', boxSizing:'border-box' }}
          onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=T.gray200}/>
        {results.length > 0 && !sel && (
          <div style={{ position:'absolute', top:'100%', left:0, right:0, background:T.white, border:`1px solid ${T.gray200}`, borderRadius:10, zIndex:20, maxHeight:280, overflowY:'auto', boxShadow:'0 8px 24px rgba(0,0,0,.12)', marginTop:4 }}>
            {results.map(s => (
              <div key={s.schemeCode} onClick={async () => {
                setSearch(s.schemeName); setSel(null)
                const j = await fetch(`https://api.mfapi.in/mf/${s.schemeCode}`).then(r=>r.json())
                setSel({ code:s.schemeCode, name:j.meta?.scheme_name||s.schemeName, nav:parseFloat(j.data?.[0]?.nav||0), date:j.data?.[0]?.date||'', house:j.meta?.fund_house||'', history:j.data?.slice(0,30)||[] })
              }} style={{ padding:'11px 16px', borderBottom:`1px solid ${T.gray100}`, cursor:'pointer', fontSize:13, color:T.gray800, display:'flex', justifyContent:'space-between' }}
                onMouseEnter={e=>e.currentTarget.style.background=T.gray50} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <span>{s.schemeName}</span><ChevronRight size={13} color={T.gray400}/>
              </div>
            ))}
          </div>
        )}
      </div>
      {sel && (
        <div style={{ background:T.white, border:`1px solid ${T.gray200}`, borderRadius:12, padding:20, marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <h3 style={{ fontSize:15, fontWeight:800, color:T.gray800, marginBottom:3 }}>{sel.name}</h3>
              <div style={{ fontSize:12, color:T.gray400 }}>{sel.house}</div>
            </div>
            <button onClick={()=>{setSel(null);setSearch('')}} style={{ background:'none', border:'none', cursor:'pointer', color:T.gray400 }}><X size={18}/></button>
          </div>
          <div style={{ fontSize:28, fontWeight:900, fontFamily:'monospace', color:T.gray800, marginBottom:12 }}>
            ₹{sel.nav.toFixed(4)} <span style={{ fontSize:13, color:T.gray400, fontFamily:'inherit', fontWeight:400 }}>as of {sel.date}</span>
          </div>
          <div style={{ maxHeight:180, overflowY:'auto', border:`1px solid ${T.gray200}`, borderRadius:8, marginBottom:14 }}>
            {sel.history.map((h,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 13px', borderBottom:`1px solid ${T.gray100}`, fontSize:12 }}>
                <span style={{ color:T.gray400 }}>{h.date}</span>
                <span style={{ fontFamily:'monospace', fontWeight:600, color:T.gray800 }}>₹{parseFloat(h.nav).toFixed(4)}</span>
              </div>
            ))}
          </div>
          <button style={{ padding:'10px 22px', borderRadius:8, background:T.green, color:'#fff', fontWeight:700, fontSize:13, border:'none', cursor:'pointer' }}>Invest Now →</button>
        </div>
      )}
      <div ref={grid} style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
        {MF_CODES.map(code => {
          const n = navs[code]
          const cRef = useCardHover()
          return (
            <div key={code} data-stagger ref={cRef} style={{ background:T.white, border:`1px solid ${T.gray200}`, borderRadius:12, padding:18, cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
              {n ? <>
                <div style={{ fontSize:10, color:T.gray400, fontWeight:600, textTransform:'uppercase', marginBottom:6 }}>{n.house}</div>
                <h3 style={{ fontSize:12, fontWeight:700, color:T.gray800, marginBottom:8, lineHeight:1.4 }}>{n.name}</h3>
                <div style={{ fontSize:20, fontWeight:900, fontFamily:'monospace', color:T.gray800 }}>₹{n.nav.toFixed(4)}</div>
                <div style={{ fontSize:11, color:T.gray400, marginTop:2 }}>NAV · {n.date}</div>
                <button style={{ marginTop:10, width:'100%', padding:'8px', borderRadius:8, background:T.greenBg, color:T.greenDark, fontWeight:700, fontSize:11, border:`1px solid ${T.green}30`, cursor:'pointer' }}>Invest</button>
              </> : <div style={{ height:90, display:'flex', alignItems:'center', justifyContent:'center', color:T.gray400, fontSize:12 }}>Loading…</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ════════ WATCHLIST ════════ */
function Watchlist() {
  const { indices, stocks, loading } = useMarketData()
  const ref = useFadeUp()
  const tbl = useStagger('[data-stagger]', [Object.keys(stocks).length])
  return (
    <div ref={ref} style={{ opacity:0, maxWidth:1280, margin:'0 auto', padding:'24px 20px' }}>
      <h1 style={{ fontSize:22, fontWeight:800, color:T.gray800, marginBottom:4 }}>Watchlist</h1>
      <p style={{ fontSize:13, color:T.gray400, marginBottom:20 }}>Live NSE prices · auto-refresh every 6s</p>
      <div ref={tbl} style={{ background:T.white, border:`1px solid ${T.gray200}`, borderRadius:12, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 1fr', padding:'9px 18px', background:T.gray50, borderBottom:`1px solid ${T.gray200}`, fontSize:11, fontWeight:700, color:T.gray400, textTransform:'uppercase', letterSpacing:'0.5px' }}>
          {['Symbol','LTP','Change','High','Low','Volume'].map((h,i)=><span key={h} style={{textAlign:i===0?'left':'right'}}>{h}</span>)}
        </div>
        {WATCH_SYMS.map((sym,i) => {
          const q = stocks[sym] || indices[sym]
          return (
            <div key={sym} data-stagger style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 1fr', padding:'12px 18px', borderBottom:`1px solid ${T.gray100}`, alignItems:'center', transition:'background .12s' }}
              onMouseEnter={e=>e.currentTarget.style.background=T.gray50} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.gray800 }}>{SYMBOL_LABELS[sym]||sym}</div>
                <div style={{ fontSize:10, color:T.gray400, fontFamily:'monospace' }}>{sym}</div>
              </div>
              <div style={{ textAlign:'right' }}><LivePrice value={q?.price||0} changePct={q?.changePct||0} size={13}/></div>
              <div style={{ textAlign:'right' }}>{q?.price>0&&<ChangeBadge changePct={q.changePct}/>}</div>
              <div style={{ textAlign:'right', fontFamily:'monospace', fontSize:12, color:T.greenDark }}>{q?.high>0?f2(q.high):'—'}</div>
              <div style={{ textAlign:'right', fontFamily:'monospace', fontSize:12, color:T.redDark }}>{q?.low>0?f2(q.low):'—'}</div>
              <div style={{ textAlign:'right', fontFamily:'monospace', fontSize:12, color:T.gray400 }}>{q?.volume?fVol(q.volume):'—'}</div>
            </div>
          )
        })}
        {loading&&<div style={{ padding:'12px 18px', textAlign:'center', fontSize:12, color:T.gray400 }}>Updating…</div>}
      </div>
    </div>
  )
}

/* ════════ GLOSSARY ════════ */
function GlossaryPage() {
  const [q, setQ] = useState('')
  const ref = useFadeUp()
  const listRef = useStagger('[data-stagger]', [q])
  const filtered = GLOSSARY.filter(t => !q || t.term.toLowerCase().includes(q.toLowerCase()) || t.full.toLowerCase().includes(q.toLowerCase()) || t.def.toLowerCase().includes(q.toLowerCase()))
  return (
    <div ref={ref} style={{ opacity:0, maxWidth:860, margin:'0 auto', padding:'24px 20px' }}>
      <h1 style={{ fontSize:22, fontWeight:800, color:T.gray800, marginBottom:4 }}>Financial Glossary</h1>
      <p style={{ fontSize:13, color:T.gray400, marginBottom:20 }}>20 key terms used in Indian capital markets</p>
      <div style={{ position:'relative', marginBottom:20 }}>
        <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:T.gray400 }}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search SEBI, LTCG, VIX…"
          style={{ width:'100%', padding:'10px 12px 10px 36px', borderRadius:8, border:`1.5px solid ${T.gray200}`, fontSize:13, color:T.gray800, outline:'none', boxSizing:'border-box' }}
          onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=T.gray200}/>
      </div>
      <div ref={listRef} style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.map(t => (
          <div key={t.term} data-stagger style={{ background:T.white, border:`1px solid ${T.gray200}`, borderRadius:12, padding:'15px 18px', display:'flex', gap:14, alignItems:'flex-start' }}>
            <div style={{ flexShrink:0, minWidth:68, padding:'5px 10px', borderRadius:8, background:T.navy, color:'#fff', fontFamily:'monospace', fontSize:12, fontWeight:700, textAlign:'center' }}>{t.term}</div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.gray800, marginBottom:3 }}>{t.full}</div>
              <p style={{ fontSize:13, color:T.gray400, lineHeight:1.6 }}>{t.def}</p>
            </div>
          </div>
        ))}
        {filtered.length===0&&<div style={{ padding:40, textAlign:'center', color:T.gray400 }}>No results for "{q}"</div>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   APP SHELL + ROOT
════════════════════════════════════════ */
function AppShell() {
  const dispatch = useDispatch()
  const { token, user } = useSelector(s => s.auth)
  const [page, setPage] = useState('home')
  const { indices, gainers, losers } = useMarketData()

  // Redirect on auth change
  useEffect(() => {
    if (token && user && ['home','login','register'].includes(page)) setPage('dashboard')
  }, [token, user])

  const auth = token && user ? { name: user.name?.split(' ')[0] || 'User', role: 'CLIENT' } : null
  const onLogout = () => { dispatch(logoutUser()); setPage('home') }

  const renderPage = () => {
    switch (page) {
      case 'login':     return <Login setPage={setPage}/>
      case 'register':  return <Register setPage={setPage}/>
      case 'markets':   return <Markets setPage={setPage}/>
      case 'screener':  return <Screener/>
      case 'mf':        return <MutualFunds/>
      case 'watchlist': return auth ? <Watchlist/> : <Login setPage={setPage}/>
      case 'glossary':  return <GlossaryPage/>
      case 'dashboard': return auth ? <Dashboard auth={auth} setPage={setPage}/> : <Login setPage={setPage}/>
      case 'trade':     return auth ? <TradePage/> : <Login setPage={setPage}/>
      case 'portfolio': return auth ? <Portfolio/> : <Login setPage={setPage}/>
      default:          return <Home setPage={setPage} indices={indices}/>
    }
  }

  return (
    <div style={{ fontFamily:"Inter,-apple-system,BlinkMacSystemFont,sans-serif", minHeight:'100vh', background:T.gray50, display:'flex', flexDirection:'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:Inter,sans-serif; background:#F8F9FB; }
        button { font-family:inherit; cursor:pointer; }
        input, select { font-family:inherit; }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:4px; }
      `}</style>
      <TopNav auth={auth} page={page} setPage={setPage} onLogout={onLogout}/>
      <MarketStrip indices={indices} setPage={setPage}/>
      <main style={{ flex:1 }}>{renderPage()}</main>
      <TickerTape gainers={gainers} losers={losers}/>
      <footer style={{ background:T.navy, color:'rgba(255,255,255,.4)', fontSize:12, padding:'14px 20px', textAlign:'center' }}>
        © 2026 TradePro · SEBI-registered · NSE &amp; BSE · T+1 Settlement · ₹0 equity delivery brokerage
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <AppShell/>
    </Provider>
  )
}

/**
 * TradePro — Tickertape-inspired UI
 * Dark navy header · White content · Green/Red live data
 */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Provider, useSelector, useDispatch } from 'react-redux'
import { store } from './store'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Search, Bell, ChevronRight, Eye, EyeOff, Lock, AlertTriangle, CheckCircle2, LogOut, X, ArrowUpRight, ArrowDownRight, BarChart3, Wallet, Gauge, FileText, ShieldCheck, BookOpen, Activity, ClipboardList, Users, Menu, ChevronDown, Star, Zap, Info } from 'lucide-react'
import { loginUser, logoutUser, registerUser } from './store/slices/authSlice'
import { useTrades, useMarketData } from './hooks'
import { SYMBOL_LABELS } from './services/marketData'
import './assets/styles/global.css'

/* ── color tokens (Tickertape) ── */
const C = {
  green:     '#00B386',
  greenBg:   '#E6F9F4',
  greenDark: '#007A5E',
  red:       '#E84040',
  redBg:     '#FEF0F0',
  redDark:   '#B52B2B',
  amber:     '#F5A623',
  amberBg:   '#FEF7E6',
  navy:      '#0B1437',
  navyMid:   '#1E2D5A',
  navyLight: '#2D3F8E',
  blue:      '#3B5BDB',
  blueBg:    '#EEF3FF',
  gray50:    '#F8F9FB',
  gray100:   '#F1F3F6',
  gray200:   '#E4E7EC',
  gray400:   '#9AA3B2',
  gray600:   '#5A6478',
  gray800:   '#1E2636',
  white:     '#FFFFFF',
}

/* ── helpers ── */
const f2 = n => Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
const f0 = n => Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:0})
const fR = n => '₹'+f2(n)
const fR0= n => '₹'+f0(n)
const fVol= n => !n?'—':n>=1e7?`${(n/1e7).toFixed(2)}Cr`:n>=1e5?`${(n/1e5).toFixed(2)}L`:f0(n)
const tNow= ts => ts?new Date(ts).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'--'

/* ── static reference data ── */
const ROLES=[
  {id:'CLIENT',     label:'Individual Investor', desc:'Stocks, MF & ETFs'},
  {id:'DEALER',     label:'Dealer / Broker',      desc:'Client order execution'},
  {id:'ANALYST',    label:'Research Analyst',     desc:'Publish reports'},
  {id:'COMPLIANCE', label:'Compliance Officer',   desc:'Regulatory filings'},
  {id:'ADMIN',      label:'Administrator',        desc:'Full platform access'},
]
const NAV=[
  {id:'markets',   label:'Markets'},
  {id:'screener',  label:'Screener'},
  {id:'trade',     label:'Trade'},
  {id:'portfolio', label:'Portfolio'},
  {id:'mf',        label:'Mutual Funds'},
  {id:'watchlist', label:'Watchlist'},
  {id:'glossary',  label:'Glossary'},
]
const GLOSSARY=[
  {term:'SEBI',   full:'Securities & Exchange Board of India', def:"India's primary capital-market regulator."},
  {term:'NSE',    full:'National Stock Exchange of India',     def:"India's largest stock exchange. Home of NIFTY 50."},
  {term:'BSE',    full:'Bombay Stock Exchange',                def:"Asia's oldest exchange (est. 1875). Home of SENSEX."},
  {term:'DEMAT',  full:'Dematerialised Account',              def:'Electronic account holding shares digitally.'},
  {term:'P&L',    full:'Profit & Loss',                       def:'Net result of trading activity.'},
  {term:'LTCG',   full:'Long-Term Capital Gains',             def:'Gains from equity held >12 months, taxed at 10% above ₹1L.'},
  {term:'STCG',   full:'Short-Term Capital Gains',            def:'Gains from equity held ≤12 months, taxed at 15%.'},
  {term:'MTM',    full:'Mark-to-Market',                      def:'Daily revaluation of positions at market prices.'},
  {term:'DP',     full:'Depository Participant',              def:'Intermediary providing DEMAT account services.'},
  {term:'CDSL',   full:'Central Depository Services Ltd.',    def:'BSE-promoted depository for electronic securities.'},
  {term:'NSDL',   full:'National Securities Depository Ltd.', def:"India's first depository. Facilitates NSE/BSE settlement."},
  {term:'XIRR',   full:'Extended Internal Rate of Return',    def:'Annualised return for irregular cash flows (SIPs, etc.).'},
  {term:'VIX',    full:'India Volatility Index',              def:'NSE measure of market uncertainty from NIFTY options.'},
  {term:'STT',    full:'Securities Transaction Tax',          def:'Tax on equity: 0.1% delivery, 0.025% intraday sell.'},
  {term:'GTT',    full:'Good Till Triggered',                 def:'Order active until a specific price trigger is hit.'},
  {term:'F&O',    full:'Futures & Options',                   def:'Derivatives. Futures = obligation; Options = right.'},
  {term:'SIP',    full:'Systematic Investment Plan',          def:'Invest a fixed amount in MF at regular intervals.'},
  {term:'NAV',    full:'Net Asset Value',                     def:'MF price = (assets − liabilities) ÷ units. Published daily.'},
  {term:'T+1',    full:'Trade Plus One Settlement',           def:'India standard since 2023. Settled by next trading day.'},
  {term:'AMFI',   full:'Assoc. of Mutual Funds in India',    def:'Self-regulatory body for MFs. Publishes daily NAVs.'},
]

/* ════════════════════════════════════════════════════════
   MARKET CHIP — inline price pill used everywhere
════════════════════════════════════════════════════════ */
function Chip({ label, price, changePct, onClick }) {
  const up = (changePct||0) >= 0
  return (
    <button onClick={onClick}
      style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:20,background:C.white,border:`1px solid ${C.gray200}`,cursor:onClick?'pointer':'default',whiteSpace:'nowrap',transition:'all .15s'}}
      onMouseEnter={e=>{if(onClick)e.currentTarget.style.borderColor=C.blue}}
      onMouseLeave={e=>e.currentTarget.style.borderColor=C.gray200}>
      <span style={{fontSize:12,fontWeight:600,color:C.gray600}}>{label}</span>
      <span style={{fontSize:12,fontWeight:700,fontVariantNumeric:'tabular-nums',color:C.gray800}}>{price>0?f2(price):'—'}</span>
      {price>0 && (
        <span style={{fontSize:11,fontWeight:700,color:up?C.green:C.red,display:'flex',alignItems:'center',gap:1}}>
          {up?<ArrowUpRight size={11}/>:<ArrowDownRight size={11}/>}
          {Math.abs(changePct||0).toFixed(2)}%
        </span>
      )}
    </button>
  )
}

/* ════════════════════════════════════════════════════════
   TOP NAV — Tickertape dark navy
════════════════════════════════════════════════════════ */
function TopNav({ auth, page, setPage, onLogout }) {
  const [mob, setMob] = useState(false)
  return (
    <header style={{background:C.navy,position:'sticky',top:0,zIndex:50,boxShadow:'0 1px 0 rgba(255,255,255,0.06)'}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'0 20px',display:'flex',alignItems:'center',gap:8,height:56}}>
        {/* Logo */}
        <button onClick={()=>setPage(auth?'markets':'home')} style={{display:'flex',alignItems:'center',gap:8,marginRight:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${C.green},${C.blue})`,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <TrendingUp size={15} color="#fff"/>
          </div>
          <span style={{fontWeight:800,fontSize:16,color:'#fff',letterSpacing:'-0.4px'}}>TradePro</span>
        </button>

        {/* Desktop links */}
        <nav style={{display:'flex',alignItems:'center',gap:1,flex:1,overflow:'hidden'}}>
          {NAV.filter(n=>auth||['markets','glossary'].includes(n.id)).map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)}
              style={{padding:'6px 12px',borderRadius:6,fontSize:13,fontWeight:500,color:page===n.id?'#fff':'rgba(255,255,255,0.6)',background:page===n.id?'rgba(255,255,255,0.12)':'transparent',transition:'all .15s',whiteSpace:'nowrap',display:'block'}}>
              {n.label}
            </button>
          ))}
        </nav>

        {/* Right */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:'auto',flexShrink:0}}>
          {auth ? (
            <>
              <button style={{padding:'6px 10px',borderRadius:6,background:'transparent',color:'rgba(255,255,255,0.7)'}}>
                <Bell size={17}/>
              </button>
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'4px 10px 4px 4px',borderRadius:20,background:'rgba(255,255,255,0.08)'}}>
                <div style={{width:26,height:26,borderRadius:'50%',background:`linear-gradient(135deg,${C.green},${C.blue})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff'}}>
                  {auth.name.charAt(0).toUpperCase()}
                </div>
                <span style={{fontSize:12,fontWeight:600,color:'#fff'}}>{auth.name}</span>
              </div>
              <button onClick={onLogout} style={{padding:'6px 8px',borderRadius:6,color:'rgba(255,255,255,0.5)',background:'transparent'}}>
                <LogOut size={15}/>
              </button>
            </>
          ) : (
            <>
              <button onClick={()=>setPage('login')} style={{padding:'7px 14px',borderRadius:6,fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.75)',background:'transparent'}}>
                Sign In
              </button>
              <button onClick={()=>setPage('register')} style={{padding:'7px 16px',borderRadius:6,fontSize:13,fontWeight:700,color:'#fff',background:C.green,boxShadow:`0 2px 10px rgba(0,179,134,0.3)`}}>
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

/* ════════════════════════════════════════════════════════
   MARKET STRIP — indices row below nav
════════════════════════════════════════════════════════ */
function MarketStrip({ indices, loading }) {
  const KEY_INDICES = ['NIFTY 50','NIFTY BANK','NIFTY NEXT 50','INDIA VIX','NIFTY MIDCAP SELECT','NIFTY IT','NIFTY PHARMA']
  return (
    <div style={{background:C.white,borderBottom:`1px solid ${C.gray200}`,overflowX:'auto',scrollbarWidth:'none'}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'8px 20px',display:'flex',gap:8,minWidth:'max-content'}}>
        {KEY_INDICES.map(key=>{
          const q=indices[key]
          return <Chip key={key} label={SYMBOL_LABELS[key]||key} price={q?.price||0} changePct={q?.changePct||0}/>
        })}
        {loading&&!Object.keys(indices).length&&<span style={{fontSize:12,color:C.gray400,alignSelf:'center'}}>Loading live data…</span>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   TICKER TAPE — auto-scrolling bottom strip
════════════════════════════════════════════════════════ */
function TickerTape({ gainers, losers }) {
  const items = [...gainers, ...losers, ...gainers, ...losers]
  if (!items.length) return null
  return (
    <div style={{background:C.gray50,borderTop:`1px solid ${C.gray200}`,overflow:'hidden',padding:'6px 0'}}>
      <div style={{display:'flex',whiteSpace:'nowrap',animation:'marquee 50s linear infinite',gap:0}}>
        {items.concat(items).map((it,i)=>{
          const up=(it.changePct||0)>=0
          return (
            <span key={i} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'0 16px',borderRight:`1px solid ${C.gray200}`,fontSize:12,flexShrink:0}}>
              <span style={{fontWeight:700,color:C.gray800,fontFamily:'monospace'}}>{SYMBOL_LABELS[it.symbol]||it.symbol}</span>
              <span style={{color:C.gray600,fontFamily:'monospace'}}>{it.price>0?f2(it.price):'—'}</span>
              {it.price>0&&<span style={{color:up?C.green:C.red,fontWeight:700}}>{up?'▲':'▼'}{Math.abs(it.changePct||0).toFixed(2)}%</span>}
            </span>
          )
        })}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   HOME / LANDING — Tickertape style
════════════════════════════════════════════════════════ */
function Home({ setPage, indices, gainers, losers }) {
  const nifty = indices['NIFTY 50']
  const bank  = indices['NIFTY BANK']
  const vix   = indices['INDIA VIX']

  return (
    <div style={{background:C.white,minHeight:'100vh'}}>
      {/* Hero */}
      <section style={{background:`linear-gradient(135deg,${C.navy} 0%,#1a2a5e 60%,#0d1f4a 100%)`,padding:'60px 20px 48px',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,backgroundImage:`radial-gradient(circle at 20% 50%, rgba(0,179,134,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(59,91,219,0.15) 0%, transparent 50%)`,pointerEvents:'none'}}/>
        <div style={{maxWidth:680,margin:'0 auto',position:'relative'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 14px',borderRadius:20,background:'rgba(0,179,134,0.15)',border:'1px solid rgba(0,179,134,0.3)',marginBottom:20}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:C.green,animation:'pulseDot 1.6s infinite'}}/>
            <span style={{fontSize:12,color:C.green,fontWeight:600}}>NSE &amp; BSE Live Data</span>
          </div>
          <h1 style={{fontSize:'clamp(32px,5vw,52px)',fontWeight:900,color:'#fff',lineHeight:1.1,letterSpacing:'-1px',marginBottom:16}}>
            India's smartest<br/><span style={{color:C.green}}>market intelligence</span> platform
          </h1>
          <p style={{fontSize:16,color:'rgba(255,255,255,0.65)',lineHeight:1.7,marginBottom:32,maxWidth:500,margin:'0 auto 32px'}}>
            Live NSE/BSE data, stock screener, portfolio tracking, mutual funds — everything a serious investor needs.
          </p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:48}}>
            <button onClick={()=>setPage('register')} style={{padding:'12px 28px',borderRadius:8,background:C.green,color:'#fff',fontWeight:700,fontSize:15,boxShadow:`0 4px 16px rgba(0,179,134,0.35)`,border:'none',cursor:'pointer'}}>
              Start for free →
            </button>
            <button onClick={()=>setPage('markets')} style={{padding:'12px 28px',borderRadius:8,background:'rgba(255,255,255,0.1)',color:'#fff',fontWeight:600,fontSize:15,border:'1px solid rgba(255,255,255,0.2)',cursor:'pointer'}}>
              Explore Markets
            </button>
          </div>
          {/* Live index chips */}
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
            {[{label:'NIFTY 50',data:nifty},{label:'BANK NIFTY',data:bank},{label:'INDIA VIX',data:vix}].map(({label,data})=>(
              <div key={label} style={{padding:'8px 16px',borderRadius:20,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',display:'flex',gap:8,alignItems:'center'}}>
                <span style={{fontSize:11,color:'rgba(255,255,255,0.6)',fontWeight:600}}>{label}</span>
                <span style={{fontSize:13,fontWeight:800,color:'#fff',fontFamily:'monospace'}}>{data?f2(data.price):'—'}</span>
                {data&&<span style={{fontSize:11,fontWeight:700,color:data.changePct>=0?C.green:'#ff6b6b'}}>{data.changePct>=0?'▲':'▼'}{Math.abs(data.changePct).toFixed(2)}%</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section style={{maxWidth:1280,margin:'0 auto',padding:'56px 20px'}}>
        <h2 style={{fontSize:28,fontWeight:800,color:C.gray800,textAlign:'center',marginBottom:8}}>Everything you need to invest better</h2>
        <p style={{fontSize:15,color:C.gray400,textAlign:'center',marginBottom:40}}>Research · Trade · Track · Learn</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:16}}>
          {[
            {icon:BarChart3, color:C.blue,   bg:C.blueBg,  title:'Markets',       desc:'Live NSE/BSE indices, gainers, losers and sector heatmap.', page:'markets'},
            {icon:Search,    color:C.green,  bg:C.greenBg, title:'Screener',      desc:'Filter 4000+ stocks by fundamentals, technicals and sector.', page:'screener'},
            {icon:TrendingUp,color:C.amber,  bg:C.amberBg, title:'Trading',       desc:'Place market, limit, stop-loss and GTT orders instantly.', page:'trade'},
            {icon:Wallet,    color:C.navy,   bg:C.blueBg,  title:'Portfolio',     desc:'Track holdings, P&L, XIRR and trade history in real time.', page:'portfolio'},
            {icon:FileText,  color:'#7C3AED',bg:'#F3EEFF', title:'Mutual Funds',  desc:'Browse 16,000+ schemes. ₹0 commission, direct plans.', page:'mf'},
            {icon:BookOpen,  color:C.green,  bg:C.greenBg, title:'Glossary',      desc:'SEBI, LTCG, STCG, MTM, VIX — 20+ key terms explained.', page:'glossary'},
          ].map(f=>(
            <div key={f.title} onClick={()=>setPage(f.page)}
              style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:24,cursor:'pointer',transition:'all .2s'}}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.08)';e.currentTarget.style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none'}}>
              <div style={{width:40,height:40,borderRadius:10,background:f.bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14}}>
                <f.icon size={20} color={f.color}/>
              </div>
              <h3 style={{fontSize:15,fontWeight:700,color:C.gray800,marginBottom:6}}>{f.title}</h3>
              <p style={{fontSize:13,color:C.gray400,lineHeight:1.6}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bull-bear image section */}
      <section style={{background:C.gray50,borderTop:`1px solid ${C.gray200}`,padding:'48px 20px'}}>
        <div style={{maxWidth:1000,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:48,alignItems:'center'}}>
          <div>
            <h2 style={{fontSize:32,fontWeight:900,color:C.gray800,lineHeight:1.15,marginBottom:16}}>
              Trade with the <span style={{color:C.green}}>bulls</span>.<br/>
              Survive the <span style={{color:C.red}}>bears</span>.
            </h2>
            <p style={{fontSize:15,color:C.gray400,lineHeight:1.7,marginBottom:24}}>
              TradePro gives you institutional-grade analytics and real-time NSE data — so you can make smarter decisions in any market.
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {['₹0 equity delivery brokerage','Real-time NSE & BSE data every 6s','SEBI-compliant · T+1 settlement'].map(t=>(
                <div key={t} style={{display:'flex',alignItems:'center',gap:10,fontSize:14,color:C.gray600}}>
                  <CheckCircle2 size={15} color={C.green}/>{t}
                </div>
              ))}
            </div>
            <button onClick={()=>setPage('register')} style={{marginTop:24,padding:'11px 24px',borderRadius:8,background:C.green,color:'#fff',fontWeight:700,fontSize:14,border:'none',cursor:'pointer'}}>
              Open free account →
            </button>
          </div>
          <div style={{borderRadius:16,overflow:'hidden',boxShadow:'0 8px 40px rgba(0,0,0,0.12)'}}>
            <img src="/bull-bear.webp" alt="Bull vs Bear" style={{width:'100%',display:'block'}}/>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   AUTH PAGES — centered modal style
════════════════════════════════════════════════════════ */
function AuthPage({ children, title, sub }) {
  return (
    <div style={{minHeight:'calc(100vh - 56px)',background:C.gray50,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:420,background:C.white,borderRadius:16,boxShadow:'0 8px 40px rgba(0,0,0,0.1)',border:`1px solid ${C.gray200}`,padding:36}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${C.green},${C.blue})`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
            <TrendingUp size={20} color="#fff"/>
          </div>
          <h1 style={{fontSize:22,fontWeight:800,color:C.gray800,marginBottom:4}}>{title}</h1>
          <p style={{fontSize:13,color:C.gray400}}>{sub}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

function Login({ setPage }) {
  const dispatch = useDispatch()
  const { loading, error } = useSelector(s=>s.auth)
  const [email,setEmail]=useState('')
  const [pw,setPw]=useState('')
  const [show,setShow]=useState(false)

  const inputStyle = {width:'100%',padding:'11px 14px',borderRadius:8,border:`1.5px solid ${C.gray200}`,fontSize:14,color:C.gray800,outline:'none',fontFamily:'inherit',transition:'border .15s',boxSizing:'border-box'}

  return (
    <AuthPage title="Welcome back" sub="Sign in to your TradePro account">
      <form onSubmit={async e=>{e.preventDefault();await dispatch(loginUser({email,password:pw,deviceId:navigator.userAgent.slice(0,64),deviceName:`${navigator.platform} Browser`,userAgent:navigator.userAgent}))}} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div>
          <label style={{fontSize:12,fontWeight:600,color:C.gray600,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.5px'}}>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@email.com" style={inputStyle}
            onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.gray200}/>
        </div>
        <div>
          <label style={{fontSize:12,fontWeight:600,color:C.gray600,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.5px'}}>Password</label>
          <div style={{position:'relative'}}>
            <input value={pw} onChange={e=>setPw(e.target.value)} type={show?'text':'password'} placeholder="••••••••" style={{...inputStyle,paddingRight:42}}
              onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.gray200}/>
            <button type="button" onClick={()=>setShow(!show)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:C.gray400,cursor:'pointer'}}>
              {show?<EyeOff size={16}/>:<Eye size={16}/>}
            </button>
          </div>
        </div>
        {error&&<div style={{display:'flex',alignItems:'center',gap:6,padding:'9px 12px',borderRadius:8,background:C.redBg,color:C.red,fontSize:12,fontWeight:500}}><AlertTriangle size={13}/>{error}</div>}
        <button type="submit" disabled={loading} style={{padding:'12px',borderRadius:8,background:C.green,color:'#fff',fontWeight:700,fontSize:14,border:'none',cursor:loading?'not-allowed':'pointer',opacity:loading?.6:1,boxShadow:`0 2px 12px rgba(0,179,134,0.3)`}}>
          {loading?'Signing in…':'Sign In'}
        </button>
        <div style={{display:'flex',alignItems:'center',gap:4,justifyContent:'center',fontSize:11,color:C.gray400}}>
          <Lock size={10}/> Secured with JWT · TLS 1.3
        </div>
      </form>
      <p style={{marginTop:20,textAlign:'center',fontSize:13,color:C.gray400}}>
        New to TradePro?{' '}<button onClick={()=>setPage('register')} style={{color:C.blue,fontWeight:700,background:'none',border:'none',cursor:'pointer'}}>Create account</button>
      </p>
    </AuthPage>
  )
}

function Register({ setPage }) {
  const dispatch = useDispatch()
  const { loading, error } = useSelector(s=>s.auth)
  const [step,setStep]=useState(1)
  const [done,setDone]=useState(false)
  const [form,setForm]=useState({name:'',email:'',phone:'',password:'',role:'CLIENT'})
  const [errs,setErrs]=useState({})

  const inputStyle={width:'100%',padding:'11px 14px',borderRadius:8,border:`1.5px solid`,fontSize:14,color:C.gray800,outline:'none',fontFamily:'inherit',transition:'border .15s',boxSizing:'border-box'}

  const validate=()=>{
    const e={}
    if(!form.name.trim()) e.name='Required'
    if(!/^\d{10}$/.test(form.phone)) e.phone='10 digits required'
    if(!/^\S+@\S+\.\S+$/.test(form.email)) e.email='Invalid email'
    if(form.password.length<6) e.password='Min 6 characters'
    setErrs(e); return !Object.keys(e).length
  }

  const submit=async e=>{
    e.preventDefault()
    const r=await dispatch(registerUser({name:form.name,email:form.email,phone:form.phone,password:form.password,deviceId:navigator.userAgent.slice(0,64),deviceName:`${navigator.platform} Browser`,userAgent:navigator.userAgent}))
    if(!r.error) setDone(true)
  }

  if(done) return (
    <AuthPage title="You're in! 🎉" sub="Account created successfully">
      <div style={{textAlign:'center',padding:'20px 0'}}>
        <div style={{width:56,height:56,borderRadius:'50%',background:C.greenBg,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
          <CheckCircle2 size={28} color={C.green}/>
        </div>
        <p style={{fontSize:14,color:C.gray400}}>Redirecting to your dashboard…</p>
      </div>
    </AuthPage>
  )

  return (
    <AuthPage title="Create account" sub={`Step ${step} of 2 — ${step===1?'Your details':'Almost done!'}`}>
      <form onSubmit={step===1?e=>{e.preventDefault();if(validate())setStep(2)}:submit} style={{display:'flex',flexDirection:'column',gap:13}}>
        {step===1 ? (
          <>
            {[['name','Full Name','Rahul Sharma'],['email','Email','you@email.com'],['phone','Phone','9876543210']].map(([k,l,ph])=>(
              <div key={k}>
                <label style={{fontSize:12,fontWeight:600,color:C.gray600,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.5px'}}>{l}</label>
                <input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={ph}
                  style={{...inputStyle,borderColor:errs[k]?C.red:C.gray200}}
                  onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=errs[k]?C.red:C.gray200}/>
                {errs[k]&&<p style={{fontSize:11,color:C.red,marginTop:3}}>{errs[k]}</p>}
              </div>
            ))}
            <div>
              <label style={{fontSize:12,fontWeight:600,color:C.gray600,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.5px'}}>Password</label>
              <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min 6 characters"
                style={{...inputStyle,borderColor:errs.password?C.red:C.gray200}}
                onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=errs.password?C.red:C.gray200}/>
              {errs.password&&<p style={{fontSize:11,color:C.red,marginTop:3}}>{errs.password}</p>}
            </div>
          </>
        ) : (
          <>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:C.gray600,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.5px'}}>Account type</label>
              <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}
                style={{...inputStyle,borderColor:C.gray200,background:C.white,cursor:'pointer'}}>
                {ROLES.map(r=><option key={r.id} value={r.id}>{r.label} — {r.desc}</option>)}
              </select>
            </div>
            <div style={{padding:'12px 14px',borderRadius:8,background:C.blueBg,border:`1px solid ${C.blue}20`,display:'flex',gap:8}}>
              <ShieldCheck size={14} color={C.blue} style={{flexShrink:0,marginTop:1}}/>
              <p style={{fontSize:12,color:C.blue,lineHeight:1.5}}>DEMAT &amp; PAN verification required before trading activation (SEBI mandate).</p>
            </div>
          </>
        )}
        {error&&<div style={{display:'flex',alignItems:'center',gap:6,padding:'9px 12px',borderRadius:8,background:C.redBg,color:C.red,fontSize:12}}><AlertTriangle size={13}/>{error}</div>}
        <div style={{display:'flex',gap:10}}>
          {step===2&&<button type="button" onClick={()=>setStep(1)} style={{flex:1,padding:'11px',borderRadius:8,border:`1.5px solid ${C.gray200}`,background:C.white,fontSize:13,fontWeight:600,color:C.gray600,cursor:'pointer'}}>Back</button>}
          <button type="submit" disabled={loading} style={{flex:1,padding:'11px',borderRadius:8,background:C.green,color:'#fff',fontWeight:700,fontSize:14,border:'none',cursor:loading?'not-allowed':'pointer',opacity:loading?.6:1}}>
            {step===1?'Continue':loading?'Creating…':'Create Account'}
          </button>
        </div>
      </form>
      <p style={{marginTop:16,textAlign:'center',fontSize:13,color:C.gray400}}>
        Already have an account?{' '}<button onClick={()=>setPage('login')} style={{color:C.blue,fontWeight:700,background:'none',border:'none',cursor:'pointer'}}>Sign in</button>
      </p>
    </AuthPage>
  )
}

/* ════════════════════════════════════════════════════════
   MARKETS PAGE — Tickertape market overview
════════════════════════════════════════════════════════ */
function Markets({ setPage }) {
  const { indices, gainers, losers, loading, lastUpdated, refresh } = useMarketData()
  const [tab, setTab] = useState('indices')

  const KEY = ['NIFTY 50','NIFTY BANK','NIFTY NEXT 50','NIFTY IT','NIFTY PHARMA','NIFTY FMCG','NIFTY AUTO','NIFTY METAL','NIFTY REALTY','NIFTY MIDCAP SELECT','NIFTY FINANCIAL SERVICES','INDIA VIX']

  const tabBtn = (id, label) => (
    <button key={id} onClick={()=>setTab(id)}
      style={{padding:'8px 16px',borderRadius:20,fontSize:13,fontWeight:600,border:`1.5px solid ${tab===id?C.blue:C.gray200}`,background:tab===id?C.blueBg:C.white,color:tab===id?C.blue:C.gray600,cursor:'pointer',transition:'all .15s'}}>
      {label}
    </button>
  )

  const rows = tab==='indices' ? KEY.map(k=>{const q=indices[k];return q?{symbol:k,name:SYMBOL_LABELS[k]||k,...q}:null}).filter(Boolean)
    : tab==='gainers' ? gainers : losers

  return (
    <div style={{maxWidth:1280,margin:'0 auto',padding:'24px 20px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:800,color:C.gray800}}>Market Overview</h1>
          <p style={{fontSize:13,color:C.gray400,marginTop:2}}>NSE India live data · {tNow(lastUpdated)}</p>
        </div>
        <button onClick={refresh} style={{padding:'7px 14px',borderRadius:8,background:C.white,border:`1px solid ${C.gray200}`,fontSize:12,fontWeight:600,color:C.gray600,cursor:'pointer'}}>
          ↻ Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {tabBtn('indices','All Indices')}
        {tabBtn('gainers',`Top Gainers (${gainers.length})`)}
        {tabBtn('losers',`Top Losers (${losers.length})`)}
      </div>

      {/* Table */}
      <div style={{background:C.white,borderRadius:12,border:`1px solid ${C.gray200}`,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr',padding:'10px 20px',background:C.gray50,borderBottom:`1px solid ${C.gray200}`,fontSize:11,fontWeight:700,color:C.gray400,textTransform:'uppercase',letterSpacing:'0.5px'}}>
          <span>Name</span><span style={{textAlign:'right'}}>Price</span><span style={{textAlign:'right'}}>Change</span><span style={{textAlign:'right'}}>High</span><span style={{textAlign:'right'}}>Low</span>
        </div>
        {loading && !rows.length ? (
          <div style={{padding:40,textAlign:'center',color:C.gray400,fontSize:14}}>Loading live market data…</div>
        ) : rows.length === 0 ? (
          <div style={{padding:40,textAlign:'center',color:C.gray400,fontSize:14}}>No data available</div>
        ) : rows.map((r,i)=>{
          const up=(r.changePct||r.changePct===0)&&r.changePct>=0
          return (
            <div key={r.symbol||i} style={{display:'grid',gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr',padding:'12px 20px',borderBottom:`1px solid ${C.gray100}`,alignItems:'center',transition:'background .12s',cursor:'default'}}
              onMouseEnter={e=>e.currentTarget.style.background=C.gray50} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:C.gray800}}>{r.name||SYMBOL_LABELS[r.symbol]||r.symbol}</div>
                {r.symbol&&<div style={{fontSize:11,color:C.gray400,marginTop:1,fontFamily:'monospace'}}>{r.symbol}</div>}
              </div>
              <div style={{textAlign:'right',fontFamily:'monospace',fontSize:13,fontWeight:700,color:C.gray800}}>{r.price>0?f2(r.price):'—'}</div>
              <div style={{textAlign:'right'}}>
                {r.price>0&&(
                  <span style={{fontSize:12,fontWeight:700,color:up?C.green:C.red,background:up?C.greenBg:C.redBg,padding:'2px 8px',borderRadius:12,display:'inline-flex',alignItems:'center',gap:3}}>
                    {up?'▲':'▼'}{Math.abs(r.changePct||0).toFixed(2)}%
                  </span>
                )}
              </div>
              <div style={{textAlign:'right',fontFamily:'monospace',fontSize:12,color:C.greenDark}}>{r.high>0?f2(r.high):'—'}</div>
              <div style={{textAlign:'right',fontFamily:'monospace',fontSize:12,color:C.redDark}}>{r.low>0?f2(r.low):'—'}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   SCREENER — filter stocks
════════════════════════════════════════════════════════ */
function Screener() {
  const { gainers, losers, loading } = useMarketData()
  const [search, setSearch] = useState('')
  const all = [...gainers, ...losers]
  const filtered = search ? all.filter(s=>(SYMBOL_LABELS[s.symbol]||s.symbol).toLowerCase().includes(search.toLowerCase())) : all

  return (
    <div style={{maxWidth:1280,margin:'0 auto',padding:'24px 20px'}}>
      <h1 style={{fontSize:22,fontWeight:800,color:C.gray800,marginBottom:4}}>Stock Screener</h1>
      <p style={{fontSize:13,color:C.gray400,marginBottom:20}}>Live NSE stocks — gainers, losers &amp; most active</p>
      <div style={{display:'flex',gap:10,marginBottom:20,alignItems:'center'}}>
        <div style={{position:'relative',flex:1,maxWidth:400}}>
          <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:C.gray400}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search symbol or company…"
            style={{width:'100%',padding:'9px 12px 9px 36px',borderRadius:8,border:`1.5px solid ${C.gray200}`,fontSize:13,color:C.gray800,outline:'none',boxSizing:'border-box'}}/>
        </div>
        <span style={{fontSize:12,color:C.gray400}}>{filtered.length} stocks</span>
      </div>
      <div style={{background:C.white,borderRadius:12,border:`1px solid ${C.gray200}`,overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1.2fr 1fr 1.2fr',padding:'9px 20px',background:C.gray50,borderBottom:`1px solid ${C.gray200}`,fontSize:11,fontWeight:700,color:C.gray400,textTransform:'uppercase',letterSpacing:'0.5px'}}>
          <span>Company</span><span style={{textAlign:'right'}}>LTP</span><span style={{textAlign:'right'}}>Change</span><span style={{textAlign:'right'}}>Volume</span>
        </div>
        {loading&&!filtered.length?<div style={{padding:40,textAlign:'center',color:C.gray400}}>Loading…</div>
        :filtered.length===0?<div style={{padding:40,textAlign:'center',color:C.gray400}}>No results for "{search}"</div>
        :filtered.map((s,i)=>{
          const up=(s.changePct||0)>=0
          return (
            <div key={s.symbol||i} style={{display:'grid',gridTemplateColumns:'2fr 1.2fr 1fr 1.2fr',padding:'11px 20px',borderBottom:`1px solid ${C.gray100}`,alignItems:'center',transition:'background .12s'}}
              onMouseEnter={e=>e.currentTarget.style.background=C.gray50} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{fontSize:13,fontWeight:700,color:C.gray800}}>{SYMBOL_LABELS[s.symbol]||s.symbol}</div>
              <div style={{textAlign:'right',fontFamily:'monospace',fontSize:13,fontWeight:700}}>{s.price>0?f2(s.price):'—'}</div>
              <div style={{textAlign:'right'}}>
                <span style={{fontSize:12,fontWeight:700,color:up?C.green:C.red}}>
                  {up?'▲':'▼'}{Math.abs(s.changePct||0).toFixed(2)}%
                </span>
              </div>
              <div style={{textAlign:'right',fontFamily:'monospace',fontSize:12,color:C.gray400}}>{fVol(s.volume)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   DASHBOARD (post-login)
════════════════════════════════════════════════════════ */
function Dashboard({ auth, setPage }) {
  const { indices, gainers, losers, loading, lastUpdated } = useMarketData()
  const { trades, loading:tradesLoading, loadTrades } = useTrades()
  const { user } = useSelector(s=>s.auth)

  useEffect(()=>{loadTrades()},[])

  const pnl      = trades.reduce((s,t)=>s+(t.pnl||0),0)
  const completed= trades.filter(t=>t.status==='COMPLETE').length
  const pending  = trades.filter(t=>t.status==='PENDING').length
  const nifty    = indices['NIFTY 50']
  const bank     = indices['NIFTY BANK']
  const vix      = indices['INDIA VIX']
  const isNew    = !tradesLoading && trades.length===0

  const statCard=(label,val,up,sub)=>(
    <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:'16px 18px',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
      <div style={{fontSize:11,fontWeight:600,color:C.gray400,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>{label}</div>
      <div style={{fontSize:22,fontWeight:800,color:C.gray800,fontFamily:'monospace',fontVariantNumeric:'tabular-nums'}}>{val}</div>
      {sub&&<div style={{fontSize:12,fontWeight:600,color:up?C.green:C.red,marginTop:3,display:'flex',alignItems:'center',gap:3}}>{up?<TrendingUp size={11}/>:<TrendingDown size={11}/>}{sub}</div>}
    </div>
  )

  return (
    <div style={{maxWidth:1280,margin:'0 auto',padding:'24px 20px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:800,color:C.gray800}}>Dashboard</h1>
          <p style={{fontSize:13,color:C.gray400,marginTop:2}}>
            {nifty?`NIFTY 50 · ${f2(nifty.price)} · ${nifty.changePct>=0?'+':''}${nifty.changePct.toFixed(2)}% · ${tNow(lastUpdated)}`:'Connecting to live data…'}
          </p>
        </div>
        <button onClick={()=>setPage('trade')} style={{padding:'9px 18px',borderRadius:8,background:C.green,color:'#fff',fontWeight:700,fontSize:13,border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
          <Activity size={14}/> Place Order
        </button>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:20}}>
        {statCard('NIFTY 50',nifty?f2(nifty.price):'—',nifty?.changePct>=0,nifty?`${nifty.changePct.toFixed(2)}% today`:null)}
        {statCard('BANK NIFTY',bank?f2(bank.price):'—',bank?.changePct>=0,bank?`${bank.changePct.toFixed(2)}% today`:null)}
        {statCard('INDIA VIX',vix?f2(vix.price):'—',true,null)}
        {statCard('My P&L',`${pnl>=0?'+':''}${fR0(Math.abs(pnl))}`,pnl>=0,`${completed} completed`)}
      </div>

      {/* New user onboarding */}
      {isNew&&(
        <div style={{background:`linear-gradient(135deg,${C.navy},#1a2a5e)`,borderRadius:12,padding:'24px 28px',marginBottom:20,color:'#fff'}}>
          <h2 style={{fontSize:17,fontWeight:800,marginBottom:6}}>Welcome, {user?.name?.split(' ')[0]}! 👋</h2>
          <p style={{fontSize:13,color:'rgba(255,255,255,0.65)',marginBottom:16}}>Your account is active. Add funds and place your first order to get started.</p>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <button onClick={()=>setPage('trade')} style={{padding:'8px 16px',borderRadius:8,background:C.green,color:'#fff',fontWeight:700,fontSize:13,border:'none',cursor:'pointer'}}>
              Place First Order →
            </button>
            <button onClick={()=>setPage('markets')} style={{padding:'8px 16px',borderRadius:8,background:'rgba(255,255,255,0.1)',color:'#fff',fontWeight:600,fontSize:13,border:'1px solid rgba(255,255,255,0.2)',cursor:'pointer'}}>
              Explore Markets
            </button>
          </div>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16}}>
        {/* Orders */}
        <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:`1px solid ${C.gray100}`}}>
            <h3 style={{fontSize:14,fontWeight:700,color:C.gray800}}>My Orders</h3>
            <button onClick={()=>setPage('portfolio')} style={{fontSize:12,color:C.blue,fontWeight:600,background:'none',border:'none',cursor:'pointer'}}>View all →</button>
          </div>
          {tradesLoading?<div style={{padding:40,textAlign:'center',color:C.gray400}}>Loading…</div>
          :trades.length===0?<div style={{padding:40,textAlign:'center'}}>
            <ClipboardList size={32} color={C.gray200} style={{margin:'0 auto 12px',display:'block'}}/>
            <p style={{fontSize:13,color:C.gray400}}>No orders yet. Place your first trade.</p>
          </div>
          :<table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:C.gray50,fontSize:11,color:C.gray400,textTransform:'uppercase',letterSpacing:'0.4px'}}>
              {['Symbol','Side','Qty','Price','Status'].map(h=><th key={h} style={{padding:'9px 18px',fontWeight:600,textAlign:h==='Symbol'?'left':'right'}}>{h}</th>)}
            </tr></thead>
            <tbody>{trades.slice(0,8).map(t=>(
              <tr key={t.id} style={{borderBottom:`1px solid ${C.gray100}`}}
                onMouseEnter={e=>e.currentTarget.style.background=C.gray50} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{padding:'11px 18px',fontSize:13,fontWeight:700,color:C.gray800,fontFamily:'monospace'}}>{t.symbol}</td>
                <td style={{padding:'9px 18px',textAlign:'right'}}>
                  <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:10,background:t.side==='BUY'?C.greenBg:C.redBg,color:t.side==='BUY'?C.greenDark:C.redDark}}>{t.side}</span>
                </td>
                <td style={{padding:'9px 18px',textAlign:'right',fontFamily:'monospace',fontSize:12}}>{t.quantity}</td>
                <td style={{padding:'9px 18px',textAlign:'right',fontFamily:'monospace',fontSize:12}}>{fR(t.executedPrice||t.price||0)}</td>
                <td style={{padding:'9px 18px',textAlign:'right'}}>
                  <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:10,background:{COMPLETE:C.greenBg,PENDING:C.amberBg,CANCELLED:C.gray100,REJECTED:C.redBg}[t.status]||C.gray100,color:{COMPLETE:C.greenDark,PENDING:C.amber,CANCELLED:C.gray400,REJECTED:C.redDark}[t.status]||C.gray400}}>{t.status}</span>
                </td>
              </tr>
            ))}</tbody>
          </table>}
        </div>

        {/* Movers */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {[{title:'Top Gainers',data:gainers,up:true},{title:'Top Losers',data:losers,up:false}].map(({title,data,up})=>(
            <div key={title} style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,overflow:'hidden'}}>
              <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.gray100}`,display:'flex',alignItems:'center',gap:6}}>
                {up?<TrendingUp size={14} color={C.green}/>:<TrendingDown size={14} color={C.red}/>}
                <h3 style={{fontSize:13,fontWeight:700,color:C.gray800}}>{title}</h3>
              </div>
              {data.slice(0,5).map((s,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 16px',borderBottom:`1px solid ${C.gray100}`}}>
                  <span style={{fontSize:12,fontWeight:700,color:C.gray800,fontFamily:'monospace'}}>{SYMBOL_LABELS[s.symbol]||s.symbol}</span>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:12,fontFamily:'monospace',color:C.gray600}}>{s.price>0?f2(s.price):'—'}</div>
                    <div style={{fontSize:11,fontWeight:700,color:up?C.green:C.red}}>{up?'+':''}{(s.changePct||0).toFixed(2)}%</div>
                  </div>
                </div>
              ))}
              {!data.length&&<div style={{padding:20,textAlign:'center',fontSize:12,color:C.gray400}}>Loading…</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ════════ TRADE PAGE ════════ */
function TradePage() {
  const { stocks, indices } = useMarketData()
  const { place, placing, trades } = useTrades()
  const [sel, setSel] = useState('RELIANCE')
  const [side, setSide] = useState('BUY')
  const [type, setType] = useState('MARKET')
  const [qty, setQty] = useState(10)
  const [price, setPrice] = useState(0)
  const [toast, setToast] = useState(null)
  const WATCH = ['NIFTY 50','NIFTY BANK','RELIANCE','TCS','HDFCBANK','INFY','ITC','WIPRO','SBIN','BHARTIARTL']
  const q = stocks[sel] || indices[sel]
  const ltp = q?.price || 0
  useEffect(()=>{setPrice(ltp)},[sel,ltp])
  const orderVal = qty * (type==='MARKET' ? ltp : price)
  const placeOrder = () => {
    if (!ltp) { setToast({ok:false,msg:'No live price available'}); return }
    place({symbol:sel,exchange:'NSE',segment:'EQUITY',orderType:type,side,quantity:qty,price:type==='MARKET'?null:price})
    setToast({ok:true,msg:`${side} ${qty} ${sel} order placed`})
    setTimeout(()=>setToast(null),3000)
  }
  const iStyle = {width:'100%',padding:'9px 12px',borderRadius:8,border:`1.5px solid ${C.gray200}`,fontSize:13,color:C.gray800,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}
  return (
    <div style={{maxWidth:1280,margin:'0 auto',padding:'24px 20px'}}>
      <h1 style={{fontSize:22,fontWeight:800,color:C.gray800,marginBottom:20}}>Trading Terminal</h1>
      <div style={{display:'grid',gridTemplateColumns:'260px 340px 1fr',gap:16}}>
        {/* Watchlist */}
        <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,overflow:'hidden'}}>
          <div style={{padding:'12px 14px',borderBottom:`1px solid ${C.gray100}`,fontSize:12,fontWeight:700,color:C.gray400,textTransform:'uppercase',letterSpacing:'0.5px'}}>Watchlist</div>
          {WATCH.map(sym=>{
            const sq = stocks[sym]||indices[sym]
            const up = (sq?.changePct||0)>=0
            return (
              <div key={sym} onClick={()=>setSel(sym)} style={{display:'flex',justifyContent:'space-between',padding:'11px 14px',borderBottom:`1px solid ${C.gray100}`,cursor:'pointer',background:sel===sym?C.blueBg:'transparent',borderLeft:sel===sym?`3px solid ${C.blue}`:'3px solid transparent',transition:'all .12s'}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:C.gray800}}>{SYMBOL_LABELS[sym]||sym}</div>
                  <div style={{fontSize:10,color:C.gray400}}>{sym.includes('NIFTY')||sym==='INDIA VIX'?'INDEX':'NSE'}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:12,fontFamily:'monospace',fontWeight:600,color:C.gray800}}>{sq?f2(sq.price):'—'}</div>
                  {sq&&<div style={{fontSize:10,fontWeight:700,color:up?C.green:C.red}}>{up?'+':''}{sq.changePct.toFixed(2)}%</div>}
                </div>
              </div>
            )
          })}
        </div>
        {/* Order form */}
        <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20}}>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:16,fontWeight:800,color:C.gray800}}>{SYMBOL_LABELS[sel]||sel}</div>
            <div style={{fontSize:24,fontWeight:900,fontFamily:'monospace',color:q?.changePct>=0?C.green:q?C.red:C.gray800,marginTop:2}}>{ltp>0?f2(ltp):'—'}{q&&<span style={{fontSize:13,marginLeft:8}}>{q.changePct>=0?'+':''}{q.changePct.toFixed(2)}%</span>}</div>
            {q&&<div style={{fontSize:11,color:C.gray400,fontFamily:'monospace',marginTop:2}}>O:{f2(q.open)} H:{f2(q.high)} L:{f2(q.low)} PC:{f2(q.prevClose)}</div>}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
            <button onClick={()=>setSide('BUY')} style={{padding:10,borderRadius:8,fontWeight:700,fontSize:13,border:'none',cursor:'pointer',background:side==='BUY'?C.green:C.greenBg,color:side==='BUY'?'#fff':C.greenDark,transition:'all .15s'}}>▲ BUY</button>
            <button onClick={()=>setSide('SELL')} style={{padding:10,borderRadius:8,fontWeight:700,fontSize:13,border:'none',cursor:'pointer',background:side==='SELL'?C.red:C.redBg,color:side==='SELL'?'#fff':C.redDark,transition:'all .15s'}}>▼ SELL</button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div><label style={{fontSize:11,fontWeight:700,color:C.gray400,textTransform:'uppercase',display:'block',marginBottom:4}}>Order Type</label>
              <select value={type} onChange={e=>setType(e.target.value)} style={iStyle}>{['MARKET','LIMIT','STOP_LOSS','GTT'].map(t=><option key={t}>{t}</option>)}</select></div>
            <div><label style={{fontSize:11,fontWeight:700,color:C.gray400,textTransform:'uppercase',display:'block',marginBottom:4}}>Quantity</label>
              <input type="number" min={1} value={qty} onChange={e=>setQty(Number(e.target.value))} style={iStyle}/></div>
            {type!=='MARKET'&&<div><label style={{fontSize:11,fontWeight:700,color:C.gray400,textTransform:'uppercase',display:'block',marginBottom:4}}>Price (₹)</label>
              <input type="number" step="0.05" value={price} onChange={e=>setPrice(Number(e.target.value))} style={iStyle}/></div>}
          </div>
          <div style={{marginTop:12,padding:'10px 12px',borderRadius:8,background:C.gray50,border:`1px solid ${C.gray200}`,fontSize:12,display:'flex',justifyContent:'space-between',color:C.gray600}}>
            <span>Order value</span><span style={{fontWeight:700,fontFamily:'monospace',color:C.gray800}}>{fR(orderVal)}</span>
          </div>
          <button onClick={placeOrder} disabled={placing} style={{width:'100%',marginTop:12,padding:'12px',borderRadius:8,fontWeight:700,fontSize:14,border:'none',cursor:placing?'not-allowed':'pointer',background:side==='BUY'?C.green:C.red,color:'#fff',opacity:placing?.6:1,transition:'all .15s'}}>
            {placing?'Placing…':`Place ${side} Order`}
          </button>
          {toast&&<div style={{marginTop:10,padding:'9px 12px',borderRadius:8,background:toast.ok?C.greenBg:C.redBg,color:toast.ok?C.greenDark:C.redDark,fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
            {toast.ok?<CheckCircle2 size={13}/>:<AlertTriangle size={13}/>}{toast.msg}
          </div>}
        </div>
        {/* Order book */}
        <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.gray100}`,fontSize:13,fontWeight:700,color:C.gray800}}>Order Book</div>
          {trades.length===0?<div style={{padding:40,textAlign:'center',color:C.gray400,fontSize:13}}>No orders yet. Place your first trade.</div>
          :<table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead><tr style={{background:C.gray50,color:C.gray400,textTransform:'uppercase',fontSize:10,letterSpacing:'0.4px'}}>
              {['Symbol','Side','Qty','Price','Status'].map(h=><th key={h} style={{padding:'9px 14px',fontWeight:600,textAlign:h==='Symbol'?'left':'right'}}>{h}</th>)}
            </tr></thead>
            <tbody>{trades.slice(0,10).map(t=>(
              <tr key={t.id} style={{borderBottom:`1px solid ${C.gray100}`}}
                onMouseEnter={e=>e.currentTarget.style.background=C.gray50} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{padding:'10px 14px',fontWeight:700,color:C.gray800,fontFamily:'monospace'}}>{t.symbol}</td>
                <td style={{padding:'8px 14px',textAlign:'right'}}><span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:9,background:t.side==='BUY'?C.greenBg:C.redBg,color:t.side==='BUY'?C.greenDark:C.redDark}}>{t.side}</span></td>
                <td style={{padding:'8px 14px',textAlign:'right',fontFamily:'monospace'}}>{t.quantity}</td>
                <td style={{padding:'8px 14px',textAlign:'right',fontFamily:'monospace'}}>{f2(t.executedPrice||t.price||0)}</td>
                <td style={{padding:'8px 14px',textAlign:'right'}}><span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:9,background:{COMPLETE:C.greenBg,PENDING:C.amberBg,CANCELLED:C.gray100,REJECTED:C.redBg}[t.status]||C.gray100,color:{COMPLETE:C.greenDark,PENDING:C.amber,CANCELLED:C.gray400,REJECTED:C.redDark}[t.status]||C.gray400}}>{t.status}</span></td>
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
  const { user } = useSelector(s=>s.auth)
  useEffect(()=>{loadTrades()},[])
  const pnl = trades.reduce((s,t)=>s+(t.pnl||0),0)
  const done = trades.filter(t=>t.status==='COMPLETE').length
  return (
    <div style={{maxWidth:1280,margin:'0 auto',padding:'24px 20px'}}>
      <h1 style={{fontSize:22,fontWeight:800,color:C.gray800,marginBottom:4}}>Portfolio</h1>
      <p style={{fontSize:13,color:C.gray400,marginBottom:20}}>Real-time P&amp;L · {user?.email}</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:20}}>
        {[['Total Orders',trades.length,null],['Completed',done,true],['Realised P&L',`${pnl>=0?'+':''}${fR0(Math.abs(pnl))}`,pnl>=0],['KYC',user?.kycStatus||'PENDING',user?.kycStatus==='VERIFIED']].map(([l,v,up])=>(
          <div key={l} style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:'16px 18px'}}>
            <div style={{fontSize:11,fontWeight:600,color:C.gray400,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>{l}</div>
            <div style={{fontSize:20,fontWeight:800,color:up===null?C.gray800:up?C.green:C.red,fontFamily:'monospace'}}>{String(v)}</div>
          </div>
        ))}
      </div>
      <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,overflow:'hidden'}}>
        <div style={{padding:'13px 18px',borderBottom:`1px solid ${C.gray100}`,fontSize:13,fontWeight:700,color:C.gray800}}>Trade History ({trades.length})</div>
        {loading?<div style={{padding:40,textAlign:'center',color:C.gray400}}>Loading…</div>
        :trades.length===0?<div style={{padding:40,textAlign:'center'}}>
          <ClipboardList size={32} color={C.gray200} style={{margin:'0 auto 12px',display:'block'}}/>
          <p style={{fontSize:13,color:C.gray400}}>No trades yet. Use the Trading Terminal to place your first order.</p>
        </div>
        :<div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:600}}>
            <thead><tr style={{background:C.gray50,color:C.gray400,textTransform:'uppercase',fontSize:10,letterSpacing:'0.4px'}}>
              {['Symbol','Exchange','Side','Type','Qty','Price','P&L','Status'].map((h,i)=><th key={h} style={{padding:'9px 14px',fontWeight:600,textAlign:i<=1?'left':'right'}}>{h}</th>)}
            </tr></thead>
            <tbody>{trades.map(t=>(
              <tr key={t.id} style={{borderBottom:`1px solid ${C.gray100}`}}
                onMouseEnter={e=>e.currentTarget.style.background=C.gray50} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{padding:'11px 14px',fontWeight:700,fontFamily:'monospace',color:C.gray800}}>{t.symbol}</td>
                <td style={{padding:'9px 14px',fontSize:11,color:C.gray400}}>{t.exchange}</td>
                <td style={{padding:'9px 14px',textAlign:'right'}}><span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:9,background:t.side==='BUY'?C.greenBg:C.redBg,color:t.side==='BUY'?C.greenDark:C.redDark}}>{t.side}</span></td>
                <td style={{padding:'9px 14px',textAlign:'right',fontSize:11,color:C.gray400}}>{t.orderType?.replace('_',' ')}</td>
                <td style={{padding:'9px 14px',textAlign:'right',fontFamily:'monospace'}}>{t.quantity}</td>
                <td style={{padding:'9px 14px',textAlign:'right',fontFamily:'monospace'}}>{fR(t.executedPrice||t.price||0)}</td>
                <td style={{padding:'9px 14px',textAlign:'right',fontFamily:'monospace',fontWeight:700,color:(t.pnl||0)>=0?C.green:C.red}}>{(t.pnl||0)===0?'—':`${(t.pnl||0)>=0?'+':''}${fR0(Math.abs(t.pnl||0))}`}</td>
                <td style={{padding:'9px 14px',textAlign:'right'}}><span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:9,background:{COMPLETE:C.greenBg,PENDING:C.amberBg,CANCELLED:C.gray100,REJECTED:C.redBg}[t.status]||C.gray100,color:{COMPLETE:C.greenDark,PENDING:C.amber,CANCELLED:C.gray400,REJECTED:C.redDark}[t.status]||C.gray400}}>{t.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>}
      </div>
    </div>
  )
}

/* ════════ MUTUAL FUNDS ════════ */
function MutualFunds() {
  const [search, setSearch] = useState('')
  const [mfList, setMfList] = useState([])
  const [navs, setNavs] = useState({})
  const [selected, setSelected] = useState(null)
  const CODES = [118825,120465,119598,120505,118989,120503,120716,125354,120828,120847,100119]
  useEffect(()=>{
    fetch('https://api.mfapi.in/mf').then(r=>r.json()).then(setMfList).catch(()=>{})
    CODES.forEach(code=>{
      fetch(`https://api.mfapi.in/mf/${code}`).then(r=>r.json()).then(j=>{
        setNavs(prev=>({...prev,[code]:{name:j.meta?.scheme_name||'',nav:parseFloat(j.data?.[0]?.nav||0),date:j.data?.[0]?.date||'',house:j.meta?.fund_house||''}}))
      }).catch(()=>{})
    })
  },[])
  const results = search ? mfList.filter(s=>s.schemeName?.toLowerCase().includes(search.toLowerCase())).slice(0,20) : []
  return (
    <div style={{maxWidth:1280,margin:'0 auto',padding:'24px 20px'}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:22,fontWeight:800,color:C.gray800,marginBottom:4}}>Mutual Funds</h1>
        <p style={{fontSize:13,color:C.gray400}}>Direct plans · ₹0 commission · AMFI NAV data</p>
      </div>
      <div style={{position:'relative',marginBottom:20}}>
        <Search size={15} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:C.gray400}}/>
        <input value={search} onChange={e=>{setSearch(e.target.value);setSelected(null)}} placeholder={`Search ${mfList.length.toLocaleString('en-IN')} mutual fund schemes…`}
          style={{width:'100%',padding:'11px 12px 11px 38px',borderRadius:10,border:`1.5px solid ${C.gray200}`,fontSize:14,color:C.gray800,outline:'none',boxSizing:'border-box'}}
          onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.gray200}/>
        {results.length>0&&!selected&&<div style={{position:'absolute',top:'100%',left:0,right:0,background:C.white,border:`1px solid ${C.gray200}`,borderRadius:10,zIndex:20,maxHeight:300,overflowY:'auto',boxShadow:'0 8px 24px rgba(0,0,0,0.12)',marginTop:4}}>
          {results.map(s=><div key={s.schemeCode} onClick={async()=>{
            setSearch(s.schemeName); setSelected(null)
            const j=await fetch(`https://api.mfapi.in/mf/${s.schemeCode}`).then(r=>r.json())
            setSelected({code:s.schemeCode,name:j.meta?.scheme_name||s.schemeName,nav:parseFloat(j.data?.[0]?.nav||0),date:j.data?.[0]?.date||'',house:j.meta?.fund_house||'',cat:j.meta?.scheme_category||'',history:j.data?.slice(0,30)||[]})
          }} style={{padding:'11px 16px',borderBottom:`1px solid ${C.gray100}`,cursor:'pointer',fontSize:13,color:C.gray800,display:'flex',justifyContent:'space-between',alignItems:'center'}}
            onMouseEnter={e=>e.currentTarget.style.background=C.gray50} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <span>{s.schemeName}</span><ChevronRight size={13} color={C.gray400}/>
          </div>)}
        </div>}
      </div>
      {selected&&<div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20,marginBottom:20}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
          <div><h3 style={{fontSize:15,fontWeight:800,color:C.gray800,marginBottom:4}}>{selected.name}</h3>
            <div style={{fontSize:12,color:C.gray400}}>{selected.house} · {selected.cat}</div></div>
          <button onClick={()=>{setSelected(null);setSearch('')}} style={{background:'none',border:'none',cursor:'pointer',color:C.gray400}}><X size={18}/></button>
        </div>
        <div style={{fontSize:28,fontWeight:900,fontFamily:'monospace',color:C.gray800}}>₹{selected.nav.toFixed(4)}<span style={{fontSize:12,color:C.gray400,marginLeft:8,fontFamily:'inherit',fontWeight:400}}>NAV as of {selected.date}</span></div>
        <div style={{marginTop:12,maxHeight:200,overflowY:'auto',border:`1px solid ${C.gray200}`,borderRadius:8}}>
          {selected.history.map((h,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 14px',borderBottom:`1px solid ${C.gray100}`,fontSize:12}}><span style={{color:C.gray400}}>{h.date}</span><span style={{fontFamily:'monospace',fontWeight:600,color:C.gray800}}>₹{parseFloat(h.nav).toFixed(4)}</span></div>)}
        </div>
        <button style={{marginTop:12,padding:'10px 24px',borderRadius:8,background:C.green,color:'#fff',fontWeight:700,fontSize:13,border:'none',cursor:'pointer'}}>Invest Now →</button>
      </div>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
        {CODES.map(code=>{
          const n=navs[code]
          return <div key={code} style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:18,cursor:'pointer',transition:'all .2s'}}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)';e.currentTarget.style.transform='translateY(-2px)'}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none'}}>
            {n?<>
              <div style={{fontSize:10,color:C.gray400,fontWeight:600,textTransform:'uppercase',marginBottom:6}}>{n.house}</div>
              <h3 style={{fontSize:13,fontWeight:700,color:C.gray800,marginBottom:8,lineHeight:1.4}}>{n.name}</h3>
              <div style={{fontSize:22,fontWeight:900,fontFamily:'monospace',color:C.gray800}}>₹{n.nav.toFixed(4)}</div>
              <div style={{fontSize:11,color:C.gray400,marginTop:2}}>NAV as of {n.date}</div>
              <button style={{marginTop:12,width:'100%',padding:'8px',borderRadius:8,background:C.greenBg,color:C.greenDark,fontWeight:700,fontSize:12,border:`1px solid ${C.green}30`,cursor:'pointer'}}>Invest</button>
            </>:<div style={{height:100,display:'flex',alignItems:'center',justifyContent:'center',color:C.gray400,fontSize:12}}>Loading NAV…</div>}
          </div>
        })}
      </div>
    </div>
  )
}

/* ════════ WATCHLIST ════════ */
function Watchlist({ setPage }) {
  const { indices, stocks, gainers, loading } = useMarketData()
  const SYMS = ['NIFTY 50','NIFTY BANK','INDIA VIX','RELIANCE','TCS','HDFCBANK','INFY','ITC','WIPRO','SBIN','BHARTIARTL','BAJFINANCE','ADANIENT']
  return (
    <div style={{maxWidth:1280,margin:'0 auto',padding:'24px 20px'}}>
      <h1 style={{fontSize:22,fontWeight:800,color:C.gray800,marginBottom:4}}>Watchlist</h1>
      <p style={{fontSize:13,color:C.gray400,marginBottom:20}}>Live NSE prices · Auto-refresh every 6 seconds</p>
      <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 1fr',padding:'10px 18px',background:C.gray50,borderBottom:`1px solid ${C.gray200}`,fontSize:11,fontWeight:700,color:C.gray400,textTransform:'uppercase',letterSpacing:'0.5px'}}>
          <span>Symbol</span><span style={{textAlign:'right'}}>LTP</span><span style={{textAlign:'right'}}>Change</span><span style={{textAlign:'right'}}>High</span><span style={{textAlign:'right'}}>Low</span><span style={{textAlign:'right'}}>Volume</span>
        </div>
        {SYMS.map(sym=>{
          const q=stocks[sym]||indices[sym]
          const up=(q?.changePct||0)>=0
          return <div key={sym} style={{display:'grid',gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 1fr',padding:'13px 18px',borderBottom:`1px solid ${C.gray100}`,alignItems:'center',transition:'background .12s',cursor:'pointer'}}
            onMouseEnter={e=>e.currentTarget.style.background=C.gray50} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div><div style={{fontSize:13,fontWeight:700,color:C.gray800}}>{SYMBOL_LABELS[sym]||sym}</div><div style={{fontSize:10,color:C.gray400,fontFamily:'monospace'}}>{sym}</div></div>
            <div style={{textAlign:'right',fontFamily:'monospace',fontSize:13,fontWeight:700,color:C.gray800}}>{q?f2(q.price):'—'}</div>
            <div style={{textAlign:'right'}}>{q&&<span style={{fontSize:11,fontWeight:700,color:up?C.green:C.red,background:up?C.greenBg:C.redBg,padding:'2px 8px',borderRadius:10}}>{up?'▲':'▼'}{Math.abs(q.changePct||0).toFixed(2)}%</span>}</div>
            <div style={{textAlign:'right',fontFamily:'monospace',fontSize:12,color:C.greenDark}}>{q?.high?f2(q.high):'—'}</div>
            <div style={{textAlign:'right',fontFamily:'monospace',fontSize:12,color:C.redDark}}>{q?.low?f2(q.low):'—'}</div>
            <div style={{textAlign:'right',fontFamily:'monospace',fontSize:12,color:C.gray400}}>{q?.volume?fVol(q.volume):'—'}</div>
          </div>
        })}
        {loading&&<div style={{padding:'16px 18px',textAlign:'center',fontSize:12,color:C.gray400}}>Updating live prices…</div>}
      </div>
    </div>
  )
}

/* ════════ GLOSSARY ════════ */
function GlossaryPage() {
  const [q, setQ] = useState('')
  const filtered = GLOSSARY.filter(t=>!q||t.term.toLowerCase().includes(q.toLowerCase())||t.full.toLowerCase().includes(q.toLowerCase())||t.def.toLowerCase().includes(q.toLowerCase()))
  return (
    <div style={{maxWidth:860,margin:'0 auto',padding:'24px 20px'}}>
      <h1 style={{fontSize:22,fontWeight:800,color:C.gray800,marginBottom:4}}>Financial Glossary</h1>
      <p style={{fontSize:13,color:C.gray400,marginBottom:20}}>20+ key terms used in Indian capital markets</p>
      <div style={{position:'relative',marginBottom:20}}>
        <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:C.gray400}}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search SEBI, LTCG, VIX…"
          style={{width:'100%',padding:'10px 12px 10px 36px',borderRadius:8,border:`1.5px solid ${C.gray200}`,fontSize:13,color:C.gray800,outline:'none',boxSizing:'border-box'}}/>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {filtered.map(t=>(
          <div key={t.term} style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:'16px 18px',display:'flex',gap:16,alignItems:'flex-start'}}>
            <div style={{flexShrink:0,minWidth:72,padding:'5px 10px',borderRadius:8,background:C.navy,color:'#fff',fontFamily:'monospace',fontSize:13,fontWeight:700,textAlign:'center'}}>{t.term}</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:C.gray800,marginBottom:3}}>{t.full}</div>
              <p style={{fontSize:13,color:C.gray400,lineHeight:1.6}}>{t.def}</p>
            </div>
          </div>
        ))}
        {filtered.length===0&&<div style={{padding:40,textAlign:'center',color:C.gray400}}>No results for "{q}"</div>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   APP SHELL
════════════════════════════════════════════════════════ */
function AppShell() {
  const dispatch = useDispatch()
  const { token, user } = useSelector(s=>s.auth)
  const [page, setPage] = useState('home')
  const { indices, gainers, losers, loading, lastUpdated } = useMarketData()

  // Redirect after login
  useEffect(()=>{
    if (token && user) {
      if (['home','login','register'].includes(page)) setPage('dashboard')
    }
  },[token, user])

  const auth = token && user ? { name: user.name?.split(' ')[0]||'User', role:'CLIENT' } : null
  const onLogout = () => { dispatch(logoutUser()); setPage('home') }

  const renderPage = () => {
    switch(page) {
      case 'login':     return <Login setPage={setPage}/>
      case 'register':  return <Register setPage={setPage}/>
      case 'markets':   return <Markets setPage={setPage}/>
      case 'screener':  return <Screener/>
      case 'mf':        return <MutualFunds/>
      case 'watchlist': return auth ? <Watchlist setPage={setPage}/> : <Login setPage={setPage}/>
      case 'glossary':  return <GlossaryPage/>
      case 'dashboard': return auth ? <Dashboard auth={auth} setPage={setPage}/> : <Login setPage={setPage}/>
      case 'trade':     return auth ? <TradePage/> : <Login setPage={setPage}/>
      case 'portfolio': return auth ? <Portfolio/> : <Login setPage={setPage}/>
      default:          return <Home setPage={setPage} indices={indices} gainers={gainers} losers={losers}/>
    }
  }

  return (
    <div style={{fontFamily:"Inter,-apple-system,BlinkMacSystemFont,sans-serif",minHeight:'100vh',background:C.gray50,display:'flex',flexDirection:'column'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Inter, sans-serif; }
        button { font-family: inherit; }
        input, select { font-family: inherit; }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:4px; }
      `}</style>
      <TopNav auth={auth} page={page} setPage={setPage} onLogout={onLogout}/>
      <MarketStrip indices={indices} loading={loading}/>
      <main style={{flex:1}}>{renderPage()}</main>
      <TickerTape gainers={gainers} losers={losers}/>
      <footer style={{background:C.navy,color:'rgba(255,255,255,0.5)',fontSize:12,padding:'16px 20px',textAlign:'center'}}>
        © 2026 TradePro · SEBI-registered · NSE &amp; BSE · T+1 Settlement · ₹0 equity delivery
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

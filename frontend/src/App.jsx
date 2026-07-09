import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Provider, useSelector, useDispatch } from 'react-redux'
import { store } from './store'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Wallet, ShieldCheck,
  LineChart as LineChartIcon, FileText, Users, Bell, LogOut,
  ChevronRight, Search, X, CheckCircle2, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Gauge, ClipboardList,
  Lock, Eye, EyeOff, BarChart3, Sparkles, BookOpen,
  Home, Activity, Menu, ChevronDown,
} from 'lucide-react'
import { loginUser, logoutUser, registerUser } from './store/slices/authSlice'
import { useTrades, useMarketData } from './hooks'
import { SYMBOL_LABELS, INDEX_KEYS } from './services/marketData'
import './assets/styles/global.css'

/* ── helpers ── */
const fmt  = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmt0 = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
const fmtN = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtVol = (n) => !n ? '—' : n >= 1e7 ? `${(n/1e7).toFixed(2)}Cr` : n >= 1e5 ? `${(n/1e5).toFixed(2)}L` : n.toLocaleString('en-IN')
const fmtTime = (ts) => ts ? new Date(ts).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' }) : '--'

/* ── static data ── */
const PERF = [{d:'Jan',v:412000},{d:'Feb',v:428500},{d:'Mar',v:419300},{d:'Apr',v:447800},{d:'May',v:462100},{d:'Jun',v:455900},{d:'Jul',v:481260}]
const HOLDINGS = [
  { symbol:'RELIANCE',   name:'Reliance Industries',       qty:50,  avgCost:2450.30, sector:'Energy'  },
  { symbol:'TCS',        name:'Tata Consultancy Services', qty:30,  avgCost:3550.00, sector:'IT'      },
  { symbol:'HDFCBANK',   name:'HDFC Bank',                 qty:80,  avgCost:1520.10, sector:'Banking' },
  { symbol:'INFY',       name:'Infosys',                   qty:60,  avgCost:1410.00, sector:'IT'      },
  { symbol:'ITC',        name:'ITC Limited',               qty:200, avgCost:410.25,  sector:'FMCG'    },
  { symbol:'BHARTIARTL', name:'Bharti Airtel',             qty:40,  avgCost:980.00,  sector:'Telecom' },
]
const SECTOR_COLORS = { Energy:'#d97706', IT:'#16a34a', Banking:'#0f2040', FMCG:'#15803d', Telecom:'#1a3a70' }
const ROLES = [
  { id:'CLIENT',     label:'Client',              desc:'Trade & track portfolio'          },
  { id:'DEALER',     label:'Dealer / Broker',      desc:'Execute client orders'            },
  { id:'ANALYST',    label:'Research Analyst',     desc:'Publish research reports'         },
  { id:'COMPLIANCE', label:'Compliance Officer',   desc:'Regulatory filings'               },
  { id:'RISK',       label:'Risk Manager',         desc:'Margin & risk monitoring'         },
  { id:'ADMIN',      label:'System Administrator', desc:'Full platform access'             },
]
const NAV_BY_ROLE = {
  CLIENT:     ['dashboard','trade','portfolio','research','margin','glossary'],
  DEALER:     ['dashboard','trade','portfolio','margin','glossary'],
  ANALYST:    ['dashboard','research','glossary'],
  COMPLIANCE: ['dashboard','compliance','margin','glossary'],
  RISK:       ['dashboard','margin','compliance','glossary'],
  ADMIN:      ['dashboard','trade','portfolio','research','margin','compliance','glossary'],
}
const NAV_META = {
  dashboard:  { label:'Dashboard',        icon:Home           },
  trade:      { label:'Trading Terminal', icon:Activity       },
  portfolio:  { label:'Portfolio',        icon:Wallet         },
  research:   { label:'Research',         icon:FileText       },
  margin:     { label:'Margin & Risk',    icon:Gauge          },
  compliance: { label:'Compliance',       icon:ShieldCheck    },
  glossary:   { label:'Glossary',         icon:BookOpen       },
}
const ORDER_SEED = [
  { id:'ORD10231', symbol:'RELIANCE', type:'LIMIT',     side:'BUY',  qty:25, price:2605.00, status:'EXECUTED', time:'09:21' },
  { id:'ORD10238', symbol:'TCS',      type:'MARKET',    side:'SELL', qty:10, price:3818.20, status:'EXECUTED', time:'10:04' },
  { id:'ORD10244', symbol:'INFY',     type:'STOP_LOSS', side:'BUY',  qty:40, price:1548.00, status:'PENDING',  time:'11:12' },
]
const RESEARCH = [
  { id:1, symbol:'TCS',      rating:'BUY',       target:4250, cmp:3820.45, analyst:'R. Menon', thesis:'Deal wins in BFSI and AI-led margin expansion support re-rating.' },
  { id:2, symbol:'RELIANCE', rating:'ACCUMULATE', target:2850, cmp:2612.75, analyst:'P. Iyer',  thesis:'Retail and Jio platforms scaling; refining margins normalising.' },
  { id:3, symbol:'HDFCBANK', rating:'BUY',        target:1720, cmp:1489.60, analyst:'S. Rao',   thesis:'Deposit growth catching up post-merger; credit costs normalising.' },
  { id:4, symbol:'ITC',      rating:'HOLD',       target:460,  cmp:432.10,  analyst:'K. Nair',  thesis:'Cigarette volume steady; FMCG-others still sub-scale.' },
]
const LEDGER = [
  { date:'05 Jul', narration:'Sale proceeds — RELIANCE',   debit:0,      credit:65137.5, balance:182430 },
  { date:'04 Jul', narration:'Brokerage + GST — TCS',      debit:156.20, credit:0,       balance:117292 },
  { date:'03 Jul', narration:'Fund transfer — UPI',         debit:0,      credit:50000,   balance:117448 },
  { date:'01 Jul', narration:'Dividend credit — ITC',       debit:0,      credit:2400,    balance:67448  },
]
const GLOSSARY_TERMS = [
  { term:'SEBI',   full:'Securities and Exchange Board of India',     def:"India's primary capital-market regulator. Oversees exchanges, brokers, mutual funds and listed companies." },
  { term:'NSE',    full:'National Stock Exchange of India',           def:"India's largest stock exchange by trading volume. Home of the NIFTY 50 benchmark index." },
  { term:'BSE',    full:'Bombay Stock Exchange',                      def:"Asia's oldest stock exchange (est. 1875). Home of the S&P BSE SENSEX." },
  { term:'DEMAT',  full:'Dematerialised Securities Account',          def:'An electronic account holding shares digitally. Mandatory for trading in India since 1996.' },
  { term:'P&L',    full:'Profit and Loss',                            def:'Net financial result of trading. Unrealised P&L = open positions; Realised P&L = closed trades.' },
  { term:'LTCG',   full:'Long-Term Capital Gains',                    def:'Profit from equity held >12 months. Taxed at 10% on gains exceeding ₹1 lakh per FY.' },
  { term:'STCG',   full:'Short-Term Capital Gains',                   def:'Profit from equity held ≤12 months. Taxed at 15% under Section 111A.' },
  { term:'MTM',    full:'Mark-to-Market Valuation',                   def:'Daily revaluation of positions at current market prices. Futures are MTM settled daily by exchanges.' },
  { term:'DP',     full:'Depository Participant',                     def:'Intermediary (bank/broker) registered with CDSL or NSDL providing DEMAT account services.' },
  { term:'CDSL',   full:'Central Depository Services Limited',        def:"BSE-promoted depository holding securities electronically via DP accounts." },
  { term:'NSDL',   full:'National Securities Depository Limited',     def:"India's first and largest depository (NSE-promoted). Facilitates electronic settlement." },
  { term:'XIRR',   full:'Extended Internal Rate of Return',           def:'Annualised return for irregular cash flows (SIPs, partial redemptions). More accurate than CAGR.' },
  { term:'F&O',    full:'Futures & Options',                          def:'Derivatives. Futures obligate a transaction at a future date; Options grant the right (not obligation).' },
  { term:'SIP',    full:'Systematic Investment Plan',                 def:'Invest a fixed amount in a mutual fund at regular intervals. Leverages rupee-cost averaging.' },
  { term:'NAV',    full:'Net Asset Value',                            def:'Price per mutual fund unit = (total assets − liabilities) ÷ units outstanding. Published daily by AMCs.' },
  { term:'VIX',    full:'Volatility Index (India VIX)',               def:'NSE measure of near-term volatility from NIFTY options. VIX > 20 = elevated uncertainty.' },
  { term:'STT',    full:'Securities Transaction Tax',                 def:'Tax on equity transactions: 0.1% on buy+sell (delivery), 0.025% intraday sell.' },
  { term:'GTT',    full:'Good Till Triggered',                        def:'Conditional order active until trigger price is hit — useful for preset entry/exit levels.' },
  { term:'T+1',    full:'Trade Plus One Settlement',                  def:'India moved to T+1 in 2023. Shares credited and funds settled by the next trading day.' },
  { term:'AMFI',   full:'Association of Mutual Funds in India',       def:'Self-regulatory body for mutual funds. Publishes daily NAVs and regulates AMC conduct.' },
]

/* ═══════════════════════════════════════════════════
   TICKER TAPE
═══════════════════════════════════════════════════ */
function TickerTape() {
  const indices = useSelector((s) => s.market?.indices || {})
  const stocks  = useSelector((s) => s.market?.stocks  || {})
  const SYMS = ['NIFTY 50','NIFTY BANK','INDIA VIX','RELIANCE','TCS','HDFCBANK','INFY','ITC','BHARTIARTL','WIPRO','SBIN']
  const items = [...SYMS, ...SYMS].map(sym => {
    const q = indices[sym] || stocks[sym]
    return { sym: SYMBOL_LABELS[sym] || sym, price: q?.price || 0, chg: q?.changePct || 0 }
  })
  return (
    <div className="overflow-hidden border-b border-gray-100 bg-navy-600/5 backdrop-blur-sm">
      <div className="flex whitespace-nowrap py-2 animate-marquee">
        {items.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-5 border-r border-gray-200 shrink-0">
            <span className="font-mono text-xs font-semibold text-navy-600">{it.sym}</span>
            <span className="font-mono text-xs tabular-nums text-gray-800">{it.price > 0 ? fmtN(it.price) : '—'}</span>
            {it.price > 0 && (
              <span className={`font-mono text-xs font-bold tabular-nums flex items-center gap-0.5 ${it.chg >= 0 ? 'text-bull' : 'text-bear'}`}>
                {it.chg >= 0 ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}
                {Math.abs(it.chg).toFixed(2)}%
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   NAV BAR
═══════════════════════════════════════════════════ */
function NavBar({ auth, page, setPage, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between px-6 py-3 gap-4">
        {/* Brand */}
        <button onClick={() => setPage(auth ? 'dashboard' : 'landing')} className="flex items-center gap-2.5 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-navy-600 to-navy-400 flex items-center justify-center shadow-navy">
            <TrendingUp size={18} className="text-white"/>
          </div>
          <div className="hidden sm:block">
            <div className="font-display font-bold text-navy-700 text-lg leading-none">TradePro</div>
            <div className="text-[10px] text-gray-400 font-mono">NSE · BSE · SEBI</div>
          </div>
        </button>

        {/* Desktop nav */}
        {auth ? (
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_BY_ROLE[auth.role]?.map(k => {
              const Icon = NAV_META[k].icon
              const active = page === k
              return (
                <button key={k} onClick={() => setPage(k)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-navy-600 text-white shadow-navy'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-navy-700'
                  }`}>
                  <Icon size={14}/>{NAV_META[k].label}
                </button>
              )
            })}
          </nav>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <span className="h-1.5 w-1.5 rounded-full bg-bull animate-pulse-dot"/>
            NSE &amp; BSE live data
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {auth ? (
            <>
              <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                <Bell size={17}/>
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-bear"/>
              </button>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-navy-500 to-bull flex items-center justify-center text-white text-xs font-bold">
                  {auth.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-semibold text-gray-800">{auth.name}</div>
                  <div className="text-[10px] text-gray-400">{ROLES.find(r=>r.id===auth.role)?.label}</div>
                </div>
              </div>
              <button onClick={onLogout} className="p-2 rounded-lg text-gray-500 hover:bg-bear-dim hover:text-bear transition-colors">
                <LogOut size={16}/>
              </button>
              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                <Menu size={18}/>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setPage('login')} className="text-sm font-medium text-gray-600 hover:text-navy-700 px-3 py-2">Sign in</button>
              <button onClick={() => setPage('register')} className="px-4 py-2 rounded-lg bg-navy-600 text-white text-sm font-semibold hover:bg-navy-700 shadow-navy transition-all">
                Open Account
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && auth && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-2 flex flex-wrap gap-1">
          {NAV_BY_ROLE[auth.role]?.map(k => (
            <button key={k} onClick={() => { setPage(k); setMobileOpen(false) }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${page===k ? 'bg-navy-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {NAV_META[k].label}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}

function Footer() {
  return (
    <footer className="bg-navy-700 text-white py-8 mt-auto">
      <div className="max-w-screen-2xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
            <TrendingUp size={16} className="text-bull-light"/>
          </div>
          <div>
            <div className="font-display font-bold text-sm">TradePro</div>
            <div className="text-xs text-white/50">SEBI-registered · NSE &amp; BSE</div>
          </div>
        </div>
        <div className="text-xs text-white/40 text-center">
          © 2026 TradePro — Stock Brokerage &amp; Portfolio Management. All rights reserved.
        </div>
        <div className="flex gap-4 text-xs text-white/50">
          <span className="hover:text-white cursor-pointer">Privacy</span>
          <span className="hover:text-white cursor-pointer">Terms</span>
          <span className="hover:text-white cursor-pointer">SEBI Charter</span>
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════
   LANDING PAGE — stunning bull-bear hero
═══════════════════════════════════════════════════ */
function Landing({ setPage }) {
  const indices = useSelector((s) => s.market?.indices || {})
  const nifty   = indices['NIFTY 50']
  const bank    = indices['NIFTY BANK']
  const vix     = indices['INDIA VIX']

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy-50 via-white to-bull-dim opacity-60 pointer-events-none"/>
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-bull/5 blur-3xl pointer-events-none"/>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-bear/5 blur-3xl pointer-events-none"/>

        <div className="relative max-w-screen-xl mx-auto px-6 pt-16 pb-12 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left copy */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bull-dim border border-bull/20 text-bull-dark text-xs font-bold mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-bull animate-pulse-dot"/>
              NSE &amp; BSE Live · SEBI Registered
            </div>

            <h1 className="font-display text-5xl sm:text-6xl font-bold leading-[1.05] tracking-tight text-navy-700 mb-6">
              Trade with the
              <span className="text-bull"> Bulls</span>.
              <br/>Survive the
              <span className="text-bear"> Bears</span>.
            </h1>

            <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-xl">
              A professional brokerage terminal with real-time NSE/BSE data, institutional-grade order execution, SEBI-compliant reporting and portfolio analytics.
            </p>

            {/* Live index pills */}
            <div className="flex flex-wrap gap-3 mb-8">
              {[
                { label:'NIFTY 50', data:nifty },
                { label:'BANK NIFTY', data:bank },
                { label:'INDIA VIX', data:vix },
              ].map(({ label, data }) => (
                <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-card">
                  <span className="text-xs font-semibold text-gray-500">{label}</span>
                  <span className="font-mono text-sm font-bold text-navy-700">{data ? fmtN(data.price) : '—'}</span>
                  {data && (
                    <span className={`font-mono text-xs font-bold ${data.changePct >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {data.changePct >= 0 ? '▲' : '▼'}{Math.abs(data.changePct).toFixed(2)}%
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => setPage('register')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-navy-600 text-white font-semibold hover:bg-navy-700 shadow-navy transition-all hover:scale-105">
                Open Free Account <ChevronRight size={16}/>
              </button>
              <button onClick={() => setPage('login')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-navy-200 text-navy-700 font-semibold hover:border-navy-400 transition-all">
                Sign In
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-10 pt-10 border-t border-gray-100">
              {[['₹2,840 Cr+','daily turnover'],['4.1L+','active clients'],['<80ms','order routing']].map(([n,l]) => (
                <div key={l}>
                  <div className="font-mono text-xl font-bold text-navy-700">{n}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — bull-bear image */}
          <div className="relative flex items-center justify-center">
            <div className="relative">
              {/* Glow rings */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-bull/10 to-bear/10 blur-2xl scale-110"/>
              <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-[0_20px_60px_rgba(15,32,64,0.15)] bg-white p-4">
                <img src="/bull-bear.webp" alt="Bull vs Bear Market" className="w-full max-w-md mx-auto animate-float"/>
              </div>
              {/* Floating stat cards */}
              <div className="absolute -left-6 top-1/4 bg-white rounded-2xl border border-bull/20 shadow-bull p-3 animate-fade-up">
                <div className="text-[10px] text-gray-400 font-semibold mb-1">BULL MARKET</div>
                <div className="font-mono text-sm font-bold text-bull flex items-center gap-1"><TrendingUp size={13}/> +18.4% XIRR</div>
              </div>
              <div className="absolute -right-6 bottom-1/4 bg-white rounded-2xl border border-bear/20 shadow-bear p-3 animate-fade-up">
                <div className="text-[10px] text-gray-400 font-semibold mb-1">BEAR WATCH</div>
                <div className="font-mono text-sm font-bold text-bear flex items-center gap-1"><ShieldCheck size={13}/> Protected</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 border-y border-gray-100 py-16">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex px-3 py-1 rounded-full bg-navy-dim text-navy-700 text-xs font-bold border border-navy-200/50 mb-4">Why TradePro</div>
            <h2 className="font-display text-3xl font-bold text-navy-700">Built for serious traders</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon:Gauge,       color:'text-amber',  bg:'bg-amber-dim',  title:'Real-time margin',    desc:'Span + exposure recomputed continuously with auto square-off at 90% utilisation.' },
              { icon:ShieldCheck, color:'text-bull',   bg:'bg-bull-dim',   title:'SEBI compliance',     desc:'Daily activity reports, UCC files and CKYC uploads in exchange-prescribed format.' },
              { icon:Activity,    color:'text-navy-500',bg:'bg-navy-50',   title:'Institutional orders',desc:'Market, limit, stop-loss, bracket and GTT with sub-80ms FIX-protocol routing.' },
              { icon:BarChart3,   color:'text-bear',   bg:'bg-bear-dim',   title:'Portfolio analytics', desc:'P&L, XIRR, sector allocation, MTM valuation and ledger in one terminal.' },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-200 shadow-card p-6 hover:shadow-navy transition-all hover:-translate-y-1">
                <div className={`h-10 w-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon size={20} className={f.color}/>
                </div>
                <h3 className="font-display text-base font-bold text-navy-700 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   AUTH PAGES
═══════════════════════════════════════════════════ */
function AuthLayout({ children, title, sub, side }) {
  return (
    <div className="min-h-[calc(100vh-120px)] grid lg:grid-cols-2">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-center px-12 py-16 bg-gradient-to-br from-navy-700 to-navy-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src="/bull-bear.webp" alt="" className="w-full h-full object-contain object-center"/>
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center"><TrendingUp size={20} className="text-white"/></div>
            <span className="font-display text-2xl font-bold text-white">TradePro</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-white mb-4">{side?.title || 'Welcome back'}</h2>
          <p className="text-white/60 text-base leading-relaxed mb-8">{side?.sub || 'Access your professional trading terminal.'}</p>
          <div className="space-y-3">
            {(side?.points || ['Live NSE & BSE data', 'Institutional order routing', 'SEBI-compliant reporting']).map(p => (
              <div key={p} className="flex items-center gap-3 text-sm text-white/80">
                <CheckCircle2 size={15} className="text-bull-light shrink-0"/>{p}
              </div>
            ))}
          </div>
          <div className="mt-12 grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
            {[['₹0','equity delivery'],['₹20','F&O trades'],['₹0','direct MF']].map(([n,l]) => (
              <div key={l}><div className="font-mono text-xl font-bold text-bull-light">{n}</div><div className="text-xs text-white/50">{l}</div></div>
            ))}
          </div>
        </div>
      </div>
      {/* Right form */}
      <div className="flex flex-col justify-center px-6 sm:px-12 py-12 bg-white">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-navy-700 mb-1">{title}</h1>
            <p className="text-sm text-gray-500">{sub}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

function Login({ setPage }) {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((s) => s.auth)
  const [email, setEmail]   = useState('')
  const [pw,    setPw]      = useState('')
  const [show,  setShow]    = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    await dispatch(loginUser({
      email, password: pw,
      deviceId: navigator.userAgent.slice(0, 64),
      deviceName: `${navigator.platform} Browser`,
      userAgent: navigator.userAgent,
    }))
  }

  return (
    <AuthLayout title="Sign in to TradePro" sub="Enter your credentials to access your trading account."
      side={{ title:'Start trading smarter', sub:'Professional tools for every market condition.', points:['Live NSE & BSE prices every 6s','Real-time gainers & losers','Portfolio P&L with MTM valuations'] }}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email address</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@email.com"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400"/>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
          <div className="relative">
            <input value={pw} onChange={e=>setPw(e.target.value)} type={show?'text':'password'} placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400 pr-11"/>
            <button type="button" onClick={()=>setShow(!show)} className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600">
              {show ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
        </div>
        {error && <div className="flex items-center gap-2 text-xs text-bear bg-bear-dim rounded-lg px-3 py-2"><AlertTriangle size={13}/>{error}</div>}
        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-navy-600 text-white font-semibold hover:bg-navy-700 disabled:opacity-50 shadow-navy transition-all hover:scale-[1.02]">
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <div className="flex items-center gap-2 justify-center text-xs text-gray-400"><Lock size={11}/> Secured with JWT · TLS 1.3</div>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        New to TradePro?{' '}
        <button onClick={()=>setPage('register')} className="text-navy-600 font-semibold hover:underline">Open an account</button>
      </p>
    </AuthLayout>
  )
}

function Register({ setPage }) {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((s) => s.auth)
  const [step, setStep]     = useState(1)
  const [done, setDone]     = useState(false)
  const [form, setForm]     = useState({ name:'', email:'', phone:'', password:'', role:'CLIENT' })
  const [errs, setErrs]     = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name required'
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Must be 10 digits'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email'
    if (form.password.length < 6) e.password = 'Min 6 characters'
    setErrs(e); return !Object.keys(e).length
  }

  const submit = async (e) => {
    e.preventDefault()
    const r = await dispatch(registerUser({
      name:form.name, email:form.email, phone:form.phone, password:form.password,
      deviceId:navigator.userAgent.slice(0,64), deviceName:`${navigator.platform} Browser`, userAgent:navigator.userAgent,
    }))
    if (!r.error) setDone(true)
  }

  if (done) return (
    <AuthLayout title="Account created!" sub="Welcome to TradePro.">
      <div className="text-center py-8">
        <div className="h-16 w-16 rounded-full bg-bull-dim flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-bull"/>
        </div>
        <p className="text-gray-600 text-sm">Redirecting to your dashboard…</p>
      </div>
    </AuthLayout>
  )

  return (
    <AuthLayout title="Create your account" sub={`Step ${step} of 2`}
      side={{ title:'Join 4 lakh+ traders', sub:'Professional tools, zero delivery brokerage.', points:['₹0 equity delivery brokerage','Real-time NSE & BSE data','SEBI-compliant platform'] }}>
      <form onSubmit={step===1?(e)=>{e.preventDefault();if(validate())setStep(2)}:submit} className="space-y-4">
        {step===1 ? (
          <>
            {[['name','Full Name','Rahul Sharma'],['email','Email','you@email.com'],['phone','Phone','9876543210']].map(([k,l,ph])=>(
              <div key={k}>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{l}</label>
                <input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={ph}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400"/>
                {errs[k] && <p className="text-xs text-bear mt-1">{errs[k]}</p>}
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
              <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min 6 characters"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400"/>
              {errs.password && <p className="text-xs text-bear mt-1">{errs.password}</p>}
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Account type</label>
              <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-navy-500/20">
                {ROLES.map(r=><option key={r.id} value={r.id}>{r.label} — {r.desc}</option>)}
              </select>
            </div>
            <div className="rounded-xl bg-navy-50 border border-navy-100 p-4 text-xs text-navy-600 flex gap-2">
              <ShieldCheck size={14} className="text-bull shrink-0 mt-0.5"/>
              DEMAT and PAN verification required before trading activation, per SEBI guidelines.
            </div>
          </>
        )}
        {error && <div className="flex items-center gap-2 text-xs text-bear bg-bear-dim rounded-lg px-3 py-2"><AlertTriangle size={13}/>{error}</div>}
        <div className="flex gap-3">
          {step===2 && <button type="button" onClick={()=>setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Back</button>}
          <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-navy-600 text-white font-semibold hover:bg-navy-700 disabled:opacity-50 shadow-navy transition-all">
            {step===1 ? 'Continue' : loading ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Already registered?{' '}
        <button onClick={()=>setPage('login')} className="text-navy-600 font-semibold hover:underline">Sign in</button>
      </p>
    </AuthLayout>
  )
}

/* ═══════════════════════════════════════════════════
   SHARED WIDGETS
═══════════════════════════════════════════════════ */
function StatCard({ label, value, delta, icon:Icon, accent='navy' }) {
  const styles = {
    navy:   { bg:'bg-navy-50',   icon:'text-navy-500',   border:'border-navy-100'   },
    bull:   { bg:'bg-bull-dim',  icon:'text-bull',       border:'border-bull/20'    },
    bear:   { bg:'bg-bear-dim',  icon:'text-bear',       border:'border-bear/20'    },
    amber:  { bg:'bg-amber-dim', icon:'text-amber',      border:'border-amber/20'   },
  }
  const s = styles[accent] || styles.navy
  return (
    <div className={`bg-white rounded-2xl border ${s.border} shadow-card p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
        <div className={`h-8 w-8 rounded-lg ${s.bg} flex items-center justify-center`}>
          <Icon size={15} className={s.icon}/>
        </div>
      </div>
      <div className="font-mono text-2xl font-bold text-navy-700 tabular-nums">{value}</div>
      {delta !== undefined && (
        <div className={`mt-1 text-xs font-semibold font-mono flex items-center gap-1 ${delta>=0?'text-bull':'text-bear'}`}>
          {delta>=0?<TrendingUp size={11}/>:<TrendingDown size={11}/>} {delta>=0?'+':''}{delta}% today
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }) {
  const map = {
    EXECUTED: 'bg-bull-dim text-bull-dark border-bull/20',
    PENDING:  'bg-amber-dim text-amber-dark border-amber/20',
    CANCELLED:'bg-gray-100 text-gray-500 border-gray-200',
    REJECTED: 'bg-bear-dim text-bear-dark border-bear/20',
  }
  return <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold ${map[status]||map.PENDING}`}>{status}</span>
}

function SectionHeader({ title, sub }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-bold text-navy-700">{title}</h1>
      {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════ */
function Dashboard({ auth, setPage }) {
  const { indices, stocks, gainers, losers, loading, lastUpdated } = useMarketData()
  const { trades, loadTrades } = useTrades()
  useEffect(() => { loadTrades() }, [])

  const withLive = HOLDINGS.map(h => ({ ...h, ltp: stocks[h.symbol]?.price || h.avgCost*1.05 }))
  const portVal  = withLive.reduce((s,h) => s+h.qty*h.ltp, 0)
  const invested = withLive.reduce((s,h) => s+h.qty*h.avgCost, 0)
  const pnl      = portVal - invested
  const nifty    = indices['NIFTY 50']
  const bank     = indices['NIFTY BANK']
  const vix      = indices['INDIA VIX']

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 animate-fade-up">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-700">Welcome back, {auth.name} 👋</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? 'Connecting to NSE live data…' : nifty
              ? `NIFTY 50 at ${fmtN(nifty.price)} · ${nifty.changePct>=0?'+':''}${nifty.changePct.toFixed(2)}% · Updated ${fmtTime(lastUpdated)}`
              : 'Live data loading…'}
          </p>
        </div>
        <button onClick={()=>setPage('trade')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-600 text-white text-sm font-semibold hover:bg-navy-700 shadow-navy transition-all">
          <Activity size={15}/> New Order
        </button>
      </div>

      {/* Index stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Portfolio Value"  value={fmt0(portVal)}  delta={Number(((pnl/invested)*100).toFixed(2))} icon={Wallet}      accent={pnl>=0?'bull':'bear'}/>
        <StatCard label="NIFTY 50"         value={nifty?fmtN(nifty.price):'—'} delta={nifty?Number(nifty.changePct.toFixed(2)):undefined} icon={BarChart3} accent={nifty?.changePct>=0?'bull':'bear'}/>
        <StatCard label="BANK NIFTY"       value={bank?fmtN(bank.price):'—'}   delta={bank?Number(bank.changePct.toFixed(2)):undefined}  icon={Activity}  accent={bank?.changePct>=0?'bull':'bear'}/>
        <StatCard label="India VIX"        value={vix?fmtN(vix.price):'—'}     delta={vix?Number(vix.changePct.toFixed(2)):undefined}     icon={Gauge}     accent={vix?.changePct>=0?'bear':'bull'}/>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display text-base font-bold text-navy-700">Portfolio Performance</h3>
              <p className="text-xs text-gray-400">MTM valuation · ₹ in thousands</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-bull bg-bull-dim px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-bull animate-pulse-dot"/>LIVE
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={PERF}>
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="d" tick={{fill:'#9ca3af',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#9ca3af',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}K`}/>
              <Tooltip contentStyle={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,fontSize:12,boxShadow:'0 4px 16px rgba(0,0,0,0.08)'}} formatter={v=>fmt0(v)}/>
              <Area type="monotone" dataKey="v" stroke="#16a34a" strokeWidth={2.5} fill="url(#pg)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Movers */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-5">
          <h3 className="font-display text-base font-bold text-navy-700 mb-4">Today's Movers</h3>
          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-bull mb-2"><TrendingUp size={12}/> TOP GAINERS</div>
            <div className="space-y-1.5">
              {(gainers.length?gainers:[{symbol:'—',price:0,changePct:0}]).slice(0,4).map((g,i)=>(
                <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50">
                  <span className="font-mono text-xs font-semibold text-navy-700">{SYMBOL_LABELS[g.symbol]||g.symbol}</span>
                  <div className="text-right">
                    <div className="font-mono text-xs text-gray-700 tabular-nums">{g.price>0?fmtN(g.price):'—'}</div>
                    <div className="font-mono text-[10px] font-bold text-bull">+{(g.changePct||0).toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-bear mb-2"><TrendingDown size={12}/> TOP LOSERS</div>
            <div className="space-y-1.5">
              {(losers.length?losers:[{symbol:'—',price:0,changePct:0}]).slice(0,4).map((l,i)=>(
                <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50">
                  <span className="font-mono text-xs font-semibold text-navy-700">{SYMBOL_LABELS[l.symbol]||l.symbol}</span>
                  <div className="text-right">
                    <div className="font-mono text-xs text-gray-700 tabular-nums">{l.price>0?fmtN(l.price):'—'}</div>
                    <div className="font-mono text-[10px] font-bold text-bear">{(l.changePct||0).toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      {trades.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-display text-base font-bold text-navy-700">Recent Orders</h3>
            <button onClick={()=>setPage('portfolio')} className="text-xs text-navy-500 font-semibold hover:underline">View all →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="px-6 py-3 font-semibold">Symbol</th><th className="px-4 py-3 font-semibold">Side</th>
                <th className="px-4 py-3 font-semibold text-right">Qty</th><th className="px-4 py-3 font-semibold text-right">Price</th>
                <th className="px-4 py-3 font-semibold text-right">Status</th>
              </tr></thead>
              <tbody>{trades.slice(0,5).map(t=>(
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-3 font-mono text-xs font-bold text-navy-700">{t.symbol}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.side==='BUY'?'bg-bull-dim text-bull-dark':'bg-bear-dim text-bear-dark'}`}>{t.side}</span></td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">{t.quantity}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">{fmt(t.executedPrice||t.price||0)}</td>
                  <td className="px-4 py-3 text-right"><StatusPill status={t.status}/></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   TRADING TERMINAL
═══════════════════════════════════════════════════ */
function TradingTerminal() {
  const { indices, stocks } = useMarketData()
  const { place, placing, trades } = useTrades()
  const [orders, setOrders] = useState(ORDER_SEED)
  const [selSym, setSelSym] = useState('RELIANCE')
  const [side,   setSide]   = useState('BUY')
  const [type,   setType]   = useState('MARKET')
  const [qty,    setQty]    = useState(10)
  const [price,  setPrice]  = useState(0)
  const [toast,  setToast]  = useState(null)

  const WATCH = ['NIFTY 50','NIFTY BANK','RELIANCE','TCS','HDFCBANK','INFY','ITC','BHARTIARTL','WIPRO','SBIN','BAJFINANCE','ADANIENT']
  const selQ  = stocks[selSym] || indices[selSym]
  const ltp   = selQ?.price || 0
  useEffect(() => { setPrice(ltp) }, [selSym, ltp])

  const margin     = 342180
  const orderValue = qty * (type==='MARKET' ? ltp : price)
  const marginOk   = orderValue <= margin

  const placeOrder = () => {
    if (!marginOk) { setToast({ok:false,msg:'Insufficient margin'}); return }
    const o = { id:'ORD'+Math.floor(10000+Math.random()*89999), symbol:selSym, type, side, qty, price:type==='MARKET'?ltp:price, status:'PENDING', time:new Date().toLocaleTimeString('en-IN',{hour12:false}) }
    setOrders([o,...orders])
    place({ symbol:selSym, exchange:'NSE', segment:'EQUITY', orderType:type, side, quantity:qty, price:type==='MARKET'?null:price })
    setToast({ok:true,msg:`${side} ${qty} ${selSym} @ ${type==='MARKET'?'MKT':fmt(price)}`})
    setTimeout(()=>setOrders(os=>os.map(x=>x.id===o.id?{...x,status:'EXECUTED'}:x)),1600)
    setTimeout(()=>setToast(null),3000)
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 animate-fade-up">
      <SectionHeader title="Trading Terminal" sub="Live NSE market data · Real-time order execution"/>
      <div className="grid lg:grid-cols-[280px_1fr_1fr] gap-5">

        {/* Watchlist */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
            <Search size={13} className="text-gray-400"/>
            <input placeholder="Search symbol…" className="bg-transparent text-sm text-gray-700 outline-none flex-1"/>
          </div>
          <div className="overflow-y-auto max-h-[520px]">
            {WATCH.map(sym => {
              const q   = stocks[sym] || indices[sym]
              const up  = (q?.changePct||0) >= 0
              const sel = selSym === sym
              return (
                <button key={sym} onClick={()=>setSelSym(sym)}
                  className={`w-full flex items-center justify-between px-4 py-3 border-b border-gray-50 text-left transition-colors ${sel?'bg-navy-50 border-l-2 border-l-navy-500':'hover:bg-gray-50'}`}>
                  <div>
                    <div className="font-mono text-xs font-bold text-navy-700">{SYMBOL_LABELS[sym]||sym}</div>
                    <div className="text-[10px] text-gray-400">{sym.includes('NIFTY')||sym==='INDIA VIX'?'INDEX':'NSE'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs font-semibold text-gray-800 tabular-nums">{q?fmtN(q.price):'—'}</div>
                    <div className={`font-mono text-[10px] font-bold tabular-nums ${up?'text-bull':'text-bear'}`}>{q?`${up?'+':''}${q.changePct.toFixed(2)}%`:'—'}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Order form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6">
          <div className="mb-5">
            <div className="font-display text-lg font-bold text-navy-700">{SYMBOL_LABELS[selSym]||selSym}</div>
            <div className={`font-mono text-2xl font-bold tabular-nums ${(selQ?.changePct||0)>=0?'text-bull':'text-bear'}`}>
              {ltp>0?fmtN(ltp):'—'}
              {selQ && <span className="text-sm ml-2">{selQ.changePct>=0?'+':''}{selQ.changePct.toFixed(2)}%</span>}
            </div>
            {selQ && (
              <div className="flex gap-4 mt-1 text-[11px] text-gray-400 font-mono">
                <span>O:{fmtN(selQ.open)}</span><span className="text-bull">H:{fmtN(selQ.high)}</span>
                <span className="text-bear">L:{fmtN(selQ.low)}</span><span>PC:{fmtN(selQ.prevClose)}</span>
              </div>
            )}
          </div>

          {/* BUY / SELL */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <button onClick={()=>setSide('BUY')}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all ${side==='BUY'?'bg-bull text-white shadow-bull':'bg-bull-dim text-bull-dark hover:bg-bull/20'}`}>
              ▲ BUY
            </button>
            <button onClick={()=>setSide('SELL')}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all ${side==='SELL'?'bg-bear text-white shadow-bear':'bg-bear-dim text-bear-dark hover:bg-bear/20'}`}>
              ▼ SELL
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Order Type</label>
              <select value={type} onChange={e=>setType(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-navy-400">
                {['MARKET','LIMIT','STOP_LOSS','BRACKET','GTT'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Quantity</label>
              <input type="number" min={1} value={qty} onChange={e=>setQty(Number(e.target.value))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-navy-400"/>
            </div>
            {type!=='MARKET' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Price (₹)</label>
                <input type="number" step="0.05" value={price} onChange={e=>setPrice(Number(e.target.value))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-navy-400"/>
              </div>
            )}
          </div>

          {/* Margin check */}
          <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-3 text-xs space-y-1.5">
            <div className="flex justify-between text-gray-500"><span>Order value</span><span className="font-mono font-semibold text-navy-700 tabular-nums">{fmt(orderValue)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Available margin</span><span className="font-mono font-semibold text-navy-700 tabular-nums">{fmt(margin)}</span></div>
            {!marginOk && <div className="flex items-center gap-1 text-bear font-semibold"><AlertTriangle size={11}/> Exceeds margin</div>}
          </div>

          <button onClick={placeOrder} disabled={placing}
            className={`w-full mt-4 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-all hover:scale-[1.02] ${side==='BUY'?'bg-bull hover:bg-bull-dark shadow-bull':'bg-bear hover:bg-bear-dark shadow-bear'}`}>
            {placing?'Placing…':`Place ${side} Order`}
          </button>

          {toast && (
            <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold ${toast.ok?'bg-bull-dim text-bull-dark border border-bull/20':'bg-bear-dim text-bear-dark border border-bear/20'}`}>
              {toast.ok?<CheckCircle2 size={13}/>:<AlertTriangle size={13}/>} {toast.msg}
            </div>
          )}
        </div>

        {/* Order book */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-display text-sm font-bold text-navy-700">Order Book — Today</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-2.5 text-left font-semibold">Symbol</th>
                <th className="px-3 py-2.5 text-left font-semibold">Type</th>
                <th className="px-3 py-2.5 text-left font-semibold">Side</th>
                <th className="px-3 py-2.5 text-right font-semibold">Qty</th>
                <th className="px-3 py-2.5 text-right font-semibold">Price</th>
                <th className="px-3 py-2.5 text-right font-semibold">Status</th>
              </tr></thead>
              <tbody>
                {orders.map(o=>(
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 font-mono text-xs font-bold text-navy-700">{o.symbol}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{o.type.replace('_',' ')}</td>
                    <td className={`px-3 py-2.5 text-xs font-bold ${o.side==='BUY'?'text-bull':'text-bear'}`}>{o.side}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums">{o.qty}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums">{Number(o.price).toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right"><StatusPill status={o.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   PORTFOLIO, RESEARCH, MARGIN, COMPLIANCE, GLOSSARY
═══════════════════════════════════════════════════ */
function Portfolio() {
  const { stocks } = useMarketData()
  const rows = HOLDINGS.map(h => {
    const ltp = stocks[h.symbol]?.price || h.avgCost*1.05
    return { ...h, ltp, value:h.qty*ltp, pnl:(ltp-h.avgCost)*h.qty, pnlPct:((ltp-h.avgCost)/h.avgCost)*100 }
  })
  const total = rows.reduce((s,r)=>s+r.value,0)
  const pnl   = rows.reduce((s,r)=>s+r.pnl,0)
  const sdata = Object.entries(rows.reduce((a,r)=>{a[r.sector]=(a[r.sector]||0)+r.value;return a},{})).map(([name,value])=>({name,value}))
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 animate-fade-up">
      <SectionHeader title="Portfolio" sub="Live MTM valuation · Holdings &amp; Ledger"/>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Holdings Value" value={fmt0(total)} icon={Wallet} accent="navy"/>
        <StatCard label="Total P&L" value={fmt0(pnl)} delta={Number(((pnl/(total-pnl))*100).toFixed(2))} icon={pnl>=0?TrendingUp:TrendingDown} accent={pnl>=0?'bull':'bear'}/>
        <StatCard label="XIRR" value="18.4%" icon={BarChart3} accent="amber"/>
      </div>
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50"><h3 className="font-display text-sm font-bold text-navy-700">Holdings — Live Prices</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead><tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                {['Symbol','Qty','Avg Cost','LTP','Value','P&L'].map(h=><th key={h} className={`px-5 py-2.5 font-semibold ${h==='Symbol'?'text-left':'text-right'}`}>{h}</th>)}
              </tr></thead>
              <tbody>{rows.map(r=>(
                <tr key={r.symbol} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3"><div className="font-mono text-xs font-bold text-navy-700">{r.symbol}</div><div className="text-[10px] text-gray-400">{r.name}</div></td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">{r.qty}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">{r.avgCost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums font-semibold">{r.ltp.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums font-bold text-navy-700">{fmt0(r.value)}</td>
                  <td className={`px-4 py-3 text-right font-mono text-xs tabular-nums font-bold ${r.pnl>=0?'text-bull':'text-bear'}`}>
                    {r.pnl>=0?'+':''}{fmt0(r.pnl)} <span className="font-normal opacity-60">({r.pnlPct.toFixed(1)}%)</span>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-5">
          <h3 className="font-display text-sm font-bold text-navy-700 mb-3">Sector Allocation</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={sdata} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={3}>
              {sdata.map(s=><Cell key={s.name} fill={SECTOR_COLORS[s.name]||'#9ca3af'} stroke="none"/>)}
            </Pie><Tooltip contentStyle={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,fontSize:11}} formatter={v=>fmt0(v)}/></PieChart>
          </ResponsiveContainer>
          {sdata.map(s=>(
            <div key={s.name} className="flex items-center justify-between text-xs py-1">
              <span className="flex items-center gap-2 text-gray-500"><span className="h-2 w-2 rounded-full" style={{background:SECTOR_COLORS[s.name]}}/>{s.name}</span>
              <span className="font-mono font-semibold text-navy-700">{((s.value/total)*100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50"><h3 className="font-display text-sm font-bold text-navy-700">Ledger Statement</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead><tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
              {['Date','Narration','Debit','Credit','Balance'].map(h=><th key={h} className={`px-5 py-2.5 font-semibold ${h==='Date'||h==='Narration'?'text-left':'text-right'}`}>{h}</th>)}
            </tr></thead>
            <tbody>{LEDGER.map((l,i)=>(
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-3 font-mono text-xs text-gray-500">{l.date}</td>
                <td className="px-5 py-3 text-xs text-gray-700">{l.narration}</td>
                <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-bear">{l.debit?fmt(l.debit):'—'}</td>
                <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-bull">{l.credit?fmt(l.credit):'—'}</td>
                <td className="px-4 py-3 text-right font-mono text-xs tabular-nums font-bold text-navy-700">{fmt0(l.balance)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Research() {
  const rc = { BUY:'bg-bull-dim text-bull-dark border-bull/20', ACCUMULATE:'bg-navy-50 text-navy-600 border-navy-200', HOLD:'bg-amber-dim text-amber-dark border-amber/20', SELL:'bg-bear-dim text-bear-dark border-bear/20' }
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 animate-fade-up">
      <SectionHeader title="Research Portal" sub="Analyst coverage, ratings &amp; price targets"/>
      <div className="grid md:grid-cols-2 gap-5">
        {RESEARCH.map(r=>(
          <div key={r.id} className="bg-white rounded-2xl border border-gray-200 shadow-card p-6 hover:shadow-navy transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xl font-bold text-navy-700">{r.symbol}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${rc[r.rating]}`}>{r.rating}</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">{r.thesis}</p>
            <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl mb-3">
              <div><div className="text-[10px] text-gray-400 font-semibold">CMP</div><div className="font-mono text-sm font-bold text-navy-700">{fmtN(r.cmp)}</div></div>
              <div><div className="text-[10px] text-gray-400 font-semibold">TARGET</div><div className="font-mono text-sm font-bold text-navy-700">{fmtN(r.target)}</div></div>
              <div><div className="text-[10px] text-gray-400 font-semibold">UPSIDE</div><div className="font-mono text-sm font-bold text-bull">+{(((r.target-r.cmp)/r.cmp)*100).toFixed(1)}%</div></div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>By {r.analyst}</span>
              <button className="text-navy-500 font-semibold hover:underline flex items-center gap-1">View report <ChevronRight size={11}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MarginRisk() {
  const avail=342180, used=558420, total=avail+used, pct=Math.round((used/total)*100)
  const color = pct>=90?'text-bear bg-bear-dim border-bear/20':pct>=80?'text-amber bg-amber-dim border-amber/20':'text-bull bg-bull-dim border-bull/20'
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 animate-fade-up">
      <SectionHeader title="Margin &amp; Risk" sub="Span + exposure monitoring · VaR · Position limits"/>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6">
          <h3 className="font-display text-sm font-bold text-navy-700 mb-4">Margin Utilisation</h3>
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 140 140" className="w-36 h-36">
              <circle cx="70" cy="70" r="54" stroke="#f1f5f9" strokeWidth="12" fill="none"/>
              <circle cx="70" cy="70" r="54" stroke={pct>=90?'#dc2626':pct>=80?'#d97706':'#16a34a'} strokeWidth="12" fill="none"
                strokeLinecap="round" strokeDasharray={`${2*Math.PI*54}`} strokeDashoffset={`${2*Math.PI*54*(1-pct/100)}`} transform="rotate(-90 70 70)"/>
              <text x="70" y="66" textAnchor="middle" className="fill-navy-700" style={{fontSize:22,fontFamily:'IBM Plex Mono',fontWeight:'bold'}}>{pct}%</text>
              <text x="70" y="83" textAnchor="middle" className="fill-gray-400" style={{fontSize:10}}>utilised</text>
            </svg>
            <div className="grid grid-cols-2 gap-3 w-full mt-4 text-xs">
              <div className="bg-bull-dim rounded-xl p-3 border border-bull/20"><div className="text-gray-500 mb-1">Available</div><div className="font-mono font-bold text-bull-dark">{fmt0(avail)}</div></div>
              <div className="bg-amber-dim rounded-xl p-3 border border-amber/20"><div className="text-gray-500 mb-1">Utilised</div><div className="font-mono font-bold text-amber-dark">{fmt0(used)}</div></div>
            </div>
            {pct>=80 && <div className={`mt-3 w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${color}`}><AlertTriangle size={13}/> Margin call — top-up before next session</div>}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-card p-6">
          <h3 className="font-display text-sm font-bold text-navy-700 mb-4">Risk Metrics</h3>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[['Portfolio Beta','1.12','text-navy-700'],['Sharpe Ratio','1.48','text-bull'],['VaR (95%)','₹18,240','text-bear']].map(([l,v,c])=>(
              <div key={l} className="bg-gray-50 rounded-xl border border-gray-200 p-3"><div className="text-xs text-gray-400 mb-1">{l}</div><div className={`font-mono text-lg font-bold ${c}`}>{v}</div></div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[{n:'RELIANCE',e:34},{n:'TCS',e:21},{n:'HDFCBANK',e:24},{n:'INFY',e:15},{n:'ITC',e:6}]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="n" tick={{fill:'#9ca3af',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#9ca3af',fontSize:11}} axisLine={false} tickLine={false} unit="%"/>
              <Tooltip contentStyle={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,fontSize:12}}/>
              <Bar dataKey="e" fill="#0f2040" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2">Concentration exposure by scrip vs SEBI position limits.</p>
        </div>
      </div>
    </div>
  )
}

function Compliance() {
  const rpts = [
    {name:'Daily Activity Report', status:'Submitted', time:'18:02 IST'},
    {name:'UCC File — new clients', status:'Submitted', time:'17:40 IST'},
    {name:'CKYC Registry Upload',   status:'Pending',   time:'Due 20:00 IST'},
    {name:'MTF Utilisation Report', status:'Submitted', time:'16:15 IST'},
    {name:'Margin Shortfall Report',status:'In review', time:'—'},
  ]
  const sc = { Submitted:'bg-bull-dim text-bull-dark border-bull/20', Pending:'bg-amber-dim text-amber-dark border-amber/20', 'In review':'bg-navy-50 text-navy-600 border-navy-200' }
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 animate-fade-up">
      <SectionHeader title="Compliance &amp; Regulatory" sub="SEBI submission tracking · Audit trail"/>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50"><h3 className="font-display text-sm font-bold text-navy-700">SEBI Submission Status</h3></div>
          <div className="divide-y divide-gray-50">
            {rpts.map(r=>(
              <div key={r.name} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                <div><div className="text-sm font-semibold text-gray-700">{r.name}</div><div className="text-xs text-gray-400 mt-0.5">{r.time}</div></div>
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${sc[r.status]}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-5">
          <h3 className="font-display text-sm font-bold text-navy-700 mb-4">Audit Trail</h3>
          <div className="space-y-3">
            {[{u:'dealer.arjun',a:'Executed BUY RELIANCE x25',t:'09:21:04'},{u:'risk.neha',a:'Updated VaR limit to 20%',t:'10:12:51'},{u:'compliance.vivek',a:'Approved research — TCS',t:'11:47:20'}].map((a,i)=>(
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="h-7 w-7 rounded-full bg-navy-100 flex items-center justify-center shrink-0"><Users size={13} className="text-navy-500"/></div>
                <div className="flex-1 min-w-0"><div className="text-sm text-gray-700 font-medium">{a.a}</div><div className="text-xs text-gray-400 mt-0.5">{a.u} · {a.t}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Glossary() {
  const [q, setQ] = useState('')
  const filtered = GLOSSARY_TERMS.filter(t =>
    t.term.toLowerCase().includes(q.toLowerCase()) || t.full.toLowerCase().includes(q.toLowerCase()) || t.def.toLowerCase().includes(q.toLowerCase())
  )
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-up">
      <SectionHeader title="Financial Glossary" sub="Key terms and abbreviations used in Indian capital markets"/>
      <div className="relative mb-6">
        <Search size={15} className="absolute left-4 top-3.5 text-gray-400"/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search SEBI, NSE, LTCG, MTM…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-card text-sm text-gray-700 outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400"/>
        {q && <button onClick={()=>setQ('')} className="absolute right-4 top-3.5 text-gray-400"><X size={14}/></button>}
      </div>
      <div className="space-y-2">
        {filtered.map(t=>(
          <div key={t.term} className="bg-white rounded-2xl border border-gray-200 shadow-card p-5 hover:shadow-navy hover:-translate-y-0.5 transition-all">
            <div className="flex items-start gap-4">
              <span className="shrink-0 min-w-[72px] text-center rounded-xl bg-navy-600 text-white font-mono text-sm font-bold px-3 py-1.5 shadow-navy">{t.term}</span>
              <div>
                <div className="font-display text-sm font-bold text-navy-700 mb-1">{t.full}</div>
                <p className="text-sm text-gray-500 leading-relaxed">{t.def}</p>
              </div>
            </div>
          </div>
        ))}
        {filtered.length===0 && <div className="text-center py-12 text-gray-400 text-sm">No terms match "{q}"</div>}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   APP SHELL + ROOT
═══════════════════════════════════════════════════ */
function AppShell() {
  const dispatch        = useDispatch()
  const { token, user } = useSelector((s) => s.auth)
  const [page, setPage] = useState('landing')

  useEffect(() => {
    if (token && user) setPage('dashboard')
  }, [token, user])

  const navigateTo = (p) => {
    if (!token && ['dashboard','trade','portfolio','research','margin','compliance'].includes(p)) { setPage('login'); return }
    setPage(p)
  }
  const auth = token && user ? { name: user.name?.split(' ')[0] || 'Trader', role: 'CLIENT' } : null
  const onLogout = () => { dispatch(logoutUser()); setPage('landing') }

  const renderPage = () => {
    switch (page) {
      case 'login':      return <Login setPage={setPage}/>
      case 'register':   return <Register setPage={setPage}/>
      case 'glossary':   return <Glossary/>
      case 'dashboard':  return auth ? <Dashboard auth={auth} setPage={navigateTo}/> : <Login setPage={setPage}/>
      case 'trade':      return auth ? <TradingTerminal/>  : <Login setPage={setPage}/>
      case 'portfolio':  return auth ? <Portfolio/>        : <Login setPage={setPage}/>
      case 'research':   return auth ? <Research/>         : <Login setPage={setPage}/>
      case 'margin':     return auth ? <MarginRisk/>       : <Login setPage={setPage}/>
      case 'compliance': return auth ? <Compliance/>       : <Login setPage={setPage}/>
      default:           return <Landing setPage={navigateTo}/>
    }
  }

  return (
    <div className="font-body min-h-screen bg-gray-50 flex flex-col">
      <NavBar auth={auth} page={page} setPage={navigateTo} onLogout={onLogout}/>
      <TickerTape/>
      <main className="flex-1">{renderPage()}</main>
      <Footer/>
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

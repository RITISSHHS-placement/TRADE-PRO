import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Provider } from 'react-redux'
import { store } from './store'
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Wallet, ShieldCheck, LineChart as LineChartIcon,
  FileText, Users, Bell, LogOut, ChevronRight, Search, Plus, X,
  CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, Landmark,
  Gauge, ClipboardList, Lock, Eye, EyeOff, BarChart3, Sparkles,
} from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { loginUser, logoutUser, registerUser } from './store/slices/authSlice'
import { useTrades, useMarketData } from './hooks'
import { fetchNSEIndices, fetchNifty50, SYMBOL_LABELS } from './services/marketData'
import './assets/styles/global.css'

/* ── helpers ── */
const fmtINR  = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtINR0 = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })

/* ── static mock data (augmented with live data where available) ── */
const HOLDINGS = [
  { symbol:'RELIANCE',   name:'Reliance Industries',        qty:50,  avgCost:2450.30, sector:'Energy'  },
  { symbol:'TCS',        name:'Tata Consultancy Services',  qty:30,  avgCost:3550.00, sector:'IT'      },
  { symbol:'HDFCBANK',   name:'HDFC Bank',                  qty:80,  avgCost:1520.10, sector:'Banking' },
  { symbol:'INFY',       name:'Infosys',                    qty:60,  avgCost:1410.00, sector:'IT'      },
  { symbol:'ITC',        name:'ITC Limited',                qty:200, avgCost:410.25,  sector:'FMCG'    },
  { symbol:'BHARTIARTL', name:'Bharti Airtel',              qty:40,  avgCost:980.00,  sector:'Telecom' },
]

const PERFORMANCE = [
  {d:'Jan',v:412000},{d:'Feb',v:428500},{d:'Mar',v:419300},
  {d:'Apr',v:447800},{d:'May',v:462100},{d:'Jun',v:455900},{d:'Jul',v:481260},
]

const SECTOR_COLORS = { Energy:'#f59e0b', IT:'#2dd4bf', Banking:'#f43f5e', FMCG:'#a3e635', Telecom:'#818cf8' }

const RESEARCH_REPORTS = [
  { id:1, symbol:'TCS',       rating:'BUY',       target:4250, cmp:3820.45, analyst:'R. Menon', thesis:'Deal wins in BFSI vertical and margin expansion from AI-led delivery efficiencies support re-rating.' },
  { id:2, symbol:'RELIANCE',  rating:'ACCUMULATE', target:2850, cmp:2612.75, analyst:'P. Iyer',  thesis:'Retail and Jio platforms scaling; refining margins normalising post capex cycle.' },
  { id:3, symbol:'HDFCBANK',  rating:'BUY',        target:1720, cmp:1489.60, analyst:'S. Rao',   thesis:'Deposit growth catching up post-merger; credit costs trending toward historical average.' },
  { id:4, symbol:'ITC',       rating:'HOLD',       target:460,  cmp:432.10,  analyst:'K. Nair',  thesis:'Cigarette volume steady; FMCG-others still sub-scale on profitability.' },
]

const ORDER_BOOK_SEED = [
  { id:'ORD10231', symbol:'RELIANCE', type:'LIMIT',     side:'BUY',  qty:25, price:2605.00, status:'EXECUTED', time:'09:21:04' },
  { id:'ORD10238', symbol:'TCS',      type:'MARKET',    side:'SELL', qty:10, price:3818.20, status:'EXECUTED', time:'10:04:41' },
  { id:'ORD10244', symbol:'INFY',     type:'STOP_LOSS', side:'BUY',  qty:40, price:1548.00, status:'PENDING',  time:'11:12:09' },
]

const LEDGER = [
  { date:'05 Jul', narration:'Sale proceeds — RELIANCE',   debit:0,      credit:65137.5, balance:182430.10 },
  { date:'04 Jul', narration:'Brokerage + GST — TCS SELL', debit:156.20, credit:0,       balance:117292.60 },
  { date:'03 Jul', narration:'Fund transfer — UPI',         debit:0,      credit:50000,   balance:117448.80 },
  { date:'01 Jul', narration:'Dividend credit — ITC',       debit:0,      credit:2400,    balance:67448.80  },
]

const ROLES = [
  { id:'CLIENT',     label:'Client',               desc:'Trade, track holdings & statements'          },
  { id:'DEALER',     label:'Dealer / Broker',       desc:'Execute orders for assigned clients'          },
  { id:'ANALYST',    label:'Research Analyst',      desc:'Publish research & model portfolios'          },
  { id:'COMPLIANCE', label:'Compliance Officer',    desc:'Regulatory reports & audit trail'             },
  { id:'RISK',       label:'Risk Manager',          desc:'Margin monitoring & risk limits'              },
  { id:'ADMIN',      label:'System Administrator',  desc:'Full platform configuration'                  },
]

const NAV_BY_ROLE = {
  CLIENT:     ['dashboard','trade','portfolio','research','margin'],
  DEALER:     ['dashboard','trade','portfolio','margin'],
  ANALYST:    ['dashboard','research'],
  COMPLIANCE: ['dashboard','compliance','margin'],
  RISK:       ['dashboard','margin','compliance'],
  ADMIN:      ['dashboard','trade','portfolio','research','margin','compliance'],
}

const NAV_META = {
  dashboard:  { label:'Dashboard',         icon:BarChart3       },
  trade:      { label:'Trading Terminal',  icon:LineChartIcon   },
  portfolio:  { label:'Portfolio',         icon:Wallet          },
  research:   { label:'Research',          icon:FileText        },
  margin:     { label:'Margin & Risk',     icon:Gauge           },
  compliance: { label:'Compliance',        icon:ShieldCheck     },
}

/* ── Live watchlist ticker using NSE data ── */
function TickerTape() {
  const indices = useSelector((s) => s.market?.indices || {})
  const stocks  = useSelector((s) => s.market?.stocks  || {})
  const SYMS = ['NIFTY 50','NIFTY BANK','RELIANCE','TCS','HDFCBANK','INFY','ITC','BHARTIARTL','SBIN','ADANIENT']
  const items = [...SYMS, ...SYMS].map((sym) => {
    const q = indices[sym] || stocks[sym]
    return { symbol: SYMBOL_LABELS[sym] || sym, ltp: q?.price || 0, chg: q?.changePct || 0 }
  })
  return (
    <div className="w-full overflow-hidden border-y border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="flex whitespace-nowrap py-2 animate-marquee">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 px-6 font-mono text-xs shrink-0">
            <span className="text-zinc-400">{it.symbol}</span>
            <span className="tabular text-zinc-200">{it.ltp > 0 ? it.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}</span>
            <span className={`flex items-center gap-0.5 ${it.chg >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {it.chg >= 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
              {it.ltp > 0 ? Math.abs(it.chg).toFixed(2) + '%' : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── NavBar ── */
function NavBar({ auth, page, setPage, onLogout }) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <button onClick={() => setPage(auth ? 'dashboard' : 'landing')} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-400 text-zinc-950 font-display font-bold">T</div>
          <span className="font-display text-lg font-semibold tracking-tight text-zinc-50">Trade<span className="text-amber-400">Pro</span></span>
        </button>
        {auth ? (
          <div className="flex items-center gap-1 overflow-x-auto">
            {NAV_BY_ROLE[auth.role]?.map((k) => {
              const meta = NAV_META[k]; const Icon = meta.icon; const active = page === k
              return (
                <button key={k} onClick={() => setPage(k)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition whitespace-nowrap ${active ? 'bg-zinc-800 text-amber-400' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'}`}>
                  <Icon size={15}/> {meta.label}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-400">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot"/> NSE &amp; BSE live</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          {auth ? (
            <>
              <button className="relative rounded-md p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100">
                <Bell size={18}/><span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500"/>
              </button>
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-zinc-100">{auth.name}</div>
                <div className="text-xs text-zinc-500">{ROLES.find(r => r.id === auth.role)?.label}</div>
              </div>
              <button onClick={onLogout} className="rounded-md border border-zinc-800 p-2 text-zinc-400 hover:border-rose-500/50 hover:text-rose-400"><LogOut size={16}/></button>
            </>
          ) : (
            <>
              <button onClick={() => setPage('login')} className="text-sm font-medium text-zinc-300 hover:text-zinc-50">Log in</button>
              <button onClick={() => setPage('register')} className="rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300">Open account</button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-8">
      <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
        <span>© 2026 TradePro — Stock Brokerage &amp; Portfolio Management. All rights reserved.</span>
        <div className="flex gap-4">
          <span className="hover:text-zinc-300 cursor-pointer">Privacy Policy</span>
          <span className="hover:text-zinc-300 cursor-pointer">Terms of Service</span>
          <span className="hover:text-zinc-300 cursor-pointer">SEBI Investor Charter</span>
        </div>
      </div>
    </footer>
  )
}

/* ── Landing ── */
function Landing({ setPage }) {
  return (
    <div className="fade-up">
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-10 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-amber-300 mb-6">
            <Sparkles size={13}/> SEBI-registered stockbroker · NSE &amp; BSE
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-[1.05] tracking-tight text-zinc-50">
            Every order.<br/>Every rupee.<br/><span className="text-amber-400">Accounted for.</span>
          </h1>
          <p className="mt-6 max-w-md text-zinc-400 font-body leading-relaxed">
            A brokerage and portfolio terminal built for margin discipline, T+1 settlement accuracy, and regulatory reporting that never misses a deadline.
          </p>
          <div className="mt-8 flex gap-3">
            <button onClick={() => setPage('register')} className="rounded-md bg-amber-400 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-300 flex items-center gap-2">
              Open a trading account <ChevronRight size={16}/>
            </button>
            <button onClick={() => setPage('login')} className="rounded-md border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-200 hover:border-zinc-500">
              Client / Dealer login
            </button>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
            {[['₹2,840 Cr+','daily turnover'],['4.1L+','active clients'],['<80ms','order routing']].map(([n,l]) => (
              <div key={l}><div className="font-mono text-xl text-zinc-50 tabular">{n}</div><div className="text-xs text-zinc-500">{l}</div></div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-zinc-500 font-mono">PORTFOLIO PERFORMANCE · LIVE</span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot"/> Market open</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={PERFORMANCE}>
              <defs>
                <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.35}/>
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="d" tick={{fill:'#71717a',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis hide domain={['dataMin - 10000','dataMax + 10000']}/>
              <Tooltip contentStyle={{background:'#18181b',border:'1px solid #3f3f46',borderRadius:8,fontSize:12}} labelStyle={{color:'#a1a1aa'}}/>
              <Area type="monotone" dataKey="v" stroke="#fbbf24" strokeWidth={2} fill="url(#heroGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-14 grid sm:grid-cols-3 gap-6">
        {[
          { icon:Gauge,         title:'Real-time margin control',    desc:'Span + exposure margin recomputed continuously with automated square-off at 90% utilisation.' },
          { icon:ShieldCheck,   title:'SEBI-first compliance',       desc:'Daily activity reports, UCC files and CKYC uploads generated in exchange-prescribed format.' },
          { icon:LineChartIcon, title:'Institutional-grade terminal',desc:'Market, limit, stop-loss, bracket and GTT orders with FIX-protocol exchange routing.' },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <f.icon className="text-amber-400 mb-3" size={22}/>
            <h3 className="font-display text-lg text-zinc-100 mb-1.5">{f.title}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

/* ── Auth ── */
function AuthCard({ children, title, sub }) {
  return (
    <div className="mx-auto max-w-md px-6 py-16 fade-up">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
        <h2 className="font-display text-2xl text-zinc-50 mb-1">{title}</h2>
        <p className="text-sm text-zinc-500 mb-6">{sub}</p>
        {children}
      </div>
    </div>
  )
}

function Login({ setPage }) {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((s) => s.auth)
  const [role, setRole] = useState('CLIENT')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const result = await dispatch(loginUser({
      email, password: pw,
      deviceId: navigator.userAgent.slice(0, 64),
      deviceName: `${navigator.platform} Browser`,
      userAgent: navigator.userAgent,
    }))
    // navigation handled by parent shell via Redux state
  }

  return (
    <AuthCard title="Log in" sub="Access your TradePro trading account">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">Sign in as</label>
          <select value={role} onChange={e => setRole(e.target.value)} className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-400">
            {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com"
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-400"/>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">Password</label>
          <div className="relative">
            <input type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••"
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-400 pr-10"/>
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300">
              {show ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
        </div>
        {error && <div className="text-xs text-rose-400 flex items-center gap-1.5"><AlertTriangle size={13}/> {error}</div>}
        <button type="submit" disabled={loading} className="w-full rounded-md bg-amber-400 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-300 disabled:opacity-50">
          {loading ? 'Logging in…' : 'Log in'}
        </button>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 justify-center"><Lock size={12}/> Secured with JWT · TLS 1.3</div>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500">New to TradePro?{' '}
        <button onClick={() => setPage('register')} className="text-amber-400 hover:underline">Open an account</button>
      </p>
    </AuthCard>
  )
}

function Register({ setPage }) {
  const dispatch = useDispatch()
  const { loading } = useSelector((s) => s.auth)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name:'', email:'', phone:'', role:'CLIENT', password:'' })
  const [errs, setErrs] = useState({})
  const [done, setDone] = useState(false)

  const validateStep1 = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Phone must be 10 digits'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Valid email required'
    if (form.password.length < 6) e.password = 'Min 6 characters'
    setErrs(e); return Object.keys(e).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    const result = await dispatch(registerUser({
      name: form.name, email: form.email, phone: form.phone, password: form.password,
      deviceId: navigator.userAgent.slice(0, 64),
      deviceName: `${navigator.platform} Browser`,
      userAgent: navigator.userAgent,
    }))
    if (!result.error) setDone(true)
  }

  if (done) return (
    <AuthCard title="Registration successful!" sub="Please verify your email.">
      <div className="flex flex-col items-center py-6 text-center gap-3">
        <CheckCircle2 className="text-emerald-400" size={40}/>
        <p className="text-sm text-zinc-400">Redirecting to your dashboard…</p>
      </div>
    </AuthCard>
  )

  return (
    <AuthCard title="Open an account" sub={`Step ${step} of 2`}>
      <form onSubmit={step === 2 ? submit : (e) => { e.preventDefault(); if (validateStep1()) setStep(2) }} className="space-y-4">
        {step === 1 ? (
          <>
            {[['name','Full name','Rahul Sharma'],['email','Email','you@email.com'],['phone','Phone','9876543210']].map(([k,l,ph]) => (
              <div key={k}>
                <label className="text-xs text-zinc-500 mb-1.5 block">{l}</label>
                <input value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} placeholder={ph}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-400"/>
                {errs[k] && <p className="text-xs text-rose-400 mt-1">{errs[k]}</p>}
              </div>
            ))}
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Password</label>
              <input type="password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} placeholder="Min 6 characters"
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-400"/>
              {errs.password && <p className="text-xs text-rose-400 mt-1">{errs.password}</p>}
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Register as</label>
              <select value={form.role} onChange={e => setForm({...form,role:e.target.value})} className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-400">
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
          </>
        ) : (
          <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-500 flex gap-2">
            <ShieldCheck size={14} className="text-amber-400 shrink-0 mt-0.5"/>
            DEMAT and PAN verification is mandatory before trading account activation, per SEBI guidelines.
          </div>
        )}
        <div className="flex gap-3 pt-2">
          {step === 2 && <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-md border border-zinc-700 py-2.5 text-sm text-zinc-300 hover:border-zinc-500">Back</button>}
          <button type="submit" disabled={loading} className="flex-1 rounded-md bg-amber-400 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-300 disabled:opacity-50">
            {step === 1 ? 'Continue' : loading ? 'Registering…' : 'Register'}
          </button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500">Already registered?{' '}
        <button onClick={() => setPage('login')} className="text-amber-400 hover:underline">Log in</button>
      </p>
    </AuthCard>
  )
}

/* ── Shared widgets ── */
function StatCard({ label, value, delta, icon:Icon, tone='amber' }) {
  const toneMap = { amber:'text-amber-400', emerald:'text-emerald-400', rose:'text-rose-400', teal:'text-teal-400' }
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wide text-zinc-500">{label}</span>
        <Icon size={16} className={toneMap[tone]}/>
      </div>
      <div className="font-mono text-2xl text-zinc-50 tabular">{value}</div>
      {delta !== undefined && (
        <div className={`mt-1 text-xs font-mono flex items-center gap-1 ${delta >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
          {delta >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>} {delta >= 0 ? '+' : ''}{delta}% today
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }) {
  const map = {
    EXECUTED: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
    PENDING:  'bg-amber-400/10 text-amber-400 border-amber-400/30',
    CANCELLED:'bg-zinc-500/10 text-zinc-400 border-zinc-600/30',
    REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  }
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono ${map[status] || map.PENDING}`}>{status}</span>
}

function RadialGauge({ pct }) {
  const r = 54, c = 2 * Math.PI * r
  const color = pct >= 90 ? '#f43f5e' : pct >= 80 ? '#f59e0b' : '#2dd4bf'
  return (
    <svg viewBox="0 0 140 140" className="w-40 h-40">
      <circle cx="70" cy="70" r={r} stroke="#27272a" strokeWidth="12" fill="none"/>
      <circle cx="70" cy="70" r={r} stroke={color} strokeWidth="12" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (pct/100)*c} transform="rotate(-90 70 70)"/>
      <text x="70" y="66" textAnchor="middle" className="fill-zinc-50" style={{fontSize:24,fontFamily:'IBM Plex Mono'}}>{pct}%</text>
      <text x="70" y="86" textAnchor="middle" className="fill-zinc-500" style={{fontSize:10}}>utilised</text>
    </svg>
  )
}

/* ── Dashboard with live NSE data ── */
function Dashboard({ auth, setPage }) {
  const { indices, stocks, gainers, losers, loading } = useMarketData()
  const { trades, loadTrades } = useTrades()
  useEffect(() => { loadTrades() }, [])

  const holdingsWithLive = HOLDINGS.map(h => ({
    ...h, ltp: stocks[h.symbol]?.price || h.avgCost * 1.05
  }))
  const portfolioValue = holdingsWithLive.reduce((s,h) => s + h.qty * h.ltp, 0)
  const invested       = holdingsWithLive.reduce((s,h) => s + h.qty * h.avgCost, 0)
  const pnl = portfolioValue - invested
  const pnlPct = ((pnl/invested)*100).toFixed(2)

  const nifty = indices['NIFTY 50']

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-zinc-50">Welcome back, {auth.name}</h1>
        <p className="text-zinc-500 mt-1">
          {loading ? 'Connecting to NSE live data…' : nifty ? `NIFTY 50: ${nifty.price.toLocaleString('en-IN')} (${nifty.changePct >= 0 ? '+' : ''}${nifty.changePct.toFixed(2)}%) · Live` : 'Here\'s your portfolio overview.'}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Portfolio value"  value={fmtINR0(portfolioValue)} delta={Number(pnlPct)} icon={Wallet}    tone="amber"/>
        <StatCard label="Unrealised P&L"   value={fmtINR0(pnl)}           delta={Number(pnlPct)} icon={pnl>=0?TrendingUp:TrendingDown} tone={pnl>=0?'emerald':'rose'}/>
        <StatCard label="NIFTY 50"         value={nifty ? nifty.price.toLocaleString('en-IN') : '—'} delta={nifty ? Number(nifty.changePct.toFixed(2)) : undefined} icon={BarChart3} tone="teal"/>
        <StatCard label="Open orders"      value={trades.filter(t=>t.status==='PENDING').length.toString()} icon={ClipboardList} tone="amber"/>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h3 className="font-display text-lg text-zinc-100 mb-4">Portfolio performance</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={PERFORMANCE}>
              <defs>
                <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false}/>
              <XAxis dataKey="d" tick={{fill:'#71717a',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#71717a',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}K`}/>
              <Tooltip contentStyle={{background:'#18181b',border:'1px solid #3f3f46',borderRadius:8,fontSize:12}} labelStyle={{color:'#a1a1aa'}} formatter={v=>fmtINR0(v)}/>
              <Area type="monotone" dataKey="v" stroke="#2dd4bf" strokeWidth={2} fill="url(#dashGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h3 className="font-display text-lg text-zinc-100 mb-4">Top Movers</h3>
          <div className="mb-3">
            <div className="text-xs text-emerald-400 font-mono mb-2">▲ GAINERS</div>
            {(gainers.length ? gainers : [{symbol:'—',changePct:0}]).slice(0,3).map((g,i) => (
              <div key={i} className="flex justify-between text-xs py-1.5 border-b border-zinc-800">
                <span className="text-zinc-300 font-mono">{g.symbol}</span>
                <span className="text-emerald-400 font-mono tabular">+{(g.changePct||0).toFixed(2)}%</span>
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs text-rose-400 font-mono mb-2">▼ LOSERS</div>
            {(losers.length ? losers : [{symbol:'—',changePct:0}]).slice(0,3).map((l,i) => (
              <div key={i} className="flex justify-between text-xs py-1.5 border-b border-zinc-800">
                <span className="text-zinc-300 font-mono">{l.symbol}</span>
                <span className="text-rose-400 font-mono tabular">{(l.changePct||0).toFixed(2)}%</span>
              </div>
            ))}
          </div>
          <button onClick={() => setPage('trade')} className="mt-5 w-full flex items-center justify-center gap-1.5 rounded-md border border-zinc-800 py-2 text-sm text-zinc-300 hover:border-amber-400/50 hover:text-amber-400">
            Go to trading terminal <ChevronRight size={14}/>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Trading Terminal with live prices ── */
function TradingTerminal() {
  const { stocks, indices } = useMarketData()
  const { place, placing, trades } = useTrades()
  const [orders, setOrders] = useState(ORDER_BOOK_SEED)
  const [selSym, setSelSym] = useState('RELIANCE')
  const [side, setSide]     = useState('BUY')
  const [type, setType]     = useState('MARKET')
  const [qty,  setQty]      = useState(10)
  const [price, setPrice]   = useState(0)
  const [toast, setToast]   = useState(null)

  const WATCH_SYMS = ['NIFTY 50','NIFTY BANK','RELIANCE','TCS','HDFCBANK','INFY','ITC','BHARTIARTL','SBIN','ADANIENT']
  const selQ = stocks[selSym] || indices[selSym]
  const ltp  = selQ?.price || 0

  useEffect(() => { setPrice(ltp) }, [selSym, ltp])

  const margin     = 342180
  const orderValue = qty * (type === 'MARKET' ? ltp : price)
  const marginOk   = orderValue <= margin

  const placeOrder = () => {
    if (!marginOk) { setToast({tone:'error',text:'Insufficient margin for this order value.'}); return }
    const o = { id:'ORD'+Math.floor(10000+Math.random()*89999), symbol:selSym, type, side, qty, price:type==='MARKET'?ltp:price, status:'PENDING', time:new Date().toLocaleTimeString('en-IN',{hour12:false}) }
    setOrders([o,...orders])
    place({ symbol:selSym, exchange:'NSE', segment:'EQUITY', orderType:type, side, quantity:qty, price:type==='MARKET'?null:price })
    setToast({tone:'ok',text:`${side} order for ${qty} ${selSym} placed.`})
    setTimeout(() => setOrders(os => os.map(x => x.id===o.id ? {...x,status:'EXECUTED'} : x)), 1600)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 fade-up">
      <h1 className="font-display text-2xl text-zinc-50 mb-6">Trading Terminal</h1>
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Watchlist */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center gap-2 mb-3 px-1"><Search size={14} className="text-zinc-500"/><input placeholder="Search symbol" className="bg-transparent text-sm text-zinc-300 outline-none w-full"/></div>
          <div className="space-y-1 max-h-[520px] overflow-y-auto">
            {WATCH_SYMS.map((sym) => {
              const q  = stocks[sym] || indices[sym]
              const chg = q?.changePct || 0
              return (
                <button key={sym} onClick={() => setSelSym(sym)}
                  className={`w-full flex items-center justify-between rounded-md px-3 py-2.5 text-left transition ${selSym===sym ? 'bg-zinc-800' : 'hover:bg-zinc-900'}`}>
                  <span className="font-mono text-xs text-zinc-200">{SYMBOL_LABELS[sym]||sym}</span>
                  <div className="text-right">
                    <div className="font-mono text-xs tabular text-zinc-100">{q ? q.price.toLocaleString('en-IN',{minimumFractionDigits:2}) : '—'}</div>
                    <div className={`font-mono text-[10px] tabular ${chg>=0?'text-emerald-400':'text-rose-500'}`}>{q ? `${chg>=0?'+':''}${chg.toFixed(2)}%` : '—'}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Order entry */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="mb-4">
            <div className="font-mono text-lg text-zinc-50">{SYMBOL_LABELS[selSym]||selSym}</div>
            <div className={`font-mono text-sm tabular ${(selQ?.changePct||0)>=0?'text-emerald-400':'text-rose-500'}`}>
              {ltp > 0 ? ltp.toLocaleString('en-IN',{minimumFractionDigits:2}) : '—'} {selQ ? `(${selQ.changePct>=0?'+':''}${selQ.changePct.toFixed(2)}%)` : ''}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={() => setSide('BUY')}  className={`rounded-md py-2 text-sm font-semibold ${side==='BUY'  ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}>BUY</button>
            <button onClick={() => setSide('SELL')} className={`rounded-md py-2 text-sm font-semibold ${side==='SELL' ? 'bg-rose-500 text-zinc-950'    : 'bg-zinc-800 text-zinc-400'}`}>SELL</button>
          </div>
          <label className="text-xs text-zinc-500 mb-1.5 block">Order type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full mb-3 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400">
            {['MARKET','LIMIT','STOP_LOSS','BRACKET','GTT'].map(t => <option key={t}>{t}</option>)}
          </select>
          <label className="text-xs text-zinc-500 mb-1.5 block">Quantity</label>
          <input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full mb-3 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400"/>
          {type !== 'MARKET' && (<><label className="text-xs text-zinc-500 mb-1.5 block">Price</label><input type="number" step="0.05" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full mb-3 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400"/></>)}
          <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3 mb-4 text-xs space-y-1.5">
            <div className="flex justify-between text-zinc-500"><span>Order value</span><span className="font-mono text-zinc-300 tabular">{fmtINR(orderValue)}</span></div>
            <div className="flex justify-between text-zinc-500"><span>Available margin</span><span className="font-mono text-zinc-300 tabular">{fmtINR(margin)}</span></div>
            {!marginOk && <div className="flex items-center gap-1 text-rose-400"><AlertTriangle size={12}/> Exceeds available margin</div>}
          </div>
          <button onClick={placeOrder} disabled={placing} className={`w-full rounded-md py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50 ${side==='BUY' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-rose-500 hover:bg-rose-400'}`}>
            {placing ? 'Placing…' : `Place ${side} order`}
          </button>
          {toast && (<div className={`mt-3 rounded-md px-3 py-2 text-xs flex items-center gap-1.5 ${toast.tone==='ok'?'bg-emerald-400/10 text-emerald-400':'bg-rose-500/10 text-rose-400'}`}>{toast.tone==='ok'?<CheckCircle2 size={13}/>:<AlertTriangle size={13}/>} {toast.text}</div>)}
        </div>

        {/* Order book */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 className="font-display text-lg text-zinc-100 mb-4">Order book — today</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
                <th className="pb-2 font-normal">Order ID</th><th className="pb-2 font-normal">Symbol</th>
                <th className="pb-2 font-normal">Type</th><th className="pb-2 font-normal">Side</th>
                <th className="pb-2 font-normal text-right">Qty</th><th className="pb-2 font-normal text-right">Price</th>
                <th className="pb-2 font-normal text-right">Status</th>
              </tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-zinc-900">
                    <td className="py-2.5 font-mono text-xs text-zinc-400">{o.id}</td>
                    <td className="py-2.5 font-mono text-xs text-zinc-200">{o.symbol}</td>
                    <td className="py-2.5 text-xs text-zinc-400">{o.type.replace('_',' ')}</td>
                    <td className={`py-2.5 text-xs font-semibold ${o.side==='BUY'?'text-emerald-400':'text-rose-400'}`}>{o.side}</td>
                    <td className="py-2.5 text-right font-mono text-xs tabular text-zinc-300">{o.qty}</td>
                    <td className="py-2.5 text-right font-mono text-xs tabular text-zinc-300">{Number(o.price).toFixed(2)}</td>
                    <td className="py-2.5 text-right"><StatusPill status={o.status}/></td>
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

/* ── Portfolio ── */
function Portfolio() {
  const { stocks } = useMarketData()
  const rows = HOLDINGS.map(h => {
    const ltp = stocks[h.symbol]?.price || h.avgCost * 1.05
    const value = h.qty * ltp
    const pnl   = (ltp - h.avgCost) * h.qty
    return { ...h, ltp, value, pnl, pnlPct: ((ltp - h.avgCost)/h.avgCost)*100 }
  })
  const totalValue = rows.reduce((s,r) => s+r.value, 0)
  const totalPnl   = rows.reduce((s,r) => s+r.pnl, 0)
  const sectorData = Object.entries(rows.reduce((acc,r) => { acc[r.sector]=(acc[r.sector]||0)+r.value; return acc }, {})).map(([name,value]) => ({name,value}))

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 fade-up">
      <h1 className="font-display text-2xl text-zinc-50 mb-6">Portfolio</h1>
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="Holdings value" value={fmtINR0(totalValue)} icon={Wallet} tone="amber"/>
        <StatCard label="Overall P&L" value={fmtINR0(totalPnl)} delta={Number(((totalPnl/(totalValue-totalPnl))*100).toFixed(2))} icon={totalPnl>=0?TrendingUp:TrendingDown} tone={totalPnl>=0?'emerald':'rose'}/>
        <StatCard label="XIRR since inception" value="18.4%" icon={LineChartIcon} tone="teal"/>
      </div>
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 overflow-x-auto">
          <h3 className="font-display text-lg text-zinc-100 mb-4">Holdings — Live prices</h3>
          <table className="w-full text-sm min-w-[520px]">
            <thead><tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
              <th className="pb-2 font-normal">Symbol</th><th className="pb-2 font-normal text-right">Qty</th>
              <th className="pb-2 font-normal text-right">Avg cost</th><th className="pb-2 font-normal text-right">LTP</th>
              <th className="pb-2 font-normal text-right">Value</th><th className="pb-2 font-normal text-right">P&L</th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.symbol} className="border-b border-zinc-900">
                  <td className="py-2.5"><div className="font-mono text-xs text-zinc-100">{r.symbol}</div><div className="text-[11px] text-zinc-500">{r.name}</div></td>
                  <td className="py-2.5 text-right font-mono text-xs tabular text-zinc-300">{r.qty}</td>
                  <td className="py-2.5 text-right font-mono text-xs tabular text-zinc-300">{r.avgCost.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-mono text-xs tabular text-zinc-300">{r.ltp.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-mono text-xs tabular text-zinc-100">{fmtINR0(r.value)}</td>
                  <td className={`py-2.5 text-right font-mono text-xs tabular ${r.pnl>=0?'text-emerald-400':'text-rose-400'}`}>{r.pnl>=0?'+':''}{fmtINR0(r.pnl)} <span className="text-[10px]">({r.pnlPct.toFixed(1)}%)</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 className="font-display text-lg text-zinc-100 mb-2">Sector allocation</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={sectorData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
              {sectorData.map(s => <Cell key={s.name} fill={SECTOR_COLORS[s.name]} stroke="none"/>)}
            </Pie><Tooltip contentStyle={{background:'#18181b',border:'1px solid #3f3f46',borderRadius:8,fontSize:12}} formatter={v=>fmtINR0(v)}/></PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {sectorData.map(s => (<div key={s.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-zinc-400"><span className="h-2 w-2 rounded-full" style={{background:SECTOR_COLORS[s.name]}}/>{s.name}</span>
              <span className="font-mono text-zinc-300 tabular">{((s.value/totalValue)*100).toFixed(1)}%</span>
            </div>))}
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 overflow-x-auto">
        <h3 className="font-display text-lg text-zinc-100 mb-4">Ledger statement</h3>
        <table className="w-full text-sm min-w-[520px]">
          <thead><tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
            <th className="pb-2 font-normal">Date</th><th className="pb-2 font-normal">Narration</th>
            <th className="pb-2 font-normal text-right">Debit</th><th className="pb-2 font-normal text-right">Credit</th><th className="pb-2 font-normal text-right">Balance</th>
          </tr></thead>
          <tbody>{LEDGER.map((l,i) => (<tr key={i} className="border-b border-zinc-900">
            <td className="py-2.5 font-mono text-xs text-zinc-400">{l.date}</td>
            <td className="py-2.5 text-xs text-zinc-300">{l.narration}</td>
            <td className="py-2.5 text-right font-mono text-xs tabular text-rose-400">{l.debit ? fmtINR(l.debit) : '—'}</td>
            <td className="py-2.5 text-right font-mono text-xs tabular text-emerald-400">{l.credit ? fmtINR(l.credit) : '—'}</td>
            <td className="py-2.5 text-right font-mono text-xs tabular text-zinc-100">{fmtINR(l.balance)}</td>
          </tr>))}</tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Research ── */
function Research() {
  const ratingColor = { BUY:'text-emerald-400 border-emerald-400/30 bg-emerald-400/10', ACCUMULATE:'text-teal-400 border-teal-400/30 bg-teal-400/10', HOLD:'text-amber-400 border-amber-400/30 bg-amber-400/10', SELL:'text-rose-400 border-rose-400/30 bg-rose-400/10' }
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 fade-up">
      <h1 className="font-display text-2xl text-zinc-50 mb-6">Research Portal</h1>
      <div className="grid md:grid-cols-2 gap-5">
        {RESEARCH_REPORTS.map(r => {
          const upside = (((r.target-r.cmp)/r.cmp)*100).toFixed(1)
          return (<div key={r.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="flex items-center justify-between mb-3"><span className="font-mono text-lg text-zinc-50">{r.symbol}</span><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${ratingColor[r.rating]}`}>{r.rating}</span></div>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">{r.thesis}</p>
            <div className="grid grid-cols-3 gap-3 text-xs mb-3">
              <div><div className="text-zinc-500">CMP</div><div className="font-mono tabular text-zinc-100">₹{r.cmp.toFixed(2)}</div></div>
              <div><div className="text-zinc-500">Target</div><div className="font-mono tabular text-zinc-100">₹{r.target}</div></div>
              <div><div className="text-zinc-500">Upside</div><div className="font-mono tabular text-emerald-400">+{upside}%</div></div>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-800"><span>By {r.analyst}</span><button className="text-amber-400 hover:underline flex items-center gap-1">View report <ChevronRight size={12}/></button></div>
          </div>)
        })}
      </div>
    </div>
  )
}

/* ── Margin & Risk ── */
function MarginRisk() {
  const available=342180, utilised=558420, total=available+utilised, pct=Math.round((utilised/total)*100)
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 fade-up">
      <h1 className="font-display text-2xl text-zinc-50 mb-6">Margin &amp; Risk</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col items-center">
          <RadialGauge pct={pct}/>
          <div className="mt-4 w-full grid grid-cols-2 gap-3 text-xs">
            <div><div className="text-zinc-500">Available</div><div className="font-mono tabular text-emerald-400">{fmtINR0(available)}</div></div>
            <div><div className="text-zinc-500">Utilised</div><div className="font-mono tabular text-amber-400">{fmtINR0(utilised)}</div></div>
          </div>
          {pct>=80 && <div className="mt-4 w-full flex items-center gap-2 rounded-md bg-amber-400/10 px-3 py-2 text-xs text-amber-300"><AlertTriangle size={14}/> Margin call issued — top-up before next session.</div>}
        </div>
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h3 className="font-display text-lg text-zinc-100 mb-4">Risk metrics</h3>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {[['Portfolio Beta','1.12'],['Sharpe Ratio','1.48'],['VaR (95%)','₹18,240']].map(([l,v]) => (
              <div key={l} className="rounded-md border border-zinc-800 p-3"><div className="text-xs text-zinc-500 mb-1">{l}</div><div className="font-mono text-lg tabular text-zinc-100">{v}</div></div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[{n:'RELIANCE',exp:34},{n:'TCS',exp:21},{n:'HDFCBANK',exp:24},{n:'INFY',exp:15},{n:'ITC',exp:6}]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false}/>
              <XAxis dataKey="n" tick={{fill:'#71717a',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#71717a',fontSize:11}} axisLine={false} tickLine={false} unit="%"/>
              <Tooltip contentStyle={{background:'#18181b',border:'1px solid #3f3f46',borderRadius:8,fontSize:12}}/>
              <Bar dataKey="exp" fill="#fbbf24" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

/* ── Compliance ── */
function Compliance() {
  const reports = [
    {name:'Daily Activity Report',   status:'Submitted', time:'18:02 IST'},
    {name:'UCC File — new clients',  status:'Submitted', time:'17:40 IST'},
    {name:'CKYC Registry Upload',    status:'Pending',   time:'Due 20:00 IST'},
    {name:'MTF Utilisation Report',  status:'Submitted', time:'16:15 IST'},
    {name:'Margin Shortfall Report', status:'In review', time:'—'},
  ]
  const audit = [
    {user:'dealer.arjun',     action:'Executed BUY order RELIANCE x25',   time:'09:21:04'},
    {user:'risk.neha',        action:'Updated VaR exposure limit to 20%',  time:'10:12:51'},
    {user:'compliance.vivek', action:'Approved research report — TCS',     time:'11:47:20'},
  ]
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 fade-up">
      <h1 className="font-display text-2xl text-zinc-50 mb-6">Compliance &amp; Regulatory</h1>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 className="font-display text-lg text-zinc-100 mb-4">SEBI submission status</h3>
          <div className="space-y-2">{reports.map(r => (
            <div key={r.name} className="flex items-center justify-between rounded-md border border-zinc-800 px-3 py-2.5">
              <div><div className="text-sm text-zinc-200">{r.name}</div><div className="text-xs text-zinc-500">{r.time}</div></div>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${r.status==='Submitted'?'text-emerald-400 border-emerald-400/30 bg-emerald-400/10':r.status==='Pending'?'text-amber-400 border-amber-400/30 bg-amber-400/10':'text-teal-400 border-teal-400/30 bg-teal-400/10'}`}>{r.status}</span>
            </div>
          ))}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 className="font-display text-lg text-zinc-100 mb-4">Audit trail</h3>
          <div className="space-y-3">{audit.map((a,i) => (
            <div key={i} className="flex gap-3 text-sm"><Users size={15} className="text-zinc-500 mt-0.5 shrink-0"/>
              <div className="flex-1"><div className="text-zinc-200">{a.action}</div><div className="text-xs text-zinc-500">{a.user} · {a.time}</div></div>
            </div>
          ))}</div>
        </div>
      </div>
    </div>
  )
}

/* ── App Shell — wires Redux auth to page routing ── */
function AppShell() {
  const dispatch   = useDispatch()
  const { token, user } = useSelector((s) => s.auth)
  const [page, setPage] = useState('landing')

  // Sync auth state with page
  useEffect(() => {
    if (token && user && page === 'landing') setPage('dashboard')
    if (!token && ['dashboard','trade','portfolio','research','margin','compliance'].includes(page)) setPage('landing')
  }, [token])

  const navigateTo = (p) => {
    // Guard protected pages
    if (!token && ['dashboard','trade','portfolio','research','margin','compliance'].includes(p)) {
      setPage('login'); return
    }
    setPage(p)
  }

  const auth = token && user ? { name: user.name?.split(' ')[0] || 'Trader', role: 'CLIENT' } : null

  const onLogout = () => {
    dispatch(logoutUser())
    setPage('landing')
  }

  const pages = {
    landing:    <Landing    setPage={navigateTo} />,
    login:      <Login      setPage={navigateTo} />,
    register:   <Register   setPage={navigateTo} />,
    dashboard:  auth ? <Dashboard   auth={auth} setPage={navigateTo} />  : <Login setPage={navigateTo}/>,
    trade:      auth ? <TradingTerminal />                                : <Login setPage={navigateTo}/>,
    portfolio:  auth ? <Portfolio />                                      : <Login setPage={navigateTo}/>,
    research:   auth ? <Research />                                       : <Login setPage={navigateTo}/>,
    margin:     auth ? <MarginRisk />                                     : <Login setPage={navigateTo}/>,
    compliance: auth ? <Compliance />                                     : <Login setPage={navigateTo}/>,
  }

  return (
    <div className="font-body min-h-screen bg-zinc-950 text-zinc-200 flex flex-col">
      <NavBar auth={auth} page={page} setPage={navigateTo} onLogout={onLogout}/>
      <TickerTape/>
      <main className="flex-1">{pages[page] || pages.landing}</main>
      <Footer/>
    </div>
  )
}

/* ── Root export — wraps Redux Provider ── */
export default function App() {
  return (
    <Provider store={store}>
      <AppShell/>
    </Provider>
  )
}

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  BarChart2, Search, Zap, Shield, Globe, ChevronRight,
  Check, Star,
} from 'lucide-react'

/* ── static data ── */
const TICKER_ITEMS = [
  { sym:'NIFTY 50', price:'24,856.45', chg:'+2.14%', up:true },
  { sym:'SENSEX',   price:'81,240.18', chg:'+1.98%', up:true },
  { sym:'BANK NIFTY',price:'52,341.80',chg:'-1.23%', up:false },
  { sym:'RELIANCE', price:'2,450.40',  chg:'+1.25%', up:true },
  { sym:'TCS',      price:'3,420.15',  chg:'-0.45%', up:false },
  { sym:'INFY',     price:'1,480.20',  chg:'-1.15%', up:false },
  { sym:'HDFCBANK', price:'1,610.80',  chg:'+0.85%', up:true },
  { sym:'SBIN',     price:'780.25',    chg:'-0.80%', up:false },
  { sym:'INDIA VIX',price:'14.82',     chg:'+3.20%', up:true },
]

const FEATURES = [
  { icon:'📈', title:'Live Market Data', desc:'Real-time NSE/BSE prices, indices, gainers and losers updated every 6 seconds.' },
  { icon:'🔍', title:'Stock Screener', desc:'Filter 4,000+ stocks using 50+ fundamental, technical & ownership parameters.' },
  { icon:'💼', title:'Portfolio Tracking', desc:'Live P&L, sector allocation, XIRR, and complete trade history in one place.' },
  { icon:'🌐', title:'US Stocks', desc:'Invest in Apple, NVIDIA, Tesla and 500+ US stocks with live USD/INR pricing.' },
  { icon:'🪙', title:'Digital Gold', desc:'Buy 24K digital gold starting ₹1. Stored in insured vaults, zero storage fees.' },
  { icon:'💰', title:'Mutual Funds', desc:'₹0 commission direct mutual funds. SIP from ₹500. 16,000+ schemes.' },
]

const STATS = [
  { val:'₹2,840 Cr+', label:'Daily Volume' },
  { val:'4.1L+',      label:'Active Clients' },
  { val:'₹0',         label:'Equity Delivery' },
  { val:'50+',        label:'Indices Tracked' },
]

const PLANS = [
  {
    name:'Free', price:'₹0', period:'/forever',
    features:['Equity delivery (₹0)', 'Live market data', 'Portfolio tracking', 'Mutual funds (₹0)', 'Basic screener'],
    cta:'Get Started', highlight:false,
  },
  {
    name:'Pro', price:'₹20', period:'/trade',
    badge:'Most Popular',
    features:['Everything in Free', 'Intraday & F&O', 'Advanced screener', 'US Stocks access', 'Digital Gold', 'GTT orders', 'Priority support'],
    cta:'Start Trading', highlight:true,
  },
]

const TESTIMONIALS = [
  { name:'Priya Sharma', role:'Retail Investor', text:'Switched from Zerodha. The screener alone is worth it — 50+ filters and they actually work.', stars:5 },
  { name:'Rohit Mehta',  role:'Day Trader',      text:'Best execution speed I have seen. Orders hit NSE in under 50ms. Kill switch feature is a lifesaver.', stars:5 },
  { name:'Ananya Iyer',  role:'MF Investor',     text:'₹0 commission on mutual funds and the digital gold SIP is seamless. Great app.', stars:5 },
]

const T = {
  white:'#fff', bg:'#f8f9fa', text:'#1a1a1a', textSub:'#5f6368', textMute:'#9aa0a6',
  border:'#e0e0e0', blue:'#1a73e8', blueBg:'#e8f0fe', green:'#0f9d58', greenBg:'#e8f5e9',
  red:'#ea4335', redBg:'#fce8e6', navy:'#0f1624', gold:'#d97706',
}

export default function LandingPage({ indices }) {
  const navigate = useNavigate()
  const nifty = indices?.['NIFTY 50']
  const bank  = indices?.['NIFTY BANK']
  const vix   = indices?.['INDIA VIX']

  const liveTicker = TICKER_ITEMS.map(item => {
    if (item.sym === 'NIFTY 50' && nifty) return { ...item, price: nifty.price?.toFixed(2) || item.price, chg: `${nifty.changePct >= 0 ? '+' : ''}${nifty.changePct?.toFixed(2)}%`, up: nifty.changePct >= 0 }
    if (item.sym === 'BANK NIFTY' && bank) return { ...item, price: bank.price?.toFixed(2) || item.price, chg: `${bank.changePct >= 0 ? '+' : ''}${bank.changePct?.toFixed(2)}%`, up: bank.changePct >= 0 }
    return item
  })

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', minHeight: '100vh', background: T.white }}>

      {/* ── Top Nav ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: T.blue, display: 'grid', placeItems: 'center' }}>
              <TrendingUp size={15} color="#fff" />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: '-0.4px' }}>TradePro</span>
          </div>
          <nav style={{ display: 'flex', gap: 4, marginLeft: 20 }}>
            {['Markets', 'Screener', 'Mutual Funds', 'US Stocks', 'Pricing'].map(link => (
              <button key={link} style={{ padding: '6px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: T.textSub, borderRadius: 6 }}
                onMouseEnter={e => { e.currentTarget.style.background = T.bg; e.currentTarget.style.color = T.text }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = T.textSub }}
                onClick={() => navigate(link === 'Pricing' ? '/dashboard/pricing' : '/login')}
              >{link}</button>
            ))}
          </nav>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => navigate('/login')} style={{ padding: '7px 16px', border: `1px solid ${T.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: T.text }}>Sign In</button>
            <button onClick={() => navigate('/register')} style={{ padding: '7px 16px', border: 'none', borderRadius: 7, background: T.blue, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', boxShadow: '0 2px 8px rgba(26,115,232,.25)' }}>Get Started</button>
          </div>
        </div>
      </header>

      {/* ── Ticker strip ── */}
      <div style={{ marginTop: 56, background: T.navy, height: 36, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'inline-flex', animation: 'lpTicker 50s linear infinite', whiteSpace: 'nowrap' }}>
          {[...liveTicker, ...liveTicker, ...liveTicker].map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 20px', borderRight: '1px solid rgba(255,255,255,.1)', fontSize: 12 }}>
              <span style={{ color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>{item.sym}</span>
              <span style={{ color: '#fff', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{item.price}</span>
              <span style={{ color: item.up ? '#4ade80' : '#f87171', fontWeight: 700 }}>{item.up ? '▲' : '▼'} {item.chg}</span>
            </span>
          ))}
        </div>
        <style>{`@keyframes lpTicker { 0%{transform:translateX(0)} 100%{transform:translateX(-33.333%)} }`}</style>
      </div>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px 64px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: T.blueBg, border: `1px solid ${T.blue}30`, marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, display: 'inline-block' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: T.blue }}>NSE & BSE · Live Data · Free Delivery</span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px,4vw,54px)', fontWeight: 800, color: T.text, lineHeight: 1.1, letterSpacing: '-0.5px', marginBottom: 20 }}>
            The professional<br /><span style={{ color: T.blue }}>trading platform</span><br />for India.
          </h1>
          <p style={{ fontSize: 16, color: T.textSub, lineHeight: 1.7, marginBottom: 32, maxWidth: 460 }}>
            Real-time NSE/BSE data, institutional-grade order execution, stock screener, portfolio analytics, mutual funds — all in one place.
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} style={{ padding: '12px 28px', borderRadius: 8, background: T.blue, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              Start for free <ChevronRight size={15} />
            </button>
            <button onClick={() => navigate('/login')} style={{ padding: '12px 24px', borderRadius: 8, background: 'none', border: `1px solid ${T.border}`, color: T.text, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Sign In
            </button>
          </div>
          {/* Live index chips */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              ['NIFTY 50', nifty],
              ['BANK NIFTY', bank],
              ['INDIA VIX', vix],
            ].map(([label, q]) => (
              <div key={label} style={{ padding: '8px 14px', borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.textMute }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: T.text, fontVariantNumeric: 'tabular-nums' }}>
                  {q ? q.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                </span>
                {q && <span style={{ fontSize: 11, fontWeight: 700, color: q.changePct >= 0 ? T.green : T.red }}>
                  {q.changePct >= 0 ? '▲' : '▼'}{Math.abs(q.changePct).toFixed(2)}%
                </span>}
              </div>
            ))}
          </div>
        </div>

        {/* Hero card visual */}
        <div style={{ position: 'relative' }}>
          <div style={{ background: T.navy, borderRadius: 20, padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: T.blue, display: 'grid', placeItems: 'center' }}>
                <TrendingUp size={14} color="#fff" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>TradePro Dashboard</span>
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#4ade80', fontWeight: 700 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />LIVE
              </span>
            </div>
            {/* Mini stock rows */}
            {[
              { sym: 'RELIANCE', price: '₹2,450', chg: '+1.25%', up: true },
              { sym: 'TCS',      price: '₹3,420', chg: '-0.45%', up: false },
              { sym: 'HDFCBANK', price: '₹1,610', chg: '+0.85%', up: true },
              { sym: 'INFY',     price: '₹1,480', chg: '-1.15%', up: false },
            ].map(s => (
              <div key={s.sym} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{s.sym}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>NSE · Equity</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{s.price}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: s.up ? '#4ade80' : '#f87171' }}>{s.chg}</div>
                </div>
              </div>
            ))}
            {/* Bottom cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
              <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 10, padding: '12px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>PORTFOLIO P&L</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#4ade80' }}>+₹2,34,800</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 10, padding: '12px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>ORDERS TODAY</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>12</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div style={{ background: T.bg, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ padding: '24px', borderRight: i < 3 ? `1px solid ${T.border}` : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: T.blue, letterSpacing: '-0.5px' }}>{s.val}</div>
              <div style={{ fontSize: 12, color: T.textMute, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: T.text, letterSpacing: '-0.5px', marginBottom: 12 }}>Everything in one terminal</h2>
          <p style={{ fontSize: 16, color: T.textSub }}>Built for traders who demand precision and speed.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '24px', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.blue; e.currentTarget.style.boxShadow = '0 4px 20px rgba(26,115,232,.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: T.textSub, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ background: T.bg, padding: '72px 24px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: T.text, letterSpacing: '-0.5px', marginBottom: 12 }}>Simple, transparent pricing</h2>
            <p style={{ fontSize: 16, color: T.textSub }}>No hidden charges. No annual fee. No surprises.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {PLANS.map(p => (
              <div key={p.name} style={{
                background: p.highlight ? T.navy : T.white,
                border: `1.5px solid ${p.highlight ? T.navy : T.border}`,
                borderRadius: 16, padding: '28px', position: 'relative',
              }}>
                {p.badge && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: T.blue, color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 20 }}>{p.badge}</div>
                )}
                <div style={{ fontSize: 13, fontWeight: 700, color: p.highlight ? 'rgba(255,255,255,.6)' : T.textMute, marginBottom: 8 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: p.highlight ? '#fff' : T.text }}>{p.price}</span>
                  <span style={{ fontSize: 13, color: p.highlight ? 'rgba(255,255,255,.5)' : T.textMute }}>{p.period}</span>
                </div>
                <div style={{ height: 1, background: p.highlight ? 'rgba(255,255,255,.1)' : T.border, margin: '16px 0' }} />
                {p.features.map(feat => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Check size={14} color={p.highlight ? '#4ade80' : T.green} />
                    <span style={{ fontSize: 13, color: p.highlight ? 'rgba(255,255,255,.8)' : T.textSub }}>{feat}</span>
                  </div>
                ))}
                <button onClick={() => navigate('/register')} style={{
                  width: '100%', marginTop: 20, padding: '11px', borderRadius: 8,
                  background: p.highlight ? T.blue : T.text, border: 'none', color: '#fff',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>{p.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: T.text, letterSpacing: '-0.5px' }}>Trusted by investors</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '24px' }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
                {Array.from({ length: t.stars }).map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.7, marginBottom: 16 }}>"{t.text}"</p>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{t.name}</div>
                <div style={{ fontSize: 11, color: T.textMute }}>{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ background: T.navy, padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 16 }}>Start trading in 2 minutes</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', marginBottom: 32 }}>Join 4.1 lakh+ investors already on TradePro.</p>
        <button onClick={() => navigate('/register')} style={{ padding: '14px 36px', borderRadius: 9, background: T.blue, border: 'none', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Open Free Account <ChevronRight size={16} />
        </button>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: T.white, borderTop: `1px solid ${T.border}`, padding: '40px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: T.blue, display: 'grid', placeItems: 'center' }}>
                <TrendingUp size={14} color="#fff" />
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>TradePro</span>
            </div>
            <p style={{ fontSize: 12, color: T.textMute, lineHeight: 1.7 }}>SEBI registered broker. Equity delivery free.</p>
          </div>
          {[
            { title: 'Products', links: ['Stocks', 'Mutual Funds', 'US Stocks', 'Digital Gold', 'F&O'] },
            { title: 'Tools', links: ['Screener', 'Portfolio', 'Watchlist', 'Market News', 'Alerts'] },
            { title: 'Company', links: ['About', 'Pricing', 'Blog', 'Careers', 'Contact'] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>{col.title}</div>
              {col.links.map(link => (
                <div key={link} style={{ fontSize: 13, color: T.textSub, marginBottom: 6, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color = T.blue}
                  onMouseLeave={e => e.currentTarget.style.color = T.textSub}
                >{link}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1200, margin: '28px auto 0', paddingTop: 20, borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 11.5, color: T.textMute }}>© 2026 TradePro Technologies Pvt. Ltd. · SEBI Reg. No. INZ000000000 · NSE · BSE · MCX</p>
          <p style={{ fontSize: 11.5, color: T.textMute }}>Investments in securities are subject to market risk. Read all documents carefully.</p>
        </div>
      </footer>
    </div>
  )
}

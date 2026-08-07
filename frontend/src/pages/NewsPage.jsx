import React, { useState, useMemo } from 'react'
import { Search, Clock, TrendingUp, TrendingDown, X, ExternalLink, RefreshCw } from 'lucide-react'

const T = {
  white: '#ffffff', bg: '#f8f9fa', surface: '#ffffff',
  border: '#e0e0e0', border2: '#f0f0f0',
  text: '#1a1a1a', textSub: '#5f6368', textMute: '#9aa0a6',
  green: '#0f9d58', greenBg: '#e8f5e9',
  red: '#ea4335', redBg: '#fce8e6',
  blue: '#1a73e8', blueBg: '#e8f0fe',
  gold: '#d97706', goldBg: '#fef3c7',
  navy: '#1a1a1a',
}

const ALL_NEWS = [
  { id:1,  cat:'Economy',    title:'RBI holds repo rate at 6.5%; upgrades GDP forecast to 7.2% for FY26', source:'Economic Times', time:'2h ago', sentiment:'positive', img:'🏦', tags:['RBI','Interest Rate','GDP'] },
  { id:2,  cat:'Results',    title:'Reliance Industries Q1 net profit surges 18% YoY on retail & Jio growth', source:'Business Standard', time:'1h ago', sentiment:'positive', img:'⛽', tags:['RELIANCE','Q1FY26','Earnings'] },
  { id:3,  cat:'Regulatory', title:'SEBI releases framework for algorithmic trading by retail investors', source:'Mint', time:'3h ago', sentiment:'neutral', img:'📋', tags:['SEBI','Algo Trading','Regulation'] },
  { id:4,  cat:'Deal',       title:'TCS bags $2.1 billion multi-year outsourcing deal from European bank', source:'Reuters', time:'4h ago', sentiment:'positive', img:'💼', tags:['TCS','Deal','IT'] },
  { id:5,  cat:'Markets',    title:'Sensex crosses 84,000 as FIIs pump ₹6,240 Cr in single session', source:'CNBC-TV18', time:'30m ago', sentiment:'positive', img:'📈', tags:['Sensex','FII','Bull Run'] },
  { id:6,  cat:'Banking',    title:'HDFC Bank NPA improves to 1.12%; provisions fall 28% sequentially', source:'Financial Express', time:'2h ago', sentiment:'positive', img:'🏛️', tags:['HDFCBANK','NPA','Banking'] },
  { id:7,  cat:'Markets',    title:'Adani Group stocks rally 3–7% after MSCI index inclusion confirmation', source:'Bloomberg Quint', time:'5h ago', sentiment:'positive', img:'🏗️', tags:['ADANI','MSCI','Index'] },
  { id:8,  cat:'Commodities',title:'Gold hits record ₹98,450 per 10g on global uncertainty and dollar weakness', source:'MCX Live', time:'1h ago', sentiment:'positive', img:'🪙', tags:['Gold','MCX','Commodities'] },
  { id:9,  cat:'Results',    title:'Infosys cuts revenue guidance to 3.75–4.5% citing deal ramp-up delays', source:'ET Markets', time:'3h ago', sentiment:'negative', img:'💻', tags:['INFY','Guidance','IT'] },
  { id:10, cat:'Economy',    title:"India's manufacturing PMI rises to 59.1 — highest in 16 years", source:'S&P Global', time:'6h ago', sentiment:'positive', img:'🏭', tags:['PMI','Manufacturing','Economy'] },
  { id:11, cat:'US Markets', title:"NVIDIA crosses $3.6T market cap, overtakes Apple as world's most valuable", source:'WSJ', time:'2h ago', sentiment:'positive', img:'🖥️', tags:['NVDA','US Markets','Tech'] },
  { id:12, cat:'Economy',    title:'Fed signals two rate cuts in H2 2026 as inflation cools below 2.4%', source:'Fed Watch', time:'4h ago', sentiment:'positive', img:'🇺🇸', tags:['Fed','Rate Cut','Inflation'] },
  { id:13, cat:'US Markets', title:'Apple Vision Pro 2 unveiled with M4 chip — pre-orders open next week', source:'9to5Mac', time:'1h ago', sentiment:'positive', img:'🍎', tags:['AAPL','Product Launch','Tech'] },
  { id:14, cat:'Banking',    title:'Bajaj Finance AUM crosses ₹4.8 lakh crore; NPA stable at 0.46%', source:'Bajaj IR', time:'5h ago', sentiment:'positive', img:'🏦', tags:['BAJFINANCE','AUM','NBFC'] },
  { id:15, cat:'Commodities',title:'Crude oil slides 2% on surprise US inventory build and OPEC+ supply hike', source:'Reuters', time:'3h ago', sentiment:'negative', img:'🛢️', tags:['Crude Oil','OPEC','Energy'] },
  { id:16, cat:'Markets',    title:'NIFTY 50 closes above 24,800 — fourth consecutive week of gains', source:'NSE India', time:'7h ago', sentiment:'positive', img:'📊', tags:['NIFTY','Weekly','Markets'] },
  { id:17, cat:'IPO',        title:'Swiggy IPO subscribed 3.6x on final day; GMP surges to ₹42 over issue price', source:'IPO Watch', time:'8h ago', sentiment:'positive', img:'🛵', tags:['IPO','Swiggy','Listing'] },
  { id:18, cat:'Economy',    title:'GST collections hit record ₹2.37 lakh crore in June 2026', source:'Finance Ministry', time:'9h ago', sentiment:'positive', img:'💰', tags:['GST','Tax','Revenue'] },
  { id:19, cat:'Results',    title:'Maruti Suzuki Q1 PAT up 35% — record sales across SUV segment', source:'Autocar India', time:'10h ago', sentiment:'positive', img:'🚗', tags:['MARUTI','Q1FY26','Auto'] },
  { id:20, cat:'Regulatory', title:'IRDAI mandates digital-first insurance policy issuance from October 2026', source:'Insurance Times', time:'11h ago', sentiment:'neutral', img:'📄', tags:['IRDAI','Insurance','Regulation'] },
]

const CATS = ['All','Markets','Economy','Results','Banking','US Markets','Commodities','Regulatory','Deal','IPO']
const SENTIMENT_MAP = { positive: { color: T.green, bg: T.greenBg, label: '▲ Bullish' }, negative: { color: T.red, bg: T.redBg, label: '▼ Bearish' }, neutral: { color: T.gold, bg: T.goldBg, label: '● Neutral' } }

const TRENDING = [
  { sym: 'RELIANCE', chg: '+1.8%', pos: true },
  { sym: 'TCS',      chg: '+0.9%', pos: true },
  { sym: 'INFY',     chg: '-1.2%', pos: false },
  { sym: 'HDFCBANK', chg: '+0.6%', pos: true },
  { sym: 'ADANIENT', chg: '+3.1%', pos: true },
  { sym: 'BAJFINANCE',chg:'+2.4%', pos: true },
]

const TICKER_LINES = [
  '● NIFTY 50 at 24,850 +0.52%',
  '● SENSEX at 81,240 +0.48%',
  '● Gold ₹98,450 +0.84%',
  '● USD/INR ₹83.80',
  '● Crude Oil $83.6/bbl -0.62%',
  '● RELIANCE +1.8%',
  '● TCS +0.9%',
  '● HDFC BANK +0.6%',
]

export default function NewsPage() {
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')
  const [featured, setFeatured] = useState(ALL_NEWS[4])

  const filtered = useMemo(() => {
    let arr = ALL_NEWS
    if (cat !== 'All') arr = arr.filter(n => n.cat === cat)
    if (search.trim()) {
      const q = search.toLowerCase()
      arr = arr.filter(n => n.title.toLowerCase().includes(q) || n.source.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q)))
    }
    return arr
  }, [cat, search])

  const sentimentCounts = useMemo(() => {
    const c = { positive: 0, negative: 0, neutral: 0 }
    ALL_NEWS.forEach(n => { c[n.sentiment]++ })
    return c
  }, [])

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>

      {/* Live Ticker Bar */}
      <div style={{ background: T.navy, height: 36, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ background: '#e53935', padding: '0 14px', height: '100%', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>● LIVE</span>
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{ display: 'inline-flex', gap: 0, animation: 'newsScroll 45s linear infinite', whiteSpace: 'nowrap' }}>
            {[...TICKER_LINES, ...TICKER_LINES, ...TICKER_LINES].map((line, i) => (
              <span key={i} style={{ color: 'rgba(255,255,255,.8)', fontSize: 11.5, padding: '0 28px', borderRight: '1px solid rgba(255,255,255,.1)' }}>{line}</span>
            ))}
          </div>
        </div>
        <style>{`@keyframes newsScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-33.333%)} }`}</style>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: 0 }}>Market News & Events</h1>
            <p style={{ fontSize: 13, color: T.textMute, margin: '4px 0 0' }}>Latest financial news, corporate events and economic updates</p>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 7, background: T.blueBg, border: `1px solid ${T.blue}30`, color: T.blue, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Featured story */}
        <div style={{ background: T.navy, borderRadius: 14, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer' }}>
          <div style={{ fontSize: 56 }}>{featured.img}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ background: T.blue, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>FEATURED</span>
              <span style={{ ...SENTIMENT_MAP[featured.sentiment], fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'rgba(255,255,255,.1)', color: SENTIMENT_MAP[featured.sentiment]?.color === T.green ? '#4ade80' : SENTIMENT_MAP[featured.sentiment]?.color === T.red ? '#f87171' : '#fbbf24' }}>{SENTIMENT_MAP[featured.sentiment]?.label}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginLeft: 'auto' }}>{featured.time}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.45, marginBottom: 8 }}>{featured.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>{featured.source}</span>
              {featured.tags.map(t => (
                <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>{t}</span>
              ))}
              <ExternalLink size={13} color="rgba(255,255,255,.4)" style={{ marginLeft: 'auto' }} />
            </div>
          </div>
        </div>

        {/* Filters row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 5, flex: 1, flexWrap: 'wrap' }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{
                padding: '5px 12px', borderRadius: 20,
                border: `1px solid ${cat === c ? T.blue : T.border}`,
                background: cat === c ? T.blueBg : T.white,
                color: cat === c ? T.blue : T.textSub,
                fontSize: 12.5, fontWeight: cat === c ? 700 : 500,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>{c}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', minWidth: 220 }}>
            <Search size={13} color={T.textMute} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search news…"
              style={{ border: 'none', background: 'none', outline: 'none', fontSize: 12.5, color: T.text, width: '100%' }} />
            {search && <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={12} color={T.textMute} /></button>}
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

          {/* News list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, color: T.textMute, marginBottom: 4 }}>{filtered.length} stories</div>
            {filtered.length === 0 && (
              <div style={{ background: T.white, borderRadius: 10, border: `1px solid ${T.border}`, padding: 40, textAlign: 'center', color: T.textMute }}>No news found matching your filters.</div>
            )}
            {filtered.map(n => {
              const s = SENTIMENT_MAP[n.sentiment]
              return (
                <div key={n.id} onClick={() => setFeatured(n)} style={{
                  background: T.white, borderRadius: 10, border: `1px solid ${featured.id === n.id ? T.blue : T.border}`,
                  padding: '14px 16px', cursor: 'pointer', transition: 'all .15s',
                  boxShadow: featured.id === n.id ? `0 0 0 2px ${T.blueBg}` : 'none',
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.07)'; e.currentTarget.style.borderColor = T.border }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = featured.id === n.id ? `0 0 0 2px ${T.blueBg}` : 'none'; e.currentTarget.style.borderColor = featured.id === n.id ? T.blue : T.border }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{n.img}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: T.blueBg, color: T.blue }}>{n.cat}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: s.bg, color: s.color }}>{s.label}</span>
                        <span style={{ fontSize: 11, color: T.textMute, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={10} />{n.time}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1.5, marginBottom: 6 }}>{n.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11.5, color: T.textMute, fontWeight: 600 }}>{n.source}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {n.tags.slice(0, 2).map(t => (
                            <span key={t} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: T.bg, color: T.textSub, fontWeight: 600, border: `1px solid ${T.border}` }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Market Sentiment */}
            <div style={{ background: T.white, borderRadius: 10, border: `1px solid ${T.border}`, padding: '16px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 14 }}>Market Sentiment</div>
              {[['Bullish', 'positive', sentimentCounts.positive], ['Bearish', 'negative', sentimentCounts.negative], ['Neutral', 'neutral', sentimentCounts.neutral]].map(([label, key, count]) => {
                const s = SENTIMENT_MAP[key]
                const pct = Math.round((count / ALL_NEWS.length) * 100)
                return (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{label}</span>
                      <span style={{ fontSize: 11, color: T.textMute }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 4, background: T.border, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 4, transition: 'width .4s' }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Trending stocks */}
            <div style={{ background: T.white, borderRadius: 10, border: `1px solid ${T.border}`, padding: '16px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 12 }}>In the News</div>
              {TRENDING.map(s => (
                <div key={s.sym} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border2}` }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>{s.sym}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.pos ? T.green : T.red, background: s.pos ? T.greenBg : T.redBg, padding: '2px 8px', borderRadius: 5 }}>{s.chg}</span>
                </div>
              ))}
            </div>

            {/* Upcoming events */}
            <div style={{ background: T.white, borderRadius: 10, border: `1px solid ${T.border}`, padding: '16px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 12 }}>Upcoming Events</div>
              {[
                { date: 'Aug 5', event: 'RBI MPC Meeting', type: 'macro' },
                { date: 'Aug 8', event: 'HDFC Bank Q1 Results', type: 'results' },
                { date: 'Aug 12', event: 'CPI Inflation Data', type: 'macro' },
                { date: 'Aug 15', event: 'INFY Dividend Ex-date', type: 'dividend' },
                { date: 'Aug 19', event: 'Fed FOMC Minutes', type: 'macro' },
              ].map((ev, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < 4 ? `1px solid ${T.border2}` : 'none' }}>
                  <div style={{ flexShrink: 0, width: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.textMute, textTransform: 'uppercase' }}>{ev.date.split(' ')[0]}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.blue }}>{ev.date.split(' ')[1]}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.event}</div>
                    <div style={{ fontSize: 10, color: T.textMute, fontWeight: 600, textTransform: 'capitalize' }}>{ev.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

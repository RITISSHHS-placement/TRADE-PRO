import React, { useState, useMemo } from 'react'
import { Search, Clock, TrendingUp, TrendingDown, X, ExternalLink, RefreshCw, Bell, CalendarDays } from 'lucide-react'
import CompanyLogo from '../components/CompanyLogo'
import { TitleBar, Section, Pill } from '../components/primitive'
import styles from './NewsPage.module.css'

const T = {
  bg: '#f8f9fa', text: '#1a1a2e', textSub: '#5f6368', textMute: '#9aa0a6',
  green: '#22c55e', greenBg: 'rgba(34,197,94,0.08)',
  red: '#ef4444', redBg: 'rgba(239,68,68,0.08)',
  blue: '#1a73e8', blueBg: 'rgba(26,115,232,0.08)',
  gold: '#f59e0b', goldBg: 'rgba(245,158,11,0.08)',
}

/* ── All data preserved verbatim from the original page ── */
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

const CATS = ['All', 'Markets', 'Economy', 'Results', 'Banking', 'US Markets', 'Commodities', 'Regulatory', 'Deal', 'IPO']
const SENTIMENT_MAP = {
  positive: { color: T.green, bg: T.greenBg, label: '▲ Bullish', variant: 'up' },
  negative: { color: T.red, bg: T.redBg, label: '▼ Bearish', variant: 'down' },
  neutral:  { color: T.gold, bg: T.goldBg, label: '● Neutral', variant: 'amber' },
}
const TRENDING = [
  { sym: 'RELIANCE', chg: '+1.8%', pos: true },
  { sym: 'TCS',      chg: '+0.9%', pos: true },
  { sym: 'INFY',     chg: '-1.2%', pos: false },
  { sym: 'HDFCBANK', chg: '+0.6%', pos: true },
  { sym: 'ADANIENT', chg: '+3.1%', pos: true },
  { sym: 'BAJFINANCE', chg: '+2.4%', pos: true },
]
const TICKER_LINES = [
  '● NIFTY 50 at 24,850 +0.52%', '● SENSEX at 81,240 +0.48%', '● Gold ₹98,450 +0.84%',
  '● USD/INR ₹83.80', '● Crude Oil $83.6/bbl -0.62%', '● RELIANCE +1.8%',
  '● TCS +0.9%', '● HDFC BANK +0.6%',
]
const EVENTS = [
  { date: 'Aug 5', event: 'RBI MPC Meeting', type: 'macro' },
  { date: 'Aug 8', event: 'HDFC Bank Q1 Results', type: 'results' },
  { date: 'Aug 12', event: 'CPI Inflation Data', type: 'macro' },
  { date: 'Aug 15', event: 'INFY Dividend Ex-date', type: 'dividend' },
  { date: 'Aug 19', event: 'Fed FOMC Minutes', type: 'macro' },
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
    <div className={styles.page}>
      {/* News ticker bar */}
      <div className={styles.tickerBar}>
        <span className={styles.tickerLive}>● LIVE</span>
        <div className={styles.tickerTrack}>
          {[...TICKER_LINES, ...TICKER_LINES].map((line, i) => (
            <span key={i} className={styles.tickerLine}>{line}</span>
          ))}
        </div>
      </div>

      <div className={styles.wrap}>
        <TitleBar title="Market News" subtitle="Latest financial news, corporate events and economic updates">
          <button className={styles.refreshBtn}><RefreshCw size={13} /> Refresh</button>
        </TitleBar>

        {/* Featured story */}
        <div className={styles.featured} onClick={() => setFeatured(featured)}>
          <div className={styles.featuredImg}>{featured.img}</div>
          <div className={styles.featuredBody}>
            <div className={styles.featuredHead}>
              <Pill variant="brand" size="sm">FEATURED</Pill>
              <Pill variant={SENTIMENT_MAP[featured.sentiment].variant} size="sm">{SENTIMENT_MAP[featured.sentiment].label}</Pill>
              <span className={styles.featuredTime}>{featured.time}</span>
            </div>
            <div className={styles.featuredTitle}>{featured.title}</div>
            <div className={styles.featuredMeta}>
              <span className={styles.featuredSource}>{featured.source}</span>
              {featured.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
              <ExternalLink size={13} className={styles.featuredLink} />
            </div>
          </div>
        </div>

        <div className={styles.mainGrid}>
          {/* News list */}
          <div className={styles.newsList}>
            <div className={styles.listMeta}>{filtered.length} stories</div>
            {filtered.length === 0 ? (
              <div className={styles.empty}>No news found matching your filters.</div>
            ) : (
              filtered.map(n => {
                const s = SENTIMENT_MAP[n.sentiment]
                const isSel = featured?.id === n.id
                return (
                  <div
                    key={n.id}
                    className={`${styles.newsCard} ${isSel ? styles.newsCardSel : ''}`}
                    onClick={() => setFeatured(n)}
                  >
                    <div className={styles.newsImg}>{n.img}</div>
                    <div className={styles.newsBody}>
                      <div className={styles.newsHead}>
                        <Pill variant="brand" size="sm">{n.cat}</Pill>
                        <Pill variant={s.variant} size="sm">{s.label}</Pill>
                        <span className={styles.newsTime}><Clock size={10} /> {n.time}</span>
                      </div>
                      <div className={styles.newsTitle}>{n.title}</div>
                      <div className={styles.newsSource}>
                        <span>{n.source}</span>
                        <div className={styles.newsTags}>
                          {n.tags.slice(0, 2).map(t => <span key={t} className={styles.miniTag}>{t}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            <Section title="Market Sentiment" noBorder>
              {[['Bullish', 'positive'], ['Bearish', 'negative'], ['Neutral', 'neutral']].map(([lbl, key]) => {
                const s = SENTIMENT_MAP[key]
                const count = sentimentCounts[key]
                const pct = Math.round((count / ALL_NEWS.length) * 100)
                return (
                  <div key={lbl} className={styles.sentimentRow}>
                    <div className={styles.sentimentRowTop}>
                      <span className={styles.sentimentLabel} style={{ color: s.color }}>{lbl}</span>
                      <span className={styles.sentimentPct}>{count} ({pct}%)</span>
                    </div>
                    <div className={styles.sentimentBar}><span className={styles.sentimentFill} style={{ width: `${pct}%`, background: s.color }} /></div>
                  </div>
                )
              })}
            </Section>

            <Section title="In the News" noBorder>
              {TRENDING.map(s => (
                <div key={s.sym} className={styles.trendingRow}>
                  <div className={styles.trendingLeft}>
                    <CompanyLogo symbol={s.sym} name={s.sym} size={24} borderRadius={5} />
                    <span className={styles.trendingSym}>{s.sym}</span>
                  </div>
                  <Pill variant={s.pos ? 'up' : 'down'}>{s.chg}</Pill>
                </div>
              ))}
            </Section>

            <Section title="Upcoming Events" noBorder>
              {EVENTS.map((ev, i) => (
                <div key={i} className={styles.eventRow}>
                  <div className={styles.eventDate}>
                    <span className={styles.eventDay}>{ev.date.split(' ')[0]}</span>
                    <span className={styles.eventNum}>{ev.date.split(' ')[1]}</span>
                  </div>
                  <div className={styles.eventMain}>
                    <div className={styles.eventName}>{ev.event}</div>
                    <div className={styles.eventType}>{ev.type}</div>
                  </div>
                </div>
              ))}
            </Section>
          </div>
        </div>
      </div>
    </div>
  )
}

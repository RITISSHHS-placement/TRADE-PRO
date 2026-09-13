import React, { useState, useMemo, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { IndianRupee } from 'lucide-react'
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Search, Filter, Star, ChevronRight, BarChart2, Shield,
  Zap, Clock, PieChart, Globe,
} from 'lucide-react'
import CompanyLogo from '../components/CompanyLogo'

const T = {
  bg: '#f8f9fa', white: '#ffffff',
  border: '#e8eaed', border2: '#f0f0f0',
  text: '#1a1a2e', textSub: '#5f6368', textMute: '#9aa0a6',
  green: '#22c55e', greenBg: 'rgba(34,197,94,0.08)', greenDark: '#16a34a',
  red: '#ef4444', redBg: 'rgba(239,68,68,0.08)',
  blue: '#1a73e8', blueBg: 'rgba(26,115,232,0.08)',
  amber: '#f59e0b', amberBg: 'rgba(245,158,11,0.08)',
  purple: '#8b5cf6', purpleBg: 'rgba(139,92,246,0.08)',
}

const SMALLCASES = [
  {
    id: 1, name: 'All Weather Investing', category: 'Model Portfolio', risk: 'Moderate',
    return1y: 18.5, return3y: 42.8, return5y: 68.2, minInvest: 5000,
    holdings: 15, description: 'A balanced portfolio across equity, debt, and gold for all market conditions.',
    tags: ['Diversified', 'Low Risk', 'Long Term'], aum: '₹2,450 Cr', rating: 4.8,
    stocks: ['NIFTY BEES', 'JUNIOR BEES', 'GOLDBEES', 'LIQUIDBEES'],
  },
  {
    id: 2, name: 'Tax Saver', category: 'ELSS', risk: 'High',
    return1y: 24.2, return3y: 58.4, return5y: 92.1, minInvest: 500,
    holdings: 25, description: 'Tax-saving equity mutual funds with 3-year lock-in under Section 80C.',
    tags: ['Tax Saving', 'ELSS', 'High Growth'], aum: '₹1,820 Cr', rating: 4.6,
    stocks: ['HDFCBANK', 'ICICIBANK', 'INFY', 'TCS', 'RELIANCE'],
  },
  {
    id: 3, name: 'Momentum 20', category: 'Quant', risk: 'Very High',
    return1y: 45.8, return3y: 128.5, return5y: 0, minInvest: 10000,
    holdings: 20, description: 'Quant-based momentum strategy picking top 20 stocks by price momentum.',
    tags: ['Quant', 'Momentum', 'Aggressive'], aum: '₹680 Cr', rating: 4.4,
    stocks: ['TATAMOTORS', 'ADANIENT', 'BAJFINANCE', 'MARUTI', 'SBIN'],
  },
  {
    id: 4, name: 'Safe Haven', category: 'Defensive', risk: 'Low',
    return1y: 12.4, return3y: 28.6, return5y: 45.8, minInvest: 2000,
    holdings: 12, description: 'Defensive portfolio with blue-chip stocks and debt allocation.',
    tags: ['Defensive', 'Blue Chip', 'Stable'], aum: '₹3,200 Cr', rating: 4.7,
    stocks: ['HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'ASIANPAINT'],
  },
  {
    id: 5, name: 'Digital India', category: 'Thematic', risk: 'High',
    return1y: 32.6, return3y: 85.2, return5y: 142.8, minInvest: 5000,
    holdings: 18, description: 'Thematic portfolio focused on India\'s digital transformation.',
    tags: ['Thematic', 'Tech', 'Growth'], aum: '₹920 Cr', rating: 4.5,
    stocks: ['TCS', 'INFY', 'HCLTECH', 'WIPRO', 'TECHM'],
  },
  {
    id: 6, name: 'Green Energy', category: 'Thematic', risk: 'High',
    return1y: 28.4, return3y: 0, return5y: 0, minInvest: 10000,
    holdings: 10, description: 'Portfolio focused on India\'s renewable energy transition.',
    tags: ['Thematic', 'ESG', 'Green'], aum: '₹340 Cr', rating: 4.2,
    stocks: ['NTPC', 'POWERGRID', 'TATAPOWER', 'ADANIGREEN', 'JSWENERGY'],
  },
  {
    id: 7, name: 'Midcap Momentum', category: 'Model Portfolio', risk: 'Very High',
    return1y: 52.4, return3y: 0, return5y: 0, minInvest: 10000,
    holdings: 20, description: 'High-conviction midcap stocks with strong momentum signals.',
    tags: ['Midcap', 'Momentum', 'Aggressive'], aum: '₹420 Cr', rating: 4.3,
    stocks: ['POLYCAB', 'MAXHEALTH', 'TORNTPHARM', 'INDHOTEL', 'CUMMINSIND'],
  },
  {
    id: 8, name: 'Dividend Hunter', category: 'Income', risk: 'Moderate',
    return1y: 15.8, return3y: 38.2, return5y: 62.4, minInvest: 5000,
    holdings: 15, description: 'High-dividend-yield stocks for regular income generation.',
    tags: ['Dividend', 'Income', 'Stable'], aum: '₹1,580 Cr', rating: 4.6,
    stocks: ['ONGC', 'COALINDIA', 'NTPC', 'BPCL', 'POWERGRID'],
  },
  {
    id: 9, name: 'Banking & Finance', category: 'Sector', risk: 'High',
    return1y: 22.8, return3y: 52.4, return5y: 78.6, minInvest: 5000,
    holdings: 12, description: 'Pure-play banking and financial services portfolio.',
    tags: ['Banking', 'Finance', 'Sector'], aum: '₹2,100 Cr', rating: 4.5,
    stocks: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK', 'BAJFINANCE'],
  },
  {
    id: 10, name: 'Smallcap Gems', category: 'Smallcap', risk: 'Very High',
    return1y: 68.4, return3y: 0, return5y: 0, minInvest: 10000,
    holdings: 25, description: 'High-growth smallcap stocks with strong fundamentals.',
    tags: ['Smallcap', 'High Growth', 'Aggressive'], aum: '₹280 Cr', rating: 4.1,
    stocks: ['SEAMEC', 'WHEELS', 'INDOTECH', 'GRINDWELL', 'CARBORUNIV'],
  },
]

const CATEGORIES = ['All', 'Model Portfolio', 'ELSS', 'Quant', 'Defensive', 'Thematic', 'Income', 'Sector', 'Smallcap']
const RISK_LEVELS = ['All', 'Low', 'Moderate', 'High', 'Very High']

export default function SmallcasesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [riskFilter, setRiskFilter] = useState('All')
  const [sortBy, setSortBy] = useState('return1y')
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    let arr = [...SMALLCASES]
    if (category !== 'All') arr = arr.filter(s => s.category === category)
    if (riskFilter !== 'All') arr = arr.filter(s => s.risk === riskFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      arr = arr.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    }
    arr.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))
    return arr
  }, [category, riskFilter, search, sortBy])

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: 0 }}>Smallcases</h1>
            <p style={{ fontSize: 13, color: T.textMute, margin: '4px 0 0' }}>Curated portfolios by expert research teams</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 7, background: T.blueBg, border: `1px solid ${T.blue}30`, color: T.blue, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <BarChart2 size={13} /> View All
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Smallcases', value: SMALLCASES.length, icon: PieChart, color: T.blue },
            { label: 'Avg 1Y Return', value: '+28.4%', icon: TrendingUp, color: T.green },
            { label: 'Total AUM', value: '₹12.8L Cr', icon: Globe, color: T.purple },
            { label: 'Min Investment', value: '₹500', icon: IndianRupee, color: T.amber },
          ].map(stat => (
            <div key={stat.label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${stat.color}12`, display: 'grid', placeItems: 'center' }}>
                  <stat.icon size={16} color={stat.color} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textMute, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginTop: 2 }}>{stat.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', minWidth: 220, flex: 1 }}>
            <Search size={13} color={T.textMute} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search smallcases…"
              style={{ border: 'none', background: 'none', outline: 'none', fontSize: 12.5, color: T.text, width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{
                padding: '5px 12px', borderRadius: 20,
                border: `1px solid ${category === c ? T.blue : T.border}`,
                background: category === c ? T.blueBg : T.white,
                color: category === c ? T.blue : T.textSub,
                fontSize: 12, fontWeight: category === c ? 700 : 500, cursor: 'pointer',
              }}>{c}</button>
            ))}
          </div>
        </div>

        {/* Smallcase Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map(s => (
            <div key={s.id} onClick={() => setSelected(selected?.id === s.id ? null : s)} style={{
              background: T.white, border: `1.5px solid ${selected?.id === s.id ? T.blue : T.border}`,
              borderRadius: 14, padding: '20px', cursor: 'pointer', transition: 'all .15s',
            }}
              onMouseEnter={e => { if (selected?.id !== s.id) { e.currentTarget.style.borderColor = T.borderMd; e.currentTarget.style.transform = 'translateY(-2px)' } }}
              onMouseLeave={e => { if (selected?.id !== s.id) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'none' } }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <CompanyLogo symbol={s.stocks?.[0] || s.name} name={s.name} size={36} borderRadius={8} />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 4 }}>{s.name}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: T.blueBg, color: T.blue }}>{s.category}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: s.risk === 'Very High' ? T.redBg : s.risk === 'High' ? T.amberBg : T.greenBg, color: s.risk === 'Very High' ? T.red : s.risk === 'High' ? T.amber : T.green }}>{s.risk}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Star size={12} color={T.amber} fill={T.amber} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{s.rating}</span>
                </div>
              </div>

              <p style={{ fontSize: 12, color: T.textSub, lineHeight: 1.6, margin: '0 0 14px' }}>{s.description}</p>

              {/* Returns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { label: '1Y', value: s.return1y },
                  { label: '3Y', value: s.return3y },
                  { label: '5Y', value: s.return5y },
                ].map(r => (
                  <div key={r.label} style={{ textAlign: 'center', padding: '8px', background: T.bg, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.textMute }}>{r.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: r.value >= 0 ? T.green : T.red, marginTop: 2 }}>
                      {r.value > 0 ? '+' : ''}{r.value > 0 ? r.value.toFixed(1) : '—'}%
                    </div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                {s.tags.map(t => (
                  <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: T.bg, color: T.textSub, fontWeight: 600 }}>{t}</span>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: `1px solid ${T.border2}` }}>
                <div>
                  <span style={{ fontSize: 10, color: T.textMute }}>Min Investment</span>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>₹{s.minInvest.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span style={{ fontSize: 10, color: T.textMute }}>AUM</span>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{s.aum}</div>
                </div>                  <button onClick={(e) => { e.stopPropagation(); startTransition(() => { navigate(`/dashboard/payment?name=${encodeURIComponent(s.name)}&type=Smallcase&min=${s.minInvest}&category=${encodeURIComponent(s.category)}`) }) }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', borderRadius: 8, background: T.blue, color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  Invest <ChevronRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

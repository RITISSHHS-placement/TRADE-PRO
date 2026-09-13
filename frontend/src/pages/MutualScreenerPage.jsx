import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Filter, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  ChevronDown, ChevronUp, Star, BarChart2, PieChart,
} from 'lucide-react'

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

const MF_DATA = [
  { id: 1, name: 'Parag Parikh Flexi Cap Fund', category: 'Flexi Cap', amc: 'PPFAS', nav: 78.42, returns1y: 28.5, returns3y: 42.8, returns5y: 68.4, risk: 'Moderate', aum: '58,420', expense: 0.63, rating: 5, minSip: 1000, exitLoad: '1% (< 1Y)' },
  { id: 2, name: 'Mirae Asset Large Cap Fund', category: 'Large Cap', amc: 'Mirae Asset', nav: 92.15, returns1y: 18.2, returns3y: 32.4, returns5y: 52.8, risk: 'Moderate', aum: '42,850', expense: 0.72, rating: 5, minSip: 500, exitLoad: '1% (< 1Y)' },
  { id: 3, name: 'Axis Small Cap Fund', category: 'Small Cap', amc: 'Axis', nav: 68.92, returns1y: 42.8, returns3y: 58.4, returns5y: 92.5, risk: 'High', aum: '18,240', expense: 0.45, rating: 4, minSip: 500, exitLoad: '1% (< 1Y)' },
  { id: 4, name: 'HDFC Mid Cap Opportunities Fund', category: 'Mid Cap', amc: 'HDFC', nav: 145.68, returns1y: 35.4, returns3y: 48.2, returns5y: 78.6, risk: 'High', aum: '32,150', expense: 0.78, rating: 4, minSip: 500, exitLoad: '1% (< 1Y)' },
  { id: 5, name: 'ICICI Prudential Bluechip Fund', category: 'Large Cap', amc: 'ICICI Pru', nav: 58.42, returns1y: 16.8, returns3y: 28.5, returns5y: 48.2, risk: 'Moderate', aum: '28,450', expense: 0.82, rating: 4, minSip: 500, exitLoad: '1% (< 1Y)' },
  { id: 6, name: 'SBI Small Cap Fund', category: 'Small Cap', amc: 'SBI', nav: 124.85, returns1y: 38.2, returns3y: 52.4, returns5y: 85.2, risk: 'High', aum: '22,180', expense: 0.62, rating: 5, minSip: 500, exitLoad: '1% (< 1Y)' },
  { id: 7, name: 'Nippon India Growth Fund', category: 'Mid Cap', amc: 'Nippon', nav: 342.15, returns1y: 32.5, returns3y: 45.8, returns5y: 72.4, risk: 'High', aum: '24,850', expense: 0.68, rating: 4, minSip: 500, exitLoad: '1% (< 1Y)' },
  { id: 8, name: 'Kotak Equity Opportunities Fund', category: 'Large & Mid Cap', amc: 'Kotak', nav: 186.42, returns1y: 24.8, returns3y: 38.5, returns5y: 62.8, risk: 'Moderate', aum: '18,920', expense: 0.75, rating: 4, minSip: 500, exitLoad: '1% (< 1Y)' },
  { id: 9, name: 'UTI Nifty Index Fund', category: 'Index', amc: 'UTI', nav: 245.80, returns1y: 15.2, returns3y: 28.4, returns5y: 45.8, risk: 'Moderate', aum: '12,450', expense: 0.18, rating: 4, minSip: 500, exitLoad: 'Nil' },
  { id: 10, name: 'HDFC Corporate Bond Fund', category: 'Corporate Bond', amc: 'HDFC', nav: 28.65, returns1y: 8.2, returns3y: 18.5, returns5y: 32.4, risk: 'Low', aum: '45,280', expense: 0.35, rating: 4, minSip: 500, exitLoad: 'Nil' },
  { id: 11, name: 'Aditya Birla Sun Life Tax Relief 96', category: 'ELSS', amc: 'ABSL', nav: 168.42, returns1y: 26.8, returns3y: 38.2, returns5y: 62.5, risk: 'High', aum: '15,820', expense: 0.82, rating: 4, minSip: 500, exitLoad: '3Y Lock-in' },
  { id: 12, name: 'Motilal Oswal Nasdaq 100 ETF', category: 'International', amc: 'Motilal Oswal', nav: 28.45, returns1y: 22.5, returns3y: 35.8, returns5y: 58.2, risk: 'High', aum: '8,450', expense: 0.22, rating: 4, minSip: 500, exitLoad: 'Nil' },
]

const CATEGORIES = ['All', 'Flexi Cap', 'Large Cap', 'Mid Cap', 'Small Cap', 'Index', 'ELSS', 'Corporate Bond', 'International', 'Large & Mid Cap']
const RISK_LEVELS = ['All', 'Low', 'Moderate', 'High']
const SORT_OPTIONS = [
  { value: 'returns1y', label: '1Y Returns' },
  { value: 'returns3y', label: '3Y Returns' },
  { value: 'returns5y', label: '5Y Returns' },
  { value: 'aum', label: 'AUM' },
  { value: 'expense', label: 'Expense Ratio' },
  { value: 'rating', label: 'Rating' },
]

export default function MutualScreenerPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [risk, setRisk] = useState('All')
  const [sortBy, setSortBy] = useState('returns1y')
  const [sortDir, setSortDir] = useState('desc')
  const [minRating, setMinRating] = useState(0)
  const [maxExpense, setMaxExpense] = useState(1)

  const filtered = useMemo(() => {
    let arr = [...MF_DATA]
    if (category !== 'All') arr = arr.filter(m => m.category === category)
    if (risk !== 'All') arr = arr.filter(m => m.risk === risk)
    if (minRating > 0) arr = arr.filter(m => m.rating >= minRating)
    if (maxExpense < 1) arr = arr.filter(m => m.expense <= maxExpense)
    if (search.trim()) {
      const q = search.toLowerCase()
      arr = arr.filter(m => m.name.toLowerCase().includes(q) || m.amc.toLowerCase().includes(q))
    }
    arr.sort((a, b) => {
      const av = parseFloat(a[sortBy]) || 0, bv = parseFloat(b[sortBy]) || 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
    return arr
  }, [category, risk, sortBy, sortDir, minRating, maxExpense, search])

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(field); setSortDir('desc') }
  }

  const SortIcon = ({ field }) => sortBy === field
    ? (sortDir === 'desc' ? <ChevronDown size={11} color={T.blue} /> : <ChevronUp size={11} color={T.blue} />)
    : <ChevronDown size={11} color={T.textMute} />

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: '0 0 4px' }}>Mutual Fund Screener</h1>
          <p style={{ fontSize: 13, color: T.textMute, margin: 0 }}>Filter and compare mutual funds across 50+ parameters</p>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Funds', value: MF_DATA.length, icon: PieChart, color: T.blue },
            { label: 'Best 1Y Return', value: '+42.8%', icon: TrendingUp, color: T.green },
            { label: 'Avg Expense', value: '0.58%', icon: BarChart2, color: T.amber },
            { label: '5 Star Funds', value: MF_DATA.filter(m => m.rating === 5).length, icon: Star, color: T.purple },
          ].map(stat => (
            <div key={stat.label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${stat.color}12`, display: 'grid', placeItems: 'center' }}>
                  <stat.icon size={15} color={stat.color} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textMute, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginTop: 2 }}>{stat.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Filter size={14} color={T.blue} />
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Filters</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px' }}>
              <Search size={13} color={T.textMute} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search fund name…"
                style={{ border: 'none', background: 'none', outline: 'none', fontSize: 12.5, color: T.text, width: '100%' }} />
            </div>

            {/* Category */}
            <select value={category} onChange={e => setCategory(e.target.value)} style={{
              padding: '7px 10px', borderRadius: 8, border: `1px solid ${T.border}`,
              background: T.bg, fontSize: 12.5, color: T.text, outline: 'none', cursor: 'pointer',
            }}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>

            {/* Risk */}
            <select value={risk} onChange={e => setRisk(e.target.value)} style={{
              padding: '7px 10px', borderRadius: 8, border: `1px solid ${T.border}`,
              background: T.bg, fontSize: 12.5, color: T.text, outline: 'none', cursor: 'pointer',
            }}>
              {RISK_LEVELS.map(r => <option key={r}>{r === 'All' ? 'All Risk Levels' : r}</option>)}
            </select>

            {/* Sort */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              padding: '7px 10px', borderRadius: 8, border: `1px solid ${T.border}`,
              background: T.bg, fontSize: 12.5, color: T.text, outline: 'none', cursor: 'pointer',
            }}>
              {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>

            {/* Min Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.textMute }}>Min Rating:</span>
              {[0, 3, 4, 5].map(r => (
                <button key={r} onClick={() => setMinRating(r)} style={{
                  padding: '4px 8px', borderRadius: 6,
                  border: `1px solid ${minRating === r ? T.amber : T.border}`,
                  background: minRating === r ? T.amberBg : T.white,
                  color: minRating === r ? T.amber : T.textMute,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}>{r === 0 ? 'Any' : `${r}★`}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div style={{ fontSize: 12, color: T.textMute, marginBottom: 12 }}>{filtered.length} funds found</div>

        {/* Table */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {[
                  { label: 'Fund Name', key: 'name', align: 'left' },
                  { label: 'Category', key: 'category', align: 'left' },
                  { label: 'NAV', key: 'nav', align: 'right' },
                  { label: '1Y', key: 'returns1y', align: 'right' },
                  { label: '3Y', key: 'returns3y', align: 'right' },
                  { label: '5Y', key: 'returns5y', align: 'right' },
                  { label: 'Risk', key: 'risk', align: 'center' },
                  { label: 'AUM (Cr)', key: 'aum', align: 'right' },
                  { label: 'Expense', key: 'expense', align: 'right' },
                  { label: 'Rating', key: 'rating', align: 'center' },
                ].map(col => (
                  <th key={col.key} onClick={() => toggleSort(col.key)} style={{
                    padding: '10px 12px', textAlign: col.align,
                    fontSize: 11, fontWeight: 700, color: sortBy === col.key ? T.blue : T.textMute,
                    textTransform: 'uppercase', letterSpacing: 0.4, cursor: 'pointer',
                    userSelect: 'none', whiteSpace: 'nowrap',
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {col.label} <SortIcon field={col.key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ borderBottom: `1px solid ${T.border2}`, cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = T.white}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: T.textMute }}>{m.amc}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: T.blueBg, color: T.blue }}>{m.category}</span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: T.text, fontVariantNumeric: 'tabular-nums' }}>₹{m.nav.toFixed(2)}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: m.returns1y >= 0 ? T.green : T.red }}>
                      {m.returns1y >= 0 ? '+' : ''}{m.returns1y.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: m.returns3y >= 0 ? T.green : T.red }}>
                      {m.returns3y >= 0 ? '+' : ''}{m.returns3y.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: m.returns5y >= 0 ? T.green : T.red }}>
                      {m.returns5y > 0 ? `+${m.returns5y.toFixed(1)}%` : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: m.risk === 'High' ? T.redBg : m.risk === 'Moderate' ? T.amberBg : T.greenBg, color: m.risk === 'High' ? T.red : m.risk === 'Moderate' ? T.amber : T.green }}>{m.risk}</span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: T.text, fontVariantNumeric: 'tabular-nums' }}>₹{m.aum}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: 13, color: T.textSub }}>{m.expense}%</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.amber }}>{'★'.repeat(m.rating)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

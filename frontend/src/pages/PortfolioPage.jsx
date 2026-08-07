import React, { useEffect, useState, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Briefcase, BarChart2, Download, RefreshCw, Search,
  ChevronDown, ChevronUp, Eye, EyeOff,
} from 'lucide-react'
import { useTrades } from '../hooks'
import { useMarketData } from '../hooks'
import { SYMBOL_LABELS } from '../services/marketData'

const T = {
  bg: '#f8f9fa', white: '#ffffff',
  border: '#e0e0e0', border2: '#f0f0f0',
  text: '#1a1a1a', textSub: '#5f6368', textMute: '#9aa0a6',
  green: '#0f9d58', greenBg: '#e8f5e9', greenDark: '#0a8043',
  red: '#ea4335', redBg: '#fce8e6',
  blue: '#1a73e8', blueBg: '#e8f0fe',
  purple: '#7c3aed', purpleBg: '#ede9fe',
  amber: '#d97706', amberBg: '#fef3c7',
}

const fmt = n => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtCr = n => {
  if (!n) return '—'
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

const HOLDINGS = [
  { sym: 'RELIANCE',   qty: 50,  avg: 2380,  sector: 'Oil & Gas',  ltp: 2450 },
  { sym: 'TCS',        qty: 20,  avg: 3200,  sector: 'IT',         ltp: 3420 },
  { sym: 'HDFCBANK',   qty: 100, avg: 1580,  sector: 'Banking',    ltp: 1610 },
  { sym: 'INFY',       qty: 80,  avg: 1420,  sector: 'IT',         ltp: 1480 },
  { sym: 'BAJFINANCE', qty: 15,  avg: 6800,  sector: 'Finance',    ltp: 7084 },
  { sym: 'MARUTI',     qty: 10,  avg: 10200, sector: 'Auto',       ltp: 11248 },
  { sym: 'WIPRO',      qty: 200, avg: 460,   sector: 'IT',         ltp: 452 },
  { sym: 'NTPC',       qty: 300, avg: 310,   sector: 'Power',      ltp: 325 },
]

const SECTOR_COLORS = {
  'IT': '#2563eb', 'Banking': '#7c3aed', 'Oil & Gas': '#ea580c',
  'Finance': '#d97706', 'Auto': '#0d9488', 'Power': '#16a34a',
}

const PNL_DATA = [
  { m: 'Jan', v: 420000 }, { m: 'Feb', v: 380000 }, { m: 'Mar', v: 520000 },
  { m: 'Apr', v: 490000 }, { m: 'May', v: 610000 }, { m: 'Jun', v: 580000 },
  { m: 'Jul', v: 720000 }, { m: 'Aug', v: 680000 }, { m: 'Sep', v: 810000 },
  { m: 'Oct', v: 760000 }, { m: 'Nov', v: 920000 }, { m: 'Dec', v: 1040000 },
]

function SummaryCard({ label, value, sub, subColor, icon: Icon, iconBg, iconColor, hidden }) {
  return (
    <div style={{
      background: T.white, border: `1px solid ${T.border}`, borderRadius: 12,
      padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 14,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: iconBg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon size={20} color={iconColor} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textMute, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.5px' }}>
          {hidden ? '₹ ••••••' : value}
        </div>
        {sub && <div style={{ fontSize: 12, color: subColor || T.textSub, fontWeight: 600, marginTop: 2 }}>{hidden ? '••••' : sub}</div>}
      </div>
    </div>
  )
}

function HoldingRow({ h, rank }) {
  const up = h.pnlAbs >= 0
  return (
    <tr style={{ borderBottom: `1px solid ${T.border2}` }}
      onMouseEnter={e => e.currentTarget.style.background = T.bg}
      onMouseLeave={e => e.currentTarget.style.background = T.white}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: SECTOR_COLORS[h.sector] || T.blue,
            display: 'grid', placeItems: 'center',
            fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>
            {h.sym.slice(0, 2)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{SYMBOL_LABELS[h.sym] || h.sym}</div>
            <div style={{ fontSize: 11, color: T.textMute }}>{h.sym} · {h.sector}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: T.textSub }}>{h.qty}</td>
      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: T.textSub }}>₹{fmt(h.avg)}</td>
      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: T.text }}>₹{fmt(h.ltp)}</td>
      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: T.text }}>{fmtCr(h.current)}</td>
      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          {up ? <ArrowUpRight size={14} color={T.green} /> : <ArrowDownRight size={14} color={T.red} />}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: up ? T.green : T.red }}>
              {up ? '+' : ''}₹{Math.abs(h.pnlAbs).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: up ? T.green : T.red }}>
              {up ? '+' : ''}{h.pnlPct.toFixed(2)}%
            </div>
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
        <div style={{ fontSize: 11, color: T.textMute }}>
          {((h.current / 1) * 100 / 1).toFixed(1)}%
        </div>
        <div style={{ height: 4, borderRadius: 2, background: T.border, marginTop: 3, width: 60, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 2, background: SECTOR_COLORS[h.sector] || T.blue, width: `${Math.min(100, h.pct || 20)}%` }} />
        </div>
      </td>
    </tr>
  )
}

export default function PortfolioPage() {
  const { trades, loading, loadTrades } = useTrades()
  const { stocks } = useMarketData()
  const [tab, setTab] = useState('holdings')
  const [sortField, setSortField] = useState('pnlAbs')
  const [sortDir, setSortDir] = useState('desc')
  const [search, setSearch] = useState('')
  const [hidden, setHidden] = useState(false)

  useEffect(() => { loadTrades() }, [])

  const holdings = useMemo(() => {
    return HOLDINGS.map(h => {
      const ltp = stocks[h.sym]?.price || h.ltp
      const invested = h.qty * h.avg
      const current = h.qty * ltp
      const pnlAbs = current - invested
      const pnlPct = (pnlAbs / invested) * 100
      return { ...h, ltp, invested, current, pnlAbs, pnlPct }
    })
  }, [stocks])

  const totalInvested = useMemo(() => holdings.reduce((s, h) => s + h.invested, 0), [holdings])
  const totalCurrent = useMemo(() => holdings.reduce((s, h) => s + h.current, 0), [holdings])
  const totalPnlAbs = totalCurrent - totalInvested
  const totalPnlPct = (totalPnlAbs / totalInvested) * 100
  const dayPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0)

  const sectorData = useMemo(() => {
    const map = {}
    holdings.forEach(h => { map[h.sector] = (map[h.sector] || 0) + h.current })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [holdings])

  const sortedHoldings = useMemo(() => {
    let arr = [...holdings]
    if (search.trim()) {
      const q = search.toLowerCase()
      arr = arr.filter(h => h.sym.toLowerCase().includes(q) || (SYMBOL_LABELS[h.sym] || '').toLowerCase().includes(q))
    }
    arr.sort((a, b) => {
      const av = a[sortField] ?? 0, bv = b[sortField] ?? 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
    return arr.map(h => ({ ...h, pct: (h.current / totalCurrent) * 100 }))
  }, [holdings, sortField, sortDir, search, totalCurrent])

  const toggleSort = f => {
    if (sortField === f) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortField(f); setSortDir('desc') }
  }

  const SortIcon = ({ f }) => sortField === f
    ? (sortDir === 'asc' ? <ChevronUp size={11} color={T.blue} /> : <ChevronDown size={11} color={T.blue} />)
    : <ChevronDown size={11} color={T.textMute} />

  const thStyle = (f, align = 'right') => ({
    padding: '10px 16px', textAlign: align,
    fontSize: 11, color: sortField === f ? T.blue : T.textMute,
    fontWeight: 700, cursor: 'pointer', userSelect: 'none',
    whiteSpace: 'nowrap',
  })

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: 0 }}>Portfolio</h1>
            <p style={{ fontSize: 13, color: T.textMute, margin: '4px 0 0' }}>NSE · BSE · Live P&amp;L tracking</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setHidden(h => !h)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 7, background: T.white, border: `1px solid ${T.border}`,
              color: T.textSub, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              {hidden ? <Eye size={14} /> : <EyeOff size={14} />} {hidden ? 'Show' : 'Hide'}
            </button>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 7, background: T.white, border: `1px solid ${T.border}`,
              color: T.textSub, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              <Download size={14} /> Export
            </button>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 7, background: T.blueBg, border: `1px solid ${T.blue}30`,
              color: T.blue, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* ── Summary cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginBottom: 24 }}>
          <SummaryCard label="Current Value" value={fmtCr(totalCurrent)}
            sub={`Invested: ${fmtCr(totalInvested)}`}
            icon={Briefcase} iconBg={T.blueBg} iconColor={T.blue} hidden={hidden} />
          <SummaryCard
            label="Total P&L"
            value={`${totalPnlAbs >= 0 ? '+' : ''}${fmtCr(Math.abs(totalPnlAbs))}`}
            sub={`${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}% overall`}
            subColor={totalPnlAbs >= 0 ? T.greenDark : T.red}
            icon={totalPnlAbs >= 0 ? TrendingUp : TrendingDown}
            iconBg={totalPnlAbs >= 0 ? T.greenBg : T.redBg}
            iconColor={totalPnlAbs >= 0 ? T.greenDark : T.red}
            hidden={hidden} />
          <SummaryCard
            label="Today's P&L"
            value={`${dayPnl >= 0 ? '+' : ''}₹${Math.abs(dayPnl).toLocaleString('en-IN')}`}
            sub={dayPnl >= 0 ? '▲ Profit day' : '▼ Loss day'}
            subColor={dayPnl >= 0 ? T.greenDark : T.red}
            icon={BarChart2} iconBg={T.purpleBg} iconColor={T.purple} hidden={hidden} />
          <SummaryCard
            label="Holdings"
            value={`${holdings.length} Stocks`}
            sub={`${trades.length} total orders`}
            icon={TrendingUp} iconBg={T.amberBg} iconColor={T.amber} hidden={hidden} />
        </div>

        {/* ── Charts row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 24 }}>

          {/* P&L chart */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Portfolio Performance</div>
                <div style={{ fontSize: 12, color: T.textMute }}>FY 2024–25 monthly</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.green }}>
                  {hidden ? '₹ ••••' : `+${fmtCr(totalPnlAbs)}`}
                </div>
                <div style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>+{totalPnlPct.toFixed(1)}% overall</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={PNL_DATA} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f9d58" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0f9d58" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                <XAxis dataKey="m" tick={{ fontSize: 10, fill: T.textMute }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v/1e5).toFixed(0)}L`} tick={{ fontSize: 10, fill: T.textMute }} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  formatter={v => [`₹${(v/1e5).toFixed(2)}L`, 'Value']}
                  contentStyle={{ background: '#1a1a1a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="v" stroke="#0f9d58" strokeWidth={2.5} fill="url(#pvGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Sector pie */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>Sector Allocation</div>
            <div style={{ fontSize: 12, color: T.textMute, marginBottom: 14 }}>by current value</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={sectorData} cx="50%" cy="50%" innerRadius={34} outerRadius={54} dataKey="value" paddingAngle={2}>
                    {sectorData.map((entry, i) => (
                      <Cell key={i} fill={SECTOR_COLORS[entry.name] || '#9aa0a6'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => [fmtCr(v), 'Value']} contentStyle={{ background: '#1a1a1a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {sectorData.map(s => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: SECTOR_COLORS[s.name] || '#9aa0a6', flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, color: T.text, flex: 1 }}>{s.name}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: T.textSub }}>
                      {((s.value / totalCurrent) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Holdings / Orders tab card ── */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>

          {/* Tab header */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${T.border}`, padding: '0 16px' }}>
            {[
              { id: 'holdings', label: `Holdings (${holdings.length})` },
              { id: 'orders',   label: `Orders (${trades.length})` },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '13px 16px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? T.blue : T.textSub,
                borderBottom: tab === t.id ? `2px solid ${T.blue}` : '2px solid transparent',
                marginBottom: '-1px', fontFamily: 'inherit',
              }}>{t.label}</button>
            ))}
            {/* right actions */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, paddingRight: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, padding: '5px 10px' }}>
                <Search size={12} color={T.textMute} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stock…"
                  style={{ border: 'none', background: 'none', outline: 'none', fontSize: 12, color: T.text, width: 130 }} />
              </div>
            </div>
          </div>

          {/* HOLDINGS TABLE */}
          {tab === 'holdings' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: T.textMute, fontWeight: 700 }}>Stock</th>
                    <th onClick={() => toggleSort('qty')} style={thStyle('qty')}>Qty <SortIcon f="qty" /></th>
                    <th onClick={() => toggleSort('avg')} style={thStyle('avg')}>Avg Price <SortIcon f="avg" /></th>
                    <th onClick={() => toggleSort('ltp')} style={thStyle('ltp')}>LTP <SortIcon f="ltp" /></th>
                    <th onClick={() => toggleSort('current')} style={thStyle('current')}>Curr Value <SortIcon f="current" /></th>
                    <th onClick={() => toggleSort('pnlAbs')} style={thStyle('pnlAbs')}>P&amp;L <SortIcon f="pnlAbs" /></th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: T.textMute, fontWeight: 700 }}>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHoldings.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: T.textMute }}>No holdings found</td></tr>
                  )}
                  {sortedHoldings.map((h, i) => <HoldingRow key={h.sym} h={h} rank={i + 1} />)}
                </tbody>
              </table>
              {/* Summary footer */}
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 24, background: T.bg }}>
                <div style={{ fontSize: 12, color: T.textMute }}>
                  Total invested: <span style={{ fontWeight: 700, color: T.text }}>{hidden ? '••••' : fmtCr(totalInvested)}</span>
                </div>
                <div style={{ fontSize: 12, color: T.textMute }}>
                  Current value: <span style={{ fontWeight: 700, color: T.text }}>{hidden ? '••••' : fmtCr(totalCurrent)}</span>
                </div>
                <div style={{ fontSize: 12, color: T.textMute }}>
                  Total P&L: <span style={{ fontWeight: 700, color: totalPnlAbs >= 0 ? T.green : T.red }}>
                    {hidden ? '••••' : `${totalPnlAbs >= 0 ? '+' : ''}${fmtCr(Math.abs(totalPnlAbs))} (${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%)`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS TABLE */}
          {tab === 'orders' && (
            <div style={{ overflowX: 'auto' }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: T.textMute }}>Loading orders…</div>
              ) : trades.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6 }}>No orders yet</div>
                  <div style={{ fontSize: 13, color: T.textMute }}>Place your first order to see trade history here.</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                      {['Symbol', 'Side', 'Type', 'Qty', 'Price', 'Status', 'P&L'].map((h, i) => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: i === 0 ? 'left' : 'right', fontSize: 11, color: T.textMute, fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(t => {
                      const up = (t.pnl || 0) >= 0
                      const statusColor = { COMPLETE: T.green, PENDING: T.amber, CANCELLED: T.textMute, REJECTED: T.red }
                      const statusBg = { COMPLETE: T.greenBg, PENDING: T.amberBg, CANCELLED: T.bg, REJECTED: T.redBg }
                      return (
                        <tr key={t.id} style={{ borderBottom: `1px solid ${T.border2}` }}
                          onMouseEnter={e => e.currentTarget.style.background = T.bg}
                          onMouseLeave={e => e.currentTarget.style.background = T.white}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, color: T.text }}>{t.symbol}</div>
                            <div style={{ fontSize: 11, color: T.textMute }}>{t.exchange} · {t.segment}</div>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                              background: t.side === 'BUY' ? T.blueBg : T.redBg,
                              color: t.side === 'BUY' ? T.blue : T.red,
                            }}>{t.side}</span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, color: T.textSub }}>{t.orderType}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>{t.quantity}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: T.textSub }}>
                            ₹{(t.executedPrice || t.price || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                              background: statusBg[t.status] || T.bg,
                              color: statusColor[t.status] || T.textMute,
                            }}>{t.status}</span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: up ? T.green : T.red }}>
                            {up ? '+' : ''}₹{(t.pnl || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

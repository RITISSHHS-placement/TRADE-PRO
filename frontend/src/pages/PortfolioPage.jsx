import React, { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  TrendingUp, TrendingDown, RefreshCw, ArrowUpRight,
  ArrowDownRight, Briefcase, DollarSign, BarChart2,
  Clock, Filter, Download,
} from 'lucide-react'
import { useTrades } from '../hooks'
import { useMarketData } from '../hooks'
import { SYMBOL_LABELS } from '../services/marketData'

/* ── Color tokens matching Tickertape portfolio ── */
const C = {
  bg: '#f4f6f8',
  white: '#ffffff',
  border: '#e2e6ea',
  border2: '#f0f2f5',
  navy: '#0f1624',
  text: '#1a1f2e',
  textSub: '#5c677d',
  textMute: '#9aa3b2',
  green: '#00b386',
  greenBg: '#e8f8ee',
  greenDark: '#0f9140',
  red: '#e53935',
  redBg: '#fdecea',
  blue: '#2563eb',
  blueBg: '#e3f2fd',
  purple: '#7c3aed',
  amber: '#f59e0b',
  amberBg: '#fffbeb',
}

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtCr = (n) => {
  if (!n) return '—'
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`
  return `₹${n.toLocaleString('en-IN')}`
}

/* ── Static portfolio holdings (Tickertape-style) ── */
const HOLDINGS = [
  { sym: 'RELIANCE',   qty: 50,  avgPrice: 2380, ltp: 2450, sector: 'Oil & Gas' },
  { sym: 'TCS',        qty: 20,  avgPrice: 3200, ltp: 3420, sector: 'IT' },
  { sym: 'HDFCBANK',   qty: 100, avgPrice: 1580, ltp: 1610, sector: 'Banking' },
  { sym: 'INFY',       qty: 80,  avgPrice: 1420, ltp: 1480, sector: 'IT' },
  { sym: 'BAJFINANCE', qty: 15,  avgPrice: 6800, ltp: 7084, sector: 'Finance' },
  { sym: 'MARUTI',     qty: 10,  avgPrice: 10200,ltp: 11248,sector: 'Auto' },
  { sym: 'WIPRO',      qty: 200, avgPrice: 460,  ltp: 452,  sector: 'IT' },
  { sym: 'NTPC',       qty: 300, avgPrice: 310,  ltp: 325,  sector: 'Power' },
]

const SECTOR_COLORS = {
  'IT': '#2563eb', 'Banking': '#7c3aed', 'Oil & Gas': '#ea580c',
  'Finance': '#d97706', 'Auto': '#0d9488', 'Power': '#16a34a',
}

/* ── PnL history chart data ── */
const PNL_HISTORY = [
  { date: 'Jan', value: 420000 },
  { date: 'Feb', value: 380000 },
  { date: 'Mar', value: 520000 },
  { date: 'Apr', value: 490000 },
  { date: 'May', value: 610000 },
  { date: 'Jun', value: 580000 },
  { date: 'Jul', value: 720000 },
  { date: 'Aug', value: 680000 },
  { date: 'Sep', value: 810000 },
  { date: 'Oct', value: 760000 },
  { date: 'Nov', value: 920000 },
  { date: 'Dec', value: 1040000 },
]

/* ── Stat card ── */
function StatCard({ label, value, sub, subColor, icon: Icon, iconBg, iconColor }) {
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: '18px 20px', display: 'flex',
      alignItems: 'flex-start', gap: 14,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: iconBg, display: 'grid', placeItems: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={iconColor} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: C.textMute, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: -0.3, fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 12, fontWeight: 600, color: subColor || C.textSub, marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PortfolioPage() {
  const { trades, loading, loadTrades } = useTrades()
  const { stocks } = useMarketData()
  const [activeTab, setActiveTab] = useState('holdings') // holdings | orders
  const [sortField, setSortField] = useState('pnlAbs')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => { loadTrades() }, [])

  /* ── Compute holdings with live LTP if available ── */
  const holdings = HOLDINGS.map(h => {
    const livePrice = stocks[h.sym]?.price || h.ltp
    const invested = h.qty * h.avgPrice
    const current  = h.qty * livePrice
    const pnlAbs   = current - invested
    const pnlPct   = ((pnlAbs) / invested) * 100
    return { ...h, ltp: livePrice, invested, current, pnlAbs, pnlPct }
  })

  /* Sort holdings */
  const sortedHoldings = [...holdings].sort((a, b) => {
    const av = a[sortField] ?? 0, bv = b[sortField] ?? 0
    return sortDir === 'desc' ? bv - av : av - bv
  })
  const toggleSort = (f) => {
    if (sortField === f) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortField(f); setSortDir('desc') }
  }

  /* ── Summary stats ── */
  const totalInvested  = holdings.reduce((s, h) => s + h.invested, 0)
  const totalCurrent   = holdings.reduce((s, h) => s + h.current, 0)
  const totalPnlAbs    = totalCurrent - totalInvested
  const totalPnlPct    = (totalPnlAbs / totalInvested) * 100
  const dayPnl         = trades.reduce((s, t) => s + (t.pnl || 0), 0)

  /* ── Sector allocation for pie ── */
  const sectorMap = {}
  holdings.forEach(h => {
    sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.current
  })
  const sectorData = Object.entries(sectorMap).map(([name, value]) => ({ name, value }))

  /* ── Sort icon helper ── */
  const SI = ({ f }) => sortField === f
    ? <span style={{ fontSize: 9, color: C.blue }}>{sortDir === 'desc' ? ' ▼' : ' ▲'}</span>
    : <span style={{ fontSize: 9, color: C.textMute }}> ⇅</span>

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'inherit', padding: '20px 24px' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0, letterSpacing: -0.3 }}>Portfolio</h1>
          <div style={{ fontSize: 12, color: C.textMute, marginTop: 2 }}>
            NSE · BSE · Live P&L tracking
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 14px', borderRadius: 7,
            background: C.white, border: `1px solid ${C.border}`,
            color: C.textSub, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            <Download size={13} /> Export
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 14px', borderRadius: 7,
            background: C.navy, border: 'none',
            color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            <Filter size={13} /> Filter
          </button>
        </div>
      </div>

      {/* ── Summary stats grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard
          label="Current Value" value={fmtCr(totalCurrent)}
          sub={`Invested: ${fmtCr(totalInvested)}`}
          icon={Briefcase} iconBg="#e3f2fd" iconColor={C.blue}
        />
        <StatCard
          label="Total P&L" value={`${totalPnlAbs >= 0 ? '+' : ''}₹${Math.abs(totalPnlAbs / 1e5).toFixed(2)}L`}
          sub={`${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}% overall`}
          subColor={totalPnlAbs >= 0 ? C.greenDark : C.red}
          icon={totalPnlAbs >= 0 ? TrendingUp : TrendingDown}
          iconBg={totalPnlAbs >= 0 ? C.greenBg : C.redBg}
          iconColor={totalPnlAbs >= 0 ? C.greenDark : C.red}
        />
        <StatCard
          label="Today's P&L" value={`${dayPnl >= 0 ? '+' : ''}₹${Math.abs(dayPnl).toLocaleString('en-IN')}`}
          sub={dayPnl >= 0 ? '▲ Profit' : '▼ Loss'}
          subColor={dayPnl >= 0 ? C.greenDark : C.red}
          icon={BarChart2} iconBg="#ede9fe" iconColor={C.purple}
        />
        <StatCard
          label="Holdings" value={`${holdings.length} stocks`}
          sub={`${trades.length} total orders`}
          icon={DollarSign} iconBg={C.amberBg} iconColor={C.amber}
        />
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, marginBottom: 20 }}>

        {/* P&L Area chart */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Portfolio Value (2024)</div>
              <div style={{ fontSize: 11, color: C.textMute, marginTop: 2 }}>Monthly performance</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.greenDark }}>
              +₹{(totalPnlAbs / 1e5).toFixed(2)}L
              <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 6 }}>+{totalPnlPct.toFixed(1)}%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={PNL_HISTORY} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00b386" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00b386" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9aa3b2' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${(v/1e5).toFixed(0)}L`} tick={{ fontSize: 10, fill: '#9aa3b2' }} axisLine={false} tickLine={false} width={46} />
              <Tooltip
                formatter={v => [`₹${(v/1e5).toFixed(2)}L`, 'Value']}
                contentStyle={{ background: C.navy, border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="value" stroke="#00b386" strokeWidth={2.5} fill="url(#pvGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sector allocation pie */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Sector Allocation</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={sectorData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={2}>
                  {sectorData.map((entry, i) => (
                    <Cell key={i} fill={SECTOR_COLORS[entry.name] || '#9aa3b2'} />
                  ))}
                </Pie>
                <Tooltip formatter={v => [fmtCr(v), 'Value']} contentStyle={{ background: C.navy, border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {sectorData.map((s, i) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: SECTOR_COLORS[s.name] || '#9aa3b2', flexShrink: 0 }} />
                  <span style={{ color: C.textSub, flex: 1 }}>{s.name}</span>
                  <span style={{ fontWeight: 700, color: C.text }}>{((s.value / totalCurrent) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        background: C.white, border: `1px solid ${C.border}`,
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, padding: '0 20px' }}>
          {[
            { id: 'holdings', label: `Holdings (${holdings.length})` },
            { id: 'orders',   label: `Orders (${trades.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '12px 16px', border: 'none', background: 'none',
              fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500,
              color: activeTab === t.id ? C.blue : C.textSub,
              borderBottom: `2.5px solid ${activeTab === t.id ? C.blue : 'transparent'}`,
              cursor: 'pointer', marginBottom: -1, transition: 'all .12s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── HOLDINGS TABLE ── */}
        {activeTab === 'holdings' && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2.4fr 1fr 1fr 1fr 1.2fr 1.2fr',
              padding: '9px 20px',
              background: '#f8f9fb',
              borderBottom: `1px solid ${C.border2}`,
              fontSize: 10, fontWeight: 700, color: C.textMute,
              textTransform: 'uppercase', letterSpacing: .6,
            }}>
              <span>Stock</span>
              <span style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => toggleSort('qty')}>Qty <SI f="qty"/></span>
              <span style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => toggleSort('avgPrice')}>Avg Price <SI f="avgPrice"/></span>
              <span style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => toggleSort('ltp')}>LTP <SI f="ltp"/></span>
              <span style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => toggleSort('current')}>Current Val <SI f="current"/></span>
              <span style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => toggleSort('pnlAbs')}>P&L <SI f="pnlAbs"/></span>
            </div>
            {sortedHoldings.map((h, i) => {
              const up = h.pnlAbs >= 0
              return (
                <div key={h.sym} style={{
                  display: 'grid',
                  gridTemplateColumns: '2.4fr 1fr 1fr 1fr 1.2fr 1.2fr',
                  padding: '13px 20px',
                  borderBottom: `1px solid ${C.border2}`,
                  alignItems: 'center',
                  transition: 'background .1s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8f9fb' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8,
                      background: '#e3f2fd', color: C.blue,
                      display: 'grid', placeItems: 'center',
                      fontSize: 10, fontWeight: 900, flexShrink: 0,
                    }}>{h.sym.slice(0, 2)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{SYMBOL_LABELS[h.sym] || h.sym}</div>
                      <div style={{ fontSize: 10, color: C.textMute }}>{h.sym} · {h.sector}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: C.text }}>{h.qty}</div>
                  <div style={{ textAlign: 'right', fontSize: 13, color: C.textSub, fontVariantNumeric: 'tabular-nums' }}>₹{fmt(h.avgPrice)}</div>
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: C.text, fontVariantNumeric: 'tabular-nums' }}>₹{fmt(h.ltp)}</div>
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: C.text, fontVariantNumeric: 'tabular-nums' }}>
                    ₹{(h.current / 1e5).toFixed(2)}L
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700,
                      color: up ? C.greenDark : C.red,
                      fontVariantNumeric: 'tabular-nums',
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3,
                    }}>
                      {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      ₹{Math.abs(h.pnlAbs).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <div style={{ fontSize: 11, color: up ? C.greenDark : C.red, fontWeight: 600 }}>
                      {up ? '+' : ''}{h.pnlPct.toFixed(2)}%
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ── ORDERS TABLE ── */}
        {activeTab === 'orders' && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 1fr 1fr 0.8fr',
              padding: '9px 20px',
              background: '#f8f9fb',
              borderBottom: `1px solid ${C.border2}`,
              fontSize: 10, fontWeight: 700, color: C.textMute,
              textTransform: 'uppercase', letterSpacing: .6,
            }}>
              <span>Symbol</span>
              <span style={{ textAlign: 'center' }}>Side</span>
              <span style={{ textAlign: 'center' }}>Type</span>
              <span style={{ textAlign: 'right' }}>Qty</span>
              <span style={{ textAlign: 'right' }}>Price</span>
              <span style={{ textAlign: 'center' }}>Status</span>
              <span style={{ textAlign: 'right' }}>P&L</span>
            </div>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.textMute, fontSize: 13 }}>Loading orders…</div>
            ) : trades.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>◳</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textSub }}>No orders yet</div>
                <div style={{ fontSize: 12, color: C.textMute, marginTop: 4 }}>Place your first order to see history here.</div>
              </div>
            ) : trades.map((t) => {
              const pnlUp = (t.pnl || 0) >= 0
              const statusColors = { COMPLETE: [C.greenBg, C.greenDark], PENDING: [C.amberBg, C.amber], CANCELLED: ['#f3f4f6', C.textMute], REJECTED: [C.redBg, C.red] }
              const [sBg, sColor] = statusColors[t.status] || ['#f3f4f6', C.textMute]
              return (
                <div key={t.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 1fr 1fr 0.8fr',
                  padding: '12px 20px', borderBottom: `1px solid ${C.border2}`,
                  alignItems: 'center', transition: 'background .1s', cursor: 'pointer',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8f9fb' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t.symbol}</div>
                    <div style={{ fontSize: 10, color: C.textMute }}>{t.exchange} · {t.segment}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                      background: t.side === 'BUY' ? C.greenBg : C.redBg,
                      color: t.side === 'BUY' ? C.greenDark : C.red,
                    }}>{t.side}</span>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 12, color: C.textSub }}>{t.orderType}</div>
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: C.text }}>{t.quantity}</div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: C.textSub, fontVariantNumeric: 'tabular-nums' }}>
                    ₹{(t.executedPrice || t.price || 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: sBg, color: sColor }}>{t.status}</span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: pnlUp ? C.greenDark : C.red, fontVariantNumeric: 'tabular-nums' }}>
                    {pnlUp ? '+' : ''}₹{(t.pnl || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

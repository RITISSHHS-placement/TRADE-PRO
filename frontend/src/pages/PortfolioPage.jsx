import React, { useEffect, useState, useMemo } from 'react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
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
import CompanyLogo from '../components/CompanyLogo'
import { TitleBar, Section } from '../components/primitive'
import styles from './PortfolioPage.module.css'

const T = {
  bg: '#f8f9fa', white: '#ffffff',
  border: '#e8eaed', border2: '#f0f0f0',
  text: '#1a1a2e', textSub: '#5f6368', textMute: '#9aa0a6',
  green: '#22c55e', greenBg: 'rgba(34,197,94,0.08)', greenDark: '#16a34a',
  red: '#ef4444', redBg: 'rgba(239,68,68,0.08)',
  blue: '#1a73e8', blueBg: 'rgba(26,115,232,0.08)',
  purple: '#8b5cf6', purpleBg: 'rgba(139,92,246,0.08)',
  amber: '#f59e0b', amberBg: 'rgba(245,158,11,0.08)',
  teal: '#0d9488', tealBg: 'rgba(13,148,136,0.08)',
  orange: '#ea580c', orangeBg: 'rgba(234,88,12,0.08)',
}

const fmt = n => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtCr = n => {
  if (!n) return '—'
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}
const fmtUSD = n => `$${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtBTC = n => `${(n ?? 0).toFixed(6)}`

const CATEGORIES = [
  { id: 'stocks', label: '📈 Stocks', color: T.blue, colorBg: T.blueBg },
  { id: 'mf', label: '📊 Mutual Funds', color: T.purple, colorBg: T.purpleBg },
  { id: 'crypto', label: '₿ Crypto', color: T.amber, colorBg: T.amberBg },
  { id: 'gold', label: '🪙 Digital Gold', color: T.orange, colorBg: T.orangeBg },
  { id: 'us', label: '🇺🇸 US Stocks', color: T.teal, colorBg: T.tealBg },
]
const STOCK_HOLDINGS = [
  { sym: 'RELIANCE', qty: 50, avg: 2380, sector: 'Oil & Gas', ltp: 2450 },
  { sym: 'TCS', qty: 20, avg: 3200, sector: 'IT', ltp: 3420 },
  { sym: 'HDFCBANK', qty: 100, avg: 1580, sector: 'Banking', ltp: 1610 },
  { sym: 'INFY', qty: 80, avg: 1420, sector: 'IT', ltp: 1480 },
  { sym: 'BAJFINANCE', qty: 15, avg: 6800, sector: 'Finance', ltp: 7084 },
  { sym: 'MARUTI', qty: 10, avg: 10200, sector: 'Auto', ltp: 11248 },
  { sym: 'WIPRO', qty: 200, avg: 460, sector: 'IT', ltp: 452 },
  { sym: 'NTPC', qty: 300, avg: 310, sector: 'Power', ltp: 325 },
  { sym: 'HCLTECH', qty: 40, avg: 1280, sector: 'IT', ltp: 1398 },
  { sym: 'TATAMOTORS', qty: 60, avg: 680, sector: 'Auto', ltp: 762 },
  { sym: 'SBIN', qty: 150, avg: 620, sector: 'Banking', ltp: 698 },
  { sym: 'ICICIBANK', qty: 80, avg: 1100, sector: 'Banking', ltp: 1264 },
]
const MF_HOLDINGS = [
  { name: 'Parag Parikh Flexi Cap Fund', code: 'PPFCF', units: 245.67, nav: 78.42, invested: 15000, category: 'Flexi Cap', amc: 'PPFAS' },
  { name: 'HDFC Mid-Cap Opportunities Fund', code: 'HMOF', units: 312.45, nav: 132.80, invested: 35000, category: 'Mid Cap', amc: 'HDFC' },
  { name: 'SBI Nifty Index Fund', code: 'SNIF', units: 180.20, nav: 245.60, invested: 40000, category: 'Index', amc: 'SBI' },
  { name: 'Axis Bluechip Fund', code: 'ABF', units: 95.30, nav: 56.80, invested: 5000, category: 'Large Cap', amc: 'Axis' },
  { name: 'Mirae Asset Emerging Bluechip', code: 'MAEB', units: 156.80, nav: 92.40, invested: 12000, category: 'Mid Cap', amc: 'Mirae' },
  { name: 'Motilal Oswal Nasdaq 100 ETF', code: 'MON100', units: 42.10, nav: 278.90, invested: 10000, category: 'International', amc: 'Motilal' },
]
const CRYPTO_HOLDINGS = [
  { sym: 'BTC', name: 'Bitcoin', qty: 0.0524, avgPrice: 5820000, ltp: 6240000 },
  { sym: 'ETH', name: 'Ethereum', qty: 1.85, avgPrice: 268000, ltp: 285000 },
  { sym: 'SOL', name: 'Solana', qty: 12.5, avgPrice: 12800, ltp: 14200 },
  { sym: 'XRP', name: 'Ripple', qty: 2500, avgPrice: 52, ltp: 58.4 },
  { sym: 'ADA', name: 'Cardano', qty: 5000, avgPrice: 38, ltp: 42.6 },
  { sym: 'DOGE', name: 'Dogecoin', qty: 10000, avgPrice: 12.4, ltp: 14.8 },
  { sym: 'DOT', name: 'Polkadot', qty: 200, avgPrice: 580, ltp: 640 },
  { sym: 'LINK', name: 'Chainlink', qty: 80, avgPrice: 1180, ltp: 1320 },
]
const GOLD_HOLDINGS = [
  { name: '24K Digital Gold', qty: 5.2, unitPrice: 9845, unit: 'grams', ltp: 9845 },
  { name: 'Gold ETF (GoldBees)', sym: 'GOLDBEES', qty: 200, avg: 48.20, ltp: 52.80 },
  { name: 'Silver ETF (SilverBees)', sym: 'SILVERBEES', qty: 100, avg: 72.40, ltp: 78.60 },
]
const US_HOLDINGS = [
  { sym: 'AAPL', name: 'Apple Inc.', qty: 10, avg: 185.20, ltp: 227.52, exchange: 'NASDAQ' },
  { sym: 'MSFT', name: 'Microsoft Corp.', qty: 5, avg: 380.40, ltp: 441.80, exchange: 'NASDAQ' },
  { sym: 'NVDA', name: 'NVIDIA Corp.', qty: 15, avg: 95.60, ltp: 148.85, exchange: 'NASDAQ' },
  { sym: 'GOOGL', name: 'Alphabet Inc.', qty: 8, avg: 152.80, ltp: 196.47, exchange: 'NASDAQ' },
  { sym: 'AMZN', name: 'Amazon.com Inc.', qty: 12, avg: 178.40, ltp: 228.56, exchange: 'NASDAQ' },
  { sym: 'TSLA', name: 'Tesla Inc.', qty: 6, avg: 265.80, ltp: 342.54, exchange: 'NASDAQ' },
  { sym: 'META', name: 'Meta Platforms', qty: 4, avg: 520.00, ltp: 698.10, exchange: 'NASDAQ' },
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

/* ── Summary Card ── */
function SummaryCard({ label, value, sub, subColor, icon: Icon, iconBg, iconColor, hidden }) {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryIcon} style={{ background: iconBg, color: iconColor }}>
        {Icon ? <Icon size={20} /> : null}
      </div>
      <div className={styles.summaryBody}>
        <div className={styles.summaryLabel}>{label}</div>
        <div className={styles.summaryValue}>{hidden ? '₹ •••••' : value}</div>
        {sub && <div className={styles.summarySub} style={{ color: subColor || T.textSub }}>{hidden ? '••••' : sub}</div>}
      </div>
    </div>
  )
}

/* ── Category Summary Card ── */
function CategoryCard({ cat, total, invested, pnl, pnlPct, count, isActive, onClick, hidden }) {
  const up = pnl >= 0
  return (
    <button onClick={onClick} className={`${styles.categoryBtn} ${isActive ? styles.categoryActive : ''}`} style={{ ['--c']: cat.color }}>
      <div className={styles.categoryLabel} style={{ color: cat.color }}>{cat.label}</div>
      <div className={styles.categoryTotal}>{hidden ? '₹ ••••' : fmtCr(total)}</div>
      <div className={styles.categoryPnl} style={{ color: up ? T.greenDark : T.red }}>
        {up ? '+' : ''}{hidden ? '••••' : fmtCr(Math.abs(pnl))} ({up ? '+' : ''}{pnlPct.toFixed(2)}%)
      </div>
      <div className={styles.categoryCount} style={{ color: cat.color }}>· {count} holdings</div>
    </button>
  )
}

/* ── Holding Row ── */
function HoldingRow({ h, type = 'stock' }) {
  const up = h.pnlAbs >= 0
  return (
    <tr className={styles.holdingRow}>
      <td className={styles.cellAsset}>
        <CompanyLogo symbol={h.sym || h.code} name={h.name || h.sym} size={36} />
        <div>
          <div className={styles.holdingName}>{h.displayName || SYMBOL_LABELS[h.sym] || h.name || h.sym}</div>
          <div className={styles.holdingMeta}>
            {h.sym || h.code}{h.sector ? ` · ${h.sector}` : ''}{h.category ? ` · ${h.category}` : ''}{h.exchange ? ` · ${h.exchange}` : ''}
          </div>
        </div>
      </td>
      <td className={styles.cellNum}>{type === 'crypto' ? fmtBTC(h.qty) : type === 'gold' && h.unit ? `${h.qty} ${h.unit}` : h.qty}</td>
      <td className={styles.cellNum}>{type === 'gold' && !h.avg ? `₹${fmt(h.unitPrice)}` : type === 'us' ? fmtUSD(h.avg) : `₹${fmt(h.avg)}`}</td>
      <td className={styles.cellNumStrong}>{type === 'us' ? fmtUSD(h.ltp) : `₹${fmt(h.ltp)}`}</td>
      <td className={styles.cellNumStrong}>{fmtCr(h.current)}</td>
      <td className={styles.cellPnl}>
        <span className={`${styles.pnlDot} ${up ? styles.pnlUp : styles.pnlDown}`} />
        <span style={{ color: up ? T.greenDark : T.red }}>
          {up ? '+' : ''}₹{Math.abs(h.pnlAbs).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </span>
        <span className={styles.pnlPct} style={{ color: up ? T.greenDark : T.red }}>{up ? '+' : ''}{h.pnlPct.toFixed(2)}%</span>
      </td>
      <td className={styles.cellWeight}>
        {h.weight ? `${h.weight.toFixed(1)}%` : '—'}
        {h.weight > 0 && (
          <div className={styles.weightBar} style={{ background: 'var(--track)' }}>
            <div className={styles.weightFill} style={{ width: `${Math.min(100, h.weight)}%`, background: T.blue }} />
          </div>
        )}
      </td>
    </tr>
  )
}

export default function PortfolioPage() {
  const { trades, loading, loadTrades } = useTrades()
  const { stocks } = useMarketData()
  const [activeCategory, setActiveCategory] = useState('stocks')
  const [sortField, setSortField] = useState('pnlAbs')
  const [sortDir, setSortDir] = useState('desc')
  const [search, setSearch] = useState('')
  const [hidden, setHidden] = useState(false)

  useEffect(() => { loadTrades() }, [])

  const stockData = useMemo(() => {
    return STOCK_HOLDINGS.map(h => {
      const ltp = stocks[h.sym]?.price || h.ltp
      const invested = h.qty * h.avg
      const current = h.qty * ltp
      const pnlAbs = current - invested
      const pnlPct = (pnlAbs / invested) * 100
      return { ...h, ltp, invested, current, pnlAbs, pnlPct }
    })
  }, [stocks])
  const mfData = useMemo(() => MF_HOLDINGS.map(h => {
    const current = h.units * h.nav
    const pnlAbs = current - h.invested
    const pnlPct = (pnlAbs / h.invested) * 100
    return { ...h, current, pnlAbs, pnlPct }
  }), [])
  const cryptoData = useMemo(() => CRYPTO_HOLDINGS.map(h => {
    const invested = h.qty * h.avgPrice
    const current = h.qty * h.ltp
    const pnlAbs = current - invested
    const pnlPct = (pnlAbs / invested) * 100
    return { ...h, current, invested, pnlAbs, pnlPct }
  }), [])
  const goldData = useMemo(() => GOLD_HOLDINGS.map(h => {
    const avg = h.avg || h.unitPrice
    const invested = h.qty * avg
    const current = h.qty * h.ltp
    const pnlAbs = current - invested
    const pnlPct = (pnlAbs / invested) * 100
    return { ...h, current, invested, pnlAbs, pnlPct }
  }), [])
  const usData = useMemo(() => US_HOLDINGS.map(h => {
    const invested = h.qty * h.avg * 83.8
    const current = h.qty * h.ltp * 83.8
    const pnlAbs = current - invested
    const pnlPct = (pnlAbs / invested) * 100
    return { ...h, current, invested, pnlAbs, pnlPct }
  }), [])

  const catTotals = useMemo(() => {
    const calc = (arr) => {
      const total = arr.reduce((s, h) => s + h.current, 0)
      const invested = arr.reduce((s, h) => s + (h.invested || h.qty * (h.avg || h.avgPrice || 0)), 0)
      const pnl = total - invested
      const pct = invested > 0 ? (pnl / invested) * 100 : 0
      return { total, invested, pnl, pct, count: arr.length }
    }
    return { stocks: calc(stockData), mf: calc(mfData), crypto: calc(cryptoData), gold: calc(goldData), us: calc(usData) }
  }, [stockData, mfData, cryptoData, goldData, usData])

  const grandTotal = catTotals.stocks.total + catTotals.mf.total + catTotals.crypto.total + catTotals.gold.total + catTotals.us.total
  const grandInvested = catTotals.stocks.invested + catTotals.mf.invested + catTotals.crypto.invested + catTotals.gold.invested + catTotals.us.invested
  const grandPnl = grandTotal - grandInvested
  const grandPnlPct = grandInvested > 0 ? (grandPnl / grandInvested) * 100 : 0
  const dayPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0)

  const activeData = { stocks: stockData, mf: mfData, crypto: cryptoData, gold: goldData, us: usData }[activeCategory] || []

  const sectorData = useMemo(() => {
    const map = {}
    stockData.forEach(h => { map[h.sector] = (map[h.sector] || 0) + h.current })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [stockData])
  const totalStocksCurrent = useMemo(() => stockData.reduce((s, h) => s + h.current, 0), [stockData])

  const allocationData = useMemo(() => CATEGORIES.map(c => ({
    name: c.label.replace(/^[^\w]+\s/, ''),
    value: catTotals[c.id]?.total || 0,
    color: c.color,
  })).filter(d => d.value > 0), [catTotals])

  const sortedData = useMemo(() => {
    let arr = [...activeData]
    if (search.trim()) {
      const q = search.toLowerCase()
      arr = arr.filter(h => (h.sym || h.code || h.name || '').toLowerCase().includes(q) || (h.name || '').toLowerCase().includes(q))
    }
    arr.sort((a, b) => {
      const av = a[sortField] ?? 0, bv = b[sortField] ?? 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
    const total = arr.reduce((s, h) => s + h.current, 0)
    return arr.map(h => ({ ...h, weight: total > 0 ? (h.current / total) * 100 : 0 }))
  }, [activeData, sortField, sortDir, search])

  const toggleSort = f => {
    if (sortField === f) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortField(f); setSortDir('desc') }
  }
  const SortIcon = ({ f }) => sortField === f
    ? (sortDir === 'asc' ? <ChevronUp size={11} color={T.blue} /> : <ChevronDown size={11} color={T.blue} />)
    : <ChevronDown size={11} color={T.textMute} />
  const activeCat = CATEGORIES.find(c => c.id === activeCategory)

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <TitleBar
          title="Portfolio"
          subtitle="NSE · BSE · Crypto · Gold · US — Live P&amp;L tracking"
          action={
            <div className={styles.headerActions}>
              <button className={styles.iconBtn} onClick={() => setHidden(h => !h)} title={hidden ? 'Show values' : 'Hide values'}>
                {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button className={styles.iconBtn} title="Export">
                <Download size={15} />
              </button>
              <button className={styles.iconBtn} onClick={() => loadTrades()} title="Refresh">
                <RefreshCw size={15} />
              </button>
            </div>
          }
        />

        {/* Grand Summary Cards */}
        <div className={styles.summaryRow}>
          <SummaryCard label="Total Portfolio Value" value={fmtCr(grandTotal)}
            sub={`Invested: ${fmtCr(grandInvested)}`}
            icon={Briefcase} iconBg={T.blueBg} iconColor={T.blue} hidden={hidden} />
          <SummaryCard
            label="Total P&amp;L"
            value={`${grandPnl >= 0 ? '+' : ''}${fmtCr(Math.abs(grandPnl))}`}
            sub={`${grandPnlPct >= 0 ? '+' : ''}${grandPnlPct.toFixed(2)}% overall`}
            subColor={grandPnl >= 0 ? T.greenDark : T.red}
            icon={grandPnl >= 0 ? TrendingUp : TrendingDown}
            iconBg={grandPnl >= 0 ? T.greenBg : T.redBg}
            iconColor={grandPnl >= 0 ? T.greenDark : T.red}
            hidden={hidden} />
          <SummaryCard
            label="Today's P&amp;L"
            value={`${dayPnl >= 0 ? '+' : ''}₹${Math.abs(dayPnl).toLocaleString('en-IN')}`}
            sub={dayPnl >= 0 ? '▲ Profit day' : '▼ Loss day'}
            subColor={dayPnl >= 0 ? T.greenDark : T.red}
            icon={BarChart2} iconBg={T.purpleBg} iconColor={T.purple} hidden={hidden} />
          <SummaryCard
            label="Total Holdings"
            value={`${CATEGORIES.reduce((s, c) => s + catTotals[c.id].count, 0)} Assets`}
            sub={`${CATEGORIES.length} categories`}
            icon={TrendingUp} iconBg={T.amberBg} iconColor={T.amber} hidden={hidden} />
        </div>

        {/* Category Cards */}
        <div className={styles.categoryRow}>
          {CATEGORIES.map(cat => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              total={catTotals[cat.id].total}
              invested={catTotals[cat.id].invested}
              pnl={catTotals[cat.id].pnl}
              pnlPct={catTotals[cat.id].pct}
              count={catTotals[cat.id].count}
              isActive={activeCategory === cat.id}
              onClick={() => { setActiveCategory(cat.id); setSortField('pnlAbs'); setSortDir('desc') }}
              hidden={hidden}
            />
          ))}
        </div>

        {/* Charts row */}
        <div className={styles.chartsRow}>
          {/* P&L chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <div className={styles.chartTitle}>Portfolio Performance</div>
                <div className={styles.chartSubtitle}>FY 2024–25 monthly</div>
              </div>
              <div className={styles.chartMeta}>
                <div className={styles.chartMetaVal} style={{ color: T.green }}>{hidden ? '₹ ••••' : `+${fmtCr(grandPnl)}`}</div>
                <div className={styles.chartMetaSub} style={{ color: T.green }}>+{grandPnlPct.toFixed(1)}% overall</div>
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
                <YAxis tickFormatter={v => `₹${(v / 1e5).toFixed(0)}L`} tick={{ fontSize: 10, fill: T.textMute }} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  formatter={v => [`₹${(v / 1e5).toFixed(2)}L`, 'Value']}
                  contentStyle={{ background: '#1a1a1a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="v" stroke="#0f9d58" strokeWidth={2.5} fill="url(#pvGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Allocation pie */}
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>Asset Allocation</div>
            <div className={styles.chartSubtitle}>by category</div>
            <div className={styles.allocationRow}>
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={allocationData} cx="50%" cy="50%" innerRadius={36} outerRadius={56} dataKey="value" paddingAngle={3}>
                    {allocationData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => [fmtCr(v), 'Value']} contentStyle={{ background: '#1a1a1a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.allocationList}>
                {allocationData.map(s => {
                  const pct = grandTotal > 0 ? (s.value / grandTotal) * 100 : 0
                  return (
                    <div key={s.name} className={styles.allocationItem}>
                      <div className={styles.allocationDot} style={{ background: s.color }} />
                      <span className={styles.allocationName}>{s.name}</span>
                      <span className={styles.allocationPct}>{pct.toFixed(1)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Holdings / Orders Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableTabs}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSortField('pnlAbs'); setSortDir('desc') }}
                className={`${styles.tableTab} ${activeCategory === cat.id ? styles.tableTabActive : ''}`}
                style={{ ['--c']: cat.color }}
              >
                {cat.label} ({catTotals[cat.id].count})
              </button>
            ))}
            <button
              onClick={() => setActiveCategory('orders')}
              className={`${styles.tableTab} ${activeCategory === 'orders' ? styles.tableTabActive : ''}`}
              style={{ ['--c']: T.blue }}
            >
              📋 Orders ({trades.length})
            </button>
            <div className={styles.searchBox}>
              <Search size={12} color={T.textMute} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className={styles.searchInput}
              />
            </div>
          </div>

          {activeCategory !== 'orders' && (
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th className={styles.thLeft}>Asset</th>
                    <th className={styles.thSort} onClick={() => toggleSort('qty')}>Qty <SortIcon f="qty" /></th>
                    <th className={styles.thSort} onClick={() => toggleSort('avg')}>Avg <SortIcon f="avg" /></th>
                    <th className={styles.thSort} onClick={() => toggleSort('ltp')}>LTP <SortIcon f="ltp" /></th>
                    <th className={styles.thSort} onClick={() => toggleSort('current')}>Curr <SortIcon f="current" /></th>
                    <th className={styles.thSort} onClick={() => toggleSort('pnlAbs')}>P&amp;L <SortIcon f="pnlAbs" /></th>
                    <th className={styles.thRight}>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.length === 0 && (
                    <tr><td colSpan={7} className={styles.thEmpty}>No holdings in this category</td></tr>
                  )}
                  {sortedData.map((h, i) => (
                    <HoldingRow key={h.sym || h.code || i} h={h} type={activeCategory} />
                  ))}
                </tbody>
              </table>
              <div className={styles.tableFooter}>
                <span>Total invested: <b style={{ color: 'var(--text)' }}>{hidden ? '••••' : fmtCr(catTotals[activeCategory].invested)}</b></span>
                <span>Current value: <b style={{ color: 'var(--text)' }}>{hidden ? '••••' : fmtCr(catTotals[activeCategory].total)}</b></span>
                <span style={{ color: catTotals[activeCategory].pnl >= 0 ? T.greenDark : T.red }}>
                  Total P&amp;L: {hidden ? '••••' : `${catTotals[activeCategory].pnl >= 0 ? '+' : ''}${fmtCr(Math.abs(catTotals[activeCategory].pnl))} (${catTotals[activeCategory].pct >= 0 ? '+' : ''}${catTotals[activeCategory].pct.toFixed(2)}%)`}
                </span>
              </div>
            </div>
          )}

          {activeCategory === 'orders' && (
            <div className={styles.tableWrap}>
              {loading ? (
                <div className={styles.ordersEmpty}>Loading orders…</div>
              ) : trades.length === 0 ? (
                <div className={styles.ordersEmpty}>
                  <div className={styles.ordersEmptyIcon}>📋</div>
                  <div className={styles.ordersEmptyTitle}>No orders yet</div>
                  <div className={styles.ordersEmptySub}>Place your first order to see trade history here.</div>
                </div>
              ) : (
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      {['Symbol', 'Side', 'Type', 'Qty', 'Price', 'Status', 'P&amp;L'].map((h, i) => (
                        <th key={h} className={i === 0 ? styles.thLeft : styles.thRight}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(t => {
                      const up = (t.pnl || 0) >= 0
                      const statusColor = { COMPLETE: T.green, PENDING: T.amber, CANCELLED: T.textMute, REJECTED: T.red }
                      const statusBg = { COMPLETE: T.greenBg, PENDING: T.amberBg, CANCELLED: T.bg, REJECTED: T.redBg }
                      return (
                        <tr key={t.id} className={styles.holdingRow}>
                          <td className={styles.cellAsset}>
                            <CompanyLogo symbol={t.symbol} name={t.symbol} size={32} />
                            <div>
                              <div className={styles.holdingName}>{SYMBOL_LABELS[t.symbol] || t.symbol}</div>
                              <div className={styles.holdingMeta}>{t.exchange} · {t.segment}</div>
                            </div>
                          </td>
                          <td className={styles.cellNum}>
                            <span className={styles.sidePill} style={{ background: t.side === 'BUY' ? T.blueBg : T.redBg, color: t.side === 'BUY' ? T.blue : T.red }}>{t.side}</span>
                          </td>
                          <td className={styles.cellNum}>{t.orderType}</td>
                          <td className={styles.cellNumStrong}>{t.quantity}</td>
                          <td className={styles.cellNum}>₹{(t.executedPrice || t.price || 0).toLocaleString('en-IN')}</td>
                          <td className={styles.cellNum}>
                            <span className={styles.statusPill} style={{ background: statusBg[t.status] || T.bg, color: statusColor[t.status] || T.textMute }}>{t.status}</span>
                          </td>
                          <td className={styles.cellPnlStrong} style={{ color: up ? T.greenDark : T.red }}>
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

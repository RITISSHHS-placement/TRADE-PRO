import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { TrendingUp, Zap, Shield, Activity, RefreshCw, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { setKillSwitchModal } from '../store/slices/uiSlice'
import { useTrades, useMarketData } from '../hooks'
import { Card, Stat, Badge, EmptyState, Spinner } from '../components/ui'
import { SYMBOL_LABELS } from '../services/marketData'
import styles from './DashboardPage.module.css'

const STATUS_COLORS = {
  PENDING: 'warning', COMPLETE: 'success',
  CANCELLED: 'default', REJECTED: 'danger', PARTIAL: 'accent',
}

const CHART_SYMBOL = '^NSEI'
const TICKER_SYMBOLS = ['^NSEI', '^BSESN', '^NSEBANK', 'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'WIPRO.NS', 'ICICIBANK.NS']
const WATCHLIST_SYMBOLS = [
  'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS',
  'WIPRO.NS', 'ICICIBANK.NS', 'SBIN.NS', 'BAJFINANCE.NS',
  'BHARTIARTL.NS', 'HINDUNILVR.NS', 'LT.NS', 'ITC.NS',
]

const fmt2  = (n) => n?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'
const fmt0  = (n) => n?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) ?? '—'
const fmtVol = (n) => {
  if (!n) return '—'
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `${(n / 1e5).toFixed(2)}L`
  return n.toLocaleString('en-IN')
}
const fmtTime = (ts) =>
  ts ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--'

/* ─── Live Stock Row ─────────────────────────────── */
function StockRow({ sym, quote, onSelect, isSelected }) {
  const up = (quote?.changePct ?? 0) >= 0
  const label = SYMBOL_LABELS[sym] || sym

  return (
    <div
      className={`${styles.stockRow} ${isSelected ? styles.stockRowActive : ''}`}
      onClick={() => onSelect(sym)}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(sym)}
    >
      {/* Symbol */}
      <div className={styles.srSym}>
        <span className={styles.srName}>{label}</span>
        <span className={styles.srCode}>{sym.replace('.NS','').replace('.BS','')}</span>
      </div>

      {/* Live price */}
      <div className={styles.srPrice}>
        {quote ? `₹${fmt2(quote.price)}` : <span className={styles.srLoading}>—</span>}
      </div>

      {/* Change */}
      <div className={up ? styles.srUp : styles.srDown}>
        {quote ? (
          <>
            {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {up ? '+' : ''}{fmt2(quote.change)}
            <span>({up ? '+' : ''}{quote.changePct.toFixed(2)}%)</span>
          </>
        ) : '—'}
      </div>

      {/* OHLV */}
      <div className={styles.srOhlv}>
        {quote ? (
          <>
            <span>O <b>{fmt2(quote.open)}</b></span>
            <span>H <b style={{ color: 'var(--green)' }}>{fmt2(quote.high)}</b></span>
            <span>L <b style={{ color: 'var(--red)' }}>{fmt2(quote.low)}</b></span>
            <span>V <b>{fmtVol(quote.volume)}</b></span>
          </>
        ) : '—'}
      </div>

      {/* Prev close */}
      <div className={styles.srPrev}>
        {quote ? `₹${fmt2(quote.prevClose)}` : '—'}
      </div>
    </div>
  )
}

/* ─── Charges Section ───────────────────────────── */
function ChargesSection() {
  const charges = [
    {
      amount: '0',
      title: 'Free equity delivery',
      desc: 'All equity delivery investments (NSE, BSE), are absolutely free — ₹0 brokerage.',
      color: '#f59e0b',
    },
    {
      amount: '20',
      title: 'Intraday and F&O trades',
      desc: 'Flat ₹20 or 0.03% (whichever is lower) per executed order on intraday trades across equity, currency, and commodity trades.',
      color: '#f59e0b',
      highlight: true,
    },
    {
      amount: '0',
      title: 'Free direct MF',
      desc: 'All direct mutual fund investments are absolutely free — ₹0 commissions & DP charges.',
      color: '#f59e0b',
    },
  ]

  return (
    <Card className={styles.chargesCard}>
      <div className={styles.chargesHeader}>
        <h2 className={styles.chargesTitle}>Charges</h2>
        <p className={styles.chargesSub}>List of all charges and taxes</p>
      </div>
      <div className={styles.chargesGrid}>
        {charges.map((c) => (
          <div key={c.title} className={`${styles.chargeItem} ${c.highlight ? styles.chargeHighlight : ''}`}>
            <div className={styles.chargeBig}>
              <span className={styles.chargeRupee}>₹</span>
              <span className={styles.chargeNum}>{c.amount}</span>
            </div>
            <h3 className={styles.chargeLabel}>{c.title}</h3>
            <p className={styles.chargeDesc}>{c.desc}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ─── Main Dashboard ────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)
  const { trades, loading: tradesLoading, loadTrades } = useTrades()
  const {
    quotes, chart, chartLoading,
    loading: quotesLoading, lastUpdated, error: marketError,
    refresh, changeChartSymbol,
  } = useMarketData({ intervalMs: 5000 })

  const [chartSym, setChartSym] = useState(CHART_SYMBOL)

  useEffect(() => { loadTrades() }, [])

  const handleSelect = (sym) => {
    setChartSym(sym)
    changeChartSymbol(sym)
  }

  const totalPnl = trades.reduce((acc, t) => acc + (t.pnl || 0), 0)
  const completedTrades = trades.filter((t) => t.status === 'COMPLETE').length
  const nifty  = quotes['^NSEI']
  const sensex = quotes['^BSESN']
  const bank   = quotes['^NSEBANK']
  const marketState = nifty?.marketState || 'CLOSED'
  const marketStatusLabel = marketState === 'REGULAR' ? 'Market Open' : 'Market Closed'
  const marketStatusClass = marketState === 'REGULAR' ? styles.statusOpen : styles.statusClosed
  const chartQuote = quotes[chartSym]
  const chartUp    = (chartQuote?.changePct ?? 0) >= 0
  const chartData  = chart.length >= 2 ? chart : []

  const tickerQuoteList = TICKER_SYMBOLS
    .map((sym) => ({ sym, quote: quotes[sym] }))
    .filter((item) => item.quote && typeof item.quote.changePct === 'number')

  const topGainer = tickerQuoteList.reduce((best, current) => {
    if (!best || current.quote.changePct > best.quote.changePct) return current
    return best
  }, null)

  const topLoser = tickerQuoteList.reduce((worst, current) => {
    if (!worst || current.quote.changePct < worst.quote.changePct) return current
    return worst
  }, null)

  return (
    <div className={styles.page}>

      {/* ── Ticker bar ── */}
      <div className={styles.tickerBar}>
        {TICKER_SYMBOLS.map((sym) => {
          const q = quotes[sym]
          const up = (q?.changePct ?? 0) >= 0
          return (
            <div key={sym} className={styles.tickerItem} onClick={() => handleSelect(sym)}>
              <span className={styles.tickerSym}>{SYMBOL_LABELS[sym] || sym}</span>
              {q ? (
                <>
                  <span className={styles.tickerVal}>₹{fmt2(q.price)}</span>
                  <span className={up ? styles.tickerUp : styles.tickerDown}>
                    {up ? '▲' : '▼'} {Math.abs(q.changePct).toFixed(2)}%
                  </span>
                </>
              ) : <span className={styles.tickerVal}>—</span>}
            </div>
          )
        })}
        <div className={styles.tickerRight}>
          <span className={styles.tickerTime}><Clock size={11} /> {fmtTime(lastUpdated)}</span>
          <button className={styles.refreshBtn} onClick={refresh} disabled={quotesLoading}>
            <RefreshCw size={12} className={quotesLoading ? styles.spinning : ''} />
          </button>
        </div>
      </div>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className={styles.sub}>Here's your live market overview and portfolio summary.</p>
          <div className={styles.liveMeta}>
            <span className={`${styles.statusBadge} ${marketStatusClass}`}>{marketStatusLabel}</span>
            <span className={styles.liveBadge}><span className={styles.liveDot} /> Refreshed every 5 seconds</span>
            <span className={styles.liveNote}>{lastUpdated ? `Updated ${fmtTime(lastUpdated)}` : 'Connecting to live market data…'}</span>
          </div>
        </div>
        <button className={styles.tradeBtn} onClick={() => navigate('/dashboard/trade')}>
          <TrendingUp size={15} /> Place Order
        </button>
      </div>

      {/* ── Index Stats ── */}
      <div className={styles.statsGrid}>
        <Stat label="NIFTY 50"
          value={nifty ? `₹${fmt2(nifty.price)}` : '—'}
          change={nifty ? `${nifty.changePct >= 0 ? '+' : ''}${nifty.changePct.toFixed(2)}% today` : 'Loading...'}
          changeType={nifty ? (nifty.changePct >= 0 ? 'up' : 'down') : 'up'}
        />
        <Stat label="SENSEX"
          value={sensex ? `₹${fmt2(sensex.price)}` : '—'}
          change={sensex ? `${sensex.changePct >= 0 ? '+' : ''}${sensex.changePct.toFixed(2)}% today` : 'Loading...'}
          changeType={sensex ? (sensex.changePct >= 0 ? 'up' : 'down') : 'up'}
        />
        <Stat label="BANK NIFTY"
          value={bank ? `₹${fmt2(bank.price)}` : '—'}
          change={bank ? `${bank.changePct >= 0 ? '+' : ''}${bank.changePct.toFixed(2)}% today` : 'Loading...'}
          changeType={bank ? (bank.changePct >= 0 ? 'up' : 'down') : 'up'}
        />
        <Stat label="Unrealised P&L"
          value={`${totalPnl >= 0 ? '+' : ''}₹${Math.abs(totalPnl).toLocaleString('en-IN')}`}
          change={`${completedTrades} completed trades`}
          changeType={totalPnl >= 0 ? 'up' : 'down'}
        />
      </div>

      <div className={styles.moversGrid}>
        <Card className={styles.moverCard}>
          <div className={styles.moverHeader}>Top Gainer</div>
          {topGainer ? (
            <div className={styles.moverBody}>
              <span className={styles.moverSymbol}>{SYMBOL_LABELS[topGainer.sym] || topGainer.sym}</span>
              <span className={styles.moverPrice}>₹{fmt2(topGainer.quote.price)}</span>
              <span className={styles.moverChange}>+{topGainer.quote.changePct.toFixed(2)}%</span>
            </div>
          ) : (
            <div className={styles.moverEmpty}>Waiting for live quote updates…</div>
          )}
        </Card>
        <Card className={styles.moverCard}>
          <div className={styles.moverHeader}>Top Loser</div>
          {topLoser ? (
            <div className={styles.moverBody}>
              <span className={styles.moverSymbol}>{SYMBOL_LABELS[topLoser.sym] || topLoser.sym}</span>
              <span className={styles.moverPrice}>₹{fmt2(topLoser.quote.price)}</span>
              <span className={styles.moverChange}>{topLoser.quote.changePct >= 0 ? '+' : ''}{topLoser.quote.changePct.toFixed(2)}%</span>
            </div>
          ) : (
            <div className={styles.moverEmpty}>Waiting for live quote updates…</div>
          )}
        </Card>
      </div>

      {/* ── Chart + Quick Actions ── */}
      <div className={styles.mainGrid}>
        <Card className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <div className={styles.chartSymPicker}>
                {['^NSEI', '^BSESN', '^NSEBANK', 'RELIANCE.NS', 'TCS.NS', 'INFY.NS'].map((sym) => (
                  <button key={sym}
                    className={`${styles.chartSymBtn} ${chartSym === sym ? styles.chartSymActive : ''}`}
                    onClick={() => handleSelect(sym)}
                  >
                    {SYMBOL_LABELS[sym] || sym}
                  </button>
                ))}
              </div>
              <div className={styles.chartPrice}>
                {chartQuote ? `₹${fmt2(chartQuote.price)}` : '—'}
                {chartQuote && (
                  <span className={chartUp ? styles.chartChangeUp : styles.chartChangeDown}>
                    {chartUp ? '↑' : '↓'} {chartUp ? '+' : ''}{fmt2(chartQuote.change)} ({Math.abs(chartQuote.changePct).toFixed(2)}%)
                  </span>
                )}
              </div>
              {chartQuote && (
                <div className={styles.chartMeta}>
                  <span>Open <b>₹{fmt2(chartQuote.open)}</b></span>
                  <span>High <b style={{ color: 'var(--green)' }}>₹{fmt2(chartQuote.high)}</b></span>
                  <span>Low <b style={{ color: 'var(--red)' }}>₹{fmt2(chartQuote.low)}</b></span>
                  <span>Prev Close <b>₹{fmt2(chartQuote.prevClose)}</b></span>
                  <span>Volume <b>{fmtVol(chartQuote.volume)}</b></span>
                </div>
              )}
            </div>
            <div className={styles.liveTag}><span className={styles.liveDot} />LIVE</div>
          </div>

          {chartLoading && chartData.length === 0 ? (
            <div className={styles.chartLoader}><Spinner size={24} /><span>Loading chart…</span></div>
          ) : chartData.length === 0 ? (
            <div className={styles.chartLoader}><span style={{ color: 'var(--gray-3)', fontSize: 13 }}>{marketError ? 'Data unavailable.' : 'Loading…'}</span></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartUp ? '#00a844' : '#dc2626'} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={chartUp ? '#00a844' : '#dc2626'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} tickFormatter={fmt0} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, color: '#111', fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                  cursor={{ stroke: 'rgba(0,0,0,0.1)' }}
                  formatter={(v) => [`₹${fmt2(v)}`, SYMBOL_LABELS[chartSym] || chartSym]}
                />
                <Area type="monotone" dataKey="value"
                  stroke={chartUp ? '#00a844' : '#dc2626'} strokeWidth={2}
                  fill="url(#cg)" dot={false} isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <div className={styles.quickCards}>
          <Card className={styles.quickCard} onClick={() => navigate('/dashboard/security')}>
            <div className={styles.quickIcon} style={{ background: '#ede9fe', color: '#7c3aed' }}><Shield size={20} /></div>
            <div className={styles.quickTitle}>Security</div>
            <div className={styles.quickDesc}>2FA, TOTP, device management</div>
          </Card>
          <Card className={styles.quickCard} onClick={() => navigate('/dashboard/settings')}>
            <div className={styles.quickIcon} style={{ background: '#fef3c7', color: '#d97706' }}><Activity size={20} /></div>
            <div className={styles.quickTitle}>Risk Controls</div>
            <div className={styles.quickDesc}>Kill switch, limits, watchdogs</div>
          </Card>
          <Card className={`${styles.quickCard} ${styles.killCard}`} onClick={() => dispatch(setKillSwitchModal(true))}>
            <div className={styles.quickIcon} style={{ background: 'var(--red-dim)', color: 'var(--red-dark)' }}><Zap size={20} /></div>
            <div className={styles.quickTitle}>Kill Switch</div>
            <div className={styles.quickDesc}>Pause trading instantly</div>
          </Card>
        </div>
      </div>

      {/* ── Live Stocks Table ── */}
      <Card className={styles.stocksCard}>
        <div className={styles.stocksHeader}>
          <div>
            <h2 className={styles.stocksTitle}>Live Market Watch</h2>
            <p className={styles.stocksSub}>Real-time prices · Refreshed every 5 seconds</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {quotesLoading && <Spinner size={14} />}
            <span className={styles.watchUpdate}>{fmtTime(lastUpdated)}</span>
            <button className={styles.refreshBtn} onClick={refresh} disabled={quotesLoading}>
              <RefreshCw size={12} className={quotesLoading ? styles.spinning : ''} />
            </button>
          </div>
        </div>

        {/* Table head */}
        <div className={styles.stockTableHead}>
          <span>Symbol</span>
          <span>LTP</span>
          <span>Change</span>
          <span>Open / High / Low / Volume</span>
          <span>Prev Close</span>
        </div>

        <div className={styles.stockTableBody}>
          {WATCHLIST_SYMBOLS.map((sym) => (
            <StockRow
              key={sym} sym={sym}
              quote={quotes[sym]}
              onSelect={handleSelect}
              isSelected={chartSym === sym}
            />
          ))}
        </div>
      </Card>

      {/* ── Charges ── */}
      <ChargesSection />

      {/* ── Recent Orders ── */}
      <Card className={styles.tradesCard}>
        <div className={styles.tradesHeader}>
          <h2 className={styles.tradesTitle}>Recent Orders</h2>
          <button className={styles.viewAll} onClick={() => navigate('/dashboard/portfolio')}>View all →</button>
        </div>

        {tradesLoading ? (
          <div className={styles.tradesLoading}><Spinner size={32} /></div>
        ) : trades.length === 0 ? (
          <EmptyState icon="◳" title="No orders yet" description="Place your first order to see it here." />
        ) : (
          <div className={styles.tradesTable}>
            <div className={styles.tableHeader}>
              <span>Symbol</span><span>Type</span><span>Qty</span>
              <span>Price</span><span>Status</span><span>P&L</span>
            </div>
            {trades.slice(0, 8).map((trade) => (
              <div key={trade.id} className={styles.tableRow}>
                <div>
                  <div className={styles.symbol}>{trade.symbol}</div>
                  <div className={styles.exchange}>{trade.exchange} · {trade.segment}</div>
                </div>
                <div><Badge variant={trade.side === 'BUY' ? 'success' : 'danger'}>{trade.side}</Badge></div>
                <div className={styles.qty}>{trade.quantity}</div>
                <div className={styles.price}>₹{(trade.executedPrice || trade.price || 0).toLocaleString('en-IN')}</div>
                <div><Badge variant={STATUS_COLORS[trade.status] || 'default'}>{trade.status}</Badge></div>
                <div className={trade.pnl >= 0 ? styles.pnlUp : styles.pnlDown}>
                  {trade.pnl >= 0 ? '+' : ''}₹{(trade.pnl || 0).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

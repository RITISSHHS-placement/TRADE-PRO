import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { TrendingUp, Zap, Shield, Activity, RefreshCw, Clock } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { setKillSwitchModal } from '../store/slices/uiSlice'
import { useTrades, useMarketData } from '../hooks'
import { Card, Stat, Badge, EmptyState, Spinner } from '../components/ui'
import { SYMBOL_LABELS } from '../services/marketData'
import styles from './DashboardPage.module.css'

const STATUS_COLORS = {
  PENDING: 'warning',
  COMPLETE: 'success',
  CANCELLED: 'default',
  REJECTED: 'danger',
  PARTIAL: 'accent',
}

const CHART_SYMBOL = '^NSEI'
const WATCHLIST_SYMBOLS = ['RELIANCE.NS', 'INFY.NS', 'HDFCBANK.NS', 'TCS.NS', 'WIPRO.NS', 'ICICIBANK.NS', 'SBIN.NS', 'BAJFINANCE.NS']

function formatTime(ts) {
  if (!ts) return '--'
  const d = new Date(ts)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function fmtVolume(n) {
  if (!n) return '--'
  if (n >= 1e7) return `${(n / 1e7).toFixed(1)}Cr`
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L`
  return n.toLocaleString('en-IN')
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)
  const { trades, loading: tradesLoading, loadTrades } = useTrades()
  const {
    quotes,
    chart,
    chartLoading,
    loading: quotesLoading,
    lastUpdated,
    error: marketError,
    refresh,
    changeChartSymbol,
  } = useMarketData({ intervalMs: 5000 })

  const [chartSym, setChartSym] = useState(CHART_SYMBOL)

  useEffect(() => { loadTrades() }, [])

  const handleChartSymChange = (sym) => {
    setChartSym(sym)
    changeChartSymbol(sym)
  }

  const totalPnl = trades.reduce((acc, t) => acc + (t.pnl || 0), 0)
  const completedTrades = trades.filter((t) => t.status === 'COMPLETE').length
  const nifty = quotes['^NSEI']
  const sensex = quotes['^BSESN']
  const chartQuote = quotes[chartSym]
  const chartUp = (chartQuote?.changePct ?? 0) >= 0
  const chartData = chart.length >= 2 ? chart : []

  return (
    <motion.div className={styles.page} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <motion.div className={styles.tickerBar} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        {['^NSEI', '^BSESN', 'RELIANCE.NS', 'INFY.NS', 'TCS.NS', 'HDFCBANK.NS', 'WIPRO.NS'].map((sym) => {
          const q = quotes[sym]
          if (!q) return (
            <div key={sym} className={styles.tickerItem}>
              <span className={styles.tickerSym}>{SYMBOL_LABELS[sym] || sym}</span>
              <span className={styles.tickerVal}>—</span>
            </div>
          )
          const up = q.changePct >= 0
          return (
            <div key={sym} className={styles.tickerItem}>
              <span className={styles.tickerSym}>{SYMBOL_LABELS[sym] || sym}</span>
              <span className={styles.tickerVal}>₹{q.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={up ? styles.tickerUp : styles.tickerDown}>{up ? '▲' : '▼'} {Math.abs(q.changePct).toFixed(2)}%</span>
            </div>
          )
        })}

        <div className={styles.tickerRight}>
          <span className={styles.tickerTime}><Clock size={11} /> {formatTime(lastUpdated)}</span>
          <button className={styles.refreshBtn} onClick={refresh} disabled={quotesLoading} title="Refresh market data">
            <RefreshCw size={13} className={quotesLoading ? styles.spinning : ''} />
          </button>
        </div>
      </motion.div>

      <motion.div className={styles.header} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.5 }}>
        <div>
          <h1 className={styles.title}>Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className={styles.sub}>A premium view of the markets and your positions.</p>
        </div>
        <button className={styles.tradeBtn} onClick={() => navigate('/dashboard/trade')}>
          <TrendingUp size={16} /> Place Order
        </button>
      </motion.div>

      <motion.div className={styles.statsGrid} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
        <Stat
          label="NIFTY 50"
          value={nifty ? `₹${nifty.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          change={nifty ? `${nifty.changePct >= 0 ? '+' : ''}${nifty.changePct.toFixed(2)}% today` : 'Loading...'}
          changeType={nifty ? (nifty.changePct >= 0 ? 'up' : 'down') : 'up'}
        />
        <Stat
          label="SENSEX"
          value={sensex ? `₹${sensex.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          change={sensex ? `${sensex.changePct >= 0 ? '+' : ''}${sensex.changePct.toFixed(2)}% today` : 'Loading...'}
          changeType={sensex ? (sensex.changePct >= 0 ? 'up' : 'down') : 'up'}
        />
        <Stat
          label="Unrealised P&L"
          value={`${totalPnl >= 0 ? '+' : ''}₹${Math.abs(totalPnl).toLocaleString('en-IN')}`}
          change={`${completedTrades} completed trades`}
          changeType={totalPnl >= 0 ? 'up' : 'down'}
        />
        <Stat
          label="Margin Used"
          value="64%"
          change="₹1.2L free"
          changeType="up"
        />
      </motion.div>

      <div className={styles.mainGrid}>
        <Card className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <div className={styles.chartSymPicker}>
                {['^NSEI', '^BSESN', 'RELIANCE.NS', 'TCS.NS', 'INFY.NS'].map((sym) => (
                  <button
                    key={sym}
                    className={`${styles.chartSymBtn} ${chartSym === sym ? styles.chartSymActive : ''}`}
                    onClick={() => handleChartSymChange(sym)}
                  >
                    {SYMBOL_LABELS[sym] || sym}
                  </button>
                ))}
              </div>
              <div className={styles.chartPrice}>
                {chartQuote ? `₹${chartQuote.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                {chartQuote && (
                  <span className={chartUp ? styles.chartChangeUp : styles.chartChangeDown}>
                    {chartUp ? '↑' : '↓'} {Math.abs(chartQuote.changePct).toFixed(2)}%
                  </span>
                )}
              </div>
              {chartQuote && (
                <div className={styles.chartMeta}>
                  <span>O: ₹{chartQuote.open.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  <span>H: ₹{chartQuote.high.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  <span>L: ₹{chartQuote.low.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  <span>Vol: {fmtVolume(chartQuote.volume)}</span>
                </div>
              )}
            </div>
            <div className={styles.liveTag}>
              <span className={styles.liveDot} /> LIVE
            </div>
          </div>

          {chartLoading && chartData.length === 0 ? (
            <div className={styles.chartLoader}>
              <Spinner size={28} />
              <span>Loading chart data…</span>
            </div>
          ) : chartData.length === 0 ? (
            <div className={styles.chartLoader}>
              <span className={styles.chartError}>
                {marketError ? 'Market data unavailable.' : 'Chart data loading…'}
              </span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartUp ? '#00d084' : '#ff4d6a'} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={chartUp ? '#00d084' : '#ff4d6a'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#80809a', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#80809a', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} tickFormatter={(v) => v.toLocaleString('en-IN')} />
                <Tooltip contentStyle={{ background: '#0f111f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 13 }} cursor={{ stroke: 'rgba(255,255,255,0.12)' }} formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, SYMBOL_LABELS[chartSym] || chartSym]} />
                <Area type="monotone" dataKey="value" stroke={chartUp ? '#00d084' : '#ff4d6a'} strokeWidth={2} fill="url(#chartGrad)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <div className={styles.quickCards}>
          <Card className={styles.quickCard} onClick={() => navigate('/dashboard/security')}>
            <div className={styles.quickIcon} style={{ background: 'rgba(123,97,255,0.12)', color: '#a390ff' }}><Shield size={20} /></div>
            <div className={styles.quickTitle}>Security</div>
            <div className={styles.quickDesc}>2FA, TOTP, device management</div>
          </Card>
          <Card className={styles.quickCard} onClick={() => navigate('/dashboard/settings')}>
            <div className={styles.quickIcon} style={{ background: 'rgba(247,168,65,0.12)', color: '#f7a841' }}><Activity size={20} /></div>
            <div className={styles.quickTitle}>Risk Controls</div>
            <div className={styles.quickDesc}>Kill switch, limits, watchdogs</div>
          </Card>
          <Card className={`${styles.quickCard} ${styles.killCard}`} onClick={() => dispatch(setKillSwitchModal(true))}>
            <div className={styles.quickIcon} style={{ background: 'rgba(255,77,106,0.14)', color: '#ff4d6a' }}><Zap size={20} /></div>
            <div className={styles.quickTitle}>Kill Switch</div>
            <div className={styles.quickDesc}>Pause trading instantly</div>
          </Card>
        </div>
      </div>

      <Card className={styles.watchlistCard}>
        <div className={styles.tradesHeader}>
          <h2 className={styles.tradesTitle}>Market Watchlist</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {quotesLoading && <Spinner size={14} />}
            <span className={styles.watchUpdate}>Updated {formatTime(lastUpdated)}</span>
          </div>
        </div>

        <div className={styles.watchGrid}>
          {WATCHLIST_SYMBOLS.map((sym) => {
            const q = quotes[sym]
            const up = (q?.changePct ?? 0) >= 0
            return (
              <div
                key={sym}
                className={styles.watchCard}
                onClick={() => handleChartSymChange(sym)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleChartSymChange(sym)}
                aria-label={`View ${SYMBOL_LABELS[sym] || sym} chart`}
              >
                <div className={styles.watchTop}>
                  <span className={styles.watchSym}>{SYMBOL_LABELS[sym] || sym}</span>
                  <span className={up ? styles.watchBadgeUp : styles.watchBadgeDown}>
                    {up ? '▲' : '▼'} {q ? Math.abs(q.changePct).toFixed(2) : '--'}%
                  </span>
                </div>
                <div className={styles.watchPrice}>
                  {q ? `₹${q.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <span className={styles.watchLoading}>Loading…</span>}
                </div>
                {q && (
                  <div className={styles.watchMeta}>
                    <span>H {q.high.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    <span>L {q.low.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

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
              <span>Symbol</span>
              <span>Type</span>
              <span>Qty</span>
              <span>Price</span>
              <span>Status</span>
              <span>P&L</span>
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
                <div className={trade.pnl >= 0 ? styles.pnlUp : styles.pnlDown}>{trade.pnl >= 0 ? '+' : ''}₹{(trade.pnl || 0).toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  )
}

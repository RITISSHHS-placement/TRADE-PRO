import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Zap, Shield,
  Activity, RefreshCw, Clock, ArrowUpRight, ArrowDownRight, MoreHorizontal,
} from 'lucide-react'
import { useDispatch } from 'react-redux'
import { setKillSwitchModal } from '../store/slices/uiSlice'
import { useTrades, useMarketData } from '../hooks'
import { Card, Stat, Badge, EmptyState, Spinner } from '../components/ui'
import { FadeIn, Stagger } from '../components/animations'
import { SYMBOL_LABELS } from '../services/marketData'
import styles from './DashboardPage.module.css'

const STATUS_COLORS = {
  PENDING: 'warning', COMPLETE: 'success',
  CANCELLED: 'default', REJECTED: 'danger', PARTIAL: 'accent',
}

const fmt2 = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmt0 = (n) => (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
const fmtVol = (n) => {
  if (!n) return '—'
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `${(n / 1e5).toFixed(2)}L`
  return n.toLocaleString('en-IN')
}
const fmtTime = (ts) =>
  ts ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--'

// Key indices to show
const KEY_INDICES = ['NIFTY 50', 'NIFTY BANK', 'NIFTY IT', 'INDIA VIX']

// Ticker indices
const TICKER_INDICES = ['NIFTY 50', 'NIFTY BANK', 'SENSEX', 'NIFTY IT', 'INDIA VIX']

// Stocks to show in live table
const WATCHLIST = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
  'HINDUNILVR', 'SBIN', 'BAJFINANCE', 'BHARTIARTL',
  'KOTAKBANK', 'WIPRO', 'LT', 'ITC', 'TATAMOTORS', 'AXISBANK',
]

/* ── Index Card ── */
function IndexCard({ label, data, onClick, isSelected }) {
  const up = (data?.changePct ?? 0) >= 0
  return (
    <div 
      className={`${styles.indexCard} ${isSelected ? styles.indexCardActive : ''}`}
      onClick={onClick}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className={styles.icHeader}>
        <span className={styles.icLabel}>{label}</span>
      </div>
      <div className={styles.icPrice}>{data ? fmt2(data.price) : '—'}</div>
      <div className={up ? styles.icChangeUp : styles.icChangeDown}>
        {data ? (
          <>
            {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {up ? '+' : ''}{fmt2(data.change)}
            <span className={styles.icPercent}>({up ? '+' : ''}{(data.changePct ?? 0).toFixed(2)}%)</span>
          </>
        ) : '—'}
      </div>
    </div>
  )
}

/* ── Stock row ── */
function StockRow({ sym, quote, isSelected, onSelect }) {
  const up = (quote?.changePct ?? 0) >= 0
  const name = SYMBOL_LABELS[sym] || sym
  return (
    <div
      className={`${styles.stockRow} ${isSelected ? styles.stockRowActive : ''}`}
      onClick={() => onSelect(sym)}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(sym)}
    >
      <div className={styles.srSym}>
        <span className={styles.srName}>{name}</span>
        <span className={styles.srCode}>{sym}</span>
      </div>
      <div className={styles.srPrice}>
        {quote ? `₹${fmt2(quote.price)}` : <span className={styles.srLoading}>—</span>}
      </div>
      <div className={up ? styles.srUp : styles.srDown}>
        {quote ? (
          <>
            {up ? <ArrowUpRight size={13}/> : <ArrowDownRight size={13}/>}
            {Math.abs(quote.change ?? 0).toFixed(2)}
            <span>({up ? '+' : ''}{(quote.changePct ?? 0).toFixed(2)}%)</span>
          </>
        ) : '—'}
      </div>
      <div className={styles.srStats}>
        {quote ? (
          <>
            <span><b>{fmt2(quote.open)}</b></span>
            <span style={{ color: '#10b981' }}><b>{fmt2(quote.high)}</b></span>
            <span style={{ color: '#ef4444' }}><b>{fmt2(quote.low)}</b></span>
            <span><b>{fmtVol(quote.volume)}</b></span>
          </>
        ) : '—'}
      </div>
    </div>
  )
}

/* ── Charges ── */
function Charges() {
  return (
    <Card className={styles.chargesCard}>
      <div className={styles.chargesHeader}>
        <h2 className={styles.chargesTitle}>Charges</h2>
        <p className={styles.chargesSub}>List of all charges and taxes</p>
      </div>
      <div className={styles.chargesGrid}>
        {[
          { n: '0',  title: 'Free equity delivery',  desc: 'All equity delivery investments (NSE, BSE), are absolutely free — ₹0 brokerage.' },
          { n: '20', title: 'Intraday and F&O trades', desc: 'Flat ₹20 or 0.03% (whichever is lower) per executed order on intraday, currency and commodity trades.', hi: true },
          { n: '0',  title: 'Free direct MF',          desc: 'All direct mutual fund investments are absolutely free — ₹0 commissions & DP charges.' },
        ].map((c) => (
          <div key={c.title} className={`${styles.chargeItem} ${c.hi ? styles.chargeHighlight : ''}`}>
            <div className={styles.chargeBig}><span className={styles.chargeRupee}>₹</span><span className={styles.chargeNum}>{c.n}</span></div>
            <h3 className={styles.chargeLabel}>{c.title}</h3>
            <p className={styles.chargeDesc}>{c.desc}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const navigate   = useNavigate()
  const dispatch   = useDispatch()
  const { user }   = useSelector((s) => s.auth)
  const { trades, loading: tradesLoading, loadTrades } = useTrades()
  const { indices, stocks, gainers, losers, loading, lastUpdated, error, refresh } = useMarketData()

  const [selectedSym, setSelectedSym] = useState('NIFTY 50')

  useEffect(() => { loadTrades() }, [])

  const totalPnl        = trades.reduce((a, t) => a + (t.pnl || 0), 0)
  const completedTrades = trades.filter((t) => t.status === 'COMPLETE').length

  const nifty  = indices['NIFTY 50']
  const bank   = indices['NIFTY BANK']
  const sensex = indices['NIFTY NEXT 50']
  const vix    = indices['INDIA VIX']

  const selQuote = indices[selectedSym] || stocks[selectedSym]
  const selUp    = (selQuote?.changePct ?? 0) >= 0

  return (
    <div className={styles.page}>

      {/* ── Ticker ── */}
      <FadeIn duration={0.4}>
        <div className={styles.tickerBar}>
        {TICKER_INDICES.map((key) => {
          const q  = indices[key]
          const up = (q?.changePct ?? 0) >= 0
          return (
            <div key={key} className={styles.tickerItem}
              onClick={() => setSelectedSym(key)}>
              <span className={styles.tickerSym}>{SYMBOL_LABELS[key] || key}</span>
              {q ? (
                <>
                  <span className={styles.tickerVal}>{fmt2(q.price)}</span>
                  <span className={up ? styles.tickerUp : styles.tickerDown}>
                    {up ? '▲' : '▼'} {Math.abs(q.changePct ?? 0).toFixed(2)}%
                  </span>
                </>
              ) : <span className={styles.tickerVal}>—</span>}
            </div>
          )
        })}
        <div className={styles.tickerRight}>
          <span className={styles.tickerTime}><Clock size={11}/> {fmtTime(lastUpdated)}</span>
          <button className={styles.refreshBtn} onClick={refresh} disabled={loading}>
            <RefreshCw size={12} className={loading ? styles.spinning : ''} />
          </button>
        </div>
      </div>
      </FadeIn>

      {/* ── Header ── */}
      <FadeIn y={15} duration={0.5}>
        <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className={styles.sub}>
            {loading && !lastUpdated ? 'Connecting to NSE live data…'
              : error ? 'Live data unavailable — retrying…'
              : `Live NSE data · Updated ${fmtTime(lastUpdated)}`}
          </p>
        </div>
        <button className={styles.tradeBtn} onClick={() => navigate('/dashboard/trade')}>
          <TrendingUp size={15}/> Place Order
        </button>
      </div>
      </FadeIn>

      {/* ── Stats ── */}
      <Stagger stagger={0.08} duration={0.4} className={styles.statsGrid}>
        <Stat label="NIFTY 50"
          value={nifty ? fmt2(nifty.price) : '—'}
          change={nifty ? `${nifty.changePct >= 0 ? '+' : ''}${(nifty.changePct ?? 0).toFixed(2)}% today` : 'Loading…'}
          changeType={nifty ? (nifty.changePct >= 0 ? 'up' : 'down') : 'up'}
        />
        <Stat label="BANK NIFTY"
          value={bank ? fmt2(bank.price) : '—'}
          change={bank ? `${bank.changePct >= 0 ? '+' : ''}${(bank.changePct ?? 0).toFixed(2)}% today` : 'Loading…'}
          changeType={bank ? (bank.changePct >= 0 ? 'up' : 'down') : 'up'}
        />
        <Stat label="INDIA VIX"
          value={vix ? fmt2(vix.price) : '—'}
          change={vix ? `${vix.changePct >= 0 ? '+' : ''}${(vix.changePct ?? 0).toFixed(2)}% today` : 'Loading…'}
          changeType={vix ? (vix.changePct >= 0 ? 'up' : 'down') : 'up'}
        />
        <Stat label="My P&L"
          value={`${totalPnl >= 0 ? '+' : ''}₹${Math.abs(totalPnl).toLocaleString('en-IN')}`}
          change={`${completedTrades} completed trades`}
          changeType={totalPnl >= 0 ? 'up' : 'down'}
        />
      </Stagger>

      {/* ── Gainers / Losers ── */}
      <div className={styles.moversRow}>
        <Card className={styles.moverCard}>
          <div className={styles.moverHead}><TrendingUp size={14}/> Top Gainers</div>
          {gainers.length === 0
            ? <div className={styles.moverEmpty}>{loading ? <Spinner size={16}/> : 'Loading…'}</div>
            : gainers.slice(0, 5).map((g) => (
              <div key={g.symbol} className={styles.moverRow} onClick={() => setSelectedSym(g.symbol)}>
                <span className={styles.moverSym}>{SYMBOL_LABELS[g.symbol] || g.symbol}</span>
                <span className={styles.moverUp}>+{(g.changePct ?? 0).toFixed(2)}%</span>
              </div>
            ))
          }
        </Card>
        <Card className={styles.moverCard}>
          <div className={styles.moverHead}><TrendingDown size={14}/> Top Losers</div>
          {losers.length === 0
            ? <div className={styles.moverEmpty}>{loading ? <Spinner size={16}/> : 'Loading…'}</div>
            : losers.slice(0, 5).map((l) => (
              <div key={l.symbol} className={styles.moverRow} onClick={() => setSelectedSym(l.symbol)}>
                <span className={styles.moverSym}>{SYMBOL_LABELS[l.symbol] || l.symbol}</span>
                <span className={styles.moverDown}>{(l.changePct ?? 0).toFixed(2)}%</span>
              </div>
            ))
          }
        </Card>

        {/* Selected quote detail */}
        {selQuote && (
          <FadeIn duration={0.4}>
            <Card className={styles.quoteDetail}>
            <div className={styles.qdSym}>{SYMBOL_LABELS[selectedSym] || selectedSym}</div>
            <div className={`${styles.qdPrice} ${selUp ? styles.qdUp : styles.qdDown}`}>
              ₹{fmt2(selQuote.price)}
              <span>{selUp ? '▲' : '▼'} {Math.abs(selQuote.changePct ?? 0).toFixed(2)}%</span>
            </div>
            <div className={styles.qdGrid}>
              <div className={styles.qdItem}><span>Open</span><b>₹{fmt2(selQuote.open)}</b></div>
              <div className={styles.qdItem}><span>High</span><b style={{ color: 'var(--green)' }}>₹{fmt2(selQuote.high)}</b></div>
              <div className={styles.qdItem}><span>Low</span><b style={{ color: 'var(--red)' }}>₹{fmt2(selQuote.low)}</b></div>
              <div className={styles.qdItem}><span>Prev Close</span><b>₹{fmt2(selQuote.prevClose)}</b></div>
              {selQuote.volume && <div className={styles.qdItem}><span>Volume</span><b>{fmtVol(selQuote.volume)}</b></div>}
              {selQuote.yearHigh && <div className={styles.qdItem}><span>52W High</span><b>₹{fmt2(selQuote.yearHigh)}</b></div>}
              {selQuote.yearLow && <div className={styles.qdItem}><span>52W Low</span><b>₹{fmt2(selQuote.yearLow)}</b></div>}
            </div>
          </Card>
          </FadeIn>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <Stagger stagger={0.1} duration={0.4} className={styles.quickRow}>
        <Card className={styles.quickCard} onClick={() => navigate('/dashboard/security')}>
          <div className={styles.quickIcon} style={{ background: '#ede9fe', color: '#7c3aed' }}><Shield size={20}/></div>
          <div className={styles.quickTitle}>Security</div>
          <div className={styles.quickDesc}>2FA, TOTP, device management</div>
        </Card>
        <Card className={styles.quickCard} onClick={() => navigate('/dashboard/settings')}>
          <div className={styles.quickIcon} style={{ background: '#fef3c7', color: '#d97706' }}><Activity size={20}/></div>
          <div className={styles.quickTitle}>Risk Controls</div>
          <div className={styles.quickDesc}>Kill switch, limits, watchdogs</div>
        </Card>
        <Card className={`${styles.quickCard} ${styles.killCard}`} onClick={() => dispatch(setKillSwitchModal(true))}>
          <div className={styles.quickIcon} style={{ background: 'var(--red-dim)', color: 'var(--red-dark)' }}><Zap size={20}/></div>
          <div className={styles.quickTitle}>Kill Switch</div>
          <div className={styles.quickDesc}>Pause all trading instantly</div>
        </Card>
        <Card className={styles.quickCard} onClick={() => navigate('/dashboard/mf')}>
          <div className={styles.quickIcon} style={{ background: 'var(--green-dim)', color: 'var(--green-dark)' }}><TrendingUp size={20}/></div>
          <div className={styles.quickTitle}>Mutual Funds</div>
          <div className={styles.quickDesc}>₹0 commission · Direct plans</div>
        </Card>
      </Stagger>

      {/* ── Live Stocks Table ── */}
      <FadeIn y={20} duration={0.5}>
        <Card className={styles.stocksCard}>
        <div className={styles.stocksHeader}>
          <div>
            <h2 className={styles.stocksTitle}>Live Market Watch — NIFTY 50</h2>
            <p className={styles.stocksSub}>NSE India live prices · Refreshed every 6 seconds</p>
          </div>
          <div className={styles.stocksRight}>
            {loading && <Spinner size={14}/>}
            <span className={styles.watchUpdate}>{fmtTime(lastUpdated)}</span>
            <button className={styles.refreshBtn} onClick={refresh} disabled={loading}>
              <RefreshCw size={12} className={loading ? styles.spinning : ''}/>
            </button>
          </div>
        </div>
        <div className={styles.stockTableHead}>
          <span>Symbol</span><span>LTP</span>
          <span>Change</span><span>O / H / L / Vol</span><span>Prev Close</span>
        </div>
        <div>
          {WATCHLIST.map((sym) => (
            <StockRow key={sym} sym={sym} quote={stocks[sym]}
              isSelected={selectedSym === sym} onSelect={setSelectedSym} />
          ))}
        </div>
      </Card>
      </FadeIn>

      {/* ── Charges ── */}
      <FadeIn y={20} duration={0.5}>
        <Charges />
      </FadeIn>

      {/* ── Recent Orders ── */}
      <FadeIn y={20} duration={0.5}>
        <Card className={styles.tradesCard}>
          <div className={styles.tradesHeader}>
            <h2 className={styles.tradesTitle}>Recent Orders</h2>
            <button className={styles.viewAll} onClick={() => navigate('/dashboard/portfolio')}>View all →</button>
          </div>
          {tradesLoading ? (
            <div className={styles.tradesLoading}><Spinner size={32}/></div>
          ) : trades.length === 0 ? (
            <EmptyState icon="◳" title="No orders yet" description="Place your first order to see it here." />
          ) : (
            <div className={styles.tradesTable}>
              <div className={styles.tableHeader}>
                <span>Symbol</span><span>Type</span><span>Qty</span>
                <span>Price</span><span>Status</span><span>P&L</span>
              </div>
              {trades.slice(0, 8).map((t) => (
                <div key={t.id} className={styles.tableRow}>
                  <div>
                    <div className={styles.symbol}>{t.symbol}</div>
                    <div className={styles.exchange}>{t.exchange} · {t.segment}</div>
                  </div>
                  <div><Badge variant={t.side === 'BUY' ? 'success' : 'danger'}>{t.side}</Badge></div>
                  <div className={styles.qty}>{t.quantity}</div>
                  <div className={styles.price}>₹{(t.executedPrice || t.price || 0).toLocaleString('en-IN')}</div>
                  <div><Badge variant={STATUS_COLORS[t.status] || 'default'}>{t.status}</Badge></div>
                  <div className={t.pnl >= 0 ? styles.pnlUp : styles.pnlDown}>
                    {t.pnl >= 0 ? '+' : ''}₹{(t.pnl || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </FadeIn>

    </div>
  )
}

import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { TrendingUp, Zap, Shield, Activity } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { setKillSwitchModal } from '../store/slices/uiSlice'
import { useTrades } from '../hooks'
import { Card, Stat, Badge, EmptyState, Spinner } from '../components/ui'
import styles from './DashboardPage.module.css'

const MOCK_CHART = Array.from({ length: 20 }, (_, i) => ({
  time: `${9 + Math.floor(i / 2)}:${i % 2 === 0 ? '00' : '30'}`,
  value: 24000 + Math.round(Math.sin(i * 0.5) * 300 + i * 18 + Math.random() * 120),
}))

const STATUS_COLORS = {
  PENDING: 'warning',
  COMPLETE: 'success',
  CANCELLED: 'default',
  REJECTED: 'danger',
  PARTIAL: 'accent',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)
  const { trades, loading, loadTrades } = useTrades()

  useEffect(() => { loadTrades() }, [])

  const totalPnl = trades.reduce((acc, t) => acc + (t.pnl || 0), 0)
  const completedTrades = trades.filter((t) => t.status === 'COMPLETE').length

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className={styles.sub}>Here's what's happening with your portfolio today.</p>
        </div>
        <button className={styles.tradeBtn} onClick={() => navigate('/dashboard/trade')}>
          <TrendingUp size={16} /> Place Order
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <Stat
          label="Portfolio Value"
          value="₹24,80,000"
          change="+2.34% today"
          changeType="up"
        />
        <Stat
          label="Unrealised P&L"
          value={`${totalPnl >= 0 ? '+' : ''}₹${Math.abs(totalPnl).toLocaleString('en-IN')}`}
          change={completedTrades + ' trades'}
          changeType={totalPnl >= 0 ? 'up' : 'down'}
        />
        <Stat label="Day's P&L" value="+₹12,340" change="+0.89%" changeType="up" />
        <Stat label="Margin Used" value="64%" change="₹1.2L free" changeType="up" />
      </div>

      {/* Chart + Summary */}
      <div className={styles.mainGrid}>
        <Card className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <div className={styles.chartTitle}>NIFTY 50</div>
              <div className={styles.chartPrice}>
                24,381 <span className={styles.chartChange}>+0.42% ↑</span>
              </div>
            </div>
            <div className={styles.liveTag}>
              <span className={styles.liveDot} /> LIVE
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_CHART} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d084" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00d084" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#80809a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#80809a', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 13 }}
                cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'NIFTY 50']}
              />
              <Area type="monotone" dataKey="value" stroke="#00d084" strokeWidth={2} fill="url(#chartGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Quick Actions */}
        <div className={styles.quickCards}>
          <Card className={styles.quickCard} onClick={() => navigate('/dashboard/security')}>
            <div className={styles.quickIcon} style={{ background: 'rgba(123,97,255,0.12)', color: '#a390ff' }}>
              <Shield size={20} />
            </div>
            <div className={styles.quickTitle}>Security</div>
            <div className={styles.quickDesc}>2FA, TOTP, device management</div>
          </Card>
          <Card className={styles.quickCard} onClick={() => navigate('/dashboard/settings')}>
            <div className={styles.quickIcon} style={{ background: 'rgba(247,168,65,0.12)', color: '#f7a841' }}>
              <Activity size={20} />
            </div>
            <div className={styles.quickTitle}>Risk Controls</div>
            <div className={styles.quickDesc}>Kill switch, limits, nudges</div>
          </Card>
          <Card className={`${styles.quickCard} ${styles.killCard}`}
            onClick={() => dispatch(setKillSwitchModal(true))}>
            <div className={styles.quickIcon} style={{ background: 'rgba(255,77,106,0.12)', color: '#ff4d6a' }}>
              <Zap size={20} />
            </div>
            <div className={styles.quickTitle}>Kill Switch</div>
            <div className={styles.quickDesc}>Halt all trading instantly</div>
          </Card>
        </div>
      </div>

      {/* Recent Trades */}
      <Card className={styles.tradesCard}>
        <div className={styles.tradesHeader}>
          <h2 className={styles.tradesTitle}>Recent Orders</h2>
          <button className={styles.viewAll} onClick={() => navigate('/dashboard/portfolio')}>
            View all →
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Spinner size={32} />
          </div>
        ) : trades.length === 0 ? (
          <EmptyState
            icon="◳"
            title="No orders yet"
            description="Place your first order to see it here."
          />
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
                <div>
                  <Badge variant={trade.side === 'BUY' ? 'success' : 'danger'}>
                    {trade.side}
                  </Badge>
                </div>
                <div className={styles.qty}>{trade.quantity}</div>
                <div className={styles.price}>
                  ₹{(trade.executedPrice || trade.price || 0).toLocaleString('en-IN')}
                </div>
                <div>
                  <Badge variant={STATUS_COLORS[trade.status] || 'default'}>
                    {trade.status}
                  </Badge>
                </div>
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

import React, { useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useTrades } from '../hooks'
import { Card, Badge, EmptyState, Spinner } from '../components/ui'
import styles from './PortfolioPage.module.css'

const COLORS = ['#7b61ff', '#00d084', '#f7a841', '#ff4d6a', '#a390ff']

const PNL_DATA = [
  { day: 'Mon', pnl: 4200 },
  { day: 'Tue', pnl: -1800 },
  { day: 'Wed', pnl: 8400 },
  { day: 'Thu', pnl: 3100 },
  { day: 'Fri', pnl: 12340 },
]

const ALLOCATION = [
  { name: 'Equity', value: 55 },
  { name: 'Futures', value: 20 },
  { name: 'Options', value: 15 },
  { name: 'Currency', value: 6 },
  { name: 'Commodity', value: 4 },
]

export default function PortfolioPage() {
  const { trades, positions, loading, loadTrades, loadPositions } = useTrades()

  useEffect(() => {
    loadTrades()
    loadPositions()
  }, [])

  const totalPnl = trades.reduce((acc, t) => acc + (t.pnl || 0), 0)

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Portfolio</h1>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        {[
          { label: 'Total P&L', val: `+₹${totalPnl.toLocaleString('en-IN')}`, color: 'var(--green)' },
          { label: 'Portfolio Value', val: '₹24,80,000', color: 'var(--white)' },
          { label: 'Total Trades', val: trades.length, color: 'var(--white)' },
          { label: 'Win Rate', val: '68%', color: 'var(--accent-dim)' },
        ].map((s) => (
          <Card key={s.label} className={styles.summaryCard}>
            <div className={styles.sumLabel}>{s.label}</div>
            <div className={styles.sumVal} style={{ color: s.color }}>{s.val}</div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        <Card className={styles.chartCard}>
          <div className={styles.chartTitle}>Weekly P&L</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={PNL_DATA} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#80809a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#80809a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 13 }}
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'P&L']}
              />
              <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                {PNL_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? '#00d084' : '#ff4d6a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className={styles.chartCard}>
          <div className={styles.chartTitle}>Allocation</div>
          <div className={styles.pieRow}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={ALLOCATION} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {ALLOCATION.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.legend}>
              {ALLOCATION.map((a, i) => (
                <div key={a.name} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: COLORS[i] }} />
                  <span className={styles.legendName}>{a.name}</span>
                  <span className={styles.legendVal}>{a.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* All Trades Table */}
      <Card className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>All Orders</h2>
          <div className={styles.tableCount}>{trades.length} total</div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Spinner size={32} />
          </div>
        ) : trades.length === 0 ? (
          <EmptyState icon="◳" title="No orders yet" description="Your trading history will appear here." />
        ) : (
          <>
            <div className={styles.colHeader}>
              <span>Symbol</span>
              <span>Side</span>
              <span>Type</span>
              <span>Qty</span>
              <span>Avg Price</span>
              <span>Status</span>
              <span>P&L</span>
              <span>Charges</span>
            </div>
            {trades.map((t) => (
              <div key={t.id} className={styles.tradeRow}>
                <div>
                  <div className={styles.sym}>{t.symbol}</div>
                  <div className={styles.exc}>{t.exchange} · {t.segment}</div>
                </div>
                <Badge variant={t.side === 'BUY' ? 'success' : 'danger'}>{t.side}</Badge>
                <span style={{ fontSize: 12, color: 'var(--gray-2)' }}>{t.orderType}</span>
                <span style={{ fontWeight: 600 }}>{t.quantity}</span>
                <span>₹{(t.executedPrice || t.price || 0).toLocaleString('en-IN')}</span>
                <Badge variant={{ COMPLETE: 'success', PENDING: 'warning', CANCELLED: 'default', REJECTED: 'danger' }[t.status] || 'default'}>
                  {t.status}
                </Badge>
                <span className={t.pnl >= 0 ? styles.up : styles.down}>
                  {t.pnl >= 0 ? '+' : ''}₹{(t.pnl || 0).toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: 12, color: 'var(--gray-3)' }}>
                  ₹{(t.totalCharges || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </>
        )}
      </Card>
    </div>
  )
}

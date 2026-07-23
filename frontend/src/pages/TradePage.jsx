import React, { useState, memo } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { Activity, BarChart3, Bell, BrainCircuit, Radar, ShieldCheck, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { useTrades } from '../hooks'
import { Button, Input, Select, Card, Badge } from '../components/ui'
import { FadeIn, SlideUp } from '../components/animations'
import { SYMBOL_LABELS } from '../services/marketData'
import { GlassCard, GlassButton, GlassBadge, GlassTabs } from '../components/Glassmorphism'
import CandlestickChart from '../components/CandlestickChart'
import OrderBook, { MiniOrderBook } from '../components/OrderBook'
import styles from './TradePage.module.css'

const SEGMENTS = [
  { value: 'EQUITY', label: 'Equity' },
  { value: 'FUTURES', label: 'Futures' },
  { value: 'OPTIONS', label: 'Options' },
  { value: 'CURRENCY', label: 'Currency' },
  { value: 'COMMODITY', label: 'Commodity' },
]
const ORDER_TYPES = [
  { value: 'MARKET', label: 'Market' },
  { value: 'LIMIT', label: 'Limit' },
  { value: 'STOP_LOSS', label: 'Stop Loss' },
  { value: 'STOP_LOSS_MARKET', label: 'SL-Market' },
]
const EXCHANGES = [
  { value: 'NSE', label: 'NSE' },
  { value: 'BSE', label: 'BSE' },
  { value: 'MCX', label: 'MCX' },
]
const WATCH_SYMBOLS = ['NIFTY 50', 'NIFTY BANK', 'RELIANCE', 'INFY', 'HDFCBANK', 'TCS', 'WIPRO', 'ICICIBANK']
const INSIGHTS = [
  { title: 'Momentum is accelerating', copy: 'Volatility is cooling while upside breadth improves across large-cap names.', tone: 'positive' },
  { title: 'Risk posture is balanced', copy: 'Your guardrails are aligned with current market conditions and liquidity.', tone: 'neutral' },
  { title: 'Smart alerts enabled', copy: 'AI watches for breakout and breakdown patterns around your watchlist.', tone: 'positive' },
]

const formatPrice = (value) => {
  if (value == null || Number.isNaN(value)) return '—'
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Generate sample candlestick chart data
const generateSampleChartData = () => {
  const data = []
  let basePrice = 2500
  const now = Date.now()
  
  for (let i = 0; i < 50; i++) {
    const volatility = Math.random() * 20 - 10
    const open = basePrice
    const close = basePrice + volatility
    const high = Math.max(open, close) + Math.random() * 15
    const low = Math.min(open, close) - Math.random() * 15
    const volume = Math.floor(Math.random() * 1000000) + 500000
    
    data.push({
      timestamp: now - (50 - i) * 86400000,
      open,
      high,
      low,
      close,
      volume,
    })
    
    basePrice = close
  }
  
  return data
}

const MarketWatch = memo(function MarketWatch() {
  const indices = useSelector((s) => s.market?.indices || {})
  const stocks = useSelector((s) => s.market?.stocks || {})
  const lastUpdated = useSelector((s) => s.market?.lastUpdated)
  const quotes = { ...indices, ...stocks }

  return (
    <Card className={styles.watchCard}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Market Pulse</h2>
          <div className={styles.marketMeta}>
            <span className={styles.liveBadge}>
              <span className={styles.liveDot} /> Live · auto-refresh every 5s
            </span>
            <span className={styles.marketTime}>
              {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Connecting…'}
            </span>
          </div>
        </div>
      </div>
      <div className={styles.watchList}>
        {WATCH_SYMBOLS.map((sym) => {
          const q = quotes[sym]
          const up = (q?.changePct ?? 0) >= 0
          const height = Math.min(88, Math.max(28, Math.abs(q?.changePct ?? 0) * 8 + 26))
          return (
            <div key={sym} className={styles.watchItem}>
              <div>
                <div className={styles.watchSym}>{SYMBOL_LABELS[sym] || sym}</div>
                <div className={styles.watchEx}>{sym === 'NIFTY 50' || sym === 'NIFTY BANK' ? 'INDEX' : 'NSE'}</div>
              </div>
              <div className={styles.watchRight}>
                <div className={styles.watchPrice}>{q ? formatPrice(q.price) : '—'}</div>
                <div className={up ? styles.changeUp : styles.changeDown}>
                  {q ? `${up ? '↑' : '↓'} ${Math.abs(q.changePct).toFixed(2)}%` : '—'}
                </div>
              </div>
              <div className={styles.heatCellWrap}>
                <span className={`${styles.heatCell} ${up ? styles.heatUp : styles.heatDown}`} style={{ height: `${height}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
})

export default function TradePage() {
  const { place, placing, trades } = useTrades()
  const [side, setSide] = useState('BUY')
  const [isGTT, setIsGTT] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { exchange: 'NSE', segment: 'EQUITY', orderType: 'MARKET' } })

  const watchedOrderType = watch('orderType')

  const onSubmit = (data) => {
    place({
      symbol: data.symbol.toUpperCase(),
      exchange: data.exchange,
      segment: data.segment,
      orderType: data.orderType,
      side,
      quantity: parseInt(data.quantity, 10),
      price: data.price ? parseFloat(data.price) : null,
      triggerPrice: data.triggerPrice ? parseFloat(data.triggerPrice) : null,
      isGTT,
    })
    reset()
  }

  const recentTrades = trades.slice(0, 5)

  return (
    <div className={styles.page}>
      <FadeIn
        y={10}
        duration={0.35}
        className={styles.heroCard}
      >
        <div className={styles.heroContent}>
          <div className={styles.eyebrow}>
            <Sparkles size={14} /> AI analyst · Intelligent trading command center
          </div>
          <h1>Trade with clarity, speed, and conviction.</h1>
          <p>
            A premium market workspace that combines live signals, adaptive risk controls, and elegant execution flows in one immersive view.
          </p>
          <div className={styles.heroActions}>
            <button type="button" className={styles.primaryCta}>Explore AI recommendations</button>
            <button type="button" className={styles.secondaryCta}>Enable smart alerts</button>
          </div>
        </div>
        <div className={styles.heroMetrics}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}><BrainCircuit size={16} /></div>
            <div>
              <div className={styles.metricLabel}>AI confidence</div>
              <div className={styles.metricValue}>86%</div>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}><ShieldCheck size={16} /></div>
            <div>
              <div className={styles.metricLabel}>Risk score</div>
              <div className={styles.metricValue}>Balanced</div>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}><Zap size={16} /></div>
            <div>
              <div className={styles.metricLabel}>Momentum</div>
              <div className={styles.metricValue}>+1.32%</div>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className={styles.grid}>
        <Card className={styles.orderCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Place intelligent order</h2>
              <p className={styles.cardSub}>Built for fast decision-making and premium execution.</p>
            </div>
            <div className={styles.segmentToggle}>
              <button type="button" className={`${styles.segBtn} ${!isGTT ? styles.segActive : ''}`} onClick={() => setIsGTT(false)}>
                Regular
              </button>
              <button type="button" className={`${styles.segBtn} ${isGTT ? styles.segActive : ''}`} onClick={() => setIsGTT(true)}>
                GTT
              </button>
            </div>
          </div>

          <div className={styles.sideRow}>
            <button type="button" className={`${styles.sideBtn} ${side === 'BUY' ? styles.buyActive : ''}`} onClick={() => setSide('BUY')}>
              Buy
            </button>
            <button type="button" className={`${styles.sideBtn} ${side === 'SELL' ? styles.sellActive : ''}`} onClick={() => setSide('SELL')}>
              Sell
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form} autoComplete="off">
            <div className={styles.row}>
              <Input
                label="Symbol"
                placeholder="RELIANCE"
                error={errors.symbol?.message}
                className={styles.symbolInput}
                autoComplete="off"
                {...register('symbol', { required: 'Symbol required' })}
              />
              <Select label="Exchange" options={EXCHANGES} {...register('exchange')} />
            </div>

            <div className={styles.row}>
              <Select label="Segment" options={SEGMENTS} {...register('segment')} />
              <Select label="Order Type" options={ORDER_TYPES} {...register('orderType')} />
            </div>

            <Input
              label="Quantity"
              type="number"
              inputMode="numeric"
              placeholder="1"
              error={errors.quantity?.message}
              autoComplete="off"
              {...register('quantity', {
                required: 'Quantity required',
                min: { value: 1, message: 'Min 1' },
              })}
            />

            {watchedOrderType !== 'MARKET' && watchedOrderType !== 'STOP_LOSS_MARKET' && (
              <Input
                label="Price (₹)"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                step="0.05"
                prefix="₹"
                autoComplete="off"
                {...register('price')}
              />
            )}

            {(watchedOrderType === 'STOP_LOSS' || watchedOrderType === 'STOP_LOSS_MARKET') && (
              <Input
                label="Trigger Price (₹)"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                step="0.05"
                prefix="₹"
                autoComplete="off"
                {...register('triggerPrice')}
              />
            )}

            {isGTT && <Input label="GTT Expiry Date" type="date" {...register('gttExpiry')} />}

            <Button type="submit" fullWidth loading={placing} size="lg" variant={side === 'BUY' ? 'primary' : 'danger'}>
              {side === 'BUY' ? '↑ Buy' : '↓ Sell'} {isGTT ? '(GTT)' : ''}
            </Button>
          </form>

          {isGTT && <div className={styles.gttNote}>GTT orders execute automatically once your preset conditions are met.</div>}
        </Card>

        <div className={styles.right}>
          <MarketWatch />

          {/* Advanced Chart */}
          <GlassCard className={styles.chartCard} intensity="medium">
            <CandlestickChart 
              data={generateSampleChartData()}
              height={300}
              showSMA={true}
              showEMA={true}
              showBollinger={false}
              showRSI={true}
            />
          </GlassCard>

          {/* Order Book */}
          <OrderBook 
            symbol="RELIANCE"
            basePrice={2500}
            showDepthChart={true}
            maxRows={6}
          />

          <GlassCard className={styles.insightCard} intensity="light">
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>AI insights</h2>
                <p className={styles.cardSub}>Signals curated for your current setup.</p>
              </div>
              <div className={styles.iconPill}><Radar size={14} /></div>
            </div>
            <div className={styles.insightList}>
              {INSIGHTS.map((item) => (
                <div key={item.title} className={styles.insightItem}>
                  <div className={styles.insightTitleRow}>
                    <span className={styles.insightTitle}>{item.title}</span>
                    <GlassBadge variant={item.tone === 'positive' ? 'success' : 'info'}>AI</GlassBadge>
                  </div>
                  <p className={styles.insightCopy}>{item.copy}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className={styles.recentCard} intensity="light">
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Today's orders</h2>
                <p className={styles.cardSub}>A living audit of your most recent activity.</p>
              </div>
              <div className={styles.iconPill}><Bell size={14} /></div>
            </div>
            {recentTrades.length === 0 ? (
              <div className={styles.noTrades}>No orders placed today.</div>
            ) : (
              recentTrades.map((t) => (
                <div key={t.id} className={styles.recentRow}>
                  <div>
                    <div className={styles.watchSym}>{t.symbol}</div>
                    <div className={styles.watchEx}>{t.orderType}</div>
                  </div>
                  <div className={styles.recentMeta}>
                    <GlassBadge variant={t.side === 'BUY' ? 'success' : 'danger'}>{t.side}</GlassBadge>
                    <div className={styles.watchEx}>{t.quantity} qty</div>
                  </div>
                </div>
              ))
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

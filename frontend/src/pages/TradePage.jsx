import React, { useState, memo } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { useTrades } from '../hooks'
import { Button, Input, Select, Card, Badge } from '../components/ui'
import { SYMBOL_LABELS } from '../services/marketData'
import styles from './TradePage.module.css'

const SEGMENTS   = [
  { value: 'EQUITY',    label: 'Equity' },
  { value: 'FUTURES',   label: 'Futures' },
  { value: 'OPTIONS',   label: 'Options' },
  { value: 'CURRENCY',  label: 'Currency' },
  { value: 'COMMODITY', label: 'Commodity' },
]
const ORDER_TYPES = [
  { value: 'MARKET',           label: 'Market' },
  { value: 'LIMIT',            label: 'Limit' },
  { value: 'STOP_LOSS',        label: 'Stop Loss' },
  { value: 'STOP_LOSS_MARKET', label: 'SL-Market' },
]
const EXCHANGES = [
  { value: 'NSE', label: 'NSE' },
  { value: 'BSE', label: 'BSE' },
  { value: 'MCX', label: 'MCX' },
]
const WATCH_SYMBOLS = [
  'NIFTY 50', 'NIFTY BANK',
  'RELIANCE', 'INFY', 'HDFCBANK',
  'TCS', 'WIPRO', 'ICICIBANK',
]

/* ── Market Watch reads from Redux store directly (no polling here) ── */
const MarketWatch = memo(function MarketWatch() {
  const indices    = useSelector((s) => s.market?.indices    || {})
  const stocks     = useSelector((s) => s.market?.stocks     || {})
  const lastUpdated = useSelector((s) => s.market?.lastUpdated)
  // Merge indices + stocks into one lookup
  const quotes = { ...indices, ...stocks }

  return (
    <Card className={styles.watchCard}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Market Watch</h2>
          <div className={styles.marketMeta}>
            <span className={styles.liveBadge}>
              <span className={styles.liveDot} /> Live · auto-refresh every 5s
            </span>
            <span className={styles.marketTime}>
              {lastUpdated
                ? new Date(lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : 'Connecting…'}
            </span>
          </div>
        </div>
      </div>
      <div className={styles.watchList}>
        {WATCH_SYMBOLS.map((sym) => {
          const q  = quotes[sym]
          const up = (q?.changePct ?? 0) >= 0
          return (
            <div key={sym} className={styles.watchItem}>
              <div>
                <div className={styles.watchSym}>{SYMBOL_LABELS[sym] || sym}</div>
                <div className={styles.watchEx}>
                  {(sym === 'NIFTY 50' || sym === 'NIFTY BANK') ? 'INDEX' : 'NSE'}
                </div>
              </div>
              <div className={styles.watchRight}>
                <div className={styles.watchPrice}>
                  {q ? `₹${q.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                </div>
                <div className={up ? styles.changeUp : styles.changeDown}>
                  {q ? `${up ? '↑' : '↓'} ${Math.abs(q.changePct).toFixed(2)}%` : '—'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
})

/* ── Main trade page — isolated from market data polling ── */
export default function TradePage() {
  const { place, placing, trades } = useTrades()
  const [side,  setSide]  = useState('BUY')
  const [isGTT, setIsGTT] = useState(false)

  const {
    register, handleSubmit, reset, watch,
    formState: { errors },
  } = useForm({ defaultValues: { exchange: 'NSE', segment: 'EQUITY', orderType: 'MARKET' } })

  const watchedOrderType = watch('orderType')

  const onSubmit = (data) => {
    place({
      symbol:       data.symbol.toUpperCase(),
      exchange:     data.exchange,
      segment:      data.segment,
      orderType:    data.orderType,
      side,
      quantity:     parseInt(data.quantity),
      price:        data.price        ? parseFloat(data.price)        : null,
      triggerPrice: data.triggerPrice ? parseFloat(data.triggerPrice) : null,
      isGTT,
    })
    reset()
  }

  const recentTrades = trades.slice(0, 5)

  return (
    <div className={styles.page}>
      <div className={styles.grid}>

        {/* ── ORDER FORM ── */}
        <Card className={styles.orderCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Place Order</h2>
            <div className={styles.segmentToggle}>
              <button className={`${styles.segBtn} ${!isGTT ? styles.segActive : ''}`} onClick={() => setIsGTT(false)}>Regular</button>
              <button className={`${styles.segBtn} ${isGTT  ? styles.segActive : ''}`} onClick={() => setIsGTT(true)}>GTT</button>
            </div>
          </div>

          {/* BUY / SELL */}
          <div className={styles.sideRow}>
            <button className={`${styles.sideBtn} ${side === 'BUY'  ? styles.buyActive  : ''}`} onClick={() => setSide('BUY')}>BUY</button>
            <button className={`${styles.sideBtn} ${side === 'SELL' ? styles.sellActive : ''}`} onClick={() => setSide('SELL')}>SELL</button>
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
              <Select label="Segment"    options={SEGMENTS}    {...register('segment')} />
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

            {isGTT && (
              <Input label="GTT Expiry Date" type="date" {...register('gttExpiry')} />
            )}

            <Button type="submit" fullWidth loading={placing} size="lg"
              variant={side === 'BUY' ? 'primary' : 'danger'}>
              {side === 'BUY' ? '↑ Buy' : '↓ Sell'} {isGTT ? '(GTT)' : ''}
            </Button>
          </form>

          {isGTT && (
            <div className={styles.gttNote}>
              GTT orders execute automatically when market conditions meet your criteria.
            </div>
          )}
        </Card>

        {/* ── RIGHT: MARKET WATCH + RECENT ── */}
        <div className={styles.right}>
          <MarketWatch />

          <Card className={styles.recentCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Today's Orders</h2>
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
                  <div style={{ textAlign: 'right' }}>
                    <Badge variant={t.side === 'BUY' ? 'success' : 'danger'}>{t.side}</Badge>
                    <div className={styles.watchEx} style={{ marginTop: 4 }}>{t.quantity} qty</div>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTrades } from '../hooks'
import { Button, Input, Select, Card, Badge } from '../components/ui'
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

export default function TradePage() {
  const { place, placing, trades } = useTrades()
  const [side, setSide] = useState('BUY')
  const [orderType, setOrderType] = useState('MARKET')
  const [isGTT, setIsGTT] = useState(false)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm()
  const watchedOrderType = watch('orderType', 'MARKET')

  const onSubmit = (data) => {
    place({
      symbol: data.symbol.toUpperCase(),
      exchange: data.exchange,
      segment: data.segment,
      orderType: data.orderType,
      side,
      quantity: parseInt(data.quantity),
      price: data.price ? parseFloat(data.price) : null,
      triggerPrice: data.triggerPrice ? parseFloat(data.triggerPrice) : null,
      isGTT,
    })
    reset()
  }

  const recentTrades = trades.slice(0, 5)

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {/* ORDER FORM */}
        <Card className={styles.orderCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Place Order</h2>
            <div className={styles.segmentToggle}>
              <button
                className={`${styles.segBtn} ${!isGTT ? styles.segActive : ''}`}
                onClick={() => setIsGTT(false)}
              >Regular</button>
              <button
                className={`${styles.segBtn} ${isGTT ? styles.segActive : ''}`}
                onClick={() => setIsGTT(true)}
              >GTT</button>
            </div>
          </div>

          {/* BUY / SELL */}
          <div className={styles.sideRow}>
            <button
              className={`${styles.sideBtn} ${side === 'BUY' ? styles.buyActive : ''}`}
              onClick={() => setSide('BUY')}
            >BUY</button>
            <button
              className={`${styles.sideBtn} ${side === 'SELL' ? styles.sellActive : ''}`}
              onClick={() => setSide('SELL')}
            >SELL</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.row}>
              <Input
                label="Symbol"
                placeholder="RELIANCE"
                error={errors.symbol?.message}
                className={styles.symbolInput}
                {...register('symbol', { required: 'Symbol required' })}
              />
              <Select
                label="Exchange"
                options={EXCHANGES}
                {...register('exchange')}
              />
            </div>

            <div className={styles.row}>
              <Select label="Segment" options={SEGMENTS} {...register('segment')} />
              <Select
                label="Order Type"
                options={ORDER_TYPES}
                {...register('orderType')}
              />
            </div>

            <Input
              label="Quantity"
              type="number"
              placeholder="1"
              error={errors.quantity?.message}
              {...register('quantity', {
                required: 'Quantity required',
                min: { value: 1, message: 'Min 1' },
              })}
            />

            {watchedOrderType !== 'MARKET' && watchedOrderType !== 'STOP_LOSS_MARKET' && (
              <Input
                label="Price (₹)"
                type="number"
                placeholder="0.00"
                step="0.05"
                prefix="₹"
                {...register('price')}
              />
            )}

            {(watchedOrderType === 'STOP_LOSS' || watchedOrderType === 'STOP_LOSS_MARKET') && (
              <Input
                label="Trigger Price (₹)"
                type="number"
                placeholder="0.00"
                step="0.05"
                prefix="₹"
                {...register('triggerPrice')}
              />
            )}

            {isGTT && (
              <Input
                label="GTT Expiry Date"
                type="date"
                {...register('gttExpiry')}
              />
            )}

            <Button
              type="submit"
              fullWidth
              loading={placing}
              size="lg"
              variant={side === 'BUY' ? 'primary' : 'danger'}
            >
              {side === 'BUY' ? '↑ Buy' : '↓ Sell'} {isGTT ? '(GTT)' : ''}
            </Button>
          </form>

          {isGTT && (
            <div className={styles.gttNote}>
              GTT orders execute automatically when market conditions meet your criteria.
            </div>
          )}
        </Card>

        {/* MARKET WATCH + RECENT */}
        <div className={styles.right}>
          <Card className={styles.watchCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Market Watch</h2>
            </div>
            <div className={styles.watchList}>
              {WATCHLIST.map((item) => (
                <div key={item.symbol} className={styles.watchItem}>
                  <div>
                    <div className={styles.watchSym}>{item.symbol}</div>
                    <div className={styles.watchEx}>{item.exchange}</div>
                  </div>
                  <div className={styles.watchRight}>
                    <div className={styles.watchPrice}>₹{item.price.toLocaleString('en-IN')}</div>
                    <div className={item.change >= 0 ? styles.changeUp : styles.changeDown}>
                      {item.change >= 0 ? '↑' : '↓'} {Math.abs(item.change)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

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

const WATCHLIST = [
  { symbol: 'RELIANCE', exchange: 'NSE', price: 2841.50, change: 1.24 },
  { symbol: 'INFY', exchange: 'NSE', price: 1678.30, change: -0.82 },
  { symbol: 'HDFC BANK', exchange: 'NSE', price: 1542.10, change: 0.45 },
  { symbol: 'TCS', exchange: 'NSE', price: 3890.00, change: 2.14 },
  { symbol: 'WIPRO', exchange: 'NSE', price: 521.75, change: -1.30 },
  { symbol: 'NIFTY 50', exchange: 'NSE', price: 24381, change: 0.42 },
]

import React, { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  RefreshCw, Search, CheckCircle2, Clock, BarChart2,
} from 'lucide-react'
import { useTrades, useMarketData } from '../hooks'
import { SYMBOL_LABELS } from '../services/marketData'

const T = {
  bg: '#f8f9fa', white: '#fff',
  border: '#e0e0e0', border2: '#f0f0f0',
  text: '#1a1a1a', textSub: '#5f6368', textMute: '#9aa0a6',
  green: '#0f9d58', greenBg: '#e8f5e9', greenDark: '#0a8043',
  red: '#ea4335', redBg: '#fce8e6',
  blue: '#1a73e8', blueBg: '#e8f0fe',
  amber: '#d97706', amberBg: '#fef3c7',
}

const fmt = n => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const SEGMENTS   = ['EQUITY','FUTURES','OPTIONS','CURRENCY','COMMODITY']
const ORDER_TYPES = ['MARKET','LIMIT','STOP_LOSS','STOP_LOSS_MARKET']
const EXCHANGES  = ['NSE','BSE','MCX']

/* ── Popular watchlist symbols ── */
const WATCH_SYMS = [
  'NIFTY 50','NIFTY BANK','RELIANCE','TCS','HDFCBANK',
  'INFY','ICICIBANK','SBIN','BAJFINANCE','WIPRO',
  'MARUTI','TATAMOTORS','NTPC','HCLTECH','SUNPHARMA',
]

/* ── Recent order badge ── */
function StatusBadge({ status }) {
  const map = {
    COMPLETE:  { bg: T.greenBg,  color: T.greenDark },
    PENDING:   { bg: T.amberBg,  color: T.amber },
    CANCELLED: { bg: '#f3f4f6',  color: T.textMute },
    REJECTED:  { bg: T.redBg,    color: T.red },
  }
  const s = map[status] || map.PENDING
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: s.bg, color: s.color }}>
      {status}
    </span>
  )
}

export default function TradePage() {
  const navigate = useNavigate()
  const { place, placing, trades, loadTrades } = useTrades()
  const { indices, stocks, loading, refresh } = useMarketData()

  const [side, setSide]     = useState('BUY')
  const [isGTT, setIsGTT]   = useState(false)
  const [selSym, setSelSym] = useState('NIFTY 50')
  const [symSearch, setSymSearch] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { symbol: 'RELIANCE', exchange: 'NSE', segment: 'EQUITY', orderType: 'MARKET', quantity: '', price: '', triggerPrice: '', gttExpiry: '' },
  })

  const orderType = watch('orderType')
  const watchSym  = watch('symbol')

  const onSubmit = async (data) => {
    await place({
      symbol: data.symbol.trim().toUpperCase(),
      exchange: data.exchange, segment: data.segment, orderType: data.orderType,
      side, quantity: parseInt(data.quantity, 10),
      price: data.price ? parseFloat(data.price) : null,
      triggerPrice: data.triggerPrice ? parseFloat(data.triggerPrice) : null,
      isGTT, gttExpiry: data.gttExpiry || null,
    })
    setSubmitted(true)
    setTimeout(() => { setSubmitted(false); reset({ symbol: '', exchange: 'NSE', segment: 'EQUITY', orderType: 'MARKET', quantity: '', price: '', triggerPrice: '', gttExpiry: '' }) }, 2000)
  }

  /* build merged quotes */
  const allQuotes = useMemo(() => ({ ...indices, ...stocks }), [indices, stocks])

  /* watchlist filtered by search */
  const filteredSyms = useMemo(() => {
    const q = symSearch.toLowerCase()
    return WATCH_SYMS.filter(s => s.toLowerCase().includes(q) || (SYMBOL_LABELS[s] || '').toLowerCase().includes(q))
  }, [symSearch])

  const selQ = allQuotes[selSym]
  const selUp = (selQ?.changePct ?? 0) >= 0

  /* live quote for symbol in form */
  const formQ = allQuotes[watchSym?.toUpperCase()] || null

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
      <div style={{ maxWidth: 1340, margin: '0 auto', padding: 24, display: 'grid', gridTemplateColumns: '320px 1fr 300px', gap: 16, alignItems: 'start' }}>

        {/* ── Column 1: Order Form ── */}
        <div>
          {/* Selected symbol header */}
          <div style={{ background: selUp ? T.greenBg : T.redBg, border: `1px solid ${selUp ? '#a8d5b5' : '#f5c6c2'}`, borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{SYMBOL_LABELS[selSym] || selSym}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: selUp ? T.greenDark : T.red, fontWeight: 700 }}>
                {selUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {selUp ? '+' : ''}{fmt(selQ?.changePct ?? 0)}%
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: T.text, letterSpacing: '-0.5px' }}>
              ₹{selQ ? fmt(selQ.price) : '—'}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: T.textSub }}>
              <span>O: ₹{selQ?.open ? fmt(selQ.open) : '—'}</span>
              <span style={{ color: T.greenDark }}>H: ₹{selQ?.high ? fmt(selQ.high) : '—'}</span>
              <span style={{ color: T.red }}>L: ₹{selQ?.low ? fmt(selQ.low) : '—'}</span>
            </div>
          </div>

          {/* Order form card */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {/* GTT toggle */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, padding: '10px 16px', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Place Order</span>
              <div style={{ display: 'flex', gap: 4, background: T.bg, borderRadius: 6, padding: 3 }}>
                {['Regular', 'GTT'].map(t => (
                  <button key={t} onClick={() => setIsGTT(t === 'GTT')} style={{
                    padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    background: (isGTT ? t === 'GTT' : t === 'Regular') ? T.white : 'transparent',
                    color: (isGTT ? t === 'GTT' : t === 'Regular') ? T.text : T.textMute,
                    boxShadow: (isGTT ? t === 'GTT' : t === 'Regular') ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                  }}>{t}</button>
                ))}
              </div>
            </div>

            {/* Buy/Sell */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${T.border}` }}>
              {['BUY', 'SELL'].map(s => (
                <button key={s} onClick={() => setSide(s)} style={{
                  padding: '11px 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800,
                  background: side === s ? (s === 'BUY' ? T.greenBg : T.redBg) : T.white,
                  color: side === s ? (s === 'BUY' ? T.greenDark : T.red) : T.textMute,
                  borderBottom: side === s ? `2.5px solid ${s === 'BUY' ? T.green : T.red}` : '2.5px solid transparent',
                }}>↑ {s}</button>
              ))}
            </div>

            {/* Success overlay */}
            {submitted && (
              <div style={{ padding: '24px 16px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
                <CheckCircle2 size={36} color={T.green} />
                <div style={{ fontSize: 14, fontWeight: 700, color: T.greenDark, marginTop: 8 }}>Order placed successfully!</div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Symbol */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>Symbol</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input {...register('symbol', { required: 'Symbol required' })}
                    style={{ flex: 1, padding: '8px 10px', border: `1px solid ${errors.symbol ? T.red : T.border}`, borderRadius: 6, fontSize: 13, fontWeight: 700, outline: 'none', textTransform: 'uppercase' }}
                    placeholder="RELIANCE"
                    onBlur={e => setSelSym(e.target.value.toUpperCase())}
                  />
                  <select {...register('exchange')} style={{ padding: '8px 6px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, color: T.textSub, outline: 'none' }}>
                    {EXCHANGES.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
                {errors.symbol && <span style={{ fontSize: 11, color: T.red }}>{errors.symbol.message}</span>}
                {formQ && (
                  <div style={{ marginTop: 4, fontSize: 11, color: (formQ.changePct ?? 0) >= 0 ? T.greenDark : T.red, fontWeight: 600 }}>
                    LTP: ₹{fmt(formQ.price)} ({(formQ.changePct ?? 0) >= 0 ? '+' : ''}{fmt(formQ.changePct ?? 0)}%)
                  </div>
                )}
              </div>

              {/* Segment + Order Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>Segment</label>
                  <select {...register('segment')} style={{ width: '100%', padding: '8px 6px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, outline: 'none' }}>
                    {SEGMENTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>Order Type</label>
                  <select {...register('orderType')} style={{ width: '100%', padding: '8px 6px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, outline: 'none' }}>
                    {ORDER_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>Quantity</label>
                <input type="number" inputMode="numeric" {...register('quantity', { required: 'Required', min: { value: 1, message: 'Min 1' } })}
                  style={{ width: '100%', padding: '8px 10px', border: `1px solid ${errors.quantity ? T.red : T.border}`, borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  placeholder="1" />
                {errors.quantity && <span style={{ fontSize: 11, color: T.red }}>{errors.quantity.message}</span>}
              </div>

              {/* Price (for non-market orders) */}
              {orderType !== 'MARKET' && orderType !== 'STOP_LOSS_MARKET' && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>Price (₹)</label>
                  <input type="number" step="0.05" {...register('price')}
                    style={{ width: '100%', padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    placeholder="0.00" />
                </div>
              )}

              {/* Trigger Price (for SL orders) */}
              {(orderType === 'STOP_LOSS' || orderType === 'STOP_LOSS_MARKET') && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>Trigger Price (₹)</label>
                  <input type="number" step="0.05" {...register('triggerPrice')}
                    style={{ width: '100%', padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    placeholder="0.00" />
                </div>
              )}

              {/* GTT Expiry */}
              {isGTT && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>GTT Expiry</label>
                  <input type="date" {...register('gttExpiry')}
                    style={{ width: '100%', padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={placing || submitted} style={{
                width: '100%', padding: '12px', borderRadius: 8, border: 'none', cursor: placing ? 'not-allowed' : 'pointer',
                background: submitted ? T.greenBg : side === 'BUY' ? T.green : T.red,
                color: submitted ? T.greenDark : '#fff',
                fontSize: 14, fontWeight: 800, letterSpacing: 0.3,
                transition: 'all .15s', opacity: placing ? 0.7 : 1,
              }}>
                {placing ? 'Placing…' : submitted ? '✓ Order Placed' : `${side} ${isGTT ? '(GTT)' : ''}`}
              </button>
            </form>

            {isGTT && (
              <div style={{ margin: '0 16px 16px', padding: '10px 12px', background: T.blueBg, borderRadius: 8, fontSize: 11.5, color: T.blue }}>
                GTT orders execute automatically when your preset price is triggered.
              </div>
            )}
          </div>
        </div>

        {/* ── Column 2: Market Watch + Recent Orders ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Market Watch */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={15} color={T.blue} />
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Market Watch</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: T.green, fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, display: 'inline-block' }} />LIVE
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: '5px 10px' }}>
                  <Search size={12} color={T.textMute} />
                  <input value={symSearch} onChange={e => setSymSearch(e.target.value)} placeholder="Search…"
                    style={{ border: 'none', background: 'none', outline: 'none', fontSize: 12, color: T.text, width: 100 }} />
                </div>
                <button onClick={refresh} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.white, cursor: 'pointer', fontSize: 12, color: T.textSub }}>
                  <RefreshCw size={11} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                </button>
              </div>
            </div>

            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr', padding: '7px 16px', background: T.bg, borderBottom: `1px solid ${T.border}`, fontSize: 10, fontWeight: 700, color: T.textMute, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              <span>Symbol</span><span style={{ textAlign: 'right' }}>LTP</span><span style={{ textAlign: 'right' }}>Chg%</span>
            </div>

            {filteredSyms.map(sym => {
              const q   = allQuotes[sym]
              const up  = (q?.changePct ?? 0) >= 0
              const isSel = selSym === sym
              return (
                <div key={sym} onClick={() => { setSelSym(sym); setValue('symbol', sym.includes(' ') ? sym : sym) }}
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr', padding: '9px 16px', borderBottom: `1px solid ${T.border2}`, cursor: 'pointer', background: isSel ? T.blueBg : T.white, transition: 'background .1s' }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = T.bg }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = T.white }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: isSel ? 800 : 600, color: isSel ? T.blue : T.text }}>{SYMBOL_LABELS[sym] || sym}</div>
                    <div style={{ fontSize: 10, color: T.textMute }}>NSE</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: T.text, fontVariantNumeric: 'tabular-nums' }}>
                    {q ? `₹${fmt(q.price)}` : '—'}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: up ? T.greenDark : T.red, background: up ? T.greenBg : T.redBg, padding: '2px 7px', borderRadius: 5, fontVariantNumeric: 'tabular-nums' }}>
                      {up ? '+' : ''}{fmt(q?.changePct ?? 0)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Recent Orders */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Today's Orders</span>
              <button onClick={() => navigate('/dashboard/portfolio')} style={{ fontSize: 12, color: T.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                View all →
              </button>
            </div>
            {trades.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: T.textMute, fontSize: 13 }}>
                No orders yet. Place your first order above.
              </div>
            ) : trades.slice(0, 8).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${T.border2}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{t.symbol}</div>
                  <div style={{ fontSize: 11, color: T.textMute }}>{t.orderType} · {t.exchange}</div>
                </div>
                <div style={{ textAlign: 'right', marginRight: 10 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: t.side === 'BUY' ? T.blue : T.red, background: t.side === 'BUY' ? T.blueBg : T.redBg, padding: '2px 7px', borderRadius: 5 }}>
                    {t.side} {t.quantity}
                  </span>
                  <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>₹{(t.executedPrice || t.price || 0).toLocaleString('en-IN')}</div>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Column 3: Index Board ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700, color: T.text }}>
              Indices
            </div>
            {['NIFTY 50','NIFTY BANK','INDIA VIX','NIFTY IT','NIFTY PHARMA','NIFTY AUTO'].map(key => {
              const q = indices[key]
              const up = (q?.changePct ?? 0) >= 0
              return (
                <div key={key} style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border2}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: T.textSub }}>{SYMBOL_LABELS[key] || key}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: up ? T.greenDark : T.red, display: 'flex', alignItems: 'center', gap: 2 }}>
                      {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {up ? '+' : ''}{fmt(q?.changePct ?? 0)}%
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                    {q ? fmt(q.price) : '—'}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick tips card */}
          <div style={{ background: T.blueBg, border: `1px solid ${T.blue}30`, borderRadius: 12, padding: '16px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.blue, marginBottom: 10 }}>Order Types Guide</div>
            {[
              ['MARKET', 'Execute immediately at best available price'],
              ['LIMIT', 'Execute only at your specified price or better'],
              ['STOP_LOSS', 'Trigger a limit order when price hits stop level'],
              ['GTT', 'Order stays active until your condition is met'],
            ].map(([type, desc]) => (
              <div key={type} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.blue }}>{type}</div>
                <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

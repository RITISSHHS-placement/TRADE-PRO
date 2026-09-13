/* ═══════════════════════════════════════════════════════════
   CryptoTradePage — Full crypto exchange terminal
   Real-time Binance WebSocket feeds with fallback
   
   Layout: Left pairs | Center chart + forms | Right order book
═══════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Star, TrendingUp, TrendingDown, BarChart3, Layers, Wifi, WifiOff,
  Bell, BellPlus, Clock, Gauge, Activity,
} from 'lucide-react'
import TradingViewChart from '../components/TradingViewChart'
import { CRYPTO_PAIRS } from '../services/cryptoData'
import {
  createTradeStream, fetchKlines, fetchTicker, fetchDepth, fetchRecentTrades,
} from '../services/binanceWebSocket'
import { addAlert, requestNotificationPermission } from '../services/priceAlerts'
import useBinanceStream from '../hooks/useBinanceStream'
import CompanyLogo from '../components/CompanyLogo'
import styles from './CryptoTradePage.module.css'

/* ── Generate simulated data as fallback ── */
function simulateOrderBook(midPrice) {
  const asks = [], bids = []
  for (let i = 0; i < 12; i++) {
    const spread = 0.001 * (i + 1)
    const askAmt = Math.random() * 5 + 0.1
    const bidAmt = Math.random() * 5 + 0.1
    const askP = midPrice * (1 + spread)
    const bidP = midPrice * (1 - spread)
    asks.push({ price: askP, amount: askAmt, total: askP * askAmt })
    bids.push({ price: bidP, amount: bidAmt, total: bidP * bidAmt })
  }
  return { asks: asks.reverse(), bids }
}

function simulateTrades(midPrice) {
  const trades = [], now = Date.now()
  for (let i = 0; i < 20; i++) {
    const price = midPrice * (1 + (Math.random() - 0.5) * 0.002)
    const amount = Math.random() * 3 + 0.01
    trades.push({
      time: new Date(now - i * 3000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price, amount, side: Math.random() > 0.5 ? 'buy' : 'sell',
    })
  }
  return trades
}

function simulateCandles() {
  const data = []
  let p = 40000
  const now = Date.now()
  for (let i = 365; i >= 0; i--) {
    const d = new Date(now - i * 86400000)
    p *= (1 + (Math.random() - 0.48) * 0.03)
    const o = p, c = o * (1 + (Math.random() - 0.5) * 0.02)
    data.push({
      time: d.toISOString().split('T')[0],
      open: +o.toFixed(2), high: +(Math.max(o, c) * (1 + Math.random() * 0.01)).toFixed(2),
      low: +(Math.min(o, c) * (1 - Math.random() * 0.01)).toFixed(2),
      close: +c.toFixed(2), volume: Math.round(Math.random() * 5000 + 1000),
    })
  }
  return data
}

/* ── Exchange layout ── */
export default function CryptoTradePage() {
  const navigate = useNavigate()
  const [selectedPair, setSelectedPair] = useState(CRYPTO_PAIRS[0])
  const [alertToast, setAlertToast] = useState(null)

  // Use Binance stream for connection health + real-time prices
  const { health: streamHealth } = useBinanceStream(
    CRYPTO_PAIRS.slice(0, 5).map(p => p.sym), true
  )
  const [orderType, setOrderType] = useState('Limit')
  const [pairTab, setPairTab] = useState('USDT')
  const [orderTab, setOrderTab] = useState('Open Orders')
  const [rightTab, setRightTab] = useState('Recent Trades')
  const [buyPrice, setBuyPrice] = useState('')
  const [buyAmount, setBuyAmount] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [sellAmount, setSellAmount] = useState('')
  const [search, setSearch] = useState('')
  const [livePrice, setLivePrice] = useState(selectedPair.base)
  const [livePrices, setLivePrices] = useState(() => {
    const m = {}
    CRYPTO_PAIRS.forEach(p => { m[p.sym] = p.base })
    return m
  })
  const [candleData, setCandleData] = useState([])
  const [orderBook, setOrderBook] = useState(() => simulateOrderBook(selectedPair.base))
  const [recentTrades, setRecentTrades] = useState(() => simulateTrades(selectedPair.base))
  const [ticker24h, setTicker24h] = useState(null)
  const [isLive, setIsLive] = useState(false) // true = Binance WebSocket connected
  const wsRef = useRef(null)
  const streamRef = useRef(null)

  /* ── Price precision helper ── */
  const priceDecimals = useMemo(() => {
    if (livePrice >= 1000) return 2
    if (livePrice >= 1) return 4
    if (livePrice >= 0.01) return 6
    return 8
  }, [livePrice])

  const fmt = useCallback((n, dec) => {
    const d = dec ?? priceDecimals
    return n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d })
  }, [priceDecimals])

  /* ── When pair changes: fetch all data from Binance ── */
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      // Fetch klines, ticker, depth, trades in parallel
      const [klines, ticker, depth, trades] = await Promise.all([
        fetchKlines(selectedPair.sym),
        fetchTicker(selectedPair.sym),
        fetchDepth(selectedPair.sym),
        fetchRecentTrades(selectedPair.sym),
      ])

      if (cancelled) return

      if (klines && klines.length > 0) {
        setCandleData(klines)
      } else {
        setCandleData(simulateCandles())
      }

      if (ticker) {
        setTicker24h(ticker)
        setLivePrice(ticker.price)
        setBuyPrice(ticker.price.toFixed(priceDecimals))
        setSellPrice(ticker.price.toFixed(priceDecimals))
      } else {
        setTicker24h(null)
        setLivePrice(selectedPair.base)
        setBuyPrice(selectedPair.base.toFixed(priceDecimals))
        setSellPrice(selectedPair.base.toFixed(priceDecimals))
      }

      if (depth) setOrderBook(depth)
      else setOrderBook(simulateOrderBook(selectedPair.base))

      if (trades && trades.length > 0) setRecentTrades(trades)
      else setRecentTrades(simulateTrades(selectedPair.base))
    }

    load()

    // Connect trade stream for real-time price updates
    let lastUpdate = 0
    streamRef.current?.disconnect()
    streamRef.current = createTradeStream(selectedPair.sym, (trade) => {
      if (cancelled) return
      // Throttle UI updates to max 4/sec
      const now = Date.now()
      if (now - lastUpdate < 250) return
      lastUpdate = now

      setLivePrice(trade.price)
      setLivePrices(prev => ({ ...prev, [selectedPair.sym]: trade.price }))
      setIsLive(true)
    })

    return () => {
      cancelled = true
      streamRef.current?.disconnect()
    }
  }, [selectedPair, priceDecimals])

  /* ── Periodically refresh order book and trades (every 5s) ── */
  useEffect(() => {
    const interval = setInterval(async () => {
      const [depth, trades] = await Promise.all([
        fetchDepth(selectedPair.sym),
        fetchRecentTrades(selectedPair.sym),
      ])
      if (depth) setOrderBook(depth)
      if (trades && trades.length > 0) setRecentTrades(trades)
    }, 5000)
    return () => clearInterval(interval)
  }, [selectedPair])

  /* ── Fallback: if WebSocket fails, simulate prices ── */
  useEffect(() => {
    if (isLive) return
    const interval = setInterval(() => {
      setLivePrice(prev => prev * (1 + (Math.random() - 0.5) * 0.002))
    }, 2000)
    return () => clearInterval(interval)
  }, [isLive, selectedPair])

  /* ── Fetch all pair tickers on mount for sidebar ── */
  useEffect(() => {
    let cancelled = false
    const fetchAll = async () => {
      const results = await Promise.allSettled(
        CRYPTO_PAIRS.map(p => fetchTicker(p.sym))
      )
      if (cancelled) return
      const newPrices = {}
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) {
          newPrices[CRYPTO_PAIRS[i].sym] = r.value.price
        }
      })
      if (Object.keys(newPrices).length > 0) {
        setLivePrices(prev => ({ ...prev, ...newPrices }))
      }
    }
    fetchAll()
    const interval = setInterval(fetchAll, 30000) // refresh every 30s
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  /* ── Filtered pairs ── */
  const filteredPairs = useMemo(() => {
    if (!search.trim()) return CRYPTO_PAIRS.filter(p => p.pair.includes(pairTab))
    const q = search.toLowerCase()
    return CRYPTO_PAIRS.filter(p => p.name.toLowerCase().includes(q) || p.sym.toLowerCase().includes(q))
  }, [search, pairTab])

  /* ── 24h change (from ticker or simulated) ── */
  const chg24h = ticker24h?.change24h ?? ((selectedPair.sym.charCodeAt(0) % 7) - 3) * 0.8

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      streamRef.current?.disconnect()
    }
  }, [])

  return (
    <div className={styles.page}>

      {/* ══════ LEFT PANEL: Pairs ══════ */}
      <aside className={styles.leftPanel}>
        <div className={styles.searchBox}>
          <Search size={13} className={styles.searchIcon} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search"
            className={styles.searchInput}
          />
        </div>

        {/* Connection health badge */}
        <div style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: streamHealth.status === 'connected' ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: streamHealth.status === 'connected' ? '#22c55e' : '#f59e0b', display: 'inline-block', animation: streamHealth.status === 'connected' ? 'pulse 2s infinite' : 'none' }} />
            {streamHealth.status === 'connected' ? 'Live' : streamHealth.status === 'connecting' ? 'Connecting...' : 'Reconnecting...'}
          </div>
          {streamHealth.latency > 0 && streamHealth.latency < 999 && (
            <span style={{ fontFamily: "'JetBrains Mono',monospace", color: '#9aa0a6', fontSize: 9 }}>{streamHealth.latency}ms</span>
          )}
          {streamHealth.reconnectCount > 0 && (
            <span style={{ color: '#f59e0b', fontSize: 9 }}>Reconn: {streamHealth.reconnectCount}</span>
          )}
        </div>

        <div className={styles.pairTabs}>
          <button className={styles.starBtn}><Star size={12} /></button>
          {['USDT', 'BTC', 'ETH', 'NEO', 'DAI'].map(t => (
            <button
              key={t}
              onClick={() => setPairTab(t)}
              className={`${styles.pairTab} ${pairTab === t ? styles.pairTabActive : ''}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className={styles.pairsHeader}>
          <span className={styles.pairsHCol}>Pairs</span>
          <span className={styles.pairsHCol}>Last Price</span>
          <span className={styles.pairsHCol}>Change</span>
        </div>

        <div className={styles.pairsList}>
          {filteredPairs.map(p => {
            const price = livePrices[p.sym] ?? p.base
            const seed = p.sym.charCodeAt(0)
            const chg = ((seed % 7) - 3) * 0.8 + (Math.sin(Date.now() / 10000 + seed) * 0.5)
            const isUp = chg >= 0
            return (
              <button
                key={p.sym}
                onClick={() => setSelectedPair(p)}
                className={`${styles.pairRow} ${selectedPair.sym === p.sym ? styles.pairRowActive : ''}`}
              >
                <div className={styles.pairNameCell}>
                  <CompanyLogo symbol={p.sym} name={p.pair} size={26} borderRadius={6} style={{flexShrink:0}} />
                  <span className={styles.pairLabel}>{p.pair}</span>
                </div>
                <span className={styles.pairPrice}>{fmt(price)}</span>
                <span className={isUp ? styles.pairChgUp : styles.pairChgDn}>
                  {isUp ? '+' : ''}{chg.toFixed(2)}%
                </span>
              </button>
            )
          })}
        </div>

        <div className={styles.marketNews}>
          <div className={styles.mnTitle}>Market News</div>
          {[
            { t: 'Bitcoin halving cycle suggests bullish momentum ahead', d: 'Historical patterns indicate potential price appreciation in Q4.', time: '2h ago' },
            { t: 'Ethereum network activity surges to 6-month high', d: 'Daily active addresses exceed 500,000 as DeFi TVL grows.', time: '5h ago' },
            { t: 'Institutional crypto adoption accelerates globally', d: 'Major banks expand digital asset custody services.', time: '8h ago' },
          ].map((n, i) => (
            <div key={i} className={styles.mnItem}>
              <div className={styles.mnItemTitle}>{n.t}</div>
              <div className={styles.mnItemDesc}>{n.d}</div>
              <div className={styles.mnItemTime}>{n.time}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* ══════ CENTER PANEL ══════ */}
      <main className={styles.centerPanel}>
        {/* Chart header with real 24h data */}
        <div className={styles.chartHeader}>
          <div className={styles.chartPairInfo}>
            <span className={styles.chartPairIcon} style={{ background: selectedPair.color }}>{selectedPair.icon}</span>
            <span className={styles.chartPairName}>{selectedPair.pair}</span>
            <span className={styles.chartPairFullName}>{selectedPair.name} / Tether</span>
            {/* Quick alert button */}
            <button
              onClick={() => {
                requestNotificationPermission()
                navigate(`/dashboard/price-alerts?symbol=${selectedPair.sym}&price=${livePrice.toFixed(2)}`)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 6,
                background: 'rgba(26,115,232,0.08)', color: '#1a73e8',
                border: '1px solid rgba(26,115,232,0.2)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                marginLeft: 8, transition: 'all 0.15s',
              }}
              title={`Set price alert for ${selectedPair.sym}`}
            >
              <BellPlus size={12} /> Alert
            </button>
          </div>
          <div className={styles.chartStats}>
            <div className={styles.chartStat}>
              <span className={styles.chartStatLabel}>24h High</span>
              <span className={styles.chartStatVal}>
                {fmt(ticker24h?.high24h ?? livePrice * 1.025)}
              </span>
            </div>
            <div className={styles.chartStat}>
              <span className={styles.chartStatLabel}>24h Low</span>
              <span className={styles.chartStatVal}>
                {fmt(ticker24h?.low24h ?? livePrice * 0.975)}
              </span>
            </div>
            <div className={styles.chartStat}>
              <span className={styles.chartStatLabel}>24h Volume</span>
              <span className={styles.chartStatVal}>
                {ticker24h?.volume24h
                  ? `${(ticker24h.volume24h / 1e6).toFixed(1)}M USDT`
                  : `${(Math.random() * 500 + 100).toFixed(1)}M USDT`
                }
              </span>
            </div>
          </div>
        </div>

        {/* TradingView Chart */}
        <div className={styles.chartContainer}>
          {candleData.length > 0 && (
            <TradingViewChart data={candleData} height={400} />
          )}
        </div>

        {/* Buy/Sell forms */}
        <div className={styles.tradeFormSection}>
          <div className={styles.orderTypeTabs}>
            {['Limit', 'Market', 'Stop Limit', 'Stop Market'].map(t => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={`${styles.orderTypeTab} ${orderType === t ? styles.orderTypeTabActive : ''}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className={styles.tradeFormsGrid}>
            {/* Buy Form */}
            <div className={styles.tradeForm}>
              <div className={styles.tfField}>
                <span className={styles.tfLabel}>Price</span>
                <div className={styles.tfInputWrap}>
                  <input type="text" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} className={styles.tfInput} />
                  <span className={styles.tfUnit}>USDT</span>
                </div>
              </div>
              <div className={styles.tfField}>
                <span className={styles.tfLabel}>Amount</span>
                <div className={styles.tfInputWrap}>
                  <input type="text" value={buyAmount} onChange={e => setBuyAmount(e.target.value)} className={styles.tfInput} />
                  <span className={styles.tfUnit}>{selectedPair.sym}</span>
                </div>
              </div>
              <div className={styles.pctBtns}>
                {['25%', '50%', '75%', '100%'].map(p => (
                  <button key={p} className={styles.pctBtn}>{p}</button>
                ))}
              </div>
              <div className={styles.tfMeta}>
                <span>Available:</span><span>0 {selectedPair.sym} = 0 USDT</span>
              </div>
              <div className={styles.tfMeta}>
                <span>Volume:</span><span>0 USDT</span>
              </div>
              <div className={styles.tfMeta}>
                <span>Fee:</span><span>0 USDT</span>
              </div>
              <button className={styles.buyBtn} onClick={() => {
                const p = parseFloat(buyPrice) || selectedPair.price || 0
                const q = parseFloat(buyAmount) || 1
                navigate(`/dashboard/payment?name=${encodeURIComponent(selectedPair.pair)}&type=Crypto&side=BUY&qty=${q}&price=${p}&amount=${(p*q).toFixed(2)}&symbol=${selectedPair.sym}`)
              }}>BUY</button>
            </div>

            {/* Sell Form */}
            <div className={styles.tradeForm}>
              <div className={styles.tfField}>
                <span className={styles.tfLabel}>Price</span>
                <div className={styles.tfInputWrap}>
                  <input type="text" value={sellPrice} onChange={e => setSellPrice(e.target.value)} className={styles.tfInput} />
                  <span className={styles.tfUnit}>USDT</span>
                </div>
              </div>
              <div className={styles.tfField}>
                <span className={styles.tfLabel}>Amount</span>
                <div className={styles.tfInputWrap}>
                  <input type="text" value={sellAmount} onChange={e => setSellAmount(e.target.value)} className={styles.tfInput} />
                  <span className={styles.tfUnit}>{selectedPair.sym}</span>
                </div>
              </div>
              <div className={styles.pctBtns}>
                {['25%', '50%', '75%', '100%'].map(p => (
                  <button key={p} className={styles.pctBtn}>{p}</button>
                ))}
              </div>
              <div className={styles.tfMeta}>
                <span>Available:</span><span>0 {selectedPair.sym} = 0 USDT</span>
              </div>
              <div className={styles.tfMeta}>
                <span>Volume:</span><span>0 USDT</span>
              </div>
              <div className={styles.tfMeta}>
                <span>Fee:</span><span>0 USDT</span>
              </div>              <button className={styles.sellBtn} onClick={() => {
                const p = parseFloat(sellPrice) || selectedPair.price || 0
                const q = parseFloat(sellAmount) || 1
                navigate(`/dashboard/payment?name=${encodeURIComponent(selectedPair.pair)}&type=Crypto&side=SELL&qty=${q}&price=${p}&amount=${(p*q).toFixed(2)}&symbol=${selectedPair.sym}`)
              }}>SELL</button>
            </div>
          </div>

        </div>

        {/* Bottom tabs */}
        <div className={styles.bottomSection}>
          <div className={styles.bottomTabs}>
            {['Open Orders', 'Closed Orders', 'Order History', 'Balance'].map(t => (
              <button
                key={t}
                onClick={() => setOrderTab(t)}
                className={`${styles.bottomTab} ${orderTab === t ? styles.bottomTabActive : ''}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className={styles.bottomTableHead}>
            <span>Time</span>
            <span>All pairs</span>
            <span>All Types</span>
            <span>Buy/Sell</span>
            <span>Price</span>
            <span>Amount</span>
            <span>Executed</span>
            <span>Unexecuted</span>
          </div>
          <div className={styles.bottomEmpty}>
            <BarChart3 size={36} color="#d1d5db" />
            <span>No data</span>
          </div>
        </div>
      </main>

      {/* ══════ RIGHT PANEL: Order Book + Trades ══════ */}
      <aside className={styles.rightPanel}>
        <div className={styles.obHeader}>
          <span className={styles.obTitle}>Order Book</span>
        </div>

        <div className={styles.obColHead}>
          <span>Price({selectedPair.sym})</span>
          <span>Amount</span>
          <span>Total</span>
        </div>

        {/* Asks */}
        <div className={styles.obAsks}>
          {orderBook.asks.slice(0, 12).map((a, i) => {
            const maxTotal = Math.max(...orderBook.asks.map(x => x.total), 1)
            const pct = (a.total / maxTotal) * 100
            return (
              <div key={i} className={styles.obRow}>
                <div className={styles.obRowBg} style={{ width: `${pct}%`, background: 'rgba(234,67,53,0.08)' }} />
                <span className={styles.obAskPrice}>{fmt(a.price)}</span>
                <span className={styles.obAmt}>{fmt(a.amount, 4)}</span>
                <span className={styles.obTotal}>{fmt(a.total, 4)}</span>
              </div>
            )
          })}
        </div>

        {/* Last price */}
        <div className={styles.obLastPrice}>
          <span className={styles.obLastVal}>{fmt(livePrice)}</span>
          <span className={styles.obLastUsd}>${fmt(livePrice, 2)}</span>
          <span className={chg24h >= 0 ? styles.obLastChgUp : styles.obLastChgDn}>
            {chg24h >= 0 ? '+' : ''}{chg24h.toFixed(2)}%
          </span>
        </div>

        {/* Bids */}
        <div className={styles.obBids}>
          {orderBook.bids.slice(0, 12).map((b, i) => {
            const maxTotal = Math.max(...orderBook.bids.map(x => x.total), 1)
            const pct = (b.total / maxTotal) * 100
            return (
              <div key={i} className={styles.obRow}>
                <div className={styles.obRowBg} style={{ width: `${pct}%`, background: 'rgba(34,197,94,0.08)' }} />
                <span className={styles.obBidPrice}>{fmt(b.price)}</span>
                <span className={styles.obAmt}>{fmt(b.amount, 4)}</span>
                <span className={styles.obTotal}>{fmt(b.total, 4)}</span>
              </div>
            )
          })}
        </div>

        {/* Tabs */}
        <div className={styles.rtTabs}>
          <button
            onClick={() => setRightTab('Recent Trades')}
            className={`${styles.rtTab} ${rightTab === 'Recent Trades' ? styles.rtTabActive : ''}`}
          >
            Recent Trades
          </button>
          <button
            onClick={() => setRightTab('Market Depth')}
            className={`${styles.rtTab} ${rightTab === 'Market Depth' ? styles.rtTabActive : ''}`}
          >
            Market Depth
          </button>
        </div>

        {rightTab === 'Recent Trades' && (
          <>
            <div className={styles.rtColHead}>
              <span>Time</span>
              <span>Price</span>
              <span>Amount</span>
            </div>
            <div className={styles.rtList}>
              {recentTrades.map((t, i) => (
                <div key={i} className={styles.rtRow}>
                  <span className={styles.rtTime}>{t.time}</span>
                  <span className={t.side === 'buy' ? styles.rtPriceUp : styles.rtPriceDn}>
                    {fmt(t.price)}
                  </span>
                  <span className={styles.rtAmt}>{fmt(t.amount, 4)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {rightTab === 'Market Depth' && (
          <div className={styles.mdEmpty}>
            <Layers size={28} color="#d1d5db" />
            <span>Market Depth</span>
          </div>
        )}
      </aside>
    </div>
  )
}

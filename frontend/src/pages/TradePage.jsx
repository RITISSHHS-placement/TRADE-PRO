import React, { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  RefreshCw, Search, CheckCircle2, Clock, BarChart2, Star,
  Settings, Maximize2, Camera,
} from 'lucide-react'
import { useTrades, useMarketData } from '../hooks'
import { SYMBOL_LABELS } from '../services/marketData'
import PaymentModal from '../components/PaymentModal'
import TradingViewChart from '../components/TradingViewChart'
import CompanyLogo from '../components/CompanyLogo'
import styles from './TradePage.module.css'

const fmt = n => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const SEGMENTS   = ['EQUITY','FUTURES','OPTIONS','CURRENCY','COMMODITY']
const ORDER_TYPES = ['MARKET','LIMIT','STOP_LOSS','STOP_LOSS_MARKET']
const EXCHANGES  = ['NSE','BSE','MCX']

/* ── ALL Symbols by Segment ── */
const ALL_IN_STOCKS = [
  // NIFTY 50 constituents
  'RELIANCE','TCS','HDFCBANK','INFY','ICICIBANK','SBIN','BAJFINANCE',
  'BHARTIARTL','KOTAKBANK','WIPRO','HCLTECH','AXISBANK','LT','ITC',
  'MARUTI','TITAN','TATAMOTORS','TATASTEEL','ONGC','NTPC','SUNPHARMA',
  'ULTRACEMCO','NESTLEIND','ASIANPAINT','POWERGRID','COALINDIA',
  'ADANIENT','ADANIPORTS','BAJAJ-AUTO','HEROMOTOCO','TATACONSUM',
  'INDIGO','DRREDDY','CIPLA','APOLLOHOSP','EICHERMOT',
  'GRASIM','DIVISLAB','TECHM','INDUSINDBK','POLYCAB',
  // NIFTY Next 50
  'DMART','SIEMENS','ABB','HAVELLS','GODREJCP','PIDILITIND','BERGEPAINT',
  'MUTHOOTFIN','CHOLAFIN','BAJAJFINSV','SRF','AMBUJACEM','ACC','GLENMARK',
  'LUPIN','BIOCON','AUROPHARMA','TORNTPHARM','ALKEM','IPCALAB',
  'BOSCHLTD','MOTHERSON','EXIDEIND','CUMMINSIND','THERMAX',
  'VOLTAS','BLUEDART','PERSISTENT','COFORGE','LTIM','MPHASIS',
  'OFSS','KPITTECH','ZOMATO','PAYTM','NYKAA','POLICYBAZAAR',
  // NIFTY Midcap 150
  'BANKBARODA','PNB','CANBK','UNIONBANK','IDFCFIRSTB','FEDERALBNK',
  'KARURVYSYA','DCBBANK','RBLBANK','YESBANK','BANDHANBNK',
  'MFSL','SBILIFE','HDFCLIFE','ICICIGI','ICICIPRULI','STARHEALTH',
  'GICRE','NIACL','ORIENTINS',
  'RECLTD','PFC','IRFC','HUDCO','NHPC','SJVN','NLCINDIA','THANGAMAYL',
  'TATAPOWER','ADANIGREEN','ADANITRANS','TORNTPOWER','CESC','JSW ENERGY',
  'SAIL','HINDALCO','NATIONALUM','VEDL','HINDZINC','NMDC','MOIL',
  'UPL','PIIND','RALLIS','ASTERDM','LALPATHLAB','METROPOLIS','VIJAYABANK',
  'JSWSTEEL','JINDALSTEL','RATNAMANI','WELSPUNIND','APL APOLLO',
  'PAGEIND','TRENT','MANYAVAR','SHOPERSTOP','VMART','ZYDUSLIFE',
  // NIFTY Smallcap picks
  'BSOFT','ZENSAR','NIITTECH','INFOEDGE','JUSTDIAL','AFFLE','NAZARA',
  'DELTACORP','GMRINFRA','IRBINFRA','ASHOKA','HGINFRA','KNR',
  'RITES','RVNL','IRCON','RAILTEL','TITAGARH',
  'BPCL','IOC','HPCL','MRPL','CPCL',
  'GAIL','IGL','MGL','ATGL','GSPL',
  'CONCOR','ALLCARGO','GATI','MAHLOG','BLUEDART',
  'TANLA','ROUTE','STLTECH','TATACOMM','VODAIDEA',
]

const ALL_US_STOCKS = [
  'AAPL','MSFT','NVDA','GOOGL','AMZN','TSLA','META','JPM',
  'V','WMT','UNH','JNJ','XOM','PG','BRKB','MA','HD','BAC',
  'CRM','NFLX','AMD','INTC','PYPL','DIS','NKE','COST',
]

const ALL_CRYPTO = [
  'BTC','ETH','SOL','XRP','BNB','ADA','DOGE','DOT',
  'AVAX','LINK','MATIC','UNI','ATOM','FIL','LTC',
  'XLM','TRX','NEAR','APT','ARB','OP','INJ','SUI',
]

const ALL_ETFS = [
  'NIFTYBEES','BANKBEES','JUNIORBEES','GOLDBEES','SILVERBEES',
  'MIDCAPBEES','PSUBANKBEES','ITBEES','PHARMABEES','NIFTYBEES',
]

const PAIR_TABS = ['★ Favorites','IN Stocks','US Stocks','Crypto','ETFs']

function getTabSymbols(tab, stockMap) {
  switch (tab) {
    case 'IN Stocks': return ALL_IN_STOCKS
    case 'US Stocks': return ALL_US_STOCKS
    case 'Crypto': return ALL_CRYPTO
    case 'ETFs': return ALL_ETFS
    default: // Favorites — top stocks from live data
      return [
        'RELIANCE','TCS','HDFCBANK','INFY','ICICIBANK','SBIN',
        'BAJFINANCE','WIPRO','NTPC','HCLTECH','TATAMOTORS','SUNPHARMA',
      ]
  }
}

/* ── Recent order badge ── */
function StatusBadge({ status }) {
  const map = {
    COMPLETE:  { bg: 'var(--tp-green-dim, rgba(34,197,94,0.12))',  color: 'var(--tp-green, #22c55e)' },
    PENDING:   { bg: 'var(--tp-amber-dim, rgba(245,158,11,0.12))', color: 'var(--tp-amber, #f59e0b)' },
    CANCELLED: { bg: 'var(--tp-muted-dim, rgba(139,148,158,0.12))', color: 'var(--tp-muted, #8b949e)' },
    REJECTED:  { bg: 'var(--tp-red-dim, rgba(239,68,68,0.12))',   color: 'var(--tp-red, #ef4444)' },
  }
  const s = map[status] || map.PENDING
  return (
    <span className={styles.statusBadge} style={{ background: s.bg, color: s.color }}>
      {status}
    </span>
  )
}

/* ── Order Type Tabs ── */
const ORDER_TABS = ['Limit','Market','Stop Limit','Stop Market']

/* ── Memoized pair row — prevents re-render of 100+ rows on every keystroke ── */
const PairRow = memo(function PairRow({ sym, isSel, onSelect, quote, label }) {
  const up = (quote?.changePct ?? 0) >= 0
  return (
    <div
      className={`${styles.pairRow} ${isSel ? styles.pairRowSel : ''}`}
      onClick={() => onSelect(sym)}
    >
      <div className={styles.pairLeft}>
        <CompanyLogo symbol={sym} name={label || sym} size={28} borderRadius={6} />
        <div>
          <div className={styles.pairName}>{sym}</div>
          <div className={styles.pairEx}>{label || sym}</div>
        </div>
      </div>
      <div className={styles.pairPrice}>
        {quote ? `₹${fmt(quote.price)}` : '—'}
      </div>
      <div className={up ? styles.pairChgUp : styles.pairChgDn}>
        {up ? '+' : ''}{fmt(quote?.changePct ?? 0)}%
      </div>
    </div>
  )
}, (prev, next) =>
  prev.sym === next.sym &&
  prev.isSel === next.isSel &&
  prev.label === next.label &&
  prev.quote?.price === next.quote?.price &&
  prev.quote?.changePct === next.quote?.changePct
)

/* ── Memoized order-book rows ── */
const AskRow = memo(function AskRow({ price, qty, total, pct }) {
  return (
    <div className={styles.obRow}>
      <div className={styles.obBar} style={{ width: `${pct}%`, background: 'rgba(239,68,68,0.08)' }} />
      <span className={styles.obAskPrice}>{fmt(price)}</span>
      <span className={styles.obAmt}>{qty.toLocaleString()}</span>
      <span className={styles.obTotal}>₹{(total / 1e6).toFixed(2)}M</span>
    </div>
  )
})
const BidRow = memo(function BidRow({ price, qty, total, pct }) {
  return (
    <div className={styles.obRow}>
      <div className={styles.obBar} style={{ width: `${pct}%`, background: 'rgba(34,197,94,0.08)' }} />
      <span className={styles.obBidPrice}>{fmt(price)}</span>
      <span className={styles.obAmt}>{qty.toLocaleString()}</span>
      <span className={styles.obTotal}>₹{(total / 1e6).toFixed(2)}M</span>
    </div>
  )
})
const TradeRow = memo(function TradeRow({ time, price, qty, isUp }) {
  return (
    <div className={styles.obRecentRow}>
      <span className={styles.obRecentTime}>{time}</span>
      <span className={isUp ? styles.obRecentPriceUp : styles.obRecentPriceDn}>{fmt(price)}</span>
      <span className={styles.obRecentAmt}>{qty.toLocaleString()}</span>
    </div>
  )
})

export default function TradePage() {
  const navigate = useNavigate()
  const { place, placing, trades, loadTrades } = useTrades()
  const { indices, stocks, loading, refresh } = useMarketData()

  const [side, setSide]     = useState('BUY')
  const [isGTT, setIsGTT]   = useState(false)
  const [selSym, setSelSym] = useState('NIFTY 50')
  const [symSearch, setSymSearch] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [paymentOrder, setPaymentOrder] = useState(null)
  const [orderTab, setOrderTab] = useState('Limit')
  const [bottomTab, setBottomTab] = useState('Open Orders')
  const [pairTab, setPairTab] = useState('★ Favorites')

  // Price / qty / amount state for buy & sell forms.
  // `lastEdited` tracks which field the user typed in last, so the other
  // two fields derive from it without fighting each other on every keystroke.
  const [buyPrice, setBuyPrice] = useState('')
  const [buyQty, setBuyQty] = useState('')
  const [buyAmount, setBuyAmount] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [sellQty, setSellQty] = useState('')
  const [sellAmount, setSellAmount] = useState('')
  const [buyEdited, setBuyEdited] = useState(null)  // 'price' | 'qty' | 'amount'
  const [sellEdited, setSellEdited] = useState(null)
  const buyQtyLock = useRef(false)
  const buyAmtLock = useRef(false)
  const sellQtyLock = useRef(false)
  const sellAmtLock = useRef(false)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { symbol: 'RELIANCE', exchange: 'NSE', segment: 'EQUITY', orderType: 'MARKET', quantity: '1', price: '', triggerPrice: '', gttExpiry: '' },
  })

  const orderType = watch('orderType')
  const watchSym  = watch('symbol')

  const allQuotes = useMemo(() => ({ ...indices, ...stocks }), [indices, stocks])
  const selQ = allQuotes[selSym]
  const selUp = (selQ?.changePct ?? 0) >= 0
  const formQ = allQuotes[watchSym?.toUpperCase()] || null

  // Stable handler for pair row clicks so memoized rows don't re-render unnecessarily
  const handlePairSelect = useCallback((s) => {
    setSelSym(s)
    setValue('symbol', s)
  }, [setValue])

  // Auto-fill price from live quote when symbol changes
  useEffect(() => {
    const livePrice = allQuotes[selSym]?.price
    if (livePrice && !buyPrice) {
      setBuyPrice(String(livePrice.toFixed(2)))
      // If user has already typed an amount, derive qty from the new price
      const a = parseFloat(buyAmount)
      if (!isNaN(a) && a > 0) {
        setBuyQty(String(Math.floor(a / livePrice)))
      }
    }
    if (livePrice && !sellPrice) {
      setSellPrice(String(livePrice.toFixed(2)))
      const a = parseFloat(sellAmount)
      if (!isNaN(a) && a > 0) {
        setSellQty(String(Math.floor(a / livePrice)))
      }
    }
  }, [selSym, allQuotes])

  // Helper: resolve the live price (entered > market quote > 0)
  const resolveBuyPrice = () => parseFloat(buyPrice) || allQuotes[selSym]?.price || 0
  const resolveSellPrice = () => parseFloat(sellPrice) || allQuotes[selSym]?.price || 0

  // Amount ↔ Qty sync handlers for BUY form.
  // Strategy: the field the user TYPES in is the source of truth.
  // The other two fields are DERIVED from it, so they never overwrite what the user just typed.
  const handleBuyAmountChange = (val) => {
    setBuyAmount(val)
    setBuyEdited('amount')
    const p = resolveBuyPrice()
    const a = parseFloat(val)
    if (p > 0 && !isNaN(a) && a >= 0) {
      buyQtyLock.current = true
      setBuyQty(a > 0 ? String(Math.floor(a / p)) : '0')
      setTimeout(() => { buyQtyLock.current = false }, 0)
    }
  }
  const handleBuyQtyChange = (val) => {
    setBuyQty(val)
    setBuyEdited('qty')
    const p = resolveBuyPrice()
    const q = parseFloat(val)
    if (p > 0 && !isNaN(q) && q >= 0) {
      buyAmtLock.current = true
      setBuyAmount(String((q * p).toFixed(2)))
      setTimeout(() => { buyAmtLock.current = false }, 0)
    }
  }
  const handleBuyPriceChange = (val) => {
    setBuyPrice(val)
    setBuyEdited('price')
    const p = parseFloat(val)
    if (p > 0) {
      // Recompute whichever field the user wasn't editing last
      if (buyEdited === 'qty') {
        const q = parseFloat(buyQty) || 0
        buyAmtLock.current = true
        setBuyAmount(String((q * p).toFixed(2)))
        setTimeout(() => { buyAmtLock.current = false }, 0)
      } else if (buyEdited === 'amount') {
        const a = parseFloat(buyAmount) || 0
        buyQtyLock.current = true
        setBuyQty(a > 0 ? String(Math.floor(a / p)) : '0')
        setTimeout(() => { buyQtyLock.current = false }, 0)
      }
    }
  }

  // Amount ↔ Qty sync handlers for SELL form
  const handleSellAmountChange = (val) => {
    setSellAmount(val)
    setSellEdited('amount')
    const p = resolveSellPrice()
    const a = parseFloat(val)
    if (p > 0 && !isNaN(a) && a >= 0) {
      sellQtyLock.current = true
      setSellQty(a > 0 ? String(Math.floor(a / p)) : '0')
      setTimeout(() => { sellQtyLock.current = false }, 0)
    }
  }
  const handleSellQtyChange = (val) => {
    setSellQty(val)
    setSellEdited('qty')
    const p = resolveSellPrice()
    const q = parseFloat(val)
    if (p > 0 && !isNaN(q) && q >= 0) {
      sellAmtLock.current = true
      setSellAmount(String((q * p).toFixed(2)))
      setTimeout(() => { sellAmtLock.current = false }, 0)
    }
  }
  const handleSellPriceChange = (val) => {
    setSellPrice(val)
    setSellEdited('price')
    const p = parseFloat(val)
    if (p > 0) {
      if (sellEdited === 'qty') {
        const q = parseFloat(sellQty) || 0
        sellAmtLock.current = true
        setSellAmount(String((q * p).toFixed(2)))
        setTimeout(() => { sellAmtLock.current = false }, 0)
      } else if (sellEdited === 'amount') {
        const a = parseFloat(sellAmount) || 0
        sellQtyLock.current = true
        setSellQty(a > 0 ? String(Math.floor(a / p)) : '0')
        setTimeout(() => { sellQtyLock.current = false }, 0)
      }
    }
  }

  const handlePaymentSuccess = async (paymentResult) => {
    try {
      await place({
        symbol: paymentOrder.symbol,
        exchange: paymentOrder.exchange,
        segment: paymentOrder.segment,
        orderType: paymentOrder.type,
        side: paymentOrder.side,
        quantity: paymentOrder.qty,
        price: paymentOrder.type !== 'MARKET' ? paymentOrder.ltp : null,
      })
      setSubmitted(true)
      setPaymentOrder(null)
      reset({ symbol: 'RELIANCE', exchange: 'NSE', segment: 'EQUITY', orderType: 'MARKET', quantity: '1', price: '', triggerPrice: '', gttExpiry: '' })
      setTimeout(() => setSubmitted(false), 2000)
    } catch (err) {
      console.error('Failed to place trade after payment:', err)
    }
  }

  // Memoize order book data — no Math.random() in render
  const orderBookData = useMemo(() => {
    const base = selQ?.price || 2500
    const asks = Array.from({length: 8}, (_, i) => {
      const price = base + (8 - i) * 2.5
      const qty = 100 + ((i * 7 + 13) * 31 % 5000)
      return { price, qty, total: price * qty, pct: (qty / 5000) * 100 }
    })
    const bids = Array.from({length: 8}, (_, i) => {
      const price = base - (i + 1) * 2.5
      const qty = 100 + ((i * 11 + 17) * 29 % 5000)
      return { price, qty, total: price * qty, pct: (qty / 5000) * 100 }
    })
    const trades = Array.from({length: 6}, (_, i) => {
      const price = base + (((i * 7 + 3) % 17) - 8) * 1.2
      const qty = 100 + ((i * 13 + 5) * 19 % 1000)
      return {
        time: new Date(Date.now() - i * 3000).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit',second:'2-digit'}),
        price, qty, isUp: i % 2 === 0,
      }
    })
    return { asks, bids, trades }
  }, [selQ?.price])

  const filteredSyms = useMemo(() => {
    const q = symSearch.toLowerCase()
    const syms = getTabSymbols(pairTab, stocks)
    if (!q) return syms
    return syms.filter(s => s.toLowerCase().includes(q) || (SYMBOL_LABELS[s] || '').toLowerCase().includes(q))  }, [symSearch, pairTab, stocks])


  return (
    <div className={styles.page}>
      {/* ═══ 3-Column Exchange Layout ═══ */}
      <div className={styles.exchangeGrid}>

        {/* ── Column 1: Pairs Sidebar ── */}
        <div className={styles.pairsSidebar}>
          <div className={styles.pairsSearch}>
            <Search size={13} className={styles.pairsSearchIcon} />
            <input
              value={symSearch}
              onChange={e => setSymSearch(e.target.value)}
              placeholder="Search"
              className={styles.pairsSearchInput}
            />
          </div>

          {/* Pair Tabs */}
          <div className={styles.pairTabs}>
            {PAIR_TABS.map(tab => (
              <button
                key={tab}
                className={pairTab === tab ? styles.pairTabActive : styles.pairTab}
                onClick={() => setPairTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Pairs Header */}
          <div className={styles.pairsHeader}>
            <span className={styles.phPairs}>Pairs</span>
            <span className={styles.phPrice}>Last Price</span>
            <span className={styles.phChg}>Change</span>
          </div>

          {/* Pairs List */}
          <div className={styles.pairsList}>
            {filteredSyms.map(sym => {
              const isSel = selSym === sym
              return (
                <PairRow
                  key={sym}
                  sym={sym}
                  isSel={isSel}
                  quote={allQuotes[sym]}
                  label={SYMBOL_LABELS[sym] || sym}
                  onSelect={handlePairSelect}
                />
              )
            })}
          </div>
        </div>

        {/* ── Column 2: Chart + Order Form ── */}
        <div className={styles.centerColumn}>
          {/* Chart Header */}
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>
              <CompanyLogo symbol={selSym} name={SYMBOL_LABELS[selSym] || selSym} size={36} borderRadius={8} style={{ marginRight: 10 }} />
              <div>
                <span className={styles.chartSym}>{SYMBOL_LABELS[selSym] || selSym}</span>
                <span className={styles.chartExchange}>· NSE · 1D</span>
              </div>
            </div>
            <div className={styles.chartMeta}>
              <span>O: ₹{selQ?.open ? fmt(selQ.open) : '—'}</span>
              <span style={{color:'var(--tp-green,#22c55e)'}}>H: ₹{selQ?.high ? fmt(selQ.high) : '—'}</span>
              <span style={{color:'var(--tp-red,#ef4444)'}}>L: ₹{selQ?.low ? fmt(selQ.low) : '—'}</span>
              <span>C: ₹{selQ ? fmt(selQ.price) : '—'}</span>
              <span className={selUp ? styles.chartChgUp : styles.chartChgDn}>
                {selUp ? '+' : ''}{fmt(selQ?.changePct ?? 0)}%
              </span>
            </div>
          </div>

          {/* TradingView Chart */}
          <div className={styles.chartArea}>
            <TradingViewChart
              height={350}
              theme="light"
              showVolume={true}
              showSMA={true}
              seed={selQ?.price || 2500}
            />
          </div>

          {/* Order Type Tabs */}
          <div className={styles.orderTypeTabs}>
            {ORDER_TABS.map(tab => (
              <button
                key={tab}
                className={orderTab === tab ? styles.orderTypeActive : styles.orderTypeTab}
                onClick={() => setOrderTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Buy/Sell Forms */}
          <div className={styles.buySellGrid}>
            {/* Buy Form */}
            <div className={styles.orderFormCard}>
              <div className={styles.osHeader}>
                <span className={styles.osLabel}>Price</span>
                <input
                  type="number"
                  placeholder="0.00"
                  className={styles.osInput}
                  value={buyPrice}
                  onChange={e => handleBuyPriceChange(e.target.value)}
                  disabled={orderTab === 'Market'}
                />
                <span className={styles.osUnit}>INR</span>
              </div>
              <div className={styles.osHeader}>
                <span className={styles.osLabel}>Qty</span>
                <input type="number" placeholder="0" className={styles.osInput}
                  value={buyQty}
                  onChange={e => handleBuyQtyChange(e.target.value)}
                />
                <span className={styles.osUnit}>Qty</span>
              </div>
              <div className={styles.osHeader}>
                <span className={styles.osLabel}>Amount</span>
                <input type="number" placeholder="0" className={styles.osInput}
                  value={buyAmount}
                  onChange={e => handleBuyAmountChange(e.target.value)}
                />
                <span className={styles.osUnit}>INR</span>
              </div>
              <div className={styles.percentBtns}>
                {['25%','50%','75%','100%'].map(p => {
                  return (
                    <button key={p} className={styles.percentBtn} onClick={() => {
                      const pct = parseInt(p) / 100
                      const price = parseFloat(buyPrice) || selQ?.price || 0
                      const maxAmt = 100000 * pct // simulated balance
                      const qty = price > 0 ? Math.floor(maxAmt / price) : 0
                      if (qty <= 0) return
                      const amt = qty * price
                      // Set the source-of-truth as amount (it matches what the percent represents)
                      setBuyAmount(String(amt.toFixed(2)))
                      setBuyQty(String(qty))
                      setBuyEdited('amount')
                    }}>{p}</button>
                  )
                })}
              </div>
              <div className={styles.osMeta}>
                <div className={styles.osMetaRow}><span>Total:</span><span>₹{buyAmount ? Number(buyAmount).toLocaleString('en-IN') : '0'}</span></div>
                <div className={styles.osMetaRow}><span>Est. Fee:</span><span>₹{buyAmount ? (Number(buyAmount) * 0.0003).toFixed(2) : '0'}</span></div>
              </div>
              <button className={styles.buyBtn} type="button" onClick={() => {
                const p = parseFloat(buyPrice) || selQ?.price || 0
                const userQty = parseInt(buyQty)
                const userAmt = parseFloat(buyAmount)
                // Prefer the field the user actually typed in; fall back to the
                // derived values so the payment page always shows real numbers.
                const a = !isNaN(userAmt) && userAmt > 0
                  ? userAmt
                  : (!isNaN(userQty) && userQty > 0 && p > 0 ? userQty * p : (p > 0 ? p : 0))
                const q = !isNaN(userQty) && userQty > 0
                  ? userQty
                  : (p > 0 && a > 0 ? Math.floor(a / p) : (p > 0 ? 1 : 0))
                if (a <= 0 || p <= 0 || q <= 0) return // nothing to buy
                navigate(`/dashboard/payment?name=${encodeURIComponent(SYMBOL_LABELS[selSym] || selSym)}&type=Stock&side=BUY&qty=${q}&price=${p}&amount=${a.toFixed(2)}&symbol=${selSym}&exchange=NSE`)
              }}>BUY</button>
            </div>

            {/* Sell Form */}
            <div className={styles.orderFormCard}>
              <div className={styles.osHeader}>
                <span className={styles.osLabel}>Price</span>
                <input
                  type="number"
                  placeholder="0.00"
                  className={styles.osInput}
                  value={sellPrice}
                  onChange={e => handleSellPriceChange(e.target.value)}
                  disabled={orderTab === 'Market'}
                />
                <span className={styles.osUnit}>INR</span>
              </div>
              <div className={styles.osHeader}>
                <span className={styles.osLabel}>Qty</span>
                <input type="number" placeholder="0" className={styles.osInput}
                  value={sellQty}
                  onChange={e => handleSellQtyChange(e.target.value)}
                />
                <span className={styles.osUnit}>Qty</span>
              </div>
              <div className={styles.osHeader}>
                <span className={styles.osLabel}>Amount</span>
                <input type="number" placeholder="0" className={styles.osInput}
                  value={sellAmount}
                  onChange={e => handleSellAmountChange(e.target.value)}
                />
                <span className={styles.osUnit}>INR</span>
              </div>
              <div className={styles.percentBtns}>
                {['25%','50%','75%','100%'].map(p => {
                  return (
                    <button key={p} className={styles.percentBtn} onClick={() => {
                      const pct = parseInt(p) / 100
                      const price = parseFloat(sellPrice) || selQ?.price || 0
                      const maxAmt = 50000 * pct // simulated holding
                      const qty = price > 0 ? Math.floor(maxAmt / price) : 0
                      if (qty <= 0) return
                      const amt = qty * price
                      setSellAmount(String(amt.toFixed(2)))
                      setSellQty(String(qty))
                      setSellEdited('amount')
                    }}>{p}</button>
                  )
                })}
              </div>
              <div className={styles.osMeta}>
                <div className={styles.osMetaRow}><span>Total:</span><span>₹{sellAmount ? Number(sellAmount).toLocaleString('en-IN') : '0'}</span></div>
                <div className={styles.osMetaRow}><span>Est. Fee:</span><span>₹{sellAmount ? (Number(sellAmount) * 0.0003).toFixed(2) : '0'}</span></div>
              </div>
              <button className={styles.sellBtn} type="button" onClick={() => {
                const p = parseFloat(sellPrice) || selQ?.price || 0
                const userQty = parseInt(sellQty)
                const userAmt = parseFloat(sellAmount)
                const a = !isNaN(userAmt) && userAmt > 0
                  ? userAmt
                  : (!isNaN(userQty) && userQty > 0 && p > 0 ? userQty * p : (p > 0 ? p : 0))
                const q = !isNaN(userQty) && userQty > 0
                  ? userQty
                  : (p > 0 && a > 0 ? Math.floor(a / p) : (p > 0 ? 1 : 0))
                if (a <= 0 || p <= 0 || q <= 0) return
                navigate(`/dashboard/payment?name=${encodeURIComponent(SYMBOL_LABELS[selSym] || selSym)}&type=Stock&side=SELL&qty=${q}&price=${p}&amount=${a.toFixed(2)}&symbol=${selSym}&exchange=NSE`)
              }}>SELL</button>
            </div>
          </div>
        </div>

        {/* ── Column 3: Order Book ── */}
        <div className={styles.orderBookCol}>
          <div className={styles.obHeader}>
            <span className={styles.obTitle}>Order Book</span>
          </div>

          {/* Order Book Header */}
          <div className={styles.obHeadRow}>
            <span className={styles.obPriceLabel}>Price(INR)</span>
            <span className={styles.obAmtLabel}>Amount(QTY)</span>
            <span className={styles.obTotalLabel}>Total</span>
          </div>

          {/* Asks (Sells) */}
          <div className={styles.obAsks}>
            {orderBookData.asks.map((a, i) => (
              <AskRow key={`ask-${i}`} price={a.price} qty={a.qty} total={a.total} pct={a.pct} />
            ))}
          </div>

          {/* Last Price */}
          <div className={styles.obSpread}>
            <div className={styles.obLastPrice}>
              <span className={styles.obLastVal}>₹{selQ ? fmt(selQ.price) : '—'}</span>
              <span className={selUp ? styles.obLastUp : styles.obLastDn}>
                {selUp ? '▲' : '▼'} {Math.abs(selQ?.changePct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className={styles.obSpreadRow}>
              <span className={styles.obSpreadLabel}>USD</span>
              <span className={styles.obSpreadVal}>{selQ ? `₹${fmt(selQ.price)}` : '—'}</span>
            </div>
          </div>

          {/* Bids (Buys) */}
          <div className={styles.obBids}>
            {orderBookData.bids.map((b, i) => (
              <BidRow key={`bid-${i}`} price={b.price} qty={b.qty} total={b.total} pct={b.pct} />
            ))}
          </div>

          {/* Recent Trades */}
          <div className={styles.obRecentHeader}>
            <span className={styles.obRecentTab}>Recent Trades</span>
            <span className={styles.obRecentTabInactive}>Market Depth</span>
          </div>
          <div className={styles.obRecentHead}>
            <span>Time</span>
            <span>Price(INR)</span>
            <span>Amount(QTY)</span>
          </div>
          <div className={styles.obRecentList}>
            {orderBookData.trades.map((t, i) => (
              <TradeRow key={i} time={t.time} price={t.price} qty={t.qty} isUp={t.isUp} />
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Bottom Tab Bar ═══ */}
      <div className={styles.bottomSection}>
        <div className={styles.bottomTabs}>
          {['Open Orders','Closed Orders','Order History','Balance'].map(tab => (
            <button
              key={tab}
              className={bottomTab === tab ? styles.bottomTabActive : styles.bottomTab}
              onClick={() => setBottomTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className={styles.bottomContent}>
          {bottomTab === 'Open Orders' ? (
            trades.filter(t => t.status === 'PENDING').length === 0 ? (
              <div className={styles.emptyState}>
                <Clock size={48} style={{opacity:0.15}} />
                <span>No open orders</span>
              </div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr style={{color:'var(--tp-muted,#8b949e)',fontSize:11}}>
                  <th style={{padding:'8px 12px',textAlign:'left'}}>Symbol</th>
                  <th>Side</th><th>Type</th><th>Qty</th><th>Price</th><th>Status</th>
                </tr></thead>
                <tbody>
                  {trades.filter(t => t.status === 'PENDING').map(t => (
                    <tr key={t.id} style={{borderTop:'1px solid var(--tp-border, #e8eaed)'}}>
                      <td style={{padding:'8px 12px',fontWeight:700}}>{t.symbol}</td>
                      <td style={{textAlign:'center'}}><StatusBadge status={t.side} /></td>
                      <td style={{textAlign:'center',color:'var(--tp-muted,#8b949e)'}}>{t.orderType}</td>
                      <td style={{textAlign:'center'}}>{t.quantity}</td>
                      <td style={{textAlign:'center'}}>₹{(t.price||0).toLocaleString('en-IN')}</td>
                      <td style={{textAlign:'center'}}><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : bottomTab === 'Closed Orders' ? (
            trades.filter(t => t.status === 'COMPLETE').length === 0 ? (
              <div className={styles.emptyState}>
                <CheckCircle2 size={48} style={{opacity:0.15}} />
                <span>No completed orders</span>
              </div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr style={{color:'var(--tp-muted,#8b949e)',fontSize:11}}>
                  <th style={{padding:'8px 12px',textAlign:'left'}}>Symbol</th>
                  <th>Side</th><th>Type</th><th>Qty</th><th>Price</th><th>P&L</th>
                </tr></thead>
                <tbody>
                  {trades.filter(t => t.status === 'COMPLETE').map(t => (
                    <tr key={t.id} style={{borderTop:'1px solid var(--tp-border, #e8eaed)'}}>
                      <td style={{padding:'8px 12px',fontWeight:700}}>{t.symbol}</td>
                      <td style={{textAlign:'center'}}><StatusBadge status={t.side} /></td>
                      <td style={{textAlign:'center',color:'var(--tp-muted,#8b949e)'}}>{t.orderType}</td>
                      <td style={{textAlign:'center'}}>{t.quantity}</td>
                      <td style={{textAlign:'center'}}>₹{(t.executedPrice||t.price||0).toLocaleString('en-IN')}</td>
                      <td style={{textAlign:'center',fontWeight:700,color:(t.pnl||0)>=0?'var(--tp-green,#22c55e)':'var(--tp-red,#ef4444)'}}>
                        {(t.pnl||0)>=0?'+':''}₹{(t.pnl||0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            <div className={styles.emptyState}>
              <BarChart2 size={48} style={{opacity:0.15}} />
              <span>{bottomTab === 'Balance' ? 'Connect broker to see balance' : 'No order history yet'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Success Overlay */}
      {submitted && (
        <div className={styles.successOverlay}>
          <CheckCircle2 size={36} color="var(--tp-green,#22c55e)" />
          <div className={styles.successText}>Order placed successfully!</div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {paymentOrder && (
        <PaymentModal
          order={paymentOrder}
          onClose={() => setPaymentOrder(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}

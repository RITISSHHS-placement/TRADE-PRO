import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { RefreshCw, Search, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import {
  loadQuotes, loadIntradayChart, loadMFList, loadMFNavBatch, setChartSymbol, setMFSearch,
} from '../store/slices/marketSlice'
import {
  INDICES, EQUITIES, ETFS, FNO, COMMODITIES, FOREX, CRYPTO, GLOBAL_INDICES,
  SYMBOL_LABELS, TOP_MF_CODES,
} from '../services/marketData'
import { Card, Spinner } from '../components/ui'
import styles from './MarketPage.module.css'

/* ── helpers ─────────────────────────────────────────── */
const fmt2 = (n) => n?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'
const fmt0 = (n) => n?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) ?? '—'
const fmtVol = (n) => {
  if (!n) return '—'
  if (n >= 1e7) return `${(n / 1e7).toFixed(1)}Cr`
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L`
  return n.toLocaleString('en-IN')
}
const fmtTime = (ts) => ts
  ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  : '--'

/* ── TABS ─────────────────────────────────────────────── */
const TABS = [
  { id: 'indices',   label: 'Indices',     symbols: INDICES },
  { id: 'equities',  label: 'Equities',    symbols: EQUITIES },
  { id: 'etfs',      label: 'ETFs',        symbols: ETFS },
  { id: 'fno',       label: 'F&O Proxies', symbols: FNO },
  { id: 'commodities', label: 'Commodities', symbols: COMMODITIES },
  { id: 'forex',     label: 'Forex',       symbols: FOREX },
  { id: 'crypto',    label: 'Crypto',      symbols: CRYPTO },
  { id: 'global',    label: 'Global',      symbols: GLOBAL_INDICES },
  { id: 'mf',        label: 'Mutual Funds', symbols: null },
]

/* ── QUOTE ROW ────────────────────────────────────────── */
function QuoteRow({ sym, label, quote, currency, onSelect, isSelected }) {
  const up = (quote?.changePct ?? 0) >= 0
  return (
    <div
      className={`${styles.row} ${isSelected ? styles.rowSelected : ''}`}
      onClick={() => onSelect(sym)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(sym)}
    >
      <div className={styles.rowSym}>
        <span className={styles.symName}>{label}</span>
        <span className={styles.symCode}>{sym}</span>
      </div>
      <div className={styles.rowPrice}>
        {quote ? `${currency === 'USD' ? '$' : '₹'}${fmt2(quote.price)}` : <span className={styles.loading}>—</span>}
      </div>
      <div className={up ? styles.changeUp : styles.changeDown}>
        {quote ? `${up ? '▲' : '▼'} ${Math.abs(quote.changePct).toFixed(2)}%` : '—'}
      </div>
      <div className={styles.rowExtra}>
        {quote ? `H ${fmt0(quote.high)} / L ${fmt0(quote.low)}` : '—'}
      </div>
      <div className={styles.rowVol}>{quote ? fmtVol(quote.volume) : '—'}</div>
    </div>
  )
}

/* ── MF ROW ───────────────────────────────────────────── */
function MFRow({ scheme, nav }) {
  return (
    <div className={styles.mfRow}>
      <div className={styles.mfName}>{scheme.schemeName}</div>
      <div className={styles.mfMeta}>
        {nav ? (
          <>
            <span className={styles.mfNav}>NAV ₹{parseFloat(nav.nav).toFixed(4)}</span>
            <span className={styles.mfDate}>{nav.date}</span>
            <span className={styles.mfCat}>{nav.schemeCategory || nav.fundHouse}</span>
          </>
        ) : (
          <span className={styles.mfDate}>Loading…</span>
        )}
      </div>
    </div>
  )
}

/* ── CHART PANEL ──────────────────────────────────────── */
function ChartPanel({ symbol, quote, chartData, loading }) {
  if (!symbol) return null
  const up = (quote?.changePct ?? 0) >= 0
  const label = SYMBOL_LABELS[symbol] || symbol
  const isCrypto = symbol.endsWith('-USD')
  const currSign = isCrypto || symbol.endsWith('=F') ? '$' : '₹'

  return (
    <Card className={styles.chartPanel}>
      <div className={styles.chartTop}>
        <div>
          <div className={styles.chartLabel}>{label}</div>
          <div className={styles.chartPrice}>
            {quote ? `${currSign}${fmt2(quote.price)}` : '—'}
            {quote && (
              <span className={up ? styles.changeUp : styles.changeDown}>
                {' '}{up ? '▲' : '▼'} {Math.abs(quote.changePct).toFixed(2)}%
              </span>
            )}
          </div>
          {quote && (
            <div className={styles.chartMeta}>
              <span>O {fmt2(quote.open)}</span>
              <span>H {fmt2(quote.high)}</span>
              <span>L {fmt2(quote.low)}</span>
              <span>Vol {fmtVol(quote.volume)}</span>
            </div>
          )}
        </div>
        <div className={styles.liveTag}><span className={styles.liveDot} />LIVE</div>
      </div>

      {loading && chartData.length === 0 ? (
        <div className={styles.chartLoader}><Spinner size={24} /></div>
      ) : chartData.length < 2 ? (
        <div className={styles.chartLoader} style={{ color: 'var(--gray-3)', fontSize: 13 }}>
          Intraday chart unavailable for this symbol
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={up ? '#00d084' : '#ff4d6a'} stopOpacity={0.2} />
                <stop offset="95%" stopColor={up ? '#00d084' : '#ff4d6a'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill:'#80809a', fontSize:10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill:'#80809a', fontSize:10 }} axisLine={false} tickLine={false} domain={['auto','auto']} tickFormatter={fmt0} />
            <Tooltip
              contentStyle={{ background:'#13131f', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#fff', fontSize:12 }}
              cursor={{ stroke:'rgba(255,255,255,0.1)' }}
              formatter={(v) => [`${currSign}${fmt2(v)}`, label]}
            />
            <Area type="monotone" dataKey="value" stroke={up ? '#00d084' : '#ff4d6a'}
              strokeWidth={2} fill="url(#cg)" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function MarketPage() {
  const dispatch = useDispatch()
  const { quotes, charts, mfList, mfNavs, mfSearch, loading, chartLoading, lastUpdated } =
    useSelector((s) => s.market)

  const [activeTab, setActiveTab] = useState('indices')
  const [selectedSym, setSelectedSym] = useState('^NSEI')
  const [search, setSearch] = useState('')

  const pollRef = useRef(null)

  // All non-MF symbols combined for polling
  const allSymbols = [
    ...Object.keys(INDICES),
    ...Object.keys(EQUITIES),
    ...Object.keys(ETFS),
    ...Object.keys(FNO),
    ...Object.keys(COMMODITIES),
    ...Object.keys(FOREX),
    ...Object.keys(CRYPTO),
    ...Object.keys(GLOBAL_INDICES),
  ]
  // Deduplicate
  const uniqueSymbols = [...new Set(allSymbols)]

  // Initial load
  useEffect(() => {
    dispatch(loadQuotes(uniqueSymbols))
    dispatch(loadIntradayChart('^NSEI'))

    pollRef.current = setInterval(() => {
      dispatch(loadQuotes(uniqueSymbols))
    }, 5000)

    // Load MF list once
    if (mfList.length === 0) dispatch(loadMFList())

    return () => clearInterval(pollRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load MF NAVs when MF tab is active
  useEffect(() => {
    if (activeTab === 'mf' && mfList.length > 0) {
      const missing = TOP_MF_CODES.filter(c => !mfNavs[c])
      if (missing.length > 0) dispatch(loadMFNavBatch(missing))
    }
  }, [activeTab, mfList.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectSym = useCallback((sym) => {
    setSelectedSym(sym)
    dispatch(setChartSymbol(sym))
    if (!charts[sym]) dispatch(loadIntradayChart(sym))
  }, [dispatch, charts])

  const currentTab = TABS.find(t => t.id === activeTab)
  const tabSymbols = currentTab?.symbols ? Object.entries(currentTab.symbols) : []

  // Filter by search
  const filtered = tabSymbols.filter(([sym, label]) => {
    if (!search) return true
    const q = search.toLowerCase()
    return sym.toLowerCase().includes(q) || label.toLowerCase().includes(q)
  })

  // MF search
  const mfFiltered = mfList
    .filter(s => s.schemeName?.toLowerCase().includes((mfSearch || search).toLowerCase()))
    .slice(0, 100)

  const selectedQuote = quotes[selectedSym]
  const selectedChart = charts[selectedSym] || []

  const isCrypto = selectedSym?.endsWith('-USD')
  const isForex  = selectedSym?.endsWith('=X')
  const isCommodity = selectedSym?.endsWith('=F')

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Market Hub</h1>
          <p className={styles.sub}>Live data across equities, F&O, commodities, forex, crypto & mutual funds</p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.updatedTime}>
            <Clock size={12} /> {fmtTime(lastUpdated)}
          </span>
          <button
            className={styles.refreshBtn}
            onClick={() => dispatch(loadQuotes(uniqueSymbols))}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? styles.spinning : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Global Ticker Strip ── */}
      <div className={styles.tickerStrip}>
        {['^NSEI','^NSEBANK','^INDIAVIX','GC=F','SI=F','BTC-USD','USDINR=X','^GSPC'].map(sym => {
          const q = quotes[sym]
          const up = (q?.changePct ?? 0) >= 0
          return (
            <div key={sym} className={styles.tickerChip} onClick={() => handleSelectSym(sym)}>
              <span className={styles.tSym}>{SYMBOL_LABELS[sym] || sym}</span>
              <span className={styles.tPrice}>{q ? fmt2(q.price) : '—'}</span>
              {q && <span className={up ? styles.tUp : styles.tDown}>{up ? '▲' : '▼'}{Math.abs(q.changePct).toFixed(2)}%</span>}
            </div>
          )
        })}
      </div>

      <div className={styles.body}>

        {/* ── Left: List ── */}
        <div className={styles.listPanel}>

          {/* Tabs */}
          <div className={styles.tabs}>
            {TABS.map(t => (
              <button
                key={t.id}
                className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
                onClick={() => { setActiveTab(t.id); setSearch('') }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className={styles.searchBox}>
            <Search size={13} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder={activeTab === 'mf' ? 'Search mutual funds…' : 'Search symbol or name…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* ── MF Tab ── */}
          {activeTab === 'mf' ? (
            <div className={styles.listScroll}>
              {mfList.length === 0 ? (
                <div className={styles.emptyMsg}><Spinner size={20} /> Loading fund list…</div>
              ) : mfFiltered.length === 0 ? (
                <div className={styles.emptyMsg}>No funds found</div>
              ) : (
                <>
                  <div className={styles.mfNote}>
                    ⓘ Mutual Fund NAV is end-of-day (declared by AMFI). Not real-time.
                  </div>
                  {mfFiltered.map(scheme => (
                    <MFRow
                      key={scheme.schemeCode}
                      scheme={scheme}
                      nav={mfNavs[scheme.schemeCode]}
                    />
                  ))}
                </>
              )}
            </div>
          ) : (
            /* ── Quote Table ── */
            <div className={styles.listScroll}>
              {/* Table header */}
              <div className={styles.tableHead}>
                <span>Symbol</span>
                <span>Price</span>
                <span>Change</span>
                <span className={styles.hideSmall}>Range</span>
                <span className={styles.hideSmall}>Volume</span>
              </div>
              {filtered.length === 0 ? (
                <div className={styles.emptyMsg}>No results</div>
              ) : filtered.map(([sym, label]) => {
                const currency = (isCrypto || sym.endsWith('-USD') || sym.endsWith('=F') || sym.endsWith('=X'))
                  ? 'USD' : 'INR'
                return (
                  <QuoteRow
                    key={sym}
                    sym={sym}
                    label={label}
                    quote={quotes[sym]}
                    currency={currency}
                    onSelect={handleSelectSym}
                    isSelected={selectedSym === sym}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* ── Right: Chart + Detail ── */}
        <div className={styles.detailPanel}>
          <ChartPanel
            symbol={selectedSym}
            quote={selectedQuote}
            chartData={selectedChart}
            loading={chartLoading}
          />

          {/* Detail stats */}
          {selectedQuote && (
            <Card className={styles.detailCard}>
              <div className={styles.detailTitle}>
                {SYMBOL_LABELS[selectedSym] || selectedSym} — Market Detail
              </div>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailKey}>Open</span>
                  <span className={styles.detailVal}>₹{fmt2(selectedQuote.open)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailKey}>Prev Close</span>
                  <span className={styles.detailVal}>₹{fmt2(selectedQuote.prevClose)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailKey}>Day High</span>
                  <span className={styles.detailVal} style={{ color: 'var(--green)' }}>₹{fmt2(selectedQuote.high)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailKey}>Day Low</span>
                  <span className={styles.detailVal} style={{ color: 'var(--red)' }}>₹{fmt2(selectedQuote.low)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailKey}>Volume</span>
                  <span className={styles.detailVal}>{fmtVol(selectedQuote.volume)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailKey}>Market State</span>
                  <span className={styles.detailVal}
                    style={{ color: selectedQuote.marketState === 'REGULAR' ? 'var(--green)' : 'var(--amber)' }}>
                    {selectedQuote.marketState}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailKey}>Currency</span>
                  <span className={styles.detailVal}>{selectedQuote.currency}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailKey}>Change (₹)</span>
                  <span className={styles.detailVal}
                    style={{ color: selectedQuote.change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {selectedQuote.change >= 0 ? '+' : ''}{fmt2(selectedQuote.change)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Commodities Quick View */}
          {activeTab === 'commodities' && (
            <Card className={styles.metalCard}>
              <div className={styles.detailTitle}>Precious Metals (Global Spot)</div>
              <div className={styles.metalGrid}>
                {[
                  { sym: 'GC=F', label: 'Gold', icon: '🥇' },
                  { sym: 'SI=F', label: 'Silver', icon: '🥈' },
                  { sym: 'PL=F', label: 'Platinum', icon: '⬡' },
                  { sym: 'PA=F', label: 'Palladium', icon: '◈' },
                ].map(({ sym, label, icon }) => {
                  const q = quotes[sym]
                  const up = (q?.changePct ?? 0) >= 0
                  return (
                    <div key={sym} className={styles.metalItem} onClick={() => handleSelectSym(sym)}>
                      <div className={styles.metalIcon}>{icon}</div>
                      <div className={styles.metalName}>{label}</div>
                      <div className={styles.metalPrice}>${q ? fmt2(q.price) : '—'}<span style={{fontSize:10,color:'var(--gray-3)'}}>/oz</span></div>
                      {q && <div className={up ? styles.changeUp : styles.changeDown}>
                        {up ? '▲' : '▼'} {Math.abs(q.changePct).toFixed(2)}%
                      </div>}
                    </div>
                  )
                })}
              </div>
              <div className={styles.metalNote}>
                ⓘ MCX India gold/silver ETF proxies shown in the table above. Global spot prices in USD/oz shown here.
              </div>
            </Card>
          )}

          {/* F&O Info */}
          {activeTab === 'fno' && (
            <Card className={styles.fnoInfo}>
              <div className={styles.detailTitle}>F&amp;O Notes</div>
              <p className={styles.fnoText}>
                Real-time NSE F&O tick data requires an NSE-licensed data feed subscription.
                This panel shows F&O-relevant instruments available via Yahoo Finance:
                Index spot prices (NIFTY, BankNifty), India VIX (implied volatility index),
                and ETFs that track the same underlying — widely used as F&O proxies.
              </p>
              {selectedQuote && selectedSym === '^INDIAVIX' && (
                <div className={styles.vixBox}>
                  <div className={styles.vixValue}>{fmt2(selectedQuote.price)}</div>
                  <div className={styles.vixLabel}>India VIX</div>
                  <div className={styles.vixDesc}>
                    {selectedQuote.price < 15 ? '🟢 Low volatility — calm market'
                      : selectedQuote.price < 20 ? '🟡 Moderate volatility'
                      : selectedQuote.price < 30 ? '🟠 Elevated volatility — caution'
                      : '🔴 High volatility — extreme caution'}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Crypto market cap rough estimate */}
          {activeTab === 'crypto' && (
            <Card className={styles.cryptoCard}>
              <div className={styles.detailTitle}>Crypto — Top 10 by Market Cap</div>
              <div className={styles.cryptoGrid}>
                {Object.entries(CRYPTO).map(([sym, name]) => {
                  const q = quotes[sym]
                  const up = (q?.changePct ?? 0) >= 0
                  return (
                    <div key={sym} className={`${styles.cryptoItem} ${selectedSym === sym ? styles.cryptoSelected : ''}`}
                      onClick={() => handleSelectSym(sym)}>
                      <div className={styles.cryptoName}>{name}</div>
                      <div className={styles.cryptoPrice}>${q ? fmt2(q.price) : '—'}</div>
                      {q && <div className={up ? styles.changeUp : styles.changeDown}>
                        {up ? '▲' : '▼'} {Math.abs(q.changePct).toFixed(2)}%
                      </div>}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}

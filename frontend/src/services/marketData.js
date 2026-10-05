/**
 * marketData.js — Live market data with automatic backend/direct fallback
 *
 * Strategy (in order):
 *   1. Try the backend proxy (/backend/market/*) — works when Render is up
 *   2. Fall back to Yahoo Finance v8 directly from the browser — always works
 *
 * This means data always loads even when the Render free-tier backend
 * is cold-starting, rate-limited, or being redeployed.
 */

const BACKEND = (import.meta.env.VITE_API_URL || '/backend') + '/market'
const YF      = 'https://query1.finance.yahoo.com/v8/finance/chart'

// ── Yahoo Finance symbol maps ─────────────────────────────────────────────
const INDEX_YF = {
  'NIFTY 50':                '^NSEI',
  'NIFTY BANK':              '^NSEBANK',
  'NIFTY IT':                '^CNXIT',
  'NIFTY PHARMA':            '^CNXPHARMA',
  'NIFTY AUTO':              '^CNXAUTO',
  'NIFTY FMCG':              '^CNXFMCG',
  'NIFTY METAL':             '^CNXMETAL',
  'NIFTY REALTY':            '^CNXREALTY',
  'NIFTY FINANCIAL SERVICES':'^CNXFINANCE',
  'NIFTY MIDCAP 100':        '^CNXMIDCAP',
  'NIFTY SMALLCAP 100':      '^CNXSC',
  'INDIA VIX':               '^INDIAVIX',
  'NIFTY NEXT 50':           '^NSMIDCP50',
  'SENSEX':                  '^BSESN',
}

const NIFTY50_YF = [
  'RELIANCE.NS','TCS.NS','HDFCBANK.NS','INFY.NS','ICICIBANK.NS',
  'SBIN.NS','BAJFINANCE.NS','BHARTIARTL.NS','KOTAKBANK.NS','WIPRO.NS',
  'HCLTECH.NS','AXISBANK.NS','LT.NS','ITC.NS','MARUTI.NS',
  'TITAN.NS','TATAMOTORS.NS','TATASTEEL.NS','ONGC.NS','NTPC.NS',
  'SUNPHARMA.NS','ULTRACEMCO.NS','NESTLEIND.NS','ASIANPAINT.NS','POWERGRID.NS',
  'COALINDIA.NS','ADANIENT.NS','ADANIPORTS.NS','BAJAJ-AUTO.NS','HEROMOTOCO.NS',
  'TATACONSUM.NS','INDIGO.NS','DRREDDY.NS','CIPLA.NS','APOLLOHOSP.NS',
  'EICHERMOT.NS','GRASIM.NS','DIVISLAB.NS','TECHM.NS','INDUSINDBK.NS',
  'POLYCAB.NS','HDFCLIFE.NS','SBILIFE.NS','TRENT.NS','VEDL.NS',
  'RECLTD.NS','PFC.NS','HINDALCO.NS','JSWSTEEL.NS','BAJAJFINSV.NS',
]

// ── Helpers ──────────────────────────────────────────────────────────────
async function backendGet(endpoint) {
  const r = await fetch(`${BACKEND}/${endpoint}`, {
    signal: AbortSignal.timeout(8000),
  })
  if (!r.ok) throw new Error(`Backend ${endpoint} returned ${r.status}`)
  const data = await r.json()
  // Treat backend error responses as failures so we fall back to YF
  if (data?.success === false || data?.error) throw new Error(data.message || data.error)
  return data
}

async function yfQuote(yfSymbol) {
  const r = await fetch(
    `${YF}/${encodeURIComponent(yfSymbol)}?interval=1d&range=1d`,
    {
      signal: AbortSignal.timeout(8000),
      headers: { 'Accept': 'application/json' },
    }
  )
  if (!r.ok) throw new Error(`YF ${yfSymbol} ${r.status}`)
  const d    = await r.json()
  const meta = d?.chart?.result?.[0]?.meta
  if (!meta) throw new Error(`No meta for ${yfSymbol}`)

  const price     = meta.regularMarketPrice     ?? 0
  const prevClose = meta.previousClose          ?? meta.chartPreviousClose ?? price
  const change    = price - prevClose
  const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0

  return {
    price,
    change,
    changePct,
    open:      meta.regularMarketOpen    ?? price,
    high:      meta.regularMarketDayHigh ?? price,
    low:       meta.regularMarketDayLow  ?? price,
    prevClose,
    yearHigh:  meta.fiftyTwoWeekHigh     ?? 0,
    yearLow:   meta.fiftyTwoWeekLow      ?? 0,
    volume:    meta.regularMarketVolume  ?? 0,
    updatedAt: Date.now(),
  }
}

// Fetch multiple YF symbols with a small concurrency cap (avoids rate-limit)
async function yfBatch(symbols, concurrency = 8) {
  const results = []
  for (let i = 0; i < symbols.length; i += concurrency) {
    const chunk = symbols.slice(i, i + concurrency)
    const settled = await Promise.allSettled(
      chunk.map(sym => yfQuote(sym).then(q => ({ sym, ...q })))
    )
    for (const s of settled) {
      if (s.status === 'fulfilled') results.push(s.value)
    }
  }
  return results
}

function shapeStock(raw) {
  return {
    symbol:    (raw.symbol ?? raw.sym ?? '').replace('.NS',''),
    name:      (raw.symbol ?? raw.sym ?? '').replace('.NS',''),
    price:     raw.ltp   ?? raw.price     ?? 0,
    change:    raw.change ?? 0,
    changePct: raw.net_price ?? raw.perChange ?? raw.changePct ?? 0,
    open:      raw.open_price ?? raw.open  ?? 0,
    high:      raw.high_price ?? raw.high  ?? 0,
    low:       raw.low_price  ?? raw.low   ?? 0,
    prevClose: raw.prev_price ?? raw.prevClose ?? 0,
    volume:    raw.trade_quantity ?? raw.volume ?? 0,
    updatedAt: Date.now(),
  }
}

// ── Public API ────────────────────────────────────────────────────────────

/** All NSE indices map keyed by index name */
export async function fetchNSEIndices() {
  // Try backend first
  try {
    const data = await backendGet('indices')
    const map = {}
    for (const x of (data.data || [])) {
      const key = x.index?.toUpperCase()
      if (!key) continue
      map[key] = {
        symbol: key, name: x.index,
        price:     x.last          ?? 0,
        change:    x.variation     ?? 0,
        changePct: x.percentChange ?? 0,
        open:      x.open          ?? 0,
        high:      x.high          ?? 0,
        low:       x.low           ?? 0,
        prevClose: x.previousClose ?? 0,
        yearHigh:  x.yearHigh      ?? 0,
        yearLow:   x.yearLow       ?? 0,
        updatedAt: Date.now(),
      }
    }
    if (Object.keys(map).length > 0) return map
  } catch (_) { /* fall through to Yahoo Finance */ }

  // Direct Yahoo Finance fallback
  const map = {}
  const entries = Object.entries(INDEX_YF)
  const settled = await Promise.allSettled(
    entries.map(([name, yfSym]) =>
      yfQuote(yfSym).then(q => ({ name, ...q }))
    )
  )
  for (const s of settled) {
    if (s.status !== 'fulfilled') continue
    const { name, ...q } = s.value
    const KEY = name.toUpperCase()
    map[KEY] = { symbol: KEY, name, ...q }
  }
  return map
}

/** Top gainers */
export async function fetchGainers() {
  try {
    const data  = await backendGet('gainers')
    const items = data.NIFTY?.data || data.data || []
    if (items.length > 0) return items.map(shapeStock).slice(0, 15)
  } catch (_) {}

  // Yahoo Finance fallback: fetch all NIFTY50, sort by changePct desc
  try {
    const quotes = await yfBatch(NIFTY50_YF)
    return quotes
      .sort((a, b) => b.changePct - a.changePct)
      .slice(0, 15)
      .map(q => ({ ...q, symbol: q.sym.replace('.NS',''), name: q.sym.replace('.NS','') }))
  } catch { return [] }
}

/** Top losers */
export async function fetchLosers() {
  try {
    const data  = await backendGet('losers')
    const items = data.NIFTY?.data || data.data || []
    if (items.length > 0) return items.map(shapeStock).slice(0, 15)
  } catch (_) {}

  try {
    const quotes = await yfBatch(NIFTY50_YF)
    return quotes
      .sort((a, b) => a.changePct - b.changePct)
      .slice(0, 15)
      .map(q => ({ ...q, symbol: q.sym.replace('.NS',''), name: q.sym.replace('.NS','') }))
  } catch { return [] }
}

/** Most active by volume */
export async function fetchMostActive() {
  try {
    const data  = await backendGet('mostactive')
    const items = data.NIFTY?.data || data.data || []
    if (items.length > 0) return items.map(s => ({
      symbol:    (s.symbol || '').replace('.NS',''),
      price:     s.ltp ?? 0,
      changePct: s.net_price ?? s.perChange ?? 0,
      volume:    s.trade_quantity ?? 0,
      updatedAt: Date.now(),
    })).slice(0, 20)
  } catch (_) {}

  try {
    const quotes = await yfBatch(NIFTY50_YF)
    return quotes
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 20)
      .map(q => ({
        symbol: q.sym.replace('.NS',''), price: q.price,
        changePct: q.changePct, volume: q.volume, updatedAt: Date.now(),
      }))
  } catch { return [] }
}

/** Stock price map from gainers + losers + mostactive */
export async function fetchNifty50() {
  const [g, l, m] = await Promise.allSettled([
    fetchGainers(), fetchLosers(), fetchMostActive(),
  ])
  const all = [
    ...(g.status === 'fulfilled' ? g.value : []),
    ...(l.status === 'fulfilled' ? l.value : []),
    ...(m.status === 'fulfilled' ? m.value : []),
  ]
  const map = {}
  for (const s of all) {
    const sym = (s.symbol || '').replace('.NS','')
    if (!sym || map[sym]) continue
    map[sym] = { ...s, symbol: sym }
  }
  return map
}

// ── Mutual Funds (always direct — no backend needed) ─────────────────────
const MF_BASE = 'https://api.mfapi.in/mf'

export async function fetchMFList() {
  const r = await fetch(MF_BASE)
  if (!r.ok) throw new Error('MF list failed')
  return r.json()
}

export async function fetchMFNav(code) {
  const r = await fetch(`${MF_BASE}/${code}`)
  if (!r.ok) throw new Error(`MF ${code} failed`)
  const j = await r.json()
  return {
    schemeCode:     code,
    schemeName:     j.meta?.scheme_name     || '',
    nav:            j.data?.[0]?.nav ? parseFloat(j.data[0].nav) : null,
    date:           j.data?.[0]?.date       || '',
    fundHouse:      j.meta?.fund_house      || '',
    schemeCategory: j.meta?.scheme_category || '',
    schemeType:     j.meta?.scheme_type     || '',
    history:        j.data?.slice(0, 30)    || [],
  }
}

// ── Symbol labels ─────────────────────────────────────────────────────────
export const INDEX_KEYS = {
  'NIFTY 50':                'NIFTY 50',
  'NIFTY BANK':              'BANK NIFTY',
  'NIFTY NEXT 50':           'NIFTY NEXT 50',
  'NIFTY MIDCAP 100':        'MIDCAP 100',
  'NIFTY IT':                'NIFTY IT',
  'NIFTY PHARMA':            'PHARMA',
  'NIFTY FMCG':              'FMCG',
  'NIFTY AUTO':              'AUTO',
  'NIFTY METAL':             'METAL',
  'NIFTY REALTY':            'REALTY',
  'NIFTY FINANCIAL SERVICES':'FIN SERVICES',
  'INDIA VIX':               'INDIA VIX',
  'SENSEX':                  'SENSEX',
}

export const SYMBOL_LABELS = {
  ...INDEX_KEYS,
  'RELIANCE':'RELIANCE',     'TCS':'TCS',            'HDFCBANK':'HDFC BANK',
  'INFY':'INFOSYS',          'ICICIBANK':'ICICI BANK','HINDUNILVR':'HUL',
  'SBIN':'SBI',              'BAJFINANCE':'BAJAJ FIN','BHARTIARTL':'AIRTEL',
  'KOTAKBANK':'KOTAK BANK',  'WIPRO':'WIPRO',         'HCLTECH':'HCL TECH',
  'AXISBANK':'AXIS BANK',    'LT':'L&T',              'ITC':'ITC',
  'MARUTI':'MARUTI',         'TITAN':'TITAN',         'TATAMOTORS':'TATA MOTORS',
  'TATASTEEL':'TATA STEEL',  'ONGC':'ONGC',           'NTPC':'NTPC',
  'SUNPHARMA':'SUN PHARMA',  'ULTRACEMCO':'ULTRATECH', 'NESTLEIND':'NESTLE',
  'ASIANPAINT':'ASIAN PAINTS','POWERGRID':'POWER GRID','COALINDIA':'COAL INDIA',
  'ADANIENT':'ADANI ENT',    'ADANIPORTS':'ADANI PORTS','BAJAJ-AUTO':'BAJAJ AUTO',
  'HEROMOTOCO':'HERO MOTO',  'TATACONSUM':'TATA CONS', 'INDIGO':'INDIGO',
  'DRREDDY':'DR REDDY',      'CIPLA':'CIPLA',          'APOLLOHOSP':'APOLLO HOSP',
  'EICHERMOT':'EICHER MOT',  'GRASIM':'GRASIM',        'DIVISLAB':'DIVIS LAB',
  'TECHM':'TECH MAHINDRA',   'INDUSINDBK':'INDUSIND',  'POLYCAB':'POLYCAB',
  'HDFCLIFE':'HDFC LIFE',    'SBILIFE':'SBI LIFE',     'TRENT':'TRENT',
  'VEDL':'VEDANTA',          'RECLTD':'REC LTD',       'PFC':'PFC',
  'HINDALCO':'HINDALCO',     'JSWSTEEL':'JSW STEEL',   'BAJAJFINSV':'BAJAJ FINSERV',
}

export const DEFAULT_SYMBOLS = Object.keys(SYMBOL_LABELS)

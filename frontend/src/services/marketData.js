/**
 * marketData.js — NSE India live data via Vercel Edge proxy
 *
 * Working NSE endpoints (no session cookie required):
 *   allIndices     → all 139 NSE indices (NIFTY 50, BANK NIFTY, VIX…)
 *   marketStatus   → key index prices + market open/close status
 *   gainers        → top gainers with OHLC
 *   losers         → top losers with OHLC
 *   mostactive     → most active by value
 *
 * Stock prices extracted from gainers/losers/allIndices since
 * equity-stockIndices requires a cookie session (returns 404 without it).
 */

const EDGE = '/api/market'   // Vercel edge function (same origin, no CORS)
const FALLBACK = (import.meta.env.VITE_API_URL || '/backend') + '/market'

async function nse(endpoint) {
  // Primary: Vercel edge function
  try {
    const r = await fetch(`${EDGE}?endpoint=${endpoint}`, {
      signal: AbortSignal.timeout(8000),
    })
    if (r.ok) {
      const j = await r.json()
      if (!j.error) return j
    }
  } catch (_) {}

  // Fallback: Render proxy
  try {
    const r = await fetch(`${FALLBACK}/${endpoint}`, { signal: AbortSignal.timeout(10000) })
    if (r.ok) return r.json()
  } catch (_) {}

  throw new Error(`Market data unavailable for ${endpoint}`)
}

/* ─────────────────────────────────────────────────────
   ALL NSE INDICES  (NIFTY 50, BANK NIFTY, VIX, etc.)
───────────────────────────────────────────────────── */
export async function fetchNSEIndices() {
  const data = await nse('allIndices')
  const map  = {}
  for (const x of (data.data || [])) {
    const key = x.index?.toUpperCase()
    if (!key) continue
    map[key] = {
      symbol:    key,
      name:      x.index,
      price:     x.last            ?? 0,
      change:    x.variation       ?? 0,
      changePct: x.percentChange   ?? 0,
      open:      x.open            ?? 0,
      high:      x.high            ?? 0,
      low:       x.low             ?? 0,
      prevClose: x.previousClose   ?? 0,
      yearHigh:  x.yearHigh        ?? 0,
      yearLow:   x.yearLow         ?? 0,
      updatedAt: Date.now(),
    }
  }
  return map
}

/* ─────────────────────────────────────────────────────
   GAINERS — returns OHLC + ltp + changePct for stocks
───────────────────────────────────────────────────── */
export async function fetchGainers() {
  try {
    const data  = await nse('gainers')
    const items = data.NIFTY?.data || data.data || []
    return items.map(s => ({
      symbol:    s.symbol,
      name:      s.symbol,
      price:     s.ltp        ?? 0,
      change:    0,
      changePct: s.net_price  ?? s.perChange ?? 0,
      open:      s.open_price ?? 0,
      high:      s.high_price ?? 0,
      low:       s.low_price  ?? 0,
      prevClose: s.prev_price ?? 0,
      volume:    s.trade_quantity ?? 0,
      updatedAt: Date.now(),
    })).slice(0, 15)
  } catch { return [] }
}

/* ─────────────────────────────────────────────────────
   LOSERS
───────────────────────────────────────────────────── */
export async function fetchLosers() {
  try {
    const data  = await nse('losers')
    const items = data.NIFTY?.data || data.data || []
    return items.map(s => ({
      symbol:    s.symbol,
      name:      s.symbol,
      price:     s.ltp        ?? 0,
      change:    0,
      changePct: s.net_price  ?? s.perChange ?? 0,
      open:      s.open_price ?? 0,
      high:      s.high_price ?? 0,
      low:       s.low_price  ?? 0,
      prevClose: s.prev_price ?? 0,
      volume:    s.trade_quantity ?? 0,
      updatedAt: Date.now(),
    })).slice(0, 15)
  } catch { return [] }
}

/* ─────────────────────────────────────────────────────
   MOST ACTIVE — for the trading terminal watchlist
───────────────────────────────────────────────────── */
export async function fetchMostActive() {
  try {
    const data  = await nse('mostactive')
    const items = data.NIFTY?.data || data.data || []
    return items.map(s => ({
      symbol:    s.symbol,
      price:     s.ltp        ?? 0,
      changePct: s.net_price  ?? s.perChange ?? 0,
      volume:    s.trade_quantity ?? 0,
      updatedAt: Date.now(),
    })).slice(0, 20)
  } catch { return [] }
}

/* ─────────────────────────────────────────────────────
   BUILD STOCK MAP from gainers + losers + mostactive
   (since equity-stockIndices needs session cookie)
───────────────────────────────────────────────────── */
export async function fetchNifty50() {
  // Combine gainers + losers to build a stock price map
  const [g, l, m] = await Promise.allSettled([fetchGainers(), fetchLosers(), fetchMostActive()])
  const all = [
    ...(g.status === 'fulfilled' ? g.value : []),
    ...(l.status === 'fulfilled' ? l.value : []),
    ...(m.status === 'fulfilled' ? m.value : []),
  ]
  const map = {}
  for (const s of all) {
    if (!s.symbol || map[s.symbol]) continue  // first occurrence wins
    map[s.symbol] = s
  }
  return map
}

/* ─────────────────────────────────────────────────────
   MUTUAL FUNDS  (mfapi.in — AMFI end-of-day, browser direct)
───────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────
   SYMBOL LABELS
───────────────────────────────────────────────────── */
export const INDEX_KEYS = {
  'NIFTY 50':               'NIFTY 50',
  'NIFTY BANK':             'BANK NIFTY',
  'NIFTY NEXT 50':          'NIFTY NEXT 50',
  'NIFTY MIDCAP SELECT':    'MIDCAP SEL',
  'NIFTY IT':               'NIFTY IT',
  'NIFTY PHARMA':           'PHARMA',
  'NIFTY FMCG':             'FMCG',
  'NIFTY AUTO':             'AUTO',
  'NIFTY METAL':            'METAL',
  'NIFTY REALTY':           'REALTY',
  'NIFTY FINANCIAL SERVICES': 'FIN SERVICES',
  'INDIA VIX':              'INDIA VIX',
}

export const SYMBOL_LABELS = {
  ...INDEX_KEYS,
  'RELIANCE':'RELIANCE',   'TCS':'TCS',          'HDFCBANK':'HDFC BANK',
  'INFY':'INFOSYS',        'ICICIBANK':'ICICI BANK', 'HINDUNILVR':'HUL',
  'SBIN':'SBI',            'BAJFINANCE':'BAJAJ FIN', 'BHARTIARTL':'AIRTEL',
  'KOTAKBANK':'KOTAK BANK','WIPRO':'WIPRO',       'HCLTECH':'HCL TECH',
  'AXISBANK':'AXIS BANK',  'LT':'L&T',            'ITC':'ITC',
  'MARUTI':'MARUTI',       'TITAN':'TITAN',       'TATAMOTORS':'TATA MOTORS',
  'TATASTEEL':'TATA STEEL','ONGC':'ONGC',         'NTPC':'NTPC',
  'SUNPHARMA':'SUN PHARMA','ULTRACEMCO':'ULTRATECH','NESTLEIND':'NESTLE',
  'ASIANPAINT':'ASIAN PAINTS','POWERGRID':'POWER GRID','COALINDIA':'COAL INDIA',
  'ADANIENT':'ADANI ENT',  'ADANIPORTS':'ADANI PORTS', 'BAJAJ-AUTO':'BAJAJ AUTO',
  'HEROMOTOCO':'HERO MOTO','ETERNAL':'ETERNAL',   'JIOFIN':'JIO FIN',
  'INDIGO':'INDIGO',       'TATACONSUM':'TATA CONS',
}

export const DEFAULT_SYMBOLS = Object.keys(SYMBOL_LABELS)

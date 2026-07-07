/**
 * marketData.js  — NSE India live data
 *
 * Strategy:
 *  1. Try NSE India directly from browser (works in Chrome/Firefox)
 *  2. If blocked (CORS), fall back to backend proxy at /api/market/*
 *
 * NSE public endpoints (no API key, no auth):
 *   https://www.nseindia.com/api/allIndices
 *   https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050
 *   https://www.nseindia.com/api/live-analysis-variations?index=gainers
 *   https://www.nseindia.com/api/live-analysis-variations?index=loosers
 */

const NSE = 'https://www.nseindia.com/api'
const PROXY_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL    // https://tradepro-backend-erfj.onrender.com/api
  : '/api'                           // Vercel proxy

const NSE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nseindia.com/',
}

async function fetchNSE(path) {
  // Try direct NSE first (browser usually allows it)
  try {
    const r = await fetch(`${NSE}/${path}`, { headers: NSE_HEADERS })
    if (r.ok) {
      const j = await r.json()
      if (j) return j
    }
  } catch (_) {
    // CORS blocked — fall through to proxy
  }

  // Fall back to backend proxy
  const proxyPath = path
    .replace('allIndices', 'indices')
    .replace('equity-stockIndices?index=NIFTY%2050', 'nifty50')
    .replace('equity-stockIndices?index=NIFTY%20BANK', 'niftybank')
    .replace('live-analysis-variations?index=gainers',  'gainers')
    .replace('live-analysis-variations?index=loosers',  'losers')

  const r2 = await fetch(`${PROXY_BASE}/market/${proxyPath}`)
  if (!r2.ok) throw new Error(`Both NSE direct and proxy failed for ${path}`)
  return r2.json()
}

/* ─────────────────────────────────────────────────────
   NSE ALL INDICES
───────────────────────────────────────────────────── */
export async function fetchNSEIndices() {
  const data = await fetchNSE('allIndices')
  const map = {}
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
   NIFTY 50 STOCKS
───────────────────────────────────────────────────── */
export async function fetchNifty50() {
  const data = await fetchNSE('equity-stockIndices?index=NIFTY%2050')
  return parseStocks(data.data || [])
}

export async function fetchNiftyBank() {
  const data = await fetchNSE('equity-stockIndices?index=NIFTY%20BANK')
  return parseStocks(data.data || [])
}

function parseStocks(items) {
  const map = {}
  for (const s of items) {
    if (!s.symbol || s.symbol === 'NIFTY 50' || s.symbol === 'NIFTY BANK') continue
    map[s.symbol] = {
      symbol:    s.symbol,
      name:      s.meta?.companyName || s.symbol,
      price:     s.lastPrice  ?? 0,
      change:    s.change     ?? 0,
      changePct: s.pChange    ?? 0,
      open:      s.open       ?? 0,
      high:      s.dayHigh    ?? 0,
      low:       s.dayLow     ?? 0,
      prevClose: s.previousClose ?? 0,
      volume:    s.totalTradedVolume ?? 0,
      value:     s.totalTradedValue  ?? 0,
      yearHigh:  s['52WeekHigh'] ?? 0,
      yearLow:   s['52WeekLow']  ?? 0,
      updatedAt: Date.now(),
    }
  }
  return map
}

/* ─────────────────────────────────────────────────────
   GAINERS / LOSERS
───────────────────────────────────────────────────── */
export async function fetchGainers() {
  try {
    const data = await fetchNSE('live-analysis-variations?index=gainers')
    return (data.NIFTY?.data || data.data || []).map(s => ({
      symbol:    s.symbol,
      name:      s.companyName || s.symbol,
      price:     s.ltp      ?? 0,
      changePct: s.netPrice ?? 0,
    })).slice(0, 10)
  } catch { return [] }
}

export async function fetchLosers() {
  try {
    const data = await fetchNSE('live-analysis-variations?index=loosers')
    return (data.NIFTY?.data || data.data || []).map(s => ({
      symbol:    s.symbol,
      name:      s.companyName || s.symbol,
      price:     s.ltp      ?? 0,
      changePct: s.netPrice ?? 0,
    })).slice(0, 10)
  } catch { return [] }
}

/* ─────────────────────────────────────────────────────
   MUTUAL FUNDS — mfapi.in (CORS-friendly, browser direct)
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
    date:           j.data?.[0]?.date || '',
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
  'RELIANCE':   'RELIANCE',  'TCS':        'TCS',
  'HDFCBANK':   'HDFC BANK', 'INFY':       'INFOSYS',
  'ICICIBANK':  'ICICI BANK','HINDUNILVR':  'HUL',
  'SBIN':       'SBI',       'BAJFINANCE':  'BAJAJ FIN',
  'BHARTIARTL': 'AIRTEL',    'KOTAKBANK':   'KOTAK BANK',
  'WIPRO':      'WIPRO',     'HCLTECH':     'HCL TECH',
  'AXISBANK':   'AXIS BANK', 'LT':          'L&T',
  'ITC':        'ITC',       'MARUTI':      'MARUTI',
  'TITAN':      'TITAN',     'TATAMOTORS':  'TATA MOTORS',
  'TATASTEEL':  'TATA STEEL','ONGC':        'ONGC',
  'NTPC':       'NTPC',      'SUNPHARMA':   'SUN PHARMA',
  'ULTRACEMCO': 'ULTRATECH', 'BAJAJ-AUTO':  'BAJAJ AUTO',
  'HEROMOTOCO': 'HERO MOTO', 'JSWSTEEL':    'JSW STEEL',
  'M&M':        'M&M',       'DRREDDY':     'DR REDDY',
  'NESTLEIND':  'NESTLE',    'ASIANPAINT':  'ASIAN PAINTS',
  'POWERGRID':  'POWER GRID','COALINDIA':   'COAL INDIA',
}

export const DEFAULT_SYMBOLS = Object.keys(SYMBOL_LABELS)

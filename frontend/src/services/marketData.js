/**
 * marketData.js  — NSE India live data via TradePro backend proxy
 *
 * Backend endpoints (all public, no API key):
 *   /api/market/indices    → all NSE indices
 *   /api/market/nifty50   → NIFTY 50 stocks with live prices
 *   /api/market/niftybank → BANK NIFTY stocks
 *   /api/market/gainers   → top gainers
 *   /api/market/losers    → top losers
 *   /api/market/stock/:symbol → single stock
 */

const BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL   // https://tradepro-backend-erfj.onrender.com/api
  : '/api'                          // Vercel proxy → Render

async function get(path) {
  const res = await fetch(`${BASE}/market/${path}`)
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`)
  return res.json()
}

/* ─────────────────────────────────────────────────────
   NSE INDICES  (NIFTY 50, BANK NIFTY, VIX, etc.)
───────────────────────────────────────────────────── */
export async function fetchNSEIndices() {
  const data = await get('indices')
  const map  = {}
  for (const item of (data.data || [])) {
    const key = item.index?.toUpperCase()
    if (!key) continue
    map[key] = {
      symbol:    key,
      name:      item.index,
      price:     item.last       ?? 0,
      change:    item.variation  ?? 0,
      changePct: item.percentChange ?? 0,
      open:      item.open       ?? 0,
      high:      item.high       ?? 0,
      low:       item.low        ?? 0,
      prevClose: item.previousClose ?? 0,
      yearHigh:  item.yearHigh   ?? 0,
      yearLow:   item.yearLow    ?? 0,
      updatedAt: Date.now(),
    }
  }
  return map
}

/* ─────────────────────────────────────────────────────
   NIFTY 50 STOCKS
───────────────────────────────────────────────────── */
export async function fetchNifty50() {
  const data = await get('nifty50')
  return parseEquityList(data.data || [])
}

export async function fetchNiftyBank() {
  const data = await get('niftybank')
  return parseEquityList(data.data || [])
}

function parseEquityList(items) {
  const map = {}
  for (const s of items) {
    if (!s.symbol || s.symbol === 'NIFTY 50' || s.symbol === 'NIFTY BANK') continue
    map[s.symbol] = {
      symbol:    s.symbol,
      name:      s.meta?.companyName || s.symbol,
      price:     s.lastPrice  ?? s.open ?? 0,
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
  const data = await get('gainers')
  return (data.NIFTY?.data || data.data || []).map(s => ({
    symbol:    s.symbol,
    name:      s.companyName || s.symbol,
    price:     s.ltp      ?? 0,
    changePct: s.netPrice ?? 0,
    change:    s.tradedQuantity ?? 0,
  })).slice(0, 10)
}

export async function fetchLosers() {
  const data = await get('losers')
  return (data.NIFTY?.data || data.data || []).map(s => ({
    symbol:    s.symbol,
    name:      s.companyName || s.symbol,
    price:     s.ltp      ?? 0,
    changePct: s.netPrice ?? 0,
  })).slice(0, 10)
}

/* ─────────────────────────────────────────────────────
   MF — directly from mfapi.in (CORS-friendly)
───────────────────────────────────────────────────── */
const MF_BASE = 'https://api.mfapi.in/mf'

export async function fetchMFList() {
  const res = await fetch(MF_BASE)
  if (!res.ok) throw new Error('MF list failed')
  return res.json()
}

export async function fetchMFNav(code) {
  const res = await fetch(`${MF_BASE}/${code}`)
  if (!res.ok) throw new Error(`MF ${code} failed`)
  const j = await res.json()
  return {
    schemeCode:     code,
    schemeName:     j.meta?.scheme_name     || '',
    nav:            j.data?.[0]?.nav        ? parseFloat(j.data[0].nav) : null,
    date:           j.data?.[0]?.date       || '',
    fundHouse:      j.meta?.fund_house      || '',
    schemeCategory: j.meta?.scheme_category || '',
    schemeType:     j.meta?.scheme_type     || '',
    history:        j.data?.slice(0, 30)    || [],
  }
}

/* ─────────────────────────────────────────────────────
   SYMBOL / LABEL MAPS  (for display)
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
  'NIFTY FINANCIAL SERVICES':'FIN SVC',
  'INDIA VIX':              'INDIA VIX',
}

export const SYMBOL_LABELS = {
  ...INDEX_KEYS,
  'RELIANCE':  'RELIANCE',
  'TCS':       'TCS',
  'HDFCBANK':  'HDFC BANK',
  'INFY':      'INFOSYS',
  'ICICIBANK': 'ICICI BANK',
  'HINDUNILVR':'HUL',
  'SBIN':      'SBI',
  'BAJFINANCE':'BAJAJ FIN',
  'BHARTIARTL':'AIRTEL',
  'KOTAKBANK': 'KOTAK BANK',
  'WIPRO':     'WIPRO',
  'HCLTECH':   'HCL TECH',
  'AXISBANK':  'AXIS BANK',
  'LT':        'L&T',
  'ITC':       'ITC',
  'MARUTI':    'MARUTI',
  'TITAN':     'TITAN',
  'TATAMOTORS':'TATA MOTORS',
  'TATASTEEL': 'TATA STEEL',
  'ONGC':      'ONGC',
  'NTPC':      'NTPC',
  'SUNPHARMA': 'SUN PHARMA',
  'ASIANPAINT':'ASIAN PAINTS',
  'ULTRACEMCO':'ULTRATECH',
  'BAJAJ-AUTO':'BAJAJ AUTO',
  'HEROMOTOCO':'HERO MOTO',
  'JSWSTEEL':  'JSW STEEL',
  'M&M':       'M&M',
  'DRREDDY':   'DR REDDY',
}

// Default symbols for polling
export const DEFAULT_SYMBOLS = Object.keys(SYMBOL_LABELS)

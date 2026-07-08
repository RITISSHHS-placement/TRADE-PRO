/**
 * marketData.js
 *
 * Fetch strategy (in order):
 *  1. Vercel Edge Function at /api/market?endpoint=X  (proxies NSE, works from Vercel edge)
 *  2. Direct NSE India call from browser (works in many browsers without CORS issues)
 *  3. Render backend proxy at /backend/market/X
 */

const EDGE_PROXY = '/api/market'     // Vercel edge function
const RENDER_PROXY = (import.meta.env.VITE_API_URL || '/backend') + '/market'

async function fetchWithFallback(endpoint, nsePath) {
  // 1. Try Vercel edge proxy
  try {
    const r = await fetch(`${EDGE_PROXY}?endpoint=${endpoint}`, { signal: AbortSignal.timeout(8000) })
    if (r.ok) { const j = await r.json(); if (!j.error) return j }
  } catch (_) {}

  // 2. Try NSE directly from browser
  try {
    const r = await fetch(`https://www.nseindia.com/api/${nsePath}`, {
      headers: { 'Accept': 'application/json', 'Referer': 'https://www.nseindia.com/' },
      signal: AbortSignal.timeout(6000),
    })
    if (r.ok) { const j = await r.json(); if (j?.data) return j }
  } catch (_) {}

  // 3. Render backend proxy
  const r = await fetch(`${RENDER_PROXY}/${endpoint}`, { signal: AbortSignal.timeout(10000) })
  if (!r.ok) throw new Error(`All market data sources failed for ${endpoint}`)
  return r.json()
}

/* ── NSE ALL INDICES ── */
export async function fetchNSEIndices() {
  const data = await fetchWithFallback('allIndices', 'allIndices')
  const map = {}
  for (const x of (data.data || [])) {
    const key = x.index?.toUpperCase()
    if (!key) continue
    map[key] = {
      symbol:    key,
      name:      x.index,
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
  return map
}

/* ── NIFTY 50 STOCKS ── */
export async function fetchNifty50() {
  const data = await fetchWithFallback('nifty50', 'equity-stockIndices?index=NIFTY%2050')
  return parseStocks(data.data || [])
}

export async function fetchNiftyBank() {
  const data = await fetchWithFallback('niftybank', 'equity-stockIndices?index=NIFTY%20BANK')
  return parseStocks(data.data || [])
}

function parseStocks(items) {
  const map = {}
  for (const s of items) {
    if (!s.symbol || s.symbol === 'NIFTY 50' || s.symbol === 'NIFTY BANK') continue
    map[s.symbol] = {
      symbol:    s.symbol,
      name:      s.meta?.companyName || s.symbol,
      price:     s.lastPrice         ?? 0,
      change:    s.change            ?? 0,
      changePct: s.pChange           ?? 0,
      open:      s.open              ?? 0,
      high:      s.dayHigh           ?? 0,
      low:       s.dayLow            ?? 0,
      prevClose: s.previousClose     ?? 0,
      volume:    s.totalTradedVolume ?? 0,
      value:     s.totalTradedValue  ?? 0,
      yearHigh:  s['52WeekHigh']     ?? 0,
      yearLow:   s['52WeekLow']      ?? 0,
      updatedAt: Date.now(),
    }
  }
  return map
}

/* ── GAINERS / LOSERS ── */
export async function fetchGainers() {
  try {
    const data = await fetchWithFallback('gainers', 'live-analysis-variations?index=gainers')
    return (data.NIFTY?.data || data.data || []).map(s => ({
      symbol: s.symbol, name: s.companyName || s.symbol,
      price: s.ltp ?? 0, changePct: s.netPrice ?? 0,
    })).slice(0, 10)
  } catch { return [] }
}

export async function fetchLosers() {
  try {
    const data = await fetchWithFallback('losers', 'live-analysis-variations?index=loosers')
    return (data.NIFTY?.data || data.data || []).map(s => ({
      symbol: s.symbol, name: s.companyName || s.symbol,
      price: s.ltp ?? 0, changePct: s.netPrice ?? 0,
    })).slice(0, 10)
  } catch { return [] }
}

/* ── MUTUAL FUNDS (mfapi.in — AMFI, end-of-day) ── */
const MF_BASE = 'https://api.mfapi.in/mf'
export async function fetchMFList() {
  const r = await fetch(MF_BASE); if (!r.ok) throw new Error('MF list failed')
  return r.json()
}
export async function fetchMFNav(code) {
  const r = await fetch(`${MF_BASE}/${code}`); if (!r.ok) throw new Error(`MF ${code} failed`)
  const j = await r.json()
  return {
    schemeCode: code, schemeName: j.meta?.scheme_name || '',
    nav: j.data?.[0]?.nav ? parseFloat(j.data[0].nav) : null,
    date: j.data?.[0]?.date || '', fundHouse: j.meta?.fund_house || '',
    schemeCategory: j.meta?.scheme_category || '', schemeType: j.meta?.scheme_type || '',
    history: j.data?.slice(0, 30) || [],
  }
}

/* ── SYMBOL LABELS ── */
export const INDEX_KEYS = {
  'NIFTY 50': 'NIFTY 50', 'NIFTY BANK': 'BANK NIFTY', 'NIFTY NEXT 50': 'NIFTY NEXT 50',
  'NIFTY MIDCAP SELECT': 'MIDCAP SEL', 'NIFTY IT': 'NIFTY IT', 'NIFTY PHARMA': 'PHARMA',
  'NIFTY FMCG': 'FMCG', 'NIFTY AUTO': 'AUTO', 'NIFTY METAL': 'METAL',
  'NIFTY REALTY': 'REALTY', 'NIFTY FINANCIAL SERVICES': 'FIN SERVICES', 'INDIA VIX': 'INDIA VIX',
}

export const SYMBOL_LABELS = {
  ...INDEX_KEYS,
  'RELIANCE':'RELIANCE', 'TCS':'TCS', 'HDFCBANK':'HDFC BANK', 'INFY':'INFOSYS',
  'ICICIBANK':'ICICI BANK', 'HINDUNILVR':'HUL', 'SBIN':'SBI', 'BAJFINANCE':'BAJAJ FIN',
  'BHARTIARTL':'AIRTEL', 'KOTAKBANK':'KOTAK BANK', 'WIPRO':'WIPRO', 'HCLTECH':'HCL TECH',
  'AXISBANK':'AXIS BANK', 'LT':'L&T', 'ITC':'ITC', 'MARUTI':'MARUTI', 'TITAN':'TITAN',
  'TATAMOTORS':'TATA MOTORS', 'TATASTEEL':'TATA STEEL', 'ONGC':'ONGC', 'NTPC':'NTPC',
  'SUNPHARMA':'SUN PHARMA', 'ULTRACEMCO':'ULTRATECH', 'NESTLEIND':'NESTLE',
  'ASIANPAINT':'ASIAN PAINTS', 'POWERGRID':'POWER GRID', 'COALINDIA':'COAL INDIA',
  'ADANIENT':'ADANI ENT', 'ADANIPORTS':'ADANI PORTS',
}

export const DEFAULT_SYMBOLS = Object.keys(SYMBOL_LABELS)

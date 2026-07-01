/**
 * marketData.js
 * All market data goes through the TradePro backend proxy (/api/market/*)
 * which fetches from Yahoo Finance server-side (no CORS issues).
 *
 * Refresh: quotes every 5s, chart every 60s
 */

// Use the same base URL the rest of the app uses
const BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL          // e.g. https://tradepro-backend-erfj.onrender.com/api
  : '/api'                                 // Vercel proxy → Render

/* ─────────────────────────────────────────────────────────
   QUOTE FETCH  (via backend proxy)
───────────────────────────────────────────────────────── */
export async function fetchQuotes(symbols) {
  if (!symbols?.length) return {}

  const joined = symbols.join(',')
  const res = await fetch(`${BASE}/market/quotes?symbols=${encodeURIComponent(joined)}`)
  if (!res.ok) throw new Error(`Market proxy error: ${res.status}`)

  const json = await res.json()
  const result = {}

  for (const q of (json?.quoteResponse?.result || [])) {
    result[q.symbol] = {
      symbol:     q.symbol,
      shortName:  q.shortName || q.longName || q.symbol,
      price:      q.regularMarketPrice    ?? 0,
      change:     q.regularMarketChange   ?? 0,
      changePct:  q.regularMarketChangePercent ?? 0,
      open:       q.regularMarketOpen     ?? 0,
      high:       q.regularMarketDayHigh  ?? 0,
      low:        q.regularMarketDayLow   ?? 0,
      prevClose:  q.regularMarketPreviousClose ?? 0,
      volume:     q.regularMarketVolume   ?? 0,
      currency:   q.currency ?? 'INR',
      marketState: q.marketState ?? 'CLOSED',
      updatedAt:  Date.now(),
    }
  }
  return result
}

/* ─────────────────────────────────────────────────────────
   INTRADAY CHART  (via backend proxy, 5m candles)
───────────────────────────────────────────────────────── */
export async function fetchIntradayChart(symbol) {
  const res = await fetch(
    `${BASE}/market/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d`
  )
  if (!res.ok) throw new Error(`Chart proxy error: ${res.status}`)

  const json = await res.json()
  const chart = json?.chart?.result?.[0]
  if (!chart) return []

  const timestamps = chart.timestamp || []
  const closes     = chart.indicators?.quote?.[0]?.close || []

  return timestamps
    .map((ts, i) => {
      if (closes[i] == null) return null
      const d = new Date(ts * 1000)
      return {
        time:  `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`,
        value: Math.round(closes[i] * 100) / 100,
      }
    })
    .filter(Boolean)
}

/* ─────────────────────────────────────────────────────────
   MUTUAL FUND NAV  (mfapi.in — AMFI end-of-day, direct)
───────────────────────────────────────────────────────── */
const MF_BASE = 'https://api.mfapi.in/mf'

export async function fetchMFList() {
  const res = await fetch(MF_BASE)
  if (!res.ok) throw new Error(`MF list error: ${res.status}`)
  return res.json()
}

export async function fetchMFNav(schemeCode) {
  const res = await fetch(`${MF_BASE}/${schemeCode}`)
  if (!res.ok) throw new Error(`MF NAV error: ${res.status}`)
  const json = await res.json()
  const latest = json.data?.[0]
  return {
    schemeCode,
    schemeName:      json.meta?.scheme_name     || '',
    nav:             latest?.nav ? parseFloat(latest.nav) : null,
    date:            latest?.date || '',
    fundHouse:       json.meta?.fund_house       || '',
    schemeCategory:  json.meta?.scheme_category  || '',
    schemeType:      json.meta?.scheme_type      || '',
  }
}

/* ─────────────────────────────────────────────────────────
   SYMBOL CATALOGS
───────────────────────────────────────────────────────── */

export const INDICES = {
  '^NSEI':       'NIFTY 50',
  '^BSESN':      'SENSEX',
  '^NSEBANK':    'BANK NIFTY',
  '^CNXIT':      'NIFTY IT',
  '^CNXPHARMA':  'NIFTY Pharma',
  '^CNXFMCG':    'NIFTY FMCG',
  '^CNXAUTO':    'NIFTY Auto',
  '^CNXMETAL':   'NIFTY Metal',
  '^CNXREALTY':  'NIFTY Realty',
  '^NSMIDCP':    'NIFTY Midcap',
  '^CNXSMALLCAP':'NIFTY SmallCap',
  '^INDIAVIX':   'India VIX',
}

export const EQUITIES = {
  'RELIANCE.NS':   'RELIANCE',
  'TCS.NS':        'TCS',
  'HDFCBANK.NS':   'HDFC BANK',
  'INFY.NS':       'INFOSYS',
  'ICICIBANK.NS':  'ICICI BANK',
  'HINDUNILVR.NS': 'HUL',
  'SBIN.NS':       'SBI',
  'BAJFINANCE.NS': 'BAJAJ FIN',
  'BHARTIARTL.NS': 'AIRTEL',
  'KOTAKBANK.NS':  'KOTAK BANK',
  'WIPRO.NS':      'WIPRO',
  'HCLTECH.NS':    'HCL TECH',
  'AXISBANK.NS':   'AXIS BANK',
  'LT.NS':         'L&T',
  'ITC.NS':        'ITC',
  'ASIANPAINT.NS': 'ASIAN PAINTS',
  'MARUTI.NS':     'MARUTI',
  'SUNPHARMA.NS':  'SUN PHARMA',
  'TITAN.NS':      'TITAN',
  'ULTRACEMCO.NS': 'ULTRATECH',
  'NESTLEIND.NS':  'NESTLE',
  'POWERGRID.NS':  'POWER GRID',
  'NTPC.NS':       'NTPC',
  'ONGC.NS':       'ONGC',
  'COALINDIA.NS':  'COAL INDIA',
  'M&M.NS':        'M&M',
  'DRREDDY.NS':    'DR REDDY',
  'TATAMOTORS.NS': 'TATA MOTORS',
  'TATASTEEL.NS':  'TATA STEEL',
  'JSWSTEEL.NS':   'JSW STEEL',
}

export const ETFS = {
  'NIFTYBEES.NS':  'NIFTY BeES',
  'BANKBEES.NS':   'Bank BeES',
  'GOLDBEES.NS':   'Gold BeES',
  'SILVERBEES.NS': 'Silver BeES',
  'LIQUIDBEES.NS': 'Liquid BeES',
  'JUNIORBEES.NS': 'Junior BeES',
  'ITBEES.NS':     'IT BeES',
}

export const FNO = {
  '^INDIAVIX':    'India VIX',
  '^NSEI':        'NIFTY Spot',
  '^NSEBANK':     'BankNifty Spot',
  'NIFTYBEES.NS': 'NIFTY ETF',
  'BANKBEES.NS':  'BankNifty ETF',
}

export const COMMODITIES = {
  'GC=F':  'Gold Futures',
  'SI=F':  'Silver Futures',
  'PL=F':  'Platinum',
  'PA=F':  'Palladium',
  'CL=F':  'Crude Oil WTI',
  'BZ=F':  'Brent Crude',
  'NG=F':  'Natural Gas',
  'HG=F':  'Copper',
}

export const FOREX = {
  'USDINR=X': 'USD/INR',
  'EURINR=X': 'EUR/INR',
  'GBPINR=X': 'GBP/INR',
  'EURUSD=X': 'EUR/USD',
  'GBPUSD=X': 'GBP/USD',
  'USDJPY=X': 'USD/JPY',
}

export const CRYPTO = {
  'BTC-USD':  'Bitcoin',
  'ETH-USD':  'Ethereum',
  'BNB-USD':  'BNB',
  'SOL-USD':  'Solana',
  'XRP-USD':  'XRP',
  'ADA-USD':  'Cardano',
  'DOGE-USD': 'Dogecoin',
}

export const GLOBAL_INDICES = {
  '^GSPC': 'S&P 500',
  '^DJI':  'Dow Jones',
  '^IXIC': 'NASDAQ',
  '^FTSE': 'FTSE 100',
  '^N225': 'Nikkei 225',
  '^HSI':  'Hang Seng',
}

export const TOP_MF_CODES = [
  120503, 120716, 120837, 125354, 120823,
  118825, 120847, 120465, 119598, 120594,
  120578, 120492, 120505, 120828, 120600,
]

export const DEFAULT_SYMBOLS = [
  ...Object.keys(INDICES).slice(0, 4),
  ...Object.keys(EQUITIES).slice(0, 12),
  ...Object.keys(COMMODITIES).slice(0, 4),
  ...Object.keys(FOREX).slice(0, 3),
]

export const SYMBOL_LABELS = {
  ...INDICES, ...EQUITIES, ...ETFS,
  ...FNO, ...COMMODITIES, ...FOREX,
  ...CRYPTO, ...GLOBAL_INDICES,
}

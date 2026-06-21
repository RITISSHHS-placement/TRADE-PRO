/**
 * marketData.js
 * Fetches live Indian market data using Yahoo Finance query2 API (free, no key required).
 * Symbols use Yahoo Finance notation: RELIANCE.NS, ^NSEI (NIFTY 50), ^BSESN (SENSEX), etc.
 */

// Yahoo Finance v7/v8 via a CORS proxy (allorigins.win wraps the request)
// We use Yahoo Finance's quote endpoint directly — works from browser in most cases.
const YF_BASE = 'https://query1.finance.yahoo.com/v7/finance/quote'

/**
 * Fetch live quotes for a list of Yahoo Finance symbols.
 * @param {string[]} symbols  e.g. ['RELIANCE.NS', '^NSEI']
 * @returns {Promise<Record<string, QuoteData>>}
 */
export async function fetchQuotes(symbols) {
  if (!symbols || symbols.length === 0) return {}

  const joined = symbols.join(',')
  const url = `${YF_BASE}?symbols=${encodeURIComponent(joined)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume,regularMarketPreviousClose,shortName,longName,marketState`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Yahoo Finance error: ${res.status}`)

  const json = await res.json()
  const result = {}

  const quotes = json?.quoteResponse?.result || []
  for (const q of quotes) {
    result[q.symbol] = {
      symbol: q.symbol,
      shortName: q.shortName || q.longName || q.symbol,
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePct: q.regularMarketChangePercent ?? 0,
      open: q.regularMarketOpen ?? 0,
      high: q.regularMarketDayHigh ?? 0,
      low: q.regularMarketDayLow ?? 0,
      prevClose: q.regularMarketPreviousClose ?? 0,
      volume: q.regularMarketVolume ?? 0,
      marketState: q.marketState ?? 'CLOSED',
      updatedAt: Date.now(),
    }
  }

  return result
}

/**
 * Fetch historical intraday chart data for a symbol (last 1 day, 5-min intervals).
 * @param {string} symbol  e.g. '^NSEI'
 * @returns {Promise<Array<{time: string, value: number}>>}
 */
export async function fetchIntradayChart(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Chart fetch error: ${res.status}`)

  const json = await res.json()
  const chart = json?.chart?.result?.[0]
  if (!chart) return []

  const timestamps = chart.timestamp || []
  const closes = chart.indicators?.quote?.[0]?.close || []

  return timestamps
    .map((ts, i) => {
      if (closes[i] == null) return null
      const d = new Date(ts * 1000)
      const hh = d.getHours().toString().padStart(2, '0')
      const mm = d.getMinutes().toString().padStart(2, '0')
      return { time: `${hh}:${mm}`, value: Math.round(closes[i] * 100) / 100 }
    })
    .filter(Boolean)
}

// Default watchlist of Indian market symbols in Yahoo Finance notation
export const DEFAULT_SYMBOLS = [
  '^NSEI',        // NIFTY 50
  '^BSESN',       // SENSEX
  'RELIANCE.NS',
  'INFY.NS',
  'HDFCBANK.NS',
  'TCS.NS',
  'WIPRO.NS',
  'ICICIBANK.NS',
  'SBIN.NS',
  'BAJFINANCE.NS',
]

// Human-readable display names
export const SYMBOL_LABELS = {
  '^NSEI': 'NIFTY 50',
  '^BSESN': 'SENSEX',
  'RELIANCE.NS': 'RELIANCE',
  'INFY.NS': 'INFY',
  'HDFCBANK.NS': 'HDFC BANK',
  'TCS.NS': 'TCS',
  'WIPRO.NS': 'WIPRO',
  'ICICIBANK.NS': 'ICICI BANK',
  'SBIN.NS': 'SBI',
  'BAJFINANCE.NS': 'BAJAJ FIN',
}

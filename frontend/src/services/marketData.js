/**
 * marketData.js
 * All market data via Yahoo Finance (free, no key) + mfapi.in for mutual funds.
 *
 * Refresh rates:
 *  - Equities / ETFs / Indices / Commodities / Forex / Crypto: poll every 5s
 *  - Mutual Fund NAV: end-of-day from AMFI via mfapi.in, refresh once per session
 *  - F&O proxies (VIX, PCR ETFs, index futures ETFs): poll every 5s via Yahoo Finance
 */

const YF_BASE = 'https://query1.finance.yahoo.com/v7/finance/quote'
const YF_CHART = 'https://query1.finance.yahoo.com/v8/finance/chart'
const MF_BASE = 'https://api.mfapi.in/mf'

/* ─────────────────────────────────────────────────────────
   QUOTE FETCH  (Yahoo Finance)
───────────────────────────────────────────────────────── */
export async function fetchQuotes(symbols) {
  if (!symbols?.length) return {}
  const url = `${YF_BASE}?symbols=${encodeURIComponent(symbols.join(','))}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume,regularMarketPreviousClose,shortName,longName,marketState,currency`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`YF quote error: ${res.status}`)
  const json = await res.json()
  const result = {}
  for (const q of (json?.quoteResponse?.result || [])) {
    result[q.symbol] = {
      symbol:     q.symbol,
      shortName:  q.shortName || q.longName || q.symbol,
      price:      q.regularMarketPrice ?? 0,
      change:     q.regularMarketChange ?? 0,
      changePct:  q.regularMarketChangePercent ?? 0,
      open:       q.regularMarketOpen ?? 0,
      high:       q.regularMarketDayHigh ?? 0,
      low:        q.regularMarketDayLow ?? 0,
      prevClose:  q.regularMarketPreviousClose ?? 0,
      volume:     q.regularMarketVolume ?? 0,
      currency:   q.currency ?? 'INR',
      marketState: q.marketState ?? 'CLOSED',
      updatedAt:  Date.now(),
    }
  }
  return result
}

/* ─────────────────────────────────────────────────────────
   INTRADAY CHART  (Yahoo Finance, 5m candles, 1d range)
───────────────────────────────────────────────────────── */
export async function fetchIntradayChart(symbol) {
  const url = `${YF_CHART}/${encodeURIComponent(symbol)}?interval=5m&range=1d`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`YF chart error: ${res.status}`)
  const json = await res.json()
  const chart = json?.chart?.result?.[0]
  if (!chart) return []
  const timestamps = chart.timestamp || []
  const closes = chart.indicators?.quote?.[0]?.close || []
  return timestamps
    .map((ts, i) => {
      if (closes[i] == null) return null
      const d = new Date(ts * 1000)
      return {
        time: `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`,
        value: Math.round(closes[i] * 100) / 100,
      }
    })
    .filter(Boolean)
}

/* ─────────────────────────────────────────────────────────
   MUTUAL FUND NAV  (mfapi.in — AMFI end-of-day)
   Returns top N schemes sorted by scheme code for display.
───────────────────────────────────────────────────────── */
export async function fetchMFList() {
  const res = await fetch(`${MF_BASE}`)
  if (!res.ok) throw new Error(`MF list error: ${res.status}`)
  return res.json()  // [{schemeCode, schemeName, isinGrowth, isinDivReinvestment}]
}

export async function fetchMFNav(schemeCode) {
  const res = await fetch(`${MF_BASE}/${schemeCode}`)
  if (!res.ok) throw new Error(`MF NAV error: ${res.status}`)
  const json = await res.json()
  const latest = json.data?.[0]
  return {
    schemeCode,
    schemeName: json.meta?.scheme_name || '',
    nav: latest?.nav ? parseFloat(latest.nav) : null,
    date: latest?.date || '',
    fundHouse: json.meta?.fund_house || '',
    schemeCategory: json.meta?.scheme_category || '',
    schemeType: json.meta?.scheme_type || '',
  }
}

/* ─────────────────────────────────────────────────────────
   SYMBOL CATALOGS
───────────────────────────────────────────────────────── */

// ── Indian Indices
export const INDICES = {
  '^NSEI':     'NIFTY 50',
  '^BSESN':    'SENSEX',
  '^NSEBANK':  'BANK NIFTY',
  '^CNXIT':    'NIFTY IT',
  '^CNXPHARMA':'NIFTY Pharma',
  '^CNXFMCG':  'NIFTY FMCG',
  '^CNXAUTO':  'NIFTY Auto',
  '^CNXMETAL': 'NIFTY Metal',
  '^CNXREALTY':'NIFTY Realty',
  '^NSMIDCP':  'NIFTY Midcap',
  '^CNXSMALLCAP':'NIFTY SmallCap',
  '^INDIAVIX': 'India VIX',
}

// ── Top NSE Equities (Nifty 50 stocks)
export const EQUITIES = {
  'RELIANCE.NS':    'RELIANCE',
  'TCS.NS':         'TCS',
  'HDFCBANK.NS':    'HDFC BANK',
  'INFY.NS':        'INFOSYS',
  'ICICIBANK.NS':   'ICICI BANK',
  'HINDUNILVR.NS':  'HUL',
  'SBIN.NS':        'SBI',
  'BAJFINANCE.NS':  'BAJAJ FIN',
  'BHARTIARTL.NS':  'AIRTEL',
  'KOTAKBANK.NS':   'KOTAK BANK',
  'WIPRO.NS':       'WIPRO',
  'HCLTECH.NS':     'HCL TECH',
  'AXISBANK.NS':    'AXIS BANK',
  'LT.NS':          'L&T',
  'ITC.NS':         'ITC',
  'ASIANPAINT.NS':  'ASIAN PAINTS',
  'MARUTI.NS':      'MARUTI',
  'SUNPHARMA.NS':   'SUN PHARMA',
  'TITAN.NS':       'TITAN',
  'ULTRACEMCO.NS':  'ULTRATECH',
  'NESTLEIND.NS':   'NESTLE',
  'POWERGRID.NS':   'POWER GRID',
  'NTPC.NS':        'NTPC',
  'ONGC.NS':        'ONGC',
  'COALINDIA.NS':   'COAL INDIA',
  'M&M.NS':         'M&M',
  'DRREDDY.NS':     'DR REDDY',
  'DIVISLAB.NS':    'DIVI\'S LAB',
  'CIPLA.NS':       'CIPLA',
  'EICHERMOT.NS':   'EICHER MOT',
  'BAJAJ-AUTO.NS':  'BAJAJ AUTO',
  'HEROMOTOCO.NS':  'HERO MOTO',
  'TATAMOTORS.NS':  'TATA MOTORS',
  'TATASTEEL.NS':   'TATA STEEL',
  'JSWSTEEL.NS':    'JSW STEEL',
  'HINDALCO.NS':    'HINDALCO',
  'TECHM.NS':       'TECH M',
  'INDUSINDBK.NS':  'INDUSIND',
  'GRASIM.NS':      'GRASIM',
  'ADANIENT.NS':    'ADANI ENT',
  'ADANIPORTS.NS':  'ADANI PORTS',
  'BPCL.NS':        'BPCL',
  'BRITANNIA.NS':   'BRITANNIA',
  'APOLLOHOSP.NS':  'APOLLO HOSP',
  'TATACONSUM.NS':  'TATA CONS',
  'SBILIFE.NS':     'SBI LIFE',
  'HDFCLIFE.NS':    'HDFC LIFE',
  'BAJAJFINSV.NS':  'BAJAJ FINSERV',
}

// ── ETFs (NSE-listed)
export const ETFS = {
  'NIFTYBEES.NS':   'NIFTY BeES',
  'BANKBEES.NS':    'Bank BeES',
  'GOLDBEES.NS':    'Gold BeES',
  'SILVERBEES.NS':  'Silver BeES',
  'JUNIORBEES.NS':  'Junior BeES',
  'LIQUIDBEES.NS':  'Liquid BeES',
  'ICICIB22.NS':    'ICICI Bharat Bond',
  'MOM100.NS':      'Motilal MOМ100',
  'ITBEES.NS':      'IT BeES',
  'PHARMABEES.NS':  'Pharma BeES',
  'SETFNIF50.NS':   'SBI ETF Nifty',
  'KOTAKGOLD.NS':   'Kotak Gold ETF',
  'HDFCGOLD.NS':    'HDFC Gold ETF',
  'AXISGOLD.NS':    'Axis Gold ETF',
  'ICICIPHD.NS':    'ICICI Nifty100',
  'NIFTYQLITY.NS':  'Nifty Quality',
}

// ── F&O Proxies (Index ETFs, VIX, leveraged products available on exchanges)
// True F&O real-time requires NSE API subscription; we show best-effort proxies.
export const FNO = {
  '^INDIAVIX':    'India VIX',
  '^NSEI':        'NIFTY Spot',
  '^NSEBANK':     'BankNifty Spot',
  'NIFTYBEES.NS': 'NIFTY ETF (F&O proxy)',
  'BANKBEES.NS':  'BankNifty ETF',
  'JUNIORBEES.NS':'Nifty Next50 ETF',
  'ITBEES.NS':    'Nifty IT ETF',
  'CPSE.NS':      'CPSE ETF',
}

// ── Commodities (MCX via Yahoo Finance — ~15min delayed per exchange rules)
export const COMMODITIES = {
  'GC=F':       'Gold Futures (USD)',
  'SI=F':       'Silver Futures (USD)',
  'PL=F':       'Platinum (USD)',
  'PA=F':       'Palladium (USD)',
  'CL=F':       'Crude Oil WTI',
  'BZ=F':       'Brent Crude',
  'NG=F':       'Natural Gas',
  'HG=F':       'Copper',
  'ZC=F':       'Corn',
  'ZW=F':       'Wheat',
  // MCX India proxies (delayed)
  'GOLDBEES.NS':   'MCX Gold (ETF proxy)',
  'SILVERBEES.NS': 'MCX Silver (ETF proxy)',
  'KOTAKGOLD.NS':  'Kotak Gold ETF',
}

// ── Forex
export const FOREX = {
  'USDINR=X':  'USD/INR',
  'EURINR=X':  'EUR/INR',
  'GBPINR=X':  'GBP/INR',
  'JPYINR=X':  'JPY/INR',
  'CHFINR=X':  'CHF/INR',
  'AUDINR=X':  'AUD/INR',
  'CADINR=X':  'CAD/INR',
  'EURUSD=X':  'EUR/USD',
  'GBPUSD=X':  'GBP/USD',
  'USDJPY=X':  'USD/JPY',
}

// ── Crypto
export const CRYPTO = {
  'BTC-USD':  'Bitcoin',
  'ETH-USD':  'Ethereum',
  'BNB-USD':  'BNB',
  'SOL-USD':  'Solana',
  'XRP-USD':  'XRP',
  'ADA-USD':  'Cardano',
  'DOGE-USD': 'Dogecoin',
  'MATIC-USD':'Polygon',
  'DOT-USD':  'Polkadot',
  'AVAX-USD': 'Avalanche',
}

// ── Global Indices
export const GLOBAL_INDICES = {
  '^GSPC':   'S&P 500',
  '^DJI':    'Dow Jones',
  '^IXIC':   'NASDAQ',
  '^FTSE':   'FTSE 100',
  '^GDAXI':  'DAX',
  '^N225':   'Nikkei 225',
  '^HSI':    'Hang Seng',
  '000001.SS':'Shanghai',
  '^AXJO':   'ASX 200',
}

// ── Popular Mutual Fund scheme codes from mfapi.in (hand-picked top schemes)
export const TOP_MF_CODES = [
  120503, // Mirae Asset Large Cap Fund – Direct Growth
  120716, // Axis Bluechip Fund – Direct Growth
  120837, // SBI Bluechip Fund – Direct Growth
  125354, // Parag Parikh Flexi Cap – Direct Growth
  120823, // Mirae Asset Emerging Bluechip – Direct Growth
  118825, // Axis Midcap Fund – Direct Growth
  120847, // HDFC Mid-Cap Opportunities – Direct Growth
  120465, // ICICI Pru Bluechip – Direct Growth
  119598, // Kotak Emerging Equity – Direct Growth
  120594, // DSP Midcap Fund – Direct Growth
  120578, // Franklin India Prima – Direct Growth
  120492, // Nippon India Small Cap – Direct Growth
  120505, // Axis Small Cap Fund – Direct Growth
  120828, // SBI Small Cap Fund – Direct Growth
  120600, // HDFC Small Cap Fund – Direct Growth
  118989, // HDFC Flexi Cap Fund – Direct Growth
  120586, // Franklin India Flexi Cap – Direct Growth
  120840, // SBI Flexi Cap Fund – Direct Growth
  120831, // SBI Contra Fund – Direct Growth
  120519, // Nippon India Pharma Fund – Direct Growth
  120841, // SBI Healthcare Opportunities – Direct Growth
  120703, // Axis Consumption Fund – Direct Growth
  118551, // UTI Nifty Index Fund – Direct Growth
  120716, // Axis Bluechip – Direct Growth
  120503, // Mirae Asset Large Cap – Direct Growth
]

// All symbols for default polling
export const DEFAULT_SYMBOLS = [
  ...Object.keys(INDICES),
  ...Object.keys(EQUITIES).slice(0, 15),
  ...Object.keys(COMMODITIES),
  ...Object.keys(FOREX).slice(0, 5),
]

// Combined label lookup
export const SYMBOL_LABELS = {
  ...INDICES,
  ...EQUITIES,
  ...ETFS,
  ...FNO,
  ...COMMODITIES,
  ...FOREX,
  ...CRYPTO,
  ...GLOBAL_INDICES,
}

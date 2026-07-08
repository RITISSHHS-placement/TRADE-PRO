/**
 * Vercel Edge Function — proxies NSE India public API endpoints that work without session cookies.
 *
 * Supported endpoints:
 *  ?endpoint=allIndices   → /api/allIndices       (all 139 NSE indices — NIFTY, BANK NIFTY, VIX etc.)
 *  ?endpoint=marketStatus → /api/marketStatus      (market open/close + key index prices)
 *  ?endpoint=gainers      → live-analysis-variations?index=gainers
 *  ?endpoint=losers       → live-analysis-variations?index=loosers
 *  ?endpoint=mostactive   → live-analysis-variations?index=mostactivesecurities
 */
export const config = { runtime: 'edge' }

const NSE = 'https://www.nseindia.com/api'

const PATHS = {
  allIndices:   'allIndices',
  marketStatus: 'marketStatus',
  gainers:      'live-analysis-variations?index=gainers',
  losers:       'live-analysis-variations?index=loosers',
  mostactive:   'live-analysis-variations?index=mostactivesecurities',
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const ep   = searchParams.get('endpoint') || 'allIndices'
  const path = PATHS[ep]

  if (!path) {
    return new Response(JSON.stringify({ error: `Unknown endpoint: ${ep}` }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const res = await fetch(`${NSE}/${path}`, {
      headers: {
        'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept':          'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer':         'https://www.nseindia.com/',
        'Origin':          'https://www.nseindia.com',
        'sec-fetch-dest':  'empty',
        'sec-fetch-mode':  'cors',
        'sec-fetch-site':  'same-origin',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) throw new Error(`NSE returned ${res.status}`)
    const text = await res.text()

    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type':                'application/json',
        'Cache-Control':               'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}

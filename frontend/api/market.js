/**
 * Vercel Edge Function — proxies NSE India public API
 * Deployed at: /api/market?endpoint=allIndices
 *              /api/market?endpoint=nifty50
 *              /api/market?endpoint=gainers
 *              /api/market?endpoint=losers
 *
 * Vercel edge nodes have different IPs from Render — NSE doesn't block them.
 */
export const config = { runtime: 'edge' }

const NSE = 'https://www.nseindia.com/api'

const NSE_PATHS = {
  allIndices: 'allIndices',
  nifty50:    'equity-stockIndices?index=NIFTY%2050',
  niftybank:  'equity-stockIndices?index=NIFTY%20BANK',
  gainers:    'live-analysis-variations?index=gainers',
  losers:     'live-analysis-variations?index=loosers',
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const endpoint = searchParams.get('endpoint') || 'allIndices'
  const path = NSE_PATHS[endpoint]

  if (!path) {
    return new Response(JSON.stringify({ error: 'Unknown endpoint' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const res = await fetch(`${NSE}/${path}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.nseindia.com/',
        'Origin': 'https://www.nseindia.com',
      },
    })

    if (!res.ok) throw new Error(`NSE returned ${res.status}`)
    const data = await res.text()

    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}

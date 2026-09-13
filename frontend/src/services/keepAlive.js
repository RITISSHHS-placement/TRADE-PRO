/**
 * keepAlive — Aggressive keep-alive system for Render free tier.
 *
 * Render sleeps services after ~15 min of inactivity.
 * This system:
 * 1. Pings every 8 minutes (safely under the 15-min threshold)
 * 2. Uses multiple redundant endpoints so one failure doesn't matter
 * 3. Keeps pinging even when tab is in background (via timer)
 * 4. Also fires on visibility change (user returns to tab)
 * 5. Logs status for debugging
 *
 * External keep-alive (UptimeRobot / cron-job.org) provides
 * a second layer of protection when no users are online.
 */

const BACKEND_URL = import.meta.env.VITE_API_URL || '/backend'
const DIRECT_BACKEND = 'https://tradepro-backend-erfj.onrender.com'
const ENDPOINTS = [
  `${BACKEND_URL}/health`,         // /backend/health → Vercel rewrites to /api/health
  `${BACKEND_URL}/health/ping`,    // lightweight ping via Vercel proxy
  `${DIRECT_BACKEND}/api/health`,  // Direct backend URL (fallback if Vercel is down)
]
const PING_INTERVAL_MS = 8 * 60 * 1000   // 8 minutes (safely under Render's 15-min sleep)
const PING_TIMEOUT_MS  = 15_000            // 15s per ping (cold starts can be slow)

let timerId = null
let pingCount = 0

async function pingEndpoint(url) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS)
    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { 'X-Keep-Alive': 'true' },
    })
    clearTimeout(timeoutId)
    return { ok: res.ok, status: res.status }
  } catch {
    return { ok: false, status: 0 }
  }
}

async function ping() {
  pingCount++
  // Try all endpoints concurrently — at least one should work
  const results = await Promise.allSettled(
    ENDPOINTS.map(ep => pingEndpoint(ep))
  )
  const anyOk = results.some(r => r.status === 'fulfilled' && r.value?.ok)
  if (anyOk) {
    console.debug(`[keepAlive] #${pingCount} ✓`)
  } else {
    console.warn(`[keepAlive] #${pingCount} ✗ all endpoints failed`)
  }
}

/**
 * Start the keep-alive loop. Safe to call multiple times.
 * Pings immediately on start, then every 10 minutes.
 */
export function startKeepAlive() {
  if (timerId) return
  // Initial ping
  ping()
  // Recurring ping — use setInterval which fires even if tab was backgrounded
  // (browsers may throttle to 1min minimum in background, but 10min interval is fine)
  timerId = setInterval(ping, PING_INTERVAL_MS)
  // Also use visibilitychange to re-ping when user returns to tab
  // This ensures we ping even if the browser throttled the timer
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // User came back to tab — fire an immediate ping
        ping()
      }
    })
  }
  console.debug('[keepAlive] started — pinging every 10 min')
}

export function stopKeepAlive() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
    console.debug('[keepAlive] stopped')
  }
}

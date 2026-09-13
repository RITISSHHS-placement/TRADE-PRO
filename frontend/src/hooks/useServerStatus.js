/**
 * useServerStatus — polls the backend health endpoint and reports
 * whether the server is awake, waking up (cold start), or down.
 *
 * Used in the LoginPage to show a friendly "Server is starting up..."
 * banner instead of confusing users with a generic error during
 * the Render free tier 30-60s cold start.
 *
 * v2 — smarter retry: polls more aggressively at start, backs off,
 * and exposes a realistic ETA based on the median cold-start time.
 */
import { useState, useEffect, useRef, useCallback } from 'react'

const HEALTH_URL = '/backend/health'
const TIMEOUT_MS = 6_000

// Typical Render free-tier cold start: 20-45s.
// Median / expected value for the progress bar ETA.
const EXPECTED_COLD_START_S = 30

// Poll schedule while waking (in ms)
const RETRY_SCHEDULE = [2000, 3000, 4000, 5000, 5000]   // first few retries fast
const RETRY_BACKOFF   = 6000                             // then back off

// Once awake, re-check every 5 min (keep-alive pings every 14 min)
const HEALTHY_POLL_MS = 5 * 60 * 1000

export function useServerStatus() {
  const [status, setStatus]   = useState('unknown')   // unknown | up | waking | down
  const [wakeElapsed, setWakeElapsed] = useState(0)
  const timerRef  = useRef(null)
  const tickRef   = useRef(null)
  const retryIdx  = useRef(0)
  const wakeStart = useRef(null)
  const mountedRef = useRef(true)

  // ── Health check ──────────────────────────────────────────────
  const check = useCallback(async () => {
    if (!mountedRef.current) return
    try {
      const res = await fetch(HEALTH_URL, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: 'no-store',
      })
      if (res.ok) {
        // ── Server is up ──
        setStatus('up')
        wakeStart.current = null
        setWakeElapsed(0)
        stopTick()
        retryIdx.current = 0
        scheduleNext(HEALTHY_POLL_MS)
      } else {
        markWaking()
      }
    } catch {
      markWaking()
    }
  }, [])

  // ── Mark as waking & schedule next retry ─────────────────────
  const markWaking = useCallback(() => {
    setStatus(prev => {
      // First transition into waking — start the elapsed timer
      if ((prev === 'unknown' || prev === 'up') && !wakeStart.current) {
        wakeStart.current = Date.now()
        startTick()
      }
      return prev === 'up' ? 'waking' : prev === 'unknown' ? 'waking' : prev
    })
    const idx  = retryIdx.current++
    const base = idx < RETRY_SCHEDULE.length
      ? RETRY_SCHEDULE[idx]
      : RETRY_BACKOFF
    // Small jitter so multiple tabs don't hammer in lockstep
    const jitter = Math.random() * 800
    scheduleNext(base + jitter)
  }, [])

  // ── Helpers ───────────────────────────────────────────────────
  function scheduleNext(ms) {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(check, ms)
  }

  function startTick() {
    if (tickRef.current) return
    tickRef.current = setInterval(() => {
      if (!wakeStart.current) return
      setWakeElapsed(Math.floor((Date.now() - wakeStart.current) / 1000))
    }, 1000)
  }

  function stopTick() {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
  }

  // ── Mount / unmount ──────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true
    check()  // initial check
    return () => {
      mountedRef.current = false
      clearTimeout(timerRef.current)
      stopTick()
    }
  }, [check])

  const isWaking = status === 'waking'
  const isDown   = status === 'down'
  const isUp     = status === 'up'

  // ETA: use a smooth curve that starts fast, then slows as it approaches the expected value
  // At 0s → 0%, at 15s → ~40%, at 30s → ~70%, at 45s → ~95%
  const etaProgress = isWaking
    ? Math.min(100, 100 * (1 - Math.exp(-wakeElapsed / (EXPECTED_COLD_START_S * 0.6))))
    : 0

  return { status, isUp, isWaking, isDown, wakeElapsed, etaProgress }
}

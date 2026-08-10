/**
 * useServerStatus — polls the backend health endpoint and reports
 * whether the server is awake, waking up (cold start), or down.
 *
 * Used in the LoginPage to show a friendly "Server is starting up..."
 * banner instead of confusing users with a generic error during
 * the Render free tier 30-60s cold start.
 */
import { useState, useEffect, useRef } from 'react'

const HEALTH_URL = '/backend/actuator/health'
const POLL_INTERVAL_SLEEPING   = 5000   // poll every 5s when server is down
const POLL_INTERVAL_AWAKE      = 60000  // poll every 60s when server is up

export function useServerStatus() {
  const [status, setStatus] = useState('unknown') // 'unknown' | 'up' | 'waking' | 'down'
  const [wakeStartTime, setWakeStartTime] = useState(null)
  const [wakeElapsed, setWakeElapsed] = useState(0)
  const timerRef = useRef(null)
  const elapsedRef = useRef(null)

  const check = async () => {
    try {
      const res = await fetch(HEALTH_URL, {
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        setStatus('up')
        setWakeStartTime(null)
        setWakeElapsed(0)
        if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null }
        // Re-schedule at slower rate
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(check, POLL_INTERVAL_AWAKE)
      } else {
        markWaking()
      }
    } catch {
      markWaking()
    }
  }

  const markWaking = () => {
    setStatus(prev => {
      if (prev === 'unknown' || prev === 'up') {
        // Just went down — start wake timer
        setWakeStartTime(Date.now())
        if (!elapsedRef.current) {
          elapsedRef.current = setInterval(() => {
            setWakeElapsed(e => e + 1)
          }, 1000)
        }
        return 'waking'
      }
      if (prev === 'waking') return 'waking'
      return 'down'
    })
    // Retry quickly
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(check, POLL_INTERVAL_SLEEPING)
  }

  useEffect(() => {
    check()
    return () => {
      clearTimeout(timerRef.current)
      clearInterval(elapsedRef.current)
    }
  }, [])

  const isWaking = status === 'waking'
  const isDown   = status === 'down'
  const isUp     = status === 'up'

  return { status, isUp, isWaking, isDown, wakeElapsed }
}

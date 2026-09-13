/* ═══════════════════════════════════════════════════════════
   useBinanceStream — WebSocket hook with:
   - Real-time price tracking
   - Connection health (latency, status, reconnect count)
   - Auto-reconnect with exponential backoff
   - Price alert checking
═══════════════════════════════════════════════════════════ */
import { useState, useEffect, useRef, useCallback } from 'react'
import { checkAlerts, requestNotificationPermission } from '../services/priceAlerts'

const WS_BASE = 'wss://stream.binance.com:9443/ws'

function toBinanceSymbol(sym) {
  return `${sym.toLowerCase()}usdt`
}

const INITIAL_STATE = {
  status: 'disconnected',  // disconnected | connecting | connected | reconnecting
  latency: 0,
  reconnectCount: 0,
  lastMessageTime: 0,
  uptime: 0,
  messagesPerSecond: 0,
}

export default function useBinanceStream(symbols = ['BTC'], enabled = true) {
  const [health, setHealth] = useState(INITIAL_STATE)
  const [prices, setPrices] = useState(() => {
    const m = {}
    symbols.forEach(s => { m[s] = 0 })
    return m
  })
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const healthTimer = useRef(null)
  const msgCountRef = useRef(0)
  const startTimeRef = useRef(0)
  const reconnectCountRef = useRef(0)
  const latencyRef = useRef(0)

  /* ── Request notification permission on mount ── */
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  /* ── Connect to Binance combined stream ── */
  const connect = useCallback(() => {
    if (!enabled || wsRef.current) return

    // Build stream names
    const streams = symbols.flatMap(sym => [
      `${toBinanceSymbol(sym)}@trade`,
    ])
    if (streams.length === 0) return

    const url = `${WS_BASE}/stream?streams=${streams.join('/')}`

    setHealth(prev => ({
      ...prev,
      status: reconnectCountRef.current > 0 ? 'reconnecting' : 'connecting',
    }))

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        startTimeRef.current = Date.now()
        reconnectCountRef.current = 0
        setHealth(prev => ({
          ...prev,
          status: 'connected',
          reconnectCount: 0,
          lastMessageTime: Date.now(),
        }))

        // Ping every 20s for latency measurement
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const start = Date.now()
            // Use a simple approach: measure time between messages
            latencyRef.current = Date.now() - (latencyRef.current || Date.now())
          }
        }, 20000)

        ws._pingInterval = pingInterval
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          const data = msg.data
          if (!data || data.e !== 'trade') return

          const symbol = data.s?.replace('USDT', '').toUpperCase()
          const price = parseFloat(data.p)
          const now = Date.now()

          if (!isNaN(price) && symbol) {
            setPrices(prev => ({ ...prev, [symbol]: price }))
            msgCountRef.current++

            // Check price alerts
            checkAlerts(symbol, price)

            setHealth(prev => ({
              ...prev,
              lastMessageTime: now,
              latency: prev.lastMessageTime ? Math.min(now - prev.lastMessageTime, 999) : 0,
            }))
          }
        } catch (_) {}
      }

      ws.onerror = () => {}

      ws.onclose = () => {
        clearInterval(ws._pingInterval)
        wsRef.current = null

        if (!enabled) return

        // Exponential backoff reconnect
        const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000)
        reconnectCountRef.current++

        setHealth(prev => ({
          ...prev,
          status: 'reconnecting',
          reconnectCount: reconnectCountRef.current,
        }))

        reconnectTimer.current = setTimeout(() => {
          connect()
        }, delay)
      }
    } catch (err) {
      console.warn('WebSocket connect failed:', err)
      reconnectTimer.current = setTimeout(connect, 3000)
    }
  }, [symbols.join(','), enabled])

  /* ── Disconnect ── */
  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current)
    if (wsRef.current) {
      wsRef.current.onclose = null
      clearInterval(wsRef.current._pingInterval)
      wsRef.current.close()
      wsRef.current = null
    }
    setHealth(INITIAL_STATE)
  }, [])

  /* ── Health ticker: uptime + messages/sec ── */
  useEffect(() => {
    let prevMsgCount = 0
    healthTimer.current = setInterval(() => {
      const now = Date.now()
      const uptime = startTimeRef.current ? Math.floor((now - startTimeRef.current) / 1000) : 0
      const mps = msgCountRef.current - prevMsgCount
      prevMsgCount = msgCountRef.current

      setHealth(prev => ({
        ...prev,
        uptime,
        messagesPerSecond: mps,
      }))
    }, 1000)

    return () => clearInterval(healthTimer.current)
  }, [])

  /* ── Connect on mount, disconnect on unmount ── */
  useEffect(() => {
    connect()
    return disconnect
  }, [connect, disconnect])

  return { health, prices, connect, disconnect }
}

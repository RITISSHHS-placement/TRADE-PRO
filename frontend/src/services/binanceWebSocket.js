/* ═══════════════════════════════════════════════════════════
   Binance Public WebSocket + REST API Service
   Real-time crypto prices, order book, klines, trades
═══════════════════════════════════════════════════════════ */

const WS_BASE = 'wss://stream.binance.com:9443/ws'
const REST_BASE = 'https://api.binance.com/api/v3'

// Map our symbol pairs to Binance stream names
const toBinanceSymbol = (sym) => `${sym.toLowerCase()}usdt`

/* ── Fetch historical kline (candlestick) data ── */
export async function fetchKlines(symbol, interval = '1d', limit = 365) {
  try {
    const url = `${REST_BASE}/klines?symbol=${toBinanceSymbol(symbol)}&interval=${interval}&limit=${limit}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.map(k => ({
      time: new Date(k[0]).toISOString().split('T')[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }))
  } catch (err) {
    console.warn('Binance klines fetch failed:', err.message)
    return null
  }
}

/* ── Fetch current ticker (24h stats) ── */
export async function fetchTicker(symbol) {
  try {
    const url = `${REST_BASE}/ticker/24hr?symbol=${toBinanceSymbol(symbol)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return {
      price: parseFloat(data.lastPrice),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      volume24h: parseFloat(data.quoteVolume),
      change24h: parseFloat(data.priceChangePercent),
    }
  } catch (err) {
    console.warn('Binance ticker fetch failed:', err.message)
    return null
  }
}

/* ── Fetch order book depth ── */
export async function fetchDepth(symbol, limit = 20) {
  try {
    const url = `${REST_BASE}/depth?symbol=${toBinanceSymbol(symbol)}&limit=${limit}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return {
      asks: data.asks.map(([price, amount]) => ({
        price: parseFloat(price),
        amount: parseFloat(amount),
        total: parseFloat(price) * parseFloat(amount),
      })).reverse(),
      bids: data.bids.map(([price, amount]) => ({
        price: parseFloat(price),
        amount: parseFloat(amount),
        total: parseFloat(price) * parseFloat(amount),
      })),
    }
  } catch (err) {
    console.warn('Binance depth fetch failed:', err.message)
    return null
  }
}

/* ── Fetch recent trades ── */
export async function fetchRecentTrades(symbol, limit = 20) {
  try {
    const url = `${REST_BASE}/trades?symbol=${toBinanceSymbol(symbol)}&limit=${limit}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.map(t => ({
      time: new Date(t.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price: parseFloat(t.price),
      amount: parseFloat(t.qty),
      side: t.isBuyerMaker ? 'sell' : 'buy',
    }))
  } catch (err) {
    console.warn('Binance trades fetch failed:', err.message)
    return null
  }
}

/* ── Create a Binance combined WebSocket stream ── */
export function createBinanceStream(symbols, callbacks) {
  // Streams: trade + depth10 for each symbol
  const streams = symbols.flatMap(sym => [
    `${toBinanceSymbol(sym)}@trade`,
    `${toBinanceSymbol(sym)}@depth10@100ms`,
  ])
  const streamUrl = `${WS_BASE}/stream?streams=${streams.join('/')}`

  let ws = null
  let reconnectTimer = null
  let heartbeatTimer = null

  const connect = () => {
    try {
      ws = new WebSocket(streamUrl)
    } catch (err) {
      console.warn('WebSocket connection failed:', err)
      scheduleReconnect()
      return
    }

    ws.onopen = () => {
      callbacks.onOpen?.()
      // Ping every 30s to keep alive
      heartbeatTimer = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ ping: Date.now() }))
        }
      }, 30000)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        const data = msg.data
        if (!data) return

        if (data.e === 'trade') {
          // Trade stream: real-time last trade
          callbacks.onTrade?.({
            symbol: data.s,          // e.g. "BTCUSDT"
            price: parseFloat(data.p),
            amount: parseFloat(data.q),
            time: data.T,
            isBuy: !data.m,          // m = maker (true = sell)
          })
        } else if (data.e === 'depthUpdate') {
          // Depth stream: order book snapshot
          callbacks.onDepth?.({
            symbol: data.s,
            asks: (data.asks || []).map(([p, a]) => ({
              price: parseFloat(p),
              amount: parseFloat(a),
              total: parseFloat(p) * parseFloat(a),
            })).reverse(),
            bids: (data.bids || []).map(([p, a]) => ({
              price: parseFloat(p),
              amount: parseFloat(a),
              total: parseFloat(p) * parseFloat(a),
            })),
          })
        } else if (data.lastUpdateId) {
          // Partial depth response
          callbacks.onDepth?.({
            symbol: '',
            asks: (data.asks || []).map(([p, a]) => ({
              price: parseFloat(p),
              amount: parseFloat(a),
              total: parseFloat(p) * parseFloat(a),
            })).reverse(),
            bids: (data.bids || []).map(([p, a]) => ({
              price: parseFloat(p),
              amount: parseFloat(a),
              total: parseFloat(p) * parseFloat(a),
            })),
          })
        }
      } catch (_) {}
    }

    ws.onerror = () => {
      callbacks.onError?.()
    }

    ws.onclose = () => {
      callbacks.onClose?.()
      clearInterval(heartbeatTimer)
      scheduleReconnect()
    }
  }

  const scheduleReconnect = () => {
    reconnectTimer = setTimeout(connect, 3000)
  }

  const disconnect = () => {
    clearTimeout(reconnectTimer)
    clearInterval(heartbeatTimer)
    if (ws) {
      ws.onclose = null // prevent reconnect
      ws.close()
      ws = null
    }
  }

  connect()

  return { disconnect, ws: () => ws }
}

/* ── Simple single-symbol trade stream (lightweight) ── */
export function createTradeStream(symbol, onPrice) {
  const streamName = `${toBinanceSymbol(symbol)}@trade`
  const url = `${WS_BASE}/${streamName}`

  let ws = null
  let reconnectTimer = null

  const connect = () => {
    try {
      ws = new WebSocket(url)
    } catch (_) {
      reconnectTimer = setTimeout(connect, 3000)
      return
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onPrice({
          price: parseFloat(data.p),
          time: data.T,
          amount: parseFloat(data.q),
        })
      } catch (_) {}
    }

    ws.onerror = () => {}
    ws.onclose = () => { reconnectTimer = setTimeout(connect, 3000) }
  }

  const disconnect = () => {
    clearTimeout(reconnectTimer)
    if (ws) { ws.onclose = null; ws.close(); ws = null }
  }

  connect()
  return { disconnect }
}

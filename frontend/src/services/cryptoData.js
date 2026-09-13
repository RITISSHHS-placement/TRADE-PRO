/* ═══════════════════════════════════════════════════════════
   Crypto Data Service — Real-time crypto pairs, prices,
   order book, recent trades for the exchange page
═══════════════════════════════════════════════════════════ */

// Crypto pairs with base prices
export const CRYPTO_PAIRS = [
  { sym: 'BTC',   name: 'Bitcoin',     base: 77662,  pair: 'BTC/USDT',  icon: '₿',  color: '#f7931a' },
  { sym: 'ETH',   name: 'Ethereum',    base: 3428,   pair: 'ETH/USDT',  icon: 'Ξ',  color: '#627eea' },
  { sym: 'XRP',   name: 'Ripple',      base: 2.14,   pair: 'XRP/USDT',  icon: 'X',  color: '#23292f' },
  { sym: 'BNB',   name: 'BNB',         base: 612,    pair: 'BNB/USDT',  icon: 'B',  color: '#f3ba2f' },
  { sym: 'SOL',   name: 'Solana',      base: 148,    pair: 'SOL/USDT',  icon: 'S',  color: '#9945ff' },
  { sym: 'ADA',   name: 'Cardano',     base: 0.52,   pair: 'ADA/USDT',  icon: 'A',  color: '#0033ad' },
  { sym: 'DOGE',  name: 'Dogecoin',    base: 0.128,  pair: 'DOGE/USDT', icon: 'D',  color: '#c2a633' },
  { sym: 'DOT',   name: 'Polkadot',    base: 6.82,   pair: 'DOT/USDT',  icon: '●',  color: '#e6007a' },
  { sym: 'AVAX',  name: 'Avalanche',   base: 28.4,   pair: 'AVAX/USDT', icon: 'A',  color: '#e84142' },
  { sym: 'LINK',  name: 'Chainlink',   base: 14.2,   pair: 'LINK/USDT', icon: 'L',  color: '#2a5ada' },
  { sym: 'MATIC', name: 'Polygon',     base: 0.38,   pair: 'MATIC/USDT',icon: 'P',  color: '#8247e5' },
  { sym: 'UNI',   name: 'Uniswap',     base: 7.85,   pair: 'UNI/USDT',  icon: 'U',  color: '#ff007a' },
  { sym: 'ATOM',  name: 'Cosmos',      base: 8.42,   pair: 'ATOM/USDT', icon: 'A',  color: '#2e3148' },
  { sym: 'FIL',   name: 'Filecoin',    base: 5.68,   pair: 'FIL/USDT',  icon: 'F',  color: '#0090ff' },
  { sym: 'NEO',   name: 'NEO',         base: 12.8,   pair: 'NEO/USDT',  icon: 'N',  color: '#58bf73' },
  { sym: 'LTC',   name: 'Litecoin',    base: 72.4,   pair: 'LTC/USDT',  icon: 'L',  color: '#bfbbbb' },
  { sym: 'XLM',   name: 'Stellar',     base: 0.11,   pair: 'XLM/USDT',  icon: 'X',  color: '#14b6e7' },
  { sym: 'TRX',   name: 'Tron',        base: 0.16,   pair: 'TRX/USDT',  icon: 'T',  color: '#ff0013' },
  { sym: 'NEAR',  name: 'NEAR Proto',  base: 5.12,   pair: 'NEAR/USDT', icon: 'N',  color: '#00ec97' },
  { sym: 'APT',   name: 'Aptos',       base: 8.94,   pair: 'APT/USDT',  icon: 'A',  color: '#4cd7c6' },
  { sym: 'ARB',   name: 'Arbitrum',    base: 0.58,   pair: 'ARB/USDT',  icon: 'A',  color: '#28a0f0' },
  { sym: 'OP',    name: 'Optimism',    base: 1.42,   pair: 'OP/USDT',   icon: 'O',  color: '#ff0420' },
  { sym: 'INJ',   name: 'Injective',   base: 18.6,   pair: 'INJ/USDT',  icon: 'I',  color: '#00f2fe' },
  { sym: 'SUI',   name: 'Sui',         base: 2.14,   pair: 'SUI/USDT',  icon: 'S',  color: '#6fbcf0' },
  { sym: 'PEPE',  name: 'Pepe',        base: 0.00000842, pair: 'PEPE/USDT', icon: 'P', color: '#4caf50' },
]

// BTC/BTC pairs for sidebar (matching the screenshot)
export const BTC_PAIRS = [
  { sym: 'ETH/BTC',   price: 0.04415,  chg: -2.58 },
  { sym: 'KCS/BTC',   price: 0.0013192, chg: 5.6 },
  { sym: 'XRP/BTC',   price: 0.00002996, chg: -1.55 },
  { sym: 'VET/BTC',   price: 0.00000103, chg: 1.8 },
  { sym: 'EOS/BTC',   price: 0.00000103, chg: -2.05 },
  { sym: 'BTT/BTC',   price: 0.00002303, chg: -1.05 },
  { sym: 'LTC/BTC',   price: 0.000932,   chg: 1.5 },
  { sym: 'TRX/BTC',   price: 0.00000330, chg: -3.05 },
  { sym: 'BSV/BTC',   price: 0.000300,   chg: 2.05 },
  { sym: 'COTI/BTC',  price: 0.00000350, chg: 2.85 },
  { sym: 'XYT/BTC',   price: 0.000003103, chg: 3.55 },
  { sym: 'BNB/BTC',   price: 0.0000785,  chg: -2.05 },
  { sym: 'XMR/BTC',   price: 0.00350,    chg: -1.05 },
  { sym: 'TRY/BTC',   price: 0.00000123, chg: -2.05 },
  { sym: 'ADA/BTC',   price: 0.0000050,  chg: 5.05 },
  { sym: 'NEO/BTC',   price: 0.000340,   chg: -1.05 },
  { sym: 'XLM/BTC',   price: 0.00000350, chg: 5.05 },
  { sym: 'ENQ/BTC',   price: 0.0000354,  chg: 2.02 },
  { sym: 'AVA/BTC',   price: 0.0002535,  chg: 3.05 },
  { sym: 'AMB/BTC',   price: 0.0005335,  chg: 1.0 },
]

// Generate simulated order book
export function generateOrderBook(midPrice, spread = 0.001) {
  const asks = []
  const bids = []
  for (let i = 0; i < 12; i++) {
    const askPrice = midPrice * (1 + spread * (i + 1))
    const bidPrice = midPrice * (1 - spread * (i + 1))
    const askAmt = Math.random() * 5 + 0.1
    const bidAmt = Math.random() * 5 + 0.1
    asks.push({ price: askPrice, amount: askAmt, total: askPrice * askAmt })
    bids.push({ price: bidPrice, amount: bidAmt, total: bidPrice * bidAmt })
  }
  return { asks: asks.reverse(), bids }
}

// Generate simulated recent trades
export function generateRecentTrades(midPrice, count = 15) {
  const trades = []
  const now = Date.now()
  for (let i = 0; i < count; i++) {
    const price = midPrice * (1 + (Math.random() - 0.5) * 0.002)
    const amount = Math.random() * 3 + 0.01
    const isBuy = Math.random() > 0.5
    trades.push({
      time: new Date(now - i * 3000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price,
      amount,
      side: isBuy ? 'buy' : 'sell',
    })
  }
  return trades
}

// Generate candlestick data for TradingView
export function generateCandleData(days = 365) {
  const data = []
  let basePrice = 40000
  const now = Date.now()
  for (let i = days; i >= 0; i--) {
    const date = new Date(now - i * 86400000)
    const volatility = 0.03
    const change = (Math.random() - 0.48) * volatility
    basePrice *= (1 + change)
    const open = basePrice
    const close = open * (1 + (Math.random() - 0.5) * 0.02)
    const high = Math.max(open, close) * (1 + Math.random() * 0.01)
    const low = Math.min(open, close) * (1 - Math.random() * 0.01)
    const volume = Math.random() * 5000 + 1000
    data.push({
      time: date.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(volume),
    })
  }
  return data
}

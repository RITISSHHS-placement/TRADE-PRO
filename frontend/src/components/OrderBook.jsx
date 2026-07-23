import React, { useState, useMemo, useEffect } from 'react'
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Zap } from 'lucide-react'
import { GlassCard } from './Glassmorphism'

// Simple className merger
const cn = (...classes) => classes.filter(Boolean).join(' ')

// Generate sample order book data
const generateOrderBookData = (basePrice = 2500) => {
  const bids = []
  const asks = []
  
  for (let i = 0; i < 8; i++) {
    const bidPrice = basePrice - (i * 2.5) - Math.random() * 2
    const askPrice = basePrice + (i * 2.5) + Math.random() * 2
    const bidQty = Math.floor(Math.random() * 5000) + 100
    const askQty = Math.floor(Math.random() * 5000) + 100
    
    bids.push({
      price: bidPrice,
      quantity: bidQty,
      total: bidPrice * bidQty,
    })
    
    asks.push({
      price: askPrice,
      quantity: askQty,
      total: askPrice * askQty,
    })
  }
  
  return { bids: bids.reverse(), asks }
}

export default function OrderBook({ 
  symbol = 'RELIANCE',
  basePrice = 2500,
  showDepthChart = true,
  maxRows = 8,
}) {
  const [orderBook, setOrderBook] = useState(() => generateOrderBookData(basePrice))
  const [spread, setSpread] = useState(0)
  const [totalVolume, setTotalVolume] = useState({ bids: 0, asks: 0 })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderBook(() => generateOrderBookData(basePrice))
    }, 2000)
    
    return () => clearInterval(interval)
  }, [basePrice])

  // Calculate spread and totals
  useEffect(() => {
    if (orderBook.bids.length > 0 && orderBook.asks.length > 0) {
      const bestBid = orderBook.bids[orderBook.bids.length - 1]?.price || 0
      const bestAsk = orderBook.asks[0]?.price || 0
      setSpread(bestAsk - bestBid)
      
      const bidTotal = orderBook.bids.reduce((sum, bid) => sum + bid.total, 0)
      const askTotal = orderBook.asks.reduce((sum, ask) => sum + ask.total, 0)
      setTotalVolume({ bids: bidTotal, asks: askTotal })
    }
  }, [orderBook])

  const maxBidQty = Math.max(...orderBook.bids.map(b => b.quantity))
  const maxAskQty = Math.max(...orderBook.asks.map(a => a.quantity))
  const maxQty = Math.max(maxBidQty, maxAskQty)

  const formatPrice = (price) => `₹${price.toFixed(2)}`
  const formatQty = (qty) => {
    if (qty >= 1000000) return `${(qty / 1000000).toFixed(2)}M`
    if (qty >= 1000) return `${(qty / 1000).toFixed(2)}K`
    return qty.toFixed(0)
  }
  const formatTotal = (total) => {
    if (total >= 10000000) return `₹${(total / 10000000).toFixed(2)}Cr`
    if (total >= 100000) return `₹${(total / 100000).toFixed(2)}L`
    return `₹${total.toFixed(0)}`
  }

  return (
    <GlassCard className="p-4" intensity="medium">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">Order Book</h3>
            <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-medium">
              {symbol}
            </span>
          </div>
          <div className="text-xs text-white/50 mt-1">
            Real-time · {maxRows} levels · Auto-refresh
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-white/50">Spread</div>
            <div className="text-sm font-semibold text-white">
              {spread > 0 ? '+' : ''}{spread.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/50">Total Vol</div>
            <div className="text-sm font-semibold text-white">
              {formatTotal(totalVolume.bids + totalVolume.asks)}
            </div>
          </div>
        </div>
      </div>

      {/* Order Book Table */}
      <div className="space-y-1">
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-2 px-3 py-2 text-xs font-medium text-white/40">
          <div>Price (₹)</div>
          <div className="text-right">Quantity</div>
          <div className="text-right">Total</div>
          <div className="text-right">Depth</div>
        </div>

        {/* Asks (Sells) - Red */}
        <div className="space-y-0.5">
          {orderBook.asks.slice(0, maxRows).map((ask, index) => (
            <div
              key={`ask-${index}`}
              className="grid grid-cols-4 gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors relative overflow-hidden"
            >
              {/* Depth bar */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-red-500/10 rounded-lg transition-all duration-300"
                style={{
                  width: `${(ask.quantity / maxQty) * 100}%`,
                }}
              />
              
              <div className="relative text-red-400 font-medium font-mono text-sm">
                {formatPrice(ask.price)}
              </div>
              <div className="relative text-right text-white/70 font-mono text-sm">
                {formatQty(ask.quantity)}
              </div>
              <div className="relative text-right text-white/50 font-mono text-sm">
                {formatTotal(ask.total)}
              </div>
              <div className="relative text-right">
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-xs">
                  <ArrowDown size={10} />
                  {((ask.quantity / maxQty) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Spread Indicator */}
        <div className="py-2 px-3 flex items-center justify-center gap-2 border-y border-white/10 my-2">
          <div className="text-xs text-white/50">Spread:</div>
          <div className="text-sm font-semibold text-white">
            {spread.toFixed(2)} ({((spread / basePrice) * 100).toFixed(3)}%)
          </div>
        </div>

        {/* Bids (Buys) - Green */}
        <div className="space-y-0.5">
          {orderBook.bids.slice(-maxRows).reverse().map((bid, index) => (
            <div
              key={`bid-${index}`}
              className="grid grid-cols-4 gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors relative overflow-hidden"
            >
              {/* Depth bar */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-green-500/10 rounded-lg transition-all duration-300"
                style={{
                  width: `${(bid.quantity / maxQty) * 100}%`,
                }}
              />
              
              <div className="relative text-green-400 font-medium font-mono text-sm">
                {formatPrice(bid.price)}
              </div>
              <div className="relative text-right text-white/70 font-mono text-sm">
                {formatQty(bid.quantity)}
              </div>
              <div className="relative text-right text-white/50 font-mono text-sm">
                {formatTotal(bid.total)}
              </div>
              <div className="relative text-right">
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">
                  <ArrowUp size={10} />
                  {((bid.quantity / maxQty) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Depth Chart */}
      {showDepthChart && <DepthChart bids={orderBook.bids} asks={orderBook.asks} />}

      {/* Footer Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
        <div className="text-center">
          <div className="text-xs text-white/50 mb-1">Total Bid Vol</div>
          <div className="text-sm font-semibold text-green-400">
            {formatTotal(totalVolume.bids)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-white/50 mb-1">Weighted Avg</div>
          <div className="text-sm font-semibold text-white">
            {formatPrice(basePrice)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-white/50 mb-1">Total Ask Vol</div>
          <div className="text-sm font-semibold text-red-400">
            {formatTotal(totalVolume.asks)}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

// Depth Chart Component
const DepthChart = ({ bids, asks }) => {
  const canvasRef = React.useRef(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const width = canvas.width = canvas.offsetWidth * 2
    const height = canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Calculate cumulative volumes
    const bidDepths = bids.map((bid, i) => 
      bids.slice(0, i + 1).reduce((sum, b) => sum + b.quantity, 0)
    )
    const askDepths = asks.map((ask, i) => 
      asks.slice(0, i + 1).reduce((sum, a) => sum + a.quantity, 0)
    )
    
    const maxDepth = Math.max(...bidDepths, ...askDepths)
    const minPrice = Math.min(...bids.map(b => b.price))
    const maxPrice = Math.max(...asks.map(a => a.price))
    const priceRange = maxPrice - minPrice
    
    const chartWidth = width / 2
    const chartHeight = height / 2
    
    // Draw bid depth (green, left side)
    ctx.fillStyle = 'rgba(34, 197, 94, 0.3)'
    ctx.beginPath()
    ctx.moveTo(chartWidth / 2, chartHeight)
    
    bids.forEach((bid, i) => {
      const x = chartWidth / 2 - ((bid.price - minPrice) / priceRange) * (chartWidth / 2)
      const y = chartHeight - (bidDepths[i] / maxDepth) * chartHeight
      ctx.lineTo(x, y)
    })
    
    ctx.lineTo(chartWidth / 2, chartHeight)
    ctx.closePath()
    ctx.fill()
    
    // Draw ask depth (red, right side)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'
    ctx.beginPath()
    ctx.moveTo(chartWidth / 2, chartHeight)
    
    asks.forEach((ask, i) => {
      const x = chartWidth / 2 + ((ask.price - minPrice) / priceRange) * (chartWidth / 2)
      const y = chartHeight - (askDepths[i] / maxDepth) * chartHeight
      ctx.lineTo(x, y)
    })
    
    ctx.lineTo(chartWidth / 2, chartHeight)
    ctx.closePath()
    ctx.fill()
    
    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(chartWidth / 2, 0)
    ctx.lineTo(chartWidth / 2, chartHeight)
    ctx.stroke()
    
  }, [bids, asks])
  
  return (
    <div className="mt-4 h-24 rounded-lg overflow-hidden bg-white/5">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  )
}

// Mini Order Book for Dashboard
export const MiniOrderBook = ({ symbol, basePrice }) => {
  const [orderBook, setOrderBook] = useState(() => generateOrderBookData(basePrice))
  
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderBook(() => generateOrderBookData(basePrice))
    }, 2000)
    
    return () => clearInterval(interval)
  }, [basePrice])
  
  const formatPrice = (price) => `₹${price.toFixed(2)}`
  
  return (
    <GlassCard className="p-3" intensity="light">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-white/70">{symbol}</span>
        <span className="text-xs text-white/50">Live</span>
      </div>
      
      <div className="space-y-1">
        {/* Top 3 Asks */}
        {orderBook.asks.slice(0, 3).map((ask, i) => (
          <div key={i} className="flex justify-between text-xs">
            <span className="text-red-400 font-mono">{formatPrice(ask.price)}</span>
            <span className="text-white/60 font-mono">{ask.quantity.toFixed(0)}</span>
          </div>
        ))}
        
        {/* Spread */}
        <div className="py-1 text-center text-xs text-white/40 border-t border-b border-white/10">
          Spread: {((orderBook.asks[0]?.price - orderBook.bids[orderBook.bids.length - 1]?.price) || 0).toFixed(2)}
        </div>
        
        {/* Top 3 Bids */}
        {orderBook.bids.slice(-3).reverse().map((bid, i) => (
          <div key={i} className="flex justify-between text-xs">
            <span className="text-green-400 font-mono">{formatPrice(bid.price)}</span>
            <span className="text-white/60 font-mono">{bid.quantity.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

import React, { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Area,
} from 'recharts'
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react'

// Custom Candlestick Component
const Candlestick = (props) => {
  const { x, y, width, height, open, close, high, low, payload } = props
  
  if (!payload) return null
  
  const isBullish = close >= open
  const color = isBullish ? '#22c55e' : '#ef4444'
  const bodyHeight = Math.abs(close - open) || 1
  const bodyTop = Math.max(close, open)
  
  const wickX = x + width / 2
  const bodyTopY = y + (high - bodyTop) / (high - low) * height
  const bodyBottomY = y + (high - Math.min(close, open)) / (high - low) * height
  const highY = y
  const lowY = y + height
  
  return (
    <g>
      {/* Upper wick */}
      <line
        x1={wickX}
        y1={highY}
        x2={wickX}
        y2={bodyTopY}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Body */}
      <rect
        x={x + 2}
        y={Math.min(bodyTopY, bodyBottomY)}
        width={width - 4}
        height={Math.max(bodyHeight, 1)}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
      {/* Lower wick */}
      <line
        x1={wickX}
        y1={bodyBottomY}
        x2={wickX}
        y2={lowY}
        stroke={color}
        strokeWidth={1.5}
      />
    </g>
  )
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null
  
  const data = payload[0].payload
  const isBullish = data.close >= data.open
  
  return (
    <div style={{
      background: 'rgba(9, 9, 11, 0.95)',
      border: '1px solid #1f1f27',
      borderRadius: 12,
      padding: 16,
      minWidth: 200,
      backdropFilter: 'blur(10px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    }}>
      <div style={{ fontSize: 12, color: '#8b8b9e', marginBottom: 8 }}>
        {new Date(label).toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        })}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: '#52525f', marginBottom: 2 }}>Open</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f6' }}>
            ₹{data.open?.toFixed(2)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#52525f', marginBottom: 2 }}>Close</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: isBullish ? '#22c55e' : '#ef4444' }}>
            ₹{data.close?.toFixed(2)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#52525f', marginBottom: 2 }}>High</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>
            ₹{data.high?.toFixed(2)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#52525f', marginBottom: 2 }}>Low</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>
            ₹{data.low?.toFixed(2)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#52525f', marginBottom: 2 }}>Volume</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f6' }}>
            {(data.volume / 1e6).toFixed(2)}M
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#52525f', marginBottom: 2 }}>Change</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: isBullish ? '#22c55e' : '#ef4444' }}>
            {isBullish ? '+' : ''}{((data.close - data.open) / data.open * 100).toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  )
}

// Calculate Simple Moving Average
const calculateSMA = (data, period) => {
  const sma = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null)
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0)
      sma.push(sum / period)
    }
  }
  return sma
}

// Calculate Exponential Moving Average
const calculateEMA = (data, period) => {
  const ema = []
  const multiplier = 2 / (period + 1)
  
  ema[0] = data[0]?.close || 0
  
  for (let i = 1; i < data.length; i++) {
    ema[i] = (data[i].close - ema[i - 1]) * multiplier + ema[i - 1]
  }
  
  return ema
}

// Calculate RSI
const calculateRSI = (data, period = 14) => {
  const rsi = []
  const gains = []
  const losses = []
  
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)
  }
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      rsi.push(null)
    } else {
      const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period
      const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period
      
      if (avgLoss === 0) {
        rsi.push(100)
      } else {
        const rs = avgGain / avgLoss
        rsi.push(100 - (100 / (1 + rs)))
      }
    }
  }
  
  return rsi
}

// Calculate Bollinger Bands
const calculateBollingerBands = (data, period = 20, stdDev = 2) => {
  const sma = calculateSMA(data, period)
  const upper = []
  const lower = []
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(null)
      lower.push(null)
    } else {
      const slice = data.slice(i - period + 1, i + 1)
      const mean = sma[i]
      const squaredDiffs = slice.map(val => Math.pow(val.close - mean, 2))
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period
      const std = Math.sqrt(variance)
      
      upper.push(mean + stdDev * std)
      lower.push(mean - stdDev * std)
    }
  }
  
  return { upper, lower, middle: sma }
}

export default function CandlestickChart({ 
  data = [], 
  height = 400,
  showSMA = true,
  showEMA = true,
  showBollinger = false,
  showRSI = true,
  showVolume = true,
}) {
  const [indicator, setIndicator] = useState('SMA')
  const [period, setPeriod] = useState(20)
  
  // Calculate indicators
  const chartData = useMemo(() => {
    if (!data.length) return []
    
    const sma20 = calculateSMA(data, 20)
    const sma50 = calculateSMA(data, 50)
    const ema12 = calculateEMA(data, 12)
    const ema26 = calculateEMA(data, 26)
    const rsi = calculateRSI(data, 14)
    const bollinger = calculateBollingerBands(data, 20, 2)
    
    return data.map((item, index) => ({
      ...item,
      sma20: sma20[index],
      sma50: sma50[index],
      ema12: ema12[index],
      ema26: ema26[index],
      rsi: rsi[index],
      bollingerUpper: bollinger.upper[index],
      bollingerLower: bollinger.lower[index],
      bollingerMiddle: bollinger.middle[index],
    }))
  }, [data])
  
  const currentPrice = data[data.length - 1]?.close || 0
  const previousPrice = data[data.length - 2]?.close || 0
  const priceChange = currentPrice - previousPrice
  const priceChangePercent = (priceChange / previousPrice) * 100
  const isBullish = priceChange >= 0
  
  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ 
              fontSize: 24, 
              fontWeight: 700, 
              color: '#f4f4f6' 
            }}>
              ₹{currentPrice.toFixed(2)}
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4,
              padding: '4px 8px',
              borderRadius: 6,
              background: isBullish ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: isBullish ? '#22c55e' : '#ef4444',
              fontSize: 12,
              fontWeight: 600,
            }}>
              {isBullish ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isBullish ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#8b8b9e', marginTop: 4 }}>
            {data.length} candles · Real-time
          </div>
        </div>
        
        {/* Indicator Selector */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['SMA', 'EMA', 'BB', 'RSI'].map((ind) => (
            <button
              key={ind}
              onClick={() => setIndicator(ind)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: indicator === ind ? '1px solid #6366f1' : '1px solid #1f1f27',
                background: indicator === ind ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: indicator === ind ? '#6366f1' : '#8b8b9e',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Chart */}
      <div style={{ height: showRSI ? height - 100 : height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#1f1f27" 
              vertical={false}
            />
            <XAxis 
              dataKey="timestamp" 
              tick={{ fill: '#52525f', fontSize: 11 }}
              axisLine={{ stroke: '#1f1f27' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: '#52525f', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            {showVolume && (
              <YAxis
                yAxisId="volume"
                orientation="right"
                tick={false}
                axisLine={false}
                tickLine={false}
                width={0}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            
            {/* Volume */}
            {showVolume && (
              <Bar
                dataKey="volume"
                fill="#6366f1"
                opacity={0.15}
                yAxisId="volume"
              />
            )}
            
            {/* Bollinger Bands */}
            {showBollinger && indicator === 'BB' && (
              <>
                <Area
                  dataKey="bollingerUpper"
                  fill="rgba(99, 102, 241, 0.1)"
                  stroke="none"
                />
                <Area
                  dataKey="bollingerLower"
                  fill="rgba(99, 102, 241, 0.1)"
                  stroke="none"
                />
                <Line
                  dataKey="bollingerMiddle"
                  stroke="#6366f1"
                  strokeWidth={1.5}
                  dot={false}
                />
              </>
            )}
            
            {/* SMA */}
            {showSMA && indicator === 'SMA' && (
              <>
                <Line
                  dataKey="sma20"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                  name="SMA 20"
                />
                <Line
                  dataKey="sma50"
                  stroke="#06b6d4"
                  strokeWidth={1.5}
                  dot={false}
                  name="SMA 50"
                />
              </>
            )}
            
            {/* EMA */}
            {showEMA && indicator === 'EMA' && (
              <>
                <Line
                  dataKey="ema12"
                  stroke="#8b5cf6"
                  strokeWidth={1.5}
                  dot={false}
                  name="EMA 12"
                />
                <Line
                  dataKey="ema26"
                  stroke="#ec4899"
                  strokeWidth={1.5}
                  dot={false}
                  name="EMA 26"
                />
              </>
            )}
            
            {/* Candlesticks would be rendered here with custom implementation */}
            {/* For now, using Line as placeholder */}
            <Line
              dataKey="close"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              name="Price"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* RSI Chart */}
      {showRSI && indicator === 'RSI' && (
        <div style={{ height: 100, marginTop: 16 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#1f1f27" 
                vertical={false}
              />
              <XAxis 
                dataKey="timestamp" 
                tick={{ fill: '#52525f', fontSize: 11 }}
                axisLine={{ stroke: '#1f1f27' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#52525f', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" />
              <Line
                dataKey="rsi"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                name="RSI"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginTop: 12, 
        fontSize: 11, 
        color: '#8b8b9e' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
          <span>Bullish</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
          <span>Bearish</span>
        </div>
        {indicator === 'SMA' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 2, background: '#f59e0b' }} />
              <span>SMA 20</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 2, background: '#06b6d4' }} />
              <span>SMA 50</span>
            </div>
          </>
        )}
        {indicator === 'EMA' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 2, background: '#8b5cf6' }} />
              <span>EMA 12</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 2, background: '#ec4899' }} />
              <span>EMA 26</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

import React, { useEffect, useRef, useMemo, memo } from 'react'
import { createChart } from 'lightweight-charts'

// Deterministic PRNG so candles don't jitter on every render
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function generateSampleCandles(seedPrice = 2500) {
  const result = []
  const now = new Date()
  // Use the price as the seed so different symbols get different-but-stable charts
  const rand = mulberry32(Math.floor(seedPrice))
  let basePrice = seedPrice
  for (let i = 100; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dayStr = date.toISOString().split('T')[0]

    const volatility = 0.02 + rand() * 0.03
    const trend = Math.sin(i / 20) * 0.005
    const change = (rand() - 0.48 + trend) * volatility

    const open = basePrice
    const close = basePrice * (1 + change)
    const high = Math.max(open, close) * (1 + rand() * volatility * 0.5)
    const low = Math.min(open, close) * (1 - rand() * volatility * 0.5)
    const volume = Math.floor(rand() * 500000) + 100000

    result.push({
      time: dayStr,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    })

    basePrice = close
  }
  return result
}

/**
 * TradingView-style candlestick chart using lightweight-charts
 * @param {Array} data - Array of { time, open, high, low, close, volume }
 * @param {number} height - Chart height in pixels
 * @param {string} theme - 'light' or 'dark'
 * @param {boolean} showVolume - Show volume histogram
 * @param {boolean} showSMA - Show SMA lines
 */
function TradingViewChart({
  data = [],
  seed = 2500,
  height = 400,
  theme = 'light',
  showVolume = true,
  showSMA = true,
  onCrosshairMove,
}) {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)

  // Generate sample data if none provided
  const chartData = useMemo(() => {
    if (data && data.length > 0) return data
    // Generate 100 days of realistic candlestick data.
    // Keyed by an internal `seed` instead of `data` reference, so it stays
    // stable across re-renders and doesn't regenerate random candles every keystroke.
    return generateSampleCandles(seed || 2500)
  }, [data, seed])

  // Calculate SMA
  const calculateSMA = (data, period) => {
    const sma = []
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(null)
        continue
      }
      let sum = 0
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close
      }
      sma.push({ time: data[i].time, value: sum / period })
    }
    return sma.filter(v => v !== null)
  }

  useEffect(() => {
    if (!chartContainerRef.current) return

    const isDark = theme === 'dark'
    
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { color: isDark ? '#161b22' : '#ffffff' },
        textColor: isDark ? '#8b949e' : '#5f6368',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
        horzLines: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
          width: 1,
          style: 2,
          labelBackgroundColor: isDark ? '#21262d' : '#f6f8fa',
        },
        horzLine: {
          color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
          width: 1,
          style: 2,
          labelBackgroundColor: isDark ? '#21262d' : '#f6f8fa',
        },
      },
      rightPriceScale: {
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        scaleMargins: { top: 0.1, bottom: showVolume ? 0.25 : 0.1 },
      },
      timeScale: {
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        timeVisible: false,
      },
    })

    chartRef.current = chart

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    })
    candleSeriesRef.current = candleSeries

    candleSeries.setData(chartData)

    // Volume histogram
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      })
      volumeSeriesRef.current = volumeSeries

      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      })

      volumeSeries.setData(
        chartData.map(d => ({
          time: d.time,
          value: d.volume,
          color: d.close >= d.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
        }))
      )
    }

    // SMA lines
    if (showSMA && chartData.length > 20) {
      const sma20 = calculateSMA(chartData, 20)
      const sma50 = calculateSMA(chartData, 50)

      if (sma20.length > 0) {
        const sma20Series = chart.addLineSeries({
          color: '#f59e0b',
          lineWidth: 1.5,
          priceLineVisible: false,
          lastValueVisible: false,
        })
        sma20Series.setData(sma20)
      }

      if (sma50.length > 0) {
        const sma50Series = chart.addLineSeries({
          color: '#8b5cf6',
          lineWidth: 1.5,
          priceLineVisible: false,
          lastValueVisible: false,
        })
        sma50Series.setData(sma50)
      }
    }

    // Crosshair move callback
    if (onCrosshairMove) {
      chart.subscribeCrosshairMove((param) => {
        if (param.time && param.seriesData) {
          const data = param.seriesData.get(candleSeries)
          if (data) {
            onCrosshairMove({
              time: param.time,
              open: data.open,
              high: data.high,
              low: data.low,
              close: data.close,
            })
          }
        }
      })
    }

    chart.timeScale().fitContent()

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [chartData, height, theme, showVolume, showSMA])

  return (
    <div
      ref={chartContainerRef}
      style={{ width: '100%', borderRadius: '8px', overflow: 'hidden' }}
    />
  )
}

export default memo(TradingViewChart)

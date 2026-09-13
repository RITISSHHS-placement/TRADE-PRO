import React, { useEffect, useRef, useState } from 'react'

/**
 * TradingViewWidget — Embeds a TradingView mini chart widget
 * Shows live price data for the selected symbol.
 */
export default function TradingViewWidget({
  symbol = 'NSE:RELIANCE',
  width = '100%',
  height = 300,
  theme = 'light',
  style = '1',      // 1 = single pane, 2 = double pane
  locale = 'en',
  gridLines = true,
}) {
  const containerRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    // Clear previous widget
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.charset = 'utf-8'

    const config = {
      autosize: true,
      symbol: symbol,
      interval: 'D',
      timezone: 'Asia/Kolkata',
      theme,
      style,
      locale,
      backgroundColor: theme === 'dark' ? '#0f1624' : '#ffffff',
      gridLines: { color: theme === 'dark' ? '#1e293b' : '#f3f4f6' },
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    }

    script.textContent = JSON.stringify(config)

    const wrapper = document.createElement('div')
    wrapper.className = 'tradingview-widget-container'
    wrapper.style.height = height + 'px'
    wrapper.style.width = width
    wrapper.appendChild(script)

    containerRef.current.appendChild(wrapper)
    setLoaded(true)

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [symbol, theme, height, width, style, locale, gridLines])

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid #e8eaed',
        background: theme === 'dark' ? '#0f1624' : '#fff',
      }}
    />
  )
}

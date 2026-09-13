import React, { useState, useEffect, useRef } from 'react'
import { Bell, TrendingUp, TrendingDown, AlertCircle, Zap, X, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTrades } from '../hooks'

/* ── Sample notifications (in production, these come from WebSocket/polling) ── */
const SAMPLE_NOTIFICATIONS = [
  {
    id: 1, type: 'trade', read: false,
    title: 'Order Executed',
    message: 'BUY 10 RELIANCE @ ₹2,450.40 — Order #1234 completed',
    time: Date.now() - 120000,
    icon: TrendingUp, color: '#22c55e',
  },
  {
    id: 2, type: 'ipo', read: false,
    title: 'IPO Alert — Tata Technologies',
    message: 'IPO opens tomorrow at ₹400–₹450. Set your bid now!',
    time: Date.now() - 3600000,
    icon: Zap, color: '#1a73e8',
  },
  {
    id: 3, type: 'price', read: false,
    title: 'Price Alert — BTC/USDT',
    message: 'Bitcoin crossed ₹65,000 — your target of ₹64,500 hit!',
    time: Date.now() - 7200000,
    icon: TrendingUp, color: '#f59e0b',
  },
  {
    id: 4, type: 'trade', read: true,
    title: 'Order Cancelled',
    message: 'SELL 5 INFY @ ₹1,480 — Cancelled by user',
    time: Date.now() - 86400000,
    icon: AlertCircle, color: '#ef4444',
  },
  {
    id: 5, type: 'ipo', read: true,
    title: 'IPO Allotment — JSW Infrastructure',
    message: 'You have been allotted 1 lot (47 shares) at ₹400',
    time: Date.now() - 172800000,
    icon: TrendingUp, color: '#22c55e',
  },
  {
    id: 6, type: 'price', read: true,
    title: 'Price Alert — ETH/USDT',
    message: 'Ethereum dropped below ₹2,500 — target price reached',
    time: Date.now() - 259200000,
    icon: TrendingDown, color: '#ef4444',
  },
]

function timeAgo(ts) {
  const diff = Date.now() - ts
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const { trades } = useTrades()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS)
  const ref = useRef(null)

  // Add real trade notifications
  useEffect(() => {
    if (!trades?.length) return
    const recentTrade = trades[0]
    if (recentTrade && Date.now() - new Date(recentTrade.createdAt || Date.now()).getTime() < 300000) {
      const exists = notifications.find(n => n.id === `trade-${recentTrade.id}`)
      if (!exists) {
        setNotifications(prev => [{
          id: `trade-${recentTrade.id}`,
          type: 'trade',
          read: false,
          title: `${recentTrade.side} ${recentTrade.symbol}`,
          message: `${recentTrade.side} ${recentTrade.quantity} ${recentTrade.symbol} @ ₹${(recentTrade.price || 0).toLocaleString('en-IN')}`,
          time: new Date(recentTrade.createdAt || Date.now()).getTime(),
          icon: recentTrade.side === 'BUY' ? TrendingUp : TrendingDown,
          color: recentTrade.side === 'BUY' ? '#22c55e' : '#ef4444',
        }, ...prev])
      }
    }
  }, [trades])

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const unreadCount = notifications.filter(n => !n.read).length

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const clearAll = () => setNotifications([])

  const getTypeLabel = (type) => {
    switch (type) {
      case 'trade': return { text: 'Trade', bg: '#22c55e18', color: '#22c55e' }
      case 'ipo': return { text: 'IPO', bg: '#1a73e818', color: '#1a73e8' }
      case 'price': return { text: 'Price Alert', bg: '#f59e0b18', color: '#f59e0b' }
      default: return { text: 'Info', bg: '#8b5cf618', color: '#8b5cf6' }
    }
  }

  const handleNotificationClick = (notif) => {
    markRead(notif.id)
    setOpen(false)
    if (notif.type === 'ipo') navigate('/dashboard/ipo-watch')
    else if (notif.type === 'price') navigate('/dashboard/price-alerts')
    else if (notif.type === 'trade') navigate('/dashboard/portfolio')
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative', width: 36, height: 36, borderRadius: 8,
          background: open ? '#e8eaed' : 'transparent',
          border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center',
          transition: 'background 0.15s',
        }}
        aria-label="Notifications"
      >
        <Bell size={16} color={open ? '#1a1a2e' : 'var(--text-tertiary)'} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 16, height: 16, borderRadius: '50%',
            background: '#ef4444', color: '#fff',
            fontSize: 9, fontWeight: 800, display: 'grid', placeItems: 'center',
            lineHeight: 1, border: '2px solid #fff',
            animation: 'bellPulse 2s infinite',
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8,
          width: 380, maxHeight: 480, overflow: 'hidden',
          background: '#fff', border: '1px solid #e8eaed',
          borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          zIndex: 600, display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', borderBottom: '1px solid #e8eaed',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px',
                  borderRadius: 10, background: '#ef4444', color: '#fff',
                }}>{unreadCount} new</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    fontSize: 11, fontWeight: 600, color: '#1a73e8',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '4px 8px', borderRadius: 6,
                  }}
                >Mark all read</button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 28, height: 28, borderRadius: 6, border: 'none',
                  background: '#f6f8fa', cursor: 'pointer', display: 'grid',
                  placeItems: 'center',
                }}
              ><X size={14} color="#5f6368" /></button>
            </div>
          </div>

          {/* Notification List */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 380 }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: 40, textAlign: 'center', color: '#9aa0a6',
                fontSize: 13,
              }}>
                <Bell size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                <div>No notifications yet</div>
              </div>
            ) : (
              notifications.map(n => {
                const typeInfo = getTypeLabel(n.type)
                const Icon = n.icon
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      display: 'flex', gap: 12, padding: '12px 18px',
                      borderBottom: '1px solid #f6f8fa',
                      background: n.read ? 'transparent' : '#f8f9ff',
                      cursor: 'pointer', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f6f8fa' }}
                    onMouseLeave={e => { e.currentTarget.style.background = n.read ? 'transparent' : '#f8f9ff' }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `${n.color}15`, display: 'grid',
                      placeItems: 'center', flexShrink: 0,
                    }}>
                      <Icon size={16} color={n.color} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '1px 6px',
                          borderRadius: 4, background: typeInfo.bg, color: typeInfo.color,
                          textTransform: 'uppercase', letterSpacing: 0.3,
                        }}>{typeInfo.text}</span>
                        {!n.read && (
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: '#1a73e8', flexShrink: 0,
                          }} />
                        )}
                      </div>
                      <div style={{
                        fontSize: 12.5, fontWeight: 600, color: '#1a1a2e',
                        marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>{n.title}</div>
                      <div style={{
                        fontSize: 11.5, color: '#5f6368', lineHeight: 1.4,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>{n.message}</div>
                    </div>

                    {/* Time */}
                    <div style={{
                      fontSize: 10, color: '#9aa0a6', flexShrink: 0,
                      display: 'flex', alignItems: 'flex-start', paddingTop: 2,
                    }}>
                      <Clock size={10} style={{ marginRight: 3 }} />
                      {timeAgo(n.time)}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '10px 18px', borderTop: '1px solid #e8eaed',
              display: 'flex', justifyContent: 'space-between',
            }}>
              <button
                onClick={clearAll}
                style={{
                  fontSize: 11, fontWeight: 600, color: '#9aa0a6',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >Clear all</button>
              <button
                onClick={() => { setOpen(false); navigate('/dashboard/ipo-watch') }}
                style={{
                  fontSize: 11, fontWeight: 600, color: '#1a73e8',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >View all →</button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bellPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  )
}

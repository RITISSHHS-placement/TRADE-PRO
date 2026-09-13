/* ═══════════════════════════════════════════════════════════
   PriceAlertsPage — Manage crypto price alerts
   Set thresholds, get browser notifications when hit
═══════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Bell, BellRing, Trash2, ToggleLeft, ToggleRight,
  TrendingUp, TrendingDown, Plus, AlertCircle, Check,
  X, Wifi, WifiOff, Clock, Target, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { CRYPTO_PAIRS } from '../services/cryptoData'
import useBinanceStream from '../hooks/useBinanceStream'
import {
  getAlerts, addAlert, removeAlert, toggleAlert,
  requestNotificationPermission,
} from '../services/priceAlerts'
import styles from './PriceAlertsPage.module.css'

const T = {
  bg: '#f8f9fa', white: '#ffffff', border: '#e8eaed',
  text: '#1a1a2e', textSub: '#5f6368', textMute: '#9aa0a6',
  blue: '#1a73e8', blueBg: 'rgba(26,115,232,0.08)',
  green: '#22c55e', greenBg: 'rgba(34,197,94,0.08)',
  red: '#ef4444', redBg: 'rgba(239,68,68,0.08)',
  amber: '#f59e0b', amberBg: 'rgba(245,158,11,0.08)',
  purple: '#8b5cf6',
}

export default function PriceAlertsPage() {
  const [alerts, setAlerts] = useState(getAlerts)
  const [showCreate, setShowCreate] = useState(false)
  const [newSymbol, setNewSymbol] = useState('BTC')
  const [newTarget, setNewTarget] = useState('')
  const [newCondition, setNewCondition] = useState('above')
  const [newNote, setNewNote] = useState('')
  const [notifPermission, setNotifPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  )
  const [toast, setToast] = useState(null)

  // Get unique symbols from alerts for the stream
  const streamSymbols = useMemo(() => {
    const syms = [...new Set(alerts.filter(a => a.active).map(a => a.symbol))]
    if (syms.length === 0) syms.push('BTC')
    return syms
  }, [alerts])

  const { health, prices } = useBinanceStream(streamSymbols, true)

  const toastMsg = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const requestNotif = async () => {
    const perm = await requestNotificationPermission()
    setNotifPermission(perm)
    if (perm === 'granted') toastMsg('Notifications enabled! You\'ll be alerted when prices hit your targets.')
    else toastMsg('Notifications blocked. Please enable them in browser settings.', 'error')
  }

  const handleCreate = () => {
    if (!newTarget || Number(newTarget) <= 0) {
      toastMsg('Enter a valid target price', 'error')
      return
    }
    addAlert({
      symbol: newSymbol,
      targetPrice: Number(newTarget),
      condition: newCondition,
      note: newNote,
    })
    setAlerts(getAlerts())
    setShowCreate(false)
    setNewTarget('')
    setNewNote('')
    toastMsg(`Alert set: ${newSymbol} ${newCondition} $${Number(newTarget).toLocaleString()}`)
  }

  const handleDelete = (id) => {
    removeAlert(id)
    setAlerts(getAlerts())
    toastMsg('Alert deleted')
  }

  const handleToggle = (id) => {
    toggleAlert(id)
    setAlerts(getAlerts())
  }

  // Refresh alerts when triggered
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getAlerts()
      if (current.length !== alerts.length || current.some((a, i) => a.triggered !== alerts[i]?.triggered)) {
        setAlerts(current)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [alerts])

  const activeAlerts = alerts.filter(a => a.active && !a.triggered)
  const triggeredAlerts = alerts.filter(a => a.triggered)
  const inactiveAlerts = alerts.filter(a => !a.active && !a.triggered)

  const pair = CRYPTO_PAIRS.find(p => p.sym === newSymbol)

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Price Alerts</h1>
          <p className={styles.subtitle}>Get notified when crypto crosses your target price</p>
        </div>
        <div className={styles.headerActions}>
          {/* Connection health badge */}
          <div className={`${styles.healthBadge} ${health.status === 'connected' ? styles.healthConnected : styles.healthDisconnected}`}>
            {health.status === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span>{health.status === 'connected' ? 'Live' : 'Reconnecting...'}</span>
            {health.latency > 0 && <span className={styles.latency}>{health.latency}ms</span>}
          </div>

          {/* Notification permission */}
          {notifPermission !== 'granted' && (
            <button onClick={requestNotif} className={styles.enableNotifBtn}>
              <BellRing size={14} /> Enable Notifications
            </button>
          )}

          <button onClick={() => setShowCreate(true)} className={styles.createBtn}>
            <Plus size={15} /> New Alert
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: T.blueBg }}><Target size={16} color={T.blue} /></div>
          <div><div className={styles.statVal}>{activeAlerts.length}</div><div className={styles.statLabel}>Active</div></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: T.greenBg }}><Check size={16} color={T.green} /></div>
          <div><div className={styles.statVal}>{triggeredAlerts.length}</div><div className={styles.statLabel}>Triggered</div></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: T.amberBg }}><Clock size={16} color={T.amber} /></div>
          <div><div className={styles.statVal}>{inactiveAlerts.length}</div><div className={styles.statLabel}>Paused</div></div>
        </div>
      </div>

      {/* Create Alert Modal */}
      {showCreate && (
        <div className={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Create Price Alert</h2>
              <button onClick={() => setShowCreate(false)} className={styles.modalClose}><X size={18} /></button>
            </div>

            <div className={styles.modalBody}>
              {/* Symbol selector */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cryptocurrency</label>
                <select value={newSymbol} onChange={e => setNewSymbol(e.target.value)} className={styles.formSelect}>
                  {CRYPTO_PAIRS.map(p => (
                    <option key={p.sym} value={p.sym}>{p.icon} {p.name} ({p.sym})</option>
                  ))}
                </select>
                {prices[newSymbol] > 0 && (
                  <div className={styles.currentPrice}>
                    Current: ${prices[newSymbol].toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
              </div>

              {/* Condition */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Alert When</label>
                <div className={styles.conditionRow}>
                  <button
                    onClick={() => setNewCondition('above')}
                    className={`${styles.conditionBtn} ${newCondition === 'above' ? styles.conditionBtnActive : ''}`}
                    style={newCondition === 'above' ? { background: T.greenBg, color: T.green, borderColor: T.green } : {}}
                  >
                    <TrendingUp size={14} /> Price Goes Above
                  </button>
                  <button
                    onClick={() => setNewCondition('below')}
                    className={`${styles.conditionBtn} ${newCondition === 'below' ? styles.conditionBtnActive : ''}`}
                    style={newCondition === 'below' ? { background: T.redBg, color: T.red, borderColor: T.red } : {}}
                  >
                    <TrendingDown size={14} /> Price Goes Below
                  </button>
                </div>
              </div>

              {/* Target price */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Target Price (USD)</label>
                <div className={styles.priceInputWrap}>
                  <span className={styles.pricePrefix}>$</span>
                  <input
                    type="number"
                    value={newTarget}
                    onChange={e => setNewTarget(e.target.value)}
                    placeholder={pair ? `e.g. ${(pair.base * (newCondition === 'above' ? 1.05 : 0.95)).toFixed(2)}` : '0.00'}
                    className={styles.priceInput}
                    step="any"
                  />
                </div>
                {pair && newTarget && (
                  <div className={styles.priceDiff}>
                    {newCondition === 'above' ? '↑' : '↓'}{' '}
                    {Math.abs(((Number(newTarget) - prices[newSymbol]) / prices[newSymbol]) * 100).toFixed(1)}% from current
                  </div>
                )}
              </div>

              {/* Note */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Note (optional)</label>
                <input
                  type="text"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="e.g. Take profit level"
                  className={styles.noteInput}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setShowCreate(false)} className={styles.cancelBtn}>Cancel</button>
              <button onClick={handleCreate} className={styles.confirmBtn}>
                <Bell size={14} /> Create Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts list */}
      <div className={styles.alertsList}>
        {alerts.length === 0 && (
          <div className={styles.emptyState}>
            <Bell size={48} color={T.textMute} />
            <h3>No alerts yet</h3>
            <p>Create your first price alert to get notified when crypto hits your target.</p>
            <button onClick={() => setShowCreate(true)} className={styles.createBtn}>
              <Plus size={15} /> Create Alert
            </button>
          </div>
        )}

        {alerts.map(alert => {
          const ctp = CRYPTO_PAIRS.find(p => p.sym === alert.symbol)
          const currentPrice = prices[alert.symbol] || 0
          const diff = currentPrice > 0 ? ((currentPrice - alert.targetPrice) / alert.targetPrice * 100) : 0

          return (
            <div key={alert.id} className={`${styles.alertCard} ${alert.triggered ? styles.alertTriggered : ''} ${!alert.active ? styles.alertPaused : ''}`}>
              <div className={styles.alertLeft}>
                <div className={styles.alertIcon} style={{ background: ctp?.color || T.blue }}>
                  {ctp?.icon || '?'}
                </div>
                <div>
                  <div className={styles.alertTitle}>
                    {ctp?.name || alert.symbol} ({alert.symbol}/USDT)
                  </div>
                  <div className={styles.alertCondition}>
                    {alert.condition === 'above' ? <ArrowUpRight size={12} color={T.green} /> : <ArrowDownRight size={12} color={T.red} />}
                    <span style={{ color: alert.condition === 'above' ? T.green : T.red }}>
                      {alert.condition === 'above' ? 'Above' : 'Below'}
                    </span>
                    ${alert.targetPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    {alert.note && <span className={styles.alertNote}>· {alert.note}</span>}
                  </div>
                </div>
              </div>

              <div className={styles.alertRight}>
                {currentPrice > 0 && (
                  <div className={styles.alertCurrent}>
                    <span style={{ color: T.textMute, fontSize: 11 }}>Current</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}>
                      ${currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span style={{ fontSize: 11, color: Math.abs(diff) < 1 ? T.textMute : diff > 0 ? T.green : T.red }}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)}% away
                    </span>
                  </div>
                )}

                {alert.triggered && (
                  <div className={styles.triggeredBadge}>
                    <Check size={12} /> Triggered
                    {alert.triggeredAt && <span>{new Date(alert.triggeredAt).toLocaleTimeString()}</span>}
                  </div>
                )}

                <div className={styles.alertActions}>
                  <button onClick={() => handleToggle(alert.id)} className={styles.toggleBtn} title={alert.active ? 'Pause' : 'Resume'}>
                    {alert.active ? <ToggleRight size={18} color={T.green} /> : <ToggleLeft size={18} color={T.textMute} />}
                  </button>
                  <button onClick={() => handleDelete(alert.id)} className={styles.deleteBtn} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

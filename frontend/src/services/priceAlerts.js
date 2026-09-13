/* ═══════════════════════════════════════════════════════════
   Price Alerts Service
   Manages alerts in localStorage, sends browser notifications
═══════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'tradepro-price-alerts'

/* ── Notification permission ── */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  const result = await Notification.requestPermission()
  return result
}

/* ── Send a browser notification ── */
export function sendAlertNotification(alert, currentPrice) {
  if (Notification.permission !== 'granted') return

  const direction = alert.condition === 'above' ? '📈 Above' : '📉 Below'
  const notif = new Notification(`Price Alert: ${alert.symbol}`, {
    body: `${alert.symbol} is now ${direction} your target!\nCurrent: $${currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\nTarget: $${alert.targetPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: `alert-${alert.id}`, // replaces previous notification for same alert
    requireInteraction: true,
  })

  notif.onclick = () => {
    window.focus()
    notif.close()
  }

  // Auto-close after 10s
  setTimeout(() => notif.close(), 10000)
}

/* ── CRUD for alerts (localStorage) ── */
export function getAlerts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveAlerts(alerts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts))
}

export function addAlert({ symbol, targetPrice, condition, note }) {
  const alerts = getAlerts()
  const newAlert = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    symbol,
    targetPrice: Number(targetPrice),
    condition, // 'above' | 'below'
    note: note || '',
    active: true,
    triggered: false,
    createdAt: Date.now(),
    triggeredAt: null,
  }
  alerts.unshift(newAlert)
  saveAlerts(alerts)
  return newAlert
}

export function removeAlert(id) {
  const alerts = getAlerts().filter(a => a.id !== id)
  saveAlerts(alerts)
}

export function toggleAlert(id) {
  const alerts = getAlerts().map(a =>
    a.id === id ? { ...a, active: !a.active, triggered: false } : a
  )
  saveAlerts(alerts)
}

export function markAlertTriggered(id) {
  const alerts = getAlerts().map(a =>
    a.id === id ? { ...a, triggered: true, triggeredAt: Date.now(), active: false } : a
  )
  saveAlerts(alerts)
}

/* ── Check all active alerts against current price ── */
export function checkAlerts(symbol, currentPrice) {
  const alerts = getAlerts()
  let anyTriggered = false

  alerts.forEach(alert => {
    if (alert.symbol !== symbol || !alert.active || alert.triggered) return

    const triggered =
      (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
      (alert.condition === 'below' && currentPrice <= alert.targetPrice)

    if (triggered) {
      markAlertTriggered(alert.id)
      sendAlertNotification(alert, currentPrice)
      anyTriggered = true
    }
  })

  return anyTriggered
}

/* ═══════════════════════════════════════════════════════════
   CryptoPortfolioPage — Real-time crypto holdings tracker
   Uses Binance WebSocket for live prices, calculates P&L
═══════════════════════════════════════════════════════════ */
import React, { useState, useMemo, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, Plus, Trash2, Edit3,
  Wallet, BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
  RefreshCw, DollarSign, Coins, Activity, X, Check,
} from 'lucide-react'
import { CRYPTO_PAIRS } from '../services/cryptoData'
import useBinanceStream from '../hooks/useBinanceStream'
import styles from './CryptoPortfolioPage.module.css'

const STORAGE_KEY = 'tradepro-crypto-portfolio'

const T = {
  bg: '#f8f9fa', white: '#ffffff', border: '#e8eaed',
  text: '#1a1a2e', textSub: '#5f6368', textMute: '#9aa0a6',
  blue: '#1a73e8', blueBg: 'rgba(26,115,232,0.08)',
  green: '#22c55e', greenBg: 'rgba(34,197,94,0.08)',
  red: '#ef4444', redBg: 'rgba(239,68,68,0.08)',
  amber: '#f59e0b', amberBg: 'rgba(245,158,11,0.08)',
  purple: '#8b5cf6',
}

function getHoldings() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function saveHoldings(h) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(h))
}

function addHolding(holding) {
  const all = getHoldings()
  all.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    ...holding,
    createdAt: Date.now(),
  })
  saveHoldings(all)
  return all
}

function removeHolding(id) {
  const all = getHoldings().filter(h => h.id !== id)
  saveHoldings(all)
  return all
}

export default function CryptoPortfolioPage() {
  const [holdings, setHoldings] = useState(getHoldings)
  const [showAdd, setShowAdd] = useState(false)
  const [addSymbol, setAddSymbol] = useState('BTC')
  const [addQty, setAddQty] = useState('')
  const [addBuyPrice, setAddBuyPrice] = useState('')
  const [toast, setToast] = useState(null)

  // Get all unique crypto symbols from holdings
  const uniqueSymbols = useMemo(() => {
    const syms = [...new Set(holdings.map(h => h.symbol))]
    if (syms.length === 0) syms.push('BTC')
    return syms
  }, [holdings])

  const { health, prices } = useBinanceStream(uniqueSymbols, true)

  const toastMsg = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAdd = () => {
    const qty = parseFloat(addQty)
    const buyPrice = parseFloat(addBuyPrice)
    if (!qty || qty <= 0 || !buyPrice || buyPrice <= 0) {
      toastMsg('Enter valid quantity and buy price', 'error')
      return
    }
    setHoldings(addHolding({
      symbol: addSymbol,
      quantity: qty,
      buyPrice,
    }))
    setShowAdd(false)
    setAddQty('')
    setAddBuyPrice('')
    toastMsg(`Added ${qty} ${addSymbol} to portfolio`)
  }

  const handleRemove = (id) => {
    setHoldings(removeHolding(id))
    toastMsg('Holding removed')
  }

  // Calculate portfolio summary
  const summary = useMemo(() => {
    let totalInvested = 0
    let totalCurrent = 0
    const bySymbol = {}

    holdings.forEach(h => {
      const current = prices[h.symbol] || h.buyPrice
      const invested = h.quantity * h.buyPrice
      const currentValue = h.quantity * current
      totalInvested += invested
      totalCurrent += currentValue

      if (!bySymbol[h.symbol]) bySymbol[h.symbol] = { invested: 0, current: 0, qty: 0 }
      bySymbol[h.symbol].invested += invested
      bySymbol[h.symbol].current += currentValue
      bySymbol[h.symbol].qty += h.quantity
    })

    return {
      totalInvested,
      totalCurrent,
      totalPnL: totalCurrent - totalInvested,
      totalPnLPct: totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested * 100) : 0,
      bySymbol,
    }
  }, [holdings, prices])

  const f2 = (n) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const pair = CRYPTO_PAIRS.find(p => p.sym === addSymbol)

  return (
    <div className={styles.page}>
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.type === 'error' ? <X size={14} /> : <Check size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Crypto Portfolio</h1>
          <p className={styles.subtitle}>Real-time P&L powered by Binance live prices</p>
        </div>
        <div className={styles.headerActions}>
          <div className={`${styles.healthBadge} ${health.status === 'connected' ? styles.healthConnected : styles.healthDisconnected}`}>
            {health.status === 'connected' ? <Activity size={12} /> : <RefreshCw size={12} className={styles.spinning} />}
            <span>{health.status === 'connected' ? 'Live' : 'Connecting...'}</span>
          </div>
          <button onClick={() => setShowAdd(true)} className={styles.addBtn}>
            <Plus size={15} /> Add Holding
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ background: T.blueBg }}><Wallet size={18} color={T.blue} /></div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Total Invested</div>
            <div className={styles.summaryValue}>${f2(summary.totalInvested)}</div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ background: T.greenBg }}><Coins size={18} color={T.green} /></div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Current Value</div>
            <div className={styles.summaryValue}>${f2(summary.totalCurrent)}</div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ background: summary.totalPnL >= 0 ? T.greenBg : T.redBg }}>
            {summary.totalPnL >= 0 ? <TrendingUp size={18} color={T.green} /> : <TrendingDown size={18} color={T.red} />}
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Total P&L</div>
            <div className={styles.summaryValue} style={{ color: summary.totalPnL >= 0 ? T.green : T.red }}>
              {summary.totalPnL >= 0 ? '+' : ''}${f2(summary.totalPnL)}
              <span className={styles.pnlPct}>
                ({summary.totalPnLPct >= 0 ? '+' : ''}{summary.totalPnLPct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ background: T.amberBg }}><BarChart3 size={18} color={T.amber} /></div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Holdings</div>
            <div className={styles.summaryValue}>{holdings.length} assets</div>
          </div>
        </div>
      </div>

      {/* Holdings by symbol (grouped) */}
      {Object.keys(summary.bySymbol).length > 0 && (
        <div className={styles.holdingsBySymbol}>
          <h3 className={styles.sectionTitle}>Allocation</h3>
          <div className={styles.allocationRow}>
            {Object.entries(summary.bySymbol).map(([sym, data]) => {
              const pct = summary.totalCurrent > 0 ? (data.current / summary.totalCurrent * 100) : 0
              const ctp = CRYPTO_PAIRS.find(p => p.sym === sym)
              return (
                <div key={sym} className={styles.allocationBar}>
                  <div className={styles.allocationInfo}>
                    <span className={styles.allocationDot} style={{ background: ctp?.color || T.blue }} />
                    <span>{sym}</span>
                    <span className={styles.allocationPct}>{pct.toFixed(1)}%</span>
                  </div>
                  <div className={styles.allocationTrack}>
                    <div className={styles.allocationFill} style={{ width: `${pct}%`, background: ctp?.color || T.blue }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div className={styles.tableWrap}>
        <div className={styles.tableHead}>
          <span>Asset</span>
          <span>Holdings</span>
          <span>Avg Buy</span>
          <span>Current</span>
          <span>Invested</span>
          <span>Value</span>
          <span>P&L</span>
          <span></span>
        </div>

        {holdings.length === 0 && (
          <div className={styles.emptyState}>
            <PieChart size={40} color={T.textMute} />
            <h3>No holdings yet</h3>
            <p>Add your first crypto holding to track real-time P&L.</p>
            <button onClick={() => setShowAdd(true)} className={styles.addBtn}>
              <Plus size={15} /> Add Holding
            </button>
          </div>
        )}

        {holdings.map(h => {
          const ctp = CRYPTO_PAIRS.find(p => p.sym === h.symbol)
          const currentPrice = prices[h.symbol] || h.buyPrice
          const invested = h.quantity * h.buyPrice
          const value = h.quantity * currentPrice
          const pnl = value - invested
          const pnlPct = invested > 0 ? (pnl / invested * 100) : 0

          return (
            <div key={h.id} className={styles.tableRow}>
              <div className={styles.assetCell}>
                <div className={styles.assetIcon} style={{ background: ctp?.color || T.blue }}>
                  {ctp?.icon || '?'}
                </div>
                <div>
                  <div className={styles.assetName}>{ctp?.name || h.symbol}</div>
                  <div className={styles.assetSym}>{h.symbol}/USDT</div>
                </div>
              </div>
              <span className={styles.cellMono}>{h.quantity}</span>
              <span className={styles.cellMono}>${f2(h.buyPrice)}</span>
              <span className={styles.cellMono} style={{ color: currentPrice >= h.buyPrice ? T.green : T.red }}>
                ${f2(currentPrice)}
              </span>
              <span className={styles.cellMono}>${f2(invested)}</span>
              <span className={styles.cellMono} style={{ fontWeight: 700 }}>${f2(value)}</span>
              <div className={styles.pnlCell}>
                <span style={{ color: pnl >= 0 ? T.green : T.red, fontWeight: 700 }}>
                  {pnl >= 0 ? '+' : ''}${f2(pnl)}
                </span>
                <span className={styles.pnlPctSmall} style={{ color: pnl >= 0 ? T.green : T.red }}>
                  {pnl >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                </span>
              </div>
              <button onClick={() => handleRemove(h.id)} className={styles.removeBtn}>
                <Trash2 size={13} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Add Holding Modal */}
      {showAdd && (
        <div className={styles.modalOverlay} onClick={() => setShowAdd(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add Holding</h2>
              <button onClick={() => setShowAdd(false)} className={styles.modalClose}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cryptocurrency</label>
                <select value={addSymbol} onChange={e => setAddSymbol(e.target.value)} className={styles.formSelect}>
                  {CRYPTO_PAIRS.map(p => (
                    <option key={p.sym} value={p.sym}>{p.icon} {p.name} ({p.sym})</option>
                  ))}
                </select>
                {prices[addSymbol] > 0 && (
                  <div className={styles.currentPrice}>Current: ${f2(prices[addSymbol])}</div>
                )}
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Quantity</label>
                  <input type="number" value={addQty} onChange={e => setAddQty(e.target.value)}
                    placeholder="0.00" step="any" className={styles.formInput} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Buy Price (USD)</label>
                  <input type="number" value={addBuyPrice} onChange={e => setAddBuyPrice(e.target.value)}
                    placeholder={prices[addSymbol] ? f2(prices[addSymbol]) : '0.00'}
                    step="any" className={styles.formInput} />
                </div>
              </div>
              {addQty && addBuyPrice && (
                <div className={styles.preview}>
                  <span>Invested: ${(parseFloat(addQty) * parseFloat(addBuyPrice)).toFixed(2)}</span>
                  {prices[addSymbol] > 0 && (
                    <span style={{ color: (prices[addSymbol] - parseFloat(addBuyPrice)) >= 0 ? T.green : T.red }}>
                      Unrealized P&L: {((prices[addSymbol] - parseFloat(addBuyPrice)) / parseFloat(addBuyPrice) * 100).toFixed(2)}%
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setShowAdd(false)} className={styles.cancelBtn}>Cancel</button>
              <button onClick={handleAdd} className={styles.confirmBtn}><Plus size={14} /> Add Holding</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useState, useCallback, startTransition, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, CreditCard, Landmark, Wallet, Smartphone,
  CheckCircle, Lock, Shield, ChevronRight, X, Zap,
  TrendingUp, ArrowUpRight, IndianRupee, QrCode, Copy, Check,
} from 'lucide-react'
import CompanyLogo from '../components/CompanyLogo'

const T = {
  bg: '#f8f9fa', white: '#ffffff',
  border: '#e8eaed', border2: '#f0f0f0',
  text: '#1a1a2e', textSub: '#5f6368', textMute: '#9aa0a6',
  green: '#22c55e', greenBg: 'rgba(34,197,94,0.08)', greenDark: '#16a34a',
  red: '#ef4444', redBg: 'rgba(239,68,68,0.08)',
  blue: '#1a73e8', blueBg: 'rgba(26,115,232,0.08)',
  amber: '#f59e0b', amberBg: 'rgba(245,158,11,0.08)',
  purple: '#8b5cf6', purpleBg: 'rgba(139,92,246,0.08)',
}

const PAYMENT_METHODS = [
  { id: 'upi', icon: Smartphone, label: 'UPI', desc: 'GPay, PhonePe, Paytm — instant', color: T.green },
  { id: 'card', icon: CreditCard, label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay', color: T.blue },
  { id: 'netbanking', icon: Landmark, label: 'Net Banking', desc: 'All major banks supported', color: T.purple },
  { id: 'wallet', icon: Wallet, label: 'Wallet', desc: 'Paytm, PhonePe wallet', color: T.amber },
]

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 25000]

const INVESTMENT_ICONS = {
  'Mutual Fund': '📊', 'Smallcase': '📋', 'Digital Gold': '🪙',
  'IPO': '📈', 'Stock': '💹', 'ETF': '📦', 'default': '💰',
}

export default function PaymentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Get params from URL
  const productName = searchParams.get('name') || 'Investment'
  const productType = searchParams.get('type') || 'default'
  const minAmount = parseInt(searchParams.get('min') || '500')
  const nav = searchParams.get('nav') || ''
  const category = searchParams.get('category') || ''
  const sideParam = searchParams.get('side') || ''
  const qtyParam = parseInt(searchParams.get('qty') || '0')
  const priceParam = parseFloat(searchParams.get('price') || '0')
  const amountParam = parseFloat(searchParams.get('amount') || '0')
  const symbolParam = searchParams.get('symbol') || ''
  const exchangeParam = searchParams.get('exchange') || 'NSE'

  // If coming from a trade (has amount OR has qty + price), skip step 1
  const hasAmount = amountParam > 0
  const hasTradeContext = qtyParam > 0 && priceParam > 0
  const isTradeFlow = hasTradeContext || hasAmount
  const tradeQty = qtyParam
  const tradePrice = priceParam
  const tradeAmount = amountParam > 0 ? amountParam : tradeQty * tradePrice

  const [step, setStep] = useState(isTradeFlow ? 2 : 1) // 1=amount, 2=payment, 3=processing, 4=success
  const [amount, setAmount] = useState(minAmount)
  const [customAmount, setCustomAmount] = useState(hasAmount ? String(amountParam) : '')
  const [payMethod, setPayMethod] = useState('upi')
  const [upiId, setUpiId] = useState('')
  const [processing, setProcessing] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef(null)

  const finalAmount = isTradeFlow
    ? tradeAmount
    : (customAmount ? Number(customAmount) : amount)

  // Generate UPI QR code on canvas when step 2 and UPI selected
  useEffect(() => {
    if (step === 2 && payMethod === 'upi' && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const size = 160
      canvas.width = size
      canvas.height = size
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, size, size)
      // Simple QR-like pattern (visual placeholder — real QR needs library)
      const upiStr = `upi://pay?pa=${upiId || 'user@upi'}&pn=TradePro&am=${finalAmount}&cu=INR`
      ctx.fillStyle = '#1a1a2e'
      // Draw data-matrix style pattern for visual effect
      const cellSize = 4
      const cells = Math.floor(size / cellSize)
      for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
          // Corner finder patterns
          const isCorner = (x < 7 && y < 7) || (x >= cells - 7 && y < 7) || (x < 7 && y >= cells - 7)
          const isCornerBorder = isCorner && (
            x === 0 || y === 0 || x === 6 || y === 6 ||
            x === cells - 1 || y === 6 || x === cells - 7 || y === cells - 1
          )
          const isCornerFill = isCorner && x >= 1 && x <= 5 && y >= 1 && y <= 5 &&
            !(x >= 2 && x <= 4 && y >= 2 && y <= 4)
          const isBorder = x === 0 || y === 0 || x === cells - 1 || y === cells - 1
          const seed = (x * 7 + y * 13 + upiStr.length) % 17
          const isData = !isCorner && (seed < 5 || seed === 7 || seed === 11)
          if (isCornerBorder || isCornerFill || isBorder || isData) {
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
          }
        }
      }
      // Center logo area
      const logoSize = 24
      ctx.fillStyle = '#fff'
      ctx.fillRect((size - logoSize) / 2 - 2, (size - logoSize) / 2 - 2, logoSize + 4, logoSize + 4)
      ctx.fillStyle = '#1a73e8'
      ctx.fillRect((size - logoSize) / 2, (size - logoSize) / 2, logoSize, logoSize)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('TP', size / 2, size / 2)
    }
  }, [step, payMethod, upiId, finalAmount])

  const handleCopy = () => {
    navigator.clipboard?.writeText(upiId || 'user@upi')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const goToStep = useCallback((s) => startTransition(() => setStep(s)), [])

  const handlePay = useCallback(() => {
    goToStep(3)
    setProcessing(true)
    setTransactionId('TXN' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase())
    setTimeout(() => {
      setProcessing(false)
      goToStep(4)
    }, 2500)
  }, [goToStep])

  // Extract symbol from product name for logo
  const productSymbol = useMemo(() => {
    const n = productName.toUpperCase()
    if (n.includes('RELIANCE')) return 'RELIANCE'
    if (n.includes('TCS')) return 'TCS'
    if (n.includes('HDFC')) return 'HDFCBANK'
    if (n.includes('INFOSYS') || n.includes('INFY')) return 'INFY'
    if (n.includes('SBI')) return 'SBIN'
    if (n.includes('ICICI')) return 'ICICIBANK'
    if (n.includes('WIPRO')) return 'WIPRO'
    if (n.includes('MARUTI')) return 'MARUTI'
    if (n.includes('TATA MOTORS') || n.includes('TATAMOTORS')) return 'TATAMOTORS'
    if (n.includes('NTPC')) return 'NTPC'
    if (n.includes('BAJAJ')) return 'BAJFINANCE'
    if (n.includes('BITCOIN') || n.includes('BTC')) return 'BTC'
    if (n.includes('ETHEREUM') || n.includes('ETH')) return 'ETH'
    if (n.includes('SOLANA') || n.includes('SOL')) return 'SOL'
    if (n.includes('APPLE')) return 'AAPL'
    if (n.includes('TESLA')) return 'TSLA'
    if (n.includes('MICROSOFT') || n.includes('MSFT')) return 'MSFT'
    if (n.includes('GOLD')) return 'GOLDBEES'
    if (n.includes('SILVER')) return 'SILVERBEES'
    return ''
  }, [productName])

  const icon = INVESTMENT_ICONS[productType] || INVESTMENT_ICONS.default

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px' }}>

        {/* Back button */}
        {step < 4 && (
          <button onClick={() => step === 1 ? navigate(-1) : goToStep(step - 1)} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
            cursor: 'pointer', color: T.textSub, fontSize: 13, marginBottom: 20, fontWeight: 500,
          }}>
            <ArrowLeft size={16} /> {step === 1 ? 'Back' : 'Change amount'}
          </button>
        )}

        {/* Progress Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
          {['Amount', 'Payment', 'Confirmation'].map((label, i) => (
            <React.Fragment key={label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: step > i + 1 ? T.green : step === i + 1 ? T.blue : T.border,
                  color: step > i + 1 ? '#fff' : step === i + 1 ? '#fff' : T.textMute,
                  fontSize: 12, fontWeight: 800, display: 'grid', placeItems: 'center',
                  transition: 'all 0.3s',
                }}>
                  {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: step === i + 1 ? 700 : 500, color: step >= i + 1 ? T.text : T.textMute }}>
                  {label}
                </span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 2, background: step > i + 1 ? T.green : T.border, margin: '0 8px', borderRadius: 1 }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Main Card */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

          {/* Step 1: Amount Selection */}
          {step === 1 && (
            <>
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                {productSymbol ? (
                  <CompanyLogo symbol={productSymbol} name={productName} size={48} borderRadius={12} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: T.blueBg, display: 'grid', placeItems: 'center', fontSize: 24 }}>
                    {icon}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{productName}</div>
                  <div style={{ fontSize: 12, color: T.textMute }}>
                    {category && `${category} · `}Min ₹{minAmount.toLocaleString('en-IN')}
                    {nav && ` · NAV ₹${nav}`}
                  </div>
                  {isTradeFlow && (
                    <div style={{ fontSize: 11, color: T.blue, fontWeight: 600, marginTop: 2 }}>
                      {sideParam === 'BUY' ? '🟢' : '🔴'} {sideParam} · {tradeQty} × ₹{tradePrice.toLocaleString('en-IN')} = ₹{tradeAmount.toLocaleString('en-IN')}
                      {symbolParam && ` · ${symbolParam} · ${exchangeParam}`}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: '24px' }}>
                {/* Quick Amounts */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.textMute, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                    Select Amount
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {QUICK_AMOUNTS.map(a => (
                      <button key={a} onClick={() => { setAmount(a); setCustomAmount('') }} style={{
                        padding: '12px 0', borderRadius: 10,
                        border: `1.5px solid ${amount === a && !customAmount ? T.blue : T.border}`,
                        background: amount === a && !customAmount ? T.blueBg : T.white,
                        color: amount === a && !customAmount ? T.blue : T.textSub,
                        fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                      }}>₹{a.toLocaleString('en-IN')}</button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.textMute, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                    Or enter custom amount
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${customAmount ? T.blue : T.border}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                    <span style={{ padding: '12px 14px', background: T.bg, borderRight: `1px solid ${T.border}`, fontSize: 16, fontWeight: 700, color: T.textSub }}>₹</span>
                    <input type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
                      placeholder={`Min ₹${minAmount.toLocaleString('en-IN')}`}
                      style={{ flex: 1, padding: '12px 14px', border: 'none', outline: 'none', fontSize: 16, fontWeight: 700, color: T.text, background: 'transparent' }} />
                  </div>
                </div>

                {/* Summary */}
                <div style={{ background: T.bg, borderRadius: 12, padding: '16px 18px', marginBottom: 24, border: `1px solid ${T.border2}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: T.textSub }}>
                    <span>Investment Amount</span>
                    <span style={{ fontWeight: 700, color: T.text }}>₹{finalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: T.textSub }}>
                    <span>Processing Fee</span>
                    <span style={{ fontWeight: 700, color: T.green }}>FREE</span>
                  </div>
                  <div style={{ height: 1, background: T.border, margin: '10px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: T.text }}>
                    <span>Total</span>
                    <span>₹{finalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button onClick={() => goToStep(2)} disabled={!finalAmount || finalAmount < minAmount} style={{
                  width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                  background: !finalAmount || finalAmount < minAmount ? T.border : T.blue,
                  color: !finalAmount || finalAmount < minAmount ? T.textMute : '#fff',
                  fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.15s',
                }}>
                  Continue to Payment <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* Step 2: Payment Method */}
          {step === 2 && (
            <>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>Select Payment Method</div>
                <div style={{ fontSize: 12, color: T.textMute, marginTop: 4 }}>
                  {isTradeFlow ? (
                    <span>{sideParam} {tradeQty} × ₹{tradePrice.toLocaleString('en-IN')} = <strong style={{color:T.text}}>₹{tradeAmount.toLocaleString('en-IN')}</strong></span>
                  ) : (
                    <span>Amount: ₹{finalAmount.toLocaleString('en-IN')}</span>
                  )}
                </div>
              </div>

              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.id} onClick={() => setPayMethod(m.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '16px 18px', borderRadius: 12,
                      border: `1.5px solid ${payMethod === m.id ? T.blue : T.border}`,
                      background: payMethod === m.id ? T.blueBg : T.white,
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${m.color}12`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <m.icon size={20} color={m.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: payMethod === m.id ? T.blue : T.text }}>{m.label}</div>
                        <div style={{ fontSize: 12, color: T.textMute }}>{m.desc}</div>
                      </div>
                      {payMethod === m.id && <CheckCircle size={18} color={T.blue} />}
                    </button>
                  ))}
                </div>

                {/* UPI Section with QR Code */}
                {payMethod === 'upi' && (
                  <div style={{ marginBottom: 20 }}>
                    {/* QR Code */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`, marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMute, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                        Scan to Pay ₹{finalAmount.toLocaleString('en-IN')}
                      </div>
                      <canvas ref={canvasRef} style={{ width: 160, height: 160, borderRadius: 8, border: `1px solid ${T.border}` }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                        <span style={{ fontSize: 12, color: T.textSub, fontFamily: 'monospace' }}>{upiId || 'user@upi'}</span>
                        <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
                          {copied ? <Check size={13} color={T.green} /> : <Copy size={13} color={T.textMute} />}
                        </button>
                      </div>
                    </div>
                    {/* UPI ID input */}
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.textMute, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                      Or enter UPI ID
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi"
                        style={{ flex: 1, padding: '12px 14px', border: `1.5px solid ${T.border}`, borderRadius: 10, fontSize: 14, color: T.text, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {['gpay', 'phonepe', 'paytm'].map(id => (
                        <button key={id} onClick={() => setUpiId(`user@${id}`)} style={{
                          padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`,
                          background: T.white, fontSize: 11, color: T.textSub, cursor: 'pointer',
                          textTransform: 'capitalize', fontWeight: 600,
                        }}>{id}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.greenBg, border: `1px solid rgba(34,197,94,0.2)`, borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
                  <Shield size={15} color={T.green} />
                  <span style={{ fontSize: 12, color: T.greenDark, fontWeight: 600 }}>Secured with 256-bit SSL encryption · PCI DSS compliant</span>
                </div>

                <button onClick={handlePay} style={{
                  width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                  background: T.green, color: '#fff',
                  fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.15s',
                }}>
                  Pay ₹{finalAmount.toLocaleString('en-IN')} <ArrowUpRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* Step 3: Processing */}
          {step === 3 && (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', border: `3px solid ${T.blue}`,
                borderTopColor: 'transparent', animation: 'spin 1s linear infinite',
                margin: '0 auto 24px',
              }} />
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 8 }}>Processing Payment</div>
              <div style={{ fontSize: 13, color: T.textMute }}>Please wait while we process your payment...</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <>
              {/* Success Header */}
              <div style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                padding: '36px 24px', textAlign: 'center',
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                  overflow: 'hidden',
                }}>
                  {productSymbol ? (
                    <CompanyLogo symbol={productSymbol} name={productName} size={64} borderRadius={32} style={{background: 'rgba(255,255,255,0.3)'}} />
                  ) : (
                    <CheckCircle size={36} color="#fff" />
                  )}
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Payment Successful!</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginTop: 8 }}>₹{finalAmount.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{productName}</div>
              </div>

              <div style={{ padding: '24px' }}>
                {/* Transaction Details */}
                <div style={{ background: T.bg, borderRadius: 12, padding: '16px 18px', marginBottom: 20, border: `1px solid ${T.border2}` }}>
                  {[
                    ['Transaction ID', transactionId],
                    ...(isTradeFlow ? [
                      ['Symbol', `${symbolParam} · ${exchangeParam}`],
                      ['Side', sideParam],
                      ['Quantity', `${tradeQty} shares`],
                      ['Price', `₹${tradePrice.toLocaleString('en-IN')}`],
                    ] : []),
                    ['Amount', `₹${finalAmount.toLocaleString('en-IN')}`],
                    ['Payment via', PAYMENT_METHODS.find(m => m.id === payMethod)?.label || ''],
                    ['Status', '✓ Completed'],
                    ['Date', new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
                    ['Time', new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: 13 }}>
                      <span style={{ color: T.textMute }}>{k}</span>
                      <span style={{ fontWeight: 700, color: k === 'Status' ? T.green : T.text }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => navigate('/dashboard/portfolio')} style={{
                    flex: 1, padding: '12px', borderRadius: 10, border: `1px solid ${T.border}`,
                    background: T.white, color: T.text, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>
                    View Portfolio
                  </button>
                  <button onClick={() => navigate('/dashboard')} style={{
                    flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                    background: T.blue, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Trust badges */}
        {step < 3 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 24, flexWrap: 'wrap' }}>
            {[
              { icon: Shield, label: 'SEBI Registered' },
              { icon: Lock, label: 'Secure Payments' },
              { icon: Zap, label: 'Instant Execution' },
            ].map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textMute }}>
                <b.icon size={13} color={T.textMute} />
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

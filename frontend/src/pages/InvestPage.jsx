import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, CreditCard, Landmark, Wallet, CheckCircle,
  Lock, TrendingUp, ShieldCheck, ChevronRight, Star,
} from 'lucide-react'

const T = {
  bg: '#f8f9fa', white: '#fff',
  border: '#e0e0e0', border2: '#f0f0f0',
  text: '#1a1a1a', textSub: '#5f6368', textMute: '#9aa0a6',
  green: '#0f9d58', greenBg: '#e8f5e9', greenDark: '#0a8043',
  red: '#ea4335', redBg: '#fce8e6',
  blue: '#1a73e8', blueBg: '#e8f0fe',
  amber: '#d97706', amberBg: '#fef3c7',
  purple: '#7c3aed', purpleBg: '#ede9fe',
}

const PAYMENT_METHODS = [
  { id: 'upi',  icon: '📱', label: 'UPI',               desc: 'GPay, PhonePe, Paytm — instant transfer' },
  { id: 'card', icon: '💳', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay' },
  { id: 'bank', icon: '🏦', label: 'Net Banking',         desc: 'All major banks supported' },
]

const AMOUNT_OPTIONS = [500, 1000, 5000, 10000, 25000, 50000]

const INVEST_OPTIONS = [
  { id: 'mf',    icon: '📊', title: 'Mutual Funds', desc: '₹0 commission · Direct plans · 16,000+ schemes', badge: 'Popular', to: '/dashboard/mf' },
  { id: 'stock', icon: '📈', title: 'Equity Stocks', desc: 'NSE & BSE · ₹0 delivery brokerage', badge: null, to: '/dashboard/trade' },
  { id: 'gold',  icon: '🪙', title: 'Digital Gold',  desc: '24K · 99.9% purity · No storage fee', badge: 'New', to: '/dashboard/digital-gold' },
  { id: 'fd',    icon: '🏛️', title: 'Fixed Deposits', desc: 'Up to 9.5% p.a. · DICGC insured', badge: null, to: null },
]

export default function InvestPage() {
  const navigate = useNavigate()
  const [step, setStep]               = useState(0) // 0=landing, 1=amount, 2=payment, 3=done
  const [amount, setAmount]           = useState(1000)
  const [customAmt, setCustomAmt]     = useState('')
  const [payMethod, setPayMethod]     = useState('upi')
  const [processing, setProcessing]   = useState(false)
  const [selectedInvest, setSelected] = useState(null)

  const finalAmt = customAmt ? Number(customAmt) : amount

  const startInvest = (opt) => {
    if (opt.to) { navigate(opt.to); return }
    setSelected(opt)
    setStep(1)
  }

  const handlePay = () => {
    setProcessing(true)
    setTimeout(() => { setProcessing(false); setStep(3) }, 2000)
  }

  /* ── Landing ── */
  if (step === 0) return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: 24 }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: '0 0 6px' }}>Invest</h1>
          <p style={{ fontSize: 13, color: T.textMute, margin: 0 }}>Choose how you want to grow your money</p>
        </div>

        {/* Invest options grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, marginBottom: 32 }}>
          {INVEST_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => startInvest(opt)} style={{
              background: T.white, border: `1.5px solid ${T.border}`,
              borderRadius: 14, padding: '22px 20px', textAlign: 'left',
              cursor: 'pointer', transition: 'all .15s', position: 'relative',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.blue; e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,115,232,.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
            >
              {opt.badge && (
                <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: opt.badge === 'New' ? T.blueBg : T.greenBg, color: opt.badge === 'New' ? T.blue : T.greenDark }}>
                  {opt.badge}
                </span>
              )}
              <div style={{ fontSize: 32, marginBottom: 12 }}>{opt.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 5 }}>{opt.title}</div>
              <div style={{ fontSize: 12.5, color: T.textSub, lineHeight: 1.5 }}>{opt.desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, fontSize: 12, fontWeight: 700, color: T.blue }}>
                Start investing <ChevronRight size={13} />
              </div>
            </button>
          ))}
        </div>

        {/* Why invest section */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '24px 28px' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 16 }}>Why invest with TradePro?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
            {[
              { icon: '₹0', label: 'Zero Commission', desc: 'No hidden charges on MF & equity delivery' },
              { icon: '🔒', label: 'Bank-grade Security', desc: 'SEBI regulated · 256-bit SSL encryption' },
              { icon: '⚡', label: 'Instant Execution', desc: 'Orders executed in under 50ms on NSE' },
              { icon: '📊', label: '16,000+ Schemes', desc: 'All direct mutual funds from every AMC' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.blueBg, display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 900, color: T.blue, flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{f.label}</div>
                  <div style={{ fontSize: 11.5, color: T.textMute, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  /* ── Step 1: Amount ── */
  if (step === 1) return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
        {/* Back */}
        <button onClick={() => setStep(0)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: T.textSub, fontSize: 13, marginBottom: 20 }}>
          ← Back
        </button>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          {['Amount', 'Payment', 'Confirmation'].map((label, i) => (
            <React.Fragment key={label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: step >= i + 1 ? T.blue : T.border, color: step >= i + 1 ? '#fff' : T.textMute, fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center' }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: step === i + 1 ? 700 : 500, color: step >= i + 1 ? T.text : T.textMute }}>{label}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 1, background: step > i + 1 ? T.blue : T.border }} />}
            </React.Fragment>
          ))}
        </div>

        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{selectedInvest?.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{selectedInvest?.title}</div>
              <div style={{ fontSize: 11.5, color: T.textMute }}>Select investment amount</div>
            </div>
          </div>

          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
              {AMOUNT_OPTIONS.map(v => (
                <button key={v} onClick={() => { setAmount(v); setCustomAmt('') }} style={{
                  padding: 10, borderRadius: 8,
                  border: `1.5px solid ${amount === v && !customAmt ? T.blue : T.border}`,
                  background: amount === v && !customAmt ? T.blueBg : T.white,
                  color: amount === v && !customAmt ? T.blue : T.textSub,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>₹{v.toLocaleString('en-IN')}</button>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>Custom Amount</label>
              <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${customAmt ? T.blue : T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <span style={{ padding: '10px 12px', background: T.bg, borderRight: `1px solid ${T.border}`, fontSize: 14, fontWeight: 700, color: T.textSub }}>₹</span>
                <input type="number" value={customAmt} onChange={e => setCustomAmt(e.target.value)} placeholder="Enter amount"
                  style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: 14, fontWeight: 700, color: T.text }} />
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: T.textSub }}>
                <span>Investment Amount</span>
                <span style={{ fontWeight: 700, color: T.text }}>₹{finalAmt.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: T.textSub }}>
                <span>Processing Fee</span>
                <span style={{ fontWeight: 700, color: T.greenDark }}>FREE</span>
              </div>
              <div style={{ height: 1, background: T.border, margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: T.text }}>
                <span>Total</span>
                <span>₹{finalAmt.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button onClick={() => setStep(2)} disabled={!finalAmt || finalAmt < 1} style={{
              width: '100%', padding: 13, borderRadius: 9, border: 'none',
              background: !finalAmt || finalAmt < 1 ? '#e0e0e0' : T.blue,
              color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              Continue to Payment <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  /* ── Step 2: Payment ── */
  if (step === 2) return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
        <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: T.textSub, fontSize: 13, marginBottom: 20 }}>← Back</button>

        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Select Payment Method</div>
            <div style={{ fontSize: 11.5, color: T.textMute, marginTop: 2 }}>Amount: ₹{finalAmt.toLocaleString('en-IN')}</div>
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PAYMENT_METHODS.map(m => (
              <button key={m.id} onClick={() => setPayMethod(m.id)} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 10,
                border: `1.5px solid ${payMethod === m.id ? T.blue : T.border}`,
                background: payMethod === m.id ? T.blueBg : T.white,
                cursor: 'pointer', textAlign: 'left', transition: 'all .12s',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 9, background: T.bg, display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>{m.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: payMethod === m.id ? T.blue : T.text }}>{m.label}</div>
                  <div style={{ fontSize: 11.5, color: T.textMute }}>{m.desc}</div>
                </div>
                {payMethod === m.id && <CheckCircle size={18} color={T.blue} />}
              </button>
            ))}
          </div>

          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.greenBg, border: `1px solid ${T.green}30`, borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 11.5, color: T.greenDark, fontWeight: 600 }}>
              <Lock size={12} /> Secured with 256-bit SSL encryption
            </div>
            <button onClick={handlePay} disabled={processing} style={{
              width: '100%', padding: 13, borderRadius: 9, border: 'none',
              background: processing ? T.textMute : T.green,
              color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {processing ? (
                <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Processing…</>
              ) : (
                <>Pay ₹{finalAmt.toLocaleString('en-IN')} <ArrowRight size={15} /></>
              )}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  /* ── Step 3: Success ── */
  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
          {/* Success header */}
          <div style={{ background: 'linear-gradient(135deg,#0f9d58,#34a853)', padding: '32px 20px', textAlign: 'center' }}>
            <CheckCircle size={56} color="#fff" />
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 12 }}>Investment Successful!</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginTop: 6 }}>₹{finalAmt.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', marginTop: 4 }}>{selectedInvest?.title}</div>
          </div>

          <div style={{ padding: 20 }}>
            {/* Transaction details */}
            <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              {[
                ['Transaction ID', `TXN${Date.now()}`],
                ['Amount', `₹${finalAmt.toLocaleString('en-IN')}`],
                ['Payment via', PAYMENT_METHODS.find(m => m.id === payMethod)?.label || ''],
                ['Status', '✓ Completed'],
                ['Date', new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13, color: T.textSub }}>
                  <span>{k}</span>
                  <span style={{ fontWeight: 700, color: k === 'Status' ? T.greenDark : T.text }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => navigate('/dashboard/portfolio')} style={{
                flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${T.border}`,
                background: T.white, color: T.text, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>View Portfolio</button>
              <button onClick={() => setStep(0)} style={{
                flex: 1, padding: 12, borderRadius: 8, border: 'none',
                background: T.blue, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
              }}>Invest More</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

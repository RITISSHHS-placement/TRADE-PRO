import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronDown, ChevronUp, X, Shield } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer,
  Tooltip, CartesianGrid,
} from 'recharts'

/* ── Gold Investment Modal ── */
function GoldInvestModal({ onClose }) {
  const [amount, setAmount] = useState(1000)
  const [freq, setFreq] = useState('One time')
  const goldRate = 9845 // per gram
  const grams = (amount / goldRate).toFixed(4)

  return (
    <div style={{
      position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',
      display:'flex',alignItems:'center',justifyContent:'center',
      zIndex:1000,padding:20,
    }} onClick={onClose}>
      <div style={{
        background:'#fff',borderRadius:16,padding:28,width:'min(440px,100%)',
        boxShadow:'0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:40,height:40,borderRadius:10,background:'linear-gradient(135deg,#d4a017,#f4c430)',display:'grid',placeItems:'center',fontSize:20}}>🪙</div>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:'#111827'}}>Buy Digital Gold</div>
              <div style={{fontSize:11,color:'#9ca3af'}}>24K · 99.9% purity · Live price</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',padding:4}}>
            <X size={18} color="#9ca3af"/>
          </button>
        </div>

        {/* Live price banner */}
        <div style={{background:'#fef9ec',border:'1px solid #fde68a',borderRadius:10,padding:'12px 16px',marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:10,color:'#92400e',fontWeight:700,textTransform:'uppercase',letterSpacing:.5}}>Live Gold Price</div>
            <div style={{fontSize:22,fontWeight:900,color:'#d97706'}}>₹98,450<span style={{fontSize:12,fontWeight:500}}>/10g</span></div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:10,color:'#92400e',fontWeight:700}}>Per gram</div>
            <div style={{fontSize:16,fontWeight:800,color:'#d97706'}}>₹9,845</div>
            <div style={{fontSize:11,color:'#10b981',fontWeight:600}}>▲ +0.84% today</div>
          </div>
        </div>

        {/* Frequency */}
        <div style={{marginBottom:16}}>
          <label style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:6}}>Investment type</label>
          <div style={{display:'flex',gap:6}}>
            {['One time','SIP (Daily)','SIP (Monthly)'].map(f=>(
              <button key={f} onClick={()=>setFreq(f)} style={{
                flex:1,padding:'7px 0',borderRadius:7,
                background:freq===f?'#0f1624':'#f3f4f6',
                border:'none',color:freq===f?'#fff':'#6b7280',
                fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit',
                transition:'all .12s',
              }}>{f}</button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div style={{marginBottom:16}}>
          <label style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:6}}>Amount (₹)</label>
          <div style={{display:'flex',gap:6,marginBottom:8}}>
            {[500,1000,2000,5000].map(a=>(
              <button key={a} onClick={()=>setAmount(a)} style={{
                flex:1,padding:'6px 0',borderRadius:7,
                background:amount===a?'#d4a017':'#f3f4f6',
                border:'none',color:amount===a?'#fff':'#6b7280',
                fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',
              }}>₹{a.toLocaleString('en-IN')}</button>
            ))}
          </div>
          <input type="number" value={amount} min={100}
            onChange={e=>setAmount(Number(e.target.value))}
            style={{width:'100%',padding:'10px 14px',border:'1px solid #e5e7eb',borderRadius:8,fontSize:16,fontWeight:700,color:'#111827',outline:'none',boxSizing:'border-box',fontFamily:'inherit'}}
          />
        </div>

        {/* You get */}
        <div style={{background:'#f9fafb',borderRadius:10,padding:'12px 16px',marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:11,color:'#9ca3af',fontWeight:700}}>You will get approximately</div>
            <div style={{fontSize:18,fontWeight:800,color:'#111827'}}>{grams} grams</div>
          </div>
          <div style={{fontSize:11,color:'#9ca3af',fontWeight:500}}>at ₹{goldRate.toLocaleString('en-IN')}/g</div>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:5,background:'#f0fdf4',borderRadius:8,padding:'8px 12px',marginBottom:16,fontSize:11,color:'#16a34a',fontWeight:600}}>
          <Shield size={13}/> Stored in insured vaults · No transaction fee
        </div>

        <button style={{
          width:'100%',padding:'13px',borderRadius:9,
          background:'linear-gradient(135deg,#d4a017,#f59e0b)',
          border:'none',color:'#000',fontSize:14,fontWeight:800,
          cursor:'pointer',fontFamily:'inherit',letterSpacing:.3,
        }}>
          Buy {grams}g Gold for ₹{amount.toLocaleString('en-IN')} →
        </button>
      </div>
    </div>
  )
}

/* ── Gold price data ── */
const goldData = [
  { year: '2015', price: 26000 },
  { year: '2016', price: 28000 },
  { year: '2017', price: 29500 },
  { year: '2018', price: 31000 },
  { year: '2019', price: 35000 },
  { year: '2020', price: 48000 },
  { year: '2021', price: 47000 },
  { year: '2022', price: 52000 },
  { year: '2023', price: 62000 },
  { year: '2024', price: 72000 },
  { year: '2025', price: 88000 },
  { year: '2026', price: 98000 },
]

/* ── Comparison table data ── */
const COMPARISON = [
  { feature: 'Buy at live price',                       digital: true,  physical: false },
  { feature: 'Trade 24/7 at market price',              digital: true,  physical: false },
  { feature: 'No safe storage needed, easy to sell',    digital: true,  physical: false },
  { feature: 'Secure storage',                          digital: true,  physical: true  },
  { feature: 'No demat account required',               digital: true,  physical: true  },
  { feature: 'Convertible to physical gold',            digital: true,  physical: true  },
]

/* ── FAQ data ── */
const FAQS = [
  { q: 'What is Digital Gold?',
    a: 'Digital Gold is a convenient way to buy, sell, and hold gold online. Each unit is backed by 24-karat physical gold stored in secure vaults.' },
  { q: 'Who am I buying the gold from?',
    a: 'You buy gold from SafeGold, a leading digital gold platform that ensures 100% physical backing for every purchase.' },
  { q: 'Where is my gold stored?',
    a: 'Your gold is stored in secure, insured vaults managed by SafeGold across multiple locations in India.' },
  { q: 'Will I be charged for the storage of my gold?',
    a: 'No. TradePro charges zero storage fees for Digital Gold held on the platform.' },
  { q: 'How do I know my gold is secure?',
    a: 'Your gold holdings are audited regularly and insured. You can view vault details and audit certificates in your account.' },
  { q: 'How can I modify my SIP amount?',
    a: 'You can update or cancel your gold SIP at any time from the SIP management section in your profile.' },
  { q: 'How does the mandate setup & daily SIP work?',
    a: 'Once you set up a mandate with your bank, a fixed amount is auto-debited daily/monthly to purchase gold at the prevailing live rate.' },
  { q: 'What happens in the unlikely event of SafeGold going into liquidation?',
    a: 'Your gold is ring-fenced from SafeGold\'s assets. In case of liquidation, your gold will be transferred or redeemed on your behalf.' },
  { q: 'How can I sell the gold?',
    a: 'Simply tap "Sell" in the app, enter the amount or grams you wish to sell, and the proceeds are credited to your bank account within 1–2 business days.' },
  { q: 'Can I take physical delivery of gold?',
    a: 'Yes. You can request physical delivery of your gold (minimum 0.5 grams) as coins or bars, delivered to your address.' },
  { q: 'What is the purity of gold?',
    a: 'All Digital Gold on TradePro is 24-karat (99.9% purity), certified by NABL-accredited labs.' },
  { q: 'How is the gold gram value calculated?',
    a: 'The gram value is derived from the live spot price of gold (INR per gram), updated every few seconds during market hours.' },
  { q: 'What is the minimum and maximum amount of gold I can buy?',
    a: 'The minimum purchase is ₹1 (approximately 0.00001 grams). The maximum per transaction is ₹2,00,000.' },
  { q: 'Can I invest in SIP in grams of gold?',
    a: 'Yes. You can set a gram-based SIP where a fixed weight of gold is purchased at regular intervals.' },
  { q: 'Can I cancel my buy/sell order?',
    a: 'Buy/sell orders are executed instantly at live prices and cannot be cancelled after confirmation.' },
  { q: 'Where can I find the invoice for my order?',
    a: 'Invoices for all gold transactions are available in the "Order History" section of your TradePro account.' },
  { q: 'What happens to my gold in case of my death?',
    a: 'Your gold can be transferred to your nominee. Please ensure your nominee details are updated in your profile.' },
  { q: 'Where can I find terms and conditions for Digital Gold transactions?',
    a: 'You can find the terms and conditions in the "Fine Print" section under Settings or at the bottom of the Digital Gold page.' },
]

/* ── FAQ accordion ── */
function FaqItem({ faq, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: 10,
      overflow: 'hidden',
      background: '#fff',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '16px 20px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{faq.q}</span>
        {open ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
      </button>
      {open && (
        <div style={{
          padding: '0 20px 16px',
          fontSize: 13, color: '#4b5563', lineHeight: 1.75,
          borderTop: '1px solid #f3f4f6',
        }}>
          {faq.a}
        </div>
      )}
    </div>
  )
}

/* ── Custom tooltip for recharts ── */
function GoldTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1a2234', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '8px 14px',
    }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#d4a017' }}>
        ₹{Number(payload[0].value).toLocaleString('en-IN')}
      </div>
    </div>
  )
}

export default function DigitalGoldPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('1Y')
  const [investAmount, setInvestAmount] = useState(1000)
  const [freqTab, setFreqTab] = useState('Both')
  const [period, setPeriod] = useState(4)
  const [openFaq, setOpenFaq] = useState(null)
  const [showInvestModal, setShowInvestModal] = useState(false)

  const timeTabs = ['1D','1M','3M','1Y','3Y','5Y','MAX']
  const freqTabs = ['Both','Specific','One time']

  // filter gold data by tab
  const filteredData = (() => {
    const count = { '1D': 1, '1M': 2, '3M': 3, '1Y': 5, '3Y': 7, '5Y': 9, 'MAX': goldData.length }
    return goldData.slice(-(count[activeTab] || goldData.length))
  })()

  const estimatedInvested = investAmount * period * (freqTab === 'One time' ? 1 : 12)

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'inherit', background: '#f9fafb' }}>

      {/* ── Section 1: Hero ── */}
      <section style={{
        background: '#0f1624',
        padding: '64px 24px 56px',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 60, alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontSize: 12, fontWeight: 700, color: '#d4a017',
              letterSpacing: '0.8px', textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              ✦ Introducing Digital Gold
            </div>
            <h1 style={{
              fontSize: 'clamp(28px,3.5vw,44px)',
              fontWeight: 900, color: '#fff',
              lineHeight: 1.18, marginBottom: 28,
              letterSpacing: '-0.5px',
            }}>
              Tackle market volatility<br />with Digital Gold
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
              {[
                'Track your gold portfolio in real time',
                'Start a SIP and withdraw anytime',
                'No transaction fee',
              ].map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(0,179,134,0.2)',
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    <Check size={12} color="#00b386" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)' }}>{b}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowInvestModal(true)}
                style={{
                  padding: '12px 28px', borderRadius: 8,
                  background: '#d4a017', border: 'none',
                  color: '#000', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                Invest Now
              </button>
              <button style={{
                padding: '12px 20px', borderRadius: 8,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Log in to TradePro to Buy/Invest
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 120 }}>🪙</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#d4a017', marginTop: 8 }}>
              24K Digital Gold
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              99.9% Purity · Insured Vaults · NABL Certified
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Chart + Calculator ── */}
      <section style={{ background: '#fff', padding: '48px 24px' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 32,
        }}>
          {/* Performance chart */}
          <div style={{
            border: '1px solid #e5e7eb', borderRadius: 16,
            padding: '24px', background: '#fff',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Performance</h3>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Historical gold price (₹/10g)</div>
            {/* Time tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
              {timeTabs.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  style={{
                    padding: '4px 10px', borderRadius: 6,
                    background: activeTab === t ? '#0f1624' : 'transparent',
                    border: '1px solid',
                    borderColor: activeTab === t ? '#0f1624' : '#e5e7eb',
                    color: activeTab === t ? '#fff' : '#6b7280',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.12s',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4a017" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d4a017" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={45} />
                  <Tooltip content={<GoldTooltip />} />
                  <Area
                    type="monotone" dataKey="price"
                    stroke="#d4a017" strokeWidth={2}
                    fill="url(#goldGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
              {[['Current', '₹88,000'], ['1Y Return', '+22.2%'], ['5Y Return', '+151.4%']].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Calculator */}
          <div style={{
            border: '1px solid #e5e7eb', borderRadius: 16,
            padding: '24px', background: '#fff',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 20 }}>Calculate &amp; decide</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                Investment amount (₹)
              </label>
              <input
                type="number"
                value={investAmount}
                onChange={e => setInvestAmount(Number(e.target.value))}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1px solid #e5e7eb', borderRadius: 8,
                  fontSize: 16, fontWeight: 700, color: '#111827',
                  outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                Investment frequency
              </label>
              <div style={{ display: 'flex', gap: 4 }}>
                {freqTabs.map(t => (
                  <button
                    key={t}
                    onClick={() => setFreqTab(t)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8,
                      background: freqTab === t ? '#0f1624' : '#f3f4f6',
                      border: 'none',
                      color: freqTab === t ? '#fff' : '#6b7280',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.12s',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Investment period
                </label>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{period} years</span>
              </div>
              <input
                type="range" min={1} max={20} value={period}
                onChange={e => setPeriod(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#d4a017' }}
              />
            </div>
            <div style={{
              background: '#fef9ec', border: '1px solid #fde68a',
              borderRadius: 10, padding: '16px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 12, color: '#92400e', marginBottom: 4 }}>Estimated invested</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#d97706' }}>
                ₹{estimatedInvested.toLocaleString('en-IN')}
              </div>
            </div>
            <button
              onClick={() => setShowInvestModal(true)}
              style={{
                width: '100%', padding: '13px', borderRadius: 9,
                background: '#0f1624', border: 'none',
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              Invest Now
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 3: Comparison table ── */}
      <section style={{ background: '#f9fafb', padding: '48px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 8, textAlign: 'center' }}>
            Start your gold investment today
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 32 }}>
            See why Digital Gold beats physical gold on every dimension
          </p>
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 16, overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f1624' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Feature</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#d4a017' }}>🪙 Digital Gold</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>🏅 Physical Gold</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#374151' }}>{row.feature}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <span style={{ fontSize: 16, color: row.digital ? '#00b386' : '#e84040' }}>
                        {row.digital ? '✓' : '✗'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <span style={{ fontSize: 16, color: row.physical ? '#00b386' : '#e84040' }}>
                        {row.physical ? '✓' : '✗'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <button
              onClick={() => setShowInvestModal(true)}
              style={{
                padding: '12px 28px', borderRadius: 8,
                background: '#d4a017', border: 'none',
                color: '#000', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Invest Now
            </button>
            <button style={{
              padding: '12px 24px', borderRadius: 8,
              background: 'transparent', border: '1px solid #e5e7eb',
              color: '#374151', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Read More
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 4: Step by step ── */}
      <section style={{ background: '#fff', padding: '48px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 8, textAlign: 'center' }}>
            Investing in Digital Gold made easy
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 40 }}>
            Start your journey in 5 simple steps
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              'Log in to TradePro to begin your investment journey',
              'Enter the amount or weight of gold you want to buy',
              'Choose between a SIP or a one-time investment',
              'Start trading your gold 24 hours a day, 7 days a week',
              'Withdraw anytime, no lock-in period',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', paddingBottom: i < 4 ? 24 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#d4a017',
                    display: 'grid', placeItems: 'center',
                    fontSize: 14, fontWeight: 800, color: '#000',
                  }}>
                    {i + 1}
                  </div>
                  {i < 4 && <div style={{ width: 2, flex: 1, background: '#e5e7eb', minHeight: 20, marginTop: 4 }} />}
                </div>
                <div style={{ paddingTop: 7 }}>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65, margin: 0 }}>{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: FAQ ── */}
      <section style={{ background: '#f9fafb', padding: '48px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 8, textAlign: 'center' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 32 }}>
            Everything you need to know about Digital Gold
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQS.map((faq, i) => (
              <FaqItem key={i} faq={faq} index={i} />
            ))}
          </div>
        </div>
      </section>
      {showInvestModal && <GoldInvestModal onClose={() => setShowInvestModal(false)} />}
    </div>
  )
}

import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { QRCodeSVG } from 'qrcode.react'
import { X, Shield, CreditCard, Smartphone, Building2, CheckCircle2, Lock, Sparkles, ArrowRight } from 'lucide-react'
import { authAPI } from '../services/api'
import CompanyLogo from './CompanyLogo'

const C = {
  green:'#22c55e', greenBg:'rgba(34,197,94,0.12)', red:'#ef4444', redBg:'rgba(239,68,68,0.12)',
  orange:'#e87722', orangeBg:'rgba(232,119,34,0.12)',
  navy:'#0a0e1a', navyCard:'#131a2b',
  blue:'#6366f1', blueBg:'rgba(99,102,241,0.12)',
  text:'#e6edf3', textSub:'#8b949e', textMute:'#545d68',
  border:'rgba(255,255,255,0.08)', borderMd:'rgba(255,255,255,0.12)',
  input:'#1a2236',
}
const f2 = n => Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
const fR = n => '₹'+f2(n)

const SYMBOL_MAP = {
  RELIANCE:'Reliance Industries',TCS:'TCS',HDFCBANK:'HDFC Bank',INFY:'Infosys',
  ICICIBANK:'ICICI Bank',SBIN:'SBI',WIPRO:'Wipro',MARUTI:'Maruti Suzuki',
  NTPC:'NTPC',HCLTECH:'HCL Technologies',BAJFINANCE:'Bajaj Finance',
  TATAMOTORS:'Tata Motors',TITAN:'Titan Company',SUNPHARMA:'Sun Pharma',
  ONGC:'ONGC',LT:'L&T',ASIANPAINT:'Asian Paints',ADANIPOWER:'Adani Power',
}

export default function PaymentModal({ order, onClose, onSuccess }) {
  const { user } = useSelector(s => s.auth)
  const [step, setStep] = useState(1)
  const [payMode, setPayMode] = useState('upi')
  const [upiId, setUpiId] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [loading, setLoading] = useState(false)
  const [orderId] = useState(`TP${Math.random().toString(36).substr(2,8).toUpperCase()}`)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [email, setEmail] = useState('')
  const [devOtpVal, setDevOtpVal] = useState('')

  if (!order) return null

  const total = Number(order.qty||1) * Number(order.ltp||0)
  const stt   = Math.max(1, parseFloat((total * 0.001).toFixed(2)))
  const sebi  = parseFloat(Math.max(0.01, total * 0.000001 * 10).toFixed(2))
  const stamp = parseFloat(Math.max(0.5, total * 0.00015).toFixed(2))
  const charges  = stt + sebi + stamp
  const netAmt   = order.side === 'BUY' ? total + charges : Math.max(0, total - charges)
  const fundsAfter = 145230.50 - (order.side === 'BUY' ? netAmt : -netAmt)
  const symLabel = SYMBOL_MAP[order.sym] || order.sym || 'Unknown'

  // Generate UPI payment string for real QR code
  const upiString = `upi://pay?pa=tradepro@upi&pn=TradePro&am=${netAmt.toFixed(2)}&cu=INR&tn=Buy ${order.qty} ${order.sym}`

  const sendOtp = async (userEmail) => {
    setLoading(true)
    try {
      const res = await authAPI.sendOtp(userEmail)
      setEmail(userEmail)
      setOtpSent(true)
      const otpRespData = res.data?.data ?? res.data
      const devOtp = otpRespData?.devOtp
      if (devOtp) {
        setDevOtpVal(devOtp)
        setOtp(devOtp)
      }
      startCountdown()
    } catch (error) {
      console.error('Failed to send OTP:', error)
    } finally {
      setLoading(false)
    }
  }

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const verifyOtpAndPay = async () => {
    setVerifyingOtp(true)
    try {
      await authAPI.verifyOtp(email, otp)
      processPayment()
    } catch (error) {
      console.error('OTP verification failed:', error)
      setVerifyingOtp(false)
    }
  }

  const processPayment = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep(4)
      onSuccess && onSuccess({ orderId })
    }, 3000)
  }

  const handlePay = () => {
    const userEmail = user?.email || 'user@example.com'
    sendOtp(userEmail)
    setStep(3)
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(16px)',
        display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000}}>
      <style>{`
        @keyframes payIn{from{transform:scale(0.92) translateY(20px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(34,197,94,0.3)}50%{box-shadow:0 0 40px rgba(34,197,94,0.5)}}
      `}</style>
      <div style={{width:'100%',maxWidth:480,background:C.navy,borderRadius:16,
        boxShadow:'0 32px 80px rgba(0,0,0,0.6),0 0 0 1px '+C.border,overflow:'hidden',maxHeight:'92vh',
        overflowY:'auto',animation:'payIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both'}}>

        {/* Header */}
        <div style={{background: step===4 ? C.green : (step===3 ? C.orange : (order.side==='BUY' ? C.green : C.red)),
          padding:'20px 24px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',
          position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:'radial-gradient(circle at 30% 50%,rgba(255,255,255,0.12),transparent)',pointerEvents:'none'}}/>
          <div style={{display:'flex',alignItems:'center',gap:12,position:'relative',zIndex:1,flex:1}}>
            <CompanyLogo symbol={order.sym} name={order.sym} size={40} borderRadius={10} style={{flexShrink:0}} />
            <div style={{flex:1}}>
              <div style={{fontSize:10,fontWeight:800,opacity:0.8,textTransform:'uppercase',letterSpacing:'1.5px',marginBottom:4,
                display:'flex',alignItems:'center',gap:6}}>
                {step===4?<><CheckCircle2 size={13}/> ORDER CONFIRMED</>:step===3?<><Lock size={13}/> SECURE PAYMENT</>:step===2?<><CreditCard size={13}/> PAYMENT METHOD</>:<><Sparkles size={13}/> ORDER REVIEW</>}
              </div>
              <div style={{fontSize:17,fontWeight:800,letterSpacing:'-0.3px'}}>
                {step===4 ? `${order.sym} · Placed` : step===3 ? 'Verify Your Identity' : step===2 ? 'Select Payment' : `${order.side} ${order.qty}× ${order.sym}`}
              </div>
            </div>
          </div>
          {step < 4 && (
            <button onClick={onClose} style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:'50%',
              width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff',flexShrink:0,
              position:'relative',zIndex:1}}>
              <X size={15}/>
            </button>
          )}
        </div>

        {/* Step 1 — Order Summary */}
        {step === 1 && (
          <div style={{padding:24}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
              <CompanyLogo symbol={order.sym} name={symLabel} size={44} borderRadius={10} />
              <div>
                <div style={{fontSize:16,fontWeight:800,color:C.text}}>{symLabel}</div>
                <div style={{fontSize:12,color:C.textSub}}>{order.sym} · {order.exchange || 'NSE'}</div>
              </div>
            </div>
            <div style={{background:C.navyCard,borderRadius:12,padding:16,marginBottom:16,border:`1px solid ${C.border}`}}>
              {[
                {l:'Symbol',v:order.sym,mono:true},{l:'Order Type',v:order.type||'MARKET'},
                {l:'Quantity',v:`${order.qty} shares`},{l:'Price',v:order.type==='MARKET'?'Market Price':fR(order.ltp)},
                null,
                {l:'Estimated Value',v:fR(total),bold:true},{l:'Brokerage',v:'₹0.00',color:C.green},
                {l:'STT',v:fR(stt)},{l:'SEBI Charges',v:`₹${sebi}`},{l:'Stamp Duty',v:`₹${stamp}`},
              ].map((x,i) => !x ? <div key={i} style={{borderTop:`1px solid ${C.border}`,margin:'6px 0'}}/> : (
                <div key={x.l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:12}}>
                  <span style={{color:T.textSub}}>{x.l}</span>
                  <span style={{fontWeight:x.bold?900:700,color:x.color||C.text,fontFamily:x.mono?'monospace':'inherit'}}>{x.v}</span>
                </div>
              ))}
              <div style={{borderTop:`2px solid ${C.border}`,marginTop:8,paddingTop:8,
                display:'flex',justifyContent:'space-between',fontSize:15,fontWeight:900}}>
                <span>Net {order.side==='BUY'?'Payable':'Receivable'}</span>
                <span style={{color:order.side==='BUY'?C.red:C.green,fontFamily:'monospace'}}>{fR(netAmt)}</span>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              <div style={{background:C.greenBg,borderRadius:10,padding:'12px 14px',border:`1px solid ${C.green}33`}}>
                <div style={{fontSize:10,color:C.green,fontWeight:700,marginBottom:3}}>Available Funds</div>
                <div style={{fontSize:16,fontWeight:900,color:C.text,fontFamily:'monospace'}}>₹1,45,230.50</div>
              </div>
              <div style={{background:fundsAfter<0?C.redBg:C.greenBg,borderRadius:10,padding:'12px 14px',
                border:`1px solid ${fundsAfter<0?C.red:C.green}33`}}>
                <div style={{fontSize:10,color:fundsAfter<0?C.red:C.green,fontWeight:700,marginBottom:3}}>Balance After</div>
                <div style={{fontSize:16,fontWeight:900,color:C.text,fontFamily:'monospace'}}>
                  {fundsAfter<0?'-':''}{fR(Math.abs(fundsAfter))}
                </div>
              </div>
            </div>
            <button onClick={()=>setStep(2)} style={{width:'100%',padding:'14px 0',borderRadius:10,
              background:order.side==='BUY'?C.green:C.red,
              color:'#fff',fontWeight:800,fontSize:14,border:'none',cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              Proceed to Payment <ArrowRight size={16}/>
            </button>
          </div>
        )}

        {/* Step 2 — Payment Methods */}
        {step === 2 && (
          <div style={{padding:24}}>
            <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:14}}>Select Payment Method</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:20}}>
              {[
                {id:'upi',l:'UPI',icon:<Smartphone size={20}/>},
                {id:'card',l:'Card',icon:<CreditCard size={20}/>},
                {id:'netbanking',l:'Net Banking',icon:<Building2 size={20}/>},
              ].map(m=>(
                <button key={m.id} onClick={()=>setPayMode(m.id)} style={{
                  padding:'16px 12px',borderRadius:12,
                  fontSize:12,fontWeight:700,border:`2px solid ${payMode===m.id?C.orange:C.border}`,
                  background:payMode===m.id?C.orangeBg:C.navyCard,
                  color:payMode===m.id?C.orange:C.textSub,cursor:'pointer',
                  display:'flex',flexDirection:'column',alignItems:'center',gap:8,
                  transition:'all 0.2s'}}>
                  <div style={{padding:8,borderRadius:8,background:payMode===m.id?C.orange:C.border,color:payMode===m.id?'#fff':C.orange}}>
                    {m.icon}
                  </div>
                  {m.l}
                </button>
              ))}
            </div>

            {payMode==='upi' && (
              <div style={{background:C.navyCard,borderRadius:12,padding:20,border:`1px solid ${C.border}`,marginBottom:16,textAlign:'center'}}>
                {/* Real QR Code */}
                <div style={{width:180,height:180,margin:'0 auto 14px',border:`3px solid ${C.orange}`,borderRadius:14,
                  padding:12,background:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <QRCodeSVG
                    value={upiString}
                    size={140}
                    bgColor="#ffffff"
                    fgColor="#0a0e1a"
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div style={{fontSize:11,color:C.textSub,marginBottom:12}}>Scan with GPay, PhonePe, Paytm or BHIM</div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                  <div style={{flex:1,height:1,background:C.border}}/><span style={{fontSize:11,color:C.textMute,fontWeight:700}}>OR</span>
                  <div style={{flex:1,height:1,background:C.border}}/>
                </div>
                <input
                  value={upiId}
                  onChange={e=>setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  style={{width:'100%',padding:'12px 14px',borderRadius:8,border:`1px solid ${C.border}`,
                    fontSize:13,outline:'none',background:C.input,color:C.text,textAlign:'center',boxSizing:'border-box'}}
                />
              </div>
            )}

            {payMode==='card' && (
              <div style={{background:C.navyCard,borderRadius:12,padding:16,border:`1px solid ${C.border}`,marginBottom:16}}>
                <div style={{marginBottom:12}}>
                  <label style={{fontSize:10,fontWeight:700,color:C.textMute,display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:0.4}}>Card Number</label>
                  <input
                    value={cardNumber}
                    onChange={e=>setCardNumber(e.target.value.replace(/\D/g,'').slice(0,16))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    style={{width:'100%',padding:'10px 12px',borderRadius:8,border:`1px solid ${C.border}`,
                      fontSize:13,outline:'none',background:C.input,color:C.text,letterSpacing:2,fontFamily:'monospace',boxSizing:'border-box'}}
                  />
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div>
                    <label style={{fontSize:10,fontWeight:700,color:C.textMute,display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:0.4}}>Expiry</label>
                    <input
                      value={cardExpiry}
                      onChange={e=>setCardExpiry(e.target.value.replace(/\D/g,'').slice(0,4))}
                      placeholder="MM/YY" maxLength={5}
                      style={{width:'100%',padding:'10px 12px',borderRadius:8,border:`1px solid ${C.border}`,
                        fontSize:13,outline:'none',background:C.input,color:C.text,fontFamily:'monospace',boxSizing:'border-box'}}
                    />
                  </div>
                  <div>
                    <label style={{fontSize:10,fontWeight:700,color:C.textMute,display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:0.4}}>CVV</label>
                    <input
                      value={cardCvv}
                      onChange={e=>setCardCvv(e.target.value.replace(/\D/g,'').slice(0,3))}
                      placeholder="123" type="password" maxLength={3}
                      style={{width:'100%',padding:'10px 12px',borderRadius:8,border:`1px solid ${C.border}`,
                        fontSize:13,outline:'none',background:C.input,color:C.text,fontFamily:'monospace',boxSizing:'border-box'}}
                    />
                  </div>
                </div>
              </div>
            )}

            {payMode==='netbanking' && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
                {['HDFC Bank','SBI','ICICI Bank','Axis Bank','Kotak Bank','PNB','Bank of Baroda','Canara Bank'].map(b=>(
                  <div key={b} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:'12px 10px',
                    cursor:'pointer',fontSize:12,fontWeight:700,color:C.text,textAlign:'center',transition:'all .15s',
                    background:C.navyCard}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.orange;e.currentTarget.style.background=C.orangeBg}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.navyCard}}>{b}</div>
                ))}
              </div>
            )}

            <div style={{background:C.blueBg,borderRadius:10,padding:'12px 14px',marginBottom:16,
              border:`1px solid ${C.blue}33`,display:'flex',alignItems:'center',gap:10}}>
              <Shield size={16} color={C.blue} style={{flexShrink:0}}/>
              <span style={{fontSize:11,color:C.text,fontWeight:600}}>256-bit SSL · SEBI Compliant · RBI Regulated</span>
            </div>
            <button onClick={handlePay} disabled={loading} style={{width:'100%',padding:'14px 0',borderRadius:10,
              background:loading?C.textMute:C.orange,
              color:'#fff',fontWeight:800,fontSize:14,border:'none',cursor:loading?'not-allowed':'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:8,
              transition:'all 0.2s'}}>
              {loading
                ? <><span style={{display:'inline-block',animation:'spin 1s linear infinite',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',width:16,height:16}}/>Processing…</>
                : <>Pay {fR(netAmt)} <ArrowRight size={16}/></>}
            </button>
          </div>
        )}

        {/* Step 3 — OTP Verification */}
        {step === 3 && (
          <div style={{padding:24}}>
            <div style={{textAlign:'center',marginBottom:20}}>
              <div style={{width:56,height:56,borderRadius:'50%',background:C.orangeBg,border:`2px solid ${C.orange}`,
                display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',animation:'float 3s ease-in-out infinite'}}>
                <Lock size={24} color={C.orange}/>
              </div>
              <p style={{color:C.textSub,fontSize:13,lineHeight:1.6}}>
                We've sent a <strong style={{color:C.text}}>6-digit OTP</strong> to verify your identity
              </p>
              <p style={{color:C.orange,fontSize:13,fontWeight:700,marginTop:4}}>
                {email || user?.email || 'your email'}
              </p>
            </div>

            {devOtpVal && (
              <div style={{padding:'8px 12px',borderRadius:8,background:C.purpleDim,border:`1px solid rgba(139,92,246,0.25)`,
                fontSize:12,color:'#8b5cf6',lineHeight:1.5,textAlign:'center',marginBottom:8}}>
                ⚠️ Dev mode — OTP: <strong>{devOtpVal}</strong>
              </div>
            )}

            <div style={{display:'flex',gap:8,marginBottom:16,justifyContent:'center'}}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  type="text" maxLength={1}
                  style={{
                    width:44, height:52, textAlign:'center', fontSize:20, fontWeight:700,
                    background:C.input, border:`1px solid ${C.border}`, borderRadius:8,
                    color:C.text, outline:'none', transition:'border-color 0.15s', fontFamily:'monospace',
                  }}
                  value={otp[index] || ''}
                  onChange={(e) => {
                    const newOtp = otp.split('')
                    newOtp[index] = e.target.value
                    setOtp(newOtp.join(''))
                    if (e.target.value && index < 5) {
                      e.target.nextElementSibling?.focus()
                    }
                  }}
                  onFocus={e=>e.currentTarget.style.borderColor=C.orange}
                  onBlur={e=>e.currentTarget.style.borderColor=C.border}
                />
              ))}
            </div>

            <button
              onClick={verifyOtpAndPay}
              disabled={otp.length !== 6 || verifyingOtp}
              style={{
                width:'100%', padding:'14px 0', borderRadius:10,
                background:otp.length === 6 && !verifyingOtp ? C.orange : C.textMute,
                color:'#fff', fontWeight:800, fontSize:14, border:'none',
                cursor:otp.length === 6 && !verifyingOtp ? 'pointer' : 'not-allowed',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                transition:'all 0.2s',
              }}
            >
              {verifyingOtp
                ? <><span style={{display:'inline-block',animation:'spin 1s linear infinite',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',width:16,height:16}}/>Verifying…</>
                : <>Verify & Pay <ArrowRight size={16}/></>}
            </button>

            <div style={{textAlign:'center',marginTop:14}}>
              {countdown > 0 ? (
                <p style={{color:C.textSub,fontSize:12}}>
                  Resend OTP in <span style={{color:C.orange,fontWeight:700}}>{countdown}s</span>
                </p>
              ) : (
                <button onClick={() => sendOtp(email)} style={{
                  background:'none',border:'none',color:C.orange,fontSize:12,fontWeight:600,cursor:'pointer',padding:'6px 12px',borderRadius:6,
                }}>Resend OTP</button>
              )}
            </div>
          </div>
        )}

        {/* Step 4 — Success */}
        {step === 4 && (
          <div style={{padding:32,textAlign:'center'}}>
            <div style={{width:80,height:80,borderRadius:'50%',background:C.greenBg,border:`4px solid ${C.green}`,
              display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',animation:'glow 2s ease-in-out infinite'}}>
              <CheckCircle2 size={40} color={C.green}/>
            </div>
            <h2 style={{fontSize:22,fontWeight:900,color:C.text,marginBottom:8,letterSpacing:'-0.3px'}}>Order Confirmed!</h2>
            <p style={{fontSize:13,color:C.textSub,lineHeight:1.6,marginBottom:20}}>
              Your {order.side.toLowerCase()} order for <strong style={{color:C.text}}>{order.qty} shares</strong> of <strong style={{color:C.text}}>{symLabel}</strong> has been placed.
            </p>
            <div style={{background:C.navyCard,borderRadius:10,padding:'16px 20px',marginBottom:20,textAlign:'left',border:`1px solid ${C.border}`}}>
              {[
                {l:'Order ID',v:orderId,color:C.orange},{l:'Amount',v:fR(netAmt)},
                {l:'Side',v:order.side},{l:'Status',v:'EXECUTED',color:C.green},
                {l:'Settlement',v:'T+1'},
              ].map(x=>(
                <div key={x.l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${C.border}`,fontSize:12}}>
                  <span style={{color:C.textMute}}>{x.l}</span>
                  <span style={{fontWeight:800,color:x.color||C.text,fontFamily:'monospace'}}>{x.v}</span>
                </div>
              ))}
            </div>
            <button onClick={onClose} style={{width:'100%',padding:'14px 0',borderRadius:10,
              background:C.orange,color:'#fff',fontWeight:800,fontSize:14,border:'none',cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              Done <ArrowRight size={16}/>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

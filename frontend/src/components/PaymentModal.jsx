import React, { useState, useEffect, useRef } from 'react'
import { X, Shield, CreditCard, Smartphone, Building2, CheckCircle2, Lock, Sparkles, ArrowRight } from 'lucide-react'
import { authAPI } from '../services/api'

const C = {
  green:'#00B386', greenBg:'#E6F9F4', red:'#E84040', redBg:'#FEF0F0',
  navy:'#111A3A', blue:'#2563EB', blueBg:'#EEF3FF',
  gray50:'#F8F9FB', gray100:'#F1F3F6', gray200:'#E4E7EC',
  gray400:'#9AA3B2', gray600:'#5A6478', gray800:'#1E2636',
  accent:'#6366f1', accentGlow:'rgba(99,102,241,0.3)',
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
  const [step, setStep] = useState(1)
  const [payMode, setPayMode] = useState('card')
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
  const modalRef = useRef(null)

  if (!order) return null

  const total = Number(order.qty||1) * Number(order.ltp||0)
  const stt   = Math.max(1, parseFloat((total * 0.001).toFixed(2)))
  const sebi  = parseFloat(Math.max(0.01, total * 0.000001 * 10).toFixed(2))
  const stamp = parseFloat(Math.max(0.5, total * 0.00015).toFixed(2))
  const charges  = stt + sebi + stamp
  const netAmt   = order.side === 'BUY' ? total + charges : Math.max(0, total - charges)
  const fundsAfter = 145230.50 - (order.side === 'BUY' ? netAmt : -netAmt)
  const symLabel = SYMBOL_MAP[order.sym] || order.sym || 'Unknown'

  const sendOtp = async (userEmail) => {
    setLoading(true)
    try {
      await authAPI.sendOtp(userEmail)
      setEmail(userEmail)
      setOtpSent(true)
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
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const verifyOtpAndPay = async () => {
    setVerifyingOtp(true)
    try {
      await authAPI.verifyOtp(email, otp)
      // Proceed with payment after OTP verification
      processPayment()
    } catch (error) {
      console.error('OTP verification failed:', error)
      setVerifyingOtp(false)
    }
  }

  const processPayment = () => {
    setLoading(true)
    setTimeout(() => { 
      setLoading(false); 
      setStep(4); 
      onSuccess && onSuccess({ orderId }) 
    }, 3000)
  }

  const handlePay = () => {
    // First send OTP before payment
    const userEmail = 'user@example.com' // In real app, get from auth state
    sendOtp(userEmail)
    setStep(3)
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(12px)',
        display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000}}>
      <style>{`
        @keyframes payIn{from{transform:scale(0.9) translateY(30px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px ${C.accentGlow}}50%{box-shadow:0 0 40px ${C.accentGlow},0 0 60px ${C.accentGlow}}}
      `}</style>
      <div ref={modalRef} style={{width:'100%',maxWidth:500,background:'#0f0f12',borderRadius:20,
        boxShadow:'0 32px 80px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.1)',overflow:'hidden',maxHeight:'92vh',
        overflowY:'auto',animation:'payIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both'}}>

        {/* Header */}
        <div style={{background:step===4?C.green:(step===3?C.accent:(order.side==='BUY'?C.green:C.red)),
          padding:'24px 28px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',
          position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:'radial-gradient(circle at 30% 50%,rgba(255,255,255,0.1),transparent)',pointerEvents:'none'}}/>
          <div style={{color:'#fff',position:'relative',zIndex:1}}>
            <div style={{fontSize:11,fontWeight:800,opacity:0.8,textTransform:'uppercase',letterSpacing:'1.5px',marginBottom:6,
              display:'flex',alignItems:'center',gap:8}}>
              {step===4?<><CheckCircle2 size={14}/> ORDER CONFIRMED</>:step===3?<><Lock size={14}/> SECURE PAYMENT</>:step===2?<><CreditCard size={14}/> PAYMENT METHOD</>:<><Sparkles size={14}/> ORDER REVIEW</>}
            </div>
            <div style={{fontSize:20,fontWeight:900,letterSpacing:'-0.5px'}}>
              {step===4 ? `${order.sym} · Placed Successfully` : step===3 ? 'Verify Your Identity' : step===2 ? 'Select Payment Method' : `${order.side} ${order.qty} × ${order.sym}`}
            </div>
          </div>
          {step < 4 && (
            <button onClick={onClose} style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:'50%',
              width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff',flexShrink:0,
              position:'relative',zIndex:1,transition:'all 0.2s'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.25)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
              <X size={16}/>
            </button>
          )}
        </div>

        {/* Step 1 — Order Summary */}
        {step === 1 && (
          <div style={{padding:28}}>
            <div style={{background:'#111115',borderRadius:12,padding:20,marginBottom:20,border:'1px solid #1f1f27'}}>
              {[
                {l:'Symbol',v:order.sym,mono:true},{l:'Order Type',v:order.type||'MARKET'},
                {l:'Quantity',v:`${order.qty} shares`},{l:'Price',v:order.type==='MARKET'?'Market Price':fR(order.ltp)},
                null,
                {l:'Estimated Value',v:fR(total),bold:true},{l:'Brokerage',v:'₹0.00 (Zero Brokerage)',color:C.green},
                {l:'STT',v:fR(stt)},{l:'SEBI Charges',v:`₹${sebi}`},{l:'Stamp Duty',v:`₹${stamp}`},
              ].map((x,i) => !x ? <div key={i} style={{borderTop:`1px solid ${C.gray200}`,margin:'8px 0'}}/> : (
                <div key={x.l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:13}}>
                  <span style={{color:C.gray600}}>{x.l}</span>
                  <span style={{fontWeight:x.bold?900:700,color:x.color||'#f4f4f6',fontFamily:x.mono?'monospace':'inherit'}}>{x.v}</span>
                </div>
              ))}
              <div style={{borderTop:`2px solid ${C.gray200}`,marginTop:12,paddingTop:12,
                display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:900}}>
                <span>Net {order.side==='BUY'?'Payable':'Receivable'}</span>
                <span style={{color:order.side==='BUY'?C.red:C.green,fontFamily:'monospace'}}>{fR(netAmt)}</span>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
              <div style={{background:'rgba(34,197,94,0.1)',borderRadius:12,padding:'14px 16px',border:'1px solid ' + C.green}}>
                <div style={{fontSize:11,color:C.green,fontWeight:700,marginBottom:4}}>Available Funds</div>
                <div style={{fontSize:18,fontWeight:900,color:'#f4f4f6',fontFamily:'monospace'}}>₹1,45,230.50</div>
              </div>
              <div style={{background:fundsAfter<0?'rgba(239,68,68,0.1)':'rgba(34,197,94,0.1)',borderRadius:12,padding:'14px 16px',
                border:`1px solid ${fundsAfter<0?C.red:C.green}`}}>
                <div style={{fontSize:11,color:fundsAfter<0?C.red:C.green,fontWeight:700,marginBottom:4}}>Balance After</div>
                <div style={{fontSize:18,fontWeight:900,color:'#f4f4f6',fontFamily:'monospace'}}>
                  {fundsAfter<0?'-':''}{fR(Math.abs(fundsAfter))}
                </div>
              </div>
            </div>
            <button onClick={()=>setStep(2)} style={{width:'100%',padding:'16px 0',borderRadius:12,
              background:order.side==='BUY'?`linear-gradient(135deg,${C.green},#059669)`:`linear-gradient(135deg,${C.red},#dc2626)`,
              color:'#fff',fontWeight:800,fontSize:15,border:'none',cursor:'pointer',letterSpacing:'0.5px',
              boxShadow:`0 0 30px ${order.side==='BUY'?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`,
              transition:'all 0.3s'}}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
              Proceed to Payment <ArrowRight size={18} style={{marginLeft:8}}/>
            </button>
          </div>
        )}

        {/* Step 2 — Payment Methods */}
        {step === 2 && (
          <div style={{padding:28}}>
            <div style={{fontSize:14,fontWeight:800,color:'#f4f4f6',marginBottom:16}}>Select Payment Method</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:24}}>
              {[
                {id:'card',l:'Credit/Debit Card',icon:<CreditCard size={24}/>},
                {id:'upi',l:'UPI',icon:<Smartphone size={24}/>},
                {id:'netbanking',l:'Net Banking',icon:<Building2 size={24}/>},
              ].map(m=>(
                <button key={m.id} onClick={()=>setPayMode(m.id)} style={{
                  padding:'20px 16px',borderRadius:16,
                  fontSize:13,fontWeight:700,border:`2px solid ${payMode===m.id?C.accent:'#1f1f27'}`,
                  background:payMode===m.id?`rgba(99,102,241,0.15)`:'#111115',
                  color:payMode===m.id?C.accent:'#8b8b9e',cursor:'pointer',
                  display:'flex',flexDirection:'column',alignItems:'center',gap:12,
                  transition:'all 0.3s',boxShadow:payMode===m.id?`0 0 30px ${C.accentGlow}`:'none'}}
                  onMouseEnter={e=>e.currentTarget.style.transform='translateY(-4px)'}
                  onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                  <div style={{padding:12,borderRadius:12,background:payMode===m.id?C.accent:'#1f1f27',color:payMode===m.id?'#fff':C.accent}}>
                    {m.icon}
                  </div>
                  {m.l}
                </button>
              ))}
            </div>

            {payMode==='card' && (
              <div style={{background:'#111115',borderRadius:12,padding:20,border:'1px solid #1f1f27',marginBottom:20}}>
                <div style={{marginBottom:16}}>
                  <label style={{fontSize:11,fontWeight:700,color:'#52525f',display:'block',marginBottom:8}}>Card Number</label>
                  <input 
                    value={cardNumber}
                    onChange={e=>setCardNumber(e.target.value.replace(/\D/g,'').slice(0,16))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    style={{width:'100%',padding:'14px 16px',borderRadius:10,border:'1.5px solid #1f1f27',
                      fontSize:15,outline:'none',background:'#0f0f12',color:'#f4f4f6',letterSpacing:2,fontFamily:'monospace'}}
                  />
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div>
                    <label style={{fontSize:11,fontWeight:700,color:'#52525f',display:'block',marginBottom:8}}>Expiry Date</label>
                    <input 
                      value={cardExpiry}
                      onChange={e=>setCardExpiry(e.target.value.replace(/\D/g,'').slice(0,4))}
                      placeholder="MM/YY"
                      maxLength={5}
                      style={{width:'100%',padding:'14px 16px',borderRadius:10,border:'1.5px solid #1f1f27',
                        fontSize:15,outline:'none',background:'#0f0f12',color:'#f4f4f6',fontFamily:'monospace'}}
                    />
                  </div>
                  <div>
                    <label style={{fontSize:11,fontWeight:700,color:'#52525f',display:'block',marginBottom:8}}>CVV</label>
                    <input 
                      value={cardCvv}
                      onChange={e=>setCardCvv(e.target.value.replace(/\D/g,'').slice(0,3))}
                      placeholder="123"
                      type="password"
                      maxLength={3}
                      style={{width:'100%',padding:'14px 16px',borderRadius:10,border:'1.5px solid #1f1f27',
                        fontSize:15,outline:'none',background:'#0f0f12',color:'#f4f4f6',fontFamily:'monospace'}}
                    />
                  </div>
                </div>
              </div>
            )}

            {payMode==='upi' && (
              <div style={{background:'#111115',borderRadius:12,padding:24,border:'1px solid #1f1f27',marginBottom:20,textAlign:'center'}}>
                <div style={{width:160,height:160,margin:'0 auto 16px',border:`3px solid ${C.accent}`,borderRadius:16,
                  padding:12,display:'grid',gridTemplateColumns:'repeat(9,1fr)',gap:2,background:'#0f0f12'}}>
                  {Array.from({length:81}).map((_,i)=>{
                    const c=[0,1,2,3,4,5,6,9,15,18,19,20,21,22,23,24,27,33,54,60,63,64,65,66,67,68,69,72,78]
                    return <div key={i} style={{background:c.includes(i)||(i>35&&i<45)||(i%9>1&&i%9<7&&(i*7+3)%4===0)?C.accent:'transparent',borderRadius:1}}/>
                  })}
                </div>
                <div style={{fontSize:12,color:'#8b8b9e',marginBottom:16}}>Scan with GPay, PhonePe, Paytm or BHIM</div>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                  <div style={{flex:1,height:1,background:'#1f1f27'}}/><span style={{fontSize:12,color:'#52525f',fontWeight:700}}>OR</span>
                  <div style={{flex:1,height:1,background:'#1f1f27'}}/>
                </div>
                <input 
                  value={upiId}
                  onChange={e=>setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  style={{width:'100%',padding:'14px 16px',borderRadius:10,border:'1.5px solid #1f1f27',
                    fontSize:14,outline:'none',background:'#0f0f12',color:'#f4f4f6',textAlign:'center'}}
                />
              </div>
            )}

            {payMode==='netbanking' && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
                {['HDFC Bank','SBI','ICICI Bank','Axis Bank','Kotak Bank','Punjab National','Bank of Baroda','Canara Bank'].map(b=>(
                  <div key={b} style={{border:`1.5px solid #1f1f27`,borderRadius:10,padding:'14px 16px',
                    cursor:'pointer',fontSize:13,fontWeight:700,color:'#f4f4f6',textAlign:'center',transition:'all .2s',
                    background:'#111115'}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.background=`rgba(99,102,241,0.1)`}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='#1f1f27';e.currentTarget.style.background='#111115'}}>{b}</div>
                ))}
              </div>
            )}

            <div style={{background:'rgba(99,102,241,0.1)',borderRadius:12,padding:'14px 18px',marginBottom:20,
              border:'1px solid ' + C.accent,display:'flex',alignItems:'center',gap:12}}>
              <Shield size={18} color={C.accent} style={{flexShrink:0}}/>
              <span style={{fontSize:12,color:'#f4f4f6',fontWeight:600}}>256-bit SSL · SEBI Compliant · RBI Regulated</span>
            </div>
            <button onClick={handlePay} disabled={loading} style={{width:'100%',padding:'16px 0',borderRadius:12,
              background:loading?'#363643':`linear-gradient(135deg,${C.accent},#8b5cf6)`,
              color:'#fff',fontWeight:800,fontSize:15,border:'none',cursor:loading?'not-allowed':'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:10,
              boxShadow:loading?'none':`0 0 40px ${C.accentGlow}`,
              transition:'all 0.3s'}}>
              {loading
                ? <><span style={{display:'inline-block',animation:'spin 1s linear infinite',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',width:18,height:18}}/>Processing Payment…</>
                : <>Pay {fR(netAmt)} <ArrowRight size={18}/></>}
            </button>
          </div>
        )}

        {/* Step 3 — OTP Verification */}
        {step === 3 && (
          <div style={{padding:28}}>
            <div style={{textAlign:'center',marginBottom:24}}>
              <Lock size={56} style={{color:C.accent,marginBottom:16,animation:'float 3s ease-in-out infinite'}}/>
              <p style={{color:'#8b8b9e',fontSize:14,lineHeight:1.6}}>
                For your security, we've sent a <strong>6-digit OTP</strong> to your registered email
              </p>
              <p style={{color:'#f4f4f6',fontSize:13,fontWeight:600,marginTop:8}}>
                {email || 'user@example.com'}
              </p>
            </div>

            <div style={{display:'flex',gap:10,marginBottom:20,justifyContent:'center'}}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  style={{
                    width:52,
                    height:64,
                    textAlign:'center',
                    fontSize:28,
                    fontWeight:700,
                    background:'#0f0f12',
                    border:'2px solid #1f1f27',
                    borderRadius:12,
                    color:'#f4f4f6',
                    outline:'none',
                    transition:'all 0.2s',
                    fontFamily:'monospace',
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
                  onFocus={e=>e.currentTarget.style.borderColor=C.accent}
                  onBlur={e=>e.currentTarget.style.borderColor='#1f1f27'}
                />
              ))}
            </div>

            <button 
              onClick={verifyOtpAndPay}
              disabled={otp.length !== 6 || verifyingOtp}
              style={{
                width:'100%',
                padding:'16px 0',
                borderRadius:12,
                background:otp.length === 6 && !verifyingOtp ? `linear-gradient(135deg,${C.accent},#8b5cf6)` : '#363643',
                color:'#fff',
                fontWeight:800,
                fontSize:15,
                border:'none',
                cursor:otp.length === 6 && !verifyingOtp ? 'pointer' : 'not-allowed',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:10,
                boxShadow:otp.length === 6 && !verifyingOtp ? `0 0 40px ${C.accentGlow}` : 'none',
                transition:'all 0.3s',
              }}
            >
              {verifyingOtp
                ? <><span style={{display:'inline-block',animation:'spin 1s linear infinite',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',width:18,height:18}}/>Verifying OTP…</>
                : <>Verify & Complete Payment <ArrowRight size={18}/></>}
            </button>

            <div style={{textAlign:'center',marginTop:20}}>
              {countdown > 0 ? (
                <p style={{color:'#8b8b9e',fontSize:13}}>
                  Resend OTP in <span style={{color:C.accent,fontWeight:700}}>{countdown}s</span>
                </p>
              ) : (
                <button
                  onClick={() => sendOtp(email)}
                  style={{
                    background:'none',
                    border:'none',
                    color:C.accent,
                    fontSize:13,
                    fontWeight:600,
                    cursor:'pointer',
                    padding:'8px 16px',
                    borderRadius:8,
                    transition:'all 0.2s',
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background=`rgba(99,102,241,0.1)`}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 4 — Success */}
        {step === 4 && (
          <div style={{padding:36,textAlign:'center'}}>
            <div style={{width:88,height:88,borderRadius:'50%',background:'rgba(34,197,94,0.15)',border:'4px solid ' + C.green,
              display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',animation:'glow 2s ease-in-out infinite'}}>
              <CheckCircle2 size={48} color={C.green}/>
            </div>
            <h2 style={{fontSize:26,fontWeight:900,color:'#f4f4f6',marginBottom:10,letterSpacing:'-0.5px'}}>Order Confirmed!</h2>
            <p style={{fontSize:14,color:'#8b8b9e',lineHeight:1.7,marginBottom:24}}>
              Your {order.side.toLowerCase()} order for <strong>{order.qty} shares</strong> of <strong>{symLabel}</strong> has been placed successfully.
            </p>
            <div style={{background:'#111115',borderRadius:12,padding:'20px 24px',marginBottom:24,textAlign:'left',border:'1px solid #1f1f27'}}>
              {[
                {l:'Order ID',v:orderId,color:C.accent},{l:'Amount',v:fR(netAmt)},
                {l:'Order Side',v:order.side},{l:'Status',v:'EXECUTED ✓',color:C.green},
                {l:'Settlement',v:'T+1 · Next Trading Day'},
              ].map(x=>(
                <div key={x.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid #1f1f27`,fontSize:13}}>
                  <span style={{color:'#52525f'}}>{x.l}</span>
                  <span style={{fontWeight:800,color:x.color||'#f4f4f6',fontFamily:'monospace'}}>{x.v}</span>
                </div>
              ))}
            </div>
            <button onClick={onClose} style={{width:'100%',padding:'16px 0',borderRadius:12,
              background:`linear-gradient(135deg,${C.accent},#8b5cf6)`,
              color:'#fff',fontWeight:800,fontSize:15,border:'none',cursor:'pointer',
              boxShadow:`0 0 40px ${C.accentGlow}`,transition:'all 0.3s'}}>
              Done <ArrowRight size={18} style={{marginLeft:8}}/>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

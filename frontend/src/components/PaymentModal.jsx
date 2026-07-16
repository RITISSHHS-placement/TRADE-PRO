import React, { useState } from 'react'
import { X, Shield } from 'lucide-react'

const C = {
  green:'#00B386', greenBg:'#E6F9F4', red:'#E84040', redBg:'#FEF0F0',
  navy:'#111A3A', blue:'#2563EB', blueBg:'#EEF3FF',
  gray50:'#F8F9FB', gray100:'#F1F3F6', gray200:'#E4E7EC',
  gray400:'#9AA3B2', gray600:'#5A6478', gray800:'#1E2636',
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
  const [payMode, setPayMode] = useState('upi')
  const [upiId, setUpiId] = useState('')
  const [loading, setLoading] = useState(false)
  const [orderId] = useState(`TP${Math.random().toString(36).substr(2,8).toUpperCase()}`)

  if (!order) return null

  const total = Number(order.qty||1) * Number(order.ltp||0)
  const stt   = Math.max(1, parseFloat((total * 0.001).toFixed(2)))
  const sebi  = parseFloat(Math.max(0.01, total * 0.000001 * 10).toFixed(2))
  const stamp = parseFloat(Math.max(0.5, total * 0.00015).toFixed(2))
  const charges  = stt + sebi + stamp
  const netAmt   = order.side === 'BUY' ? total + charges : Math.max(0, total - charges)
  const fundsAfter = 145230.50 - (order.side === 'BUY' ? netAmt : -netAmt)
  const symLabel = SYMBOL_MAP[order.sym] || order.sym || 'Unknown'

  const handlePay = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); setStep(3); onSuccess && onSuccess({ orderId }) }, 2400)
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(10px)',
        display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000}}>
      <style>{`
        @keyframes payIn{from{transform:scale(0.9) translateY(30px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
      <div style={{width:'100%',maxWidth:460,background:'#fff',borderRadius:18,
        boxShadow:'0 24px 64px rgba(0,0,0,0.25)',overflow:'hidden',maxHeight:'92vh',
        overflowY:'auto',animation:'payIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both'}}>

        {/* Header */}
        <div style={{background:step===3?C.green:(order.side==='BUY'?C.green:C.red),
          padding:'18px 20px',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div style={{color:'#fff'}}>
            <div style={{fontSize:10,fontWeight:800,opacity:0.75,textTransform:'uppercase',letterSpacing:'1px',marginBottom:4}}>
              {step===3?'✓ ORDER CONFIRMED':step===2?'🔒 SECURE PAYMENT':'ORDER REVIEW'}
            </div>
            <div style={{fontSize:17,fontWeight:900}}>
              {step===3 ? `${order.sym} · Placed Successfully` : `${order.side} ${order.qty} × ${order.sym}`}
            </div>
          </div>
          {step < 3 && (
            <button onClick={onClose} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'50%',
              width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff',flexShrink:0}}>
              <X size={14}/>
            </button>
          )}
        </div>

        {/* Step 1 — Order Summary */}
        {step === 1 && (
          <div style={{padding:24}}>
            <div style={{background:C.gray50,borderRadius:10,padding:16,marginBottom:16}}>
              {[
                {l:'Symbol',v:order.sym,mono:true},{l:'Order Type',v:order.type||'MARKET'},
                {l:'Quantity',v:`${order.qty} shares`},{l:'Price',v:order.type==='MARKET'?'Market Price':fR(order.ltp)},
                null,
                {l:'Estimated Value',v:fR(total),bold:true},{l:'Brokerage',v:'₹0.00 (Zero Brokerage)',color:C.green},
                {l:'STT',v:fR(stt)},{l:'SEBI Charges',v:`₹${sebi}`},{l:'Stamp Duty',v:`₹${stamp}`},
              ].map((x,i) => !x ? <div key={i} style={{borderTop:`1px solid ${C.gray200}`,margin:'6px 0'}}/> : (
                <div key={x.l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:12.5}}>
                  <span style={{color:C.gray600}}>{x.l}</span>
                  <span style={{fontWeight:x.bold?900:700,color:x.color||C.gray800,fontFamily:x.mono?'monospace':'inherit'}}>{x.v}</span>
                </div>
              ))}
              <div style={{borderTop:`2px solid ${C.gray200}`,marginTop:8,paddingTop:10,
                display:'flex',justifyContent:'space-between',fontSize:14,fontWeight:900}}>
                <span>Net {order.side==='BUY'?'Payable':'Receivable'}</span>
                <span style={{color:order.side==='BUY'?C.red:C.green,fontFamily:'monospace'}}>{fR(netAmt)}</span>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              <div style={{background:'#f0fdf4',borderRadius:8,padding:'10px 12px',border:'1px solid #bbf7d0'}}>
                <div style={{fontSize:10,color:'#15803d',fontWeight:700}}>Available Funds</div>
                <div style={{fontSize:15,fontWeight:900,color:'#166534',fontFamily:'monospace',marginTop:2}}>₹1,45,230.50</div>
              </div>
              <div style={{background:fundsAfter<0?'#fef2f2':'#f0fdf4',borderRadius:8,padding:'10px 12px',
                border:`1px solid ${fundsAfter<0?'#fecaca':'#bbf7d0'}`}}>
                <div style={{fontSize:10,color:fundsAfter<0?C.red:'#15803d',fontWeight:700}}>Balance After</div>
                <div style={{fontSize:15,fontWeight:900,color:fundsAfter<0?C.red:'#166534',fontFamily:'monospace',marginTop:2}}>
                  {fundsAfter<0?'-':''}{fR(Math.abs(fundsAfter))}
                </div>
              </div>
            </div>
            <button onClick={()=>setStep(2)} style={{width:'100%',padding:'14px 0',borderRadius:10,
              background:order.side==='BUY'?`linear-gradient(135deg,${C.green},#059669)`:`linear-gradient(135deg,${C.red},#dc2626)`,
              color:'#fff',fontWeight:800,fontSize:14,border:'none',cursor:'pointer',letterSpacing:'0.5px'}}>
              Proceed to Payment →
            </button>
          </div>
        )}

        {/* Step 2 — Payment Methods */}
        {step === 2 && (
          <div style={{padding:24}}>
            <div style={{fontSize:13,fontWeight:800,color:C.gray800,marginBottom:14}}>Select Payment Method</div>
            <div style={{display:'flex',gap:8,marginBottom:20}}>
              {[{id:'upi',l:'UPI',icon:'📱'},{id:'netbanking',l:'Net Banking',icon:'🏦'},{id:'card',l:'Card',icon:'💳'}].map(m=>(
                <button key={m.id} onClick={()=>setPayMode(m.id)} style={{flex:1,padding:'9px 6px',borderRadius:8,
                  fontSize:11,fontWeight:700,border:`2px solid ${payMode===m.id?C.blue:C.gray200}`,
                  background:payMode===m.id?C.blueBg:'#fff',color:payMode===m.id?C.blue:C.gray600,cursor:'pointer'}}>
                  {m.icon}<br/>{m.l}
                </button>
              ))}
            </div>

            {payMode==='upi' && (
              <div style={{textAlign:'center'}}>
                <div style={{width:140,height:140,margin:'0 auto 10px',border:`3px solid ${C.navy}`,borderRadius:12,
                  padding:10,display:'grid',gridTemplateColumns:'repeat(9,1fr)',gap:1.5,background:'#fff'}}>
                  {Array.from({length:81}).map((_,i)=>{
                    const c=[0,1,2,3,4,5,6,9,15,18,19,20,21,22,23,24,27,33,54,60,63,64,65,66,67,68,69,72,78]
                    return <div key={i} style={{background:c.includes(i)||(i>35&&i<45)||(i%9>1&&i%9<7&&(i*7+3)%4===0)?C.navy:'transparent',borderRadius:1}}/>
                  })}
                </div>
                <div style={{fontSize:10,color:C.gray400,marginBottom:12}}>GPay · PhonePe · Paytm · BHIM</div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <div style={{flex:1,height:1,background:C.gray200}}/><span style={{fontSize:11,color:C.gray400,fontWeight:700}}>OR</span>
                  <div style={{flex:1,height:1,background:C.gray200}}/>
                </div>
                <input value={upiId} onChange={e=>setUpiId(e.target.value)} placeholder="yourname@upi"
                  style={{width:'100%',padding:'10px 12px',borderRadius:8,border:`1.5px solid ${C.gray200}`,
                    fontSize:13,outline:'none',marginBottom:14,textAlign:'center'}}/>
              </div>
            )}
            {payMode==='netbanking' && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
                {['HDFC Bank','SBI','ICICI Bank','Axis Bank','Kotak Bank','Punjab National'].map(b=>(
                  <div key={b} style={{border:`1.5px solid ${C.gray200}`,borderRadius:8,padding:'10px 12px',
                    cursor:'pointer',fontSize:12,fontWeight:700,color:C.gray800,textAlign:'center',transition:'all .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=C.blue}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=C.gray200}>{b}</div>
                ))}
              </div>
            )}
            {payMode==='card' && (
              <div style={{marginBottom:14}}>
                <input placeholder="Card Number (16 digits)" maxLength={19}
                  style={{width:'100%',padding:'10px 12px',borderRadius:8,border:`1.5px solid ${C.gray200}`,fontSize:13,outline:'none',marginBottom:8,letterSpacing:2}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <input placeholder="MM / YY" style={{padding:'10px 12px',borderRadius:8,border:`1.5px solid ${C.gray200}`,fontSize:13,outline:'none'}}/>
                  <input placeholder="CVV" type="password" maxLength={3} style={{padding:'10px 12px',borderRadius:8,border:`1.5px solid ${C.gray200}`,fontSize:13,outline:'none'}}/>
                </div>
              </div>
            )}

            <div style={{background:'#fefce8',borderRadius:8,padding:'10px 14px',marginBottom:16,
              border:'1px solid #fde047',display:'flex',alignItems:'center',gap:8}}>
              <Shield size={14} color="#ca8a04" style={{flexShrink:0}}/>
              <span style={{fontSize:11,color:'#92400e',fontWeight:600}}>256-bit SSL · SEBI Compliant · Secured by NPCI</span>
            </div>
            <button onClick={handlePay} disabled={loading} style={{width:'100%',padding:'14px 0',borderRadius:10,
              background:loading?C.gray400:(order.side==='BUY'?`linear-gradient(135deg,${C.green},#059669)`:`linear-gradient(135deg,${C.red},#dc2626)`),
              color:'#fff',fontWeight:800,fontSize:14,border:'none',cursor:loading?'not-allowed':'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              {loading
                ? <><span style={{display:'inline-block',animation:'spin 1s linear infinite',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',width:16,height:16}}/>Processing…</>
                : `Pay ${fR(netAmt)}`}
            </button>
          </div>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <div style={{padding:32,textAlign:'center'}}>
            <div style={{width:72,height:72,borderRadius:'50%',background:'#dcfce7',border:'3px solid #4ade80',
              display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:32}}>✅</div>
            <h2 style={{fontSize:22,fontWeight:900,color:C.gray800,marginBottom:8}}>Order Confirmed!</h2>
            <p style={{fontSize:13,color:C.gray600,lineHeight:1.6,marginBottom:20}}>
              Your {order.side.toLowerCase()} order for <strong>{order.qty} shares</strong> of <strong>{symLabel}</strong> has been placed.
            </p>
            <div style={{background:C.gray50,borderRadius:10,padding:'16px 20px',marginBottom:20,textAlign:'left'}}>
              {[
                {l:'Order ID',v:orderId,color:C.blue},{l:'Amount',v:fR(netAmt)},
                {l:'Order Side',v:order.side},{l:'Status',v:'EXECUTED ✓',color:C.green},
                {l:'Settlement',v:'T+1 · Next Trading Day'},
              ].map(x=>(
                <div key={x.l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${C.gray100}`,fontSize:12.5}}>
                  <span style={{color:C.gray600}}>{x.l}</span>
                  <span style={{fontWeight:800,color:x.color||C.gray800,fontFamily:'monospace'}}>{x.v}</span>
                </div>
              ))}
            </div>
            <button onClick={onClose} style={{width:'100%',padding:'14px 0',borderRadius:10,
              background:C.navy,color:'#fff',fontWeight:800,fontSize:14,border:'none',cursor:'pointer'}}>
              Done →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShieldCheck, TrendingUp, ArrowLeft, Loader2 } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { loginUser } from '../store/slices/authSlice'
import { authAPI } from '../services/api'

/* ── Theme tokens (constant — never triggers re-render) ── */
const T = {
  navy: '#0a0e1a', navyCard: '#131a2b',
  orange: '#2962ff', orangeDim: 'rgba(41,98,255,0.12)',
  text: '#e6edf3', textSub: '#8b949e', textMute: '#545d68',
  border: 'rgba(255,255,255,0.08)',
  green: '#22c55e', greenDim: 'rgba(34,197,94,0.12)',
  red: '#ef4444', redDim: 'rgba(239,68,68,0.12)',
  input: '#1a2236',
}

/* ── Focus a ref safely after DOM update ── */
const focusBox = (refs, idx) => {
  setTimeout(() => {
    try { refs.current[idx]?.focus() } catch (_) {}
  }, 0)
}

/* ── Single OTP box — UNCONTROLLED input for instant typing ── */
function OtpBox({ index, refs, onDigit, onKey, onPasteAll }) {
  const inputRef = useCallback(el => { refs.current[index] = el }, [index, refs])

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      maxLength={2}
      autoComplete="one-time-code"
      onInput={(e) => {
        const val = e.target.value.replace(/\D/g, '')
        if (val) {
          onDigit(index, val.slice(-1))
          e.target.value = val.slice(-1)
        } else {
          e.target.value = ''
        }
      }}
      onKeyDown={(e) => onKey(index, e)}
      onPaste={(e) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (pasted) onPasteAll(pasted)
      }}
      onFocus={(e) => e.target.select()}
      style={{
        width: 50, height: 58, textAlign: 'center', fontSize: 22, fontWeight: 700,
        background: T.input, borderRadius: 10, color: T.text, outline: 'none',
        border: `1px solid ${T.border}`,
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        caretColor: T.orange,
        WebkitAppearance: 'none',
      }}
    />
  )
}

export default function VerifyOtpPage() {
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const location   = useLocation()

  /* ── State ── */
  const { email, password } = location.state || {}
  const [otpStr, setOtpStr]         = useState('')
  const [loading, setLoading]       = useState(false)
  const [countdown, setCountdown]   = useState(60)
  const [error, setError]           = useState('')
  const [resendMsg, setResendMsg]   = useState('')
  const boxRefs = useRef([])
  const timerRef = useRef(null)

  /* ── Redirect if no email/password ── */
  useEffect(() => {
    if (!email || !password) navigate('/login', { replace: true })
  }, [email, password, navigate])

  /* ── Countdown timer ── */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  /* ── Auto-focus first input ── */
  useEffect(() => { focusBox(boxRefs, 0) }, [])

  /* ── Digit entered in a box — update otpStr and auto-advance ── */
  const handleDigit = useCallback((index, digit) => {
    setOtpStr(prev => {
      const arr = prev.split('')
      arr[index] = digit
      const newStr = arr.join('').padEnd(6, '').slice(0, 6)
      return newStr
    })
    /* Immediately advance to next box */
    if (index < 5) focusBox(boxRefs, index + 1)
  }, [])

  /* ── Key down handler ── */
  const handleKey = useCallback((index, e) => {
    if (e.key === 'Backspace') {
      if (!boxRefs.current[index]?.value) {
        /* Box is empty — clear previous box and focus it */
        if (index > 0) {
          boxRefs.current[index - 1].value = ''
          setOtpStr(prev => {
            const arr = prev.split('')
            arr[index - 1] = ''
            return arr.join('')
          })
          focusBox(boxRefs, index - 1)
        }
      }
      /* If box has value, let default backspace clear it */
    }
    if (e.key === 'ArrowLeft' && index > 0) focusBox(boxRefs, index - 1)
    if (e.key === 'ArrowRight' && index < 5) focusBox(boxRefs, index + 1)
  }, [])

  /* ── Paste handler (on individual boxes) ── */
  const handlePasteAll = useCallback((pasted) => {
    setOtpStr(pasted.padEnd(6, '').slice(0, 6))
    /* Fill each box visually */
    pasted.split('').forEach((d, i) => {
      if (boxRefs.current[i]) boxRefs.current[i].value = d
    })
    const focusIdx = Math.min(pasted.length, 5)
    focusBox(boxRefs, focusIdx)
  }, [])

  /* ── Clear all boxes ── */
  const clearAll = useCallback(() => {
    setOtpStr('')
    boxRefs.current.forEach(el => { if (el) el.value = '' })
    focusBox(boxRefs, 0)
  }, [])

  /* ── Verify OTP → Login ── */
  const onVerify = useCallback(async () => {
    setError('')
    if (otpStr.length !== 6) { setError('Enter the 6-digit code'); return }
    setLoading(true)
    try {
      const res = await authAPI.loginWithOtp(email, password, otpStr)
      if (res.data?.success && res.data?.data) {
        const { user } = res.data.data
        await dispatch(loginUser({ user }))
        navigate('/dashboard', { replace: true })
      } else {
        setError(res.data?.message || 'Invalid or expired OTP. Please try again.')
        clearAll()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.')
      clearAll()
    } finally { setLoading(false) }
  }, [otpStr, email, password, dispatch, navigate, clearAll])

  /* ── Resend OTP ── */
  const onResend = useCallback(async () => {
    setError('')
    setResendMsg('')
    setLoading(true)
    try {
      await authAPI.resendOtp(email)
      clearAll()
      setCountdown(60)
      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); return 0 }
          return prev - 1
        })
      }, 1000)
      setResendMsg('A new OTP has been sent to your email.')
      setTimeout(() => setResendMsg(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP')
    } finally { setLoading(false) }
  }, [email, clearAll])

  if (!email || !password) return null

  return (
    <div style={{ background: T.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-30%', left: '-10%', width: '60%', height: '80%', background: 'radial-gradient(circle, rgba(232,119,34,0.06), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-30%', right: '-10%', width: '60%', height: '80%', background: 'radial-gradient(circle, rgba(99,102,241,0.04), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', maxWidth: 1000, width: '100%', margin: '0 20px', borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', animation: 'tpFadeIn 0.4s ease-out' }}>

        {/* Left hero panel */}
        <section style={{ background: T.navyCard, padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <span style={{ width: 32, height: 32, borderRadius: 7, background: T.orange, display: 'grid', placeItems: 'center' }}>
              <TrendingUp size={16} color="#fff" />
            </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: '-0.3px' }}>TRADEPRO</span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.5px' }}>
            Almost there.
          </h1>
          <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.7, marginBottom: 28 }}>
            We've sent a one-time verification code to your email. Enter it below to complete your sign-in.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
            {[
              { title: 'Expires in 5 minutes', detail: 'The code is valid for a limited time.' },
              { title: 'Max 5 attempts', detail: "After 5 incorrect tries, you'll need a new code." },
              { title: 'Check spam folder', detail: "If you don't see the email, check your spam or junk folder." },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <strong style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.title}</strong>
                <span style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5 }}>{item.detail}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 20, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
            {[['₹0', 'Delivery'], ['4.1L+', 'Users'], ['50+', 'Indices']].map(([val, lbl]) => (
              <div key={lbl} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: T.orange }}>{val}</span>
                <span style={{ fontSize: 11, color: T.textMute }}>{lbl}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Right OTP panel */}
        <section style={{ background: T.navy, padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.orangeDim, display: 'grid', placeItems: 'center', margin: '0 auto 14px', border: `2px solid ${T.orange}` }}>
              <ShieldCheck size={24} color={T.orange} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 6 }}>Verify your identity</h2>
            <p style={{ fontSize: 13, color: T.textSub, margin: 0, lineHeight: 1.5 }}>
              Enter the 6-digit code sent to<br />
              <strong style={{ color: T.orange }}>{email}</strong>
            </p>
          </div>

          {/* OTP input boxes — uncontrolled for instant response */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
            {[0,1,2,3,4,5].map(i => (
              <OtpBox
                key={i}
                index={i}
                refs={boxRefs}
                onDigit={handleDigit}
                onKey={handleKey}
                onPasteAll={handlePasteAll}
              />
            ))}
          </div>

          {/* Timer */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            {countdown > 0 ? (
              <span style={{ fontSize: 13, color: T.textSub }}>
                Resend OTP in{' '}
                <span style={{ color: T.orange, fontWeight: 600 }}>{countdown}s</span>
              </span>
            ) : (
              <button onClick={onResend} disabled={loading}
                style={{ background: 'none', border: 'none', color: T.orange, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {loading ? 'Resending…' : 'Resend OTP'}
              </button>
            )}
          </div>

          {resendMsg && (
            <div style={{ fontSize: 12, color: T.green, padding: '8px 12px', background: T.greenDim, borderRadius: 6, textAlign: 'center', marginBottom: 16 }}>
              {resendMsg}
            </div>
          )}

          {error && (
            <div style={{ fontSize: 12, color: T.red, padding: '8px 12px', background: T.redDim, borderRadius: 6, textAlign: 'center', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button onClick={onVerify} disabled={loading || otpStr.length < 6} style={{
            width: '100%', padding: '13px', borderRadius: 8, border: 'none',
            background: T.orange, color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: loading || otpStr.length !== 6 ? 'not-allowed' : 'pointer',
            opacity: loading || otpStr.length !== 6 ? 0.5 : 1,
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {loading ? (
              <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Verifying…</>
            ) : 'Verify & Sign In'}
          </button>

          <button onClick={() => navigate('/login', { replace: true })}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'none', border: 'none', color: T.textMute, fontSize: 12, cursor: 'pointer', marginTop: 16 }}>
            <ArrowLeft size={12} /> Back to login
          </button>
        </section>
      </div>
    </div>
  )
}

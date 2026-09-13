import React, { useState, useCallback, startTransition } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, Lock, TrendingUp, ChevronRight, Loader2, Eye, EyeOff } from 'lucide-react'
import { authAPI } from '../services/api'

const quickFeatures = [
  { title: 'Two-factor security',   detail: 'Password + OTP verification keeps your account ultra-secure.' },
  { title: 'Works for everyone',    detail: 'Register once with email & password, then login with OTP every time.' },
  { title: 'Bank-grade protection', detail: 'JWT sessions, device-aware auth and encrypted data at rest.' },
]

/* ── Theme tokens (pure white page, dark text) ── */
const T = {
  navy: '#ffffff', navyCard: '#f8f9fa',
  orange: '#2962ff', orangeDim: 'rgba(41,98,255,0.10)',
  text: '#1a1a2e', textSub: '#4b5563', textMute: '#6b7280',
  border: '#e5e7eb',
  green: '#22c55e', greenDim: 'rgba(34,197,94,0.10)',
  red: '#ef4444', redDim: 'rgba(239,68,68,0.10)',
  input: '#ffffff',
}

export default function LoginPage() {
  const navigate   = useNavigate()
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [retryMsg, setRetryMsg]     = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  /* ── Clear stale auth cookies on mount ── */
  React.useEffect(() => {
    try {
      document.cookie = 'access_token=; path=/; max-age=0'
      document.cookie = 'refresh_token=; path=/; max-age=0'
    } catch (_) {}
  }, [])

  /* ── Step 1: Verify email + password, then send OTP → navigate to /verify-otp ── */
  const onSubmit = async (data) => {
    setError('')
    setRetryMsg('')
    setLoading(true)

    const emailAddr = data.email
    const passwordVal = data.password

    try {
      /* 1️⃣ Verify credentials */
      const credRes = await authAPI.verifyCredentials(emailAddr, passwordVal)
      if (!credRes.data?.success) {
        setError(credRes.data?.message || 'Invalid email or password. Please try again.')
        return
      }

      /* 2️⃣ Credentials valid → send OTP (with cold-start retry) */
      await sendOtpWithRetry(emailAddr)

      /* 3️⃣ Navigate to /verify-otp with email + password in state */
      startTransition(() => {
        navigate('/verify-otp', {
          state: { email: emailAddr, password: passwordVal },
          replace: true,
        })
      })
    } catch (err) {
      console.error('Login step 1 error:', err)
      const msg = err.response?.data?.message
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Server is temporarily unavailable. Please try again in a few seconds.')
      } else if (!err.response) {
        setError('Cannot reach server. Check your connection.')
      } else if (err.response?.status === 400) {
        setError(msg || 'Invalid email or password. Please try again.')
      } else {
        setError(msg || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  /* ── Send OTP with cold-start auto-retry ── */
  const sendOtpWithRetry = useCallback(async (emailAddr, retries = 3, delay = 8000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await authAPI.sendOtp(emailAddr)
      } catch (err) {
        const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout')
        const isNetwork = !err.response
        const isServerError = err.response && [403, 500, 502, 503].includes(err.response.status)

        if ((isTimeout || isNetwork || isServerError) && attempt < retries) {
          setRetryMsg(`Server is warming up… retry ${attempt}/${retries}`)
          await new Promise(r => setTimeout(r, delay))
          continue
        }
        throw err
      }
    }
  }, [])

  /* ── Input style helper ── */
  const inputStyle = (hasError) => ({
    width: '100%', padding: '12px 14px 12px 38px', background: T.input,
    border: `1px solid ${hasError ? T.red : T.border}`, borderRadius: 8,
    color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  })

  return (
    <div style={{ background: T.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: '-30%', left: '-10%', width: '60%', height: '80%', background: 'radial-gradient(circle, rgba(232,119,34,0.06), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-30%', right: '-10%', width: '60%', height: '80%', background: 'radial-gradient(circle, rgba(99,102,241,0.04), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', maxWidth: 1000, width: '100%', margin: '0 20px', borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.06)', animation: 'tpFadeIn 0.4s ease-out' }}>

        {/* ── Left hero panel ── */}
        <section style={{ background: T.navyCard, padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <span style={{ width: 32, height: 32, borderRadius: 7, background: T.orange, display: 'grid', placeItems: 'center' }}>
              <TrendingUp size={16} color="#fff" />
            </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: '-0.3px' }}>TRADEPRO</span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.5px' }}>
            Your trading desk. One tap away.
          </h1>
          <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.7, marginBottom: 28 }}>
            Sign in with your password, verify with a one-time code, and access live NSE/BSE data,
            portfolio analytics, and stock screener — all in one place.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
            {quickFeatures.map(item => (
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

        {/* ── Right auth panel ── */}
        <section style={{ background: T.navy, padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 6 }}>
              Sign in to TradePro
            </div>
            <p style={{ fontSize: 13, color: T.textSub, margin: 0 }}>
              Enter your email and password, then verify with OTP.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMute }} />
                <input
                  type="email"
                  placeholder="you@email.com"
                  autoFocus
                  {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })}
                  style={inputStyle(errors.email)}
                />
              </div>
              {errors.email && <span style={{ fontSize: 11, color: T.red, marginTop: 4, display: 'block' }}>{errors.email.message}</span>}
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMute }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                  style={{ ...inputStyle(errors.password), paddingRight: 38 }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMute, padding: 4 }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span style={{ fontSize: 11, color: T.red, marginTop: 4, display: 'block' }}>{errors.password.message}</span>}
            </div>

            {/* Retry message */}
            {retryMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.orange, padding: '8px 12px', background: T.orangeDim, borderRadius: 6 }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                {retryMsg}
              </div>
            )}

            {error && (
              <div style={{ fontSize: 12, color: T.red, padding: '8px 12px', background: T.redDim, borderRadius: 6 }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px', borderRadius: 8, border: 'none',
              background: T.orange, color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              {loading ? (
                <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Verifying…</>
              ) : (
                <>Continue with OTP <ChevronRight size={15} /></>
              )}
            </button>

            <div style={{ textAlign: 'center', fontSize: 13, color: T.textSub }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: T.orange, fontWeight: 600, textDecoration: 'none' }}>Register here</Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

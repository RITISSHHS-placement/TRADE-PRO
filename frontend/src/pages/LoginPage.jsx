import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, ShieldCheck, Wifi, WifiOff, Clock } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { loginUser } from '../store/slices/authSlice'
import { authAPI } from '../services/api'
import { Button, Input } from '../components/ui'
import { FadeIn } from '../components/animations'
import { useServerStatus } from '../hooks/useServerStatus'
import styles from './AuthPage.module.css'

/* ── Server status banner shown during cold start ── */
function ServerBanner({ status, wakeElapsed }) {
  if (status === 'up' || status === 'unknown') return null
  const isWaking = status === 'waking'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 8, marginBottom: 16,
      background: isWaking ? '#fef3c7' : '#fce8e6',
      border: `1px solid ${isWaking ? '#fde68a' : '#f5c6c2'}`,
      fontSize: 12.5, color: isWaking ? '#92400e' : '#ea4335',
    }}>
      {isWaking
        ? <Clock size={14} />
        : <WifiOff size={14} />}
      <div>
        {isWaking
          ? `Server is starting up… (${wakeElapsed}s) — please wait, this takes up to 60s`
          : 'Cannot reach server. Check your connection or try again.'}
      </div>
      {isWaking && (
        <div style={{ marginLeft: 'auto', width: 60, height: 4, borderRadius: 2, background: '#e5e7eb', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#d97706', borderRadius: 2, width: `${Math.min(100, (wakeElapsed / 60) * 100)}%`, transition: 'width 1s linear' }} />
        </div>
      )}
    </div>
  )
}

const quickFeatures = [
  { title: 'Instant access',   detail: 'Log in and see your market dashboard in under 2 seconds.' },
  { title: 'Secure sessions',  detail: 'OTP verification, JWT rotation and device-aware authentication.' },
  { title: 'Smart alerts',     detail: 'Receive premium order flow and entry signal notifications.' },
]

export default function LoginPage() {
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const { status, isWaking, wakeElapsed } = useServerStatus()
  const [showPw, setShowPw]               = useState(false)
  const [step, setStep]                   = useState(1) // 1 = credentials, 2 = OTP
  const [email, setEmail]                 = useState('')
  const [otp, setOtp]                     = useState('')
  const [sendingOtp, setSendingOtp]       = useState(false)
  const [verifyingOtp, setVerifyingOtp]   = useState(false)
  const [countdown, setCountdown]         = useState(0)
  const [loginData, setLoginData]         = useState({})
  const [credError, setCredError]         = useState('')
  const [otpError, setOtpError]           = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm()

  // ── Start countdown for OTP resend ──
  const startCountdown = () => {
    setCountdown(60)
    const t = setInterval(() => {
      setCountdown(p => { if (p <= 1) { clearInterval(t); return 0 } return p - 1 })
    }, 1000)
  }

  // ── Step 1: verify credentials, then send OTP ──
  const onSubmit = async (data) => {
    setCredError('')
    setSendingOtp(true)
    try {
      // Verify credentials first
      const verify = await authAPI.verifyCredentials(data.email, data.password)
      if (!verify.data?.success) {
        setCredError('Invalid email or password')
        return
      }
      // Send OTP
      await authAPI.sendOtp(data.email)
      setLoginData(data)
      setEmail(data.email)
      setStep(2)
      startCountdown()
    } catch {
      setCredError('Invalid email or password')
    } finally {
      setSendingOtp(false)
    }
  }

  // ── Step 2: verify OTP, then complete login ──
  const verifyOtpAndLogin = async () => {
    setOtpError('')
    if (otp.length !== 6) { setOtpError('Enter the 6-digit code'); return }
    setVerifyingOtp(true)
    try {
      const res = await authAPI.loginWithOtp(loginData.email, loginData.password, otp)
      if (res.data?.success && res.data?.data) {
        const { token, refreshToken: rt, user } = res.data.data
        // Dispatch loginUser with the pre-built payload — the thunk detects this and returns as-is
        await dispatch(loginUser({ token, refreshToken: rt, user }))
        navigate('/dashboard', { replace: true })
      } else {
        setOtpError('Invalid or expired OTP. Please try again.')
      }
    } catch {
      setOtpError('Invalid or expired OTP. Please try again.')
    } finally {
      setVerifyingOtp(false)
    }
  }

  const resendOtp = async () => {
    setSendingOtp(true)
    try {
      await authAPI.sendOtp(email)
      startCountdown()
    } catch {
      setOtpError('Failed to resend OTP')
    } finally {
      setSendingOtp(false)
    }
  }

  // ── Handle individual OTP digit inputs ──
  const handleOtpChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1)
    const chars = otp.split('')
    chars[index] = val
    setOtp(chars.join(''))
    if (val && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  return (
    <FadeIn className={styles.page} y={24} duration={0.35} ease="power2.out">
      <div className={styles.bg} />
      <div className={styles.overlay} />
      <div className={styles.container}>

        {/* ── Left hero panel ── */}
        <section className={styles.heroCard}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>T</span>
            Trade<span>Pro</span>
          </div>
          <h1 className={styles.heroTitle}>Secure access to your premium trading desk.</h1>
          <p className={styles.heroText}>
            Sign in and access live NSE/BSE data, stock screener, portfolio analytics,
            and mutual funds — all in one place.
          </p>
          <div className={styles.quickList}>
            {quickFeatures.map(item => (
              <div key={item.title} className={styles.quickItem}>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
            ))}
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatVal}>₹0</span>
              <span className={styles.heroStatLabel}>Delivery</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatVal}>4.1L+</span>
              <span className={styles.heroStatLabel}>Users</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatVal}>50+</span>
              <span className={styles.heroStatLabel}>Indices</span>
            </div>
          </div>
        </section>

        {/* ── Right auth panel ── */}
        <section className={styles.authCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              {step === 1 ? 'Welcome back' : 'Verify your identity'}
            </div>
            <p className={styles.cardSubtitle}>
              {step === 1
                ? 'Enter your credentials to continue trading.'
                : `Enter the OTP sent to ${email}`}
            </p>
          </div>

          {/* Server warm-up banner */}
          <ServerBanner status={status} wakeElapsed={wakeElapsed} />

          {/* ── Step 1: credentials ── */}
          {step === 1 && (
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <Input
                label="Email"
                type="email"
                placeholder="you@email.com"
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                })}
              />
              <Input
                label="Password"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                suffix={
                  <button type="button" className={styles.eyeButton}
                    onClick={() => setShowPw(p => !p)}>
                    {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                }
                {...register('password', { required: 'Password is required' })}
              />
              {credError && (
                <div style={{ fontSize: 12, color: '#ea4335', padding: '4px 0' }}>{credError}</div>
              )}
              <Button type="submit" fullWidth loading={sendingOtp} size="lg">
                {sendingOtp ? 'Sending OTP…' : 'Continue with OTP →'}
              </Button>
            </form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 2 && (
            <div className={styles.form}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: '#e8f0fe', display: 'grid',
                  placeItems: 'center', margin: '0 auto 12px',
                }}>
                  <ShieldCheck size={24} color="#1a73e8" />
                </div>
                <p style={{ color: '#5f6368', fontSize: 13, margin: 0 }}>
                  We sent a 6-digit code to <strong style={{ color: '#1a1a1a' }}>{email}</strong>
                </p>
              </div>

              {/* OTP boxes */}
              <div className={styles.otpRow}>
                {[0,1,2,3,4,5].map(i => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i] || ''}
                    onChange={e => handleOtpChange(e, i)}
                    onKeyDown={e => handleOtpKeyDown(e, i)}
                    className={styles.otpBox}
                  />
                ))}
              </div>

              {otpError && (
                <div className={styles.errorMsg}>{otpError}</div>
              )}

              <Button
                fullWidth loading={verifyingOtp} size="lg"
                onClick={verifyOtpAndLogin}
                disabled={otp.length !== 6}
              >
                {verifyingOtp ? 'Verifying…' : 'Verify & Sign In'}
              </Button>

              <div style={{ textAlign: 'center', marginTop: 14 }}>
                {countdown > 0 ? (
                  <p style={{ color: '#5f6368', fontSize: 13 }}>
                    Resend in <span style={{ color: '#1a73e8', fontWeight: 600 }}>{countdown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={resendOtp} disabled={sendingOtp}
                    style={{ background: 'none', border: 'none', color: '#1a73e8',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {sendingOtp ? 'Resending…' : 'Resend OTP'}
                  </button>
                )}
              </div>

              <button
                onClick={() => { setStep(1); setOtp(''); setOtpError('') }}
                style={{ display: 'block', margin: '12px auto 0', background: 'none',
                  border: 'none', color: '#9aa0a6', fontSize: 12, cursor: 'pointer' }}>
                ← Back to credentials
              </button>
            </div>
          )}

          {step === 1 && (
            <div className={styles.formFooter}>
              <span>New to TradePro?</span>
              <Link to="/register" className={styles.link}>Create an account</Link>
            </div>
          )}
        </section>
      </div>
    </FadeIn>
  )
}

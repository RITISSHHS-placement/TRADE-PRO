import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, ShieldCheck, Lock } from 'lucide-react'
import { useAuth } from '../hooks'
import { authAPI } from '../services/api'
import { Button, Input } from '../components/ui'
import { FadeIn } from '../components/animations'
import styles from './AuthPage.module.css'

const quickFeatures = [
  { title: 'Instant access', detail: 'Log in and see your market dashboard in under 2 seconds.' },
  { title: 'Secure sessions', detail: 'OTP verification, JWT rotation and device-aware authentication.' },
  { title: 'Smart alerts', detail: 'Receive premium order flow and entry signal notifications.' },
]

export default function LoginPage() {
  const { login, loading } = useAuth()
  const [showPw, setShowPw] = useState(false)
  const [step, setStep] = useState(1) // 1: form, 2: otp
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [loginData, setLoginData] = useState({})
  const { register, handleSubmit, formState: { errors } } = useForm()

  const sendOtp = async (emailAddress) => {
    setSendingOtp(true)
    try {
      await authAPI.sendOtp(emailAddress)
      setEmail(emailAddress)
      setOtpSent(true)
      setStep(2)
      startCountdown()
    } catch (error) {
      console.error('Failed to send OTP:', error)
    } finally {
      setSendingOtp(false)
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

  const verifyOtpAndLogin = async () => {
    setVerifyingOtp(true)
    try {
      await authAPI.verifyOtp(email, otp)
      // Proceed with login after OTP verification
      await login({
        ...loginData,
        deviceId: navigator.userAgent.slice(0, 64),
        deviceName: `${navigator.platform} Browser`,
        userAgent: navigator.userAgent,
      })
    } catch (error) {
      console.error('OTP verification failed:', error)
    } finally {
      setVerifyingOtp(false)
    }
  }

  const onSubmit = async (data) => {
    setLoginData(data)
    await sendOtp(data.email)
  }

  return (
    <FadeIn
      className={styles.page}
      y={24}
      duration={0.35}
      ease="power2.out"
    >
      <div className={styles.bg} />
      <div className={styles.overlay} />
      <div className={styles.container}>
        <section className={styles.heroCard}>
          <div className={styles.brand}>Trade<span>Pro</span></div>
          <h1 className={styles.heroTitle}>Secure access to your premium trading desk.</h1>
          <p className={styles.heroText}>Sign in to your account and power up your stock market insights with refined execution, risk controls, and clean visual flow.</p>
          <div className={styles.quickList}>
            {quickFeatures.map((item) => (
              <div key={item.title} className={styles.quickItem}>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.authCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              {step === 1 ? 'Welcome back' : 'Verify your identity'}
            </div>
            <p className={styles.cardSubtitle}>
              {step === 1 ? 'Enter your credentials to continue trading.' : 'Enter the OTP sent to your email'}
            </p>
          </div>

          {step === 1 ? (
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
                  <button type="button" className={styles.eyeButton} onClick={() => setShowPw((prev) => !prev)}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                {...register('password', { required: 'Password is required' })}
              />

              <Button type="submit" fullWidth loading={sendingOtp} size="lg">
                {sendingOtp ? 'Sending OTP...' : 'Continue with OTP →'}
              </Button>
            </form>
          ) : (
            <div className={styles.form}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <ShieldCheck size={48} style={{ color: '#6366f1', marginBottom: 16 }} />
                <p style={{ color: '#8b8b9e', fontSize: 14 }}>
                  We've sent a 6-digit OTP to <strong>{email}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    style={{
                      width: '100%',
                      height: 56,
                      textAlign: 'center',
                      fontSize: 24,
                      fontWeight: 700,
                      background: '#0f0f12',
                      border: '1px solid #1f1f27',
                      borderRadius: 8,
                      color: '#f4f4f6',
                      outline: 'none',
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
                  />
                ))}
              </div>

              <Button 
                fullWidth 
                loading={verifyingOtp} 
                size="lg"
                onClick={verifyOtpAndLogin}
                disabled={otp.length !== 6}
              >
                {verifyingOtp ? 'Verifying...' : 'Verify & Sign In'}
              </Button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                {countdown > 0 ? (
                  <p style={{ color: '#8b8b9e', fontSize: 13 }}>
                    Resend OTP in <span style={{ color: '#6366f1', fontWeight: 600 }}>{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => sendOtp(email)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6366f1',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
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

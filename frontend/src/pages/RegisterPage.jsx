import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../hooks'
import { authAPI } from '../services/api'
import { Button, Input } from '../components/ui'
import { FadeIn } from '../components/animations'
import styles from './AuthPage.module.css'

const benefits = [
  { title: 'Fast onboarding', detail: 'Register quickly and start tracking market moves instantly.' },
  { title: 'Smart execution', detail: 'Designed for traders who want beautiful charts and powerful controls.' },
  { title: 'Trusted security', detail: 'Bank-grade authentication with device awareness and OTP verification.' },
]

export default function RegisterPage() {
  const { register: registerUser, loading } = useAuth()
  const [showPw, setShowPw] = useState(false)
  const [step, setStep] = useState(1) // 1: form, 2: otp
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [countdown, setCountdown] = useState(0)
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

  const verifyOtpAndRegister = async () => {
    setVerifyingOtp(true)
    try {
      await authAPI.verifyOtp(email, otp)
      // Proceed with registration after OTP verification
      await registerUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
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

  const [formData, setFormData] = useState({})

  const onSubmit = async (data) => {
    setFormData(data)
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
          <h1 className={styles.heroTitle}>Create your premium trading workspace.</h1>
          <p className={styles.heroText}>Start with a clean, studio-quality dashboard optimized for market momentum, portfolio clarity, and risk transparency.</p>
          <div className={styles.quickList}>
            {benefits.map((item) => (
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
              {step === 1 ? 'Create your account' : 'Verify your email'}
            </div>
            <p className={styles.cardSubtitle}>
              {step === 1 ? 'Become part of modern stock trading with secure access.' : 'Enter the OTP sent to your email'}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <Input
                label="Full Name"
                placeholder="Rahul Sharma"
                error={errors.name?.message}
                {...register('name', { required: 'Name is required' })}
              />

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
                label="Phone"
                type="tel"
                placeholder="+91 98765 43210"
                error={errors.phone?.message}
                {...register('phone', {
                  required: 'Phone is required',
                  minLength: { value: 10, message: 'Enter valid phone number' },
                })}
              />

              <Input
                label="Password"
                type={showPw ? 'text' : 'password'}
                placeholder="Min 6 characters"
                error={errors.password?.message}
                suffix={
                  <button type="button" className={styles.eyeButton} onClick={() => setShowPw((prev) => !prev)}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' },
                })}
              />

              <Button type="submit" fullWidth loading={sendingOtp} size="lg">
                {sendingOtp ? 'Sending OTP...' : 'Continue with OTP →'}
              </Button>
            </form>
          ) : (
            <div className={styles.form}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Mail size={48} style={{ color: '#6366f1', marginBottom: 16 }} />
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
                onClick={verifyOtpAndRegister}
                disabled={otp.length !== 6}
              >
                {verifyingOtp ? 'Verifying...' : 'Verify & Create Account'}
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
            <>
              <div className={styles.terms}>
                By creating an account, you agree to our <span className={styles.link}>Terms of Service</span> and <span className={styles.link}>Privacy Policy</span>.
              </div>

              <div className={styles.formFooter}>
                <span>Already registered?</span>
                <Link to="/login" className={styles.link}>Sign in</Link>
              </div>
            </>
          )}
        </section>
      </div>
    </FadeIn>
  )
}

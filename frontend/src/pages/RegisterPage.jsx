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
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        deviceId: navigator.userAgent.slice(0, 64),
        deviceName: `${navigator.platform} Browser`,
        userAgent: navigator.userAgent,
      })
      setRegistrationSuccess(true)
    } catch (error) {
      console.error('Registration failed:', error)
      alert('Registration failed: ' + (error.response?.data?.message || error.message))
    }
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
          <div className={styles.brand}>
            <span className={styles.brandIcon}>T</span>
            Trade<span>Pro</span>
          </div>
          <h1 className={styles.heroTitle}>Create your premium trading workspace.</h1>
          <p className={styles.heroText}>
            Join 4.1 lakh+ investors. Live NSE/BSE data, stock screener,
            mutual funds, and portfolio analytics — all in one platform.
          </p>
          <div className={styles.quickList}>
            {benefits.map((item) => (
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
              <span className={styles.heroStatVal}>16K+</span>
              <span className={styles.heroStatLabel}>MF Schemes</span>
            </div>
          </div>
        </section>

        <section className={styles.authCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              {registrationSuccess ? 'Account Created!' : 'Create your account'}
            </div>
            <p className={styles.cardSubtitle}>
              {registrationSuccess 
                ? 'Your account has been successfully created. You can now sign in.' 
                : 'Become part of modern stock trading with secure access.'}
            </p>
          </div>

          {!registrationSuccess ? (
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

              <Button type="submit" fullWidth loading={loading} size="lg">
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          ) : (
            <div className={styles.form} style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircle2 size={56} style={{ color: '#0f9d58', marginBottom: 16 }} />
              <h3 style={{ color: '#1a1a1a', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                Account Created!
              </h3>
              <p style={{ color: '#5f6368', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                Your TradePro account is ready. Sign in to access live markets, screener, and portfolio.
              </p>
              <Link to="/login">
                <Button fullWidth size="lg">
                  Sign In to Your Account
                </Button>
              </Link>
            </div>
          )}

          {!registrationSuccess && (
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

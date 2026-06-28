import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks'
import { Button, Input } from '../components/ui'
import styles from './AuthPage.module.css'

const quickFeatures = [
  { title: 'Instant access', detail: 'Log in and see your market dashboard in under 2 seconds.' },
  { title: 'Secure sessions', detail: 'TOTP, JWT rotation and device-aware authentication.' },
  { title: 'Smart alerts', detail: 'Receive premium order flow and entry signal notifications.' },
]

export default function LoginPage() {
  const { login, loading } = useAuth()
  const [showPw, setShowPw] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    await login({
      email: data.email,
      password: data.password,
      deviceId: navigator.userAgent.slice(0, 64),
      deviceName: `${navigator.platform} Browser`,
      userAgent: navigator.userAgent,
    })
  }

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
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
            <div className={styles.cardTitle}>Welcome back</div>
            <p className={styles.cardSubtitle}>Enter your credentials to continue trading.</p>
          </div>

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

            <Button type="submit" fullWidth loading={loading} size="lg">
              Sign in
            </Button>
          </form>

          <div className={styles.formFooter}>
            <span>New to TradePro?</span>
            <Link to="/register" className={styles.link}>Create an account</Link>
          </div>
        </section>
      </div>
    </motion.div>
  )
}

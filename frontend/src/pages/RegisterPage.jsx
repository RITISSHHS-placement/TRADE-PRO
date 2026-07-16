import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks'
import { Button, Input } from '../components/ui'
import { FadeIn } from '../components/animations'
import styles from './AuthPage.module.css'

const benefits = [
  { title: 'Fast onboarding', detail: 'Register quickly and start tracking market moves instantly.' },
  { title: 'Smart execution', detail: 'Designed for traders who want beautiful charts and powerful controls.' },
  { title: 'Trusted security', detail: 'Bank-grade authentication with device awareness and TOTP.' },
]

export default function RegisterPage() {
  const { register: registerUser, loading } = useAuth()
  const [showPw, setShowPw] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    await registerUser({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      deviceId: navigator.userAgent.slice(0, 64),
      deviceName: `${navigator.platform} Browser`,
      userAgent: navigator.userAgent,
    })
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
            <div className={styles.cardTitle}>Create your account</div>
            <p className={styles.cardSubtitle}>Become part of modern stock trading with secure access.</p>
          </div>

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
              Create account →
            </Button>
          </form>

          <div className={styles.terms}>
            By creating an account, you agree to our <span className={styles.link}>Terms of Service</span> and <span className={styles.link}>Privacy Policy</span>.
          </div>

          <div className={styles.formFooter}>
            <span>Already registered?</span>
            <Link to="/login" className={styles.link}>Sign in</Link>
          </div>
        </section>
      </div>
    </FadeIn>
  )
}

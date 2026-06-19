import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks'
import { Button, Input } from '../components/ui'
import styles from './AuthPage.module.css'

export default function RegisterPage() {
  const { register: registerUser, loading } = useAuth()
  const [showPw, setShowPw] = useState(false)
  const { register, handleSubmit, formState: { errors }, watch } = useForm()

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
    <div className={styles.page}>
      <div className={styles.bg} />
      <div className={styles.card}>
        <div className={styles.logo}>Trade<span>Pro</span></div>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.sub}>Start trading in under 2 minutes</p>

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
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#80809a', display: 'flex' }}>
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
          By creating an account, you agree to our{' '}
          <span className={styles.link}>Terms of Service</span> and{' '}
          <span className={styles.link}>Privacy Policy</span>.
        </div>

        <div className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, TrendingUp, CheckCircle2, ChevronRight } from 'lucide-react'
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

/* ── Theme tokens ── */
const T = {
  navy: '#0a0e1a', navyCard: '#131a2b',
  orange: '#2962ff', orangeDim: 'rgba(41,98,255,0.12)',
  text: '#e6edf3', textSub: '#8b949e', textMute: '#545d68',
  border: 'rgba(255,255,255,0.08)',
  green: '#22c55e', greenDim: 'rgba(34,197,94,0.12)',
  red: '#ef4444', input: '#1a2236',
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser, loading } = useAuth()
  const [showPw, setShowPw] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()
  const redirectTimer = useRef(null)

  /* Auto-redirect to login 2.5s after successful registration */
  useEffect(() => {
    if (registrationSuccess) {
      redirectTimer.current = setTimeout(() => navigate('/login', { replace: true }), 2500)
      return () => clearTimeout(redirectTimer.current)
    }
  }, [registrationSuccess, navigate])

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
    <div style={{ background: T.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: '60%', height: '80%', background: 'radial-gradient(circle, rgba(232,119,34,0.06), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', maxWidth: 1000, width: '100%', margin: '0 20px', borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', animation: 'tpFadeIn 0.4s ease-out' }}>

        {/* ── Left hero panel ── */}
        <section style={{ background: T.navyCard, padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <span style={{ width: 32, height: 32, borderRadius: 7, background: T.orange, display: 'grid', placeItems: 'center' }}>
              <TrendingUp size={16} color="#fff" />
            </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: '-0.3px' }}>TRADEPRO</span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.5px' }}>
            Create your premium trading workspace.
          </h1>
          <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.7, marginBottom: 28 }}>
            Join 4.1 lakh+ investors. Live NSE/BSE data, stock screener,
            mutual funds, and portfolio analytics — all in one platform.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
            {benefits.map(item => (
              <div key={item.title} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <strong style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.title}</strong>
                <span style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5 }}>{item.detail}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 20, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
            {[['₹0', 'Delivery'], ['4.1L+', 'Users'], ['16K+', 'MF Schemes']].map(([val, lbl]) => (
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
              {registrationSuccess ? 'Account Created!' : 'Create your account'}
            </div>
            <p style={{ fontSize: 13, color: T.textSub, margin: 0 }}>
              {registrationSuccess
                ? 'Your account has been successfully created. You can now sign in.'
                : 'Become part of modern stock trading with secure access.'}
            </p>
          </div>

          {!registrationSuccess ? (
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Full Name</label>
                <input placeholder="Rahul Sharma" {...register('name', { required: 'Name is required' })}
                  style={{ width: '100%', padding: '10px 14px', background: T.input, border: `1px solid ${errors.name ? T.red : T.border}`, borderRadius: 8, color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                {errors.name && <span style={{ fontSize: 11, color: T.red, marginTop: 4, display: 'block' }}>{errors.name.message}</span>}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Email</label>
                <input type="email" placeholder="you@email.com" {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })}
                  style={{ width: '100%', padding: '10px 14px', background: T.input, border: `1px solid ${errors.email ? T.red : T.border}`, borderRadius: 8, color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                {errors.email && <span style={{ fontSize: 11, color: T.red, marginTop: 4, display: 'block' }}>{errors.email.message}</span>}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Phone</label>
                <input type="tel" placeholder="+91 98765 43210" {...register('phone', { required: 'Phone is required', minLength: { value: 10, message: 'Enter valid phone number' } })}
                  style={{ width: '100%', padding: '10px 14px', background: T.input, border: `1px solid ${errors.phone ? T.red : T.border}`, borderRadius: 8, color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                {errors.phone && <span style={{ fontSize: 11, color: T.red, marginTop: 4, display: 'block' }}>{errors.phone.message}</span>}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} placeholder="Min 6 characters" {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
                    style={{ width: '100%', padding: '10px 40px 10px 14px', background: T.input, border: `1px solid ${errors.password ? T.red : T.border}`, borderRadius: 8, color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.textMute, cursor: 'pointer', padding: 4 }}>
                    {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                {errors.password && <span style={{ fontSize: 11, color: T.red, marginTop: 4, display: 'block' }}>{errors.password.message}</span>}
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '12px', borderRadius: 8, border: 'none',
                background: T.orange, color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                transition: 'all 0.15s',
              }}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', animation: 'tpFadeIn 0.4s ease-out' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.greenDim, display: 'grid', placeItems: 'center', margin: '0 auto 16px', border: `2px solid ${T.green}` }}>
                <CheckCircle2 size={32} color={T.green} />
              </div>
              <h3 style={{ color: T.text, fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Account Created Successfully!</h3>
              <p style={{ color: T.textSub, fontSize: 14, marginBottom: 8, lineHeight: 1.6 }}>
                Your TradePro account is ready. Redirecting you to sign in...
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 120, height: 4, borderRadius: 2, background: T.border, overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: T.green, borderRadius: 2, animation: 'regProgress 2.5s linear forwards' }} />
                </div>
              </div>
              <Link to="/login" onClick={() => clearTimeout(redirectTimer.current)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 24px', borderRadius: 8, background: T.orange, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                Sign In Now
              </Link>
              <style>{`@keyframes regProgress { from { width: 100%; } to { width: 0%; } }`}</style>
            </div>
          )}

          {!registrationSuccess && (
            <>
              <div style={{ fontSize: 12, color: T.textMute, textAlign: 'center', marginTop: 16 }}>
                By creating an account, you agree to our <span style={{ color: T.orange, cursor: 'pointer' }}>Terms of Service</span> and <span style={{ color: T.orange, cursor: 'pointer' }}>Privacy Policy</span>.
              </div>
              <div style={{ textAlign: 'center', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                <span style={{ color: T.textSub, fontSize: 13 }}>Already registered? </span>
                <Link to="/login" style={{ color: T.orange, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { Shield, Smartphone, Monitor, Check, AlertTriangle } from 'lucide-react'
import { useSelector } from 'react-redux'
import { authAPI } from '../services/api'
import { Button, Card, Toggle } from '../components/ui'
import toast from 'react-hot-toast'
import styles from './SecurityPage.module.css'

export default function SecurityPage() {
  const { user } = useSelector((s) => s.auth)
  const [totpSetup, setTotpSetup] = useState(null)
  const [totpCode, setTotpCode] = useState('')
  const [loadingTotp, setLoadingTotp] = useState(false)
  const [smsEnabled, setSmsEnabled] = useState(user?.smsOtpEnabled ?? true)

  const handleSetupTotp = async () => {
    if (!user?.id) return
    setLoadingTotp(true)
    try {
      const res = await authAPI.setupTotp(user.id)
      setTotpSetup(res.data.data)
      toast.success('Scan the QR code with your authenticator app')
    } catch (e) {
      toast.error('Failed to setup TOTP')
    } finally {
      setLoadingTotp(false)
    }
  }

  const handleVerifyTotp = async () => {
    if (!user?.id || !totpCode) return
    setLoadingTotp(true)
    try {
      const res = await authAPI.verifyTotp(user.id, totpCode)
      if (res.data.success) {
        toast.success('TOTP verified and enabled!')
        setTotpSetup(null)
        setTotpCode('')
      }
    } catch (e) {
      toast.error('Invalid TOTP code')
    } finally {
      setLoadingTotp(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Security</h1>
      <p className={styles.sub}>Manage authentication, devices, and session security.</p>

      <div className={styles.grid}>

        {/* 2FA STATUS */}
        <Card className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon} style={{ background: 'rgba(123,97,255,0.12)', color: '#a390ff' }}>
              <Shield size={20} />
            </div>
            <div>
              <div className={styles.cardTitle}>Two-Factor Authentication</div>
              <div className={styles.cardSub}>Add an extra layer of protection</div>
            </div>
          </div>

          <div className={styles.authMethods}>
            {/* SMS OTP */}
            <div className={styles.method}>
              <div className={styles.methodInfo}>
                <div className={styles.methodName}>SMS OTP</div>
                <div className={styles.methodDesc}>One-time password via SMS to {user?.phone}</div>
              </div>
              <Toggle checked={smsEnabled} onChange={setSmsEnabled} />
            </div>

            {/* TOTP */}
            <div className={styles.method}>
              <div className={styles.methodInfo}>
                <div className={styles.methodName}>Authenticator App (TOTP)</div>
                <div className={styles.methodDesc}>Google Authenticator, Authy, etc.</div>
              </div>
              {user?.totpEnabled ? (
                <div className={styles.enabledBadge}><Check size={12} /> Enabled</div>
              ) : (
                <Button size="sm" variant="secondary" loading={loadingTotp} onClick={handleSetupTotp}>
                  Set up
                </Button>
              )}
            </div>
          </div>

          {/* TOTP QR SETUP */}
          {totpSetup && (
            <div className={styles.totpSetup}>
              <div className={styles.totpTitle}>Scan with your authenticator app</div>
              <div className={styles.qrPlaceholder}>
                <div className={styles.qrCode}>
                  {/* In production, render actual QR from totpSetup.qrCode URL */}
                  <div className={styles.qrInner}>QR Code</div>
                  <div className={styles.qrSub}>or enter key manually:</div>
                  <div className={styles.secretKey}>{totpSetup.manualEntryKey}</div>
                </div>
              </div>
              <div className={styles.totpVerify}>
                <input
                  className={styles.codeInput}
                  placeholder="Enter 6-digit code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
                <Button size="sm" loading={loadingTotp} onClick={handleVerifyTotp}>
                  Verify
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* KYC STATUS */}
        <Card className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon} style={{ background: 'rgba(0,208,132,0.12)', color: '#00d084' }}>
              <Check size={20} />
            </div>
            <div>
              <div className={styles.cardTitle}>KYC Verification</div>
              <div className={styles.cardSub}>Identity and face verification status</div>
            </div>
          </div>

          <div className={styles.kycGrid}>
            <div className={styles.kycItem}>
              <div className={styles.kycLabel}>KYC Status</div>
              <div className={`${styles.kycVal} ${styles[user?.kycStatus?.toLowerCase()]}`}>
                {user?.kycStatus || 'PENDING'}
              </div>
            </div>
            <div className={styles.kycItem}>
              <div className={styles.kycLabel}>Face Verified</div>
              <div className={styles.kycVal}>
                {user?.faceVerified ? (
                  <span style={{ color: 'var(--green)' }}>✓ Verified</span>
                ) : (
                  <span style={{ color: 'var(--amber)' }}>Pending</span>
                )}
              </div>
            </div>
          </div>

          {user?.kycStatus !== 'VERIFIED' && (
            <div className={styles.kycWarning}>
              <AlertTriangle size={14} />
              <span>Complete KYC to unlock full trading capabilities.</span>
            </div>
          )}
        </Card>

        {/* ACTIVE SESSIONS */}
        <Card className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon} style={{ background: 'rgba(247,168,65,0.12)', color: '#f7a841' }}>
              <Monitor size={20} />
            </div>
            <div>
              <div className={styles.cardTitle}>Active Sessions</div>
              <div className={styles.cardSub}>Devices currently signed in</div>
            </div>
          </div>

          {MOCK_SESSIONS.map((s, i) => (
            <div key={i} className={styles.sessionRow}>
              <div className={styles.sessionIcon}>
                {s.type === 'mobile' ? <Smartphone size={16} /> : <Monitor size={16} />}
              </div>
              <div className={styles.sessionInfo}>
                <div className={styles.sessionName}>{s.device}</div>
                <div className={styles.sessionMeta}>{s.ip} · {s.location} · {s.time}</div>
              </div>
              {s.current ? (
                <div className={styles.currentBadge}>Current</div>
              ) : (
                <button className={styles.revokeBtn}>Revoke</button>
              )}
            </div>
          ))}
        </Card>

        {/* PASSWORD */}
        <Card className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon} style={{ background: 'rgba(255,77,106,0.12)', color: '#ff4d6a' }}>
              <Shield size={20} />
            </div>
            <div>
              <div className={styles.cardTitle}>Change Password</div>
              <div className={styles.cardSub}>BCrypt hashed, never stored in plaintext</div>
            </div>
          </div>
          <div className={styles.pwForm}>
            <input className={styles.pwInput} type="password" placeholder="Current password" />
            <input className={styles.pwInput} type="password" placeholder="New password (min 6 chars)" />
            <input className={styles.pwInput} type="password" placeholder="Confirm new password" />
            <Button variant="secondary" fullWidth>Update Password</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

const MOCK_SESSIONS = [
  { device: 'Chrome on MacOS', type: 'desktop', ip: '103.21.44.x', location: 'Coimbatore, IN', time: 'Now', current: true },
  { device: 'Safari on iPhone', type: 'mobile', ip: '103.21.44.x', location: 'Coimbatore, IN', time: '2h ago', current: false },
]

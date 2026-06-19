import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Zap, AlertTriangle, Activity, Clock, Bell } from 'lucide-react'
import { userAPI } from '../services/api'
import { setUser } from '../store/slices/authSlice'
import { setKillSwitchModal } from '../store/slices/uiSlice'
import { Button, Card, Toggle } from '../components/ui'
import toast from 'react-hot-toast'
import styles from './SettingsPage.module.css'

const RISK_PROFILES = ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE']
const AUTO_LOGOUT_OPTIONS = [15, 30, 60, 120]

export default function SettingsPage() {
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)
  const [riskProfile, setRiskProfile] = useState(user?.riskProfile || 'MODERATE')
  const [autoLogout, setAutoLogout] = useState(user?.autoLogoutTime || 30)
  const [nudges, setNudges] = useState(user?.nudgesEnabled ?? true)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      await Promise.all([
        userAPI.updateRiskProfile(user.id, riskProfile),
        userAPI.updateAutoLogout(user.id, autoLogout),
        userAPI.toggleNudges(user.id, nudges),
      ])
      dispatch(setUser({ ...user, riskProfile, autoLogoutTime: autoLogout, nudgesEnabled: nudges }))
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <Button onClick={save} loading={saving}>Save Changes</Button>
      </div>

      <div className={styles.grid}>

        {/* Risk Profile */}
        <Card className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon} style={{ background: 'rgba(123,97,255,0.12)', color: '#a390ff' }}>
              <Activity size={20} />
            </div>
            <div>
              <div className={styles.cardTitle}>Risk Profile</div>
              <div className={styles.cardSub}>Controls trade nudges and risk warnings</div>
            </div>
          </div>

          <div className={styles.profileGrid}>
            {RISK_PROFILES.map((p) => (
              <div
                key={p}
                className={`${styles.profileCard} ${riskProfile === p ? styles.profileActive : ''}`}
                onClick={() => setRiskProfile(p)}
              >
                <div className={styles.profileIcon}>
                  {p === 'CONSERVATIVE' ? '🛡️' : p === 'MODERATE' ? '⚖️' : '🚀'}
                </div>
                <div className={styles.profileName}>{p.charAt(0) + p.slice(1).toLowerCase()}</div>
                <div className={styles.profileDesc}>{PROFILE_DESCS[p]}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Auto Logout */}
        <Card className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon} style={{ background: 'rgba(0,208,132,0.12)', color: '#00d084' }}>
              <Clock size={20} />
            </div>
            <div>
              <div className={styles.cardTitle}>Auto Logout</div>
              <div className={styles.cardSub}>Automatically log out after inactivity</div>
            </div>
          </div>

          <div className={styles.logoutGrid}>
            {AUTO_LOGOUT_OPTIONS.map((m) => (
              <button
                key={m}
                className={`${styles.logoutBtn} ${autoLogout === m ? styles.logoutActive : ''}`}
                onClick={() => setAutoLogout(m)}
              >
                {m < 60 ? `${m}m` : `${m / 60}h`}
              </button>
            ))}
          </div>
          <div className={styles.logoutNote}>
            Session will expire after {autoLogout} minutes of inactivity.
          </div>
        </Card>

        {/* Trading Nudges */}
        <Card className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon} style={{ background: 'rgba(247,168,65,0.12)', color: '#f7a841' }}>
              <Bell size={20} />
            </div>
            <div>
              <div className={styles.cardTitle}>AI Risk Nudges</div>
              <div className={styles.cardSub}>Pre-trade warnings for risky positions</div>
            </div>
          </div>

          <div className={styles.nudgesList}>
            {NUDGE_ITEMS.map((n) => (
              <div key={n.title} className={styles.nudgeItem}>
                <div>
                  <div className={styles.nudgeName}>{n.title}</div>
                  <div className={styles.nudgeDesc}>{n.desc}</div>
                </div>
                <Toggle checked={nudges} onChange={setNudges} />
              </div>
            ))}
          </div>
        </Card>

        {/* Kill Switch */}
        <Card className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon} style={{ background: 'rgba(255,77,106,0.12)', color: '#ff4d6a' }}>
              <Zap size={20} />
            </div>
            <div>
              <div className={styles.cardTitle}>Kill Switch</div>
              <div className={styles.cardSub}>Emergency halt — stops all trading instantly</div>
            </div>
          </div>

          <div className={styles.killInfo}>
            <div className={styles.killRow}>
              <div className={styles.killLabel}>Status</div>
              <div className={`${styles.killStatus} ${user?.killSwitchActive ? styles.killActive : ''}`}>
                {user?.killSwitchActive ? '🔴 ACTIVE' : '🟢 Inactive'}
              </div>
            </div>
            <div className={styles.killRow}>
              <div className={styles.killLabel}>Trading</div>
              <div className={user?.tradingEnabled ? styles.killEnabled : styles.killDisabled}>
                {user?.tradingEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>

          <div className={styles.killWarning}>
            <AlertTriangle size={14} />
            <span>Activating will halt all orders and log out all sessions. Contact support to re-enable.</span>
          </div>

          <Button
            variant="danger"
            fullWidth
            onClick={() => dispatch(setKillSwitchModal(true))}
          >
            <Zap size={15} /> Activate Kill Switch
          </Button>
        </Card>

        {/* Trade Limits */}
        <Card className={`${styles.card} ${styles.wideCard}`}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon} style={{ background: 'rgba(123,97,255,0.12)', color: '#a390ff' }}>
              <Activity size={20} />
            </div>
            <div>
              <div className={styles.cardTitle}>Trade Limits</div>
              <div className={styles.cardSub}>Daily and per-trade exposure caps</div>
            </div>
          </div>

          <div className={styles.limitsGrid}>
            <div className={styles.limitItem}>
              <div className={styles.limitLabel}>Daily Limit</div>
              <div className={styles.limitVal}>₹{(user?.dailyLimit || 100000).toLocaleString('en-IN')}</div>
              <div className={styles.limitBar}>
                <div className={styles.limitFill} style={{ width: '64%', background: 'var(--amber)' }} />
              </div>
              <div className={styles.limitNote}>64% used today</div>
            </div>
            <div className={styles.limitItem}>
              <div className={styles.limitLabel}>Per-Trade Limit</div>
              <div className={styles.limitVal}>₹{(user?.perTradeLimit || 50000).toLocaleString('en-IN')}</div>
              <div className={styles.limitBar}>
                <div className={styles.limitFill} style={{ width: '30%', background: 'var(--green)' }} />
              </div>
              <div className={styles.limitNote}>Max per single order</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

const PROFILE_DESCS = {
  CONSERVATIVE: 'Minimal risk, low leverage',
  MODERATE: 'Balanced risk/reward',
  AGGRESSIVE: 'High risk, max leverage',
}

const NUDGE_ITEMS = [
  { title: 'Overexposure Warning', desc: 'Alert when position exceeds daily limit' },
  { title: 'Risky Stock Flag', desc: 'Warning on illiquid or volatile stocks' },
  { title: 'Consecutive Loss Alert', desc: 'Nudge after 3 losing trades in a row' },
]

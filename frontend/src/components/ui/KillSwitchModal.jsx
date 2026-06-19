import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Zap, AlertTriangle, X } from 'lucide-react'
import { setKillSwitchModal } from '../../store/slices/uiSlice'
import { useKillSwitch } from '../../hooks'
import { Button } from './index'
import styles from './KillSwitchModal.module.css'

export default function KillSwitchModal() {
  const dispatch = useDispatch()
  const { killSwitchModal, activate } = useKillSwitch()

  if (!killSwitchModal) return null

  return (
    <div className={styles.overlay} onClick={() => dispatch(setKillSwitchModal(false))}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={() => dispatch(setKillSwitchModal(false))}>
          <X size={18} />
        </button>

        <div className={styles.iconWrap}>
          <Zap size={28} />
        </div>

        <h2 className={styles.title}>Activate Kill Switch?</h2>
        <p className={styles.desc}>
          This will <strong>immediately halt all trading</strong>, cancel open orders,
          and log out all active sessions. You will need to contact support to re-enable trading.
        </p>

        <div className={styles.warning}>
          <AlertTriangle size={14} />
          <span>This action cannot be easily undone</span>
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => dispatch(setKillSwitchModal(false))}>
            Cancel
          </Button>
          <Button variant="danger" onClick={activate}>
            <Zap size={15} /> Activate Kill Switch
          </Button>
        </div>
      </div>
    </div>
  )
}

import React from 'react'
import styles from './EmptyState.module.css'

/**
 * EmptyState — premium light empty/illustration state.
 *  icon? : node  (any icon)
 *  title?: string
 *  desc? : string
 *  action?: node
 */
export default function EmptyState({ icon, title = 'No data yet', desc, action }) {
  return (
    <div className={styles.wrap}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      {desc && <p className={styles.desc}>{desc}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}

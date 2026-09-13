import React from 'react'
import styles from './TitleBar.module.css'

/**
 * TitleBar — premium Apple-style section header.
 *   title      : string | node
 *   subtitle?  : string | node
 *   action?    : node (right-aligned, e.g. button / pill)
 */
export default function TitleBar({ title, subtitle, action, className, children }) {
  return (
    <div className={`${styles.wrap} ${className || ''}`}>
      <div className={styles.head}>
        {subtitle ? (
          <>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.subtitle}>{subtitle}</p>
          </>
        ) : (
          <h2 className={styles.titleOnly}>{title}</h2>
        )}
      </div>
      {action && <div className={styles.action}>{action}</div>}
      {children && <div className={styles.extra}>{children}</div>}
    </div>
  )
}

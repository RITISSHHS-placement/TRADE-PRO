import React from 'react'
import { Skeleton } from '../Skeleton'
import styles from './ChartCard.module.css'

/**
 * ChartCard — premium card wrapping a chart, with header + optional
 * toolbar/actions + loading/empty states.
 *  title?      : node
 *  action?     : node (right side of header)
 *  toolbar?    : node (below header, e.g. tabs / timebuttons)
 *  loading?    : boolean
 *  children    : chart element
 *  height?     : string (chart body height, default '280px')
 */
export default function ChartCard({ title, action, toolbar, loading, children, height = '280px', className }) {
  return (
    <div className={`${styles.card} ${className || ''}`}>
      {(title || action) && (
        <div className={styles.head}>
          {title && <div className={styles.title}>{title}</div>}
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}
      {toolbar && <div className={styles.toolbar}>{toolbar}</div>}
      <div className={styles.body} style={{ height }}>
        {loading ? <Skeleton variant="image" className={styles.skel} /> : children}
      </div>
    </div>
  )
}

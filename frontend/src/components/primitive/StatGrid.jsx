import React from 'react'
import styles from './StatGrid.module.css'

/**
 * StatGrid — responsive grid of StatCard/metric tiles.
 *  cols? : number  (default auto-fill minmax 200px)
 *  gap?  : 'sm'|'md'
 */
export default function StatGrid({ children, cols, gap = 'md', className }) {
  const style = cols ? { '--cols': cols } : undefined
  return (
    <div className={`${styles.grid} ${styles[gap]} ${className || ''}`} style={style}>
      {children}
    </div>
  )
}

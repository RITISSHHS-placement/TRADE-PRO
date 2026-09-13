import React from 'react'
import { Skeleton } from '../Skeleton'
import styles from './LoadingState.module.css'

/**
 * LoadingState — Apple-style skeleton loader.
 *  type? : 'table' | 'cards' | 'chart' | 'list'
 *  rows? : number (for table/list)
 *  cols? : number (for cards)
 */
export default function LoadingState({ type = 'table', rows = 6, cols = 4 }) {
  const cardW = `${100 / cols - (cols - 1) * 2}%`

  if (type === 'cards') {
    return (
      <div className={styles.grid}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className={styles.card}>
            <Skeleton variant="text" className={styles.kicker} />
            <Skeleton variant="heading" className={styles.big} />
            <Skeleton variant="text" className={styles.line2} />
          </div>
        ))}
      </div>
    )
  }

  if (type === 'chart') {
    return <Skeleton variant="image" className={styles.chart} />
  }

  if (type === 'list') {
    return (
      <div className={styles.list}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={styles.listRow}>
            <Skeleton variant="avatar" className={styles.avatar} />
            <Skeleton variant="text" className={styles.line1} />
            <Skeleton variant="text" className={styles.line2} />
          </div>
        ))}
      </div>
    )
  }

  // table
  return (
    <div className={styles.table}>
      <div className={styles.thRow}>
        {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} variant="text" className={styles.th} />)}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={styles.tr}>
          <Skeleton variant="avatar" className={styles.tdAvatar} />
          {Array.from({ length: cols - 1 }).map((_, c) => <Skeleton key={c} variant="text" className={styles.td} />)}
        </div>
      ))}
    </div>
  )
}

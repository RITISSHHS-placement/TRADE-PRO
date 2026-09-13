import React from 'react'
import styles from './Pill.module.css'

/**
 * Pill — tiny colored status tag / pill.
 *  value?     : number  (renders +N%/-N% with auto green/red when positive prop omitted)
 *  positive?  : boolean (force green)
 *  variant?   : 'up'|'down'|'amber'|'blue'|'brand'|'muted'|'success'
 *  children?  : node    (rendered directly, overrides value formatting)
 *  size?      : 'sm'|'md'
 */
export default function Pill({ value, positive, variant, children, size = 'md', className }) {
  if (children != null) {
    return (
      <span className={`${styles.pill} ${styles[size]} ${styles[variant] || ''} ${className || ''}`}>
        {children}
      </span>
    )
  }

  const num = Number(value)
  const isPos = positive ?? (num >= 0)
  const v = variant || (isPos ? 'up' : 'down')
  const sign = num >= 0 ? '+' : ''
  const text = `${sign}${Math.abs(num).toFixed(typeof value === 'number' && value < 1 ? 2 : 1)}%`

  return (
    <span className={`${styles.pill} ${styles[size]} ${styles[v]} ${className || ''}`}>
      {isPos ? '▲ ' : '▼ '}{text}
    </span>
  )
}

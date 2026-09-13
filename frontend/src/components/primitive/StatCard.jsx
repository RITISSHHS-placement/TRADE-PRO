import React from 'react'
import styles from './StatCard.module.css'

/**
 * StatCard — premium metric tile (Apple style).
 *  value     : string | number   (big number)
 *  label     : string            (kicker)
 *  change?   : number            (+/- percentage, renders colored pill)
 *  positive? : boolean           (force green even without change)
 *  prefix?   : string            (₹ / $ / %)
 *  suffix?   : string
 *  icon?     : node              (accent icon)
 *  subtitle? : node              (small helper text under value)
 *  loading?  : boolean
 *  onClick?  : fn
 *  valueSize?: 'sm'|'md'|'lg'
 */
export default function StatCard({
  value, label, change, positive, prefix, suffix, icon, iconColor, subtitle,
  loading, onClick, valueSize = 'md', className, style,
}) {
  const hasChange = change !== undefined && change !== null && !Number.isNaN(Number(change))
  const isPositive = hasChange ? Number(change) >= 0 : (positive || false)

  let formatted = value
  if (typeof value === 'number' || (typeof value === 'string' && value !== '—')) {
    const num = Number(value)
    if (!Number.isNaN(num)) {
      formatted = `${prefix || ''}${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}${suffix || ''}`
    } else {
      formatted = `${prefix || ''}${value}${suffix || ''}`
    }
  } else {
    formatted = value
  }

  // Color the value itself when a direction is meaningful
  let valueCls = styles.value
  if (!loading) {
    if (hasChange && Number(change) < 0) valueCls = `${styles.value} ${styles.valueDown}`
    else if (isPositive || (hasChange && Number(change) > 0)) valueCls = `${styles.value} ${styles.valueUp}`
  }

  return (
    <div
      className={`${styles.card} ${styles[valueSize]} ${loading ? styles.loading : ''} ${onClick ? styles.clickable : ''} ${className || ''}`}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className={styles.row}>
        {icon && <span className={styles.icon} style={iconColor ? { color: iconColor } : undefined}>{icon}</span>}
        <div className={styles.body}>
          <p className={styles.label}>{label}</p>
          <div className={styles.valueWrap}>
            <span className={valueCls}>{loading ? '—' : (formatted ?? '—')}</span>
            {hasChange && !loading && (
              <span className={`${styles.pill} ${isPositive ? styles.pillUp : styles.pillDown}`}>
                {isPositive ? '▲' : '▼'} {Math.abs(Number(change)).toFixed(1)}%
              </span>
            )}
          </div>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        {icon && <span className={styles.iconSpacer} />}
      </div>
    </div>
  )
}

import React from 'react'
import styles from './UI.module.css'

// ---- Button ----
export function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, fullWidth = false,
  onClick, type = 'button', className = '', ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        styles.btn,
        styles[`btn-${variant}`],
        styles[`btn-${size}`],
        fullWidth ? styles.fullWidth : '',
        loading ? styles.loading : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? <span className={styles.spinner} /> : children}
    </button>
  )
}

// ---- Input ----
export const Input = React.forwardRef(function Input(
  { label, error, hint, prefix, suffix, type = 'text', className = '', ...props },
  ref
) {
  return (
    <div className={styles.inputWrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputInner}>
        {prefix && <span className={styles.inputPrefix}>{prefix}</span>}
        <input
          ref={ref}
          type={type}
          className={[
            styles.input,
            error ? styles.inputError : '',
            prefix ? styles.hasPrefix : '',
            suffix ? styles.hasSuffix : '',
            className,
          ].join(' ')}
          {...props}
        />
        {suffix && <span className={styles.inputSuffix}>{suffix}</span>}
      </div>
      {error && <span className={styles.errorMsg}>{error}</span>}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
    </div>
  )
})

// ---- Select ----
export const Select = React.forwardRef(function Select(
  { label, error, options = [], className = '', ...props },
  ref
) {
  return (
    <div className={styles.inputWrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <select
        ref={ref}
        className={[styles.input, styles.select, error ? styles.inputError : '', className].join(' ')}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  )
})

// ---- Card ----
export function Card({ children, className = '', glow = false, ...props }) {
  return (
    <div
      className={[styles.card, glow ? styles.cardGlow : '', className].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

// ---- Badge ----
export function Badge({ children, variant = 'default' }) {
  return (
    <span className={[styles.badge, styles[`badge-${variant}`]].join(' ')}>
      {children}
    </span>
  )
}

// ---- Stat ----
export function Stat({ label, value, change, changeType }) {
  return (
    <Card className={styles.stat}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
      {change && (
        <div className={`${styles.statChange} ${styles[changeType]}`}>
          {changeType === 'up' ? '↑' : '↓'} {change}
        </div>
      )}
    </Card>
  )
}

// ---- Toggle ----
export function Toggle({ checked, onChange, label }) {
  return (
    <label className={styles.toggleLabel}>
      <div
        className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
        onClick={() => onChange(!checked)}
      >
        <div className={styles.toggleKnob} />
      </div>
      {label && <span className={styles.toggleText}>{label}</span>}
    </label>
  )
}

// ---- Spinner ----
export function Spinner({ size = 20 }) {
  return (
    <div
      className={styles.spinnerStandalone}
      style={{ width: size, height: size }}
    />
  )
}

// ---- Empty State ----
export function EmptyState({ icon = '◈', title, description }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>{icon}</div>
      <div className={styles.emptyTitle}>{title}</div>
      {description && <div className={styles.emptyDesc}>{description}</div>}
    </div>
  )
}

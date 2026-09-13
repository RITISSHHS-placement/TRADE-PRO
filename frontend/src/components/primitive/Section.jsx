import React from 'react'
import { ChevronDown } from 'lucide-react'
import styles from './Section.module.css'

/**
 * Section — titled, bordered panel group (Tickertape data block style).
 *  title?    : node
 *  subtitle? : node
 *  icon?     : node (kicker icon)
 *  right?    : node (right-side control, e.g. filter pills)
 *  children? : node
 *  noBorder? : boolean
 */
export default function Section({ title, subtitle, icon, right, children, noBorder, className }) {
  return (
    <section className={`${styles.section} ${noBorder ? styles.noBorder : ''} ${className || ''}`}>
      {(title || subtitle) && (
        <div className={styles.head}>
          <div className={styles.headLeft}>
            {icon && <span className={styles.icon}>{icon}</span>}
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
          </div>
          {right && <div className={styles.right}>{right}</div>}
        </div>
      )}
      {children && <div className={styles.body}>{children}</div>}
    </section>
  )
}

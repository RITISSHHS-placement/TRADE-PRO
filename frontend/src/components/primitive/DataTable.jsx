import React, { useMemo } from 'react'
import styles from './DataTable.module.css'

/**
 * DataTable — dense, Tickertape-style premium table.
 *  columns : Array<{
 *    key, header, sortable?, align?: 'left'|'right'|'center',
 *    width?: string|number, render?: (row) => node, className?: string
 *  }>
 *  rows        : Array<any>
 *  rowKey?      : string | ((row) => string|number)
 *  sortable?    : boolean (global toggle; per-column wins)
 *  onSort?      : (key, direction) => void
 *  onRowClick?  : (row) => void
 *  loading?     : boolean
 *  emptyTitle?  : string
 *  emptyDesc?   : string
 *  stickyHeader?: boolean
 *  className?, style?
 */
export default function DataTable({
  columns, rows, rowKey, sortable = false, onSort, onRowClick,
  loading, emptyTitle = 'No data', emptyDesc, stickyHeader = true,
  className, style,
}) {
  const keyFn = typeof rowKey === 'function'
    ? rowKey
    : (r) => (rowKey ? r[rowKey] : r.symbol ?? r.id ?? r.name)

  // sort state managed externally via onSort when provided; internal state otherwise
  const [internalSort, setInternalSort] = React.useState({ key: null, dir: 'asc' })
  const sortState = onSort ? null : internalSort

  const sortedRows = useMemo(() => {
    if (!sortState?.key) return rows
    const dir = sortState.dir === 'asc' ? 1 : -1
    const safe = [...rows].sort((a, b) => {
      const ka = a[sortState.key], kb = b[sortState.key]
      if (ka == null) return 1
      if (kb == null) return -1
      if (typeof ka === 'string') return ka.localeCompare(kb) * dir
      return (Number(ka) - Number(kb)) * dir
    })
    return safe
  }, [rows, sortState])

  const handleSort = (col) => {
    if (!col.sortable && !sortable) return
    const nextDir = (sortState && sortState.key === col.key && sortState.dir === 'asc') ? 'desc' : 'asc'
    const newState = { key: col.key, dir: nextDir }
    if (onSort) onSort(col.key, nextDir)
    else setInternalSort(newState)
  }

  if (loading) {
    return (
      <div className={`${styles.wrap} ${className || ''}`} style={style}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead className={stickyHeader ? styles.sticky : ''}>
              <tr>
                {columns.map((_, i) => (
                  <th key={i} className={styles.th}>
                    <span className="pshimmer" style={{ width: '60%', height: 11, display: 'block' }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 7 }).map((_, r) => (
                <tr key={`s-${r}`}>
                  {columns.map((_, c) => (
                    <td key={`s-${r}-${c}`} className={styles.td}>
                      <span className="pshimmer" style={{ width: c === 0 ? '40%' : '70%', height: 12, display: 'block' }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const isEmpty = !rows || rows.length === 0

  return (
    <div className={`${styles.wrap} ${className || ''}`} style={style}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead className={stickyHeader ? styles.sticky : ''}>
            <tr>
              {columns.map((col) => {
                const canSort = col.sortable || sortable
                const active = sortState?.key === col.key
                const isSortable = canSort && col.sortable !== false
                return (
                  <th
                    key={col.key}
                    className={`${styles.th} ${col.align === 'right' ? styles.right : ''} ${isSortable ? styles.sortable : ''} ${active ? (sortState.dir === 'asc' ? styles.asc : styles.desc) : ''}`}
                    style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                    onClick={() => handleSort(col)}
                    scope="col"
                  >
                    <span className={styles.thContent}>
                      {col.header}
                      {isSortable && (
                        <span className={styles.arrow}>{active && sortState.dir === 'asc' ? '▲' : active && sortState.dir === 'desc' ? '▼' : '•'}</span>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={columns.length} className={styles.empty}>
                  <span className={styles.emptyTitle}>{emptyTitle}</span>
                  {emptyDesc && <span className={styles.emptyDesc}>{emptyDesc}</span>}
                </td>
              </tr>
            ) : (
              sortedRows.map((row, i) => (
                <tr
                  key={keyFn(row) ?? i}
                  className={`${styles.tr} ${onRowClick ? styles.clickable : ''}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => {
                    const val = row[col.key]
                    const cls = [styles.td, col.align === 'right' ? styles.right : '', col.className].filter(Boolean).join(' ')
                    return (
                      <td key={col.key} className={cls}>
                        {col.render ? col.render(row, val) : (val ?? '—')}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

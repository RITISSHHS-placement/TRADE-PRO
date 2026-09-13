import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, Search, Bell, BellRing, Zap, ExternalLink, Calendar,
  BarChart2, ChevronRight,
} from 'lucide-react'
import { TitleBar, StatGrid, StatCard, Section, Pill, MarketTicker } from '../components/primitive'
import styles from './IPOWatchPage.module.css'

const IPO_DATA = [
  { id: 1, name: 'Swiggy Ltd', sector: 'Food Delivery', type: 'Mainboard', priceRange: '371-390', lotSize: 38, minInvest: 14820, openDate: '2026-09-05', closeDate: '2026-09-09', listingDate: '2026-09-12', status: 'upcoming', gmp: 42, gmpPct: 10.8, subscription: { qib: 0, nii: 0, retail: 0, total: 0 }, description: 'Leading food delivery platform in India with 50M+ monthly orders.', fundamentals: { pe: 85.2, revenue: '₹11,200 Cr', profit: '-₹2,300 Cr', debt: '₹1,800 Cr' } },
  { id: 2, name: 'Ola Electric Mobility', sector: 'Electric Vehicles', type: 'Mainboard', priceRange: '72-76', lotSize: 195, minInvest: 14820, openDate: '2026-09-02', closeDate: '2026-09-04', listingDate: '2026-09-08', status: 'open', gmp: -3, gmpPct: -3.9, subscription: { qib: 1.2, nii: 2.8, retail: 4.5, total: 2.8 }, description: "India's largest electric two-wheeler manufacturer.", fundamentals: { pe: 0, revenue: '₹5,200 Cr', profit: '-₹1,400 Cr', debt: '₹3,200 Cr' } },
  { id: 3, name: 'FirstCry (Brainbees)', sector: 'E-commerce', type: 'Mainboard', priceRange: '450-470', lotSize: 31, minInvest: 14570, openDate: '2026-08-28', closeDate: '2026-08-30', listingDate: '2026-09-03', status: 'closed', gmp: 65, gmpPct: 13.8, subscription: { qib: 8.4, nii: 12.5, retail: 18.2, total: 12.8 }, description: 'India\'s largest online platform for baby and kids products.', fundamentals: { pe: 42.5, revenue: '₹6,800 Cr', profit: '₹420 Cr', debt: '₹800 Cr' } },
  { id: 4, name: 'boAt Lifestyle', sector: 'Consumer Electronics', type: 'SME', priceRange: '325-340', lotSize: 44, minInvest: 14960, openDate: '2026-08-25', closeDate: '2026-08-27', listingDate: '2026-09-01', status: 'listed', gmp: 85, gmpPct: 25.0, subscription: { qib: 12.5, nii: 28.4, retail: 42.8, total: 28.5 }, description: "India's #1 audio brand with 30% market share in earwear.", fundamentals: { pe: 28.4, revenue: '₹3,200 Cr', profit: '₹285 Cr', debt: '₹120 Cr' }, listingPrice: 425, listingGain: 25.0 },
  { id: 5, name: 'JSW Infrastructure', sector: 'Infrastructure', type: 'Mainboard', priceRange: '115-120', lotSize: 125, minInvest: 15000, openDate: '2026-08-20', closeDate: '2026-08-22', listingDate: '2026-08-27', status: 'listed', gmp: 28, gmpPct: 23.3, subscription: { qib: 18.2, nii: 35.4, retail: 52.8, total: 35.5 }, description: 'JSW Group\'s port operations arm with 70+ MTPA capacity.', fundamentals: { pe: 22.8, revenue: '₹4,800 Cr', profit: '₹820 Cr', debt: '₹2,400 Cr' }, listingPrice: 148, listingGain: 23.3 },
  { id: 6, name: 'Tata Technologies', sector: 'IT Services', type: 'Mainboard', priceRange: '475-500', lotSize: 30, minInvest: 15000, openDate: '2026-08-15', closeDate: '2026-08-17', listingDate: '2026-08-22', status: 'listed', gmp: 320, gmpPct: 64.0, subscription: { qib: 42.5, nii: 85.2, retail: 72.4, total: 68.5 }, description: 'Tata Group\'s engineering services and IT solutions company.', fundamentals: { pe: 38.5, revenue: '₹4,200 Cr', profit: '₹620 Cr', debt: '₹85 Cr' }, listingPrice: 820, listingGain: 64.0 },
]

const GMP_DATA = [
  { name: 'Tata Technologies', gmp: 320, gmpPct: 64.0, status: 'listed' },
  { name: 'boAt Lifestyle', gmp: 85, gmpPct: 25.0, status: 'listed' },
  { name: 'JSW Infrastructure', gmp: 28, gmpPct: 23.3, status: 'listed' },
  { name: 'FirstCry', gmp: 65, gmpPct: 13.8, status: 'closed' },
  { name: 'Swiggy', gmp: 42, gmpPct: 10.8, status: 'upcoming' },
  { name: 'Ola Electric', gmp: -3, gmpPct: -3.9, status: 'open' },
]

const TABS = ['All', 'Upcoming', 'Open', 'Closed', 'Listed']
const STATUS_VARIANT = { upcoming: 'blue', open: 'success', closed: 'amber', listed: 'brand' }
const STATUS_LABEL = { upcoming: 'Upcoming', open: 'Open', closed: 'Closed', listed: 'Listed' }

export default function IPOWatchPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const [alerts, setAlerts] = useState({})
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    let arr = [...IPO_DATA]
    if (tab !== 'All') arr = arr.filter(i => i.status === tab.toLowerCase())
    if (search.trim()) {
      const q = search.toLowerCase()
      arr = arr.filter(i => i.name.toLowerCase().includes(q) || i.sector.toLowerCase().includes(q))
    }
    return arr
  }, [tab, search])

  const toggleAlert = id => setAlerts(prev => ({ ...prev, [id]: !prev[id] }))

  const upcoming = IPO_DATA.filter(i => i.status === 'upcoming').length
  const openNow = IPO_DATA.filter(i => i.status === 'open').length
  const avgGmp = (GMP_DATA.reduce((s, g) => s + g.gmpPct, 0) / GMP_DATA.length).toFixed(1)
  const totalRaised = '₹18,500 Cr'

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <TitleBar title="IPO Watch" subtitle="Track upcoming, open, and recently listed IPOs" />
        <button className={styles.alertBtn}><Bell size={15} /> Set Alert</button>
      </div>

      <StatGrid cols={4}>
        <StatCard label="Upcoming IPOs" value={upcoming} icon={<Calendar size={16} />} iconColor="var(--blue)" />
        <StatCard label="Open Now" value={openNow} icon={<Zap size={16} />} iconColor="var(--green)" />
        <StatCard label="Avg GMP" value={`+${avgGmp}%`} icon={<BarChart2 size={16} />} iconColor="var(--amber)" />
        <StatCard label="Total Raised" value={totalRaised} icon={<TrendingUp size={16} />} iconColor="var(--blue)" />
      </StatGrid>

      <Section
        title="Live GMP (Grey Market Premium)"
        icon={<Zap size={14} />}
        right={<span className={styles.live}><span className={styles.dot} /> LIVE</span>}
      >
        <div className={styles.gmpScroll}>
          {GMP_DATA.map(g => (
            <div key={g.name} className={styles.gmpCard}>
              <span className={styles.gmpName}>{g.name}</span>
              <span className={styles.gmpVal}>
                {g.gmp >= 0 ? '+' : ''}₹{g.gmp}
                <Pill variant={g.gmp >= 0 ? 'up' : 'down'}>{g.gmpPct >= 0 ? '+' : ''}{g.gmpPct.toFixed(1)}%</Pill>
              </span>
            </div>
          ))}
        </div>
      </Section>

      <MarketTicker />

      <div className={styles.toolbar}>
        <div className={styles.tabChips}>
          {TABS.map(t => (
            <button key={t} className={`${styles.tabChip} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <div className={styles.searchField}>
          <Search size={13} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search IPOs…" />
        </div>
      </div>

      <div className={styles.list}>
        {filtered.map(ipo => (
          <div
            key={ipo.id}
            className={`${styles.ipoCard} ${selected?.id === ipo.id ? styles.ipoCardSel : ''}`}
            onClick={() => setSelected(selected?.id === ipo.id ? null : ipo)}
          >
            <div className={styles.ipoHead}>
              <div className={styles.ipoLogo} style={{ background: `rgba(26,115,232,.08)` }}>
                <span className={styles.ipoLogoText}>{ipo.name.charAt(0)}</span>
              </div>
              <div className={styles.ipoInfo}>
                <div className={styles.ipoTitle}>
                  <span className={styles.ipoName}>{ipo.name}</span>
                  <Pill variant={STATUS_VARIANT[ipo.status]} size="sm">{STATUS_LABEL[ipo.status]}</Pill>
                  <span className={styles.ipoType}>{ipo.type}</span>
                </div>
                <div className={styles.ipoMeta}>{ipo.sector} · Lot: {ipo.lotSize} shares · Min: ₹{ipo.minInvest.toLocaleString('en-IN')}</div>
              </div>
              <div className={styles.ipoPrice}><span>Price Band</span><strong>₹{ipo.priceRange}</strong></div>
              <div className={styles.ipoGmp}>
                <span>GMP</span>
                <strong className={ipo.gmp >= 0 ? styles.green : styles.red}>
                  {ipo.gmp >= 0 ? '+' : ''}₹{ipo.gmp} ({ipo.gmpPct >= 0 ? '+' : ''}{ipo.gmpPct.toFixed(1)}%)
                </strong>
              </div>
              <button
                className={`${styles.alertToggle} ${alerts[ipo.id] ? styles.alertOn : ''}`}
                onClick={e => { e.stopPropagation(); toggleAlert(ipo.id) }}
                aria-label="Toggle alert"
              >
                {alerts[ipo.id] ? <BellRing size={14} /> : <Bell size={14} />}
              </button>
              <ChevronRight className={styles.chevron} size={16} />
            </div>

            {selected?.id === ipo.id && (
              <div className={styles.ipoDetails}>
                <div className={styles.detailGrid}>
                  <div>
                    <div className={styles.detailKicker}>Timeline</div>
                    {['Open Date', 'Close Date', 'Listing Date'].map(k => {
                      const map = { 'Open Date': ipo.openDate, 'Close Date': ipo.closeDate, 'Listing Date': ipo.listingDate }
                      return (
                        <div key={k} className={styles.detailRow}>
                          <span className={styles.detailLabel}>{k}</span>
                          <span className={styles.detailValue}>{map[k]}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div>
                    <div className={styles.detailKicker}>Subscription</div>
                    {Object.entries(ipo.subscription).map(([k, v]) => (
                      <div key={k} className={styles.detailRow}>
                        <span className={styles.detailLabel}>{(k).toUpperCase()}</span>
                        <span className={`${styles.detailValue} ${v > 10 ? styles.green : v > 0 ? styles.blue : styles.muted}`}>
                          {v > 0 ? `${Number(v).toFixed(1)}x` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className={styles.detailKicker}>Fundamentals</div>
                    <div className={styles.detailRow}><span className={styles.detailLabel}>P/E Ratio</span><span className={styles.detailValue}>{ipo.fundamentals.pe > 0 ? ipo.fundamentals.pe : 'N/A'}</span></div>
                    <div className={styles.detailRow}><span className={styles.detailLabel}>Revenue</span><span className={styles.detailValue}>{ipo.fundamentals.revenue}</span></div>
                    <div className={styles.detailRow}><span className={styles.detailLabel}>Profit</span><span className={styles.detailValue}>{ipo.fundamentals.profit}</span></div>
                    <div className={styles.detailRow}><span className={styles.detailLabel}>Debt</span><span className={styles.detailValue}>{ipo.fundamentals.debt}</span></div>
                  </div>
                </div>
                <p className={styles.ipoDescription}>{ipo.description}</p>
                <div className={styles.ipoActions}>
                  <button
                    className={styles.applyBtn}
                    onClick={e => {
                      e.stopPropagation()
                      navigate(`/dashboard/payment?name=${encodeURIComponent(ipo.name)}&type=IPO&min=${ipo.minInvest}&category=${encodeURIComponent(ipo.sector)}`)
                    }}
                  >Apply Now <ExternalLink size={13} /></button>
                  <button className={styles.drhpBtn}>View DRHP</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

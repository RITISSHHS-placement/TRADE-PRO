import React, { useEffect, useState, useRef } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  Search, Bell, LogOut, Sun, Moon, ChevronDown, Zap,
  BarChart2, Briefcase, Settings, Shield, TrendingUp,
  PieChart, Star, Newspaper, LayoutDashboard, IndianRupee,
  Globe2,
} from 'lucide-react'
import { logoutUser } from '../../store/slices/authSlice'
import { toggleTheme } from '../../store/slices/uiSlice'
import KillSwitchModal from '../ui/KillSwitchModal'
import { useAutoLogout } from '../../hooks'
import styles from './DashboardLayout.module.css'

/* ── Stock ticker data ── */
const TICKER_ITEMS = [
  { sym: 'NIFTY 50',     price: 24856.45, chg: 2.14 },
  { sym: 'NIFTY BANK',   price: 52341.80, chg: -1.23 },
  { sym: 'BAJFINANCE',   price: 7124.55,  chg: 1.85 },
  { sym: 'BHARTIARTL',   price: 920.65,   chg: 2.10 },
  { sym: 'HDFCBANK',     price: 1610.80,  chg: 0.85 },
  { sym: 'HINDUNILVR',   price: 2480.30,  chg: -0.42 },
  { sym: 'INDIGO',       price: 4120.60,  chg: 3.21 },
  { sym: 'RELIANCE',     price: 2450.40,  chg: 1.25 },
  { sym: 'TCS',          price: 3420.15,  chg: -0.45 },
  { sym: 'INFY',         price: 1480.20,  chg: -1.15 },
  { sym: 'WIPRO',        price: 540.70,   chg: 0.60 },
  { sym: 'SBIN',         price: 780.25,   chg: -0.80 },
]

/* ── More dropdown data with routes ── */
const MORE_PRODUCTS = [
  { icon: '$',  bg: '#2563eb', label: 'US Equity',   badge: 'New', to: '/dashboard/us-stocks' },
  { icon: '↑',  bg: '#ea580c', label: 'IN Stocks',                 to: '/dashboard/market' },
  { icon: '📈', bg: '#0d9488', label: 'ETFs',                       to: '/dashboard/market' },
  { icon: '⚖',  bg: '#0d9488', label: 'Indices',                    to: '/dashboard/market' },
  { icon: '◎',  bg: '#7c3aed', label: 'MFs',                        to: '/dashboard/mf' },
  { icon: '▣',  bg: '#2563eb', label: 'smallcases',                 to: '/dashboard/mf' },
  { icon: '🪙', bg: '#d97706', label: 'Gold',                        to: '/dashboard/digital-gold' },
  { icon: '₹',  bg: '#7c3aed', label: 'LAMF',                       to: '/dashboard/mf' },
  { icon: '₹',  bg: '#16a34a', label: 'LAS',                        to: '/dashboard/pricing' },
]
const MORE_TOOLS = [
  { icon: '◉',  bg: '#2563eb', label: 'Stock Screener',             to: '/dashboard/screener-landing' },
  { icon: '◉',  bg: '#7c3aed', label: 'MF Screener',               to: '/dashboard/mf' },
  { icon: '$',  bg: '#16a34a', label: 'US Screener', badge: 'New',  to: '/dashboard/us-stocks' },
  { icon: '↑↓', bg: '#ea580c', label: 'Market Movers',              to: '/dashboard/market' },
  { icon: '●',  bg: '#2563eb', label: 'Market Mood',                to: '/dashboard/market' },
  { icon: '💼', bg: '#2563eb', label: 'Portfolio',                  to: '/dashboard/portfolio' },
  { icon: '🔖', bg: '#7c3aed', label: 'Watchlist',                  to: '/dashboard/watchlist' },
  { icon: '🔔', bg: '#16a34a', label: 'Alerts',                     to: '/dashboard/settings' },
  { icon: '🌐', bg: '#06b6d4', label: 'News and Events',            to: '/dashboard/news' },
]
const MORE_LEARN = [
  { icon: '📖', bg: '#2563eb', label: 'Learn',                      to: '/dashboard/market' },
  { icon: '👥', bg: '#1e293b', label: 'Social',                     to: '/dashboard/market' },
  { icon: '💬', bg: '#1e293b', label: 'Blog',                       to: '/dashboard/market' },
  { icon: '🎓', bg: '#1e293b', label: "How To's",                   to: '/dashboard/market' },
]

/* ── Top nav items ── */
const NAV_ITEMS = [
  { to: '/dashboard/portfolio',       label: 'Portfolio' },
  { to: '/dashboard/digital-gold',    label: 'Gold' },
  { to: '/dashboard/screener-landing',label: 'Screener' },
  { to: '/dashboard/us-stocks',       label: 'US Stocks' },
]

/* ── More Dropdown Component ── */
function MoreDropdown({ open, onClose }) {
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  const go = (to) => { navigate(to); onClose() }

  if (!open) return null

  const renderGrid = (items) => (
    <div className={styles.moreGrid}>
      {items.map(item => (
        <button key={item.label} className={styles.moreItem} onClick={() => go(item.to)}>
          <span className={styles.moreIcon} style={{ background: item.bg }}>{item.icon}</span>
          <span className={styles.moreLabel}>{item.label}</span>
          {item.badge && <span className={styles.moreBadge}>{item.badge}</span>}
        </button>
      ))}
    </div>
  )

  return (
    <div ref={ref} className={styles.moreDropdown}>
      <div className={styles.moreSection}>
        <div className={styles.moreSectionTitle}>Products</div>
        {renderGrid(MORE_PRODUCTS)}
      </div>
      <div className={styles.moreDivider} />
      <div className={styles.moreSection}>
        <div className={styles.moreSectionTitle}>Tools of the trade</div>
        {renderGrid(MORE_TOOLS)}
      </div>
      <div className={styles.moreDivider} />
      <div className={styles.moreSection}>
        <div className={styles.moreSectionTitle}>Read and share</div>
        {renderGrid(MORE_LEARN)}
      </div>
    </div>
  )
}

/* ── Ticker strip ── */
function TickerStrip() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className={styles.tickerWrap}>
      <div className={styles.tickerTrack}>
        {doubled.map((item, i) => (
          <span key={i} className={styles.tickerItem}>
            <span className={styles.tickerSym}>{item.sym}</span>
            <span className={styles.tickerPrice}>{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className={item.chg >= 0 ? styles.tickerUp : styles.tickerDn}>
              {item.chg >= 0 ? '▲' : '▼'} {Math.abs(item.chg).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Main layout ── */
export default function DashboardLayout() {
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const { user }   = useSelector((s) => s.auth)
  const { theme }  = useSelector((s) => s.ui)
  const isDark     = theme === 'dark'
  const [moreOpen, setMoreOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const { setupAutoLogout } = useAutoLogout()

  useEffect(() => {
    const cleanup = setupAutoLogout()
    return cleanup
  }, [user])

  const handleLogout = () => {
    dispatch(logoutUser())
    navigate('/login')
  }

  return (
    <div className={styles.layout}>
      {/* ── Top Nav ── */}
      <header className={styles.topNav}>
        <div className={styles.topNavInner}>
          {/* Logo */}
          <Link to="/dashboard" className={styles.navLogo}>
            <span className={styles.navLogoIcon}>T</span>
            <span className={styles.navLogoText}>TradePro</span>
          </Link>

          {/* Search */}
          <div className={styles.navSearch}>
            <Search size={14} className={styles.navSearchIcon} />
            <input
              className={styles.navSearchInput}
              placeholder="Search for Mutual Funds"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
            />
            <span className={styles.navSearchShortcut}>/</span>
          </div>

          {/* Nav links */}
          <nav className={styles.navLinks}>
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                {label}
              </NavLink>
            ))}
            {/* More dropdown trigger */}
            <div className={styles.moreWrapper}>
              <button
                className={`${styles.navLink} ${moreOpen ? styles.navLinkActive : ''}`}
                onClick={() => setMoreOpen(v => !v)}
              >
                More <ChevronDown size={13} />
              </button>
              <MoreDropdown open={moreOpen} onClose={() => setMoreOpen(false)} />
            </div>
          </nav>

          {/* Right side */}
          <div className={styles.navRight}>
            <button className={styles.navIconBtn} onClick={() => dispatch(toggleTheme())} aria-label="Toggle theme">
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className={styles.navIconBtn} aria-label="Notifications">
              <Bell size={15} />
            </button>
            <button
              className={styles.killSwitchBtn}
              onClick={() => dispatch({ type: 'ui/setKillSwitchModal', payload: true })}
            >
              <Zap size={13} /> Kill Switch
            </button>
            <div className={styles.userChip}>
              <div className={styles.userAvatar}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className={styles.userName}>{user?.name || 'User'}</span>
            </div>
            <button className={styles.signupBtn} onClick={handleLogout}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── Ticker strip ── */}
      <TickerStrip />

      {/* ── Content ── */}
      <main className={styles.content}>
        <Outlet />
      </main>

      <KillSwitchModal />
    </div>
  )
}

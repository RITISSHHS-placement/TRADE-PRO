import React, { useEffect, useState, useRef } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  Search, LogOut, Sun, Moon, ChevronDown, Zap,
  BarChart2, Briefcase, Settings, Shield, TrendingUp,
  PieChart, Star, Newspaper, LayoutDashboard, IndianRupee,
  Globe2, Menu, X,
} from 'lucide-react'
import { logoutUser } from '../../store/slices/authSlice'
import { toggleTheme } from '../../store/slices/uiSlice'
import KillSwitchModal from '../ui/KillSwitchModal'
import NotificationBell from '../NotificationBell'
import MarketTicker from '../primitive/MarketTicker'
import CommandPalette from '../primitive/CommandPalette'
import { useAutoLogout } from '../../hooks'
import styles from './DashboardLayout.module.css'

/* ── Top nav items — all primary routes surfaced here ── */
const NAV_ITEMS = [
  { to: '/dashboard',            label: 'Dashboard',  tip: 'Overview' },
  { to: '/dashboard/trade',      label: 'Trade',      tip: 'US stocks & options' },
  { to: '/dashboard/crypto',     label: 'Crypto',     tip: 'Crypto exchange' },
  { to: '/dashboard/invest',     label: 'Invest',     tip: 'Mutual funds & more' },
  { to: '/dashboard/portfolio',  label: 'Portfolio',  tip: 'Your holdings' },
  { to: '/dashboard/us-stocks',  label: 'US Stocks',  tip: 'US equity markets' },
  { to: '/dashboard/screener',   label: 'Screener',   tip: 'Stock screener' },
  { to: '/dashboard/news',       label: 'News',       tip: 'Market news' },
  { to: '/dashboard/ipo-watch',  label: 'IPO',        tip: 'IPO watchlist' },
  { to: '/dashboard/revenue-recovery', label: 'Recover', tip: 'Revenue recovery' },
]

/* ── More dropdown data with routes ── */
const MORE_PRODUCTS = [
  { icon: '$',  bg: '#2563eb', label: 'US Equity',   badge: 'New', to: '/dashboard/us-stocks' },
  { icon: '↑',  bg: '#ea580c', label: 'IN Stocks',                 to: '/dashboard/market' },
  { icon: '₿',  bg: '#f7931a', label: 'Crypto',      badge: 'New', to: '/dashboard/crypto' },
  { icon: '📊', bg: '#1a73e8', label: 'Crypto Portfolio', to: '/dashboard/crypto-portfolio' },
  { icon: '📈', bg: '#0d9488', label: 'ETFs',                       to: '/dashboard/market' },
  { icon: '⚖',  bg: '#0d9488', label: 'Indices',                    to: '/dashboard/market' },
  { icon: '◎',  bg: '#7c3aed', label: 'MFs',                        to: '/dashboard/mf' },
  { icon: '▣',  bg: '#2563eb', label: 'smallcases',                 to: '/dashboard/smallcases' },
  { icon: '🪙', bg: '#d97706', label: 'Gold',                        to: '/dashboard/digital-gold' },
  { icon: '₹',  bg: '#7c3aed', label: 'LAMF',                       to: '/dashboard/mf' },
  { icon: '₹',  bg: '#16a34a', label: 'LAS',                        to: '/dashboard/pricing' },
]
const MORE_TOOLS = [
  { icon: '✦',  bg: '#0f766e', label: 'AI Revenue Recovery',       badge: 'New',  to: '/dashboard/revenue-recovery' },
  { icon: '◉',  bg: '#2563eb', label: 'Stock Screener',             to: '/dashboard/screener' },
  { icon: '◉',  bg: '#7c3aed', label: 'MF Screener',               to: '/dashboard/mf-screener' },
  { icon: '$',  bg: '#16a34a', label: 'US Screener', badge: 'New',  to: '/dashboard/us-stocks' },
  { icon: '↑↓', bg: '#ea580c', label: 'Market Movers',              to: '/dashboard/market' },
  { icon: '●',  bg: '#2563eb', label: 'Market Mood',                to: '/dashboard/market' },
  { icon: '💼', bg: '#2563eb', label: 'Portfolio',                  to: '/dashboard/portfolio' },
  { icon: '🔖', bg: '#7c3aed', label: 'Watchlist',                  to: '/dashboard/watchlist' },
  { icon: '🔔', bg: '#16a34a', label: 'Crypto Alerts',              to: '/dashboard/price-alerts' },
  { icon: '🌐', bg: '#06b6d4', label: 'News and Events',            to: '/dashboard/news' },
  { icon: '🔢', bg: '#7c3aed', label: 'IPO Watch',                  to: '/dashboard/ipo-watch' },
]
const MORE_LEARN = [
  { icon: '📖', bg: '#2563eb', label: 'Learn',                      to: '/dashboard/market' },
  { icon: '👥', bg: '#1e293b', label: 'Social',                     to: '/dashboard/market' },
  { icon: '💬', bg: '#1e293b', label: 'Blog',                       to: '/dashboard/market' },
  { icon: '🎓', bg: '#1e293b', label: "How To's",                   to: '/dashboard/market' },
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

/* ── Main layout ── */
export default function DashboardLayout() {
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const { user }   = useSelector((s) => s.auth)
  const { theme }  = useSelector((s) => s.ui)
  const isDark     = theme === 'dark'
  const [moreOpen,    setMoreOpen]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [searchVal,   setSearchVal]   = useState('')
  const drawerRef = useRef(null)
  const { setupAutoLogout } = useAutoLogout()

  useEffect(() => {
    const cleanup = setupAutoLogout()
    return cleanup
  }, [user])

  // Close mobile drawer on outside tap
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleLogout = () => {
    dispatch(logoutUser())
    navigate('/login')
  }

  const handleMobileNav = (to) => {
    navigate(to)
    setMobileOpen(false)
  }

  return (
    <div className={styles.layout}>
      {/* ── Top Nav ── */}
      <header className={styles.topNav}>
        <div className={styles.topNavInner}>
          {/* Hamburger — mobile only */}
          <button
            className={styles.hamburger}
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Logo */}
          <Link to="/dashboard" className={styles.navLogo}>
            <span className={styles.navLogoIcon}>
              <TrendingUp size={14} color="#fff" />
            </span>
            <span className={styles.navLogoText}>TradePro</span>
          </Link>

          {/* Search */}
          <div className={styles.navSearch}>
            <Search size={14} className={styles.navSearchIcon} />
            <input
              className={styles.navSearchInput}
              placeholder="Search stocks, ETFs, MFs… (⌘K)"
              aria-label="Search"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchVal.trim()) {
                  navigate('/dashboard/screener?q=' + encodeURIComponent(searchVal.trim()))
                  setSearchVal('')
                }
              }}
            />
            <span className={styles.navSearchShortcut}>⌘K</span>
          </div>

          {/* Nav links — desktop */}
          <nav className={styles.navLinks}>
            {NAV_ITEMS.map(({ to, label, tip }) => (
              <NavLink
                key={to}
                to={to}
                title={tip}
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
            <NotificationBell />
            <button
              className={styles.killSwitchBtn}
              onClick={() => dispatch({ type: 'ui/setKillSwitchModal', payload: true })}
            >
              <Zap size={13} /> <span className={styles.killSwitchLabel}>Kill Switch</span>
            </button>
            <div className={styles.userChip}>
              <div className={styles.userAvatar}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className={styles.userName}>{user?.name || 'User'}</span>
            </div>
            <button className={styles.signupBtn} onClick={handleLogout}>
              <LogOut size={13} /> <span className={styles.logoutLabel}>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Ticker strip (global markets) + ⌘K Spotlight ── */}
      <MarketTicker />
      <CommandPalette />

      {/* ── Mobile Drawer overlay ── */}
      {mobileOpen && (
        <div
          className={styles.drawerOverlay}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Drawer ── */}
      <aside
        ref={drawerRef}
        className={`${styles.drawer} ${mobileOpen ? styles.drawerOpen : ''}`}
        aria-label="Mobile navigation"
      >
        {/* Drawer header */}
        <div className={styles.drawerHeader}>
          <Link to="/dashboard" className={styles.navLogo} onClick={() => setMobileOpen(false)}>
            <span className={styles.navLogoIcon}>
              <TrendingUp size={14} color="#fff" />
            </span>
            <span className={styles.navLogoText}>TradePro</span>
          </Link>
          <button className={styles.drawerClose} onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className={styles.drawerUser}>
          <div className={styles.drawerUserAvatar}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className={styles.drawerUserName}>{user?.name || 'User'}</div>
            <div className={styles.drawerUserEmail}>{user?.email || ''}</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className={styles.drawerNav}>
          <div className={styles.drawerSection}>Main</div>
          {NAV_ITEMS.map(({ to, label, tip }) => (
            <button
              key={to}
              className={styles.drawerNavLink}
              title={tip}
              onClick={() => handleMobileNav(to)}
            >
              {label}
            </button>
          ))}

          <div className={styles.drawerSection}>Products</div>
          {MORE_PRODUCTS.map(item => (
            <button
              key={item.label}
              className={styles.drawerNavLink}
              onClick={() => handleMobileNav(item.to)}
            >
              <span className={styles.drawerNavIcon} style={{ background: item.bg }}>{item.icon}</span>
              {item.label}
              {item.badge && <span className={styles.moreBadge} style={{ marginLeft: 'auto' }}>{item.badge}</span>}
            </button>
          ))}

          <div className={styles.drawerSection}>Tools</div>
          {MORE_TOOLS.slice(0, 6).map(item => (
            <button
              key={item.label}
              className={styles.drawerNavLink}
              onClick={() => handleMobileNav(item.to)}
            >
              <span className={styles.drawerNavIcon} style={{ background: item.bg }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Drawer footer */}
        <div className={styles.drawerFooter}>
          <button className={styles.drawerKillSwitch}
            onClick={() => { dispatch({ type: 'ui/setKillSwitchModal', payload: true }); setMobileOpen(false) }}>
            <Zap size={14} /> Kill Switch
          </button>
          <button className={styles.drawerLogout} onClick={() => { handleLogout(); setMobileOpen(false) }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className={styles.content}>
        <Outlet />
      </main>

      <KillSwitchModal />
    </div>
  )
}

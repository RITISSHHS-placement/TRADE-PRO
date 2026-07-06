import React, { useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  LayoutDashboard, TrendingUp, Briefcase, Settings,
  Shield, LogOut, Zap, ChevronLeft, Menu, Bell,
  BarChart2, IndianRupee, Sun, Moon, PieChart,
} from 'lucide-react'
import { logoutUser } from '../../store/slices/authSlice'
import { toggleSidebar, toggleTheme } from '../../store/slices/uiSlice'
import KillSwitchModal from '../ui/KillSwitchModal'
import { useAutoLogout } from '../../hooks'
import styles from './DashboardLayout.module.css'

// Pricing first (top-left), then Dashboard, then rest
const NAV_ITEMS = [
  { to: '/dashboard/pricing',  icon: IndianRupee,     label: 'Pricing' },
  { to: '/dashboard',          icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/trade',    icon: TrendingUp,      label: 'Trade' },
  { to: '/dashboard/market',   icon: BarChart2,       label: 'Markets' },
  { to: '/dashboard/mf',       icon: PieChart,        label: 'Mutual Funds' },
  { to: '/dashboard/portfolio', icon: Briefcase,      label: 'Portfolio' },
  { to: '/dashboard/security', icon: Shield,          label: 'Security' },
  { to: '/dashboard/settings', icon: Settings,        label: 'Settings' },
]

export default function DashboardLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user }             = useSelector((s) => s.auth)
  const { sidebarCollapsed, theme } = useSelector((s) => s.ui)
  const { setupAutoLogout }  = useAutoLogout()
  const isDark = theme === 'dark'

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
      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarTop}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>◈</span>
            {!sidebarCollapsed && <span className={styles.logoText}>Trade<span>Pro</span></span>}
          </div>
          <button
            className={styles.collapseBtn}
            onClick={() => dispatch(toggleSidebar())}
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <Icon size={18} className={styles.navIcon} />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          {/* Dark / Light toggle */}
          <button
            className={styles.themeBtn}
            onClick={() => dispatch(toggleTheme())}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {!sidebarCollapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Kill Switch */}
          <button
            className={styles.killSwitch}
            onClick={() => dispatch({ type: 'ui/setKillSwitchModal', payload: true })}
          >
            <Zap size={16} />
            {!sidebarCollapsed && <span>Kill Switch</span>}
          </button>

          {/* User */}
          <div className={styles.userRow}>
            <div className={styles.avatar}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className={styles.userInfo}>
                <div className={styles.userName}>{user?.name}</div>
                <div className={styles.userEmail}>{user?.email}</div>
              </div>
            )}
          </div>

          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <div className={styles.marketStatus}>
              <span className={styles.dot} />
              Market Open
            </div>
          </div>
          <div className={styles.topbarRight}>
            <div className={styles.kycBadge} data-status={user?.kycStatus?.toLowerCase()}>
              KYC: {user?.kycStatus || 'PENDING'}
            </div>
            <button
              className={styles.iconBtn}
              onClick={() => dispatch(toggleTheme())}
              aria-label="Toggle theme"
              title={isDark ? 'Switch to Light' : 'Switch to Dark'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className={styles.iconBtn}>
              <Bell size={18} />
            </button>
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      <KillSwitchModal />
    </div>
  )
}

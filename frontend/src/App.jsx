import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { AnimatePresence } from 'framer-motion'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TradePage from './pages/TradePage'
import PortfolioPage from './pages/PortfolioPage'
import SettingsPage from './pages/SettingsPage'
import SecurityPage from './pages/SecurityPage'
import MarketPage from './pages/MarketPage'
import NotFoundPage from './pages/NotFoundPage'

// Layout
import DashboardLayout from './components/layout/DashboardLayout'

function PrivateRoute({ children }) {
  const { token } = useSelector((state) => state.auth)
  return token ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { token } = useSelector((state) => state.auth)
  return token ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected — inside DashboardLayout */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="trade" element={<TradePage />} />
          <Route path="market" element={<MarketPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="security" element={<SecurityPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  )
}

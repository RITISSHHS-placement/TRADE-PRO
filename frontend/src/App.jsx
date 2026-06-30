import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

// Eager load critical pages
import LandingPage  from './pages/LandingPage'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Lazy load dashboard pages (reduces initial bundle)
const DashboardPage  = lazy(() => import('./pages/DashboardPage'))
const TradePage      = lazy(() => import('./pages/TradePage'))
const PortfolioPage  = lazy(() => import('./pages/PortfolioPage'))
const SettingsPage   = lazy(() => import('./pages/SettingsPage'))
const SecurityPage   = lazy(() => import('./pages/SecurityPage'))
const MarketPage     = lazy(() => import('./pages/MarketPage'))
const NotFoundPage   = lazy(() => import('./pages/NotFoundPage'))
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'))

// Simple full-screen loader while lazy chunks load
function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh', background: '#060d16',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: '#00c853',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { token } = useSelector((s) => s.auth)
  return token ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { token } = useSelector((s) => s.auth)
  return token ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index           element={<DashboardPage />} />
          <Route path="trade"    element={<TradePage />} />
          <Route path="market"   element={<MarketPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="security" element={<SecurityPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

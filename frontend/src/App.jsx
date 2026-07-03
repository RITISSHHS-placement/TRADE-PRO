import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

import LandingPage  from './pages/LandingPage'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

const DashboardPage  = lazy(() => import('./pages/DashboardPage'))
const TradePage      = lazy(() => import('./pages/TradePage'))
const PortfolioPage  = lazy(() => import('./pages/PortfolioPage'))
const SettingsPage   = lazy(() => import('./pages/SettingsPage'))
const SecurityPage   = lazy(() => import('./pages/SecurityPage'))
const MarketPage     = lazy(() => import('./pages/MarketPage'))
const MutualFundsPage = lazy(() => import('./pages/MutualFundsPage'))
const NotFoundPage   = lazy(() => import('./pages/NotFoundPage'))
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'))

function PageLoader() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid rgba(0,0,0,0.08)', borderTopColor:'#00c853', animation:'spin 0.7s linear infinite' }} />
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
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          {/* Pricing page is the index (top of left nav) */}
          <Route index            element={<DashboardPage />} />
          <Route path="overview"  element={<DashboardPage />} />
          <Route path="trade"     element={<TradePage />} />
          <Route path="market"    element={<MarketPage />} />
          <Route path="mf"        element={<MutualFundsPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="settings"  element={<SettingsPage />} />
          <Route path="security"  element={<SecurityPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

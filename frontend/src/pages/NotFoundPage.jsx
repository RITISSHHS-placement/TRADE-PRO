import React from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#f8f9fa', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
      textAlign: 'center', padding: 24,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 48 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a73e8', display: 'grid', placeItems: 'center' }}>
          <TrendingUp size={16} color="#fff" />
        </div>
        <span style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.4px' }}>TradePro</span>
      </div>

      {/* 404 */}
      <div style={{ fontSize: 96, fontWeight: 900, color: '#e0e0e0', letterSpacing: '-4px', lineHeight: 1, marginBottom: 8 }}>
        404
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>Page not found</div>
      <div style={{ fontSize: 14, color: '#9aa0a6', marginBottom: 36, maxWidth: 380, lineHeight: 1.7 }}>
        The page you're looking for doesn't exist or has been moved.
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => navigate(-1)} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '10px 20px', borderRadius: 8,
          border: '1px solid #e0e0e0', background: '#fff',
          color: '#5f6368', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <ArrowLeft size={14} /> Go Back
        </button>
        <button onClick={() => navigate('/')} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '10px 22px', borderRadius: 8,
          border: 'none', background: '#1a73e8',
          color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          <Home size={14} /> Go Home
        </button>
      </div>
    </div>
  )
}

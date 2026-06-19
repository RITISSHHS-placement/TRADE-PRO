import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#080810',
      fontFamily: 'var(--font)', color: '#fff', textAlign: 'center', padding: 24
    }}>
      <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: '-0.04em', background: 'linear-gradient(135deg,#fff,#7b61ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</div>
      <div style={{ fontSize: 20, fontWeight: 600, marginTop: 12, marginBottom: 8 }}>Page not found</div>
      <div style={{ fontSize: 14, color: '#80809a', marginBottom: 32 }}>The page you're looking for doesn't exist.</div>
      <button
        onClick={() => navigate('/')}
        style={{ padding: '12px 28px', borderRadius: '100px', background: '#7b61ff', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}
      >
        Go home
      </button>
    </div>
  )
}

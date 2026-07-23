import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronDown, ChevronUp, Plus, Lock } from 'lucide-react'

/* ── Screen card data ── */
const POPULAR_SCREENS = [
  {
    emoji: '✳️', title: 'Wealth Compounders',
    filters: ['1Y Historical Revenue Growth', '5Y Historical EPS Growth', 'EGA Growth +7 more'],
    users: '103k', color: '#7c3aed',
  },
  {
    emoji: '📊', title: 'Analyst-Backed Bets',
    filters: ['Percentage Buy Hold', 'No. of analysts with buy reco', '+5 more'],
    users: '78k', color: '#2563eb',
  },
  {
    emoji: '⚙️', title: 'Penny Picks',
    filters: ['Close Price', '1Y Historical Revenue Growth', '+5 more'],
    users: '64k', color: '#ea580c',
  },
  {
    emoji: '📉', title: 'Near 52W Lows',
    filters: ['% away from 52w low', '5Y Revenue Growth', '+5 more'],
    users: '32k', color: '#0d9488',
  },
  {
    emoji: '⚡', title: 'Momentum Monsters',
    filters: ['~40 Exponential RSI', '+3 more'],
    users: '40k', color: '#d97706',
  },
  {
    emoji: '🔲', title: 'Nearing Breakout',
    filters: ['RSI ~40–140', 'Close Price / 500 FMA', '+6 more'],
    users: '28k', color: '#2563eb', pro: true,
  },
]
const FUNDAMENTAL_SCREENS = [
  { emoji: '💎', title: 'Hidden Gems',        filters: ['PE Ratio', 'Debt to Equity', '+4 more'], users: '55k' },
  { emoji: '💰', title: 'Dividend Gems',      filters: ['Dividend Yield', 'Payout Ratio', '+3 more'], users: '47k' },
  { emoji: '🪙', title: 'Cash Rich Smallcaps', filters: ['Free Cash Flow', 'Market Cap', '+4 more'], users: '38k' },
]
const TECHNICAL_SCREENS = [
  { emoji: '📈', title: 'Day Trading Picks',           filters: ['RSI', 'MACD', 'Volume'], users: '62k' },
  { emoji: '🏦', title: 'FII Favourites',              filters: ['FII Holdings %', 'Change in FII %', '+2 more'], users: '44k' },
  { emoji: '📊', title: 'Bollinger Band Reversal Sig...', filters: ['Bollinger Band', 'RSI', '+3 more'], users: '21k', pro: true },
]
const FNO_SCREENS = [
  { emoji: '🔄', title: 'Cash & Carry Candidates', filters: ['Futures Premium', 'OI Change', '+3 more'], users: '18k', pro: true },
  { emoji: '📈', title: 'Options: Long Build Up',   filters: ['OI Build Up', 'PCR', '+2 more'],          users: '22k', pro: true },
]

function ScreenCard({ emoji, title, filters, users, color, pro }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: '18px 20px',
      cursor: 'pointer',
      transition: 'box-shadow 0.15s, transform 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{emoji}</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#111827', flex: 1 }}>{title}</span>
        {pro && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px',
            background: '#fef3c7', color: '#d97706',
            borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <Lock size={9} /> Pro
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
        {filters.map((f, i) => (
          <span key={i} style={{
            fontSize: 11, padding: '3px 8px',
            background: '#f3f4f6', color: '#6b7280',
            borderRadius: 20, fontWeight: 500,
          }}>{f}</span>
        ))}
      </div>
      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
        👥 ~{users} users
      </div>
    </div>
  )
}

function ScreenSection({ title, screens, showAll, onToggle }) {
  const visible = showAll ? screens : screens.slice(0, 3)
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{title}</h3>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16, marginBottom: 16,
      }}>
        {visible.map((s, i) => <ScreenCard key={i} {...s} />)}
      </div>
      {screens.length > 3 && (
        <button
          onClick={onToggle}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '8px 18px', borderRadius: 8,
            background: '#f3f4f6', border: '1px solid #e5e7eb',
            color: '#374151', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showAll ? <><ChevronUp size={14}/> Show less</> : <><ChevronDown size={14}/> Load more</>}
        </button>
      )}
    </div>
  )
}

export default function ScreenerLandingPage() {
  const navigate = useNavigate()
  const [activePill, setActivePill] = useState('IN Stocks')
  const [showFundamental, setShowFundamental] = useState(false)
  const [showTechnical, setShowTechnical] = useState(false)
  const [showFno, setShowFno] = useState(false)

  const pills = ['IN Stocks', 'Mutual Funds', 'US Stocks']

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'inherit' }}>

      {/* ── Hero ── */}
      <section style={{
        background: '#0f1624',
        padding: '56px 24px 48px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {/* Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
            {pills.map(p => (
              <button
                key={p}
                onClick={() => setActivePill(p)}
                style={{
                  padding: '6px 18px',
                  borderRadius: 20,
                  border: '1px solid',
                  borderColor: activePill === p ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                  background: activePill === p ? 'rgba(245,158,11,0.15)' : 'transparent',
                  color: activePill === p ? '#f59e0b' : 'rgba(255,255,255,0.6)',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: 'clamp(28px,4vw,48px)',
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1.15,
            marginBottom: 16,
            letterSpacing: '-0.5px',
          }}>
            Find the right pick with{' '}
            <span style={{ color: '#f59e0b' }}>IN Stock Screener</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', marginBottom: 32, lineHeight: 1.7 }}>
            All the tools you need to make wise &amp; effective investment decisions
          </p>

          {/* CTA */}
          <button
            onClick={() => navigate('/dashboard/screener')}
            style={{
              padding: '12px 32px',
              borderRadius: 25,
              background: '#fff',
              border: 'none',
              color: '#111827',
              fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 24,
              fontFamily: 'inherit',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            Start Screening
          </button>

          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 40 }}>
            <div style={{ display: 'flex' }}>
              {['#e84040','#2563eb','#16a34a','#d97706'].map((c, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: c, border: '2px solid #0f1624',
                  marginLeft: i > 0 ? -8 : 0,
                  display: 'grid', placeItems: 'center',
                  fontSize: 11, fontWeight: 700, color: '#fff',
                }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
              Used by <strong style={{ color: '#fff' }}>700K+</strong> smart investors
            </span>
          </div>

          {/* Feature card */}
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: '20px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 0,
          }}>
            {[
              { label: 'Pre built Screens', icon: '📋' },
              { label: 'Create Custom filters', icon: '⚙️' },
              { label: 'Basic & Pro Filters', icon: '🎯' },
            ].map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px',
                borderRight: i < 2 ? '1px solid #e5e7eb' : 'none',
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: 20 }}>{f.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{f.label}</span>
                <ArrowRight size={13} style={{ marginLeft: 'auto', color: '#9ca3af' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Collections ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

        {/* Create banner */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: 12, padding: '16px 24px', marginBottom: 40,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1e40af', marginBottom: 4 }}>
              Create your own screens with different filters
            </div>
            <div style={{ fontSize: 13, color: '#3b82f6' }}>
              Combine 200+ filters to build your perfect screen
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/screener')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 8,
              background: '#2563eb', border: 'none',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2563eb' }}
          >
            <Plus size={14} /> Create New Screen
          </button>
        </div>

        {/* Popular Screens */}
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
            🔥 Popular Screens
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {POPULAR_SCREENS.map((s, i) => <ScreenCard key={i} {...s} />)}
          </div>
        </div>

        {/* Fundamental Screens */}
        <ScreenSection
          title="📊 Fundamental Screens"
          screens={FUNDAMENTAL_SCREENS}
          showAll={showFundamental}
          onToggle={() => setShowFundamental(v => !v)}
        />

        {/* Technical & Momentum Screens */}
        <ScreenSection
          title="⚡ Technical & Momentum Screens"
          screens={TECHNICAL_SCREENS}
          showAll={showTechnical}
          onToggle={() => setShowTechnical(v => !v)}
        />

        {/* F&O Screens */}
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
            📈 Futures &amp; Options Screens
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {FNO_SCREENS.map((s, i) => <ScreenCard key={i} {...s} />)}
          </div>
        </div>
      </section>
    </div>
  )
}

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronDown, ChevronUp, Plus, Lock } from 'lucide-react'

/* ── Screen card data ── */
const POPULAR_SCREENS = [
  {
    emoji: '✳️', title: 'Wealth Compounders',
    filters: ['1Y Historical Revenue Growth', '5Y Historical EPS Growth', 'ROE > 15%'],
    users: '103k', color: '#8b5cf6',
    query: '?preset=wealth-compounders&roeMin=15&g3Min=12',
  },
  {
    emoji: '📊', title: 'Analyst-Backed Bets',
    filters: ['PE Ratio < 30', '3Y Growth > 15%', '+5 more'],
    users: '78k', color: '#6366f1',
    query: '?preset=analyst-bets&peMax=30&g3Min=15',
  },
  {
    emoji: '⚙️', title: 'Penny Picks',
    filters: ['Price < ₹500', 'Smallcap', 'PE < 20'],
    users: '64k', color: '#e87722',
    query: '?preset=penny-picks&pMax=500&cap=Smallcap&peMax=20',
  },
  {
    emoji: '📉', title: 'Near 52W Lows',
    filters: ['% away from 52w low', 'PE < 25', 'RSI < 45'],
    users: '32k', color: '#14b8a6',
    query: '?preset=near-52low&peMax=25&rsiMax=45',
  },
  {
    emoji: '⚡', title: 'Momentum Monsters',
    filters: ['RSI > 60', '3Y Growth > 20%', 'Beta > 1'],
    users: '40k', color: '#f59e0b',
    query: '?preset=momentum&rsiMin=60&g3Min=20&betaMin=1',
  },
  {
    emoji: '🔲', title: 'Nearing Breakout',
    filters: ['RSI 40–60', 'Volume > 1M', 'Price near 52W High'],
    users: '28k', color: '#6366f1', pro: true,
    query: '?preset=breakout&rsiMin=40&rsiMax=60',
  },
]
const FUNDAMENTAL_SCREENS = [
  { emoji: '💎', title: 'Hidden Gems',         filters: ['PE < 20', 'ROE > 15%', 'D/E < 1'],   users: '55k', query: '?preset=hidden-gems&peMax=20&roeMin=15&deMax=1' },
  { emoji: '💰', title: 'Dividend Gems',        filters: ['Div Yield > 2.5%', 'D/E < 0.5'],     users: '47k', query: '?preset=dividend&dyMin=2.5&deMax=0.5' },
  { emoji: '🪙', title: 'Cash Rich Smallcaps',  filters: ['Smallcap', 'Current Ratio > 1.5'],    users: '38k', query: '?preset=cash-rich&cap=Smallcap&crMin=1.5' },
]
const TECHNICAL_SCREENS = [
  { emoji: '📈', title: 'Day Trading Picks',           filters: ['RSI > 55', 'Volume > 2M'],   users: '62k', query: '?preset=day-trading&rsiMin=55' },
  { emoji: '🏦', title: 'FII Favourites',              filters: ['FII Holding > 20%'],          users: '44k', query: '?preset=fii-fav&fiMin=20' },
  { emoji: '📊', title: 'Bollinger Band Reversal',     filters: ['RSI 30–50', 'OPM > 15%'],     users: '21k', pro: true, query: '?preset=bb-reversal&rsiMin=30&rsiMax=50&omMin=15' },
]
const FNO_SCREENS = [
  { emoji: '🔄', title: 'Cash & Carry Candidates',  filters: ['Largecap', 'Beta < 1.2'],         users: '18k', pro: true, query: '?preset=cash-carry&cap=Largecap&betaMax=1.2' },
  { emoji: '📈', title: 'Options: Long Build Up',    filters: ['RSI > 60', 'High Volume'],        users: '22k', pro: true, query: '?preset=options-long&rsiMin=60' },
]

/* ── Theme tokens ── */
const T = {
  navy: '#1a1a2e', navyCard: '#ffffff',
  orange: '#1a73e8', text: '#1a1a2e', textSub: '#5f6368', textMute: '#9aa0a6',
  border: '#e8eaed', borderMd: '#dadce0',
  green: '#22c55e', blue: '#1a73e8', blueDim: 'rgba(26,115,232,0.08)',
}

function ScreenCard({ emoji, title, filters, users, color, pro, query }) {
  const navigate = useNavigate()
  const handleClick = () => navigate('/dashboard/screener' + (query || ''))
  return (
    <div style={{
      background: T.navyCard,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: '18px 20px',
      cursor: 'pointer',
      transition: 'all 0.15s',
    }}
      onClick={handleClick}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderMd; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{emoji}</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: T.text, flex: 1 }}>{title}</span>
        {pro && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px',
            background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
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
            background: 'rgba(255,255,255,0.06)', color: T.textSub,
            borderRadius: 20, fontWeight: 500,
          }}>{f}</span>
        ))}
      </div>
      <div style={{ fontSize: 11, color: T.textMute, fontWeight: 500 }}>
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
        <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{title}</h3>
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
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
            color: T.textSub, fontSize: 13, fontWeight: 600,
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
    <div style={{ minHeight: '100vh', background: T.navy, fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* ── Hero ── */}
      <section style={{
        background: T.navy,
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
                  borderColor: activePill === p ? T.orange : 'rgba(255,255,255,0.15)',
                  background: activePill === p ? 'rgba(232,119,34,0.12)' : 'transparent',
                  color: activePill === p ? T.orange : 'rgba(255,255,255,0.5)',
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
            <span style={{ color: T.orange }}>IN Stock Screener</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', marginBottom: 32, lineHeight: 1.7 }}>
            All the tools you need to make wise & effective investment decisions
          </p>

          {/* CTA */}
          <button
            onClick={() => navigate('/dashboard/screener')}
            style={{
              padding: '12px 32px',
              borderRadius: 25,
              background: T.orange,
              border: 'none',
              color: '#fff',
              fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 24,
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f28c28' }}
            onMouseLeave={e => { e.currentTarget.style.background = T.orange }}
          >
            Start Screening
          </button>

          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 40 }}>
            <div style={{ display: 'flex' }}>
              {['#ef4444','#6366f1','#22c55e','#f59e0b'].map((c, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: c, border: `2px solid ${T.navy}`,
                  marginLeft: i > 0 ? -8 : 0,
                  display: 'grid', placeItems: 'center',
                  fontSize: 11, fontWeight: 700, color: '#fff',
                }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
              Used by <strong style={{ color: '#fff' }}>700K+</strong> smart investors
            </span>
          </div>

          {/* Feature card */}
          <div style={{
            background: T.navyCard,
            borderRadius: 14,
            padding: '20px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 0,
            border: `1px solid ${T.border}`,
          }}>
            {[
              { label: 'Pre built Screens', icon: '📋' },
              { label: 'Create Custom filters', icon: '⚙️' },
              { label: 'Basic & Pro Filters', icon: '🎯' },
            ].map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px',
                borderRight: i < 2 ? `1px solid ${T.border}` : 'none',
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: 20 }}>{f.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{f.label}</span>
                <ArrowRight size={13} style={{ marginLeft: 'auto', color: T.textMute }} />
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
          background: 'rgba(99,102,241,0.08)', border: `1px solid rgba(99,102,241,0.2)`,
          borderRadius: 12, padding: '16px 24px', marginBottom: 40,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 4 }}>
              Create your own screens with different filters
            </div>
            <div style={{ fontSize: 13, color: T.blue }}>
              Combine 200+ filters to build your perfect screen
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/screener')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 8,
              background: T.blue, border: 'none',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#818cf8' }}
            onMouseLeave={e => { e.currentTarget.style.background = T.blue }}
          >
            <Plus size={14} /> Create New Screen
          </button>
        </div>

        {/* Popular Screens */}
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 16 }}>
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
          <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 16 }}>
            📈 Futures & Options Screens
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

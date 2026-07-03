import React, { useState, useEffect, useMemo } from 'react'
import { Search, TrendingUp, Shield, Zap, ChevronRight, Star, Info } from 'lucide-react'
import { Card, Spinner, Badge } from '../components/ui'
import styles from './MutualFundsPage.module.css'

const MF_BASE = 'https://api.mfapi.in/mf'

// Curated top funds (scheme codes from mfapi.in)
const FEATURED = [
  { code: 120503, category: 'Large Cap',    risk: 'Low',    rating: 5, amc: 'Mirae Asset',    tag: 'Top Rated' },
  { code: 120716, category: 'Large Cap',    risk: 'Low',    rating: 5, amc: 'Axis MF',        tag: 'Popular' },
  { code: 125354, category: 'Flexi Cap',    risk: 'Medium', rating: 5, amc: 'Parag Parikh',   tag: 'Top Rated' },
  { code: 120837, category: 'Large Cap',    risk: 'Low',    rating: 4, amc: 'SBI MF',         tag: '' },
  { code: 118825, category: 'Mid Cap',      risk: 'High',   rating: 5, amc: 'Axis MF',        tag: 'High Returns' },
  { code: 120847, category: 'Mid Cap',      risk: 'High',   rating: 4, amc: 'HDFC MF',        tag: '' },
  { code: 120465, category: 'Large Cap',    risk: 'Low',    rating: 4, amc: 'ICICI Pru',      tag: '' },
  { code: 120492, category: 'Small Cap',    risk: 'Very High', rating: 4, amc: 'Nippon',      tag: 'High Returns' },
  { code: 120505, category: 'Small Cap',    risk: 'Very High', rating: 5, amc: 'Axis MF',     tag: 'Popular' },
  { code: 120828, category: 'Small Cap',    risk: 'Very High', rating: 5, amc: 'SBI MF',      tag: 'Top Rated' },
  { code: 118989, category: 'Flexi Cap',    risk: 'Medium', rating: 4, amc: 'HDFC MF',        tag: '' },
  { code: 551550, category: 'ELSS',         risk: 'High',   rating: 4, amc: 'Axis MF',        tag: 'Tax Saver' },
  { code: 120600, category: 'Small Cap',    risk: 'Very High', rating: 4, amc: 'HDFC MF',     tag: '' },
  { code: 551354, category: 'ELSS',         risk: 'High',   rating: 5, amc: 'Mirae Asset',    tag: 'Tax Saver' },
  { code: 119598, category: 'Mid Cap',      risk: 'High',   rating: 4, amc: 'Kotak MF',       tag: '' },
  { code: 118551, category: 'Index Fund',   risk: 'Low',    rating: 5, amc: 'UTI',            tag: 'Index' },
]

const CATEGORIES = ['All', 'Large Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap', 'ELSS', 'Index Fund']
const RISK_LEVELS = ['All', 'Low', 'Medium', 'High', 'Very High']

const RISK_COLOR = {
  'Low':       { bg: '#dcfce7', color: '#15803d' },
  'Medium':    { bg: '#fef9c3', color: '#a16207' },
  'High':      { bg: '#fee2e2', color: '#b91c1c' },
  'Very High': { bg: '#fce7f3', color: '#9d174d' },
}

function Stars({ n }) {
  return (
    <div className={styles.stars}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={11} fill={i <= n ? '#f59e0b' : 'none'} color={i <= n ? '#f59e0b' : '#d1d5db'} />
      ))}
    </div>
  )
}

function FundCard({ meta, nav, onInvest }) {
  const isLoading = !nav
  return (
    <div className={styles.fundCard}>
      {meta.tag && (
        <span className={styles.fundTag}>{meta.tag}</span>
      )}
      <div className={styles.fundTop}>
        <div className={styles.fundAmcBadge}>{meta.amc}</div>
        <Stars n={meta.rating} />
      </div>

      <h3 className={styles.fundName}>
        {nav ? nav.schemeName : <span className={styles.shimmer} style={{width:'80%',height:14,display:'block'}} />}
      </h3>

      <div className={styles.fundMeta}>
        <span className={styles.fundCat}>{meta.category}</span>
        <span className={styles.fundRisk} style={RISK_COLOR[meta.risk] || {}}>
          {meta.risk} Risk
        </span>
      </div>

      <div className={styles.fundNav}>
        {isLoading ? (
          <span className={styles.navLoading}>Loading NAV…</span>
        ) : (
          <>
            <div className={styles.navVal}>₹{parseFloat(nav.nav || 0).toFixed(4)}</div>
            <div className={styles.navDate}>NAV as of {nav.date}</div>
          </>
        )}
      </div>

      <div className={styles.fundActions}>
        <button className={styles.btnInvest} onClick={() => onInvest(meta, nav)}>
          Invest Now
        </button>
        <button className={styles.btnSip}>
          Start SIP
        </button>
      </div>
    </div>
  )
}

export default function MutualFundsPage() {
  const [navData, setNavData]       = useState({})
  const [loading, setLoading]       = useState(true)
  const [search,  setSearch]        = useState('')
  const [cat,     setCat]           = useState('All')
  const [risk,    setRisk]          = useState('All')
  const [invest,  setInvest]        = useState(null)  // selected fund for modal
  const [sipAmount, setSipAmount]   = useState(500)
  const [mfList,  setMfList]        = useState([])
  const [mfSearch, setMfSearch]     = useState('')
  const [mfResults, setMfResults]   = useState([])
  const [mfNavLoading, setMfNavLoading] = useState(false)
  const [mfSelectedNav, setMfSelectedNav] = useState(null)

  // Load NAV for all featured funds
  useEffect(() => {
    async function load() {
      setLoading(true)
      const results = await Promise.allSettled(
        FEATURED.map(f =>
          fetch(`${MF_BASE}/${f.code}`)
            .then(r => r.json())
            .then(j => ({
              schemeCode: f.code,
              schemeName: j.meta?.scheme_name || '',
              nav:  j.data?.[0]?.nav || '0',
              date: j.data?.[0]?.date || '',
              fundHouse: j.meta?.fund_house || '',
            }))
        )
      )
      const map = {}
      results.forEach(r => {
        if (r.status === 'fulfilled') map[r.value.schemeCode] = r.value
      })
      setNavData(map)
      setLoading(false)
    }
    load()
  }, [])

  // Load full MF list for search
  useEffect(() => {
    fetch(`${MF_BASE}`)
      .then(r => r.json())
      .then(list => setMfList(list))
      .catch(() => {})
  }, [])

  // Search MF list
  useEffect(() => {
    if (!mfSearch.trim()) { setMfResults([]); return }
    const q = mfSearch.toLowerCase()
    setMfResults(mfList.filter(s => s.schemeName?.toLowerCase().includes(q)).slice(0, 20))
  }, [mfSearch, mfList])

  const filtered = useMemo(() => {
    return FEATURED.filter(f => {
      if (cat  !== 'All' && f.category !== cat)  return false
      if (risk !== 'All' && f.risk     !== risk)  return false
      const nav = navData[f.code]
      if (search && nav && !nav.schemeName.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [cat, risk, search, navData])

  const handleInvest = (meta, nav) => setInvest({ meta, nav })

  const handleMfResultClick = async (scheme) => {
    setMfNavLoading(true)
    setMfSelectedNav(null)
    try {
      const r = await fetch(`${MF_BASE}/${scheme.schemeCode}`)
      const j = await r.json()
      setMfSelectedNav({
        schemeCode: scheme.schemeCode,
        schemeName: j.meta?.scheme_name || scheme.schemeName,
        nav:  j.data?.[0]?.nav || '0',
        date: j.data?.[0]?.date || '',
        fundHouse: j.meta?.fund_house || '',
        schemeCategory: j.meta?.scheme_category || '',
        schemeType: j.meta?.scheme_type || '',
        history: j.data?.slice(0, 30) || [],
      })
    } catch {}
    setMfNavLoading(false)
  }

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>Mutual Funds</h1>
          <p className={styles.heroSub}>
            Direct plans · ₹0 commission · ₹500 minimum SIP
          </p>
          <div className={styles.heroBadges}>
            <span className={styles.heroBadge}><Shield size={13} /> ₹0 Commission</span>
            <span className={styles.heroBadge}><Zap size={13} /> Direct Plans</span>
            <span className={styles.heroBadge}><TrendingUp size={13} /> ELSS Tax Saving</span>
          </div>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}><span className={styles.heroStatVal}>16,000+</span><span className={styles.heroStatLabel}>Schemes</span></div>
          <div className={styles.heroStat}><span className={styles.heroStatVal}>₹0</span><span className={styles.heroStatLabel}>Commission</span></div>
          <div className={styles.heroStat}><span className={styles.heroStatVal}>₹500</span><span className={styles.heroStatLabel}>Min SIP</span></div>
        </div>
      </div>

      {/* ── Search all 16k funds ── */}
      <Card className={styles.searchCard}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search 16,000+ mutual fund schemes…"
            value={mfSearch}
            onChange={e => setMfSearch(e.target.value)}
          />
        </div>
        {mfResults.length > 0 && (
          <div className={styles.searchResults}>
            {mfResults.map(s => (
              <div key={s.schemeCode} className={styles.searchResult} onClick={() => handleMfResultClick(s)}>
                <span className={styles.srName}>{s.schemeName}</span>
                <ChevronRight size={14} className={styles.srArrow} />
              </div>
            ))}
          </div>
        )}
        {mfNavLoading && <div className={styles.navLoader}><Spinner size={20} /> Loading fund data…</div>}
        {mfSelectedNav && (
          <div className={styles.navResult}>
            <div className={styles.navResultTop}>
              <div>
                <h3 className={styles.navResultName}>{mfSelectedNav.schemeName}</h3>
                <div className={styles.navResultMeta}>
                  <span>{mfSelectedNav.fundHouse}</span>
                  {mfSelectedNav.schemeCategory && <span>· {mfSelectedNav.schemeCategory}</span>}
                  {mfSelectedNav.schemeType && <span>· {mfSelectedNav.schemeType}</span>}
                </div>
              </div>
              <button className={styles.btnClose} onClick={() => { setMfSelectedNav(null); setMfSearch(''); setMfResults([]) }}>✕</button>
            </div>
            <div className={styles.navBig}>
              <span className={styles.navBigVal}>₹{parseFloat(mfSelectedNav.nav).toFixed(4)}</span>
              <span className={styles.navBigDate}>NAV as of {mfSelectedNav.date}</span>
            </div>
            <div className={styles.navHistory}>
              <div className={styles.navHistHead}>
                <span>Date</span><span>NAV</span>
              </div>
              {mfSelectedNav.history.map((h, i) => (
                <div key={i} className={styles.navHistRow}>
                  <span>{h.date}</span>
                  <span>₹{parseFloat(h.nav).toFixed(4)}</span>
                </div>
              ))}
            </div>
            <div className={styles.navActions}>
              <button className={styles.btnInvest} onClick={() => setInvest({ meta: { category:'Fund', risk:'Medium', amc: mfSelectedNav.fundHouse }, nav: mfSelectedNav })}>
                Invest Now
              </button>
              <button className={styles.btnSip}>Start SIP</button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Filters ── */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Category</span>
          <div className={styles.filterBtns}>
            {CATEGORIES.map(c => (
              <button key={c}
                className={`${styles.filterBtn} ${cat === c ? styles.filterActive : ''}`}
                onClick={() => setCat(c)}
              >{c}</button>
            ))}
          </div>
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Risk</span>
          <div className={styles.filterBtns}>
            {RISK_LEVELS.map(r => (
              <button key={r}
                className={`${styles.filterBtn} ${risk === r ? styles.filterActive : ''}`}
                onClick={() => setRisk(r)}
              >{r}</button>
            ))}
          </div>
        </div>
        <div className={styles.searchBox}>
          <Search size={13} />
          <input
            placeholder="Filter by name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.filterSearch}
          />
        </div>
      </div>

      {/* ── Fund Grid ── */}
      {loading ? (
        <div className={styles.loader}><Spinner size={32} /><span>Loading NAVs…</span></div>
      ) : (
        <div className={styles.fundGrid}>
          {filtered.map(f => (
            <FundCard
              key={f.code}
              meta={f}
              nav={navData[f.code]}
              onInvest={handleInvest}
            />
          ))}
        </div>
      )}

      {/* ── NAV Disclaimer ── */}
      <div className={styles.disclaimer}>
        <Info size={13} />
        NAV data sourced from AMFI via mfapi.in — updated end-of-day. Mutual fund investments are subject to market risks. Read all scheme-related documents carefully.
      </div>

      {/* ── Invest Modal ── */}
      {invest && (
        <div className={styles.modalOverlay} onClick={() => setInvest(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Invest</h2>
              <button className={styles.btnClose} onClick={() => setInvest(null)}>✕</button>
            </div>
            <div className={styles.modalFundName}>{invest.nav?.schemeName || 'Selected Fund'}</div>
            <div className={styles.modalNav}>
              Current NAV: <b>₹{parseFloat(invest.nav?.nav || 0).toFixed(4)}</b>
              <span className={styles.modalNavDate}>as of {invest.nav?.date}</span>
            </div>

            <div className={styles.modalAmtSection}>
              <label className={styles.modalLabel}>Investment Amount (₹)</label>
              <div className={styles.amtRow}>
                {[500, 1000, 2000, 5000, 10000].map(a => (
                  <button key={a}
                    className={`${styles.amtBtn} ${sipAmount === a ? styles.amtActive : ''}`}
                    onClick={() => setSipAmount(a)}
                  >₹{a.toLocaleString('en-IN')}</button>
                ))}
              </div>
              <input
                type="number"
                className={styles.amtInput}
                value={sipAmount}
                min={500}
                onChange={e => setSipAmount(Number(e.target.value))}
              />
              <div className={styles.unitCalc}>
                ≈ {invest.nav?.nav ? (sipAmount / parseFloat(invest.nav.nav)).toFixed(3) : '--'} units at current NAV
              </div>
            </div>

            <div className={styles.modalZeroComm}>
              <Shield size={14} /> ₹0 commission · Direct plan · No hidden charges
            </div>

            <button className={styles.btnInvestFull}>
              Invest ₹{sipAmount.toLocaleString('en-IN')} →
            </button>
            <button className={styles.btnSipFull}>
              Start Monthly SIP of ₹{sipAmount.toLocaleString('en-IN')} →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

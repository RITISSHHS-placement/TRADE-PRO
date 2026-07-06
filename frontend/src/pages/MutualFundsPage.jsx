import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Star, Shield, Zap, TrendingUp, ChevronRight, X, Info } from 'lucide-react'
import { Spinner } from '../components/ui'
import styles from './MutualFundsPage.module.css'

const MF_BASE = 'https://api.mfapi.in/mf'

// Well-known, verified fund scheme codes from mfapi.in
const FEATURED_CODES = [
  { code: 118825, cat: 'Large Cap',  risk: 'Moderately High', amc: 'Mirae Asset',   tag: 'Top Rated' },
  { code: 120465, cat: 'Large Cap',  risk: 'Moderately High', amc: 'Axis MF',       tag: 'Popular' },
  { code: 119598, cat: 'Large Cap',  risk: 'Moderately High', amc: 'SBI MF',        tag: '' },
  { code: 120505, cat: 'Mid Cap',    risk: 'High',            amc: 'Axis MF',       tag: 'High Returns' },
  { code: 118989, cat: 'Mid Cap',    risk: 'High',            amc: 'HDFC MF',       tag: '' },
  { code: 120503, cat: 'ELSS',       risk: 'High',            amc: 'Axis MF',       tag: 'Tax Saver' },
  { code: 120716, cat: 'Index',      risk: 'Moderately High', amc: 'UTI',           tag: 'Index' },
  { code: 125354, cat: 'Small Cap',  risk: 'Very High',       amc: 'Axis MF',       tag: 'Popular' },
  { code: 120847, cat: 'ELSS',       risk: 'High',            amc: 'quant MF',      tag: 'Tax Saver' },
  { code: 120828, cat: 'Small Cap',  risk: 'Very High',       amc: 'quant MF',      tag: 'High Returns' },
  { code: 100119, cat: 'Hybrid',     risk: 'Moderate',        amc: 'HDFC MF',       tag: '' },
  { code: 100033, cat: 'Large & Mid', risk: 'Moderately High', amc: 'Aditya Birla', tag: '' },
]

const CATS  = ['All', 'Large Cap', 'Mid Cap', 'Small Cap', 'Large & Mid', 'ELSS', 'Index', 'Hybrid']
const RISKS = ['All', 'Moderate', 'Moderately High', 'High', 'Very High']

const RISK_STYLE = {
  'Moderate':         { background: '#fefce8', color: '#854d0e' },
  'Moderately High':  { background: '#fff7ed', color: '#9a3412' },
  'High':             { background: '#fee2e2', color: '#b91c1c' },
  'Very High':        { background: '#fce7f3', color: '#9d174d' },
}

function Stars({ n = 4 }) {
  return (
    <span style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={11}
          fill={i <= n ? '#f59e0b' : 'none'}
          color={i <= n ? '#f59e0b' : '#d1d5db'}
        />
      ))}
    </span>
  )
}

// Single fund card — fetches its own NAV
function FundCard({ meta, onInvest }) {
  const [nav, setNav]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${MF_BASE}/${meta.code}`)
      .then(r => r.json())
      .then(j => setNav({
        name: j.meta?.scheme_name || '',
        nav:  j.data?.[0]?.nav    || '0',
        date: j.data?.[0]?.date   || '',
        house: j.meta?.fund_house || meta.amc,
      }))
      .catch(() => setNav(null))
      .finally(() => setLoading(false))
  }, [meta.code])

  return (
    <div className={styles.card}>
      {meta.tag && <span className={styles.tag}>{meta.tag}</span>}
      <div className={styles.cardTop}>
        <span className={styles.amcBadge}>{meta.amc}</span>
        <Stars n={5} />
      </div>
      <h3 className={styles.cardName}>
        {loading ? <span className={styles.shimmer} style={{ width: '85%', height: 14, display: 'block' }} /> : (nav?.name || '—')}
      </h3>
      <div className={styles.cardMeta}>
        <span className={styles.catBadge}>{meta.cat}</span>
        <span className={styles.riskBadge} style={RISK_STYLE[meta.risk] || {}}>
          {meta.risk} Risk
        </span>
      </div>
      <div className={styles.navBox}>
        {loading ? <span className={styles.navLoading}>Loading NAV…</span> : nav ? (
          <>
            <span className={styles.navVal}>₹{parseFloat(nav.nav).toFixed(4)}</span>
            <span className={styles.navDate}>as of {nav.date}</span>
          </>
        ) : <span className={styles.navLoading}>NAV unavailable</span>}
      </div>
      <div className={styles.cardBtns}>
        <button className={styles.btnInvest} onClick={() => nav && onInvest(meta, nav)}>Invest</button>
        <button className={styles.btnSip}>Start SIP</button>
      </div>
    </div>
  )
}

// Invest modal
function InvestModal({ item, onClose }) {
  const [amount, setAmount] = useState(1000)
  const navVal = item ? parseFloat(item.nav?.nav || 1) : 1
  const units  = amount / navVal

  if (!item) return null
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h2 className={styles.modalTitle}>Invest</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18}/></button>
        </div>
        <p className={styles.modalFund}>{item.nav?.name}</p>
        <div className={styles.modalNav}>
          NAV: <b>₹{parseFloat(item.nav?.nav || 0).toFixed(4)}</b>
          <span className={styles.modalDate}>as of {item.nav?.date}</span>
        </div>
        <div className={styles.amtSection}>
          <label className={styles.amtLabel}>Amount (₹)</label>
          <div className={styles.amtChips}>
            {[500, 1000, 2000, 5000, 10000].map(a => (
              <button key={a}
                className={`${styles.chip} ${amount === a ? styles.chipActive : ''}`}
                onClick={() => setAmount(a)}>
                ₹{a.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
          <input
            type="number" className={styles.amtInput}
            value={amount} min={500}
            onChange={e => setAmount(Number(e.target.value))}
          />
          <p className={styles.unitCalc}>
            ≈ {units.toFixed(3)} units at current NAV
          </p>
        </div>
        <div className={styles.zeroBadge}><Shield size={13}/> ₹0 commission · Direct plan</div>
        <button className={styles.btnInvestFull}>Invest ₹{amount.toLocaleString('en-IN')} →</button>
        <button className={styles.btnSipFull}>Start SIP ₹{amount.toLocaleString('en-IN')}/month →</button>
      </div>
    </div>
  )
}

export default function MutualFundsPage() {
  const [mfList,    setMfList]    = useState([])
  const [listReady, setListReady] = useState(false)
  const [search,    setSearch]    = useState('')
  const [results,   setResults]   = useState([])
  const [selected,  setSelected]  = useState(null) // { scheme, nav }
  const [navLoading, setNavLoading] = useState(false)
  const [cat,  setCat]  = useState('All')
  const [risk, setRisk] = useState('All')
  const [investItem, setInvestItem] = useState(null)

  // Load full MF list for search
  useEffect(() => {
    fetch(MF_BASE)
      .then(r => r.json())
      .then(list => { setMfList(list); setListReady(true) })
      .catch(() => setListReady(true))
  }, [])

  // Live search
  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    const q = search.toLowerCase()
    setResults(
      mfList.filter(s => s.schemeName?.toLowerCase().includes(q)).slice(0, 25)
    )
  }, [search, mfList])

  const handlePickScheme = useCallback(async (scheme) => {
    setSearch(scheme.schemeName)
    setResults([])
    setNavLoading(true)
    setSelected(null)
    try {
      const r = await fetch(`${MF_BASE}/${scheme.schemeCode}`)
      const j = await r.json()
      setSelected({
        scheme,
        nav:  parseFloat(j.data?.[0]?.nav || 0),
        date: j.data?.[0]?.date || '',
        name: j.meta?.scheme_name || scheme.schemeName,
        house: j.meta?.fund_house || '',
        category: j.meta?.scheme_category || '',
        type:     j.meta?.scheme_type     || '',
        history:  j.data?.slice(0, 30)    || [],
      })
    } catch {}
    setNavLoading(false)
  }, [mfList])

  const filtered = useMemo(() =>
    FEATURED_CODES.filter(f => {
      if (cat  !== 'All' && f.cat  !== cat)  return false
      if (risk !== 'All' && f.risk !== risk) return false
      return true
    }),
  [cat, risk])

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>Mutual Funds</h1>
          <p className={styles.heroSub}>Direct plans · ₹0 commission · SIP from ₹500</p>
          <div className={styles.heroBadges}>
            <span className={styles.hbadge}><Shield size={12}/> ₹0 Commission</span>
            <span className={styles.hbadge}><Zap size={12}/> Direct Plans</span>
            <span className={styles.hbadge}><TrendingUp size={12}/> ELSS Tax Saving</span>
          </div>
        </div>
        <div className={styles.heroStats}>
          <div><span className={styles.hsVal}>16,000+</span><span className={styles.hsLabel}>Schemes</span></div>
          <div><span className={styles.hsVal}>₹0</span><span className={styles.hsLabel}>Commission</span></div>
          <div><span className={styles.hsVal}>₹500</span><span className={styles.hsLabel}>Min SIP</span></div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className={styles.searchWrap}>
        <div className={styles.searchBox}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder={listReady ? `Search ${mfList.length.toLocaleString()} mutual fund schemes…` : 'Loading fund list…'}
            value={search}
            onChange={e => { setSearch(e.target.value); setSelected(null) }}
          />
          {search && <button className={styles.clearBtn} onClick={() => { setSearch(''); setResults([]); setSelected(null) }}><X size={14}/></button>}
        </div>
        {results.length > 0 && (
          <div className={styles.dropdown}>
            {results.map(s => (
              <div key={s.schemeCode} className={styles.dropItem} onClick={() => handlePickScheme(s)}>
                <span className={styles.dropName}>{s.schemeName}</span>
                <ChevronRight size={13} className={styles.dropArrow}/>
              </div>
            ))}
          </div>
        )}
        {navLoading && (
          <div className={styles.navLoaderRow}><Spinner size={18}/> Loading fund data…</div>
        )}
        {selected && (
          <div className={styles.fundDetail}>
            <div className={styles.fdHead}>
              <div>
                <h3 className={styles.fdName}>{selected.name}</h3>
                <div className={styles.fdMeta}>
                  <span>{selected.house}</span>
                  {selected.category && <span>· {selected.category}</span>}
                </div>
              </div>
              <button className={styles.clearBtn} onClick={() => { setSearch(''); setSelected(null) }}><X size={16}/></button>
            </div>
            <div className={styles.fdNav}>
              <span className={styles.fdNavVal}>₹{selected.nav.toFixed(4)}</span>
              <span className={styles.fdNavDate}>NAV as of {selected.date}</span>
            </div>
            <div className={styles.fdHistory}>
              <div className={styles.fdHistHead}><span>Date</span><span>NAV (₹)</span></div>
              {selected.history.map((h, i) => (
                <div key={i} className={styles.fdHistRow}>
                  <span>{h.date}</span>
                  <span>{parseFloat(h.nav).toFixed(4)}</span>
                </div>
              ))}
            </div>
            <div className={styles.fdBtns}>
              <button className={styles.btnInvest}
                onClick={() => setInvestItem({ meta: { cat: selected.category, risk: 'Moderately High', amc: selected.house }, nav: { name: selected.name, nav: selected.nav.toString(), date: selected.date } })}>
                Invest Now
              </button>
              <button className={styles.btnSip}>Start SIP</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Filters ── */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.flabel}>Category</span>
          <div className={styles.fbtns}>
            {CATS.map(c => (
              <button key={c} className={`${styles.fbtn} ${cat === c ? styles.fbtnActive : ''}`}
                onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.flabel}>Risk</span>
          <div className={styles.fbtns}>
            {RISKS.map(r => (
              <button key={r} className={`${styles.fbtn} ${risk === r ? styles.fbtnActive : ''}`}
                onClick={() => setRisk(r)}>{r}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Fund grid ── */}
      <div className={styles.grid}>
        {filtered.map(f => (
          <FundCard key={f.code} meta={f} onInvest={(m, n) => setInvestItem({ meta: m, nav: n })} />
        ))}
      </div>

      <div className={styles.disclaimer}>
        <Info size={13} style={{ flexShrink: 0 }}/>
        NAV data from AMFI via mfapi.in — end-of-day. Mutual fund investments are subject to market risks. Read all scheme documents carefully.
      </div>

      <InvestModal item={investItem} onClose={() => setInvestItem(null)} />
    </div>
  )
}

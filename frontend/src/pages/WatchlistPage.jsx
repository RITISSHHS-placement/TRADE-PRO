import React, { useState, useEffect } from 'react'
import { Search, Plus, X, Star, Trash2, TrendingUp } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import styles from './WatchlistPage.module.css'

const C = {
  green:'#0f9d58',greenBg:'#e8f0fe',red:'#ea4335',redBg:'#fce8e6',
  navy:'#1a1a1a',blue:'#1a73e8',blueBg:'#e8f0fe',amber:'#d97706',
  gray50:'#f8f9fa',gray100:'#f1f3f4',gray200:'#e0e0e0',
  gray400:'#9aa0a6',gray600:'#5f6368',gray800:'#1a1a1a',white:'#ffffff',
}
const f2 = n => Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
const fR = n => '₹'+f2(n)

// All searchable symbols
const SYMBOL_LABELS = {
  'NIFTY 50':'NIFTY 50 Index','NIFTY BANK':'Nifty Bank Index','NIFTY IT':'Nifty IT Index',
  RELIANCE:'Reliance Industries',TCS:'Tata Consultancy Services',HDFCBANK:'HDFC Bank',
  INFY:'Infosys',ICICIBANK:'ICICI Bank',SBIN:'State Bank of India',WIPRO:'Wipro',
  BAJFINANCE:'Bajaj Finance',MARUTI:'Maruti Suzuki',NTPC:'NTPC',HCLTECH:'HCL Technologies',
  TITAN:'Titan Company',SUNPHARMA:'Sun Pharma',ASIANPAINT:'Asian Paints',LT:'Larsen & Toubro',
  ONGC:'ONGC',DRREDDY:"Dr. Reddy's",TATAMOTORS:'Tata Motors',BAJAJFINSV:'Bajaj Finserv',
  ADANIPOWER:'Adani Power',POLYCAB:'Polycab India',MAXHEALTH:'Max Healthcare',
  INDHOTEL:'Indian Hotels',CUMMINSIND:'Cummins India',PIIND:'PI Industries',
  MPHASIS:'Mphasis',TORNTPHARM:'Torrent Pharma',SEAMEC:'Seamec',WHEELS:'Wheels India',
  NITINSPIN:'Nitin Spinners',SPECTRUM:'Spectrum Electrical',SATIN:'Satin Creditcare',
  SANGAMIND:'Sangam India',SPAPPARELS:'S.P.Apparels',RAILSYS:'Rail Vikas Nigam',
  KTKBANK:'Karnataka Bank',ELPROINT:'Elpro International',COALINDIA:'Coal India',
  TECHM:'Tech Mahindra',DIVISLAB:"Divi's Laboratories",EICHERMOT:'Eicher Motors',
  HEROMOTOCO:'Hero MotoCorp',HINDUNILVR:'Hindustan Unilever',NESTLEIND:'Nestle India',
  POWERGRID:'Power Grid Corp',ADANIENT:'Adani Enterprises',ADANIPORTS:'Adani Ports',
  JSWSTEEL:'JSW Steel',TATASTEEL:'Tata Steel',AXISBANK:'Axis Bank',KOTAKBANK:'Kotak Bank',
  M_M:'Mahindra & Mahindra',APOLLOHOSP:'Apollo Hospitals',BRITANNIA:'Britannia',
  CIPLA:'Cipla',GRASIM:'Grasim Industries',UPL:'UPL',ULTRACEMCO:'UltraTech Cement',
  BAJAJ_AUTO:'Bajaj Auto',SHREECEM:'Shree Cement',ICICIGI:'ICICI Lombard',
  INDUSINDBK:'IndusInd Bank',BIOCON:'Biocon',VEDL:'Vedanta',SAIL:'SAIL',
  IRCTC:'IRCTC',ZOMATO:'Zomato',NYKAA:'Nykaa',PAYTM:'Paytm',DMART:'Avenue Supermarts',
  PIDILITIND:'Pidilite Industries',SIEMENS:'Siemens',ABB:'ABB India',
}

// Quick mini sparkline (SVG)
function MiniSpark({ up }) {
  const pts = up
    ? 'M0 20 C15 12,30 22,45 6 C60 16,75 8,90 2 L100 0'
    : 'M0 4 C15 18,30 8,45 22 C60 10,75 20,90 26 L100 30'
  const c = up ? C.green : C.red
  return (
    <svg viewBox="0 0 100 30" width="56" height="18" style={{overflow:'visible'}}>
      <path d={pts+' L100 30 L0 30 Z'} fill={c} fillOpacity="0.12"/>
      <path d={pts} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

const DEFAULT_LISTS = {
  'My Watchlist': ['RELIANCE','TCS','HDFCBANK','INFY','SBIN'],
  'Tech Picks':   ['INFY','TCS','WIPRO','HCLTECH','MPHASIS'],
}

function loadLists() {
  try { return JSON.parse(localStorage.getItem('tp_watchlists') || 'null') || DEFAULT_LISTS }
  catch { return DEFAULT_LISTS }
}
function saveLists(lists) {
  try { localStorage.setItem('tp_watchlists', JSON.stringify(lists)) } catch {}
}

export default function WatchlistPage({ setPage }) {
  const navigate = useNavigate()
  const [lists, setLists]       = useState(loadLists)
  const [activeList, setActive] = useState('My Watchlist')
  const [searchQ, setSearchQ]   = useState('')
  const [addSearch, setAddSearch] = useState('')
  const [addDrop, setAddDrop]   = useState(false)
  const [newListName, setNewListName] = useState('')
  const [showNewList, setShowNewList] = useState(false)
  const [renaming, setRenaming] = useState(null)
  const [renameTo, setRenameTo] = useState('')

  const stocks = useSelector(s => s.market?.stocks || {})

  // Persist whenever lists change
  useEffect(() => saveLists(lists), [lists])

  const items = lists[activeList] || []

  const addSymbol = sym => {
    if (!sym) return
    setLists(prev => {
      const cur = prev[activeList] || []
      if (cur.includes(sym)) return prev
      return { ...prev, [activeList]: [...cur, sym] }
    })
    setAddSearch('')
    setAddDrop(false)
  }

  const removeSymbol = sym => {
    setLists(prev => ({ ...prev, [activeList]: (prev[activeList]||[]).filter(s=>s!==sym) }))
  }

  const createList = () => {
    const name = newListName.trim()
    if (!name || lists[name]) return
    setLists(prev => ({ ...prev, [name]: [] }))
    setActive(name)
    setNewListName('')
    setShowNewList(false)
  }

  const deleteList = name => {
    if (Object.keys(lists).length <= 1) return
    const next = { ...lists }
    delete next[name]
    setLists(next)
    setActive(Object.keys(next)[0])
  }

  const renameList = () => {
    const to = renameTo.trim()
    if (!to || lists[to] || !renaming) return
    const next = {}
    Object.keys(lists).forEach(k => { next[k===renaming?to:k] = lists[k] })
    setLists(next)
    setActive(to)
    setRenaming(null)
  }

  // Search across all symbols
  const addResults = addSearch
    ? Object.keys(SYMBOL_LABELS).filter(k =>
        k.toLowerCase().includes(addSearch.toLowerCase()) ||
        SYMBOL_LABELS[k].toLowerCase().includes(addSearch.toLowerCase())
      ).slice(0, 12)
    : []

  const filtered = searchQ
    ? items.filter(sym =>
        sym.toLowerCase().includes(searchQ.toLowerCase()) ||
        (SYMBOL_LABELS[sym]||'').toLowerCase().includes(searchQ.toLowerCase())
      )
    : items

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>
            <Star size={20} fill={C.amber} color={C.amber}/>
            Watchlist
          </h1>
          <p className={styles.headerSubtitle}>Track your favourite stocks · {items.length} stocks in {activeList}</p>
        </div>
        <button onClick={()=>navigate('/dashboard/trade')} className={styles.openTerminalBtn}>
          <TrendingUp size={13}/> Open Terminal
        </button>
      </div>

      <div className={styles.contentGrid}>

        {/* ─── Sidebar: List Manager ─── */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarTitle}>
            My Lists
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:2}}>
            {Object.keys(lists).map(name => (
              <div key={name} className={styles.listItem}>
                {renaming===name ? (
                  <div className={styles.renameInput}>
                    <input autoFocus value={renameTo} onChange={e=>setRenameTo(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&renameList()}
                      className={styles.renameInput}/>
                    <button onClick={renameList} className={styles.renameBtn}>✓</button>
                    <button onClick={()=>setRenaming(null)} className={styles.cancelBtn}>✕</button>
                  </div>
                ) : (
                  <div onClick={()=>setActive(name)} className={`${styles.listItemContent} ${activeList===name ? styles.active : ''}`}>
                    <div>
                      <div className={`${styles.listName} ${activeList===name ? styles.active : ''}`}>{name}</div>
                      <div className={styles.listCount}>{(lists[name]||[]).length} stocks</div>
                    </div>
                    <div className={styles.listActions}
                      onMouseEnter={e=>e.currentTarget.style.opacity=1}
                      onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                      <button onClick={e=>{e.stopPropagation();setRenaming(name);setRenameTo(name)}}
                        className={styles.actionIconBtn}>✏️</button>
                      <button onClick={e=>{e.stopPropagation();deleteList(name)}}
                        className={`${styles.actionIconBtn} ${styles.deleteBtn}`}>
                        <Trash2 size={11}/>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {showNewList ? (
            <div className={styles.newListSection}>
              <input autoFocus value={newListName} onChange={e=>setNewListName(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&createList()}
                placeholder="List name..." className={styles.newListInput}/>
              <div className={styles.newListButtons}>
                <button onClick={createList} className={styles.newListBtn}>Create</button>
                <button onClick={()=>setShowNewList(false)} className={styles.newListCancel}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setShowNewList(true)} className={styles.newListTrigger}>
              <Plus size={12}/> New List
            </button>
          )}
        </div>

        {/* ─── Main: Stock List ─── */}
        <div className={styles.mainContent}>
          {/* Controls */}
          <div className={styles.controls}>
            {/* Search within watchlist */}
            <div className={styles.searchWrapper}>
              <Search size={13} className={styles.searchIcon}/>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Filter watchlist..."
                className={styles.searchInput}/>
            </div>
            {/* Add stock */}
            <div className={styles.addStockWrapper}>
              <div className={styles.addStockInputWrapper}>
                <div className={styles.searchWrapper}>
                  <Search size={13} className={styles.searchIcon}/>
                  <input value={addSearch} onChange={e=>{setAddSearch(e.target.value);setAddDrop(true)}}
                    onFocus={()=>setAddDrop(true)}
                    onBlur={()=>setTimeout(()=>setAddDrop(false),200)}
                    placeholder="Add stock..."
                    className={styles.addStockInput}/>
                </div>
                <button onClick={()=>addResults[0]&&addSymbol(addResults[0])}
                  className={styles.addStockBtn}>
                  <Plus size={13}/> Add
                </button>
              </div>
              {addDrop && addResults.length>0 && (
                <div className={styles.addStockDropdown}>
                  {addResults.map(sym=>(
                    <div key={sym} onMouseDown={()=>addSymbol(sym)}
                      className={styles.dropdownItem}>
                      <span className={styles.dropdownItemName}>{SYMBOL_LABELS[sym]||sym}</span>
                      <span className={styles.dropdownItemSymbol}>{sym}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stock Rows */}
          {filtered.length===0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⭐</div>
              <h3 className={styles.emptyTitle}>No stocks yet</h3>
              <p className={styles.emptyDesc}>Search above to add stocks to your watchlist</p>
            </div>
          ) : (
            <div className={styles.stockTable}>
              {/* Table header */}
              <div className={styles.tableHeader}>
                <span>Stock</span>
                <span className={styles.cellRight}>Price</span>
                <span className={styles.cellRight}>Change</span>
                <span className={styles.cellRight}>Chart</span>
                <span className={styles.cellRight}>Volume</span>
                <span></span>
              </div>

              {filtered.map(sym=>{
                const q = stocks[sym]
                const up = (q?.changePct??0) >= 0
                return (
                  <div key={sym} className={styles.tableRow}
                    onClick={()=>navigate('/dashboard/trade')}>
                    <div className={styles.stockCell}>
                      <div className={styles.stockIcon}>
                        {sym.slice(0,2)}
                      </div>
                      <div>
                        <div className={styles.stockName}>{SYMBOL_LABELS[sym]||sym}</div>
                        <div className={styles.stockMeta}>{sym} · NSE</div>
                      </div>
                    </div>
                    <div className={styles.cellRight}>
                      <div className={styles.priceCell}>
                        {q?fR(q.price):'—'}
                      </div>
                    </div>
                    <div className={styles.cellRight}>
                      {q?(
                        <span className={`${styles.changeBadge} ${up ? styles.changeUp : styles.changeDown}`}>
                          {up?'▲':'▼'} {Math.abs(q.changePct).toFixed(2)}%
                        </span>
                      ):'—'}
                    </div>
                    <div className={styles.cellRight}>
                      <MiniSpark up={up}/>
                    </div>
                    <div className={styles.cellRight}>
                      <div className={styles.volumeCell}>
                        {q?.volume?`${(q.volume/1e5).toFixed(1)}L`:'—'}
                      </div>
                    </div>
                    <div className={styles.cellRight}>
                      <button onClick={e=>{e.stopPropagation();removeSymbol(sym)}}
                        className={styles.removeBtn}
                        title="Remove from watchlist">
                        <X size={14}/>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {items.length>0&&(
            <div className={styles.footerInfo}>
              {items.length} stocks · Auto-refreshed every 5s · Click any row to open Trading Terminal
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

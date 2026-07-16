import React, { useState, useEffect, useCallback } from 'react'
import { Search, Plus, X, Star, Trash2, TrendingUp, ChevronDown } from 'lucide-react'
import { useSelector } from 'react-redux'

const C = {
  green:'#00B386',greenBg:'#E6F9F4',red:'#E84040',redBg:'#FEF0F0',
  navy:'#111A3A',blue:'#2563EB',blueBg:'#EEF3FF',amber:'#F59E0B',
  gray50:'#F8F9FB',gray100:'#F1F3F6',gray200:'#E4E7EC',
  gray400:'#9AA3B2',gray600:'#5A6478',gray800:'#1E2636',white:'#FFFFFF',
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
    <div style={{maxWidth:1100,margin:'0 auto',padding:'24px 20px',fontFamily:'Inter,sans-serif'}}>
      {/* Page Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:900,color:C.gray800,display:'flex',alignItems:'center',gap:10}}>
            <Star size={20} fill={C.amber} color={C.amber}/>
            Watchlist
          </h1>
          <p style={{fontSize:13,color:C.gray400,marginTop:3}}>Track your favourite stocks · {items.length} stocks in {activeList}</p>
        </div>
        <button onClick={()=>setPage&&setPage('trade')}
          style={{padding:'9px 18px',borderRadius:6,background:C.navy,color:'#fff',fontWeight:700,fontSize:12.5,border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
          <TrendingUp size={13}/> Open Terminal
        </button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:20}}>

        {/* ─── Sidebar: List Manager ─── */}
        <div style={{background:'#fff',border:`1px solid ${C.gray200}`,borderRadius:10,padding:14,height:'fit-content'}}>
          <div style={{fontSize:11,fontWeight:800,color:C.gray400,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:10}}>
            My Lists
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:2}}>
            {Object.keys(lists).map(name => (
              <div key={name} style={{position:'relative'}}>
                {renaming===name ? (
                  <div style={{display:'flex',gap:4}}>
                    <input autoFocus value={renameTo} onChange={e=>setRenameTo(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&renameList()}
                      style={{flex:1,padding:'6px 8px',borderRadius:4,border:`1px solid ${C.blue}`,fontSize:12,outline:'none'}}/>
                    <button onClick={renameList} style={{padding:'4px 8px',borderRadius:4,background:C.blue,color:'#fff',border:'none',cursor:'pointer',fontSize:11}}>✓</button>
                    <button onClick={()=>setRenaming(null)} style={{padding:'4px 8px',borderRadius:4,background:C.gray100,border:'none',cursor:'pointer',fontSize:11}}>✕</button>
                  </div>
                ) : (
                  <div onClick={()=>setActive(name)} style={{
                    display:'flex',justifyContent:'space-between',alignItems:'center',
                    padding:'8px 10px',borderRadius:6,cursor:'pointer',
                    background:activeList===name?C.blueBg:'transparent',
                    borderLeft:`3px solid ${activeList===name?C.blue:'transparent'}`,
                    transition:'all .12s'}}>
                    <div>
                      <div style={{fontSize:12.5,fontWeight:700,color:activeList===name?C.blue:C.gray800}}>{name}</div>
                      <div style={{fontSize:10,color:C.gray400}}>{(lists[name]||[]).length} stocks</div>
                    </div>
                    <div style={{display:'flex',gap:4,opacity:0}} className="list-actions"
                      onMouseEnter={e=>e.currentTarget.style.opacity=1}
                      onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                      <button onClick={e=>{e.stopPropagation();setRenaming(name);setRenameTo(name)}}
                        style={{background:'none',border:'none',cursor:'pointer',fontSize:10,color:C.gray400,padding:'2px'}}>✏️</button>
                      <button onClick={e=>{e.stopPropagation();deleteList(name)}}
                        style={{background:'none',border:'none',cursor:'pointer',color:C.red,padding:'2px'}}>
                        <Trash2 size={11}/>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {showNewList ? (
            <div style={{marginTop:10}}>
              <input autoFocus value={newListName} onChange={e=>setNewListName(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&createList()}
                placeholder="List name..." style={{width:'100%',padding:'7px 8px',borderRadius:4,border:`1px solid ${C.blue}`,fontSize:12,outline:'none',boxSizing:'border-box'}}/>
              <div style={{display:'flex',gap:6,marginTop:6}}>
                <button onClick={createList} style={{flex:1,padding:'6px 0',borderRadius:4,background:C.blue,color:'#fff',border:'none',cursor:'pointer',fontSize:11,fontWeight:700}}>Create</button>
                <button onClick={()=>setShowNewList(false)} style={{flex:1,padding:'6px 0',borderRadius:4,background:C.gray100,border:'none',cursor:'pointer',fontSize:11}}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setShowNewList(true)} style={{width:'100%',marginTop:10,padding:'8px 0',
              borderRadius:6,background:'none',border:`1.5px dashed ${C.gray200}`,color:C.gray600,
              fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
              <Plus size={12}/> New List
            </button>
          )}
        </div>

        {/* ─── Main: Stock List ─── */}
        <div>
          {/* Controls */}
          <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'center'}}>
            {/* Search within watchlist */}
            <div style={{position:'relative',flex:1}}>
              <Search size={13} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:C.gray400}}/>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Filter watchlist..."
                style={{width:'100%',padding:'8px 10px 8px 30px',borderRadius:8,border:`1.5px solid ${C.gray200}`,fontSize:12.5,outline:'none',boxSizing:'border-box'}}/>
            </div>
            {/* Add stock */}
            <div style={{position:'relative'}}>
              <div style={{display:'flex',alignItems:'center',gap:0}}>
                <div style={{position:'relative'}}>
                  <Search size={13} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:C.gray400}}/>
                  <input value={addSearch} onChange={e=>{setAddSearch(e.target.value);setAddDrop(true)}}
                    onFocus={()=>setAddDrop(true)}
                    onBlur={()=>setTimeout(()=>setAddDrop(false),200)}
                    placeholder="Add stock..."
                    style={{padding:'8px 10px 8px 30px',borderRadius:'8px 0 0 8px',border:`1.5px solid ${C.gray200}`,
                      borderRight:'none',fontSize:12.5,outline:'none',width:180}}/>
                </div>
                <button onClick={()=>addResults[0]&&addSymbol(addResults[0])}
                  style={{padding:'8px 12px',borderRadius:'0 8px 8px 0',background:C.green,color:'#fff',
                    border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12,fontWeight:700}}>
                  <Plus size={13}/> Add
                </button>
              </div>
              {addDrop && addResults.length>0 && (
                <div style={{position:'absolute',top:40,left:0,right:0,background:'#fff',
                  borderRadius:8,boxShadow:'0 8px 24px rgba(0,0,0,0.12)',border:`1px solid ${C.gray200}`,
                  zIndex:200,maxHeight:240,overflowY:'auto'}}>
                  {addResults.map(sym=>(
                    <div key={sym} onMouseDown={()=>addSymbol(sym)}
                      style={{padding:'9px 12px',cursor:'pointer',display:'flex',justifyContent:'space-between',
                        borderBottom:`1px solid ${C.gray50}`,transition:'background .1s'}}
                      onMouseEnter={e=>e.currentTarget.style.background=C.gray50}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <span style={{fontSize:12.5,fontWeight:700,color:C.gray800}}>{SYMBOL_LABELS[sym]||sym}</span>
                      <span style={{fontSize:11,color:C.gray400,fontFamily:'monospace'}}>{sym}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stock Rows */}
          {filtered.length===0 ? (
            <div style={{padding:48,textAlign:'center',background:'#fff',border:`1.5px dashed ${C.gray200}`,borderRadius:12}}>
              <div style={{fontSize:40,marginBottom:12}}>⭐</div>
              <h3 style={{fontSize:16,fontWeight:800,color:C.gray800,marginBottom:8}}>No stocks yet</h3>
              <p style={{fontSize:13,color:C.gray400}}>Search above to add stocks to your watchlist</p>
            </div>
          ) : (
            <div style={{background:'#fff',border:`1px solid ${C.gray200}`,borderRadius:10,overflow:'hidden'}}>
              {/* Table header */}
              <div style={{display:'grid',gridTemplateColumns:'2.5fr 1fr 1fr 1fr 0.8fr 0.5fr',
                padding:'9px 16px',background:C.gray50,borderBottom:`1px solid ${C.gray200}`,
                fontSize:10.5,fontWeight:800,color:C.gray400,textTransform:'uppercase'}}>
                <span>Stock</span>
                <span style={{textAlign:'right'}}>Price</span>
                <span style={{textAlign:'right'}}>Change</span>
                <span style={{textAlign:'right'}}>Chart</span>
                <span style={{textAlign:'right'}}>Volume</span>
                <span></span>
              </div>

              {filtered.map(sym=>{
                const q = stocks[sym]
                const up = (q?.changePct??0) >= 0
                return (
                  <div key={sym} style={{display:'grid',gridTemplateColumns:'2.5fr 1fr 1fr 1fr 0.8fr 0.5fr',
                    padding:'13px 16px',borderBottom:`1px solid ${C.gray100}`,alignItems:'center',
                    transition:'background .1s',cursor:'pointer'}}
                    onMouseEnter={e=>e.currentTarget.style.background=C.gray50}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    onClick={()=>setPage&&setPage('trade')}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:32,height:32,borderRadius:8,background:C.blueBg,color:C.blue,
                        display:'flex',alignItems:'center',justifyContent:'center',fontSize:10.5,fontWeight:900,flexShrink:0}}>
                        {sym.slice(0,2)}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:800,color:C.gray800}}>{SYMBOL_LABELS[sym]||sym}</div>
                        <div style={{fontSize:10.5,color:C.gray400,fontFamily:'monospace',marginTop:1}}>{sym} · NSE</div>
                      </div>
                    </div>
                    <div style={{textAlign:'right',fontSize:14,fontFamily:'monospace',fontWeight:800,color:C.gray800}}>
                      {q?fR(q.price):'—'}
                    </div>
                    <div style={{textAlign:'right'}}>
                      {q?(
                        <span style={{fontSize:12,fontWeight:800,color:up?C.green:C.red,
                          background:up?C.greenBg:C.redBg,padding:'3px 8px',borderRadius:10}}>
                          {up?'▲':'▼'} {Math.abs(q.changePct).toFixed(2)}%
                        </span>
                      ):'—'}
                    </div>
                    <div style={{display:'flex',justifyContent:'flex-end'}}>
                      <MiniSpark up={up}/>
                    </div>
                    <div style={{textAlign:'right',fontSize:11,fontFamily:'monospace',color:C.gray400}}>
                      {q?.volume?`${(q.volume/1e5).toFixed(1)}L`:'—'}
                    </div>
                    <div style={{textAlign:'right'}}>
                      <button onClick={e=>{e.stopPropagation();removeSymbol(sym)}}
                        style={{background:'none',border:'none',cursor:'pointer',color:C.red,
                          padding:'4px',borderRadius:4,transition:'background .1s',display:'flex',alignItems:'center'}}
                        onMouseEnter={e=>e.currentTarget.style.background=C.redBg}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}
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
            <div style={{marginTop:12,fontSize:11.5,color:C.gray400,textAlign:'center'}}>
              {items.length} stocks · Auto-refreshed every 5s · Click any row to open Trading Terminal
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

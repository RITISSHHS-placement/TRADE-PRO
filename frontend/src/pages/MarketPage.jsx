import React, { useState, useMemo, useEffect } from 'react'
import { useMarketData } from '../hooks'
import { SYMBOL_LABELS } from '../services/marketData'
import {
  Search, RefreshCw, TrendingUp, TrendingDown, Globe2, Newspaper,
  Filter, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight,
  Bookmark, BookmarkCheck, Clock, Layers, X, BarChart2,
} from 'lucide-react'

/* ── COLOR TOKENS ─────────────────────────────────────────── */
const T = {
  white:'#ffffff', bg:'#f4f6f8', bgHover:'#eef1f4', surface:'#ffffff',
  border:'#e2e6ea', border2:'#f0f2f5',
  text:'#1a1f2e', textSub:'#5c677d', textMute:'#9aa3b2',
  green:'#1db954', greenBg:'#e8f8ee', greenDark:'#0f9140',
  red:'#e53935', redBg:'#fdecea', redDark:'#b71c1c',
  blue:'#1565c0', blueBg:'#e3f2fd', navy:'#0a1628',
  gold:'#c7920a', goldBg:'#fef9e7',
}

/* ── HELPERS ──────────────────────────────────────────────── */
const fmt  = n => (n??0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
const fmtT = ts => ts ? new Date(ts).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '--'
const fmtV = n => !n?'—':n>=1e7?`${(n/1e7).toFixed(2)}Cr`:n>=1e5?`${(n/1e5).toFixed(2)}L`:n.toLocaleString('en-IN')

const pos = v => (v??0) >= 0
const chgColor  = v => pos(v) ? T.green : T.red
const chgBg     = v => pos(v) ? T.greenBg : T.redBg
const ChgArrow  = ({ v, sz=12 }) => pos(v)
  ? <ArrowUpRight size={sz} color={T.green}/>
  : <ArrowDownRight size={sz} color={T.red}/>

/* ── SCREENER STOCK DATA (18 stocks) ─────────────────────── */
const STOCKS = [
  {sym:'RELIANCE',name:'Reliance Industries',sector:'Oil & Gas',cat:'Largecap',mcap:1820000,price:2912.45,pe:28.4,pb:2.8,roe:14.2,roce:12.8,de:0.34,dy:0.4,rsi:58,g1:12,g3:18,g5:22,eg:15,pg:18,om:17.2,nm:9.8,cr:1.4,ph:63.2,fi:22.1,dii:14.7,vol:8420000,beta:0.92,h52:3220,l52:2220,pledge:0,peg:1.9,evEbitda:14.2,fcf:28000,wc:45000,altman:3.2,shortInt:0.8},
  {sym:'TCS',name:'Tata Consultancy Services',sector:'IT',cat:'Largecap',mcap:1420000,price:3892.30,pe:32.1,pb:14.2,roe:48.2,roce:62.4,de:0.02,dy:1.8,rsi:54,g1:8,g3:14,g5:18,eg:12,pg:14,om:25.1,nm:19.8,cr:4.2,ph:71.7,fi:12.4,dii:15.9,vol:2140000,beta:0.74,h52:4380,l52:3350,pledge:0,peg:2.6,evEbitda:22.1,fcf:42000,wc:62000,altman:8.4,shortInt:0.3},
  {sym:'HDFCBANK',name:'HDFC Bank',sector:'Banking',cat:'Largecap',mcap:1240000,price:1724.85,pe:19.2,pb:2.6,roe:16.4,roce:8.2,de:7.8,dy:1.2,rsi:52,g1:22,g3:18,g5:20,eg:18,pg:20,om:42.1,nm:22.4,cr:null,ph:25.4,fi:48.2,dii:26.4,vol:6280000,beta:0.88,h52:1880,l52:1410,pledge:0,peg:1.1,evEbitda:null,fcf:null,wc:null,altman:null,shortInt:0.5},
  {sym:'INFY',name:'Infosys',sector:'IT',cat:'Largecap',mcap:782000,price:1884.60,pe:28.4,pb:9.8,roe:34.2,roce:44.1,de:0.04,dy:2.4,rsi:46,g1:4,g3:12,g5:16,eg:10,pg:12,om:21.4,nm:16.2,cr:3.8,ph:14.9,fi:32.4,dii:22.1,vol:4120000,beta:0.82,h52:2024,l52:1350,pledge:0,peg:2.4,evEbitda:18.4,fcf:18200,wc:28000,altman:7.2,shortInt:0.4},
  {sym:'ICICIBANK',name:'ICICI Bank',sector:'Banking',cat:'Largecap',mcap:882000,price:1264.20,pe:18.4,pb:3.2,roe:18.2,roce:9.4,de:6.4,dy:0.8,rsi:62,g1:28,g3:24,g5:22,eg:22,pg:24,om:44.2,nm:24.1,cr:null,ph:30.2,fi:42.4,dii:24.8,vol:8420000,beta:1.02,h52:1362,l52:942,pledge:0,peg:0.8,evEbitda:null,fcf:null,wc:null,altman:null,shortInt:0.6},
  {sym:'SBIN',name:'State Bank of India',sector:'Banking',cat:'Largecap',mcap:624000,price:698.40,pe:11.2,pb:1.8,roe:16.8,roce:8.8,de:14.2,dy:1.4,rsi:55,g1:18,g3:22,g5:20,eg:16,pg:18,om:38.4,nm:18.2,cr:null,ph:57.4,fi:10.2,dii:32.4,vol:12480000,beta:1.12,h52:912,l52:622,pledge:0,peg:0.7,evEbitda:null,fcf:null,wc:null,altman:null,shortInt:0.9},
  {sym:'LT',name:'Larsen & Toubro',sector:'Capital Goods',cat:'Largecap',mcap:482000,price:3428.75,pe:34.2,pb:5.8,roe:18.4,roce:16.2,de:0.82,dy:0.6,rsi:59,g1:24,g3:20,g5:18,eg:20,pg:22,om:12.4,nm:8.8,cr:1.2,ph:51.2,fi:18.4,dii:30.4,vol:1840000,beta:1.04,h52:3964,l52:2844,pledge:0,peg:1.7,evEbitda:24.2,fcf:8400,wc:42000,altman:2.8,shortInt:0.4},
  {sym:'WIPRO',name:'Wipro',sector:'IT',cat:'Largecap',mcap:248000,price:452.80,pe:22.4,pb:4.2,roe:18.8,roce:24.2,de:0.12,dy:0.2,rsi:44,g1:2,g3:8,g5:12,eg:8,pg:10,om:16.2,nm:12.4,cr:2.8,ph:72.9,fi:8.4,dii:18.2,vol:6240000,beta:0.88,h52:598,l52:408,pledge:0,peg:2.8,evEbitda:14.2,fcf:8200,wc:14000,altman:6.4,shortInt:0.6},
  {sym:'SUNPHARMA',name:'Sun Pharmaceutical',sector:'Pharma',cat:'Largecap',mcap:342000,price:1428.50,pe:38.4,pb:6.2,roe:16.4,roce:18.2,de:0.18,dy:0.6,rsi:64,g1:22,g3:18,g5:16,eg:18,pg:20,om:24.2,nm:16.8,cr:2.4,ph:54.4,fi:16.8,dii:28.8,vol:2840000,beta:0.78,h52:1960,l52:1260,pledge:0,peg:2.1,evEbitda:22.4,fcf:12400,wc:28000,altman:4.2,shortInt:0.3},
  {sym:'BAJFINANCE',name:'Bajaj Finance',sector:'Financial Services',cat:'Largecap',mcap:428000,price:7084.20,pe:36.8,pb:7.4,roe:22.4,roce:12.4,de:3.8,dy:0.2,rsi:68,g1:28,g3:24,g5:28,eg:26,pg:28,om:62.4,nm:28.4,cr:null,ph:56.2,fi:18.4,dii:24.8,vol:1840000,beta:1.22,h52:8192,l52:6188,pledge:0,peg:1.4,evEbitda:null,fcf:null,wc:null,altman:null,shortInt:0.7},
  {sym:'MARUTI',name:'Maruti Suzuki India',sector:'Auto',cat:'Largecap',mcap:348000,price:11248.40,pe:28.4,pb:4.8,roe:18.2,roce:22.4,de:0.02,dy:0.8,rsi:56,g1:14,g3:16,g5:18,eg:16,pg:18,om:10.4,nm:8.2,cr:1.8,ph:58.2,fi:22.4,dii:18.8,vol:640000,beta:0.84,h52:13680,l52:9924,pledge:0,peg:1.8,evEbitda:16.4,fcf:14200,wc:18000,altman:5.4,shortInt:0.2},
  {sym:'NTPC',name:'NTPC',sector:'Power',cat:'Largecap',mcap:312000,price:362.40,pe:18.2,pb:2.4,roe:13.8,roce:12.2,de:1.42,dy:2.2,rsi:52,g1:12,g3:14,g5:16,eg:14,pg:16,om:28.4,nm:14.2,cr:0.8,ph:51.2,fi:8.4,dii:38.4,vol:8240000,beta:0.88,h52:448,l52:282,pledge:0,peg:1.3,evEbitda:12.4,fcf:18000,wc:null,altman:2.2,shortInt:0.4},
  {sym:'HCLTECH',name:'HCL Technologies',sector:'IT',cat:'Largecap',mcap:378000,price:1398.60,pe:26.4,pb:7.8,roe:28.4,roce:36.2,de:0.06,dy:3.8,rsi:58,g1:16,g3:14,g5:16,eg:12,pg:14,om:22.4,nm:16.8,cr:3.2,ph:60.8,fi:12.4,dii:26.8,vol:2840000,beta:0.82,h52:1950,l52:1264,pledge:0,peg:2.2,evEbitda:16.4,fcf:22000,wc:32000,altman:7.8,shortInt:0.3},
  {sym:'TATAMOTORS',name:'Tata Motors',sector:'Auto',cat:'Largecap',mcap:284000,price:762.80,pe:12.4,pb:3.8,roe:32.4,roce:18.4,de:1.82,dy:0.4,rsi:48,g1:8,g3:42,g5:28,eg:22,pg:32,om:8.4,nm:5.2,cr:0.8,ph:46.4,fi:18.8,dii:28.4,vol:9840000,beta:1.42,h52:1178,l52:682,pledge:0,peg:0.6,evEbitda:8.4,fcf:12000,wc:null,altman:1.8,shortInt:1.2},
  {sym:'ADANIPOWER',name:'Adani Power',sector:'Power',cat:'Largecap',mcap:228000,price:588.20,pe:8.4,pb:4.2,roe:52.4,roce:28.4,de:2.84,dy:0,rsi:62,g1:42,g3:82,g5:148,eg:28,pg:42,om:38.4,nm:32.4,cr:0.6,ph:74.9,fi:4.2,dii:20.9,vol:6840000,beta:1.52,h52:892,l52:384,pledge:22.4,peg:0.3,evEbitda:6.4,fcf:8000,wc:null,altman:1.4,shortInt:1.8},
  {sym:'POLYCAB',name:'Polycab India',sector:'Electrical',cat:'Midcap',mcap:82000,price:5484.20,pe:48.4,pb:9.8,roe:22.4,roce:28.4,de:0.08,dy:0.4,rsi:72,g1:28,g3:32,g5:38,eg:24,pg:28,om:12.4,nm:9.2,cr:2.4,ph:24.8,fi:28.4,dii:42.8,vol:284000,beta:0.92,h52:7440,l52:4820,pledge:0,peg:2.0,evEbitda:28.4,fcf:4200,wc:8000,altman:6.8,shortInt:0.4},
  {sym:'DRREDDY',name:"Dr. Reddy's Laboratories",sector:'Pharma',cat:'Largecap',mcap:184000,price:1098.40,pe:22.4,pb:4.2,roe:18.4,roce:22.4,de:0.12,dy:0.6,rsi:52,g1:12,g3:18,g5:14,eg:14,pg:16,om:22.4,nm:14.8,cr:2.8,ph:26.8,fi:28.4,dii:44.8,vol:840000,beta:0.72,h52:1324,l52:924,pledge:0,peg:1.6,evEbitda:14.4,fcf:6800,wc:12000,altman:5.2,shortInt:0.4},
  {sym:'ONGC',name:'Oil & Natural Gas Corp',sector:'Oil & Gas',cat:'Largecap',mcap:342000,price:272.40,pe:8.4,pb:1.2,roe:14.2,roce:18.4,de:0.42,dy:4.8,rsi:48,g1:8,g3:12,g5:14,eg:10,pg:12,om:18.4,nm:12.4,cr:1.2,ph:58.4,fi:4.2,dii:36.8,vol:12480000,beta:0.96,h52:348,l52:224,pledge:0,peg:0.8,evEbitda:4.4,fcf:22000,wc:18000,altman:2.8,shortInt:0.6},
]
const SECTORS = ['Banking','IT','Oil & Gas','Pharma','Auto','Financial Services','Consumer Goods','Capital Goods','Electrical','Chemicals','Power','Healthcare']
const INIT_FILTERS = {
  cat:'All', sector:'All', priceMin:'', priceMax:'', mcapMin:'', mcapMax:'',
  peMin:'', peMax:'', pbMin:'', pbMax:'', peg:'', evEbitda:'',
  roeMin:'', roeMax:'', roceMin:'', roceMax:'', omMin:'', nmMin:'',
  deMax:'', crMin:'', dyMin:'',
  g1Min:'', g3Min:'', g5Min:'', egMin:'', pgMin:'',
  phMin:'', phMax:'', pledgeMax:'', fiiMin:'', diiMin:'',
  volMin:'', betaMin:'', betaMax:'',
  rsiMin:'', rsiMax:'', macd:'All', sma:'All',
  fcfMin:'', wcMin:'', altmanMin:'', shortIntMax:'',
  search:'',
}

/* ── SCREENER PRESET COLLECTIONS ─────────────────────────── */
const PRESETS = [
  {id:'wc',emoji:'✳️',name:'Wealth Compounders',desc:'High-quality businesses with consistent earnings growth and strong ROE.',tags:['ROE>20%','PE<40','Largecap'],users:'1.2L',filters:{roeMin:'20',peMax:'40',cat:'Largecap'}},
  {id:'dg',emoji:'💰',name:'Dividend Gems',desc:'Companies with consistent dividend payouts and healthy balance sheets.',tags:['Div>2%','D/E<1','Profit+'],users:'84K',filters:{dyMin:'2',deMax:'1'}},
  {id:'cr',emoji:'🪙',name:'Cash Rich Smallcaps',desc:'Smallcap companies with strong cash reserves and low debt.',tags:['Midcap','D/E<0.5','CR>2'],filters:{cat:'Midcap',deMax:'0.5',crMin:'2'},users:'62K'},
  {id:'mm',emoji:'⚡',name:'Momentum Monsters',desc:'Stocks with strong price momentum and high RSI signals.',tags:['RSI>60','3Y Growth>20%','Beta>1'],filters:{rsiMin:'60',g3Min:'20',betaMin:'1'},users:'94K'},
  {id:'hr',emoji:'🌿',name:'High ROE Compounders',desc:'Businesses generating high returns on equity over multiple cycles.',tags:['ROE>25%','ROCE>25%','D/E<1'],filters:{roeMin:'25',roceMin:'25',deMax:'1'},users:'1.04L'},
  {id:'hg',emoji:'💎',name:'Hidden Gems',desc:'Under-the-radar quality midcaps with strong fundamentals.',tags:['Midcap','ROE>15%','PB<5'],filters:{cat:'Midcap',roeMin:'15',pbMax:'5'},users:'78K'},
  {id:'ld',emoji:'🛡️',name:'Low Debt Quality',desc:'Financially disciplined companies with minimal leverage.',tags:['D/E<0.3','ROCE>18%','Profitable'],filters:{deMax:'0.3',roceMin:'18'},users:'56K'},
  {id:'n5',emoji:'📉',name:'Near 52W Lows',desc:'Quality stocks trading near 52-week lows with rebound potential.',tags:['Near 52W Low','PE<30','Quality'],filters:{peMax:'30',rsiMax:'45'},users:'48K'},
  {id:'it',emoji:'💻',name:'IT Sector Leaders',desc:'Top IT companies with strong revenue growth and high margins.',tags:['IT Sector','OPM>20%','ROE>25%'],filters:{sector:'IT',omMin:'20',roeMin:'25'},users:'1.1L'},
]

/* ── US STOCKS DATA ───────────────────────────────────────── */
const US_STOCKS = [
  {sym:'AAPL',name:'Apple Inc.',price:227.52,chg:1.24,pe:34.2,mcap:'3.48T',sector:'Technology'},
  {sym:'MSFT',name:'Microsoft Corp.',price:441.80,chg:0.87,pe:38.4,mcap:'3.28T',sector:'Technology'},
  {sym:'GOOGL',name:'Alphabet Inc.',price:196.47,chg:1.52,pe:24.6,mcap:'2.41T',sector:'Technology'},
  {sym:'AMZN',name:'Amazon.com Inc.',price:228.56,chg:2.14,pe:56.2,mcap:'2.42T',sector:'Consumer'},
  {sym:'NVDA',name:'NVIDIA Corp.',price:148.85,chg:3.68,pe:52.8,mcap:'3.62T',sector:'Technology'},
  {sym:'META',name:'Meta Platforms',price:698.10,chg:-0.45,pe:28.9,mcap:'1.76T',sector:'Technology'},
  {sym:'TSLA',name:'Tesla Inc.',price:342.54,chg:-1.82,pe:97.4,mcap:'1.10T',sector:'Auto'},
  {sym:'BRKB',name:'Berkshire Hathaway B',price:539.20,chg:0.34,pe:21.2,mcap:'1.17T',sector:'Finance'},
  {sym:'JPM',name:'JPMorgan Chase',price:296.85,chg:0.76,pe:13.4,mcap:'845B',sector:'Finance'},
  {sym:'V',name:'Visa Inc.',price:348.72,chg:0.58,pe:31.6,mcap:'718B',sector:'Finance'},
  {sym:'UNH',name:'UnitedHealth Group',price:312.40,chg:-2.14,pe:18.2,mcap:'288B',sector:'Healthcare'},
  {sym:'JNJ',name:'Johnson & Johnson',price:163.28,chg:0.22,pe:16.8,mcap:'393B',sector:'Healthcare'},
  {sym:'XOM',name:'Exxon Mobil',price:115.64,chg:-0.88,pe:13.6,mcap:'459B',sector:'Energy'},
  {sym:'WMT',name:'Walmart Inc.',price:96.44,chg:0.42,pe:38.7,mcap:'776B',sector:'Consumer'},
  {sym:'PG',name:'Procter & Gamble',price:168.85,chg:0.18,pe:26.4,mcap:'394B',sector:'Consumer'},
]
const USD_INR = 83.8

/* ── NEWS DATA ────────────────────────────────────────────── */
const NEWS = [
  {id:1,cat:'Economy',title:'RBI holds repo rate at 6.5%; upgrades GDP forecast to 7.2% for FY26',source:'Economic Times',time:'2h ago',sentiment:'positive'},
  {id:2,cat:'Results',title:'Reliance Industries Q1 net profit surges 18% YoY on retail & Jio growth',source:'Business Standard',time:'1h ago',sentiment:'positive'},
  {id:3,cat:'Regulatory',title:'SEBI releases framework for algorithmic trading by retail investors',source:'Mint',time:'3h ago',sentiment:'neutral'},
  {id:4,cat:'Deal',title:'TCS bags $2.1 billion multi-year outsourcing deal from European bank',source:'Reuters',time:'4h ago',sentiment:'positive'},
  {id:5,cat:'Markets',title:'Sensex crosses 84,000 as FIIs pump ₹6,240 Cr in single session',source:'CNBC-TV18',time:'30m ago',sentiment:'positive'},
  {id:6,cat:'Banking',title:'HDFC Bank NPA improves to 1.12%; provisions fall 28% sequentially',source:'Financial Express',time:'2h ago',sentiment:'positive'},
  {id:7,cat:'Markets',title:'Adani Group stocks rally 3–7% after MSCI index inclusion confirmation',source:'Bloomberg Quint',time:'5h ago',sentiment:'positive'},
  {id:8,cat:'Commodities',title:'Gold hits record ₹98,450 per 10g on global uncertainty and dollar weakness',source:'MCX Live',time:'1h ago',sentiment:'positive'},
  {id:9,cat:'Results',title:"Infosys cuts revenue guidance to 3.75–4.5% citing deal ramp-up delays",source:'ET Markets',time:'3h ago',sentiment:'negative'},
  {id:10,cat:'Economy',title:"India's manufacturing PMI rises to 59.1 — highest in 16 years",source:'S&P Global',time:'6h ago',sentiment:'positive'},
  {id:11,cat:'US Markets',title:"NVIDIA crosses $3.6T market cap, overtakes Apple as world's most valuable",source:'WSJ',time:'2h ago',sentiment:'positive'},
  {id:12,cat:'Economy',title:"Fed signals two rate cuts in H2 2026 as inflation cools below 2.4%",source:'Fed Watch',time:'4h ago',sentiment:'positive'},
  {id:13,cat:'US Markets',title:"Apple Vision Pro 2 unveiled with M4 chip — pre-orders open next week",source:'9to5Mac',time:'1h ago',sentiment:'positive'},
  {id:14,cat:'Banking',title:"Bajaj Finance AUM crosses ₹4.8 lakh crore; NPA stable at 0.46%",source:'Bajaj IR',time:'5h ago',sentiment:'positive'},
  {id:15,cat:'Commodities',title:"Crude oil slides 2% on surprise US inventory build and OPEC+ supply hike",source:'Reuters',time:'3h ago',sentiment:'negative'},
]
const NEWS_CATS = ['All','Markets','Economy','Results','Banking','US Markets','Commodities','Regulatory']
const SENTIMENT_DOT = { positive:'#1db954', negative:'#e53935', neutral:'#f59e0b' }

/* ── SMALL UTILITY COMPONENTS ────────────────────────────── */
const Badge = ({ children, color=T.blue, bg=T.blueBg, style={} }) => (
  <span style={{display:'inline-block',padding:'2px 7px',borderRadius:4,fontSize:10.5,fontWeight:700,color,background:bg,...style}}>
    {children}
  </span>
)

const Pill = ({ active, onClick, children, style={} }) => (
  <button onClick={onClick} style={{
    padding:'4px 12px', borderRadius:20, border:`1px solid ${active?T.blue:T.border}`,
    background:active?T.blueBg:T.white, color:active?T.blue:T.textSub,
    fontSize:12.5, fontWeight:active?700:500, cursor:'pointer', whiteSpace:'nowrap', ...style,
  }}>{children}</button>
)

const StatGrid = ({ rows }) => (
  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 12px',marginTop:12}}>
    {rows.map(([k,v],i) => (
      <div key={i} style={{background:T.bg,borderRadius:6,padding:'7px 10px'}}>
        <div style={{fontSize:10,color:T.textMute,fontWeight:600,textTransform:'uppercase',letterSpacing:.5}}>{k}</div>
        <div style={{fontSize:13.5,fontWeight:700,color:T.text,marginTop:2}}>{v??'—'}</div>
      </div>
    ))}
  </div>
)

/* FilterSec — collapsible sidebar filter section */
const FilterSec = ({ title, children, defaultOpen=true }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{borderBottom:`1px solid ${T.border2}`,paddingBottom:12,marginBottom:4}}>
      <button onClick={()=>setOpen(o=>!o)} style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',
        background:'none',border:'none',padding:'8px 0',cursor:'pointer',
      }}>
        <span style={{fontSize:11.5,fontWeight:700,color:T.text,textTransform:'uppercase',letterSpacing:.6}}>{title}</span>
        {open ? <ChevronUp size={13} color={T.textMute}/> : <ChevronDown size={13} color={T.textMute}/>}
      </button>
      {open && <div style={{paddingTop:4}}>{children}</div>}
    </div>
  )
}

const lbl = {fontSize:10.5,color:T.textSub,fontWeight:700,marginTop:8,display:'block'}

const inp = (extra={}) => ({
  width:'100%', border:`1px solid ${T.border}`, borderRadius:6, padding:'5px 8px',
  fontSize:12.5, color:T.text, background:T.white, outline:'none', boxSizing:'border-box', ...extra,
})

const RangeRow = ({ label, kMin, kMax, filters, onChange }) => (
  <div>
    <span style={lbl}>{label}</span>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:4}}>
      <input style={inp()} placeholder="Min" type="number" value={filters[kMin]} onChange={e=>onChange(kMin,e.target.value)}/>
      <input style={inp()} placeholder="Max" type="number" value={filters[kMax]} onChange={e=>onChange(kMax,e.target.value)}/>
    </div>
  </div>
)

const MinRow = ({ label, k, filters, onChange, placeholder='Min' }) => (
  <div>
    <span style={lbl}>{label}</span>
    <input style={{...inp(),marginTop:4}} placeholder={placeholder} type="number" value={filters[k]} onChange={e=>onChange(k,e.target.value)}/>
  </div>
)

const MaxRow = ({ label, k, filters, onChange, placeholder='Max' }) => (
  <div>
    <span style={lbl}>{label}</span>
    <input style={{...inp(),marginTop:4}} placeholder={placeholder} type="number" value={filters[k]} onChange={e=>onChange(k,e.target.value)}/>
  </div>
)

/* Cap category buttons */
const CapBtns = ({ value, onChange }) => (
  <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:6}}>
    {['All','Largecap','Midcap','Smallcap'].map(c=>(
      <button key={c} onClick={()=>onChange('cat',c)} style={{
        padding:'3px 10px',borderRadius:4,border:`1px solid ${value===c?T.blue:T.border}`,
        background:value===c?T.blueBg:T.white,color:value===c?T.blue:T.textSub,
        fontSize:11.5,fontWeight:value===c?700:500,cursor:'pointer',
      }}>{c}</button>
    ))}
  </div>
)

/* ══════════════════════════════════════════════════════════
   TAB 1 — MARKETS
══════════════════════════════════════════════════════════ */
const INDEX_STRIP_KEYS = [
  {key:'NIFTY 50',label:'NIFTY 50'},
  {key:'NIFTY BANK',label:'BANK NIFTY'},
  {key:'INDIA VIX',label:'INDIA VIX'},
  {key:'NIFTY IT',label:'NIFTY IT'},
  {key:'NIFTY PHARMA',label:'NIFTY PHARMA'},
  {key:'NIFTY AUTO',label:'NIFTY AUTO'},
]

function MarketsTab({ indices, stocks, gainers, losers }) {
  const [subTab, setSubTab] = useState('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [highlightedIndex, setHighlightedIndex] = useState(null)

  // build combined list
  const allItems = useMemo(() => {
    const map = {}
    // indices first
    Object.entries(indices||{}).forEach(([k,v])=>{
      map[k] = {...v, isIndex:true}
    })
    // stocks
    Object.entries(stocks||{}).forEach(([k,v])=>{
      if(!map[k]) map[k] = {...v, isIndex:false}
    })
    return Object.values(map)
  }, [indices, stocks])

  const listItems = useMemo(() => {
    let arr = allItems
    if(subTab==='Indices') arr = arr.filter(x=>x.isIndex)
    else if(subTab==='Gainers') arr = (gainers||[]).length ? gainers : arr.filter(x=>(x.changePct??0)>0)
    else if(subTab==='Losers') arr = (losers||[]).length ? losers : arr.filter(x=>(x.changePct??0)<0)
    if(search.trim()) {
      const q = search.toLowerCase()
      arr = arr.filter(x=>(x.symbol||x.name||'').toLowerCase().includes(q))
    }
    return arr.slice(0,80)
  }, [allItems, subTab, search, gainers, losers])

  const selData = selected
    ? (allItems.find(x=>x.symbol===selected) || (gainers||[]).find(x=>x.symbol===selected) || (losers||[]).find(x=>x.symbol===selected))
    : null

  // top gainers/losers for right panel when nothing selected
  const topG = useMemo(()=>(gainers||[]).slice(0,5),[gainers])
  const topL = useMemo(()=>(losers||[]).slice(0,5),[losers])

  return (
    <div>
      {/* Index strip cards */}
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:20}}>
        {INDEX_STRIP_KEYS.map(({key,label})=>{
          const d = (indices||{})[key]||{}
          const pct = d.changePct??0
          const isHl = highlightedIndex===key
          return (
            <button key={key} onClick={()=>setHighlightedIndex(isHl?null:key)} style={{
              flex:'1 1 140px',minWidth:130,padding:'12px 14px',borderRadius:10,
              background:isHl?T.blueBg:T.white, border:`1.5px solid ${isHl?T.blue:T.border}`,
              textAlign:'left',cursor:'pointer',transition:'all .15s',
            }}>
              <div style={{fontSize:10.5,color:T.textMute,fontWeight:600,letterSpacing:.4}}>{label}</div>
              <div style={{fontSize:16.5,fontWeight:800,color:T.text,margin:'3px 0'}}>{d.price?fmt(d.price):'—'}</div>
              <div style={{fontSize:11.5,fontWeight:700,color:chgColor(pct),display:'flex',alignItems:'center',gap:2}}>
                <ChgArrow v={pct} sz={11}/>{pos(pct)?'+':''}{fmt(pct)}%
              </div>
            </button>
          )
        })}
      </div>

      {/* Two-column layout */}
      <div style={{display:'flex',gap:16,alignItems:'flex-start'}}>
        {/* LEFT panel */}
        <div style={{width:380,flexShrink:0,background:T.white,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden'}}>
          {/* sub-tabs */}
          <div style={{display:'flex',borderBottom:`1px solid ${T.border}`}}>
            {['All','Gainers','Losers','Indices'].map(t=>(
              <button key={t} onClick={()=>setSubTab(t)} style={{
                flex:1,padding:'9px 0',border:'none',background:'none',cursor:'pointer',
                fontSize:12,fontWeight:subTab===t?700:500,
                color:subTab===t?T.blue:T.textSub,
                borderBottom:subTab===t?`2px solid ${T.blue}`:'2px solid transparent',
              }}>{t}</button>
            ))}
          </div>
          {/* search */}
          <div style={{padding:'10px 12px',borderBottom:`1px solid ${T.border2}`}}>
            <div style={{display:'flex',alignItems:'center',gap:6,background:T.bg,borderRadius:7,padding:'6px 10px'}}>
              <Search size={13} color={T.textMute}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search symbol…"
                style={{border:'none',background:'none',outline:'none',fontSize:12.5,color:T.text,width:'100%'}}/>
              {search && <button onClick={()=>setSearch('')} style={{border:'none',background:'none',cursor:'pointer'}}><X size={12} color={T.textMute}/></button>}
            </div>
          </div>
          {/* list */}
          <div style={{maxHeight:480,overflowY:'auto'}}>
            {listItems.length===0 && <div style={{padding:20,textAlign:'center',color:T.textMute,fontSize:13}}>No results</div>}
            {listItems.map((item,i)=>{
              const pct = item.changePct??0
              const label = SYMBOL_LABELS[item.symbol]||item.symbol||item.name||'—'
              const isSel = selected===item.symbol
              return (
                <div key={item.symbol||i} onClick={()=>setSelected(isSel?null:item.symbol)} style={{
                  display:'flex',alignItems:'center',padding:'9px 14px',cursor:'pointer',
                  background:isSel?T.blueBg:T.white,borderBottom:`1px solid ${T.border2}`,
                  transition:'background .1s',
                }}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{label}</div>
                    <div style={{fontSize:11,color:T.textMute}}>{item.isIndex?'Index':'NSE'}</div>
                  </div>
                  <div style={{textAlign:'right',marginLeft:8}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{item.price?fmt(item.price):'—'}</div>
                    <div style={{fontSize:11.5,fontWeight:700,color:chgColor(pct),display:'flex',alignItems:'center',justifyContent:'flex-end',gap:2}}>
                      <ChgArrow v={pct} sz={10}/>{pos(pct)?'+':''}{fmt(pct)}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT panel */}
        <div style={{flex:1,minWidth:0}}>
          {selData ? (
            <div style={{background:T.white,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
                <div>
                  <div style={{fontSize:11,color:T.textMute,fontWeight:600,letterSpacing:.5,textTransform:'uppercase'}}>{selData.isIndex?'Index':'NSE Equity'}</div>
                  <div style={{fontSize:22,fontWeight:800,color:T.text,marginTop:2}}>{SYMBOL_LABELS[selData.symbol]||selData.symbol}</div>
                </div>
                <button onClick={()=>setSelected(null)} style={{border:'none',background:T.bg,borderRadius:6,padding:'4px 8px',cursor:'pointer'}}><X size={14} color={T.textMute}/></button>
              </div>
              <div style={{display:'flex',alignItems:'baseline',gap:12,marginBottom:8}}>
                <span style={{fontSize:32,fontWeight:800,color:T.text}}>₹{fmt(selData.price)}</span>
                <span style={{fontSize:15,fontWeight:700,color:chgColor(selData.changePct),display:'flex',alignItems:'center',gap:3}}>
                  <ChgArrow v={selData.changePct}/>{pos(selData.changePct)?'+':''}{fmt(selData.change)} ({pos(selData.changePct)?'+':''}{fmt(selData.changePct)}%)
                </span>
              </div>
              <StatGrid rows={[
                ['Open',selData.open?`₹${fmt(selData.open)}`:'—'],
                ['High',selData.high?`₹${fmt(selData.high)}`:'—'],
                ['Low',selData.low?`₹${fmt(selData.low)}`:'—'],
                ['Prev Close',selData.prevClose?`₹${fmt(selData.prevClose)}`:'—'],
                ['Volume',fmtV(selData.volume)],
                ['52W High',selData.yearHigh?`₹${fmt(selData.yearHigh)}`:'—'],
                ['52W Low',selData.yearLow?`₹${fmt(selData.yearLow)}`:'—'],
                ['Updated',selData.updatedAt?fmtT(selData.updatedAt):'—'],
              ]}/>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              {/* Top Gainers */}
              <div style={{background:T.white,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden'}}>
                <div style={{padding:'12px 16px',borderBottom:`1px solid ${T.border2}`,display:'flex',alignItems:'center',gap:6}}>
                  <TrendingUp size={15} color={T.green}/>
                  <span style={{fontSize:13,fontWeight:700,color:T.text}}>Top Gainers</span>
                </div>
                {topG.map((s,i)=>{
                  const pct=s.changePct??0
                  return (
                    <div key={s.symbol||i} onClick={()=>setSelected(s.symbol)} style={{display:'flex',alignItems:'center',padding:'9px 16px',borderBottom:`1px solid ${T.border2}`,cursor:'pointer'}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:T.text}}>{SYMBOL_LABELS[s.symbol]||s.symbol}</div>
                        <div style={{fontSize:11,color:T.textMute}}>{s.price?`₹${fmt(s.price)}`:'—'}</div>
                      </div>
                      <div style={{background:T.greenBg,color:T.green,padding:'3px 8px',borderRadius:6,fontSize:12,fontWeight:700}}>+{fmt(pct)}%</div>
                    </div>
                  )
                })}
                {topG.length===0 && <div style={{padding:14,textAlign:'center',color:T.textMute,fontSize:12}}>Loading…</div>}
              </div>
              {/* Top Losers */}
              <div style={{background:T.white,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden'}}>
                <div style={{padding:'12px 16px',borderBottom:`1px solid ${T.border2}`,display:'flex',alignItems:'center',gap:6}}>
                  <TrendingDown size={15} color={T.red}/>
                  <span style={{fontSize:13,fontWeight:700,color:T.text}}>Top Losers</span>
                </div>
                {topL.map((s,i)=>{
                  const pct=s.changePct??0
                  return (
                    <div key={s.symbol||i} onClick={()=>setSelected(s.symbol)} style={{display:'flex',alignItems:'center',padding:'9px 16px',borderBottom:`1px solid ${T.border2}`,cursor:'pointer'}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:T.text}}>{SYMBOL_LABELS[s.symbol]||s.symbol}</div>
                        <div style={{fontSize:11,color:T.textMute}}>{s.price?`₹${fmt(s.price)}`:'—'}</div>
                      </div>
                      <div style={{background:T.redBg,color:T.red,padding:'3px 8px',borderRadius:6,fontSize:12,fontWeight:700}}>{fmt(pct)}%</div>
                    </div>
                  )
                })}
                {topL.length===0 && <div style={{padding:14,textAlign:'center',color:T.textMute,fontSize:12}}>Loading…</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   TAB 2 — SCREENER
══════════════════════════════════════════════════════════ */
function ScreenerTab() {
  const [view, setView] = useState('collections') // 'collections' | 'screener'
  const [filters, setFilters] = useState(INIT_FILTERS)
  const [sort, setSort] = useState({col:'mcap',dir:'desc'})
  const [bookmarks, setBookmarks] = useState(new Set())
  const [resSearch, setResSearch] = useState('')

  const setF = (k,v) => setFilters(f=>({...f,[k]:v}))
  const reset = () => { setFilters(INIT_FILTERS); setResSearch('') }

  const openPreset = (preset) => {
    setFilters({...INIT_FILTERS, ...preset.filters})
    setView('screener')
  }

  const activeFCount = useMemo(() => {
    return Object.entries(filters).filter(([k,v])=> k!=='search' && v!=='' && v!=='All').length
  }, [filters])

  const filtered = useMemo(() => {
    let arr = [...STOCKS]
    const n = (k) => { const v=parseFloat(filters[k]); return isNaN(v)?null:v }

    if(filters.cat && filters.cat!=='All') arr=arr.filter(x=>x.cat===filters.cat)
    if(filters.sector && filters.sector!=='All') arr=arr.filter(x=>x.sector===filters.sector)
    if(n('priceMin')!=null) arr=arr.filter(x=>x.price>=n('priceMin'))
    if(n('priceMax')!=null) arr=arr.filter(x=>x.price<=n('priceMax'))
    if(n('mcapMin')!=null) arr=arr.filter(x=>x.mcap>=n('mcapMin')*1000)
    if(n('mcapMax')!=null) arr=arr.filter(x=>x.mcap<=n('mcapMax')*1000)
    if(n('peMin')!=null) arr=arr.filter(x=>x.pe>=n('peMin'))
    if(n('peMax')!=null) arr=arr.filter(x=>x.pe<=n('peMax'))
    if(n('pbMin')!=null) arr=arr.filter(x=>x.pb>=n('pbMin'))
    if(n('pbMax')!=null) arr=arr.filter(x=>x.pb<=n('pbMax'))
    if(n('peg')!=null) arr=arr.filter(x=>x.peg&&x.peg<=n('peg'))
    if(n('evEbitda')!=null) arr=arr.filter(x=>x.evEbitda&&x.evEbitda<=n('evEbitda'))
    if(n('roeMin')!=null) arr=arr.filter(x=>x.roe>=n('roeMin'))
    if(n('roeMax')!=null) arr=arr.filter(x=>x.roe<=n('roeMax'))
    if(n('roceMin')!=null) arr=arr.filter(x=>x.roce>=n('roceMin'))
    if(n('roceMax')!=null) arr=arr.filter(x=>x.roce<=n('roceMax'))
    if(n('omMin')!=null) arr=arr.filter(x=>x.om>=n('omMin'))
    if(n('nmMin')!=null) arr=arr.filter(x=>x.nm>=n('nmMin'))
    if(n('deMax')!=null) arr=arr.filter(x=>x.de<=n('deMax'))
    if(n('crMin')!=null) arr=arr.filter(x=>x.cr&&x.cr>=n('crMin'))
    if(n('dyMin')!=null) arr=arr.filter(x=>x.dy>=n('dyMin'))
    if(n('g1Min')!=null) arr=arr.filter(x=>x.g1>=n('g1Min'))
    if(n('g3Min')!=null) arr=arr.filter(x=>x.g3>=n('g3Min'))
    if(n('g5Min')!=null) arr=arr.filter(x=>x.g5>=n('g5Min'))
    if(n('egMin')!=null) arr=arr.filter(x=>x.eg>=n('egMin'))
    if(n('pgMin')!=null) arr=arr.filter(x=>x.pg>=n('pgMin'))
    if(n('phMin')!=null) arr=arr.filter(x=>x.ph>=n('phMin'))
    if(n('phMax')!=null) arr=arr.filter(x=>x.ph<=n('phMax'))
    if(n('pledgeMax')!=null) arr=arr.filter(x=>x.pledge<=n('pledgeMax'))
    if(n('fiiMin')!=null) arr=arr.filter(x=>x.fi>=n('fiiMin'))
    if(n('diiMin')!=null) arr=arr.filter(x=>x.dii>=n('diiMin'))
    if(n('volMin')!=null) arr=arr.filter(x=>x.vol>=n('volMin')*1000)
    if(n('betaMin')!=null) arr=arr.filter(x=>x.beta>=n('betaMin'))
    if(n('betaMax')!=null) arr=arr.filter(x=>x.beta<=n('betaMax'))
    if(n('rsiMin')!=null) arr=arr.filter(x=>x.rsi>=n('rsiMin'))
    if(n('rsiMax')!=null) arr=arr.filter(x=>x.rsi<=n('rsiMax'))
    if(n('fcfMin')!=null) arr=arr.filter(x=>x.fcf&&x.fcf>=n('fcfMin')*10000000)
    if(n('wcMin')!=null) arr=arr.filter(x=>x.wc&&x.wc>=n('wcMin')*10000000)
    if(n('altmanMin')!=null) arr=arr.filter(x=>x.altman&&x.altman>=n('altmanMin'))
    if(n('shortIntMax')!=null) arr=arr.filter(x=>x.shortInt<=n('shortIntMax'))

    if(resSearch.trim()) {
      const q=resSearch.toLowerCase()
      arr=arr.filter(x=>x.sym.toLowerCase().includes(q)||x.name.toLowerCase().includes(q))
    }

    // sort
    arr.sort((a,b)=>{
      const av=a[sort.col]??-Infinity, bv=b[sort.col]??-Infinity
      return sort.dir==='asc'?av-bv:bv-av
    })
    return arr
  }, [filters, sort, resSearch])

  const toggleSort = (col) => setSort(s=>s.col===col?{col,dir:s.dir==='asc'?'desc':'asc'}:{col,dir:'desc'})
  const SortIcon = ({col}) => sort.col===col
    ? (sort.dir==='asc'?<ChevronUp size={11} color={T.blue}/>:<ChevronDown size={11} color={T.blue}/>)
    : <ChevronDown size={11} color={T.textMute}/>

  if(view==='collections') {
    return (
      <div>
        <div style={{marginBottom:20}}>
          <h2 style={{fontSize:18,fontWeight:800,color:T.text,margin:'0 0 4px'}}>Stock Collections</h2>
          <p style={{fontSize:13,color:T.textSub,margin:0}}>Curated filters based on popular investment themes — click any to explore.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
          {PRESETS.map(p=>(
            <button key={p.id} onClick={()=>openPreset(p)} style={{
              background:T.white,border:`1.5px solid ${T.border}`,borderRadius:12,
              padding:'18px 16px',textAlign:'left',cursor:'pointer',transition:'border-color .15s, box-shadow .15s',
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.blue;e.currentTarget.style.boxShadow='0 4px 16px rgba(21,101,192,.1)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow='none'}}>
              <div style={{fontSize:26,marginBottom:8}}>{p.emoji}</div>
              <div style={{fontSize:14.5,fontWeight:800,color:T.text,marginBottom:4}}>{p.name}</div>
              <div style={{fontSize:12,color:T.textSub,marginBottom:10,lineHeight:1.5}}>{p.desc}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:10}}>
                {p.tags.map(t=><Badge key={t} color={T.blue} bg={T.blueBg}>{t}</Badge>)}
              </div>
              <div style={{fontSize:11.5,color:T.textMute}}>👤 {p.users} investors</div>
            </button>
          ))}
        </div>
        <div style={{marginTop:20,textAlign:'center'}}>
          <button onClick={()=>setView('screener')} style={{
            padding:'10px 28px',background:T.blue,color:T.white,border:'none',borderRadius:8,
            fontSize:14,fontWeight:700,cursor:'pointer',
          }}>Open Full Screener →</button>
        </div>
      </div>
    )
  }

  /* ── SCREENER VIEW ── */
  return (
    <div style={{display:'flex',gap:0,alignItems:'flex-start'}}>
      {/* LEFT sidebar filters */}
      <div style={{width:248,flexShrink:0,background:T.white,borderRadius:12,border:`1px solid ${T.border}`,padding:'12px 14px',maxHeight:'80vh',overflowY:'auto'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <Filter size={13} color={T.blue}/>
            <span style={{fontSize:13,fontWeight:800,color:T.text}}>Filters</span>
            {activeFCount>0 && <Badge color={T.white} bg={T.blue}>{activeFCount}</Badge>}
          </div>
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>setView('collections')} style={{background:T.bg,border:'none',borderRadius:5,padding:'3px 7px',fontSize:11.5,color:T.textSub,cursor:'pointer'}}>Collections</button>
            <button onClick={reset} style={{background:T.redBg,border:'none',borderRadius:5,padding:'3px 7px',fontSize:11.5,color:T.red,cursor:'pointer'}}>Reset</button>
          </div>
        </div>

        <FilterSec title="Cap Category">
          <CapBtns value={filters.cat} onChange={setF}/>
        </FilterSec>

        <FilterSec title="Sector" defaultOpen={false}>
          <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:6}}>
            {['All',...SECTORS].map(s=>(
              <button key={s} onClick={()=>setF('sector',s)} style={{
                padding:'2px 8px',borderRadius:4,border:`1px solid ${filters.sector===s?T.blue:T.border}`,
                background:filters.sector===s?T.blueBg:T.white,color:filters.sector===s?T.blue:T.textSub,
                fontSize:11,fontWeight:filters.sector===s?700:400,cursor:'pointer',
              }}>{s}</button>
            ))}
          </div>
        </FilterSec>

        <FilterSec title="Price & Market Cap" defaultOpen={false}>
          <RangeRow label="Price (₹)" kMin="priceMin" kMax="priceMax" filters={filters} onChange={setF}/>
          <RangeRow label="Market Cap (₹ Cr, e.g. 50000)" kMin="mcapMin" kMax="mcapMax" filters={filters} onChange={setF}/>
        </FilterSec>

        <FilterSec title="Valuation" defaultOpen={false}>
          <RangeRow label="P/E Ratio" kMin="peMin" kMax="peMax" filters={filters} onChange={setF}/>
          <RangeRow label="P/B Ratio" kMin="pbMin" kMax="pbMax" filters={filters} onChange={setF}/>
          <MaxRow label="PEG Ratio (max)" k="peg" filters={filters} onChange={setF} placeholder="e.g. 2"/>
          <MaxRow label="EV/EBITDA (max)" k="evEbitda" filters={filters} onChange={setF} placeholder="e.g. 20"/>
        </FilterSec>

        <FilterSec title="Profitability" defaultOpen={false}>
          <RangeRow label="ROE (%)" kMin="roeMin" kMax="roeMax" filters={filters} onChange={setF}/>
          <RangeRow label="ROCE (%)" kMin="roceMin" kMax="roceMax" filters={filters} onChange={setF}/>
          <MinRow label="Operating Margin (% min)" k="omMin" filters={filters} onChange={setF}/>
          <MinRow label="Net Margin (% min)" k="nmMin" filters={filters} onChange={setF}/>
        </FilterSec>

        <FilterSec title="Financial Health" defaultOpen={false}>
          <MaxRow label="Debt/Equity (max)" k="deMax" filters={filters} onChange={setF} placeholder="e.g. 1"/>
          <MinRow label="Current Ratio (min)" k="crMin" filters={filters} onChange={setF} placeholder="e.g. 1.5"/>
        </FilterSec>

        <FilterSec title="Dividends" defaultOpen={false}>
          <MinRow label="Dividend Yield (% min)" k="dyMin" filters={filters} onChange={setF}/>
        </FilterSec>

        <FilterSec title="Revenue Growth" defaultOpen={false}>
          <MinRow label="1Y Growth (% min)" k="g1Min" filters={filters} onChange={setF}/>
          <MinRow label="3Y Growth (% min)" k="g3Min" filters={filters} onChange={setF}/>
          <MinRow label="5Y Growth (% min)" k="g5Min" filters={filters} onChange={setF}/>
        </FilterSec>

        <FilterSec title="EPS & Profit Growth" defaultOpen={false}>
          <MinRow label="EPS Growth (% min)" k="egMin" filters={filters} onChange={setF}/>
          <MinRow label="Profit Growth (% min)" k="pgMin" filters={filters} onChange={setF}/>
        </FilterSec>

        <FilterSec title="Ownership" defaultOpen={false}>
          <RangeRow label="Promoter Holding (%)" kMin="phMin" kMax="phMax" filters={filters} onChange={setF}/>
          <MaxRow label="Pledge (% max)" k="pledgeMax" filters={filters} onChange={setF} placeholder="e.g. 5"/>
          <MinRow label="FII Holding (% min)" k="fiiMin" filters={filters} onChange={setF}/>
          <MinRow label="DII Holding (% min)" k="diiMin" filters={filters} onChange={setF}/>
        </FilterSec>

        <FilterSec title="Volume & Beta" defaultOpen={false}>
          <MinRow label="Volume (K shares min)" k="volMin" filters={filters} onChange={setF}/>
          <RangeRow label="Beta" kMin="betaMin" kMax="betaMax" filters={filters} onChange={setF}/>
        </FilterSec>

        <FilterSec title="Technical Signals" defaultOpen={false}>
          <RangeRow label="RSI" kMin="rsiMin" kMax="rsiMax" filters={filters} onChange={setF}/>
          <span style={lbl}>MACD Signal</span>
          <div style={{display:'flex',gap:4,marginTop:4}}>
            {['All','Bullish','Bearish'].map(s=>(
              <button key={s} onClick={()=>setF('macd',s)} style={{
                flex:1,padding:'3px 0',borderRadius:4,border:`1px solid ${filters.macd===s?T.blue:T.border}`,
                background:filters.macd===s?T.blueBg:T.white,color:filters.macd===s?T.blue:T.textSub,
                fontSize:11.5,cursor:'pointer',
              }}>{s}</button>
            ))}
          </div>
          <span style={lbl}>SMA Signal</span>
          <div style={{display:'flex',gap:4,marginTop:4}}>
            {['All','Above 50','Above 200'].map(s=>(
              <button key={s} onClick={()=>setF('sma',s)} style={{
                flex:1,padding:'3px 0',borderRadius:4,border:`1px solid ${filters.sma===s?T.blue:T.border}`,
                background:filters.sma===s?T.blueBg:T.white,color:filters.sma===s?T.blue:T.textSub,
                fontSize:11,cursor:'pointer',
              }}>{s}</button>
            ))}
          </div>
        </FilterSec>

        <FilterSec title="Cash Flow & Risk" defaultOpen={false}>
          <MinRow label="FCF (₹ Cr min)" k="fcfMin" filters={filters} onChange={setF}/>
          <MinRow label="Working Capital (₹ Cr min)" k="wcMin" filters={filters} onChange={setF}/>
          <MinRow label="Altman Z-Score (min)" k="altmanMin" filters={filters} onChange={setF}/>
          <MaxRow label="Short Interest (% max)" k="shortIntMax" filters={filters} onChange={setF}/>
        </FilterSec>
      </div>

      {/* RIGHT results panel */}
      <div style={{flex:1,minWidth:0,marginLeft:16}}>
        {/* results header */}
        <div style={{background:T.white,borderRadius:12,border:`1px solid ${T.border}`,padding:'12px 16px',marginBottom:12,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
          <span style={{fontSize:14,fontWeight:700,color:T.text}}>{filtered.length} stocks</span>
          {activeFCount>0 && <Badge color={T.blue} bg={T.blueBg}>{activeFCount} filters active</Badge>}
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8,background:T.bg,borderRadius:7,padding:'6px 10px',minWidth:200}}>
            <Search size={13} color={T.textMute}/>
            <input value={resSearch} onChange={e=>setResSearch(e.target.value)} placeholder="Search results…"
              style={{border:'none',background:'none',outline:'none',fontSize:12.5,color:T.text,width:'100%'}}/>
          </div>
        </div>

        {/* table */}
        <div style={{background:T.white,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12.5}}>
              <thead>
                <tr style={{background:T.bg,borderBottom:`1px solid ${T.border}`}}>
                  <th style={{padding:'9px 12px',textAlign:'left',fontSize:11,color:T.textMute,fontWeight:700,whiteSpace:'nowrap'}}>#</th>
                  <th style={{padding:'9px 12px',textAlign:'left',fontSize:11,color:T.textMute,fontWeight:700,whiteSpace:'nowrap'}}>Company</th>
                  {[['mcap','Mkt Cap'],['price','Price'],['pe','PE'],['roe','ROE%'],['de','D/E'],['g3','3Y Gr%'],['dy','Div%'],['rsi','RSI']].map(([col,lab])=>(
                    <th key={col} onClick={()=>toggleSort(col)} style={{padding:'9px 12px',textAlign:'right',fontSize:11,color:sort.col===col?T.blue:T.textMute,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',userSelect:'none'}}>
                      <span style={{display:'inline-flex',alignItems:'center',gap:2}}>{lab}<SortIcon col={col}/></span>
                    </th>
                  ))}
                  <th style={{padding:'9px 12px',textAlign:'center',fontSize:11,color:T.textMute,fontWeight:700}}>★</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 && (
                  <tr><td colSpan={10} style={{padding:32,textAlign:'center',color:T.textMute}}>No stocks match the current filters.</td></tr>
                )}
                {filtered.map((s,i)=>{
                  const bm=bookmarks.has(s.sym)
                  const rsiBg = s.rsi>=70?T.redBg:s.rsi<=30?T.greenBg:T.bg
                  const rsiColor = s.rsi>=70?T.red:s.rsi<=30?T.green:T.textSub
                  return (
                    <tr key={s.sym} style={{borderBottom:`1px solid ${T.border2}`}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.bgHover}
                      onMouseLeave={e=>e.currentTarget.style.background=T.white}>
                      <td style={{padding:'9px 12px',color:T.textMute,fontSize:11.5}}>{i+1}</td>
                      <td style={{padding:'9px 12px'}}>
                        <div style={{fontWeight:700,color:T.text}}>{s.name}</div>
                        <div style={{fontSize:11,color:T.textMute}}>{s.sym} · {s.cat}</div>
                      </td>
                      <td style={{padding:'9px 12px',textAlign:'right',color:T.text,fontWeight:600}}>{s.mcap>=1e5?`${(s.mcap/1e5).toFixed(0)}K Cr`:`${s.mcap} Cr`}</td>
                      <td style={{padding:'9px 12px',textAlign:'right',fontWeight:700,color:T.text}}>₹{fmt(s.price)}</td>
                      <td style={{padding:'9px 12px',textAlign:'right',color:T.textSub}}>{s.pe??'—'}</td>
                      <td style={{padding:'9px 12px',textAlign:'right',color:s.roe>=20?T.green:T.textSub,fontWeight:s.roe>=20?700:400}}>{s.roe}%</td>
                      <td style={{padding:'9px 12px',textAlign:'right',color:s.de>1?T.red:T.textSub}}>{s.de}</td>
                      <td style={{padding:'9px 12px',textAlign:'right',color:s.g3>=20?T.green:s.g3<0?T.red:T.textSub,fontWeight:600}}>{s.g3>0?'+':''}{s.g3}%</td>
                      <td style={{padding:'9px 12px',textAlign:'right',color:T.textSub}}>{s.dy}%</td>
                      <td style={{padding:'9px 12px',textAlign:'right'}}>
                        <span style={{background:rsiBg,color:rsiColor,padding:'2px 7px',borderRadius:5,fontSize:11.5,fontWeight:700}}>{s.rsi}</span>
                      </td>
                      <td style={{padding:'9px 12px',textAlign:'center'}}>
                        <button onClick={()=>setBookmarks(prev=>{const n=new Set(prev);bm?n.delete(s.sym):n.add(s.sym);return n})}
                          style={{background:'none',border:'none',cursor:'pointer',padding:2}}>
                          {bm?<BookmarkCheck size={14} color={T.blue}/>:<Bookmark size={14} color={T.textMute}/>}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   TAB 3 — US STOCKS
══════════════════════════════════════════════════════════ */
const US_SECTORS = ['All','Technology','Finance','Healthcare','Consumer','Energy','Auto']

function USStocksTab() {
  const [sectorFilter, setSectorFilter] = useState('All')
  const [sort, setSort] = useState({col:'mcap',dir:'desc'})
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(()=>{
    let arr = [...US_STOCKS]
    if(sectorFilter!=='All') arr=arr.filter(x=>x.sector===sectorFilter)
    arr.sort((a,b)=>{
      let av=a[sort.col], bv=b[sort.col]
      // mcap is string like '3.48T', sort numerically
      if(sort.col==='mcap'){
        const parse=s=>s?parseFloat(s.replace('T','000').replace('B',''))||0:0
        av=parse(av); bv=parse(bv)
      }
      return sort.dir==='asc'?(av-bv):(bv-av)
    })
    return arr
  }, [sectorFilter, sort])

  const toggleSort = (col) => setSort(s=>s.col===col?{col,dir:s.dir==='asc'?'desc':'asc'}:{col,dir:'desc'})
  const SortIcon = ({col}) => sort.col===col
    ?(sort.dir==='asc'?<ChevronUp size={11} color={T.blue}/>:<ChevronDown size={11} color={T.blue}/>)
    :<ChevronDown size={11} color={T.textMute}/>

  const sel = selected ? US_STOCKS.find(x=>x.sym===selected) : null

  return (
    <div>
      {/* Header card */}
      <div style={{background:T.navy,borderRadius:12,padding:'16px 20px',marginBottom:16,display:'flex',alignItems:'center',flexWrap:'wrap',gap:12}}>
        <div style={{marginRight:'auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
            <Globe2 size={16} color='#90caf9'/>
            <span style={{fontSize:14,fontWeight:700,color:'#fff'}}>US Markets · NYSE &amp; NASDAQ</span>
          </div>
          <div style={{fontSize:11.5,color:'rgba(255,255,255,.55)'}}>USD/INR Rate: ₹{USD_INR}</div>
        </div>
        {[{name:'S&P 500',val:'5,864',chg:'+0.83%'},{name:'NASDAQ',val:'19,218',chg:'+1.24%'},{name:'DOW',val:'43,240',chg:'+0.41%'}].map(idx=>(
          <div key={idx.name} style={{background:'rgba(255,255,255,.08)',borderRadius:8,padding:'8px 14px',minWidth:110}}>
            <div style={{fontSize:10.5,color:'rgba(255,255,255,.55)',fontWeight:600,letterSpacing:.4}}>{idx.name}</div>
            <div style={{fontSize:16,fontWeight:800,color:'#fff',marginTop:1}}>{idx.val}</div>
            <div style={{fontSize:11.5,fontWeight:700,color:T.green}}>{idx.chg}</div>
          </div>
        ))}
      </div>

      {/* Sector filter */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
        {US_SECTORS.map(s=><Pill key={s} active={sectorFilter===s} onClick={()=>setSectorFilter(s)}>{s}</Pill>)}
      </div>

      <div style={{display:'flex',gap:16,alignItems:'flex-start'}}>
        {/* Table */}
        <div style={{flex:1,minWidth:0,background:T.white,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12.5}}>
              <thead>
                <tr style={{background:T.bg,borderBottom:`1px solid ${T.border}`}}>
                  <th style={{padding:'9px 14px',textAlign:'left',fontSize:11,color:T.textMute,fontWeight:700}}>Company</th>
                  {[['price','Price (USD)'],['chg','Change %'],['pe','PE'],['mcap','Mkt Cap']].map(([col,lab])=>(
                    <th key={col} onClick={()=>toggleSort(col)} style={{padding:'9px 12px',textAlign:'right',fontSize:11,color:sort.col===col?T.blue:T.textMute,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',userSelect:'none'}}>
                      <span style={{display:'inline-flex',alignItems:'center',gap:2}}>{lab}<SortIcon col={col}/></span>
                    </th>
                  ))}
                  <th style={{padding:'9px 12px',textAlign:'right',fontSize:11,color:T.textMute,fontWeight:700}}>INR Equiv</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s=>{
                  const isSel=selected===s.sym
                  return (
                    <tr key={s.sym} onClick={()=>setSelected(isSel?null:s.sym)}
                      style={{borderBottom:`1px solid ${T.border2}`,cursor:'pointer',background:isSel?T.blueBg:T.white}}
                      onMouseEnter={e=>!isSel&&(e.currentTarget.style.background=T.bgHover)}
                      onMouseLeave={e=>!isSel&&(e.currentTarget.style.background=T.white)}>
                      <td style={{padding:'9px 14px'}}>
                        <div style={{fontWeight:700,color:T.text,fontSize:13}}>{s.sym}</div>
                        <div style={{fontSize:11,color:T.textMute}}>{s.name}</div>
                      </td>
                      <td style={{padding:'9px 12px',textAlign:'right',fontWeight:700,color:T.text}}>${(s.price).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                      <td style={{padding:'9px 12px',textAlign:'right'}}>
                        <span style={{color:chgColor(s.chg),fontWeight:700,display:'inline-flex',alignItems:'center',gap:2}}>
                          <ChgArrow v={s.chg} sz={11}/>{s.chg>0?'+':''}{s.chg.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{padding:'9px 12px',textAlign:'right',color:T.textSub}}>{s.pe}</td>
                      <td style={{padding:'9px 12px',textAlign:'right',color:T.textSub}}>{s.mcap}</td>
                      <td style={{padding:'9px 12px',textAlign:'right',color:T.textSub,fontSize:11.5}}>₹{(s.price*USD_INR).toLocaleString('en-IN',{maximumFractionDigits:0})}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {sel && (
          <div style={{width:260,flexShrink:0,background:T.white,borderRadius:12,border:`1px solid ${T.border}`,padding:18}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:T.text}}>{sel.sym}</div>
                <div style={{fontSize:11.5,color:T.textMute}}>{sel.name}</div>
              </div>
              <button onClick={()=>setSelected(null)} style={{border:'none',background:T.bg,borderRadius:5,padding:'3px 6px',cursor:'pointer'}}><X size={13} color={T.textMute}/></button>
            </div>
            <div style={{fontSize:26,fontWeight:800,color:T.text,marginBottom:4}}>${sel.price.toFixed(2)}</div>
            <div style={{fontSize:13,fontWeight:700,color:chgColor(sel.chg),display:'flex',alignItems:'center',gap:3,marginBottom:12}}>
              <ChgArrow v={sel.chg}/>{sel.chg>0?'+':''}{sel.chg.toFixed(2)}%
            </div>
            <StatGrid rows={[
              ['Sector',sel.sector],
              ['Mkt Cap',sel.mcap],
              ['P/E Ratio',sel.pe],
              ['INR Equiv',`₹${(sel.price*USD_INR).toLocaleString('en-IN',{maximumFractionDigits:0})}`],
              ['USD Rate',`₹${USD_INR}`],
            ]}/>
            <div style={{marginTop:12,padding:'8px 10px',background:T.blueBg,borderRadius:6,fontSize:11.5,color:T.blue}}>
              USD/INR: <b>₹{USD_INR}</b> · Indicative value
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   TAB 4 — GOLD & COMMODITIES
══════════════════════════════════════════════════════════ */
const GOLD_CARDS = [
  {label:'Gold 24K',inr:'₹98,450/10g',chg:'+0.84%',usd:'$3,380/oz',chgPos:true},
  {label:'Gold 22K',inr:'₹90,280/10g',chg:'+0.82%',usd:null,chgPos:true},
  {label:'Gold 18K',inr:'₹73,840/10g',chg:'+0.81%',usd:null,chgPos:true},
]
const COMMODITIES = [
  {name:'Silver',inr:'₹1,095/kg',chg:'+1.24%',usd:'$37.8/oz',pos:true},
  {name:'Crude Oil (WTI)',inr:'₹6,890/bbl',chg:'-0.62%',usd:'$83.6/bbl',pos:false},
  {name:'Natural Gas',inr:'₹242/MMBtu',chg:'+2.18%',usd:'$2.94/MMBtu',pos:true},
  {name:'Copper',inr:'₹890/kg',chg:'+0.46%',usd:'$10.8/kg',pos:true},
  {name:'Platinum',inr:'₹82,400/10g',chg:'-0.28%',usd:'$1,004/oz',pos:false},
]
const MCX_FUTURES = [
  {name:'Gold MCX Feb',price:'₹98,720',chg:'+0.91%',expiry:'28 Feb 2025',pos:true},
  {name:'Silver MCX Mar',price:'₹1,108',chg:'+1.38%',expiry:'05 Mar 2025',pos:true},
  {name:'Crude Oil MCX Feb',price:'₹6,912',chg:'-0.54%',expiry:'20 Feb 2025',pos:false},
]

function GoldCommoditiesTab() {
  return (
    <div>
      {/* Gold banner */}
      <div style={{
        background:'linear-gradient(135deg, #7b5200 0%, #c7920a 50%, #f4c430 100%)',
        borderRadius:14,padding:'22px 24px',marginBottom:20,
        display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,
      }}>
        <div>
          <div style={{fontSize:11.5,color:'rgba(255,255,255,.75)',fontWeight:600,letterSpacing:.6,marginBottom:4}}>GOLD 24 KARAT · MCX SPOT</div>
          <div style={{fontSize:32,fontWeight:900,color:'#fff'}}>₹98,450<span style={{fontSize:16,fontWeight:500}}>/10g</span></div>
          <div style={{fontSize:14,fontWeight:700,color:'rgba(255,255,255,.9)',marginTop:4}}>+₹820 (+0.84%) today</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:11.5,color:'rgba(255,255,255,.65)',marginBottom:4}}>International Gold Price</div>
          <div style={{fontSize:22,fontWeight:800,color:'#fff'}}>$3,380<span style={{fontSize:13,fontWeight:500}}>/oz</span></div>
          <div style={{fontSize:11.5,color:'rgba(255,255,255,.65)',marginTop:2}}>52W High: ₹1,02,400 · Low: ₹68,200</div>
        </div>
      </div>

      {/* Gold cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12,marginBottom:20}}>
        {GOLD_CARDS.map(g=>(
          <div key={g.label} style={{background:T.goldBg,border:`1.5px solid ${T.gold}30`,borderRadius:10,padding:'14px 16px'}}>
            <div style={{fontSize:11.5,color:T.gold,fontWeight:700,letterSpacing:.4}}>{g.label}</div>
            <div style={{fontSize:20,fontWeight:800,color:T.text,margin:'6px 0 2px'}}>{g.inr}</div>
            <div style={{fontSize:12.5,fontWeight:700,color:T.green}}>{g.chg}</div>
            {g.usd && <div style={{fontSize:11.5,color:T.textMute,marginTop:4}}>{g.usd}</div>}
          </div>
        ))}
      </div>

      {/* Commodities table */}
      <div style={{background:T.white,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden',marginBottom:20}}>
        <div style={{padding:'12px 16px',borderBottom:`1px solid ${T.border2}`,display:'flex',alignItems:'center',gap:6}}>
          <BarChart2 size={15} color={T.blue}/>
          <span style={{fontSize:13.5,fontWeight:800,color:T.text}}>Commodities</span>
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:T.bg,borderBottom:`1px solid ${T.border}`}}>
              {['Commodity','Price (INR)','Change','Intl. Price'].map(h=>(
                <th key={h} style={{padding:'9px 16px',textAlign:h==='Commodity'?'left':'right',fontSize:11,color:T.textMute,fontWeight:700}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMMODITIES.map(c=>(
              <tr key={c.name} style={{borderBottom:`1px solid ${T.border2}`}}>
                <td style={{padding:'11px 16px',fontWeight:700,color:T.text}}>{c.name}</td>
                <td style={{padding:'11px 16px',textAlign:'right',fontWeight:700,color:T.text}}>{c.inr}</td>
                <td style={{padding:'11px 16px',textAlign:'right'}}>
                  <span style={{color:c.pos?T.green:T.red,fontWeight:700}}>{c.chg}</span>
                </td>
                <td style={{padding:'11px 16px',textAlign:'right',color:T.textSub}}>{c.usd}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MCX Futures */}
      <div style={{background:T.white,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden'}}>
        <div style={{padding:'12px 16px',borderBottom:`1px solid ${T.border2}`,display:'flex',alignItems:'center',gap:6}}>
          <Clock size={15} color={T.blue}/>
          <span style={{fontSize:13.5,fontWeight:800,color:T.text}}>MCX Futures</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:0}}>
          {MCX_FUTURES.map((f,i)=>(
            <div key={f.name} style={{padding:'14px 16px',borderRight:i<MCX_FUTURES.length-1?`1px solid ${T.border2}`:'none'}}>
              <div style={{fontSize:11.5,color:T.textMute,fontWeight:600,marginBottom:4}}>{f.name}</div>
              <div style={{fontSize:18,fontWeight:800,color:T.text}}>{f.price}</div>
              <div style={{fontSize:12.5,fontWeight:700,color:f.pos?T.green:T.red,marginTop:2}}>{f.chg}</div>
              <div style={{display:'flex',alignItems:'center',gap:4,marginTop:6}}>
                <Clock size={10} color={T.textMute}/>
                <span style={{fontSize:11,color:T.textMute}}>Expiry: {f.expiry}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   TAB 5 — NEWS
══════════════════════════════════════════════════════════ */
const TICKER_HEADLINES = [
  'NIFTY 50 at 24,650 — FIIs net buyers for 5th consecutive day',
  'RBI keeps repo rate at 6.5% — GDP forecast raised to 7.2%',
  'RELIANCE Q1 profit +18% — beats estimates',
  'Gold hits all-time high ₹98,450/10g on global uncertainty',
  'TCS bags $2.1B deal from European financial major',
  'Sensex crosses 84,000 — first time in 3 months',
]
const TRENDING_STOCKS = [
  {sym:'RELIANCE',sentiment:'bullish'},{sym:'TCS',sentiment:'bullish'},
  {sym:'INFY',sentiment:'bearish'},{sym:'HDFCBANK',sentiment:'bullish'},{sym:'ADANIENT',sentiment:'bullish'},
]

function NewsTab() {
  const [catFilter, setCatFilter] = useState('All')
  const [newsSearch, setNewsSearch] = useState('')

  const filteredNews = useMemo(()=>{
    let arr=NEWS
    if(catFilter!=='All') arr=arr.filter(n=>n.cat===catFilter)
    if(newsSearch.trim()){
      const q=newsSearch.toLowerCase()
      arr=arr.filter(n=>n.title.toLowerCase().includes(q)||n.source.toLowerCase().includes(q)||n.cat.toLowerCase().includes(q))
    }
    return arr
  }, [catFilter, newsSearch])

  const sentimentCount = useMemo(()=>{
    const c={positive:0,negative:0,neutral:0}
    NEWS.forEach(n=>{ if(c[n.sentiment]!==undefined) c[n.sentiment]++ })
    return c
  }, [])

  return (
    <div>
      {/* Live ticker banner */}
      <div style={{background:T.navy,borderRadius:10,padding:'0',marginBottom:16,overflow:'hidden',display:'flex',alignItems:'stretch'}}>
        <div style={{background:'#e53935',padding:'0 14px',display:'flex',alignItems:'center',flexShrink:0}}>
          <span style={{color:'#fff',fontSize:10.5,fontWeight:800,letterSpacing:1}}>● LIVE</span>
        </div>
        <div style={{flex:1,overflow:'hidden',padding:'10px 0'}}>
          <div style={{display:'flex',gap:0,animation:'marqueeScroll 40s linear infinite',whiteSpace:'nowrap'}}>
            {[...TICKER_HEADLINES,...TICKER_HEADLINES].map((h,i)=>(
              <span key={i} style={{color:'rgba(255,255,255,.85)',fontSize:12.5,paddingRight:48,flexShrink:0}}>{h}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Category filters + search */}
      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:16}}>
        <div style={{display:'flex',gap:5,flexWrap:'wrap',flex:1}}>
          {NEWS_CATS.map(c=><Pill key={c} active={catFilter===c} onClick={()=>setCatFilter(c)}>{c}</Pill>)}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,background:T.white,border:`1px solid ${T.border}`,borderRadius:8,padding:'6px 10px',minWidth:200}}>
          <Search size={13} color={T.textMute}/>
          <input value={newsSearch} onChange={e=>setNewsSearch(e.target.value)} placeholder="Search news…"
            style={{border:'none',background:'none',outline:'none',fontSize:12.5,color:T.text,width:'100%'}}/>
          {newsSearch&&<button onClick={()=>setNewsSearch('')} style={{border:'none',background:'none',cursor:'pointer'}}><X size={12} color={T.textMute}/></button>}
        </div>
      </div>

      <div style={{display:'flex',gap:16,alignItems:'flex-start'}}>
        {/* News cards */}
        <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:10}}>
          {filteredNews.length===0&&<div style={{padding:32,textAlign:'center',color:T.textMute,background:T.white,borderRadius:10}}>No news found.</div>}
          {filteredNews.map(n=>(
            <div key={n.id} style={{
              background:T.white,borderRadius:10,border:`1px solid ${T.border}`,
              padding:'14px 16px',cursor:'pointer',transition:'box-shadow .15s',
            }}
            onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,.07)'}
            onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <Badge color={T.blue} bg={T.blueBg}>{n.cat}</Badge>
                <span style={{width:7,height:7,borderRadius:'50%',background:SENTIMENT_DOT[n.sentiment],display:'inline-block',flexShrink:0}}/>
                <span style={{fontSize:11.5,color:n.sentiment==='positive'?T.green:n.sentiment==='negative'?T.red:T.gold,fontWeight:600,textTransform:'capitalize'}}>{n.sentiment}</span>
                <span style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4,fontSize:11.5,color:T.textMute}}>
                  <Clock size={10} color={T.textMute}/>{n.time}
                </span>
              </div>
              <div style={{fontSize:14,fontWeight:700,color:T.text,lineHeight:1.5,marginBottom:6}}>{n.title}</div>
              <div style={{fontSize:11.5,color:T.textMute,fontWeight:600}}>{n.source}</div>
            </div>
          ))}
        </div>

        {/* Right sidebar */}
        <div style={{width:220,flexShrink:0,display:'flex',flexDirection:'column',gap:12}}>
          {/* Market Sentiment */}
          <div style={{background:T.white,borderRadius:10,border:`1px solid ${T.border}`,padding:'14px 16px'}}>
            <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:12}}>Market Sentiment</div>
            {[['Bullish',sentimentCount.positive,T.green,T.greenBg],['Bearish',sentimentCount.negative,T.red,T.redBg],['Neutral',sentimentCount.neutral,T.gold,T.goldBg]].map(([label,count,color,bg])=>(
              <div key={label} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <div style={{width:32,height:32,borderRadius:8,background:bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <span style={{fontSize:16,fontWeight:900,color}}>{count}</span>
                </div>
                <div>
                  <div style={{fontSize:12.5,fontWeight:700,color:T.text}}>{label}</div>
                  <div style={{fontSize:11,color:T.textMute}}>{count} article{count!==1?'s':''}</div>
                </div>
              </div>
            ))}
            {/* simple bar */}
            <div style={{marginTop:10,height:6,borderRadius:4,background:T.border,overflow:'hidden',display:'flex'}}>
              <div style={{width:`${(sentimentCount.positive/NEWS.length)*100}%`,background:T.green}}/>
              <div style={{width:`${(sentimentCount.neutral/NEWS.length)*100}%`,background:T.gold}}/>
              <div style={{width:`${(sentimentCount.negative/NEWS.length)*100}%`,background:T.red}}/>
            </div>
          </div>

          {/* Trending Stocks */}
          <div style={{background:T.white,borderRadius:10,border:`1px solid ${T.border}`,padding:'14px 16px'}}>
            <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:10}}>Trending Stocks</div>
            {TRENDING_STOCKS.map(s=>(
              <div key={s.sym} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${T.border2}`}}>
                <span style={{fontSize:13,fontWeight:700,color:T.text}}>{s.sym}</span>
                <span style={{
                  padding:'2px 8px',borderRadius:5,fontSize:11,fontWeight:700,
                  background:s.sentiment==='bullish'?T.greenBg:T.redBg,
                  color:s.sentiment==='bullish'?T.green:T.red,
                }}>{s.sentiment==='bullish'?'▲ Bullish':'▼ Bearish'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT — MarketPage
══════════════════════════════════════════════════════════ */
const TABS = [
  {id:'markets',   label:'Markets',          icon:<Layers size={14}/>},
  {id:'screener',  label:'Screener',         icon:<Filter size={14}/>},
  {id:'us',        label:'US Stocks',        icon:<Globe2 size={14}/>},
  {id:'gold',      label:'Gold & Commodities',icon:<BarChart2 size={14}/>},
  {id:'news',      label:'News',             icon:<Newspaper size={14}/>},
]

const TOP_INDICES = [
  {key:'NIFTY 50',label:'NIFTY 50'},
  {key:'NIFTY BANK',label:'BANK NIFTY'},
  {key:'INDIA VIX',label:'VIX'},
  {key:'NIFTY IT',label:'NIFTY IT'},
  {key:'SENSEX',label:'SENSEX'},
]

export default function MarketPage({ defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab || 'markets')
  const { indices, stocks, gainers, losers, loading, lastUpdated, refresh } = useMarketData()

  // Sync if defaultTab changes (e.g. navigating from sidebar)
  React.useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab)
  }, [defaultTab])

  return (
    <div style={{fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',minHeight:'100vh',background:T.bg}}>

      {/* Sticky top index strip */}
      <div style={{
        position:'sticky',top:0,zIndex:100,background:T.white,
        borderBottom:`1px solid ${T.border}`,padding:'0 24px',
        display:'flex',alignItems:'center',gap:0,overflowX:'auto',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:0,flex:1,overflowX:'auto'}}>
          {TOP_INDICES.map(({key,label})=>{
            const d=(indices||{})[key]||{}
            const pct=d.changePct??0
            return (
              <div key={key} style={{
                padding:'10px 18px',borderRight:`1px solid ${T.border2}`,
                flexShrink:0,minWidth:120,
              }}>
                <div style={{fontSize:10,color:T.textMute,fontWeight:700,letterSpacing:.5,marginBottom:2,textTransform:'uppercase'}}>{label}</div>
                <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                  <span style={{fontSize:14,fontWeight:800,color:T.text}}>{d.price?fmt(d.price):'—'}</span>
                  <span style={{fontSize:11.5,fontWeight:700,color:chgColor(pct),display:'inline-flex',alignItems:'center',gap:1}}>
                    <ChgArrow v={pct} sz={10}/>{pos(pct)?'+':''}{fmt(pct)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,paddingLeft:16,flexShrink:0}}>
          <div style={{fontSize:11.5,color:T.textMute,display:'flex',alignItems:'center',gap:4}}>
            <Clock size={11} color={T.textMute}/>{fmtT(lastUpdated)}
          </div>
          <button onClick={refresh} disabled={loading} style={{
            display:'flex',alignItems:'center',gap:5,padding:'5px 12px',
            background:loading?T.bg:T.blueBg,color:T.blue,
            border:`1px solid ${T.blue}30`,borderRadius:6,cursor:loading?'not-allowed':'pointer',
            fontSize:12,fontWeight:700,
          }}>
            <RefreshCw size={12} style={{animation:loading?'spin 1s linear infinite':'none'}}/>
            {loading?'Updating…':'Refresh'}
          </button>
        </div>
      </div>

      {/* Page header + tabs */}
      <div style={{background:T.white,borderBottom:`1px solid ${T.border}`,padding:'0 24px'}}>
        <div style={{paddingTop:16,paddingBottom:0,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:900,color:T.text,margin:0,letterSpacing:-.3}}>Markets</h1>
            <div style={{fontSize:12.5,color:T.textSub,marginTop:2,display:'flex',alignItems:'center',gap:8}}>
              NSE India · Live data
              <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:20,background:loading?T.goldBg:T.greenBg}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:loading?T.gold:T.green,animation:loading?'spin 1s linear infinite':'none'}}/>
                <span style={{fontSize:11,fontWeight:700,color:loading?T.gold:T.green}}>{loading?'Updating':'Live'}</span>
              </span>
            </div>
          </div>
        </div>
        {/* Tab bar */}
        <div style={{display:'flex',gap:0,marginTop:12,overflowX:'auto'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
              display:'flex',alignItems:'center',gap:6,padding:'10px 18px',
              border:'none',background:'none',cursor:'pointer',
              fontSize:13,fontWeight:activeTab===t.id?700:500,
              color:activeTab===t.id?T.blue:T.textSub,
              borderBottom:activeTab===t.id?`2.5px solid ${T.blue}`:'2.5px solid transparent',
              whiteSpace:'nowrap',transition:'color .15s',
            }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div style={{padding:24}}>
        {activeTab==='markets'  && <MarketsTab indices={indices} stocks={stocks} gainers={gainers} losers={losers}/>}
        {activeTab==='screener' && <ScreenerTab/>}
        {activeTab==='us'       && <USStocksTab/>}
        {activeTab==='gold'     && <GoldCommoditiesTab/>}
        {activeTab==='news'     && <NewsTab/>}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        *::-webkit-scrollbar { width: 5px; height: 5px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
      `}</style>
    </div>
  )
}

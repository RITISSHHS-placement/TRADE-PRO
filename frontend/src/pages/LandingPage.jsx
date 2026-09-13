import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { QRCodeSVG } from 'qrcode.react'
import {
  TrendingUp, ArrowUpRight, ArrowDownRight, Search, ChevronDown,
  ChevronRight, Minus, Plus, Zap, Shield, BarChart3, PieChart,
  Activity, Briefcase, Globe, Star, Sun, Moon, Download, Smartphone,
} from 'lucide-react'
import { toggleTheme } from '../store/slices/uiSlice'
import { SYMBOL_LABELS } from '../services/marketData'
import styles from './LandingPage.module.css'
import { motion } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════
   STATIC DATA
═══════════════════════════════════════════════════════════ */
const TICKER_ITEMS = [
  { sym:'NIFTY 50', price:'24,856.80', chg:'+0.05%', up:true },
  { sym:'NIFTY BANK', price:'57,098.95', chg:'+0.18%', up:true },
  { sym:'SENSEX', price:'76,042.44', chg:'+1.06%', up:true },
  { sym:'RELIANCE', price:'1,327.30', chg:'+0.24%', up:true },
  { sym:'TCS', price:'2,425.70', chg:'+1.19%', up:true },
  { sym:'HDFCBANK', price:'1,671.00', chg:'-0.09%', up:false },
  { sym:'INFY', price:'1,480.20', chg:'-1.15%', up:false },
  { sym:'BAJFINANCE', price:'1,102.28', chg:'+2.24%', up:true },
  { sym:'BHARTIARTL', price:'1,843.00', chg:'+0.95%', up:true },
  { sym:'SBIN', price:'1,571.00', chg:'-0.81%', up:false },
  { sym:'ICICIBANK', price:'1,245.60', chg:'+0.33%', up:true },
  { sym:'WIPRO', price:'540.70', chg:'+0.60%', up:true },
]

const COIN_TABLE = [
  { name:'RELIANCE', sym:'RELIANCE', mktCap:'₹8.93T', fdv:'₹8.93T', price:'₹1,327.30', avail:'6.73B', total:'6.73B', vol:'₹21.87B', chg:'+0.24%', up:true, color:'#0055a5' },
  { name:'TCS', sym:'TCS', mktCap:'₹8.87T', fdv:'₹8.87T', price:'₹2,425.70', avail:'3.66B', total:'3.66B', vol:'₹13.82B', chg:'+1.19%', up:true, color:'#0072c6' },
  { name:'HDFC BANK', sym:'HDFCBANK', mktCap:'₹12.85T', fdv:'₹12.85T', price:'₹1,671.00', avail:'7.69B', total:'7.69B', vol:'₹12.35B', chg:'-0.09%', up:false, color:'#004c8f' },
  { name:'INFOSYS', sym:'INFY', mktCap:'₹6.12T', fdv:'₹6.12T', price:'₹1,480.20', avail:'4.14B', total:'4.14B', vol:'₹8.92B', chg:'-1.15%', up:false, color:'#007cc3' },
  { name:'ICICI BANK', sym:'ICICIBANK', mktCap:'₹8.73T', fdv:'₹8.73T', price:'₹1,245.60', avail:'7.01B', total:'7.01B', vol:'₹9.55B', chg:'+0.33%', up:true, color:'#f58220' },
  { name:'BHARTI AIRTEL', sym:'BHARTIARTL', mktCap:'₹10.95T', fdv:'₹10.95T', price:'₹1,843.00', avail:'5.94B', total:'5.94B', vol:'₹5.88B', chg:'+0.95%', up:true, color:'#ed1c24' },
  { name:'ITC', sym:'ITC', mktCap:'₹5.61T', fdv:'₹5.61T', price:'₹448.20', avail:'12.51B', total:'12.51B', vol:'₹4.35B', chg:'+0.12%', up:true, color:'#138800' },
  { name:'SBIN', sym:'SBIN', mktCap:'₹7.02T', fdv:'₹7.02T', price:'₹1,571.00', avail:'4.47B', total:'4.47B', vol:'₹6.78B', chg:'-0.81%', up:false, color:'#22409a' },
  { name:'BAJAJ FIN', sym:'BAJFINANCE', mktCap:'₹3.42T', fdv:'₹3.42T', price:'₹1,102.28', avail:'3.10B', total:'3.10B', vol:'₹3.18B', chg:'+2.24%', up:true, color:'#005baa' },
  { name:'SUN PHARMA', sym:'SUNPHARMA', mktCap:'₹4.18T', fdv:'₹4.18T', price:'₹1,752.40', avail:'2.39B', total:'2.39B', vol:'₹2.85B', chg:'+0.45%', up:true, color:'#e31837' },
  { name:'MARUTI', sym:'MARUTI', mktCap:'₹4.48T', fdv:'₹4.48T', price:'₹14,097.00', avail:'317.8M', total:'317.8M', vol:'₹1.92B', chg:'+0.63%', up:true, color:'#1a3668' },
  { name:'TATA MOTORS', sym:'TATAMOTORS', mktCap:'₹2.71T', fdv:'₹2.71T', price:'₹742.30', avail:'3.65B', total:'3.65B', vol:'₹4.12B', chg:'-1.23%', up:false, color:'#1c3d6a' },
]

const PRICE_CARDS = [
  { sym:'NIFTY 50', name:'NIFTY / SENSEX', price:'24,856.80', chg:'+0.05%', up:true },
  { sym:'NIFTY BANK', name:'BANK / FIN', price:'57,098.95', chg:'+0.18%', up:true },
  { sym:'SENSEX', name:'BSE / INDEX', price:'76,042.44', chg:'+1.06%', up:true },
  { sym:'RELIANCE', name:'RELIANCE / OIL', price:'₹1,327.30', chg:'+0.24%', up:true },
  { sym:'NIFTY IT', name:'NIFTY / IT', price:'38,421.50', chg:'-0.87%', up:false },
  { sym:'INDIA VIX', name:'VIX / VOL', price:'14.82', chg:'+3.20%', up:true },
  { sym:'GOLD', name:'GOLD / MCX', price:'₹72,350', chg:'+0.33%', up:true },
  { sym:'USDINR', name:'USD / INR', price:'83.42', chg:'-0.05%', up:false },
]

const CURRENCIES = ['EUR','USD','INR','GBP','JPY','CHF','AUD','CAD','NZD','CNY','TRY','SEK','NOK','DKK','ZAR','HKD']
const CROSS_RATES = [
  [1.0,    1.15921,105.28, 0.85573,185.208,0.93744,1.61666,1.61010,1.95744,7.7913, 55.94158,11.13126,10.84850,7.47525,18.73800,9.08680],
  [0.8624, 1.0,    90.12,  0.73818,159.766,0.80864,1.3942, 1.38898,1.6883, 6.7198, 48.25610,9.60194, 9.35840, 6.44793,16.16210,7.83895],
  [0.0095, 0.0111, 1.0,    0.0081, 1.7620, 0.0089, 0.0153, 0.0153, 0.0187, 0.0743, 0.5340, 0.1063, 0.1036, 0.0714, 0.1790, 0.0869],
  [1.1681, 1.3546, 216.416,1.0,    216.416,1.09532,1.88913,1.88146,2.28739,9.1044, 65.3672,13.0052, 12.6752,8.7342, 21.88753,10.617],
  [0.0053989,0.006257,0.5677,0.004616,1.0, 0.005061,0.008725,0.008690,0.010569,0.04203,0.30198,0.05972,0.05854,0.040339,0.10115,0.04886],
  [1.0663, 1.2362, 197.539,0.9125, 197.539,1.0,    1.7241, 1.7168, 2.0879, 8.3107, 59.6695,11.8737,11.5717,7.9737, 19.9938,9.6938],
  [0.6185, 0.71703,114.555,0.5289, 114.555,0.57980,1.0,    0.995900,1.21080,4.8184, 34.5936,6.8825, 6.7107, 4.6228, 11.5915,5.614560],
  [0.6208, 0.7195, 115.022,0.5311, 115.022,0.58218,1.0036, 1.0,    1.2149, 4.8389, 34.7374,6.9102, 6.7347, 4.6385, 11.6401,5.64250],
  [0.5104, 0.59210,94.600, 0.4367, 94.600, 0.47881,0.8254, 0.82243,1.0,    3.976,  28.5690,5.6492, 5.5402, 3.8165, 9.5689, 4.6402],
  [0.12829,0.1487, 23.750, 0.10979,23.750, 0.1199, 0.203,  0.2062, 0.247,  1.0,    7.17689,1.4280965,1.3917960,0.95906,2.4046, 1.1657],
  [0.01748,0.02032,3.271,  0.01490,3.271,  0.01656,0.0285, 0.0288, 0.0350, 0.1393, 1.0,    0.1985, 0.1932, 0.1336, 0.3351, 0.1623],
  [0.08941,0.1037, 16.631, 0.07666,16.631, 0.08419,0.14517,0.1438, 0.1718, 0.6958, 5.01904,1.0,    0.9741, 0.6711, 1.6793, 0.8141],
  [0.09212,0.10680,17.061, 0.078846,17.061,0.08638,0.14861,0.1476, 0.18004,0.7132, 5.1768, 1.0245, 1.0,    0.6885, 1.7253, 0.8355],
  [0.13367,0.1547, 24.770, 0.1141, 24.770, 0.12540,0.21626,0.21532,0.26152,1.0442, 7.4803, 1.4875, 1.4504, 1.0,    2.5063, 1.2137],
  [0.0530, 0.0614, 9.8600, 0.04562,9.8600, 0.05000,0.08623,0.0855, 0.10442,0.4157, 2.96283,0.5901, 0.57886,0.3984, 1.0,    0.4714],
  [0.11000,0.12752,20.3560,0.09413,20.3560,0.103150,0.17786,0.17714,0.21525,0.8572, 6.14545,1.2241, 1.1901, 0.82239,2.0621, 1.0   ],
]

const HEAT_MAP = [
  [0,    -0.07, 0.13,  0.01, -0.14, 0.07,  -0.05, 0.03,  0.08,  0.12, 0.21,  -0.04, 0.06,  -0.08, 0.15,  -0.03],
  [0.07, 0,     -0.12, 0.05, -0.17, 0.11,  0.14,  0.1,   0.17,  0.2,  0.18,  0.09,  -0.05, 0.11,  -0.06, 0.08],
  [-0.13,0.12,  0,     -0.08,0.22,  -0.11, 0.16,  -0.08, 0.11,  -0.08,-0.15, 0.07,  0.12,  -0.04, 0.09,  -0.11],
  [-0.01,-0.05, 0.08,  0,    -0.11, 0.09,  0.02,  0.04,  0.07,  0.12, 0.08,  -0.06, 0.03,  0.05,  -0.02, 0.04],
  [0.14, 0.17,  -0.22, 0.11, 0,     -0.14, 0.1,   -0.06, 0.05,  -0.17,-0.21, 0.13,  -0.09, 0.08,  0.16,  -0.12],
  [-0.07,-0.11, 0.11,  -0.09,0.14,  0,     -0.16, 0.05,  -0.13, -0.07,-0.09, 0.04,  0.07,  -0.03, 0.11,  0.02],
  [0.05, -0.14, -0.16, -0.02,-0.1,  0.16,  0,     0.07,  0.01,  -0.09,0.12,  -0.08, 0.05,  0.03,  -0.06, 0.07],
  [-0.03,-0.1,  0.08,  -0.04,0.06,  -0.05, -0.07, 0,     -0.04, 0.05, 0.08,  0.02,  -0.03, 0.06,  0.04,  -0.05],
  [-0.08,-0.17, -0.11, -0.07,-0.05, 0.13,  -0.01, 0.04,  0,     -0.06,-0.12, 0.09,  -0.07, 0.03,  -0.08, 0.06],
  [-0.12,-0.2,  0.08,  -0.12,0.17,  0.07,  0.09,  -0.05, 0.06,  0,    0.15,  -0.06, 0.08,  -0.09, 0.11,  -0.04],
  [-0.21,-0.18, 0.15,  -0.08,0.21,  0.09,  -0.12, -0.08, 0.12,  -0.15,0,     -0.11, 0.14,  -0.07, 0.06,  -0.13],
  [0.04, -0.09, -0.07, 0.06, -0.13, -0.04, 0.08,  -0.02, -0.09, 0.06, 0.11,  0,     0.05,  0.08,  -0.04, 0.03],
  [-0.06,0.05,  -0.12, -0.03,0.09,  -0.07, -0.05, 0.03,  0.07,  -0.08,-0.14, -0.05, 0,     0.04,  -0.09, 0.07],
  [0.08, -0.11, 0.04,  -0.05,-0.08, 0.03,  -0.03, -0.06, -0.03, 0.09, 0.07,  -0.08, -0.04, 0,     0.06,  -0.02],
  [-0.15,0.06,  -0.09, 0.02, -0.16, -0.11, 0.06,  -0.04, 0.08,  -0.11,-0.06, 0.04,  0.09,  -0.06, 0,     0.05],
  [0.03, -0.08, 0.11,  -0.04,0.12,  -0.02, -0.07, 0.05,  -0.06, 0.04, 0.13,  -0.03, -0.07, 0.02,  -0.05, 0],
]

const NEWS_ITEMS = [
  { title:'NIFTY 50 Futures Climb as IT Stocks Rally on Strong Q2 Guidance', time:'2 min ago', tags:['NIFTY','IT'] },
  { title:'RBI Holds Rates Steady, Maintains Accommodative Stance', time:'15 min ago', tags:['RBI','BANKS'] },
  { title:'Tata Motors Q2 Results: Net Profit Up 12% on JLR Demand Surge', time:'1 hour ago', tags:['TATAMOTORS','AUTO'] },
  { title:'Reliance Industries Plans ₹75,000 Cr Green Energy Investment', time:'2 hours ago', tags:['RELIANCE','ENERGY'] },
  { title:'HDFC Bank Merges Parent Entity, Achieves Full Integration', time:'3 hours ago', tags:['HDFCBANK','BANKS'] },
  { title:'FII Outflows Hit ₹2,800 Cr as Global Uncertainty Rises', time:'4 hours ago', tags:['FII','MARKET'] },
]

const FAQ_DATA = [
  { q:'How does TradePro price every trade?', a:"Every order is checked against live market depth before it's placed, so the price you see is the price you get, not an estimate from a few seconds ago." },
  { q:'Can I hold Indian and US assets in one place?', a:'Yes. TradePro supports both NSE/BSE equities and 500+ US-listed stocks and ETFs from a single unified portfolio.' },
  { q:'How is my risk score calculated?', a:'We analyze your portfolio concentration, sector exposure, volatility, and liquidity to generate a risk score from 1-100.' },
  { q:'What does TradePro charge?', a:'Equity delivery trades are ₹0. Intraday and F&O have flat per-order pricing. No hidden fees, no annual maintenance charges.' },
]

const FOOTER_COLS = {
  Products: ['Indian Stocks','US Stocks','Mutual Funds','Gold','ETFs'],
  Tools:    ['Screener','Watchlist','Alerts','Market Movers'],
  Resources:['Learn','Market News','Blog'],
  Company:  ['About','Careers','Contact'],
  Legal:    ['Privacy','Terms','Security','Regulatory Info'],
}

const APP_URL = 'https://tradepro.in'

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════════════════ */

/* ── Ticker Bar ── */
function TickerBar() {
  return (
    <div className={styles.tickerBar}>
      <div className={styles.tickerTrack}>
        {[...TICKER_ITEMS,...TICKER_ITEMS,...TICKER_ITEMS].map((item, i) => (
          <span key={i} className={styles.tickerItem}>
            <span className={styles.tickerSym}>{item.sym}</span>
            <span className={styles.tickerPrice}>{item.price}</span>
            <span className={item.up ? styles.tickerUp : styles.tickerDn}>
              {item.up ? '▲' : '▼'} {item.chg}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Navbar ── */
function Navbar({ navigate }) {
  const dispatch = useDispatch()
  const theme = useSelector(s => s.ui.theme)
  const isDark = theme === 'dark'

  return (
    <header className={styles.navbar}>
      <div className={styles.navInner}>
        <div className={styles.navLeft}>
          <button className={styles.navLogo} onClick={() => navigate('/')}>
            <span className={styles.navLogoIcon}>
              <TrendingUp size={14} color="#fff" />
            </span>
            <span className={styles.navLogoText}>TRADEPRO</span>
          </button>
          <div className={styles.navSearch}>
            <Search size={14} className={styles.navSearchIcon} />
            <input placeholder="Search stocks, ETFs, mutual funds…" className={styles.navSearchInput} />
          </div>
        </div>
        <nav className={styles.navLinks}>
          {['Trade In','Markets','Stocks','Screener','Learn'].map(link => (
            <button key={link} className={styles.navLink}>{link}</button>
          ))}
        </nav>
        <div className={styles.navRight}>
          <button className={styles.themeToggle} onClick={() => dispatch(toggleTheme())} aria-label="Toggle theme">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className={styles.navSignIn} onClick={() => navigate('/login')}>Sign in</button>
          <button className={styles.navGetStarted} onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </div>
    </header>
  )
}

/* ── Hero ── */
function Hero({ navigate, indices }) {
  return (
    <motion.section
      className={styles.hero}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <div className={styles.heroInner}>
        <motion.div
          className={styles.heroLeft}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1], delay: 0.06 }}
        >
          <motion.div
            className={styles.heroBadge}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.12 }}
          >
            <span className={styles.heroBadgeDot} />
            <span>Trusted by 4.1L+ traders across India</span>
          </motion.div>
          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1], delay: 0.18 }}
          >
            Trade smarter. <br />
            <span className={styles.heroAccent}>India's most advanced trading platform.</span>
          </motion.h1>
          <p className={styles.heroTagline}>Where Better Decisions Begin — Stocks, Crypto, Gold & More</p>
          <p className={styles.heroSub}>
            TradePro is the most advanced platform for trading Indian equities, 
            US stocks, mutual funds and ETFs. Real-time market data, institutional-grade 
            execution, and AI-powered analytics — all in one place.
          </p>
          <div className={styles.heroInput}>
            <input
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
              className={styles.heroEmailInput}
            />
            <motion.button
              className={styles.heroGetStarted}
              onClick={() => navigate('/register')}
              whileHover={{ scale: 1.03, boxShadow: '0 12px 28px rgba(26,115,232,.4)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              Get Started
            </motion.button>
          </div>
          <div className={styles.heroTrust}>
            <span>🔒 SEBI Registered</span>
            <span>⚡ Zero brokerage on delivery</span>
            <span>🛡️ Bank-grade security</span>
          </div>
        </motion.div>
        <motion.div
          className={styles.heroRight}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1], delay: 0.24 }}
        >
          {/* Technical Analysis Gauge */}
          <div className={styles.gaugeCard}>
            <div className={styles.gaugeHeader}>Technical Analysis for <span className={styles.gaugeSym}>NIFTY 50</span></div>
            <div className={styles.gaugeTimeframes}>
              {['1 minute','5 minutes','15 minutes','More ▾'].map(tf => (
                <button key={tf} className={tf === '1 minute' ? styles.gaugeTfActive : styles.gaugeTf}>{tf}</button>
              ))}
            </div>
            <div className={styles.gaugeVisual}>
              <svg viewBox="0 0 200 120" className={styles.gaugeSvg}>
                {/* Background arc */}
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e0e0e0" strokeWidth="12" strokeLinecap="round"/>
                {/* Sell zone (red) */}
                <path d="M 20 100 A 80 80 0 0 1 55 35" fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="round"/>
                {/* Neutral zone (orange) */}
                <path d="M 55 35 A 80 80 0 0 1 145 35" fill="none" stroke="#f59e0b" strokeWidth="12" strokeLinecap="round"/>
                {/* Buy zone (green) */}
                <path d="M 145 35 A 80 80 0 0 1 180 100" fill="none" stroke="#22c55e" strokeWidth="12" strokeLinecap="round"/>
                {/* Needle */}
                <line x1="100" y1="100" x2="100" y2="30" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="100" cy="100" r="6" fill="#1a1a1a"/>
              </svg>
            </div>
            <div className={styles.gaugeLabel}>Neutral</div>
            <div className={styles.gaugeLegend}>
              <span className={styles.gaugeSell}>Sell<br/>10</span>
              <span className={styles.gaugeNeutral}>Neutral<br/>6</span>
              <span className={styles.gaugeBuy}>Buy<br/>10</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

/* ── Coin Table ── */
function CoinTable({ indices }) {
  return (
    <section className={styles.coinTableSection}>
      <div className={styles.coinTableInner}>
        <div className={styles.coinTableMeta}>
          <span className={styles.coinTableCount}>NAME<br/>189 MATCHES</span>
        </div>
        <div className={styles.coinTableWrap}>
          <div className={styles.ctHead}>
            <span className={styles.ctName}>NAME</span>
            <span className={styles.ctMktCap}>MKT CAP</span>
            <span className={styles.ctFdv}>FD MKT CAP</span>
            <span className={styles.ctPrice}>PRICE</span>
            <span className={styles.ctAvail}>AVAIL. COINS</span>
            <span className={styles.ctTotal}>TOTAL COINS</span>
            <span className={styles.ctVol}>TRADED VOL.</span>
            <span className={styles.ctChg}>CHG %</span>
          </div>
          {COIN_TABLE.map(coin => (
            <div key={coin.sym} className={styles.ctRow}>
              <div className={styles.ctNameCell}>
                <span className={styles.ctIcon} style={{background: coin.color}}>{coin.name.charAt(0)}</span>
                <span className={styles.ctNameText}>{coin.name}</span>
              </div>
              <span className={styles.ctMktCap}>{coin.mktCap}</span>
              <span className={styles.ctFdv}>{coin.fdv}</span>
              <span className={styles.ctPrice}>{coin.price}</span>
              <span className={styles.ctAvail}>{coin.avail}</span>
              <span className={styles.ctTotal}>{coin.total}</span>
              <span className={styles.ctVol}>{coin.vol}</span>
              <span className={coin.up ? styles.ctChgUp : styles.ctChgDn}>{coin.chg}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Price Cards ── */
function PriceCards({ indices }) {
  return (
    <section className={styles.priceCardsSection}>
      <div className={styles.priceCardsInner}>
        <h2 className={styles.sectionHeading}>Check your favorite coin price<br/>within a glance</h2>
        <div className={styles.priceCardsGrid}>
          {PRICE_CARDS.map(card => {
            const live = indices?.[card.sym]
            const price = live?.price ? live.price.toLocaleString('en-IN', {minimumFractionDigits:2}) : card.price
            const pct = live?.changePct ?? parseFloat(card.chg)
            const isUp = pct >= 0
            return (
              <div key={card.sym} className={styles.priceCard}>
                <div className={styles.pcHeader}>
                  <span className={styles.pcName}>{card.sym}</span>
                  <span className={styles.pcPair}>{card.name}</span>
                </div>
                <div className={styles.pcPrice}>{price}</div>
                <div className={styles.pcSparkline}>
                  <svg viewBox="0 0 120 40" preserveAspectRatio="none">
                    <path
                      d={isUp ? "M0,35 Q20,30 40,25 T80,15 T120,5" : "M0,5 Q20,10 40,15 T80,25 T120,35"}
                      fill="none" stroke={isUp ? '#22c55e' : '#ef4444'} strokeWidth="2"
                    />
                    <path
                      d={isUp ? "M0,35 Q20,30 40,25 T80,15 T120,5 L120,40 L0,40 Z" : "M0,5 Q20,10 40,15 T80,25 T120,35 L120,40 L0,40 Z"}
                      fill={isUp ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'}
                    />
                  </svg>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ── Cross Rates Table ── */
function CrossRates() {
  return (
    <section className={styles.crossRatesSection}>
      <div className={styles.crossRatesInner}>
        <h2 className={styles.sectionHeading}>Check fiat currency cross rates<br/>within a second</h2>
        <div className={styles.crossRatesWrap}>
          <div className={styles.crHead}>
            <span className={styles.crCorner}></span>
            {CURRENCIES.map(c => (
              <span key={c} className={styles.crHeadCell}>
                <span className={styles.crFlag}>{getCurrencyFlag(c)}</span>
                {c}
              </span>
            ))}
          </div>
          {CURRENCIES.map((row, ri) => (
            <div key={row} className={styles.crRow}>
              <span className={styles.crRowLabel}>
                <span className={styles.crFlag}>{getCurrencyFlag(row)}</span>
                {row}
              </span>
              {CURRENCIES.map((col, ci) => {
                const val = CROSS_RATES[ri][ci]
                const isDiag = ri === ci
                const isHigh = !isDiag && val > 1.5
                const isLow = !isDiag && val < 0.05
                return (
                  <span key={col} className={`${styles.crCell} ${isDiag ? styles.crDiag : ''} ${isHigh ? styles.crHigh : ''} ${isLow ? styles.crLow : ''}`}>
                    {isDiag ? '' : val.toFixed(isHigh ? 2 : isLow ? 4 : 5)}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function getCurrencyFlag(c) {
  const flags = { EUR:'🇪🇺', USD:'🇺🇸', INR:'🇮🇳', GBP:'🇬🇧', JPY:'🇯🇵', CHF:'🇨🇭', AUD:'🇦🇺', CAD:'🇨🇦', NZD:'🇳🇿', CNY:'🇨🇳', TRY:'🇹🇷', SEK:'🇸🇪', NOK:'🇳🇴', DKK:'🇩🇰', ZAR:'🇿🇦', HKD:'🇭🇰' }
  return flags[c] || ''
}

/* ── Heat Map ── */
function HeatMap() {
  return (
    <section className={styles.heatMapSection}>
      <div className={styles.heatMapInner}>
        <h2 className={styles.sectionHeading}>Check real-time heat map find opportunities<br/>and trade with confidence</h2>
        <div className={styles.heatMapWrap}>
          <div className={styles.hmHead}>
            <span className={styles.hmCorner}></span>
            {CURRENCIES.map(c => (
              <span key={c} className={styles.hmHeadCell}>
                <span className={styles.hmFlag}>{getCurrencyFlag(c)}</span>
                {c}
              </span>
            ))}
          </div>
          {CURRENCIES.map((row, ri) => (
            <div key={row} className={styles.hmRow}>
              <span className={styles.hmRowLabel}>
                <span className={styles.hmFlag}>{getCurrencyFlag(row)}</span>
                {row}
              </span>
              {CURRENCIES.map((col, ci) => {
                const val = HEAT_MAP[ri][ci]
                const isDiag = ri === ci
                const bg = isDiag ? 'transparent' : getHeatColor(val)
                return (
                  <span key={col} className={`${styles.hmCell} ${isDiag ? styles.hmDiag : ''}`} style={{background: bg}}>
                    {isDiag ? '' : `${val > 0 ? '+' : ''}${(val * 100).toFixed(0)}%`}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function getHeatColor(val) {
  if (val === 0) return 'transparent'
  if (val > 0) {
    const intensity = Math.min(Math.abs(val) * 5, 1)
    return `rgba(34,197,94,${0.15 + intensity * 0.45})`
  } else {
    const intensity = Math.min(Math.abs(val) * 5, 1)
    return `rgba(239,68,68,${0.15 + intensity * 0.45})`
  }
}

/* ── News Section ── */
function NewsSection() {
  return (
    <section className={styles.newsSection}>
      <div className={styles.newsInner}>
        <h2 className={styles.sectionHeading}>Check latest news and key events of popular<br/>companies and cryptocurrencies</h2>
        <div className={styles.newsCard}>
          <div className={styles.newsHeader}>
            <span className={styles.newsTitle}>Top Stories</span>
            <span className={styles.newsFilterIcon}>⚡</span>
          </div>
          {NEWS_ITEMS.map((item, i) => (
            <div key={i} className={styles.newsItem}>
              <div className={styles.newsTags}>
                {item.tags.map(t => (
                  <span key={t} className={styles.newsTag}>{t}</span>
                ))}
                <span className={styles.newsTime}>{item.time}</span>
              </div>
              <p className={styles.newsHeadline}>{item.title}</p>
            </div>
          ))}
          <button className={styles.newsMore}>Keep reading →</button>
        </div>
      </div>
    </section>
  )
}

/* ── Footer ── */
function Footer({ navigate }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <span className={styles.footerLogoIcon}>
            <TrendingUp size={12} color="#fff" />
          </span>
          <span className={styles.footerLogoText}>TRADEPRO</span>
          <p className={styles.footerDesc}>
            A trusted and secure cryptocurrency exchange. Where better decisions begin.
            Real-time market data, institutional-grade execution, and AI-powered analytics.
          </p>
          <div className={styles.footerSocials}>
            {['f','𝕏','in','◉','○'].map(s => (
              <span key={s} className={styles.footerSocial}>{s}</span>
            ))}
          </div>
        </div>
        {Object.entries(FOOTER_COLS).map(([title, links]) => (
          <div key={title} className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>{title}</h4>
            {links.map(link => (
              <button key={link} className={styles.footerLink}>{link}</button>
            ))}
          </div>
        ))}
      </div>
      <div className={styles.footerBottom}>
        <p className={styles.footerDisclaimer}>
          Investments in securities are subject to market risk. Read all related documents carefully before investing.
          Illustrative figures shown throughout this preview, not investment advice.
        </p>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN LANDING PAGE
═══════════════════════════════════════════════════════════ */
export default function LandingPage({ indices }) {
  const navigate = useNavigate()
  const theme = useSelector(s => s.ui.theme)
  const isDark = theme === 'dark'

  return (
    <div className={styles.page} data-theme={theme}>
      <TickerBar />
      <Navbar navigate={navigate} />
      <Hero navigate={navigate} indices={indices} />
      <CoinTable indices={indices} />
      <PriceCards indices={indices} />
      <CrossRates />
      <HeatMap />
      <NewsSection />
      <Footer navigate={navigate} />
    </div>
  )
}

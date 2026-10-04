import React, { useState, useMemo, memo } from 'react'

/**
 * CompanyLogo — shows a real company logo with three-source fallback chain:
 *
 *   1. unavatar.io/{domain}         — aggregates logos from multiple sources, CORS-safe
 *   2. google.com/s2/favicons       — Google's global favicon service, always works
 *   3. Colored initials             — guaranteed local fallback, no network needed
 *
 * Clearbit (deprecated) and Wikimedia (hotlink-blocked) are intentionally removed.
 */

// ── Symbol → website domain ─────────────────────────────────────────────────
const DOMAIN = {
  // ── NIFTY 50 ──
  RELIANCE:   'relianceindustries.com', TCS:          'tcs.com',
  HDFCBANK:   'hdfcbank.com',           INFY:         'infosys.com',
  ICICIBANK:  'icicibank.com',          SBIN:         'sbi.co.in',
  BAJFINANCE: 'bajajfinserv.in',        BHARTIARTL:   'airtel.com',
  KOTAKBANK:  'kotak.com',              WIPRO:        'wipro.com',
  HCLTECH:    'hcltech.com',            AXISBANK:     'axisbank.com',
  LT:         'larsentoubro.com',       ITC:          'itcportal.com',
  MARUTI:     'marutisuzuki.com',       TITAN:        'titanwatch.co.in',
  TATAMOTORS: 'tatamotors.com',         TATASTEEL:    'tatasteel.com',
  ONGC:       'ongc.com',              NTPC:         'ntpc.co.in',
  SUNPHARMA:  'sunpharma.com',          ULTRACEMCO:   'ultratechindia.com',
  NESTLEIND:  'nestle.co.in',           ASIANPAINT:   'asianpaints.com',
  POWERGRID:  'powergrid.in',           COALINDIA:    'coalindia.in',
  ADANIENT:   'adani.com',             ADANIPORTS:   'adaniports.com',
  'BAJAJ-AUTO': 'bajajauto.com',        HEROMOTOCO:   'heromotocorp.com',
  TATACONSUM: 'tataconsumer.com',       INDIGO:       'goindigo.in',
  DRREDDY:    'drreddys.com',           CIPLA:        'cipla.com',
  APOLLOHOSP: 'apollohospitals.com',    EICHERMOT:    'eicher.com',
  GRASIM:     'grasim.com',            DIVISLAB:     'divis.com',
  TECHM:      'techmahindra.com',       INDUSINDBK:   'indusind.com',
  POLYCAB:    'polycabindia.com',
  // ── Banking / Finance ──
  HDFCLIFE:   'hdfclife.com',           SBILIFE:      'sbilife.co.in',
  ICICIGI:    'icicilombard.com',        ICICIPRULI:   'iciciprulife.com',
  BANKBARODA: 'bankofbaroda.in',         PNB:          'pnbindia.in',
  CANBK:      'canarabank.com',          UNIONBANK:    'unionbankofindia.com',
  IDFCFIRSTB: 'idfcfirstbank.com',       FEDERALBNK:   'federalbank.co.in',
  RBLBANK:    'rblbank.com',             YESBANK:      'yesbank.in',
  BANDHANBNK: 'bandhanbank.com',         BAJAJFINSV:   'bajajfinserv.in',
  MUTHOOTFIN: 'muthootfinance.com',      CHOLAFIN:     'cholamandalam.com',
  // ── IT / Tech ──
  PERSISTENT: 'persistent.com',         COFORGE:      'coforge.com',
  LTIM:       'ltimindtree.com',         MPHASIS:      'mphasis.com',
  ZENSAR:     'zensar.com',             INFOEDGE:     'naukri.com',
  JUSTDIAL:   'justdial.com',           ZOMATO:       'zomato.com',
  PAYTM:      'paytm.com',             NYKAA:        'nykaa.com',
  POLICYBAZAAR:'policybazaar.com',
  // ── Pharma / Healthcare ──
  LUPIN:      'lupin.com',             BIOCON:       'biocon.com',
  AUROPHARMA: 'aurobindo.com',          TORNTPHARM:   'torrentpharma.com',
  ALKEM:      'alkem.com',             IPCALAB:      'ipcalab.com',
  LALPATHLAB: 'lalpathlabs.com',        METROPOLIS:   'metropolisindia.com',
  // ── Infrastructure / Power ──
  RECLTD:     'recl.co.in',            PFC:          'pfcindia.com',
  IRFC:       'irfc.co.in',            NHPC:         'nhpcindia.com',
  TATAPOWER:  'tatapower.com',          ADANIGREEN:   'adanigreen.com',
  TORNTPOWER: 'torrentpower.com',       CESC:         'cesc.co.in',
  SJVN:       'sjvnlimited.com',        NLCINDIA:     'nlcindia.com',
  // ── Metals / Mining ──
  HINDALCO:   'hindalco.com',           SAIL:         'sail.co.in',
  VEDL:       'vedanta.com',            HINDZINC:     'hindustan-zinc.com',
  NMDC:       'nmdc.co.in',            JSWSTEEL:     'jsw.in',
  JINDALSTEL: 'jsw.in',                TATASTEEL:    'tatasteel.com',
  // ── Consumer / FMCG ──
  HINDUNILVR: 'hul.co.in',             GODREJCP:     'godrej.com',
  DABUR:      'dabur.com',             MARICO:       'marico.com',
  PIDILITIND: 'pidilite.com',           COLPAL:       'colgate.co.in',
  HAVELLS:    'havells.com',            VOLTAS:       'voltas.com',
  DMART:      'dmart.in',              TRENT:        'trent.in',
  // ── Auto ──
  BOSCHLTD:   'bosch.co.in',           MOTHERSON:    'motherson.com',
  EXIDEIND:   'exideindustries.com',    'BAJAJ-AUTO': 'bajajauto.com',
  // ── Others ──
  SIEMENS:    'siemens.co.in',          ABB:          'abb.com',
  CONCOR:     'concorindia.com',        BLUEDART:     'bluedart.com',
  TATACOMM:   'tatatele.com',           VODAIDEA:     'vi.com',
  AMBUJACEM:  'ambujacement.com',       ACC:          'acclimited.com',
  BERGEPAINT: 'bergerindia.com',        SRF:          'srf.com',
  THERMAX:    'thermaxglobal.com',      CUMMINSIND:   'cummins.com',
  BPCL:       'bharatpetroleum.com',    IOC:          'iocl.com',
  HPCL:       'hindustanpetroleum.com', GAIL:         'gail.co.in',
  IGL:        'iglonline.com',         MGL:          'mahanagargas.com',
  ATGL:       'adanigas.com',

  // ── US Stocks ──
  AAPL:  'apple.com',       MSFT:  'microsoft.com',   GOOGL: 'google.com',
  GOOG:  'google.com',      AMZN:  'amazon.com',       NVDA:  'nvidia.com',
  META:  'meta.com',        TSLA:  'tesla.com',        JPM:   'jpmorgan.com',
  V:     'visa.com',        WMT:   'walmart.com',      UNH:   'unitedhealthgroup.com',
  JNJ:   'jnj.com',        XOM:   'exxonmobil.com',   PG:    'pg.com',
  BRKB:  'berkshirehathaway.com', MA: 'mastercard.com', HD: 'homedepot.com',
  BAC:   'bankofamerica.com', CRM: 'salesforce.com',   NFLX:  'netflix.com',
  AMD:   'amd.com',         INTC:  'intel.com',        PYPL:  'paypal.com',
  DIS:   'disney.com',      NKE:   'nike.com',         COST:  'costco.com',
  ORCL:  'oracle.com',      CSCO:  'cisco.com',        ADBE:  'adobe.com',
  QCOM:  'qualcomm.com',    TXN:   'ti.com',           AVGO:  'broadcom.com',
  SBUX:  'starbucks.com',   MDLZ:  'mondelezinternational.com',

  // ── Crypto ──
  BTC:   'bitcoin.org',     ETH:   'ethereum.org',     XRP:   'ripple.com',
  BNB:   'binance.com',     SOL:   'solana.com',       ADA:   'cardano.org',
  DOGE:  'dogecoin.com',    DOT:   'polkadot.network', AVAX:  'avax.network',
  LINK:  'chain.link',      MATIC: 'polygon.technology', UNI: 'uniswap.org',
  ATOM:  'cosmos.network',  FIL:   'filecoin.io',      LTC:   'litecoin.org',
  XLM:   'stellar.org',     TRX:   'tron.network',     NEAR:  'near.org',
  APT:   'aptos.foundation', ARB:  'arbitrum.io',       OP:    'optimism.io',
  INJ:   'injective.com',   SUI:   'sui.io',

  // ── ETFs ──
  NIFTYBEES: 'motilaloswal.com', BANKBEES:   'motilaloswal.com',
  GOLDBEES:  'motilaloswal.com', SILVERBEES: 'motilaloswal.com',
  JUNIORBEES:'motilaloswal.com', MIDCAPBEES: 'motilaloswal.com',
}

// ── Deterministic color from symbol ─────────────────────────────────────────
const PALETTE = [
  '#e53935','#d81b60','#8e24aa','#5e35b1','#3949ab',
  '#1e88e5','#039be5','#00acc1','#00897b','#43a047',
  '#7cb342','#c0ca33','#fb8c00','#f4511e','#6d4c41',
  '#757575','#546e7a','#1a73e8','#0d9488','#ea580c',
]
function getColor(sym) {
  let h = 0
  for (let i = 0; i < sym.length; i++) h = ((h << 5) - h + sym.charCodeAt(i)) | 0
  return PALETTE[Math.abs(h) % PALETTE.length]
}
function initials(name) {
  if (!name) return '?'
  const w = name.replace(/[^a-zA-Z0-9 ]/g, '').trim().split(/\s+/)
  return w.length === 1 ? w[0].slice(0, 2).toUpperCase()
    : (w[0][0] + w[w.length - 1][0]).toUpperCase()
}

// ── Logo URL chain ───────────────────────────────────────────────────────────
function logoUrls(sym, domain) {
  if (!domain) return []
  return [
    // 1. unavatar.io — aggregates Clearbit, favicon, Twitter, etc.
    `https://unavatar.io/${domain}?fallback=false`,
    // 2. Google S2 favicon — works for every registered domain
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ]
}

// ── Component ────────────────────────────────────────────────────────────────
function CompanyLogo({ symbol, name, size = 36, borderRadius, style = {} }) {
  const [errIdx, setErrIdx] = useState(0)

  const sym    = (symbol || '').toUpperCase()
  const domain = DOMAIN[sym]
  const urls   = useMemo(() => logoUrls(sym, domain), [sym, domain])
  const color  = useMemo(() => getColor(sym), [sym])
  const br     = borderRadius ?? Math.round(size * 0.28)
  const label  = useMemo(() => initials(name || sym), [name, sym])

  const src        = errIdx < urls.length ? urls[errIdx] : null
  const showFallback = !src

  return (
    <div style={{
      width: size, height: size, borderRadius: br, flexShrink: 0,
      background: showFallback ? color : '#f1f3f4',
      display: 'grid', placeItems: 'center',
      overflow: 'hidden', position: 'relative', ...style,
    }}>
      {src && (
        <img
          key={`${sym}-${errIdx}`}
          src={src}
          alt={sym}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setErrIdx(i => i + 1)}
          style={{ width: '100%', height: '100%', objectFit: 'contain',
            padding: size > 40 ? 3 : 1 }}
        />
      )}
      {showFallback && (
        <span style={{
          fontSize: size * 0.36, fontWeight: 800, color: '#fff',
          letterSpacing: -0.5, lineHeight: 1, userSelect: 'none',
        }}>
          {label}
        </span>
      )}
    </div>
  )
}

export default memo(CompanyLogo)

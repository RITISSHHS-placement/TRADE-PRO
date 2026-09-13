import React, { useState, useMemo, memo } from 'react'

/**
 * CompanyLogo — fetches real company logos via multi-source chain:
 *   1. Direct logo URL map (known high-quality logos)
 *   2. Clearbit Logo API (major companies)
 *   3. Google S2 Favicon API (works with any domain)
 *   4. Colored initials fallback (guaranteed)
 */

// ─── Direct logo URLs for companies where API sources fail ───
// Using Wikipedia/Wikimedia Commons and official CDN URLs
const DIRECT_LOGO_MAP = {
  RELIANCE: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Reliance_Industries_Logo.svg/256px-Reliance_Industries_Logo.svg.png',
  TCS: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Tata_Consultancy_Services.svg/256px-Tata_Consultancy_Services.svg.png',
  SBIN: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/State_Bank_of_India_logo.svg/256px-State_Bank_of_India_logo.svg.png',
  ITC: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/ITC_Limited_Logo.svg/256px-ITC_Limited_Logo.svg.png',
  INFY: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Infosys_logo.svg/256px-Infosys_logo.svg.png',
  WIPRO: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Wipro_logo.svg/256px-Wipro_logo.svg.png',
  TATASTEEL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Tata_Steel_logo.svg/256px-Tata_Steel_logo.svg.png',
  TATAMOTORS: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tata_Motors_logo.svg/256px-Tata_Motors_logo.svg.png',
  TATACONSUM: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tata_logo.svg/256px-Tata_logo.svg.png',
  TITAN: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Titan_Company_logo.svg/256px-Titan_Company_logo.svg.png',
  BHARTIARTL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Bharti_Airtel_logo.svg/256px-Bharti_Airtel_logo.svg.png',
  ONGC: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/ONGC_logo.svg/256px-ONGC_logo.svg.png',
  NTPC: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/NTPC_logo.svg/256px-NTPC_logo.svg.png',
  SAIL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/SAIL_Logo.svg/256px-SAIL_Logo.svg.png',
  BPCL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/BPCL_logo.svg/256px-BPCL_logo.svg.png',
  'BAJAJ-AUTO': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Bajaj_Auto_logo.svg/256px-Bajaj_Auto_logo.svg.png',
  COALINDIA: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Coal_India_Logo.svg/256px-Coal_India_Logo.svg.png',
  POWERGRID: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Power_Grid_Corporation_of_India_logo.svg/256px-Power_Grid_Corporation_of_India_logo.svg.png',
  LT: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/L%26T_logo.svg/256px-L%26T_logo.svg.png',
  TECHM: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Tech_Mahindra_logo.svg/256px-Tech_Mahindra_logo.svg.png',
  // US Stocks
  AAPL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/256px-Apple_logo_black.svg.png',
  MSFT: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/256px-Microsoft_logo.svg.png',
  GOOGL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/256px-Google_2015_logo.svg.png',
  AMZN: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/256px-Amazon_logo.svg.png',
  NVDA: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Nvidia_logo.svg/256px-Nvidia_logo.svg.png',
  TSLA: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Tesla_Motors.svg/256px-Tesla_Motors.svg.png',
  META: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/256px-Meta_Platforms_Inc._logo.svg.png',
  NFLX: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/256px-Netflix_2015_logo.svg.png',
  AMD: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/AMD_Logo.svg/256px-AMD_Logo.svg.png',
  INTC: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Intel_logo_%282020%2C_light_blue%29.svg/256px-Intel_logo_%282020%2C_light_blue%29.svg.png',
  JPM: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/JPMorgan_Chase_Logo.svg/256px-JPMorgan_Chase_Logo.svg.png',
  V: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/256px-Visa_Inc._logo.svg.png',
  WMT: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Walmart_logo.svg/256px-Walmart_logo.svg.png',
  DIS: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/D._%26_C._Entertainment_logo.svg/256px-D._%26_C._Entertainment_logo.svg.png',
  NKE: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/256px-Logo_NIKE.svg.png',
  // Crypto
  BTC: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/256px-Bitcoin.svg.png',
  ETH: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Ethereum_logo_2014.svg/256px-Ethereum_logo_2014.svg.png',
  XRP: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/XRP_logo.svg/256px-XRP_logo.svg.png',
  SOL: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Solana_logo.png/256px-Solana_logo.png',
  ADA: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Cardano_Blue_Logo.svg/256px-Cardano_Blue_Logo.svg.png',
  DOGE: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d0/Dogecoin_logo.svg/256px-Dogecoin_logo.svg.png',
  LTC: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Litecoin_logo.svg/256px-Litecoin_logo.svg.png',
  BNB: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Binance_logo.svg/256px-Binance_logo.svg.png',
  DOT: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Polkadot_Move_logo.svg/256px-Polkadot_Move_logo.svg.png',
  AVAX: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Avalanche_logo_without_text.svg/256px-Avalanche_logo_without_text.svg.png',
}

// ─── Domain mappings: symbol → website domain ────────────────
const SYMBOL_DOMAIN_MAP = {
  // ═══ NIFTY 50 / Major IN Stocks ═══
  RELIANCE: 'relianceindustries.com', TCS: 'tcs.com', HDFCBANK: 'hdfcbank.com',
  INFY: 'infosys.com', ICICIBANK: 'icicibank.com', SBIN: 'sbi.co.in',
  BAJFINANCE: 'bajajfinserv.in', BHARTIARTL: 'bharti.in',
  KOTAKBANK: 'kotak.com', WIPRO: 'wipro.com', HCLTECH: 'hcltech.com',
  AXISBANK: 'axisbank.com', LT: 'larsentoubro.com', ITC: 'itcportal.com',
  MARUTI: 'maruti.co.in', TITAN: 'titan.co.in', TATAMOTORS: 'tatamotors.com',
  TATASTEEL: 'tatasteel.com', ONGC: 'ongc.com', NTPC: 'ntpc.co.in',
  SUNPHARMA: 'sunpharma.com', ULTRACEMCO: 'ultratechindia.com',
  NESTLEIND: 'nestle.co.in', ASIANPAINT: 'asianpaints.com',
  POWERGRID: 'powergrid.in', COALINDIA: 'coalindia.in',
  ADANIENT: 'adani.com', ADANIPORTS: 'adaniports.com',
  'BAJAJ-AUTO': 'bajajauto.com', HEROMOTOCO: 'heromotoco.com',
  TATACONSUM: 'tataglobal.com', INDIGO: 'goindigo.in',
  DRREDDY: 'drreddys.com', CIPLA: 'cipla.com',
  APOLLOHOSP: 'apollohospitals.in', EICHERMOT: 'eicher.com',
  GRASIM: 'grasim.com', DIVISLAB: 'divis.com', TECHM: 'techmahindra.com',
  INDUSINDBK: 'indusind.com', POLYCAB: 'polycabindia.com',
  // ═══ NIFTY Next 50 / Midcap ═══
  DMART: 'dmart.in', SIEMENS: 'siemens.com', ABB: 'new.abb.com',
  HAVELLS: 'havells.com', GODREJCP: 'godrej.com', PIDILITIND: 'pidilite.com',
  BERGEPAINT: 'asianpaints.com', MUTHOOTFIN: 'muthootfinance.com',
  CHOLAFIN: 'cholamandalam.com', BAJAJFINSV: 'bajajfinserv.in',
  SRF: 'srf.com', AMBUJACEM: 'ambujacement.com', ACC: 'acc.com',
  GLENMARK: 'glenmarkpharma.com', LUPIN: 'lupin.com',
  BIOCON: 'biocon.com', AUROPHARMA: 'aurobindo.com',
  TORNTPHARM: 'torrentpharma.com', ALKEM: 'alkem.com',
  BOSCHLTD: 'bosch.co.in', MOTHERSON: 'motherson.com',
  EXIDEIND: 'exideindustries.com', CUMMINSIND: 'cummins.com',
  THERMAX: 'thermaxindia.com', VOLTAS: 'voltas.com',
  BLUEDART: 'bluedart.com', PERSISTENT: 'persistent.com',
  COFORGE: 'coforge.com', LTIM: 'ltimindtree.com', MPHASIS: 'mphasis.com',
  ZOMATO: 'zomato.com', PAYTM: 'paytm.com', NYKAA: 'nykaa.com',
  POLICYBAZAAR: 'policybazaar.com',
  // ═══ PSU / Banking ═══
  BANKBARODA: 'bankofbaroda.in', PNB: 'pnetbank.com',
  CANBK: 'canarabank.com', UNIONBANK: 'unionbankofindia.com',
  IDFCFIRSTB: 'idfcfirstbank.com', FEDERALBNK: 'federalbank.co.in',
  RBLBANK: 'rblbank.com', YESBANK: 'yesbank.in',
  BANDHANBNK: 'bandhanbank.com', MFSL: 'muthootcapital.com',
  SBILIFE: 'sbilife.co.in', HDFCLIFE: 'hdfclife.com',
  ICICIGI: 'icicilombard.com', ICICIPRULI: 'iciciprulialife.in',
  // ═══ Infrastructure / Power ═══
  RECLTD: 'recl.co.in', PFC: 'pfcindia.com', IRFC: 'irfc.co.in',
  HUDCO: 'hudco.co.in', NHPC: 'nhpcindia.com', SJVN: 'sjvnlimited.com',
  NLCINDIA: 'nlcindia.com', TATAPOWER: 'tatapower.com',
  ADANIGREEN: 'adanigreen.com', ADANITRANS: 'adanitransmission.com',
  ADANIPOWER: 'adanipower.com', TORNTPOWER: 'torrentpower.com',
  // ═══ Metals ═══
  HINDALCO: 'hindalco.com', SAIL: 'sail.co.in', VEDL: 'vedanta.com',
  HINDZINC: 'vedanta.com', NMDC: 'nmdc.co.in', JSWSTEEL: 'jsw.in',
  JINDALSTEL: 'jindalstainless.com',
  // ═══ IT / Tech ═══
  BSOFT: 'bfractal.com', ZENSAR: 'zensar.com', INFOEDGE: 'infoedge.com',
  JUSTDIAL: 'justdial.com', TATACOMM: 'tatatele.com',
  VODAIDEA: 'vi.com', CONCOR: 'concorindia.com',
  // ═══ Pharma ═══
  IPCALAB: 'ipcalab.com', LALPATHLAB: 'lalpathlabs.com',
  METROPOLIS: 'metropolisindia.com',
  // ═══ US Stocks ═══
  AAPL: 'apple.com', MSFT: 'microsoft.com', GOOGL: 'google.com',
  AMZN: 'amazon.com', NVDA: 'nvidia.com', META: 'meta.com',
  TSLA: 'tesla.com', JPM: 'jpmorgan.com', V: 'visa.com',
  WMT: 'walmart.com', UNH: 'unitedhealthgroup.com',
  JNJ: 'jnj.com', XOM: 'exxonmobil.com', PG: 'pg.com',
  BRKB: 'berkshirehathaway.com', MA: 'mastercard.com',
  HD: 'homedepot.com', BAC: 'bankofamerica.com',
  CRM: 'salesforce.com', NFLX: 'netflix.com',
  AMD: 'amd.com', INTC: 'intel.com', PYPL: 'paypal.com',
  DIS: 'waltdisneycompany.com', NKE: 'nike.com', COST: 'costco.com',
  // ═══ Crypto ═══
  BTC: 'bitcoin.org', ETH: 'ethereum.org', XRP: 'ripple.com',
  BNB: 'binance.com', SOL: 'solana.com', ADA: 'cardano.org',
  DOGE: 'dogecoin.com', DOT: 'polkadot.network', AVAX: 'avax.network',
  LINK: 'chain.link', MATIC: 'polygon.technology', UNI: 'uniswap.org',
  ATOM: 'cosmos.network', FIL: 'filecoin.io', NEO: 'neo.org',
  LTC: 'litecoin.org', XLM: 'stellar.org', TRX: 'tron.network',
  NEAR: 'near.org', APT: 'aptos.foundation', ARB: 'arbitrum.io',
  OP: 'optimism.io', INJ: 'injective.com', SUI: 'sui.io',
  // ═══ ETFs — mapped to AMC provider ═══
  NIFTYBEES: 'motilaloswal.com', BANKBEES: 'motilaloswal.com',
  JUNIORBEES: 'motilaloswal.com', GOLDBEES: 'motilaloswal.com',
  SILVERBEES: 'motilaloswal.com', MIDCAPBEES: 'motilaloswal.com',
  PSUBANKBEES: 'motilaloswal.com', ITBEES: 'motilaloswal.com',
  PHARMABEES: 'motilaloswal.com', NIFTYBETF: 'nseindia.com',
  // ═══ MF AMC Houses ═══
  'SBI MF': 'sbimf.com', 'HDFC MF': 'hdfcfund.com',
  'Axis MF': 'axisamc.com', 'Mirae Asset': 'miraeasset.com',
  'ICICI Prudential': 'icicigic.com', 'Nippon India': 'nipponindia.com',
  'UTI': 'utimf.com', 'quant MF': 'quant.in',
  'Aditya Birla': 'adityabirlamf.com', 'Kotak MF': 'kotakmf.com',
  'DSP MF': 'dspim.com', 'Motilal Oswal': 'motilaloswal.com',
  'Franklin Templeton': 'franklintempleton.com', 'Tata MF': 'tatamutualfund.com',
  'Canara Robeco': 'canararobeco.com', 'PGIM India': 'pgimindia.com',
  'Bandhan MF': 'bandhanamc.com', 'HSBC MF': 'hsbc.co.in',
  'Invesco MF': 'invesco.com', 'Edelweiss MF': 'edelweissmf.com',
}

// ─── Color palette for fallback initials ─────────────────────
const COLORS = [
  '#e53935', '#d81b60', '#8e24aa', '#5e35b1', '#3949ab',
  '#1e88e5', '#039be5', '#00acc1', '#00897b', '#43a047',
  '#7cb342', '#c0ca33', '#fdd835', '#ffb300', '#fb8c00',
  '#f4511e', '#6d4c41', '#757575', '#546e7a', '#1a73e8',
]

function getColor(sym) {
  let hash = 0
  const s = String(sym).toUpperCase()
  for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getInitials(name) {
  if (!name) return '?'
  const words = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

// ─── Multi-source logo URL chain ────────────────────────────
function getLogoUrls(sym, domain) {
  const direct = DIRECT_LOGO_MAP[sym]
  const urls = []

  // Source 1: Direct logo URL (highest reliability)
  if (direct) urls.push(direct)

  // Source 2: Clearbit Logo API
  if (domain) urls.push(`https://logo.clearbit.com/${domain}?size=64&format=png`)

  // Source 3: Google S2 Favicon API (works with any domain)
  if (domain) urls.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`)

  return urls
}

function CompanyLogo({
  symbol,
  name,
  size = 36,
  borderRadius,
  style = {},
}) {
  const [errorIdx, setErrorIdx] = useState(0)

  const sym = (symbol || '').toUpperCase()
  const domain = SYMBOL_DOMAIN_MAP[sym]
  const urls = useMemo(() => getLogoUrls(sym, domain), [sym, domain])
  const bg = useMemo(() => getColor(sym), [sym])
  const br = borderRadius ?? size * 0.28
  const initials = useMemo(() => getInitials(name || sym), [name, sym])

  const currentUrl = errorIdx < urls.length ? urls[errorIdx] : null
  const showFallback = !currentUrl

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: br,
        background: showFallback ? bg : '#f1f3f4',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      {currentUrl && (
        <img
          key={`${sym}-${errorIdx}`}
          src={currentUrl}
          alt={sym}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setErrorIdx(prev => prev + 1)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: size > 40 ? 2 : 0,
          }}
        />
      )}
      {showFallback && (
        <span
          style={{
            fontSize: size * 0.36,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: -0.5,
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {initials}
        </span>
      )}
    </div>
  )
}

export default memo(CompanyLogo)

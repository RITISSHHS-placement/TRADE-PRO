/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tickertape-inspired palette
        primary:  { DEFAULT:'#0B1437', 50:'#EEF0F7', 100:'#D0D4E8', 200:'#A1A9D1', 300:'#717EBA', 400:'#4253A3', 500:'#2D3F8E', 600:'#1E2E78', 700:'#0F1F62', 800:'#0B1437', 900:'#070D25' },
        tt:       { green:'#00B386', 'green-light':'#E6F9F4', 'green-dark':'#007A5E', red:'#E84040', 'red-light':'#FEF0F0', 'red-dark':'#B52B2B', amber:'#F5A623', 'amber-light':'#FEF7E6', blue:'#1E3A8A', 'blue-light':'#EFF3FF' },
        // Keep bull/bear for compatibility
        bull:     { DEFAULT:'#00B386', light:'#00D4A0', dark:'#007A5E', dim:'#E6F9F4' },
        bear:     { DEFAULT:'#E84040', light:'#FF5555', dark:'#B52B2B', dim:'#FEF0F0' },
        navy:     { DEFAULT:'#0B1437', 400:'#2D4A8E', 500:'#1E3A7A', 600:'#0B1437', 700:'#070D25' },
      },
      fontFamily: {
        sans:    ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'IBM Plex Mono', 'monospace'],
        display: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'tt-card': '0 1px 3px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        'tt-hover':'0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        'tt-nav':  '0 1px 0 rgba(0,0,0,0.08)',
        'bull':    '0 4px 12px rgba(0,179,134,0.2)',
        'bear':    '0 4px 12px rgba(232,64,64,0.2)',
        'navy':    '0 4px 14px rgba(11,20,55,0.25)',
      },
      animation: {
        'marquee':  'marquee 40s linear infinite',
        'fade-up':  'fadeUp 0.4s ease both',
        'pulse-dot':'pulseDot 1.6s ease-in-out infinite',
        'spin-slow':'spin 1s linear infinite',
      },
      keyframes: {
        marquee:  { '0%': { transform:'translateX(0)' }, '100%': { transform:'translateX(-50%)' } },
        fadeUp:   { from:{ opacity:0, transform:'translateY(8px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        pulseDot: { '0%,100%':{ opacity:1 }, '50%':{ opacity:0.3 } },
      },
      borderRadius: { 'tt':'8px', 'tt-lg':'12px', 'tt-xl':'16px' },
    },
  },
  plugins: [],
}

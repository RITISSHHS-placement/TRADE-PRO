/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // From the bull-bear image
        navy:   { DEFAULT: '#0f2040', 50: '#e8edf5', 100: '#c5d0e4', 200: '#8fa4c8', 300: '#5a78ac', 400: '#2e5090', 500: '#1a3a70', 600: '#0f2040', 700: '#0a1830', 800: '#060e1e', 900: '#030810' },
        bull:   { DEFAULT: '#16a34a', light: '#22c55e', dark: '#15803d', dim: '#dcfce7' },
        bear:   { DEFAULT: '#dc2626', light: '#ef4444', dark: '#b91c1c', dim: '#fee2e2' },
        amber:  { DEFAULT: '#d97706', light: '#f59e0b', dark: '#b45309', dim: '#fef3c7' },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'monospace'],
        body:    ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'bull': '0 4px 14px rgba(22, 163, 74, 0.25)',
        'bear': '0 4px 14px rgba(220, 38, 38, 0.25)',
        'navy': '0 8px 32px rgba(15, 32, 64, 0.15)',
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.05)',
      },
      animation: {
        'marquee':   'marquee 32s linear infinite',
        'fade-up':   'fadeUp 0.5s ease both',
        'pulse-dot': 'pulseDot 1.6s ease-in-out infinite',
        'float':     'float 3s ease-in-out infinite',
      },
      keyframes: {
        marquee:  { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        fadeUp:   { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.35 } },
        float:    { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
}

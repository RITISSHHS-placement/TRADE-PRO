import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  base: '/',

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/backend': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Strip /backend and add /api so the path matches backend controller mappings.
        // e.g. /backend/trades/place  → http://localhost:8080/api/trades/place
        //      /backend/auth/login    → http://localhost:8080/api/auth/login
        //      /backend/market/indices → http://localhost:8080/api/market/indices
        rewrite: (path) => path.replace(/^\/backend/, '/api'),
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react'
          if (id.includes('node_modules/react-router-dom/')) return 'router'
          if (id.includes('node_modules/@reduxjs/toolkit/') || id.includes('node_modules/react-redux/')) return 'redux'
          if (id.includes('node_modules/recharts/')) return 'charts'
          if (id.includes('node_modules/gsap/')) return 'gsap'
          if (id.includes('node_modules/lucide-react/')) return 'icons'
          if (id.includes('node_modules/axios/') || id.includes('node_modules/react-hot-toast/')) return 'utils'
        },
      },
    },
  },
})

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
        rewrite: (path) => path.replace(/^\/backend/, '/api'),
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react'
          }
          if (id.includes('node_modules/react-router-dom/')) {
            return 'router'
          }
          if (id.includes('node_modules/@reduxjs/toolkit/') || id.includes('node_modules/react-redux/')) {
            return 'redux'
          }
          if (id.includes('node_modules/recharts/')) {
            return 'charts'
          }
        },
      },
    },
  },
})

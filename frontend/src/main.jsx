import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { store } from './store'
import { injectStore, injectActions } from './services/api'
import { logoutUser, refreshToken } from './store/slices/authSlice'
import './assets/styles/global.css'

injectStore(store)
injectActions(logoutUser, refreshToken)

// Apply saved theme
try { document.documentElement.setAttribute('data-theme', localStorage.getItem('tp-theme') || 'dark') } catch {}
store.subscribe(() => {
  const theme = store.getState().ui?.theme || 'dark'
  document.documentElement.setAttribute('data-theme', theme)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" toastOptions={{
        style: { background:'#18181b', color:'#fff', border:'1px solid #3f3f46', borderRadius:'8px', fontSize:'13px' },
        success: { iconTheme: { primary:'#2dd4bf', secondary:'#18181b' } },
        error:   { iconTheme: { primary:'#f43f5e', secondary:'#18181b' } },
      }}/>
    </BrowserRouter>
  </React.StrictMode>
)

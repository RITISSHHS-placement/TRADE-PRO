import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { store } from './store'
import { injectStore, injectActions } from './services/api'
import { logoutUser, refreshToken } from './store/slices/authSlice'
import { ToastProvider } from './components/Toast'
import './assets/styles/global.css'

injectStore(store)
injectActions(logoutUser, refreshToken)

try {
  document.documentElement.setAttribute('data-theme', localStorage.getItem('tp-theme') || 'dark')
} catch {}

store.subscribe(() => {
  const theme = store.getState().ui?.theme || 'dark'
  document.documentElement.setAttribute('data-theme', theme)
})

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', background: '#1a0000', color: '#ff6b6b', minHeight: '100vh' }}>
          <h2>Runtime Error — check this:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{this.state.error?.stack || String(this.state.error)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <App />
          <Toaster position="top-right" toastOptions={{
            style: { background:'#18181b', color:'#fff', border:'1px solid #3f3f46', borderRadius:'8px', fontSize:'13px' },
            success: { iconTheme: { primary:'#2dd4bf', secondary:'#18181b' } },
            error:   { iconTheme: { primary:'#f43f5e', secondary:'#18181b' } },
          }}/>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)

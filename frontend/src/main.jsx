import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { store } from './store'
import { injectStore, injectActions } from './services/api'
import { logoutUser, refreshToken } from './store/slices/authSlice'
import './assets/styles/global.css'

// Break circular dependency — inject store after it's created
injectStore(store)
injectActions(logoutUser, refreshToken)

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#080810', color: '#ff4d6a', minHeight: '100vh', padding: 40, fontFamily: 'monospace' }}>
          <h2 style={{ color: '#fff', marginBottom: 16 }}>⚠️ TradePro crashed — error details:</h2>
          <pre style={{ background: '#13131f', padding: 24, borderRadius: 12, color: '#ff4d6a', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error?.toString()}{'\n\n'}{this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#13131f',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#00d084', secondary: '#13131f' } },
            error: { iconTheme: { primary: '#ff4d6a', secondary: '#13131f' } },
          }}
        />
      </BrowserRouter>
    </Provider>
    </ErrorBoundary>
  </React.StrictMode>
)

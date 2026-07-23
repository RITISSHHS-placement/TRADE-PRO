import axios from 'axios'

// Lazy store getter — breaks the circular dependency between
// store/index.js → authSlice → api.js → store/index.js
let _store
export const injectStore = (s) => { _store = s }
const getStore = () => _store

// Lazy action getters for the same reason
let _logoutUser, _refreshToken
export const injectActions = (logoutFn, refreshFn) => {
  _logoutUser = logoutFn
  _refreshToken = refreshFn
}

const BASE_URL = import.meta.env.VITE_API_URL || '/backend'

// ---- Axios Instance ----
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,  // 60s — Render free tier cold start can take 30-45s
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // include HttpOnly auth cookies
})

// Request interceptor — attach Authorization header if token exists in localStorage
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('tp-token')
    if (token && token !== 'cookie') {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch (_) {}
  return config
})


// Response interceptor — handle 401 with refresh
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
                return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

        try {
        await getStore().dispatch(_refreshToken())
        processQueue(null, null)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        getStore().dispatch(_logoutUser())
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ---- Auth API ----
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  setupTotp: () => api.post('/auth/setup-totp'),
  verifyTotp: (token) => api.post('/auth/verify-totp', { token }),
}

// ---- Trade API ----
export const tradeAPI = {
  placeTrade: (trade) => api.post('/trades/place', trade),
  getMyTrades: () => api.get('/trades/my'),
  getMyPositions: () => api.get('/trades/positions'),
  cancelTrade: (tradeId) => api.delete(`/trades/${tradeId}/cancel`),
  getTotalPnl: () => api.get('/trades/pnl'),
}

// ---- User API ----
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  toggleKillSwitch: (activate) =>
    api.post(`/users/kill-switch?activate=${activate}`),
  updateRiskProfile: (profile) =>
    api.put(`/users/risk-profile?profile=${profile}`),
  updateAutoLogout: (minutes) =>
    api.put(`/users/auto-logout?minutes=${minutes}`),
  toggleNudges: (enabled) =>
    api.put(`/users/nudges?enabled=${enabled}`),
}

export default api

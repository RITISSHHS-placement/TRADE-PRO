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
})

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = getStore()?.getState().auth.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

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
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await getStore().dispatch(_refreshToken())
        const newToken = getStore().getState().auth.token
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
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
  logout: (token) => api.post('/auth/logout', null, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  setupTotp: (userId) => api.post('/auth/setup-totp', { userId }),
  verifyTotp: (userId, token) => api.post('/auth/verify-totp', { userId, token }),
}

// ---- Trade API ----
export const tradeAPI = {
  placeTrade: (userId, trade) => api.post(`/trades/place/${userId}`, trade),
  getUserTrades: (userId) => api.get(`/trades/user/${userId}`),
  getPositions: (userId) => api.get(`/trades/positions/${userId}`),
  cancelTrade: (tradeId, userId) => api.delete(`/trades/${tradeId}/cancel/${userId}`),
  getTotalPnl: (userId) => api.get(`/trades/pnl/${userId}`),
}

// ---- User API ----
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  toggleKillSwitch: (userId, activate) =>
    api.post(`/users/${userId}/kill-switch?activate=${activate}`),
  updateRiskProfile: (userId, profile) =>
    api.put(`/users/${userId}/risk-profile?profile=${profile}`),
  updateAutoLogout: (userId, minutes) =>
    api.put(`/users/${userId}/auto-logout?minutes=${minutes}`),
  toggleNudges: (userId, enabled) =>
    api.put(`/users/${userId}/nudges?enabled=${enabled}`),
}

export default api

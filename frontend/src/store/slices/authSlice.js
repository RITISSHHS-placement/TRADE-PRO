import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'

// ── Helpers ──────────────────────────────────────────────────────────
const STORAGE_KEY_TOKEN = 'tp-token'
const STORAGE_KEY_USER  = 'tp-user'

function persist(token, user) {
  try {
    // Use secure cookies for auth state whenever possible.
    // Only persist a bearer token if the session is explicit and not cookie-based.
    if (token && token !== 'cookie') localStorage.setItem(STORAGE_KEY_TOKEN, token)
    else localStorage.removeItem(STORAGE_KEY_TOKEN)
    if (user) localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user))
  } catch (_) {}
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    localStorage.removeItem(STORAGE_KEY_USER)
  } catch (_) {}
}

// Load persisted state
let savedToken = null
let savedUser  = null
try {
  const raw = localStorage.getItem(STORAGE_KEY_USER)
  if (raw) savedUser = JSON.parse(raw)
  savedToken = localStorage.getItem(STORAGE_KEY_TOKEN) || null
  // If we have a user but no token it was a cookie-auth session
  if (savedUser && !savedToken) savedToken = 'cookie'
} catch {
  savedToken = null
  savedUser  = null
}

// ── Thunks ───────────────────────────────────────────────────────────

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const res = await authAPI.register(data)
      return res.data.data   // { token, refreshToken, user }
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout'))
        return rejectWithValue('Server is waking up — please try again in 10 seconds')
      return rejectWithValue(err.response?.data?.message || err.message || 'Registration failed')
    }
  }
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async (data, { rejectWithValue }) => {
    try {
      // data may be { email, password } (credential login)
      // OR { user } (pre-verified OTP login — injected directly)
      if (data?.user !== undefined) {
        return data
      }
      const res = await authAPI.login(data)
      return res.data.data   // { token, refreshToken, user }
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout'))
        return rejectWithValue('Server is waking up — please try again in 10 seconds')
      return rejectWithValue(err.response?.data?.message || err.message || 'Login failed')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    try { await authAPI.logout() } catch (_) {}
    clearStorage()
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.refresh()
      return res.data.data
    } catch (err) {
      clearStorage()
      return rejectWithValue('Session expired')
    }
  }
)

// ── Slice ─────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:          savedUser,
    token:         savedToken,
    loading:       false,
    error:         null,
    totpRequired:  false,
  },
  reducers: {
    clearError:    (state)         => { state.error = null },
    requireTotp:   (state)         => { state.totpRequired = true },
    clearTotp:     (state)         => { state.totpRequired = false },
    setUser:       (state, action) => {
      state.user = action.payload
      try { localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(action.payload)) } catch (_) {}
    },
  },
  extraReducers: (builder) => {

    // ── Register ──
    builder
      .addCase(registerUser.pending,   (s) => { s.loading = true;  s.error = null })
      .addCase(registerUser.fulfilled, (s, { payload }) => {
        s.loading = false
        s.token   = 'cookie'
        s.user    = payload?.user || payload
        persist(s.token, s.user)
        toast.success('Account created! Welcome to TradePro.')
      })
      .addCase(registerUser.rejected,  (s, { payload }) => {
        s.loading = false
        s.error   = payload
        toast.error(payload)
      })

    // ── Login ──
    builder
      .addCase(loginUser.pending,   (s) => { s.loading = true;  s.error = null })
      .addCase(loginUser.fulfilled, (s, { payload }) => {
        s.loading = false
        s.token   = 'cookie'
        s.user    = payload?.user || payload
        persist(s.token, s.user)
        toast.success('Welcome back!')
      })
      .addCase(loginUser.rejected,  (s, { payload }) => {
        s.loading = false
        s.error   = payload
        toast.error(payload)
      })

    // ── Logout ──
    builder
      .addCase(logoutUser.fulfilled, (s) => {
        s.user  = null
        s.token = null
        toast.success('Logged out safely.')
      })

    // ── Refresh ──
    builder
      .addCase(refreshToken.fulfilled, (s, { payload }) => {
        s.token = 'cookie'
        s.user  = payload?.user  || s.user
        persist(s.token, s.user)
      })
      .addCase(refreshToken.rejected, (s) => {
        s.user  = null
        s.token = null
      })
  },
})

export const { clearError, setUser, requireTotp, clearTotp } = authSlice.actions
export default authSlice.reducer

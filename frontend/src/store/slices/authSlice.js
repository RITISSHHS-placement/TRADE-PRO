import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'

// Load persisted auth from localStorage (guarded for SSR / private mode)
let savedToken = null
let savedUser = null
try {
  const localUser = localStorage.getItem('tp-user')
  const localToken = localStorage.getItem('tp-token')
  if (localUser) {
    savedUser = JSON.parse(localUser)
    savedToken = localToken || 'cookie'
  }
} catch {
  savedToken = null
  savedUser = null
}

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const res = await authAPI.register(data)
      return res.data.data
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        return rejectWithValue('Server is waking up — please try again in 10 seconds')
      }
      return rejectWithValue(err.response?.data?.message || err.message || 'Registration failed')
    }
  }
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async (data, { rejectWithValue }) => {
    try {
      const res = await authAPI.login(data)
      return res.data.data
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        return rejectWithValue('Server is waking up — please try again in 10 seconds')
      }
      return rejectWithValue(err.response?.data?.message || err.message || 'Login failed')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    try {
      await authAPI.logout()
    } catch (_) {}
    try {
      localStorage.removeItem('tp-user')
      localStorage.removeItem('tp-token')
    } catch (_) {}
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.refresh()
      return res.data.data
    } catch (err) {
      try {
        localStorage.removeItem('tp-user')
        localStorage.removeItem('tp-token')
      } catch (_) {}
      return rejectWithValue('Session expired')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: savedUser,
    token: savedToken || null,
    loading: false,
    error: null,
    totpRequired: false,
  },
  reducers: {
    clearError: (state) => { state.error = null },
    setUser: (state, action) => {
      state.user = action.payload
      try { localStorage.setItem('tp-user', JSON.stringify(action.payload)) } catch (_) {}
    },
    requireTotp: (state) => { state.totpRequired = true },
    clearTotp: (state) => { state.totpRequired = false },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        const tokenVal = action.payload.token || 'cookie'
        state.token = tokenVal
        state.user = action.payload.user || action.payload
        try {
          localStorage.setItem('tp-user', JSON.stringify(state.user))
          if (action.payload.token) localStorage.setItem('tp-token', action.payload.token)
        } catch (_) {}
        toast.success('Account created! Welcome to TradePro.')
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })

    // Login
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        const tokenVal = action.payload.token || 'cookie'
        state.token = tokenVal
        state.user = action.payload.user || action.payload
        try {
          localStorage.setItem('tp-user', JSON.stringify(state.user))
          if (action.payload.token) localStorage.setItem('tp-token', action.payload.token)
        } catch (_) {}
        toast.success('Welcome back!')
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        toast.success('Logged out safely.')
      })

    // Refresh
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        const tokenVal = action.payload.token || state.token || 'cookie'
        state.token = tokenVal
        state.user = action.payload.user || state.user
        if (state.user) {
          try {
            localStorage.setItem('tp-user', JSON.stringify(state.user))
            if (action.payload.token) localStorage.setItem('tp-token', action.payload.token)
          } catch (_) {}
        }
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null
        state.token = null
        try {
          localStorage.removeItem('tp-user')
          localStorage.removeItem('tp-token')
        } catch (_) {}
      })
  },
})

export const { clearError, setUser, requireTotp, clearTotp } = authSlice.actions
export default authSlice.reducer

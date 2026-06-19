import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'

// Load persisted auth from localStorage
const savedToken = localStorage.getItem('tp_token')
const savedUser = localStorage.getItem('tp_user')

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const res = await authAPI.register(data)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed')
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
      return rejectWithValue(err.response?.data?.message || 'Login failed')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    const token = getState().auth.token
    try {
      await authAPI.logout(token)
    } catch (_) {}
    localStorage.removeItem('tp_token')
    localStorage.removeItem('tp_refresh')
    localStorage.removeItem('tp_user')
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refresh',
  async (_, { getState, rejectWithValue }) => {
    const refresh = localStorage.getItem('tp_refresh')
    if (!refresh) return rejectWithValue('No refresh token')
    try {
      const res = await authAPI.refresh(refresh)
      return res.data.data
    } catch (err) {
      return rejectWithValue('Session expired')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken || null,
    loading: false,
    error: null,
    totpRequired: false,
  },
  reducers: {
    clearError: (state) => { state.error = null },
    setUser: (state, action) => { state.user = action.payload },
    requireTotp: (state) => { state.totpRequired = true },
    clearTotp: (state) => { state.totpRequired = false },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.user = action.payload.user
        localStorage.setItem('tp_token', action.payload.token)
        localStorage.setItem('tp_refresh', action.payload.refreshToken)
        localStorage.setItem('tp_user', JSON.stringify(action.payload.user))
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
        state.token = action.payload.token
        state.user = action.payload.user
        localStorage.setItem('tp_token', action.payload.token)
        localStorage.setItem('tp_refresh', action.payload.refreshToken)
        localStorage.setItem('tp_user', JSON.stringify(action.payload.user))
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
        state.token = action.payload.token
        state.user = action.payload.user
        localStorage.setItem('tp_token', action.payload.token)
        localStorage.setItem('tp_refresh', action.payload.refreshToken)
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null
        state.token = null
        localStorage.clear()
      })
  },
})

export const { clearError, setUser, requireTotp, clearTotp } = authSlice.actions
export default authSlice.reducer

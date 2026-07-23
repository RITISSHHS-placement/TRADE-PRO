import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'

// Load persisted auth from localStorage (guarded for SSR / private mode)
let savedToken = null
let savedUser = null
try {
  // Removed localStorage usage for tokens
  // Implement cookie-based auth flow here
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
    const token = getState().auth.token
    try {
      await authAPI.logout(token)
    } catch (_) {}
    // Removed localStorage cleanup for tokens
    // Implement cookie cleanup here
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refresh',
  async (_, { getState, rejectWithValue }) => {
    // Removed localStorage usage for refresh token
    try {
      const res = await authAPI.refresh()
      return res.data.data
    } catch (err) {
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
        // Implement cookie storage for tokens and user data here
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
        // Implement cookie storage for tokens and user data here
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
        // Implement cookie storage for tokens here
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null
        state.token = null
        // Implement cookie cleanup here
      })
  },
})

export const { clearError, setUser, requireTotp, clearTotp } = authSlice.actions
export default authSlice.reducer

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { tradeAPI } from '../../services/api'
import toast from 'react-hot-toast'

export const fetchTrades = createAsyncThunk(
  'trades/fetchAll',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await tradeAPI.getUserTrades(userId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch trades')
    }
  }
)

export const fetchPositions = createAsyncThunk(
  'trades/fetchPositions',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await tradeAPI.getPositions(userId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch positions')
    }
  }
)

export const placeTrade = createAsyncThunk(
  'trades/place',
  async ({ userId, trade }, { rejectWithValue }) => {
    try {
      const res = await tradeAPI.placeTrade(userId, trade)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Order failed')
    }
  }
)

export const cancelTrade = createAsyncThunk(
  'trades/cancel',
  async ({ tradeId, userId }, { rejectWithValue }) => {
    try {
      const res = await tradeAPI.cancelTrade(tradeId, userId)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Cancel failed')
    }
  }
)

const tradeSlice = createSlice({
  name: 'trades',
  initialState: {
    list: [],
    positions: [],
    loading: false,
    placing: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrades.pending, (state) => { state.loading = true })
      .addCase(fetchTrades.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload || []
      })
      .addCase(fetchTrades.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(fetchPositions.fulfilled, (state, action) => {
        state.positions = action.payload || []
      })

      .addCase(placeTrade.pending, (state) => { state.placing = true })
      .addCase(placeTrade.fulfilled, (state, action) => {
        state.placing = false
        state.list.unshift(action.payload)
        toast.success('Order placed successfully!')
      })
      .addCase(placeTrade.rejected, (state, action) => {
        state.placing = false
        toast.error(action.payload)
      })

      .addCase(cancelTrade.fulfilled, (state, action) => {
        const idx = state.list.findIndex(t => t.id === action.payload.id)
        if (idx !== -1) state.list[idx] = action.payload
        toast.success('Order cancelled')
      })
  },
})

export const { clearError } = tradeSlice.actions
export default tradeSlice.reducer

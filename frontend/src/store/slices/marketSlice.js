import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchQuotes, fetchIntradayChart, DEFAULT_SYMBOLS } from '../../services/marketData'

// Fetch all quotes
export const loadQuotes = createAsyncThunk(
  'market/loadQuotes',
  async (symbols = DEFAULT_SYMBOLS, { rejectWithValue }) => {
    try {
      return await fetchQuotes(symbols)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

// Fetch NIFTY intraday chart
export const loadIntradayChart = createAsyncThunk(
  'market/loadIntradayChart',
  async (symbol = '^NSEI', { rejectWithValue }) => {
    try {
      return await fetchIntradayChart(symbol)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

const marketSlice = createSlice({
  name: 'market',
  initialState: {
    quotes: {},          // symbol → QuoteData
    chart: [],           // [{time, value}] intraday chart data
    chartSymbol: '^NSEI',
    loading: false,
    chartLoading: false,
    error: null,
    lastUpdated: null,
  },
  reducers: {
    setChartSymbol: (state, action) => {
      state.chartSymbol = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Quotes
      .addCase(loadQuotes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadQuotes.fulfilled, (state, action) => {
        state.loading = false
        state.quotes = action.payload
        state.lastUpdated = Date.now()
      })
      .addCase(loadQuotes.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Chart
      .addCase(loadIntradayChart.pending, (state) => {
        state.chartLoading = true
      })
      .addCase(loadIntradayChart.fulfilled, (state, action) => {
        state.chartLoading = false
        if (action.payload.length > 0) {
          state.chart = action.payload
        }
      })
      .addCase(loadIntradayChart.rejected, (state) => {
        state.chartLoading = false
      })
  },
})

export const { setChartSymbol } = marketSlice.actions
export default marketSlice.reducer

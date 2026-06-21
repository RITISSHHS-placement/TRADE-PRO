import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchQuotes, fetchIntradayChart, fetchMFList, fetchMFNav, DEFAULT_SYMBOLS } from '../../services/marketData'

// Fetch quotes for any symbol list
export const loadQuotes = createAsyncThunk(
  'market/loadQuotes',
  async (symbols = DEFAULT_SYMBOLS, { rejectWithValue }) => {
    try { return await fetchQuotes(symbols) }
    catch (err) { return rejectWithValue(err.message) }
  }
)

// Fetch intraday chart for one symbol
export const loadIntradayChart = createAsyncThunk(
  'market/loadIntradayChart',
  async (symbol = '^NSEI', { rejectWithValue }) => {
    try { return { symbol, data: await fetchIntradayChart(symbol) } }
    catch (err) { return rejectWithValue(err.message) }
  }
)

// Fetch full MF list (scheme codes + names)
export const loadMFList = createAsyncThunk(
  'market/loadMFList',
  async (_, { rejectWithValue }) => {
    try { return await fetchMFList() }
    catch (err) { return rejectWithValue(err.message) }
  }
)

// Fetch NAV for a batch of scheme codes
export const loadMFNavBatch = createAsyncThunk(
  'market/loadMFNavBatch',
  async (codes, { rejectWithValue }) => {
    try {
      const results = await Promise.allSettled(codes.map(fetchMFNav))
      return results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

const marketSlice = createSlice({
  name: 'market',
  initialState: {
    quotes:      {},   // symbol → QuoteData
    charts:      {},   // symbol → [{time, value}]
    chartSymbol: '^NSEI',
    mfList:      [],   // [{schemeCode, schemeName}]
    mfNavs:      {},   // schemeCode → NavData
    mfSearch:    '',
    loading:     false,
    chartLoading: false,
    mfLoading:   false,
    error:       null,
    lastUpdated: null,
  },
  reducers: {
    setChartSymbol: (state, action) => { state.chartSymbol = action.payload },
    setMFSearch:    (state, action) => { state.mfSearch    = action.payload },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadQuotes.pending,    (state) => { state.loading = true; state.error = null })
      .addCase(loadQuotes.fulfilled,  (state, action) => {
        state.loading = false
        // Merge — never wipe existing quotes
        state.quotes = { ...state.quotes, ...action.payload }
        state.lastUpdated = Date.now()
      })
      .addCase(loadQuotes.rejected,   (state, action) => { state.loading = false; state.error = action.payload })

      .addCase(loadIntradayChart.pending,   (state) => { state.chartLoading = true })
      .addCase(loadIntradayChart.fulfilled, (state, action) => {
        state.chartLoading = false
        const { symbol, data } = action.payload
        if (data.length > 0) state.charts[symbol] = data
      })
      .addCase(loadIntradayChart.rejected,  (state) => { state.chartLoading = false })

      .addCase(loadMFList.pending,    (state) => { state.mfLoading = true })
      .addCase(loadMFList.fulfilled,  (state, action) => {
        state.mfLoading = false
        state.mfList = action.payload
      })
      .addCase(loadMFList.rejected,   (state) => { state.mfLoading = false })

      .addCase(loadMFNavBatch.fulfilled, (state, action) => {
        for (const nav of action.payload) {
          state.mfNavs[nav.schemeCode] = nav
        }
      })
  },
})

export const { setChartSymbol, setMFSearch } = marketSlice.actions
export default marketSlice.reducer

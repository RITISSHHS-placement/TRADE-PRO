import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchNSEIndices, fetchNifty50, fetchGainers, fetchLosers } from '../../services/marketData'

export const loadIndices = createAsyncThunk('market/loadIndices', async (_, { rejectWithValue }) => {
  try { return await fetchNSEIndices() }
  catch (e) { return rejectWithValue(e.message) }
})

export const loadNifty50 = createAsyncThunk('market/loadNifty50', async (_, { rejectWithValue }) => {
  try { return await fetchNifty50() }  // gainers + losers + mostactive combined
  catch (e) { return rejectWithValue(e.message) }
})

export const loadGainers = createAsyncThunk('market/loadGainers', async (_, { rejectWithValue }) => {
  try { return await fetchGainers() }
  catch (e) { return rejectWithValue(e.message) }
})

export const loadLosers = createAsyncThunk('market/loadLosers', async (_, { rejectWithValue }) => {
  try { return await fetchLosers() }
  catch (e) { return rejectWithValue(e.message) }
})

const marketSlice = createSlice({
  name: 'market',
  initialState: {
    indices:     {},   // index name → data (NIFTY 50, BANK NIFTY, VIX…)
    stocks:      {},   // symbol → data (from gainers/losers/mostactive)
    gainers:     [],
    losers:      [],
    loading:     false,
    error:       null,
    lastUpdated: null,
  },
  reducers: {},
  extraReducers: (b) => {
    b
      .addCase(loadIndices.pending,   (s) => { s.loading = true; s.error = null })
      .addCase(loadIndices.fulfilled, (s, a) => {
        s.loading = false
        s.indices = { ...s.indices, ...a.payload }
        s.lastUpdated = Date.now()
      })
      .addCase(loadIndices.rejected,  (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(loadNifty50.fulfilled, (s, a) => {
        // Merge stock prices — keep existing if new data is missing
        s.stocks = { ...s.stocks, ...a.payload }
        s.lastUpdated = Date.now()
      })
      .addCase(loadGainers.fulfilled, (s, a) => {
        s.gainers = a.payload
        // Also update stocks map with gainer prices
        for (const g of a.payload) {
          if (g.symbol) s.stocks[g.symbol] = { ...s.stocks[g.symbol], ...g }
        }
      })
      .addCase(loadLosers.fulfilled, (s, a) => {
        s.losers = a.payload
        for (const l of a.payload) {
          if (l.symbol) s.stocks[l.symbol] = { ...s.stocks[l.symbol], ...l }
        }
      })
  },
})

export default marketSlice.reducer

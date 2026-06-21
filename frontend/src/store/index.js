import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import tradeReducer from './slices/tradeSlice'
import uiReducer from './slices/uiSlice'
import marketReducer from './slices/marketSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    trades: tradeReducer,
    ui: uiReducer,
    market: marketReducer,
  },
})

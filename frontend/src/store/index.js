import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import tradeReducer from './slices/tradeSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    trades: tradeReducer,
    ui: uiReducer,
  },
})

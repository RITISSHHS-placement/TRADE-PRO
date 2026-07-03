import { createSlice } from '@reduxjs/toolkit'

// Persist theme to localStorage
const savedTheme = (() => {
  try { return localStorage.getItem('tp-theme') || 'light' } catch { return 'light' }
})()

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: false,
    activeTab:        'dashboard',
    orderPanelOpen:   false,
    killSwitchModal:  false,
    theme:            savedTheme,
  },
  reducers: {
    toggleSidebar:    (state) => { state.sidebarCollapsed = !state.sidebarCollapsed },
    setActiveTab:     (state, a) => { state.activeTab     = a.payload },
    setOrderPanel:    (state, a) => { state.orderPanelOpen = a.payload },
    setKillSwitchModal:(state, a) => { state.killSwitchModal = a.payload },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      try { localStorage.setItem('tp-theme', state.theme) } catch {}
    },
  },
})

export const {
  toggleSidebar, setActiveTab, setOrderPanel,
  setKillSwitchModal, toggleTheme,
} = uiSlice.actions
export default uiSlice.reducer

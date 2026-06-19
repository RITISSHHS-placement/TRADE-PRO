import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: false,
    activeTab: 'dashboard',
    orderPanelOpen: false,
    killSwitchModal: false,
    theme: 'dark', // TradePro is always dark — reserved for future
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarCollapsed = !state.sidebarCollapsed },
    setActiveTab: (state, action) => { state.activeTab = action.payload },
    setOrderPanel: (state, action) => { state.orderPanelOpen = action.payload },
    setKillSwitchModal: (state, action) => { state.killSwitchModal = action.payload },
  },
})

export const { toggleSidebar, setActiveTab, setOrderPanel, setKillSwitchModal } = uiSlice.actions
export default uiSlice.reducer

import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { loginUser, logoutUser, registerUser } from '../store/slices/authSlice'
import { placeTrade, fetchTrades, fetchPositions } from '../store/slices/tradeSlice'
import { setOrderPanel, setKillSwitchModal } from '../store/slices/uiSlice'
import { userAPI } from '../services/api'
import toast from 'react-hot-toast'

// ---- useAuth ----
export function useAuth() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, token, loading, error } = useSelector((state) => state.auth)

  const login = async (credentials) => {
    const result = await dispatch(loginUser(credentials))
    if (!result.error) navigate('/dashboard')
  }

  const register = async (data) => {
    const result = await dispatch(registerUser(data))
    if (!result.error) navigate('/dashboard')
  }

  const logout = async () => {
    await dispatch(logoutUser())
    navigate('/login')
  }

  return { user, token, loading, error, login, register, logout, isAuthenticated: !!token }
}

// ---- useTrades ----
export function useTrades() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { list, positions, loading, placing } = useSelector((state) => state.trades)

  const loadTrades = () => {
    if (user?.id) dispatch(fetchTrades(user.id))
  }

  const loadPositions = () => {
    if (user?.id) dispatch(fetchPositions(user.id))
  }

  const place = (trade) => {
    if (user?.id) dispatch(placeTrade({ userId: user.id, trade }))
  }

  return { trades: list, positions, loading, placing, loadTrades, loadPositions, place }
}

// ---- useKillSwitch ----
export function useKillSwitch() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { killSwitchModal } = useSelector((state) => state.ui)

  const activate = async () => {
    if (!user?.id) return
    try {
      await userAPI.toggleKillSwitch(user.id, true)
      toast.error('🛑 Kill Switch ACTIVATED — All trading halted', { duration: 5000 })
      dispatch(setKillSwitchModal(false))
    } catch (e) {
      toast.error('Failed to activate kill switch')
    }
  }

  const deactivate = async () => {
    if (!user?.id) return
    try {
      await userAPI.toggleKillSwitch(user.id, false)
      toast.success('Kill switch deactivated')
    } catch (e) {
      toast.error('Failed to deactivate kill switch')
    }
  }

  return {
    killSwitchModal,
    openModal: () => dispatch(setKillSwitchModal(true)),
    closeModal: () => dispatch(setKillSwitchModal(false)),
    activate,
    deactivate,
  }
}

// ---- useAutoLogout ----
export function useAutoLogout() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()

  const setupAutoLogout = () => {
    const minutes = user?.autoLogoutTime || 30
    const timer = setTimeout(() => {
      dispatch(logoutUser())
      navigate('/login')
      toast('Session expired — logged out automatically', { icon: '🔒' })
    }, minutes * 60 * 1000)

    // Reset on activity
    const reset = () => {
      clearTimeout(timer)
      setupAutoLogout()
    }
    window.addEventListener('mousemove', reset, { once: true })
    window.addEventListener('keypress', reset, { once: true })

    return () => clearTimeout(timer)
  }

  return { setupAutoLogout }
}

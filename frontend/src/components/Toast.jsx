import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react'
import { GlassCard } from './Glassmorphism'

// Simple className merger
const cn = (...classes) => classes.filter(Boolean).join(' ')

const ToastContext = createContext(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { ...toast, id }])
    
    // Auto dismiss after duration
    if (toast.duration !== Infinity) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 5000)
    }
    
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback((props) => {
    return addToast({ ...props, type: 'default' })
  }, [addToast])

  const success = useCallback((props) => {
    return addToast({ ...props, type: 'success' })
  }, [addToast])

  const error = useCallback((props) => {
    return addToast({ ...props, type: 'error' })
  }, [addToast])

  const info = useCallback((props) => {
    return addToast({ ...props, type: 'info' })
  }, [addToast])

  const warning = useCallback((props) => {
    return addToast({ ...props, type: 'warning' })
  }, [addToast])

  const loading = useCallback((props) => {
    return addToast({ ...props, type: 'loading', duration: Infinity })
  }, [addToast])

  const dismiss = useCallback((id) => {
    removeToast(id)
  }, [removeToast])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider
      value={{
        toast,
        success,
        error,
        info,
        warning,
        loading,
        dismiss,
        dismissAll,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

const ToastItem = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    return () => setIsVisible(false)
  }, [])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => onRemove(toast.id), 300)
  }

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    info: <Info className="w-5 h-5 text-indigo-400" />,
    loading: <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />,
    default: <Info className="w-5 h-5 text-white/60" />,
  }

  const colors = {
    success: 'border-green-500/30',
    error: 'border-red-500/30',
    warning: 'border-yellow-500/30',
    info: 'border-indigo-500/30',
    loading: 'border-indigo-500/30',
    default: 'border-white/20',
  }

  return (
    <GlassCard
      className={cn(
        'pointer-events-auto min-w-[320px] max-w-md p-4',
        'transition-all duration-300 ease-out',
        colors[toast.type] || colors.default,
        isVisible && !isExiting && 'translate-x-0 opacity-100',
        !isVisible && 'translate-x-full opacity-0',
        isExiting && 'translate-x-full opacity-0'
      )}
      intensity="light"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {icons[toast.type] || icons.default}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <div className="font-semibold text-white text-sm mb-1">
              {toast.title}
            </div>
          )}
          <div className="text-white/70 text-sm leading-relaxed">
            {toast.message}
          </div>
          {toast.action && (
            <button
              onClick={() => {
                toast.action.onClick?.()
                handleDismiss()
              }}
              className="mt-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        {toast.type !== 'loading' && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white/40 hover:text-white/60" />
          </button>
        )}
      </div>

      {/* Progress bar for auto-dismiss */}
      {toast.duration !== Infinity && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 rounded-b-xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all ease-linear"
            style={{
              width: '100%',
              animation: `toast-progress ${toast.duration || 5000}ms linear forwards`,
            }}
          />
        </div>
      )}
    </GlassCard>
  )
}

// Utility function to create toast with position
export const createToast = (type, message, options = {}) => {
  return {
    type,
    message,
    ...options,
  }
}

// Hook for programmatic toast access
export const toast = {
  success: (message, options) => createToast('success', message, options),
  error: (message, options) => createToast('error', message, options),
  info: (message, options) => createToast('info', message, options),
  warning: (message, options) => createToast('warning', message, options),
  loading: (message, options) => createToast('loading', message, { ...options, duration: Infinity }),
}

// Add CSS animation for progress bar
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes toast-progress {
      from { width: 100%; }
      to { width: 0%; }
    }
  `
  document.head.appendChild(style)
}

export default ToastProvider

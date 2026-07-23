import React from 'react'

// Simple className merger
const cn = (...classes) => classes.filter(Boolean).join(' ')

// Glass Card Component
export const GlassCard = ({ 
  children, 
  className, 
  intensity = 'medium',
  border = true,
  glow = false,
  ...props 
}) => {
  const intensities = {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.05)',
    heavy: 'rgba(255, 255, 255, 0.02)',
  }
  
  return (
    <div
      className={cn(
        'relative rounded-2xl backdrop-blur-xl',
        border && 'border border-white/10',
        glow && 'shadow-[0_0_40px_rgba(99,102,241,0.15)]',
        className
      )}
      style={{
        background: intensities[intensity],
        boxShadow: glow 
          ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 40px rgba(99, 102, 241, 0.15)' 
          : '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
      {...props}
    >
      {/* Gradient overlay */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

// Glass Button Component
export const GlassButton = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  className,
  ...props 
}) => {
  const variants = {
    primary: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30',
    secondary: 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10',
    success: 'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30',
    danger: 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30',
    ghost: 'bg-transparent border-transparent text-white/60 hover:bg-white/5',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  
  return (
    <button
      className={cn(
        'relative rounded-xl backdrop-blur-md border font-medium transition-all duration-200',
        'hover:scale-[1.02] active:scale-[0.98]',
        'shadow-lg hover:shadow-xl',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {/* Button glow effect */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle at center, rgba(99,102,241,0.3) 0%, transparent 70%)',
        }}
      />
    </button>
  )
}

// Glass Input Component
export const GlassInput = ({ 
  className,
  icon,
  error,
  ...props 
}) => {
  return (
    <div className="relative">
      <input
        className={cn(
          'w-full px-4 py-3 rounded-xl',
          'bg-white/5 border border-white/10',
          'backdrop-blur-md',
          'text-white placeholder-white/40',
          'focus:outline-none focus:border-indigo-500/50 focus:bg-white/10',
          'transition-all duration-200',
          error && 'border-red-500/50 focus:border-red-500/70',
          className
        )}
        {...props}
      />
      {icon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
          {icon}
        </div>
      )}
      {error && (
        <div className="absolute -bottom-5 left-0 text-xs text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}

// Glass Badge Component
export const GlassBadge = ({ 
  children, 
  variant = 'default',
  className,
  ...props 
}) => {
  const variants = {
    default: 'bg-white/10 border-white/20 text-white/80',
    success: 'bg-green-500/20 border-green-500/30 text-green-400',
    warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    danger: 'bg-red-500/20 border-red-500/30 text-red-400',
    info: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400',
  }
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium',
        'backdrop-blur-md border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

// Glass Modal Component
export const GlassModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md',
}) => {
  if (!isOpen) return null
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <GlassCard 
        className={cn('relative w-full', sizes[size])}
        intensity="heavy"
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">{children}</div>
      </GlassCard>
    </div>
  )
}

// Glass Avatar Component
export const GlassAvatar = ({ 
  src, 
  alt, 
  size = 'md',
  className,
  ...props 
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }
  
  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden',
        'bg-gradient-to-br from-indigo-500/20 to-purple-500/20',
        'border border-white/20 backdrop-blur-md',
        sizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/60 font-medium">
          {alt?.charAt(0)?.toUpperCase()}
        </div>
      )}
    </div>
  )
}

// Glass Progress Component
export const GlassProgress = ({ 
  value, 
  max = 100,
  variant = 'primary',
  className,
  ...props 
}) => {
  const variants = {
    primary: 'from-indigo-500 to-purple-500',
    success: 'from-green-500 to-emerald-500',
    warning: 'from-yellow-500 to-orange-500',
    danger: 'from-red-500 to-pink-500',
  }
  
  const percentage = Math.min((value / max) * 100, 100)
  
  return (
    <div
      className={cn(
        'relative h-2 rounded-full overflow-hidden',
        'bg-white/10 backdrop-blur-md',
        className
      )}
      {...props}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-500"
        style={{
          width: `${percentage}%`,
          background: `linear-gradient(90deg, ${variants[variant]})`,
        }}
      />
      {/* Glow effect */}
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r blur-sm opacity-50"
        style={{
          width: `${percentage}%`,
          background: `linear-gradient(90deg, ${variants[variant]})`,
        }}
      />
    </div>
  )
}

// Glass Skeleton Component
export const GlassSkeleton = ({ 
  className,
  variant = 'default',
  ...props 
}) => {
  const variants = {
    default: 'bg-white/10',
    circle: 'rounded-full',
    text: 'h-4',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 w-24 rounded-lg',
  }
  
  return (
    <div
      className={cn(
        'animate-pulse',
        'bg-gradient-to-r from-white/5 via-white/10 to-white/5',
        'bg-[length:200%_100%]',
        'backdrop-blur-sm',
        variants[variant],
        className
      )}
      style={{
        animation: 'shimmer 1.5s infinite',
      }}
      {...props}
    />
  )
}

// Glass Tooltip Component
export const GlassTooltip = ({ 
  children, 
  content,
  position = 'top',
  className,
}) => {
  const [isVisible, setIsVisible] = React.useState(false)
  
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-3 py-1.5 rounded-lg',
            'bg-black/80 backdrop-blur-md border border-white/10',
            'text-xs text-white/90 whitespace-nowrap',
            positions[position],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}

// Glass Divider Component
export const GlassDivider = ({ 
  orientation = 'horizontal',
  className,
  ...props 
}) => {
  return (
    <div
      className={cn(
        'backdrop-blur-sm',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
        'bg-gradient-to-r from-transparent via-white/20 to-transparent',
        className
      )}
      {...props}
    />
  )
}

// Glass Tab Component
export const GlassTabs = ({ 
  tabs, 
  activeTab, 
  onTabChange,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex p-1 rounded-xl bg-white/5 backdrop-blur-md border border-white/10',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            'relative overflow-hidden',
            activeTab === tab.id
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-white/60 hover:text-white/80 hover:bg-white/5'
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20" />
          )}
        </button>
      ))}
    </div>
  )
}

// Glass Switch Component
export const GlassSwitch = ({ 
  checked, 
  onChange,
  disabled = false,
  className,
}) => {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative w-12 h-6 rounded-full transition-all duration-300',
        'backdrop-blur-md border',
        checked 
          ? 'bg-indigo-500/30 border-indigo-500/50' 
          : 'bg-white/5 border-white/20',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div
        className={cn(
          'absolute top-1 w-4 h-4 rounded-full transition-all duration-300',
          'bg-white shadow-lg',
          checked ? 'left-7' : 'left-1'
        )}
      />
    </button>
  )
}

// Glass Notification Component
export const GlassNotification = ({ 
  type = 'info',
  title,
  message,
  onClose,
  className,
}) => {
  const types = {
    info: { icon: 'ℹ️', color: 'indigo' },
    success: { icon: '✓', color: 'green' },
    warning: { icon: '⚠', color: 'yellow' },
    error: { icon: '✕', color: 'red' },
  }
  
  const { icon, color } = types[type]
  
  return (
    <GlassCard
      className={cn('p-4 flex items-start gap-3', className)}
      intensity="light"
    >
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center text-lg',
        `bg-${color}-500/20 text-${color}-400`
      )}>
        {icon}
      </div>
      <div className="flex-1">
        {title && (
          <div className="font-medium text-white mb-1">{title}</div>
        )}
        <div className="text-sm text-white/60">{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </GlassCard>
  )
}

export default GlassCard

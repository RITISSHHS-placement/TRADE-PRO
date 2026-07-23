import React from 'react'

// Simple className merger
const cn = (...classes) => classes.filter(Boolean).join(' ')

// Base Skeleton Component
export const Skeleton = ({ 
  className, 
  variant = 'default',
  animation = 'pulse',
  ...props 
}) => {
  const variants = {
    default: 'h-4 w-full rounded-md',
    text: 'h-4 w-full rounded',
    heading: 'h-8 w-3/4 rounded-lg',
    circle: 'rounded-full',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 w-24 rounded-lg',
    card: 'h-32 w-full rounded-xl',
    input: 'h-10 w-full rounded-lg',
    image: 'h-48 w-full rounded-xl',
  }
  
  const animations = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer',
    none: '',
  }
  
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-white/5 via-white/10 to-white/5',
        'bg-[length:200%_100%]',
        variants[variant],
        animations[animation],
        className
      )}
      style={{
        animation: animation === 'shimmer' ? 'shimmer 1.5s infinite' : undefined,
      }}
      {...props}
    />
  )
}

// Card Skeleton
export const CardSkeleton = ({ className }) => {
  return (
    <div className={cn('p-4 rounded-xl border border-white/10', className)}>
      <Skeleton variant="heading" className="mb-3" />
      <Skeleton variant="text" className="mb-2" />
      <Skeleton variant="text" className="w-2/3 mb-4" />
      <div className="flex gap-2">
        <Skeleton variant="button" />
        <Skeleton variant="button" />
      </div>
    </div>
  )
}

// Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex gap-4 p-3 border-b border-white/10">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="text" className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 p-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// List Skeleton
export const ListSkeleton = ({ items = 5, className }) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton variant="avatar" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-1/2" />
            <Skeleton variant="text" className="w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Chart Skeleton
export const ChartSkeleton = ({ className }) => {
  return (
    <div className={cn('p-4 rounded-xl border border-white/10', className)}>
      <Skeleton variant="heading" className="mb-4 w-1/3" />
      <div className="h-64 relative">
        <Skeleton variant="image" className="h-full" />
        {/* Simulated chart elements */}
        <div className="absolute inset-0 flex items-end justify-between p-4 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t"
              style={{ height: `${20 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Stats Skeleton
export const StatsSkeleton = ({ count = 4, className }) => {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-white/10">
          <Skeleton variant="text" className="w-1/2 mb-2" />
          <Skeleton variant="heading" className="w-3/4" />
        </div>
      ))}
    </div>
  )
}

// Dashboard Skeleton
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton variant="heading" className="w-1/3 h-10" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
      
      {/* Stats */}
      <StatsSkeleton />
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
        
        {/* Side Panel */}
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
      
      {/* Table Section */}
      <div className="rounded-xl border border-white/10 p-4">
        <Skeleton variant="heading" className="mb-4 w-1/4" />
        <TableSkeleton rows={5} columns={5} />
      </div>
    </div>
  )
}

// Form Skeleton
export const FormSkeleton = ({ fields = 4, className }) => {
  return (
    <div className={cn('space-y-4 p-6 rounded-xl border border-white/10', className)}>
      <Skeleton variant="heading" className="mb-6" />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" className="w-1/4" />
          <Skeleton variant="input" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton variant="button" className="w-32" />
        <Skeleton variant="button" className="w-24" />
      </div>
    </div>
  )
}

// Profile Skeleton
export const ProfileSkeleton = () => {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10">
      <Skeleton variant="avatar" className="h-16 w-16" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="heading" className="w-1/3" />
        <Skeleton variant="text" className="w-1/2" />
        <Skeleton variant="text" className="w-2/3" />
      </div>
    </div>
  )
}

// Order Book Skeleton
export const OrderBookSkeleton = () => {
  return (
    <div className="p-4 rounded-xl border border-white/10 space-y-3">
      <Skeleton variant="heading" className="w-1/4 mb-4" />
      
      {/* Header */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="text" className="h-3" />
        ))}
      </div>
      
      {/* Asks */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={`ask-${i}`} className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={`ask-${i}-${j}`} variant="text" className="h-4" />
          ))}
        </div>
      ))}
      
      {/* Spread */}
      <Skeleton variant="text" className="h-6 w-full my-2" />
      
      {/* Bids */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={`bid-${i}`} className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={`bid-${i}-${j}`} variant="text" className="h-4" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Watchlist Skeleton
export const WatchlistSkeleton = ({ items = 8 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
          <Skeleton variant="avatar" className="h-8 w-8" />
          <div className="flex-1">
            <Skeleton variant="text" className="w-20 mb-1" />
            <Skeleton variant="text" className="w-16 h-3" />
          </div>
          <Skeleton variant="text" className="w-16" />
          <Skeleton variant="text" className="w-16" />
          <Skeleton variant="text" className="w-12" />
        </div>
      ))}
    </div>
  )
}

// Loading Spinner Component
export const LoadingSpinner = ({ 
  size = 'md',
  color = 'indigo',
  className 
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }
  
  const colors = {
    indigo: 'border-indigo-500',
    green: 'border-green-500',
    red: 'border-red-500',
    white: 'border-white',
  }
  
  return (
    <div
      className={cn(
        'rounded-full border-2 border-t-transparent animate-spin',
        sizes[size],
        colors[color],
        className
      )}
    />
  )
}

// Loading Page Component
export const LoadingPage = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#09090b] z-50">
      <LoadingSpinner size="xl" color="indigo" />
      <p className="mt-4 text-white/60 text-sm">{message}</p>
    </div>
  )
}

// Empty State Component
export const EmptyState = ({ 
  icon,
  title,
  description,
  action,
  className 
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 rounded-xl border border-white/10 text-center',
      className
    )}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/60 text-sm mb-4 max-w-sm">{description}</p>
      {action && action}
    </div>
  )
}

// Error State Component
export const ErrorState = ({ 
  title = 'Something went wrong',
  description = 'An error occurred while loading the data. Please try again.',
  onRetry,
  className 
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 rounded-xl border border-red-500/20 text-center',
      className
    )}>
      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/60 text-sm mb-4 max-w-sm">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors font-medium"
        >
          Try Again
        </button>
      )}
    </div>
  )
}

// Add shimmer animation to global styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .animate-shimmer {
      animation: shimmer 1.5s infinite;
    }
  `
  document.head.appendChild(style)
}

export default Skeleton

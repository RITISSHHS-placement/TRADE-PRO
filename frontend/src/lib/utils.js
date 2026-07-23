// Utility function for merging Tailwind CSS classes
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Format currency for Indian Rupees
export function formatCurrency(amount, options = {}) {
  const { 
    minimumFractionDigits = 2, 
    maximumFractionDigits = 2,
    symbol = '₹'
  } = options
  
  return `${symbol}${Number(amount || 0).toLocaleString('en-IN', { 
    minimumFractionDigits, 
    maximumFractionDigits 
  })}`
}

// Format large numbers with abbreviations
export function formatNumber(num) {
  if (!num) return '—'
  if (num >= 1e7) return `${(num / 1e7).toFixed(2)}Cr`
  if (num >= 1e5) return `${(num / 1e5).toFixed(2)}L`
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
  return num.toFixed(0)
}

// Format percentage
export function formatPercentage(value, options = {}) {
  const { showSign = true, decimals = 2 } = options
  const num = Number(value || 0)
  const sign = showSign && num > 0 ? '+' : ''
  return `${sign}${num.toFixed(decimals)}%`
}

// Format time
export function formatTime(timestamp, options = {}) {
  if (!timestamp) return '--'
  const { 
    hour = '2-digit', 
    minute = '2-digit', 
    second = undefined 
  } = options
  
  return new Date(timestamp).toLocaleTimeString('en-IN', { 
    hour, 
    minute, 
    second 
  })
}

// Format date
export function formatDate(timestamp, options = {}) {
  if (!timestamp) return '--'
  const { 
    day = '2-digit', 
    month = 'short', 
    year = 'numeric' 
  } = options
  
  return new Date(timestamp).toLocaleDateString('en-IN', { 
    day, 
    month, 
    year 
  })
}

// Calculate percentage change
export function calculateChange(current, previous) {
  if (!previous) return 0
  return ((current - previous) / previous) * 100
}

// Debounce function
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle function
export function throttle(func, limit) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Generate unique ID
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Deep clone object
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// Check if device is mobile
export function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 768
}

// Check if device is tablet
export function isTablet() {
  return typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024
}

// Check if device is desktop
export function isDesktop() {
  return typeof window !== 'undefined' && window.innerWidth >= 1024
}

// Scroll to element
export function scrollToElement(elementId, options = {}) {
  const element = document.getElementById(elementId)
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start',
      ...options 
    })
  }
}

// Copy text to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy text: ', err)
    return false
  }
}

// Download data as file
export function downloadFile(data, filename, type = 'text/plain') {
  const blob = new Blob([data], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Parse URL parameters
export function getUrlParams() {
  const params = new URLSearchParams(window.location.search)
  const result = {}
  for (const [key, value] of params) {
    result[key] = value
  }
  return result
}

// Format duration in human-readable format
export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

// Get color based on value (positive/negative)
export function getValueColor(value, options = {}) {
  const { 
    positive = '#22c55e', 
    negative = '#ef4444', 
    neutral = '#8b8b9e' 
  } = options
  
  if (value > 0) return positive
  if (value < 0) return negative
  return neutral
}

// Truncate text with ellipsis
export function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Validate email
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// Validate phone number (Indian)
export function isValidPhone(phone) {
  const re = /^[6-9]\d{9}$/
  return re.test(phone.replace(/\s/g, ''))
}

// Get initials from name
export function getInitials(name, maxLength = 2) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, maxLength)
}

// Generate random color
export function randomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
}

// Calculate compound interest
export function calculateCompoundInterest(principal, rate, time, n) {
  const amount = principal * Math.pow((1 + rate / (n * 100)), n * time)
  return amount - principal
}

// Calculate SIP returns
export function calculateSIP(monthlyAmount, rate, years) {
  const monthlyRate = rate / 12 / 100
  const months = years * 12
  const futureValue = monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)
  return {
    invested: monthlyAmount * months,
    returns: futureValue - (monthlyAmount * months),
    total: futureValue
  }
}

// Local storage helpers
export const storage = {
  get(key) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return null
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error writing to localStorage:', error)
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing from localStorage:', error)
    }
  },
  clear() {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }
}

// Session storage helpers
export const session = {
  get(key) {
    try {
      const item = sessionStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Error reading from sessionStorage:', error)
      return null
    }
  },
  set(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error writing to sessionStorage:', error)
    }
  },
  remove(key) {
    try {
      sessionStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing from sessionStorage:', error)
    }
  },
  clear() {
    try {
      sessionStorage.clear()
    } catch (error) {
      console.error('Error clearing sessionStorage:', error)
    }
  }
}

// Animation utilities
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  }
}

// Chart color palette
export const chartColors = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  grid: '#1f1f27',
  text: '#8b8b9e'
}

// Stock market utilities
export const marketUtils = {
  isBullish(change) {
    return change >= 0
  },
  isBearish(change) {
    return change < 0
  },
  formatLotSize(quantity, lotSize = 1) {
    return Math.floor(quantity / lotSize)
  },
  calculateBrokerage(value, brokerage = 20) {
    return Math.min(brokerage, value * 0.0003)
  },
  calculateSTT(value, type = 'equity') {
    if (type === 'equity') {
      return value * 0.001 // 0.1% for equity delivery
    }
    return value * 0.00025 // 0.025% for intraday
  }
}

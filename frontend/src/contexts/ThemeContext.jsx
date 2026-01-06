import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { getThemeConfig } from '../services/themeApi'

// Default branding config (fallback if API fails)
const DEFAULT_BRANDING = {
  sidebar: {
    background: '#0F1E56',
    backgroundDark: '#040812',
    text: '#B0B7D0',
    textDark: '#8892AC',
    active: '#3342A5',
    activeDark: '#1E2B78',
    hover: '#1C2B78',
    hoverDark: '#0D1842'
  },
  header: {
    background: '#FFFFFF',
    backgroundDark: '#0a0e17',
    text: '#111827',
    textDark: '#E5E7EB'
  },
  brand: {
    logoLight: '',
    logoDark: '',
    organizationName: 'Nirmitee Robotics',
    platformName: 'Internal Hub',
    slogan: 'Innovate. Connect. Grow.',
    footerText: '© 2026 Nirmitee Robotics'
  },
  colors: {
    primary: '#ff4701',
    secondary: '#6366F1',
    accent: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  }
}

// Helper functions for theme persistence
const getTheme = () => {
  try {
    const saved = localStorage.getItem('sidebarTheme')
    return saved || 'light' // Default to light theme
  } catch {
    return 'light'
  }
}

const saveTheme = (theme) => {
  try {
    localStorage.setItem('sidebarTheme', theme)
  } catch (error) {
    console.error('Failed to save theme:', error)
  }
}

// Cache branding in localStorage
const getCachedBranding = () => {
  try {
    const cached = localStorage.getItem('organizationBranding')
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

const cacheBranding = (branding) => {
  try {
    localStorage.setItem('organizationBranding', JSON.stringify(branding))
  } catch (error) {
    console.error('Failed to cache branding:', error)
  }
}

// Apply CSS variables to document root
const applyCSSVariables = (branding, isDark) => {
  const root = document.documentElement
  
  if (!branding) return
  
  // Sidebar variables
  if (branding.sidebar) {
    root.style.setProperty('--sidebar-bg', isDark ? branding.sidebar.backgroundDark : branding.sidebar.background)
    root.style.setProperty('--sidebar-text', isDark ? branding.sidebar.textDark : branding.sidebar.text)
    root.style.setProperty('--sidebar-active', isDark ? branding.sidebar.activeDark : branding.sidebar.active)
    root.style.setProperty('--sidebar-hover', isDark ? branding.sidebar.hoverDark : branding.sidebar.hover)
  }
  
  // Header variables
  if (branding.header) {
    root.style.setProperty('--header-bg', isDark ? branding.header.backgroundDark : branding.header.background)
    root.style.setProperty('--header-text', isDark ? branding.header.textDark : branding.header.text)
  }
  
  // Brand colors
  if (branding.colors) {
    root.style.setProperty('--primary-color', branding.colors.primary)
    root.style.setProperty('--secondary-color', branding.colors.secondary)
    root.style.setProperty('--accent-color', branding.colors.accent)
    root.style.setProperty('--success-color', branding.colors.success)
    root.style.setProperty('--warning-color', branding.colors.warning)
    root.style.setProperty('--error-color', branding.colors.error)
    root.style.setProperty('--info-color', branding.colors.info)
  }
}

const ThemeContext = createContext({ 
  theme: 'light', 
  toggleTheme: () => {},
  branding: DEFAULT_BRANDING,
  updateBranding: () => {},
  refreshBranding: () => {},
  isLoadingBranding: false
})

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getTheme)
  const [branding, setBranding] = useState(() => getCachedBranding() || DEFAULT_BRANDING)
  const [isLoadingBranding, setIsLoadingBranding] = useState(false)

  // Fetch branding from API
  const fetchBranding = useCallback(async () => {
    try {
      setIsLoadingBranding(true)
      const token = localStorage.getItem('accessToken')
      if (!token) {
        // Not logged in, use cached or default
        return
      }
      
      const response = await getThemeConfig()
      if (response.success && response.data?.config) {
        setBranding(response.data.config)
        cacheBranding(response.data.config)
      }
    } catch (error) {
      console.error('Failed to fetch branding:', error)
      // Use cached branding if available
    } finally {
      setIsLoadingBranding(false)
    }
  }, [])

  // Load branding on mount and when token changes
  useEffect(() => {
    fetchBranding()
  }, [fetchBranding])

  // Apply theme class and CSS variables when theme or branding changes
  useEffect(() => {
    saveTheme(theme)
    const isDark = theme === 'dark'
    
    // Apply theme class to body for global dark mode
    if (isDark) {
      document.body.classList.add('dark-theme')
      document.body.style.backgroundColor = '#0a0e17'
    } else {
      document.body.classList.remove('dark-theme')
      document.body.style.backgroundColor = '#ebf3ff'
    }
    
    // Apply CSS variables based on branding and theme
    applyCSSVariables(branding, isDark)
  }, [theme, branding])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }, [])

  const updateBranding = useCallback((newBranding) => {
    setBranding(newBranding)
    cacheBranding(newBranding)
    applyCSSVariables(newBranding, theme === 'dark')
  }, [theme])

  const refreshBranding = useCallback(() => {
    fetchBranding()
  }, [fetchBranding])

  const value = useMemo(() => ({ 
    theme, 
    toggleTheme, 
    branding, 
    updateBranding,
    refreshBranding,
    isLoadingBranding
  }), [theme, toggleTheme, branding, updateBranding, refreshBranding, isLoadingBranding])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  // With default value in createContext, context will always be available
  // This prevents crashes during HMR and development
  return context
}

export { DEFAULT_BRANDING }

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'

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

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} })

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getTheme)

  useEffect(() => {
    saveTheme(theme)
    // Apply theme class to body for global dark mode
    if (theme === 'dark') {
      document.body.classList.add('dark-theme')
      document.body.style.backgroundColor = '#0a0e17'
    } else {
      document.body.classList.remove('dark-theme')
      document.body.style.backgroundColor = '#ebf3ff'
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }, [])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

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

import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to 'light'
    try {
      const savedTheme = localStorage.getItem('theme')
      return savedTheme || 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    // Save theme to localStorage whenever it changes
    try {
      localStorage.setItem('theme', theme)
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

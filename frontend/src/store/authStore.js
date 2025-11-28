import { create } from 'zustand'
import api from '../services/api'

// Helper functions to manage tokens
const setTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
  }
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken)
  }
}

const clearTokens = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  delete api.defaults.headers.common['Authorization']
}

const getAccessToken = () => localStorage.getItem('accessToken')
const getRefreshToken = () => localStorage.getItem('refreshToken')

// Set token on initialization if it exists
const accessToken = getAccessToken()
if (accessToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
}

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start as true to wait for initial check
  _initializing: false, // Track if initialization is in progress
  _initialized: false, // Track if initial auth check has completed

  // Initialize auth state from server
  initialize: async () => {
    // Prevent multiple simultaneous initialization calls
    if (get()._initializing) {
      return { success: false, pending: true }
    }

    // If already initialized, return current state
    if (get()._initialized) {
      return { success: get().isAuthenticated }
    }

    try {
      set({ isLoading: true, _initializing: true })
      const response = await api.get('/auth/me')
      set({ 
        user: response.data.data.user, 
        isAuthenticated: true,
        isLoading: false,
        _initializing: false,
        _initialized: true
      })
      return { success: true }
    } catch (error) {
      // Try to refresh token if available
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        try {
          const refreshResponse = await api.post('/auth/refresh', { refreshToken })
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data.data
          setTokens(newAccessToken, newRefreshToken)
          
          // Retry getting user info
          const userResponse = await api.get('/auth/me')
          set({ 
            user: userResponse.data.data.user, 
            isAuthenticated: true,
            isLoading: false,
            _initializing: false,
            _initialized: true
          })
          return { success: true }
        } catch (refreshError) {
          // Refresh failed, clear tokens
          clearTokens()
        }
      }
      
      set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false,
        _initializing: false,
        _initialized: true
      })
      return { success: false }
    }
  },

  register: async (userData) => {
    try {
      set({ isLoading: true })
      const response = await api.post('/auth/register', userData, {
        withCredentials: true
      })
      const { user } = response.data.data
      
      set({ 
        user, 
        isAuthenticated: false, // User needs to login after registration
        isLoading: false
      })
      
      return { success: true }
    } catch (error) {
      set({ isLoading: false })
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      }
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true })
      const response = await api.post('/auth/login', { email, password }, {
        withCredentials: true // Important for cookies
      })
      
      // Check if response is successful
      if (response.data.success && response.data.data?.user) {
        const { user, accessToken, refreshToken } = response.data.data
        
        // Store JWT tokens
        if (accessToken && refreshToken) {
          setTokens(accessToken, refreshToken)
        }
        
        set({ 
          user, 
          isAuthenticated: true,
          isLoading: false,
          _initialized: true
        })
        
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Login failed')
      }
    } catch (error) {
      set({ isLoading: false })
      
      // Provide more detailed error messages
      let errorMessage = 'Login failed'
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Make sure the backend is running on http://localhost:5002'
      } else {
        errorMessage = error.message || 'Login failed'
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  },

  oauthLogin: async (provider, oauthData) => {
    try {
      set({ isLoading: true })
      const response = await api.post(`/auth/oauth/${provider}`, oauthData, {
        withCredentials: true
      })
      const { user, accessToken, refreshToken } = response.data.data
      
      // Store JWT tokens
      if (accessToken && refreshToken) {
        setTokens(accessToken, refreshToken)
      }
      
      set({ 
        user, 
        isAuthenticated: true,
        isLoading: false,
        _initialized: true
      })
      
      return { success: true }
    } catch (error) {
      set({ isLoading: false })
      return {
        success: false,
        error: error.response?.data?.message || 'OAuth login failed'
      }
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout', {}, {
        withCredentials: true
      })
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      clearTokens()
      set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false,
        _initialized: true
      })
    }
  },

  fetchUser: async () => {
    try {
      const response = await api.get('/auth/me')
      set({ 
        user: response.data.data.user, 
        isAuthenticated: true
      })
      return { success: true }
    } catch (error) {
      get().logout()
      return { success: false }
    }
  },

  updateUser: (userData) => {
    set({ user: { ...get().user, ...userData } })
  }
}))

export { useAuthStore }

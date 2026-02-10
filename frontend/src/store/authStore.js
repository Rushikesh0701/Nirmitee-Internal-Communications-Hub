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
  localStorage.removeItem('userRole') // Clear cached role on logout
  delete api.defaults.headers.common['Authorization']
}

const getAccessToken = () => localStorage.getItem('accessToken')
const getRefreshToken = () => localStorage.getItem('refreshToken')

// Helper functions to manage user role in localStorage
const getUserRoleFromStorage = () => {
  try {
    const roleData = localStorage.getItem('userRole')
    return roleData ? JSON.parse(roleData) : null
  } catch {
    return null
  }
}

const setUserRoleInStorage = (user) => {
  if (!user) {
    localStorage.removeItem('userRole')
    return
  }

  // Extract role information from user object
  // Handle different user object structures (roleId can be populated object or just _id)
  const roleName = user.role ||
    (user.roleId?.name) ||
    (typeof user.roleId === 'object' && user.roleId?.name) ||
    user.Role?.name ||
    'Employee'

  const roleData = {
    role: roleName,
    roleId: (typeof user.roleId === 'object' && user.roleId?._id) ||
      (typeof user.roleId === 'object' && user.roleId?.id) ||
      user.roleId ||
      user.Role?._id ||
      user.Role?.id,
    roleName: roleName
  }

  localStorage.setItem('userRole', JSON.stringify(roleData))
}

const getUserFromStorage = () => {
  try {
    const roleData = getUserRoleFromStorage()
    if (!roleData) return null

    // Create a minimal user object with role info for immediate use
    return {
      role: roleData.role,
      roleId: roleData.roleId ? { name: roleData.roleName } : null,
      Role: roleData.roleName ? { name: roleData.roleName } : null
    }
  } catch {
    return null
  }
}

// Set token on initialization if it exists
const accessToken = getAccessToken()
if (accessToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
}

const useAuthStore = create((set, get) => {
  // Try to get cached user role from localStorage for immediate access
  const cachedUser = getUserFromStorage()

  return {
    user: cachedUser, // Initialize with cached user role for immediate sidebar rendering
    isAuthenticated: false,
    isLoading: true, // Start as true to wait for initial check
    isLoggingOut: false, // Track if logout is in progress
    _initializing: false, // Track if initialization is in progress
    _initialized: false, // Track if initial auth check has completed
    lastError: null, // Track the last error message from initialization

    // Initialize auth state from server
    initialize: async (force = false) => {
      // Prevent multiple simultaneous initialization calls
      if (get()._initializing) {
        return { success: false, pending: true }
      }

      // If already initialized AND not forcing, return current state
      if (get()._initialized && !force) {
        return {
          success: get().isAuthenticated,
          error: get().lastError
        }
      }

      try {
        set({ isLoading: true, _initializing: true })
        const response = await api.get('/auth/me')
        const user = response.data.data.user
        setUserRoleInStorage(user) // Store role in localStorage
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          _initializing: false,
          _initialized: true,
          lastError: null
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
            const user = userResponse.data.data.user
            setUserRoleInStorage(user) // Store role in localStorage
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              _initializing: false,
              _initialized: true,
              lastError: null
            })
            return { success: true }
          } catch (refreshError) {
            // Refresh failed, clear tokens
            clearTokens()
          }
        }

        const errorMessage = error.response?.data?.message || error.message || 'Initialization failed'

        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          _initializing: false,
          _initialized: true,
          lastError: errorMessage
        })
        return {
          success: false,
          error: errorMessage
        }
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

          setUserRoleInStorage(user) // Store role in localStorage

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
          errorMessage = 'Cannot connect to server. Please check your internet connection.'
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

        setUserRoleInStorage(user) // Store role in localStorage

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
        set({ isLoggingOut: true })
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
          isLoggingOut: false,
          _initialized: true
        })
      }
    },

    fetchUser: async () => {
      try {
        const response = await api.get('/auth/me')
        const user = response.data.data.user
        setUserRoleInStorage(user) // Store role in localStorage
        set({
          user,
          isAuthenticated: true
        })
        return { success: true }
      } catch (error) {
        get().logout()
        return { success: false }
      }
    },

    setAnonymous: () => {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        _initializing: false,
        _initialized: true,
        lastError: null
      })
    },

    updateUser: (userData) => {
      const updatedUser = { ...get().user, ...userData }
      setUserRoleInStorage(updatedUser) // Update role in localStorage
      set({ user: updatedUser })
    }
  }
})

export { useAuthStore }

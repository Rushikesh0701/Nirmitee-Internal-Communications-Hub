import axios from 'axios'

// Use environment variable for API base URL, or fall back to proxy
const getBaseURL = () => {
  // For local development, always use '/api' which will be proxied by Vite to localhost:5002
  // The Vite proxy is configured in vite.config.js
  // If VITE_API_BASE_URL is set and is a valid URL (for production/deployed environments), use it
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl && typeof envUrl === 'string') {
    const cleanUrl = envUrl.trim().replace(/['";]/g, '') // Remove quotes and semicolons
    // Only use if it's a valid HTTP/HTTPS URL
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl
    }
  }
  // Default: use relative path which will be proxied by Vite to http://localhost:5002
  return '/api'
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

// Track if we're currently refreshing the token
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest?.url || ''
      const isAuthEndpoint = url.includes('/auth/login') || 
                            url.includes('/auth/register') || 
                            url.includes('/auth/oauth') ||
                            url.includes('/auth/refresh')
      const isOnAuthPage = window.location.pathname === '/login' || 
                          window.location.pathname === '/register'

      // If it's an auth endpoint or we're on auth page, don't try to refresh
      if (isAuthEndpoint || isOnAuthPage) {
        return Promise.reject(error)
      }

      // Try to refresh token
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        isRefreshing = false
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const response = await api.post('/auth/refresh', { refreshToken })
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data

        localStorage.setItem('accessToken', newAccessToken)
        localStorage.setItem('refreshToken', newRefreshToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
        
        processQueue(null, newAccessToken)
        isRefreshing = false

        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        isRefreshing = false
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        delete api.defaults.headers.common['Authorization']
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api

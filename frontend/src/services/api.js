import axios from 'axios'

// We will inject the clerk instance here from main.jsx or a hook
// Since we can't easily use hooks in a plain JS file, 
// we'll rely on a global reference or pass it in.
// Alternatively, we'll use a request interceptor that we set up in a component.

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl && typeof envUrl === 'string') {
    const cleanUrl = envUrl.trim().replace(/['";]/g, '')
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl
    }
  }
  return '/api'
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

// REFACTOR: Use a simpler interceptor that doesn't force redirects 
// if we're in the middle of a Clerk session.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we are on public pages, just let it fail
      const isOnAuthPage = window.location.pathname === '/login' ||
        window.location.pathname === '/register'

      if (isOnAuthPage) {
        return Promise.reject(error)
      }

      // If we have a refresh token (manual login), try to refresh
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        originalRequest._retry = true
        try {
          const response = await axios.post(`${getBaseURL()}/auth/refresh`, { refreshToken })
          const { accessToken: newAccessToken } = response.data.data
          localStorage.setItem('accessToken', newAccessToken)
          originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken
          return api(originalRequest)
        } catch (refreshError) {
          // Clear and redirect if refresh fails
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api

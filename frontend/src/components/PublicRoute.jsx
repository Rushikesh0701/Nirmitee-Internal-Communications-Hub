import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Loading from './Loading'

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, _initialized, initialize } = useAuthStore()
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)
  
  // Strict check: token exists in localStorage
  const hasToken = () => {
    const token = localStorage.getItem('accessToken')
    return !!token && token.trim() !== ''
  }
  
  useEffect(() => {
    // If token exists, we MUST verify authentication status
    if (hasToken()) {
      // Force initialization if not already done
      if (!_initialized && !isLoading) {
        initialize().finally(() => {
          setIsChecking(false)
        })
      } else if (_initialized) {
        setIsChecking(false)
      }
    } else {
      // No token, allow access immediately
      setIsChecking(false)
    }
  }, [_initialized, isLoading, initialize])
  
  // Strict check: If we have a token, we MUST verify before allowing access
  if (hasToken()) {
    // Wait for authentication check to complete
    if (isChecking || isLoading || !_initialized) {
      return <Loading fullScreen={true} text="Verifying authentication..." />
    }
    
    // STRICT: If authenticated, immediately redirect to dashboard
    // This prevents authenticated users from accessing login/signup/forgot-password
    if (isAuthenticated) {
      // Preserve intended destination if coming from a redirect
      const from = location.state?.from?.pathname || '/dashboard'
      return <Navigate to={from} replace />
    }
    
    // Token exists but authentication failed (expired/invalid)
    // Clear invalid token and allow access to auth pages
    if (!isAuthenticated && _initialized) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userRole')
    }
  }
  
  // No token or token cleared - allow access to auth pages
  return children
}

export default PublicRoute


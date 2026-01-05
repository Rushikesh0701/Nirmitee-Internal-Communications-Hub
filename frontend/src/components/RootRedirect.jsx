import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Loading from './Loading'

const RootRedirect = () => {
  const { isAuthenticated, isLoading, _initialized, initialize } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  
  // Strict check: token exists in localStorage
  const hasToken = () => {
    const token = localStorage.getItem('accessToken')
    return !!token && token.trim() !== ''
  }
  
  useEffect(() => {
    // STRICT: Always check authentication status for root route
    if (!_initialized && !isLoading) {
      initialize().finally(() => {
        setIsChecking(false)
      })
    } else if (_initialized) {
      setIsChecking(false)
    } else if (!hasToken()) {
      // No token, can redirect immediately
      setIsChecking(false)
    }
  }, [_initialized, isLoading, initialize])
  
  // Wait for authentication check
  if (isChecking || (hasToken() && (isLoading || !_initialized))) {
    return <Loading fullScreen={true} text="Loading..." />
  }
  
  // STRICT: Redirect based on authentication status
  if (isAuthenticated && hasToken()) {
    return <Navigate to="/dashboard" replace />
  }
  
  // Not authenticated - redirect to login
  return <Navigate to="/login" replace />
}

export default RootRedirect


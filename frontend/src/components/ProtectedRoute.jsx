import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Loading from './Loading'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, _initialized, initialize } = useAuthStore()
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)
  
  // Strict check: token exists in localStorage
  const hasToken = () => {
    const token = localStorage.getItem('accessToken')
    return !!token && token.trim() !== ''
  }
  
  useEffect(() => {
    // STRICT: Always initialize auth check for protected routes
    if (!_initialized && !isLoading) {
      initialize().finally(() => {
        setIsChecking(false)
      })
    } else if (_initialized) {
      setIsChecking(false)
    }
  }, [_initialized, isLoading, initialize])
  
  // STRICT: Wait for authentication check to complete
  if (isChecking || isLoading || !_initialized) {
    return <Loading fullScreen={true} text="Checking authentication..." />
  }
  
  // STRICT: Must be authenticated to access protected routes
  if (!isAuthenticated) {
    // Save intended destination for redirect after login
    return (
      <Navigate 
        to="/login" 
        replace 
        state={{ from: location }} 
      />
    )
  }
  
  // STRICT: Also check token existence as secondary validation
  if (!hasToken()) {
    // Token missing but isAuthenticated is true (shouldn't happen, but be safe)
    return (
      <Navigate 
        to="/login" 
        replace 
        state={{ from: location }} 
      />
    )
  }
  
  // Authenticated and token exists - allow access
  return children
}

export default ProtectedRoute


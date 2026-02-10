import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useAuth } from '@clerk/clerk-react'
import Loading from './Loading'

const RootRedirect = () => {
  const { isAuthenticated, isLoading, _initialized, initialize } = useAuthStore()
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth()
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
    } else if (!hasToken() && isClerkLoaded) {
      // No token and Clerk check done
      setIsChecking(false)
    }
  }, [_initialized, isLoading, initialize, isClerkLoaded])
  
  // Wait for authentication check
  if (isChecking || (hasToken() && (isLoading || !_initialized)) || !isClerkLoaded) {
    return <Loading fullScreen={true} text="Loading..." />
  }
  
  // Redirect based on authentication status (either backend or Clerk)
  if (isAuthenticated || isSignedIn) {
    return <Navigate to="/dashboard" replace />
  }
  
  // Not authenticated - redirect to login
  return <Navigate to="/login" replace />
}

export default RootRedirect


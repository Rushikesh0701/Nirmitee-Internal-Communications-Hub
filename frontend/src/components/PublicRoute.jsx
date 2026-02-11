import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useAuth } from '@clerk/clerk-react'
import Loading from './Loading'

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, _initialized, initialize } = useAuthStore()
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth()
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
      // No token, check if we should wait for Clerk
      if (isClerkLoaded) {
        setIsChecking(false)
      }
    }
  }, [_initialized, isLoading, initialize, isClerkLoaded])
  
  // Wait for Clerk and backend auth check
  if (isChecking || isLoading || !isClerkLoaded) {
    return <Loading fullScreen={true} text="Checking session..." />
  }
  
  // If already authenticated (backend) or signed in (clerk), redirect away from login/register
  if (isClerkLoaded && isSignedIn) {
    const from = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace={true} />
  }

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace={true} />
  }
  
  // No session - allow access to auth pages
  return children
}

export default PublicRoute


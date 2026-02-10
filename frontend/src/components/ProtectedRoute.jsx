import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useAuth } from '@clerk/clerk-react'
import Loading from './Loading'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, _initialized, initialize } = useAuthStore()
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth()
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)
  
  useEffect(() => {
    // STRICT: Always initialize auth check for protected routes
    // BUT wait for Clerk to load first so we have the token
    if (isClerkLoaded && !_initialized && !isLoading) {
      initialize().finally(() => {
        setIsChecking(false)
      })
    } else if (_initialized || (isClerkLoaded && !isAuthenticated)) {
      // If already initialized OR Clerk loaded but we have no session (so initialize won't help much if we rely on token),
      // strictly speaking we should still try initialize() once to be sure, which the first block handles.
      // But if _initialized is true, we are done.
      setIsChecking(false)
    }
  }, [_initialized, isLoading, initialize, isClerkLoaded])
  
  // Wait for Clerk and backend auth check
  if (isChecking || isLoading || !_initialized || !isClerkLoaded) {
    return <Loading fullScreen={true} text="Verifying session..." />
  }
  
  // If we're not authenticated and not signed in to Clerk, go to login
  if (!isAuthenticated && !isSignedIn) {
    return (
      <Navigate 
        to="/login" 
        replace 
        state={{ from: location }} 
      />
    )
  }
  
  // If Clerk is signed in but store says !isAuthenticated, 
  // it might be because initialize() is still running or just finished.
  // We'll show a quick loading state if it's truly not authenticated yet.
  if (!isAuthenticated && isSignedIn) {
    // If backend check has finished and we are still not authenticated, 
    // it means backend rejected the session (e.g. domain restriction).
    // Redirect to login to show the error.
    if (_initialized) {
      return <Navigate to="/login" replace />
    }
    return <Loading fullScreen={true} text="Almost there..." />
  }

  // Allow access if authenticated
  return children
}

export default ProtectedRoute


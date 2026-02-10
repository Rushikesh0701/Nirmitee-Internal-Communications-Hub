import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useAuth } from '@clerk/clerk-react'
import Loading from './Loading'
import { isAdminOrModerator } from '../utils/userHelpers'

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading, _initialized, initialize } = useAuthStore()
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth()
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)
  
  useEffect(() => {
    // STRICT: Always initialize auth check for admin routes
    if (!_initialized && !isLoading) {
      initialize().finally(() => {
        setIsChecking(false)
      })
    } else if (_initialized) {
      setIsChecking(false)
    }
  }, [_initialized, isLoading, initialize])
  
  // Wait for Clerk and backend auth check
  if (isChecking || isLoading || !_initialized || !isClerkLoaded) {
    return <Loading fullScreen={true} text="Checking permissions..." />
  }
  
  // If Clerk is signed in but backend is not authenticated yet, we are still "syncing"
  if (isSignedIn && !isAuthenticated) {
    return <Loading fullScreen={true} text="Verifying admin session..." />
  }

  // STRICT: Must be authenticated via backend to access admin routes
  // (Since we need the user role data from the backend)
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        replace 
        state={{ from: location }} 
      />
    )
  }
  
  // STRICT: Must have admin or moderator role
  if (!isAdminOrModerator(user)) {
    // User is authenticated but not authorized - redirect to dashboard
    return <Navigate to="/dashboard" replace />
  }
  
  // Authenticated and has admin/moderator role - allow access
  return children
}

export default AdminRoute


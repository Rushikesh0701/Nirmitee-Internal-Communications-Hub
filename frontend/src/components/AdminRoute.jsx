import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Loading from './Loading'
import { isAdminOrModerator } from '../utils/userHelpers'

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading, _initialized, initialize } = useAuthStore()
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)
  
  // Strict check: token exists in localStorage
  const hasToken = () => {
    const token = localStorage.getItem('accessToken')
    return !!token && token.trim() !== ''
  }
  
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
  
  // STRICT: Wait for authentication check to complete
  if (isChecking || isLoading || !_initialized) {
    return <Loading fullScreen={true} text="Checking permissions..." />
  }
  
  // STRICT: Must be authenticated to access admin routes
  if (!isAuthenticated || !hasToken()) {
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
  
  // Authenticated, has token, and has admin/moderator role - allow access
  return children
}

export default AdminRoute


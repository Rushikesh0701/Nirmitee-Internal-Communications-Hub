import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Loading from './Loading'
import { isAdminOrModerator } from '../utils/userHelpers'

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading, _initialized, initialize } = useAuthStore()
  
  useEffect(() => {
    if (!_initialized && !isLoading) {
      initialize()
    }
  }, [_initialized, isLoading, initialize])
  
  if (isLoading || !_initialized) {
    return <Loading />
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  // Use the helper function to check admin/moderator status
  if (!isAdminOrModerator(user)) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

export default AdminRoute


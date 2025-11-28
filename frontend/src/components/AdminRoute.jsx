import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Loading from './Loading'

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
  
  const userRole = user?.role?.toUpperCase()
  if (!['ADMIN', 'MODERATOR'].includes(userRole)) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

export default AdminRoute


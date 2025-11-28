import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Loading from './Loading'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, _initialized, initialize } = useAuthStore()
  
  useEffect(() => {
    if (!_initialized && !isLoading) {
      initialize()
    }
  }, [_initialized, isLoading, initialize])
  
  if (isLoading || !_initialized) {
    return <Loading />
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default ProtectedRoute


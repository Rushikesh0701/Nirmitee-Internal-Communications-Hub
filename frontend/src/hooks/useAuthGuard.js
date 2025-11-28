import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

/**
 * Custom hook for authentication guards
 * Provides consistent authentication checking across components
 */
export const useAuthGuard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const requireAuth = useCallback((message = 'Please login to continue') => {
    if (!isAuthenticated || !user) {
      toast.error(message);
      navigate('/login');
      return false;
    }
    return true;
  }, [isAuthenticated, user, navigate]);

  return {
    user,
    isAuthenticated,
    requireAuth
  };
};



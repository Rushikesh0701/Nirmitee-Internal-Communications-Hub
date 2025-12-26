import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Check, ArrowRight, AlertCircle } from 'lucide-react'
import api from '../../services/api'

const ResetPassword = () => {
  const navigate = useNavigate()
  const { token } = useParams()
  const [loading, setLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const response = await api.post(`/auth/reset-password/${token}`, {
        password: data.password
      })

      if (response.data.success) {
        setResetSuccess(true)
        toast.success('Password reset successfully!')
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        toast.error('Failed to reset password. Please try again.')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        // Invalid or expired token
        if (error.response?.data?.message?.includes('invalid or has expired')) {
          toast.error('This reset link is invalid or has expired. Please request a new one.')
        } else if (error.response?.data?.message?.includes('Password must be')) {
          toast.error('Password must be at least 6 characters')
        } else {
          toast.error(error.response?.data?.message || 'Invalid request')
        }
      } else if (error.response?.status === 429) {
        // Rate limit exceeded
        toast.error('Too many attempts. Please try again later.')
      } else {
        // Generic error
        toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (resetSuccess) {
    return (
      <motion.div 
        className="w-full text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Check className="text-green-600" size={24} />
        </motion.div>

        <motion.h2 
          className="text-xl font-bold text-slate-800 mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Password Reset Successfully!
        </motion.h2>

        <motion.p 
          className="text-slate-600 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Your password has been changed. Redirecting to login...
        </motion.p>

        <motion.div
          className="flex items-center justify-center gap-2 text-slate-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="w-4 h-4 border-2 border-slate-700/30 border-t-slate-700 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <span>Taking you to login page...</span>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center mb-4">
        <motion.div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 mb-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-xs font-medium text-slate-600">Reset Password</span>
        </motion.div>

        <motion.h2 
          className="text-xl font-bold text-slate-800 mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Create New Password
        </motion.h2>

        <motion.p 
          className="text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Enter your new password below
        </motion.p>
      </div>

      {!token && (
        <motion.div
          className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4 flex items-start gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm text-rose-800 font-medium">Invalid Reset Link</p>
            <p className="text-xs text-rose-600 mt-1">
              This password reset link is invalid. Please request a new one.
            </p>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="block text-sm font-medium text-slate-700 mb-2">
            New Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors" size={16} />
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              })}
              className="w-full pl-10 pr-10 py-2 bg-white border border-slate-300 rounded-lg 
                         text-slate-800 placeholder-slate-400
                         focus:bg-white focus:border-slate-600 focus:ring-2 focus:ring-slate-300 
                         focus:outline-none transition-all duration-200"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-rose-500 text-xs mt-1.5">{errors.password.message}</p>}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Confirm New Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors" size={16} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword', { 
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match'
              })}
              className="w-full pl-10 pr-10 py-2 bg-white border border-slate-300 rounded-lg 
                         text-slate-800 placeholder-slate-400
                         focus:bg-white focus:border-slate-600 focus:ring-2 focus:ring-slate-300 
                         focus:outline-none transition-all duration-200"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-rose-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
        </motion.div>

        <motion.button
          type="submit"
          disabled={loading || !token}
          className="w-full py-2.5 rounded-lg font-medium text-white bg-slate-700 hover:bg-slate-800 relative overflow-hidden group disabled:opacity-70"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02, boxShadow: '0 10px 30px -5px rgba(99, 102, 241, 0.4)' }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <motion.div
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Resetting Password...
              </>
            ) : (
              <>
                Reset Password
                <ArrowRight size={18} />
              </>
            )}
          </span>
        </motion.button>
      </form>

      <motion.div 
        className="mt-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Link 
          to="/login"
          className="text-slate-600 hover:text-slate-800 font-medium"
        >
          Back to Sign In
        </Link>
      </motion.div>
    </motion.div>
  )
}

export default ResetPassword

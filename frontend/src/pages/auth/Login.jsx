import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

const Login = () => {
  const navigate = useNavigate()
  const { login, initialize, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: 'admin@nirmitee.io',
      password: 'admin123'
    }
  })

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated) {
        navigate('/dashboard')
        return
      }
      const result = await initialize()
      if (result.success) navigate('/dashboard')
    }
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (data) => {
    setLoading(true)
    const result = await login(data.email, data.password)
    setLoading(false)

    if (result.success) {
      navigate('/dashboard')
    } else {
      toast.error(result.error || 'Login failed')
    }
  }

  return (
    <motion.div className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="text-center mb-4">
        <motion.div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 mb-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-xs font-medium text-slate-600">Welcome Back</span>
        </motion.div>
        <motion.h2 
          className="text-xl font-bold text-slate-800 mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Sign In
        </motion.h2>
        <motion.p 
          className="text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Access your account
        </motion.p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
            <input
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
              })}
              className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg 
                         text-slate-800 placeholder-slate-400
                         focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                         focus:outline-none transition-all duration-200"
              placeholder="your.name@nirmitee.io"
            />
          </div>
          {errors.email && <p className="text-rose-500 text-xs mt-1.5">{errors.email.message}</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
              className="w-full pl-10 pr-10 py-2 bg-white border border-slate-300 rounded-lg 
                         text-slate-800 placeholder-slate-400
                         focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
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
          className="flex items-center justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Forgot password?
          </Link>
        </motion.div>

        <motion.button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 relative overflow-hidden group disabled:opacity-70"
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
                Signing in...
              </>
            ) : (
              <>
                Sign In
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
        <p className="text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
            Sign up
          </Link>
        </p>
      </motion.div>
    </motion.div>
  )
}

export default Login

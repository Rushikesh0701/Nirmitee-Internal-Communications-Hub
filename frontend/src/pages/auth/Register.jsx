import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { UserPlus, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react'

const Register = () => {
  const navigate = useNavigate()
  const { register: registerUser, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  const onSubmit = async (data) => {
    const result = await registerUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password
    })

    if (result.success) {
      toast.success('Registration successful! Please log in.')
      navigate('/login')
    } else {
      toast.error(result.error || 'Registration failed')
    }
  }

  return (
    <motion.div className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="text-center mb-8">
        <motion.div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <UserPlus size={14} className="text-indigo-600" />
          <span className="text-xs font-medium text-indigo-600">Join Us</span>
        </motion.div>
        <motion.h2 
          className="text-3xl font-bold text-slate-800 mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Create Account
        </motion.h2>
        <motion.p 
          className="text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Start your journey with us
        </motion.p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <input
                type="text"
                {...register('firstName', { required: 'Required' })}
                className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl 
                           text-slate-800 placeholder-slate-400 text-sm
                           focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 
                           focus:outline-none transition-all duration-300"
                placeholder="John"
              />
            </div>
            {errors.firstName && <p className="text-rose-500 text-xs mt-1">{errors.firstName.message}</p>}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
            <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <input
                type="text"
                {...register('lastName', { required: 'Required' })}
                className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl 
                           text-slate-800 placeholder-slate-400 text-sm
                           focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 
                           focus:outline-none transition-all duration-300"
                placeholder="Doe"
              />
            </div>
            {errors.lastName && <p className="text-rose-500 text-xs mt-1">{errors.lastName.message}</p>}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' }
              })}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl 
                         text-slate-800 placeholder-slate-400
                         focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 
                         focus:outline-none transition-all duration-300"
              placeholder="your.name@nirmitee.io"
            />
          </div>
          {errors.email && <p className="text-rose-500 text-xs mt-1.5">{errors.email.message}</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}>
          <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
              className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl 
                         text-slate-800 placeholder-slate-400
                         focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 
                         focus:outline-none transition-all duration-300"
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

        <motion.button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 rounded-xl font-semibold text-white relative overflow-hidden group disabled:opacity-70 mt-6"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02, boxShadow: '0 10px 30px -5px rgba(99, 102, 241, 0.4)' }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <motion.div
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight size={18} />
              </>
            )}
          </span>
        </motion.button>
      </form>

      <motion.div 
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
            Sign in
          </Link>
        </p>
      </motion.div>
    </motion.div>
  )
}

export default Register

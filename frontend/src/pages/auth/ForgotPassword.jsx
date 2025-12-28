import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Check } from 'lucide-react'
import api from '../../services/api'

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm()

  const email = watch('email')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const response = await api.post('/auth/forgot-password', { email: data.email })
      
      if (response.data.success) {
        setEmailSent(true)
        // Generic success message - don't reveal if email exists
        toast.success(response.data.message || 'If the email is registered, reset link will be sent')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      
      // Only show specific errors for rate limiting and server issues
      if (error.response?.status === 429) {
        // Rate limit exceeded
        toast.error('Too many attempts. Please try again after 15 minutes.')
      } else if (error.response?.status === 500) {
        // Email send failure
        toast.error('Failed to send email. Please try again later.')
      } else {
        // For all other cases (including 404, 403), show generic message
        toast.success('If the email is registered, then the reset link will be sent to that email')
      }
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <motion.div 
        className="w-full text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Check className="text-green-600" size={32} />
        </motion.div>

        <motion.h2 
          className="text-h1 text-slate-800 mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Check Your Email
        </motion.h2>

        <motion.p 
          className="text-slate-600 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          We've sent a password reset link to
        </motion.p>

        <motion.p 
          className="text-slate-700 font-semibold mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {email}
        </motion.p>

        <motion.div
          className="bg-slate-100 border border-slate-200 rounded-lg p-3 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-caption text-slate-700">
            <strong>Note:</strong> The link will expire in <strong>1 hour</strong>.
            <br />
            Check your spam folder if you don't see the email.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Link 
            to="/login"
            className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-700 font-medium"
          >
            <ArrowLeft size={18} />
            Back to Sign In
          </Link>
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
          <span className="text-overline text-slate-600">Password Reset</span>
        </motion.div>

        <motion.h2 
          className="text-h1 text-slate-800 mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Forgot Password?
        </motion.h2>

        <motion.p 
          className="text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          No worries! Enter your email and we'll send you reset instructions.
        </motion.p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="block text-button text-slate-700 mb-2">
            Email Address
          </label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors" size={16} />
            <input
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: { 
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
                  message: 'Invalid email address' 
                }
              })}
              className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg 
                         text-slate-800 placeholder-slate-400
                         focus:bg-white focus:border-slate-600 focus:ring-2 focus:ring-slate-300 
                         focus:outline-none transition-all duration-200"
              placeholder="your.name@nirmitee.io"
            />
          </div>
          {errors.email && <p className="text-rose-500 text-overline mt-1.5">{errors.email.message}</p>}
        </motion.div>

        <motion.button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg font-medium text-white bg-[#ff4701] hover:bg-[#ff5500] relative overflow-hidden group disabled:opacity-70"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
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
                Sending...
              </>
            ) : (
              <>
                Send Reset Link
                <Mail size={18} />
              </>
            )}
          </span>
        </motion.button>
      </form>

      <motion.div 
        className="mt-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Link 
          to="/login"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium"
        >
          <ArrowLeft size={18} />
          Back to Sign In
        </Link>
      </motion.div>
    </motion.div>
  )
}

export default ForgotPassword

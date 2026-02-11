import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

import { useSignIn, useAuth } from '@clerk/clerk-react'

const Login = () => {
  const navigate = useNavigate()
  const { signIn, isLoaded } = useSignIn()
  const { signOut, isSignedIn } = useAuth()
  const { login, initialize, isAuthenticated } = useAuthStore()

  const signInWith = (strategy) => {
    if (!isLoaded) return
    
    const origin = window.location.origin
    
    signIn.authenticateWithRedirect({
      strategy,
      // redirectUrl: intermediate page where Clerk processes the OAuth callback
      redirectUrl: `${origin}/sso-callback`,
      // redirectUrlComplete: final destination after sign-in is fully complete
      redirectUrlComplete: import.meta.env.VITE_CLERK_REDIRECT_URL || `${origin}/dashboard`,
    })
  }

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Custom icons for SSO (simple placeholders using Lucide or similar)
  // For branding, we'll use simple text for now or Lucide icons if available
  const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
    </svg>
  )

  const GithubIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  // Redirect to dashboard if already authenticated
  // App.jsx handles the actual initialization and token injection
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

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
          <span className="text-overline text-slate-600">Welcome Back</span>
        </motion.div>
        <motion.h2 
          className="text-h1 text-slate-800 mb-1"
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
          <label className="block text-button text-slate-700 mb-2">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors" size={16} />
            <input
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
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

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <label className="block text-button text-slate-700 mb-2">Password</label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors" size={16} />
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
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
          {errors.password && <p className="text-rose-500 text-overline mt-1.5">{errors.password.message}</p>}
        </motion.div>

        <motion.div 
          className="flex items-center justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link to="/forgot-password" className="text-caption text-slate-700 hover:text-slate-700 font-medium">
            Forgot password?
          </Link>
        </motion.div>

        <motion.button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg font-medium text-white bg-[#ff4701] hover:bg-[#ff5500] relative overflow-hidden group disabled:opacity-70"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
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

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-caption uppercase">
            <span className="bg-white px-2 text-slate-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => signInWith('oauth_google')}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-button font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <GoogleIcon />
            <span>Google</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => signInWith('oauth_github')}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-button font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <GithubIcon />
            <span>GitHub</span>
          </motion.button>
        </div>
      </div>

      <motion.div 
        className="mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <p className="text-slate-500">
          Don't have an account?
          <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
            Sign up
          </Link>
        </p>
      </motion.div>
    </motion.div>
  )
}

export default Login

import { Outlet, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../assets/Logo.png'

const AuthLayout = () => {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" style={{ backgroundColor: '#ebf3ff' }}>
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)' }}
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)' }}
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content Container */}
      <motion.div 
        className="w-full max-w-md relative z-20"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Logo Section */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Link to="/dashboard" className="inline-block">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img src={Logo} alt="Nirmitee.io" className="h-16 mx-auto drop-shadow-lg" />
            </motion.div>
          </Link>
          <motion.p 
            className="text-slate-600 text-lg font-medium mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Internal Communications Platform
          </motion.p>
        </motion.div>

        {/* Card */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Shadow */}
          <div className="absolute -inset-4 bg-indigo-500/10 rounded-3xl blur-2xl pointer-events-none" />
          
          {/* Main Card */}
          <div className="relative bg-white rounded-3xl shadow-xl p-8 border border-slate-100 z-10">
            {/* Top accent line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
            
            {/* Form content */}
            <div className="relative z-10">
              <Outlet />
            </div>
          </div>
        </motion.div>

        {/* Footer text */}
        <motion.p 
          className="text-center text-sm text-slate-400 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          © 2025 Nirmitee.io • All rights reserved
        </motion.p>
      </motion.div>
    </div>
  )
}

export default AuthLayout

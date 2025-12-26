import { Outlet, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../assets/Logo.png'

const AuthLayout = () => {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-slate-50">

      {/* Content Container */}
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Logo Section */}
        <div className="text-center mb-6">
          <Link to="/dashboard" className="inline-block">
            <img src={Logo} alt="Nirmitee.io" className="h-12 mx-auto" />
          </Link>
          <p className="text-slate-600 text-sm font-medium mt-3">
            Internal Communications Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
          <Outlet />
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © 2025 Nirmitee.io • All rights reserved
        </p>
      </motion.div>
    </div>
  )
}

export default AuthLayout

import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'

const Loading = ({ fullScreen = false, size = 'md', text = '' }) => {
  const { theme } = useTheme()
  const sizeClasses = {
    sm: { ring: 'w-8 h-8', dots: 'w-2 h-2', text: 'text-xs' },
    md: { ring: 'w-12 h-12', dots: 'w-2.5 h-2.5', text: 'text-sm' },
    lg: { ring: 'w-16 h-16', dots: 'w-3 h-3', text: 'text-base' }
  }

  const containerClasses = fullScreen
    ? `fixed inset-0 flex flex-col items-center justify-center backdrop-blur-sm z-50 ${
        theme === 'dark' 
          ? 'bg-[#0a0e17]/90' 
          : 'bg-white/90'
      }`
    : 'flex flex-col items-center justify-center py-12'

  return (
    <motion.div 
      className={containerClasses}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Simple Spinner */}
      <div className="relative">
        <motion.div
          className={`${sizeClasses[size].ring} rounded-full border-3 ${
            theme === 'dark' ? 'border-[#0a0e17] border-t-[#151a28]' : 'border-slate-200 border-t-[#ff4701]'
          }`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Loading Text */}
      {text && (
        <motion.p 
          className={`mt-4 ${sizeClasses[size].text} font-medium ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
      
      {/* Animated dots for visual interest */}
      {fullScreen && (
        <div className="flex gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-[#0a0e17]' : 'bg-[#ff4701]'}`}
              animate={{ y: [0, -6, 0] }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity, 
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default Loading

import { useTheme } from '../contexts/ThemeContext'
import { motion } from 'framer-motion'

/**
 * Minimal, modern, sober Empty State Component
 * Compact design with clean aesthetics
 * Centered on screen, 70% width
 */
const EmptyState = ({ 
  icon: Icon, 
  title, 
  message, 
  action, 
  compact = true 
}) => {
  const { theme } = useTheme()
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center justify-center w-full ${compact ? 'min-h-0 py-4' : 'min-h-[60vh]'}`}
    >
      <div className={`rounded-xl border ${
        theme === 'dark'
          ? 'bg-[#0a0e17] border-[#0a3a3c]'
          : 'bg-white border-slate-200'
      } ${compact ? 'p-6 py-8' : 'p-10 py-12'} w-full`}>
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          {Icon && (
            <div className={`${compact ? 'mb-2 p-2' : 'mb-4 p-3'} rounded-lg ${
              theme === 'dark'
                ? 'bg-[#0a3a3c]'
                : 'bg-slate-50'
            }`}>
              <Icon 
                size={compact ? 32 : 48} 
                strokeWidth={1.5}
                className={
                  theme === 'dark' 
                    ? 'text-slate-400' 
                    : 'text-slate-400'
                }
              />
            </div>
          )}
          
          {/* Title */}
          <h3 className={`${compact ? 'text-sm mb-1' : 'text-base mb-1.5'} font-semibold ${
            theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
          }`}>
            {title}
          </h3>
          
          {/* Message */}
          {message && (
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-center max-w-md mx-auto leading-relaxed ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {message}
            </p>
          )}
          
          {/* Action Button */}
          {action && (
            <div className="mt-4">
              {action}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default EmptyState

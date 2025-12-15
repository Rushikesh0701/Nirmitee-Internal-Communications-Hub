import { motion } from 'framer-motion'

const Loading = ({ fullScreen = false, size = 'md', text = '' }) => {
  const sizeClasses = {
    sm: { ring: 'w-8 h-8', dots: 'w-2 h-2', text: 'text-xs' },
    md: { ring: 'w-12 h-12', dots: 'w-2.5 h-2.5', text: 'text-sm' },
    lg: { ring: 'w-16 h-16', dots: 'w-3 h-3', text: 'text-base' }
  }

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50'
    : 'flex flex-col items-center justify-center py-12'

  return (
    <motion.div 
      className={containerClasses}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Premium Gradient Spinner */}
      <div className="relative">
        {/* Outer glow */}
        <div className={`${sizeClasses[size].ring} rounded-full absolute inset-0 blur-md opacity-40`}
          style={{ 
            background: 'conic-gradient(from 0deg, transparent, #667eea, #764ba2, transparent)' 
          }}
        />
        
        {/* Main spinner */}
        <motion.div
          className={`${sizeClasses[size].ring} relative`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <div 
            className="w-full h-full rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent 30%, #667eea 70%, #764ba2 100%)',
              WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${size === 'sm' ? '2px' : '3px'}), #000 calc(100% - ${size === 'sm' ? '2px' : '3px'}))`,
              mask: `radial-gradient(farthest-side, transparent calc(100% - ${size === 'sm' ? '2px' : '3px'}), #000 calc(100% - ${size === 'sm' ? '2px' : '3px'}))`
            }}
          />
        </motion.div>
        
        {/* Pulse dots in center */}
        {size !== 'sm' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        )}
      </div>

      {/* Loading Text */}
      {text && (
        <motion.p 
          className={`mt-4 ${sizeClasses[size].text} text-slate-500 font-medium`}
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
              className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400"
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

import { motion } from 'framer-motion'
import { useTheme } from '../../contexts/ThemeContext'

/**
 * Generic page skeleton loader - shows only in content area
 */
const PageSkeleton = ({ lines = 5, showHeader = true }) => {
  const { theme } = useTheme()
  
  return (
    <div className="space-y-4 animate-pulse">
      {showHeader && (
        <div className="space-y-3">
          <div className={`h-8 w-1/3 rounded ${
            theme === 'dark' ? 'bg-[#0a3a3c]' : 'bg-slate-200'
          }`} />
          <div className={`h-4 w-2/3 rounded ${
            theme === 'dark' ? 'bg-[#0a3a3c]' : 'bg-slate-200'
          }`} />
        </div>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-4 rounded ${
          theme === 'dark' ? 'bg-[#0a3a3c]' : 'bg-slate-200'
        } ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  )
}

export default PageSkeleton





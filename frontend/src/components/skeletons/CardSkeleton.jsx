import { useTheme } from '../../contexts/ThemeContext'

/**
 * Card skeleton loader for list pages
 */
const CardSkeleton = ({ count = 3 }) => {
  const { theme } = useTheme()
  
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`rounded-lg p-4 border ${
            theme === 'dark'
              ? 'bg-[#0a0e17] border-[#0a3a3c]'
              : 'bg-white border-slate-200'
          } animate-pulse`}
        >
          <div className="flex gap-4">
            <div className={`w-16 h-16 rounded-lg flex-shrink-0 ${
              theme === 'dark' ? 'bg-[#0a3a3c]' : 'bg-slate-200'
            }`} />
            <div className="flex-1 space-y-3">
              <div className={`h-5 rounded ${
                theme === 'dark' ? 'bg-[#0a3a3c]' : 'bg-slate-200'
              }`} />
              <div className={`h-4 w-3/4 rounded ${
                theme === 'dark' ? 'bg-[#0a3a3c]' : 'bg-slate-200'
              }`} />
              <div className={`h-4 w-1/2 rounded ${
                theme === 'dark' ? 'bg-[#0a3a3c]' : 'bg-slate-200'
              }`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default CardSkeleton





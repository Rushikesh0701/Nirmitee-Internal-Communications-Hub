import { useTheme } from '../../contexts/ThemeContext'

/**
 * Detail page skeleton loader
 */
const DetailSkeleton = () => {
  const { theme } = useTheme()
  
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-3">
        <div className={`h-10 w-3/4 rounded ${
          theme === 'dark' ? 'bg-[#0a3a3c]' : 'bg-slate-200'
        }`} />
        <div className={`h-5 w-1/2 rounded ${
          theme === 'dark' ? 'bg-[#0a3a3c]' : 'bg-slate-200'
        }`} />
      </div>
      
      {/* Image/Media */}
      <div className={`h-64 w-full rounded-lg ${
        theme === 'dark' ? 'bg-[#0a3a3c]' : 'bg-slate-200'
      }`} />
      
      {/* Content */}
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`h-4 rounded ${
              theme === 'dark' ? 'bg-[#0a3a3c]' : 'bg-slate-200'
            } ${i === 7 ? 'w-3/4' : 'w-full'}`}
          />
        ))}
      </div>
      
      {/* Actions */}
      <div className="flex gap-3">
        <div className={`h-10 w-24 rounded ${
          theme === 'dark' ? 'bg-[#0a3a3c]' : 'bg-slate-200'
        }`} />
        <div className={`h-10 w-24 rounded ${
          theme === 'dark' ? 'bg-[#0a3a3c]' : 'bg-slate-200'
        }`} />
      </div>
    </div>
  )
}

export default DetailSkeleton




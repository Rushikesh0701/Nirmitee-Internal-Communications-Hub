import { useTheme } from '../../contexts/ThemeContext'

/**
 * Grid skeleton loader for dashboard/grid layouts
 */
const GridSkeleton = ({ columns = 3, rows = 2 }) => {
  const { theme } = useTheme()
  
  const gridColsClass = columns === 2 ? 'lg:grid-cols-2' : columns === 3 ? 'lg:grid-cols-3' : columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${gridColsClass} gap-4`}>
      {Array.from({ length: columns * rows }).map((_, i) => (
        <div
          key={i}
          className={`rounded-lg p-6 border ${
            theme === 'dark'
              ? 'bg-[#052829] border-[#0a3a3c]'
              : 'bg-white border-slate-200'
          } animate-pulse`}
        >
          <div className={`h-6 w-1/2 rounded mb-4 ${
            theme === 'dark' ? 'bg-[#0a3a3c]' : 'bg-slate-200'
          }`} />
          <div className={`h-8 w-1/3 rounded mb-2 ${
            theme === 'dark' ? 'bg-[#0a3a3c]' : 'bg-slate-200'
          }`} />
          <div className={`h-4 w-2/3 rounded ${
            theme === 'dark' ? 'bg-[#0a3a3c]' : 'bg-slate-200'
          }`} />
        </div>
      ))}
    </div>
  )
}

export default GridSkeleton


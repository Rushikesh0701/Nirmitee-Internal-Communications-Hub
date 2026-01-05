import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useTheme } from '../contexts/ThemeContext'

/**
 * Reusable skeleton loader components for different page types
 */

// Card skeleton for list pages (blogs, news, discussions, etc.)
export const CardSkeleton = ({ count = 3, className = '' }) => {
  const { theme } = useTheme()
  const baseColor = theme === 'dark' ? '#151a28' : '#e2e8f0'
  const highlightColor = theme === 'dark' ? '#0a0e17' : '#f1f5f9'

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={`rounded-lg overflow-hidden border ${
            theme === 'dark'
              ? 'bg-[#0a0e17] border-[#151a28]'
              : 'bg-white border-slate-200'
          }`}
        >
          <Skeleton
            height={200}
            baseColor={baseColor}
            highlightColor={highlightColor}
            className="w-full"
          />
          <div className="p-4 space-y-3">
            <Skeleton
              height={24}
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
            <Skeleton
              count={3}
              height={16}
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
            <div className="flex items-center justify-between pt-2">
              <Skeleton
                width={100}
                height={14}
                baseColor={baseColor}
                highlightColor={highlightColor}
              />
              <Skeleton
                width={60}
                height={14}
                baseColor={baseColor}
                highlightColor={highlightColor}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Grid skeleton for news/dashboard cards
export const GridCardSkeleton = ({ count = 6, cols = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' }) => {
  const { theme } = useTheme()
  const baseColor = theme === 'dark' ? '#151a28' : '#e2e8f0'
  const highlightColor = theme === 'dark' ? '#0a0e17' : '#f1f5f9'

  return (
    <div className={`grid ${cols} gap-3`}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={`rounded-lg overflow-hidden border ${
            theme === 'dark'
              ? 'bg-[#0a0e17] border-[#151a28]'
              : 'bg-white border-slate-200'
          }`}
        >
          <Skeleton
            height={120}
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
          <div className="p-2 space-y-2">
            <Skeleton
              height={16}
              count={2}
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
            <Skeleton
              width={60}
              height={12}
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// List skeleton for announcements, discussions list
export const ListSkeleton = ({ count = 5 }) => {
  const { theme } = useTheme()
  const baseColor = theme === 'dark' ? '#151a28' : '#e2e8f0'
  const highlightColor = theme === 'dark' ? '#0a0e17' : '#f1f5f9'

  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={`rounded-lg border p-4 ${
            theme === 'dark'
              ? 'bg-[#0a0e17] border-[#151a28]'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 space-y-2">
              <Skeleton
                height={20}
                width="70%"
                baseColor={baseColor}
                highlightColor={highlightColor}
              />
              <Skeleton
                count={2}
                height={14}
                baseColor={baseColor}
                highlightColor={highlightColor}
              />
            </div>
            <Skeleton
              width={60}
              height={20}
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton
              width={80}
              height={12}
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
            <Skeleton
              width={100}
              height={12}
              baseColor={baseColor}
              highlightColor={highlightColor}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Detail page skeleton
export const DetailSkeleton = () => {
  const { theme } = useTheme()
  const baseColor = theme === 'dark' ? '#151a28' : '#e2e8f0'
  const highlightColor = theme === 'dark' ? '#0a0e17' : '#f1f5f9'

  return (
    <div
      className={`rounded-lg border p-6 ${
        theme === 'dark'
          ? 'bg-[#0a0e17] border-[#151a28]'
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="space-y-4">
        <Skeleton
          height={32}
          width="80%"
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
        <div className="flex items-center gap-4">
          <Skeleton
            width={100}
            height={14}
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
          <Skeleton
            width={150}
            height={14}
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
        </div>
        <Skeleton
          height={300}
          baseColor={baseColor}
          highlightColor={highlightColor}
          className="w-full"
        />
        <Skeleton
          count={8}
          height={16}
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
      </div>
    </div>
  )
}

// Table skeleton for directory/analytics
export const TableSkeleton = ({ rows = 10, cols = 5 }) => {
  const { theme } = useTheme()
  const baseColor = theme === 'dark' ? '#151a28' : '#e2e8f0'
  const highlightColor = theme === 'dark' ? '#0a0e17' : '#f1f5f9'

  return (
    <div
      className={`rounded-lg border overflow-hidden ${
        theme === 'dark'
          ? 'bg-[#0a0e17] border-[#151a28]'
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="p-4 border-b border-slate-200">
        <Skeleton
          height={20}
          width="30%"
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
      </div>
      <div className="divide-y">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {[...Array(cols)].map((_, j) => (
              <Skeleton
                key={j}
                height={16}
                baseColor={baseColor}
                highlightColor={highlightColor}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Stats cards skeleton
export const StatsSkeleton = ({ count = 4 }) => {
  const { theme } = useTheme()
  const baseColor = theme === 'dark' ? '#151a28' : '#e2e8f0'
  const highlightColor = theme === 'dark' ? '#0a0e17' : '#f1f5f9'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={`rounded-lg border p-4 ${
            theme === 'dark'
              ? 'bg-[#0a0e17] border-[#151a28]'
              : 'bg-white border-slate-200'
          }`}
        >
          <Skeleton
            height={14}
            width="60%"
            baseColor={baseColor}
            highlightColor={highlightColor}
            className="mb-3"
          />
          <Skeleton
            height={32}
            width="40%"
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
        </div>
      ))}
    </div>
  )
}

// Generic skeleton wrapper
export const PageSkeleton = ({ children, className = '' }) => {
  const { theme } = useTheme()
  return (
    <div
      className={`min-h-[400px] ${className} ${
        theme === 'dark' ? 'bg-[#0a0e17]' : 'bg-slate-50'
      }`}
    >
      {children}
    </div>
  )
}





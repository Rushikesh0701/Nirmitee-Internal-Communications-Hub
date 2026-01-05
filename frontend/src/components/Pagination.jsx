import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  limit = 10,
  onLimitChange,
  showLimitSelector = false 
}) => {
  const { theme } = useTheme()

  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first page
      pages.push(1)
      
      // Calculate start and end of middle pages
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)
      
      // Adjust if we're near the start
      if (currentPage <= 3) {
        end = Math.min(4, totalPages - 1)
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        start = Math.max(totalPages - 3, 2)
      }
      
      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('ellipsis-start')
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('ellipsis-end')
      }
      
      // Show last page
      pages.push(totalPages)
    }
    
    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 ${
      theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
    }`}>
      {/* Results info and limit selector */}
      <div className="flex items-center gap-4">
        {showLimitSelector && (
          <div className="flex items-center gap-2">
            <label className={`text-sm ${
              theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
            }`}>
              Show:
            </label>
            <select
              value={limit}
              onChange={(e) => onLimitChange?.(parseInt(e.target.value))}
              className={`px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-600 ${
                theme === 'dark'
                  ? 'border-[#151a28] bg-[#0a0e17]/50 text-slate-200'
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
        <span className={`text-sm ${
          theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
        }`}>
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg text-button transition-colors flex items-center gap-1 ${
            currentPage === 1
              ? 'opacity-50 cursor-not-allowed'
              : theme === 'dark'
              ? 'bg-[#ff4701] hover:bg-[#ff5500] text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <ChevronLeft size={18} />
          Previous
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === 'ellipsis-start' || pageNum === 'ellipsis-end') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className={`px-2 py-1 ${
                    theme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                  }`}
                >
                  ...
                </span>
              )
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-10 h-10 rounded-lg text-button transition-colors ${
                  currentPage === pageNum
                    ? theme === 'dark'
                      ? 'bg-[#ff4701] text-white'
                      : 'bg-[#ff4701] text-white'
                    : theme === 'dark'
                    ? 'bg-[#ff4701] hover:bg-[#ff5500] text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-lg text-button transition-colors flex items-center gap-1 ${
            currentPage === totalPages
              ? 'opacity-50 cursor-not-allowed'
              : theme === 'dark'
              ? 'bg-[#ff4701] hover:bg-[#ff5500] text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          Next
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

export default Pagination


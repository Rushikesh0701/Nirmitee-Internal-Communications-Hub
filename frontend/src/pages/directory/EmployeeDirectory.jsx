import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../services/api'
import RoleBadge from '../../components/RoleBadge'
import { Search, Mail, Building, Briefcase, X } from 'lucide-react'

export default function EmployeeDirectory() {
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')

  const { data, isLoading } = useQuery(
    ['directory', search, department],
    () => api.get('/users/directory', { params: { search, department } })
  )

  const users = data?.data?.data?.users || []

  // Get unique departments
  const departments = [...new Set(users.map((u) => u.department).filter(Boolean))]

  // Clear department filter
  const clearDepartment = () => {
    setDepartment('')
  }

  // Clear search
  const clearSearch = () => {
    setSearch('')
  }

  // Loading skeleton
  const UserCardSkeleton = () => (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-200 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-200"></div>
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="container-responsive responsive-padding animate-fade-in">
      {/* Header - Responsive */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 sm:mb-8"
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
          Employee Directory
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
          Find and connect with your colleagues
        </p>
      </motion.div>

      {/* Search & Filter - Responsive */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6"
      >
        {/* Search Input with Clear Button */}
        <div className="flex-1 relative">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by name, email, or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       transition-all text-sm sm:text-base"
          />
          {search && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 
                         text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Department Filter with Clear Button */}
        <div className="relative sm:min-w-[180px]">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       transition-all text-sm sm:text-base appearance-none
                       bg-white cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          {department && (
            <button
              onClick={clearDepartment}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 
                         text-gray-400 hover:text-gray-600 transition-colors
                         bg-white rounded-full p-0.5 hover:bg-gray-100 z-10"
              aria-label="Clear department filter"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Active Filters Display */}
      {(search || department) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-2 mb-4"
        >
          <span className="text-sm text-gray-600">Active filters:</span>
          {search && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 
                             text-primary-700 rounded-full text-sm">
              Search: &quot;{search}&quot;
              <button
                onClick={clearSearch}
                className="hover:bg-primary-100 rounded-full p-0.5 transition-colors"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {department && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 
                             text-purple-700 rounded-full text-sm">
              Department: {department}
              <button
                onClick={clearDepartment}
                className="hover:bg-purple-100 rounded-full p-0.5 transition-colors"
              >
                <X size={14} />
              </button>
            </span>
          )}
          <button
            onClick={() => {
              clearSearch()
              clearDepartment()
            }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        </motion.div>
      )}

      {/* User Grid - Fully Responsive */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {users.length > 0 ? (
            <>
              {/* Results Count */}
              <div className="mb-5 text-sm text-gray-600 font-medium">
                Showing {users.length} {users.length === 1 ? 'employee' : 'employees'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {users.map((user, index) => (
                  <motion.div
                    key={user.id || user._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link
                      to={`/profile/${user.id || user._id}`}
                      className="block bg-white rounded-xl shadow-sm p-6 
                                 hover:shadow-lg hover:border-primary-200 
                                 transition-all duration-300 border border-gray-200
                                 h-full flex flex-col"
                    >
                      {/* Avatar - Centered at top */}
                      <div className="flex justify-center mb-4">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-20 h-20 rounded-full object-cover
                                       ring-2 ring-gray-100"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full 
                                          bg-gradient-to-br from-blue-400 to-blue-600 
                                          flex items-center justify-center
                                          ring-2 ring-blue-100">
                            <span className="text-white font-semibold text-2xl">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Name and Role Badge */}
                      <div className="text-center mb-4">
                        <h3 className="font-semibold text-gray-900 text-lg mb-2 truncate">
                          {user.name}
                        </h3>
                        {user.role && (
                          <div className="flex justify-center">
                            <RoleBadge role={user.role} size="sm" />
                          </div>
                        )}
                      </div>

                      {/* Details - Vertical list */}
                      <div className="space-y-2 flex-1">
                        {user.designation && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Briefcase size={16} className="flex-shrink-0 text-gray-400" />
                            <span className="truncate">{user.designation}</span>
                          </div>
                        )}

                        {user.department && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Building size={16} className="flex-shrink-0 text-gray-400" />
                            <span className="truncate">{user.department}</span>
                          </div>
                        )}

                        {user.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Mail size={16} className="flex-shrink-0 text-gray-400" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Points - Bottom */}
                      {user.points > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="inline-flex items-center gap-1 px-3 py-1 
                                          bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
                            <span>⭐</span>
                            <span>{user.points} points</span>
                          </div>
                        </div>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 sm:py-16"
            >
              <div className="text-4xl sm:text-6xl mb-4">👥</div>
              <p className="text-gray-500 text-base sm:text-lg mb-2">
                No employees found
              </p>
              <p className="text-gray-400 text-sm sm:text-base mb-4">
                {search || department
                  ? "Try adjusting your search or filter"
                  : "No employees in the directory yet"}
              </p>
              {(search || department) && (
                <button
                  onClick={() => {
                    clearSearch()
                    clearDepartment()
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg 
                             hover:bg-primary-700 transition-colors text-sm sm:text-base"
                >
                  Clear Filters
                </button>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}

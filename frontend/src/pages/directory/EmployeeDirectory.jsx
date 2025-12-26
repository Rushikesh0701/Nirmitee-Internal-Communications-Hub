import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../services/api'
import RoleBadge from '../../components/RoleBadge'
import { Search, Mail, Building, Briefcase, X, Users } from 'lucide-react'
import { CardSkeleton } from '../../components/skeletons'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

export default function EmployeeDirectory() {
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [search, department])

  const { data, isLoading } = useQuery(
    ['directory', search, department, page, limit], 
    () => api.get('/users/directory', { 
      params: { search, department, page, limit } 
    }),
    { keepPreviousData: true }
  )

  const users = data?.data?.data?.users || []
  const pagination = data?.data?.data?.pagination || { total: 0, page: 1, limit: 20, pages: 1 }
  const departments = [...new Set(users.map((u) => u.department).filter(Boolean))]

  return (
    <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#0a3a3c]">
          <Users size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Employee Directory</h1>
          <p className="text-slate-500 text-sm mt-0.5">Find and connect with colleagues</p>
        </div>
      </motion.div>

      {/* Search & Filter */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors" size={16} />
          <input type="text" placeholder="Search by name, email, or skills..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-11" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={16} /></button>}
        </div>
        <select value={department} onChange={(e) => setDepartment(e.target.value)} className="input-select min-w-[180px]">
          <option value="">All Departments</option>
          {departments.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
        </select>
      </motion.div>

      {/* Active Filters */}
      {(search || department) && (
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Active filters:</span>
          {search && <span className="badge badge-primary flex items-center gap-1">Search: "{search}" <button onClick={() => setSearch('')}><X size={12} /></button></span>}
          {department && <span className="badge badge-info flex items-center gap-1">{department} <button onClick={() => setDepartment('')}><X size={12} /></button></span>}
          <button onClick={() => { setSearch(''); setDepartment(''); }} className="text-sm text-slate-700 hover:text-slate-700">Clear all</button>
        </motion.div>
      )}

      {/* Results Count */}
      {users.length > 0 && <motion.div variants={itemVariants} className="text-sm text-slate-500">Showing {users.length} {users.length === 1 ? 'employee' : 'employees'}</motion.div>}

      {/* User Grid */}
      {isLoading && !data ? (
        <CardSkeleton count={8} />
      ) : users.length > 0 ? (
        <>
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" variants={containerVariants}>
            {users.map((user) => (
              <motion.div key={user.id || user._id} variants={itemVariants} whileHover={{ y: -4 }}>
                <Link to={`/profile/${user.id || user._id}`} className="card-hover block group h-full flex flex-col items-center text-center">
                  <div className="mb-4">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-200" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-[#052829] flex items-center justify-center ring-2 ring-slate-200">
                        <span className="text-white font-semibold text-2xl">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm mb-1 group-hover:text-slate-700 transition-colors">{user.name}</h3>
                  {user.role && <div className="mb-3"><RoleBadge role={user.role} size="sm" /></div>}
                  <div className="space-y-1.5 text-sm text-slate-500 flex-1">
                    {user.designation && <div className="flex items-center gap-2 justify-center"><Briefcase size={14} /> {user.designation}</div>}
                    {user.department && <div className="flex items-center gap-2 justify-center"><Building size={14} /> {user.department}</div>}
                    {user.email && <div className="flex items-center gap-2 justify-center truncate"><Mail size={14} /> {user.email}</div>}
                  </div>
                  {user.points > 0 && <div className="mt-4 pt-4 border-t border-slate-100"><span className="badge badge-warning">⭐ {user.points} points</span></div>}
                </Link>
              </motion.div>
            ))}
          </motion.div>
          {pagination.pages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.pages}
              onPageChange={setPage}
              limit={limit}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
              showLimitSelector={true}
            />
          )}
        </>
      ) : (
        !isLoading && (
          <EmptyState
            icon={Users}
            title="No employees found"
            message={search || department ? 'Try adjusting your search' : 'No employees yet'}
            action={(search || department) && (
              <button onClick={() => { setSearch(''); setDepartment(''); }} className="btn btn-primary">Clear Filters</button>
            )}
          />
        )
      )}
    </motion.div>
  )
}

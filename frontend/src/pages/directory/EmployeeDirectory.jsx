import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Search, User, Mail, Building } from 'lucide-react'

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Employee Directory</h1>
        <p className="text-gray-600 mt-1">Find and connect with your colleagues</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Link
              key={user.id}
              to={`/profile/${user.id}`}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-xl">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  {user.designation && (
                    <p className="text-sm text-gray-600 mt-1">{user.designation}</p>
                  )}
                  {user.department && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                      <Building size={14} />
                      {user.department}
                    </div>
                  )}
                  {user.email && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <Mail size={14} />
                      {user.email}
                    </div>
                  )}
                  {user.points > 0 && (
                    <div className="mt-2 text-sm text-yellow-600 font-medium">
                      ⭐ {user.points} points
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && users.length === 0 && (
        <div className="text-center py-12 text-gray-500">No employees found</div>
      )}
    </div>
  )
}


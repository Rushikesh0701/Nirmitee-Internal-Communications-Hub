import { useQuery } from 'react-query'
import api from '../../services/api'
import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react'

const Analytics = () => {
  const { data: stats, isLoading } = useQuery('analytics-dashboard', () =>
    api.get('/analytics/dashboard').then((res) => res.data.data)
  )

  if (isLoading) {
    return <div className="text-center py-12">Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Platform insights and metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total News</p>
              <p className="text-2xl font-bold">{stats?.overview?.totalNews || 0}</p>
            </div>
            <BarChart3 className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Blogs</p>
              <p className="text-2xl font-bold">{stats?.overview?.totalBlogs || 0}</p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold">{stats?.overview?.totalUsers || 0}</p>
            </div>
            <Users className="text-purple-500" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Discussions</p>
              <p className="text-2xl font-bold">
                {stats?.overview?.totalDiscussions || 0}
              </p>
            </div>
            <Eye className="text-indigo-500" size={32} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Content Analytics</h2>
        <p className="text-gray-600">
          Detailed analytics and charts will be displayed here. Implementation needed
          for charts library integration (e.g., Chart.js, Recharts).
        </p>
      </div>
    </div>
  )
}

export default Analytics


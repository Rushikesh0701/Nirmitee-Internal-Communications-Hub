import { useState } from 'react'
import { useQuery } from 'react-query'
import api from '../../services/api'
import { BarChart3, TrendingUp, Users, Eye, Calendar, Filter } from 'lucide-react'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import Loading from '../../components/Loading'

const COLORS = {
  news: '#3b82f6', // blue
  blogs: '#10b981', // green
  discussions: '#8b5cf6' // purple
}

const Analytics = () => {
  const [dateRange, setDateRange] = useState('30') // days
  const [selectedEntity, setSelectedEntity] = useState('all') // all, news, blog, discussion

  const { data: stats, isLoading } = useQuery('analytics-dashboard', () =>
    api.get('/analytics/dashboard').then((res) => res.data.data)
  )

  // Calculate date range
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - parseInt(dateRange))

  const { data: contentAnalytics, isLoading: isLoadingContent } = useQuery(
    ['content-analytics', dateRange, selectedEntity],
    () => {
      const params = new URLSearchParams()
      if (selectedEntity !== 'all') {
        params.append('entityType', selectedEntity)
      }
      params.append('startDate', startDate.toISOString())
      params.append('endDate', endDate.toISOString())
      return api.get(`/analytics/content?${params.toString()}`).then((res) => res.data.data)
    },
    { enabled: !!stats }
  )

  if (isLoading) {
    return <Loading fullScreen />
  }

  // Prepare chart data
  const timeSeriesData = contentAnalytics?.combinedTimeSeries || []
  const pieData = [
    { name: 'News', value: stats?.overview?.totalNews || 0, color: COLORS.news },
    { name: 'Blogs', value: stats?.overview?.totalBlogs || 0, color: COLORS.blogs },
    { name: 'Discussions', value: stats?.overview?.totalDiscussions || 0, color: COLORS.discussions }
  ].filter(item => item.value > 0)

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform insights and metrics</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Content</option>
              <option value="news">News</option>
              <option value="blog">Blogs</option>
              <option value="discussion">Discussions</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
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

      {/* Content Analytics Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Time Series Line Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Content Creation Over Time</h2>
          {isLoadingContent ? (
            <div className="h-64 flex items-center justify-center">
              <Loading size="sm" />
            </div>
          ) : timeSeriesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(label) => `Date: ${formatDate(label)}`}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="news"
                  stroke={COLORS.news}
                  strokeWidth={2}
                  name="News"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="blogs"
                  stroke={COLORS.blogs}
                  strokeWidth={2}
                  name="Blogs"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="discussions"
                  stroke={COLORS.discussions}
                  strokeWidth={2}
                  name="Discussions"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available for the selected period
            </div>
          )}
        </div>
      </div>

      {/* Content Distribution Pie Chart */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Content Distribution</h2>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No content data available
          </div>
        )}
      </div>
    </div>
  )
}

export default Analytics


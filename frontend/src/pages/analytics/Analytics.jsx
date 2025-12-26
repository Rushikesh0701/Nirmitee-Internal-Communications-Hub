import { useState } from 'react'
import { useQuery } from 'react-query'
import { motion } from 'framer-motion'
import api from '../../services/api'
import { useTheme } from '../../contexts/ThemeContext'
import { BarChart3, TrendingUp, Users, Eye, Calendar, Filter } from 'lucide-react'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Loading from '../../components/Loading'

const COLORS = { news: '#64748b', blogs: '#10b981', discussions: '#8b5cf6' }

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

const Analytics = () => {
  const { theme } = useTheme()
  const [dateRange, setDateRange] = useState('30')
  const [selectedEntity, setSelectedEntity] = useState('all')

  const { data: stats, isLoading } = useQuery('analytics-dashboard', () => api.get('/analytics/dashboard').then((res) => res.data.data))

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - parseInt(dateRange))

  const { data: contentAnalytics, isLoading: isLoadingContent } = useQuery(
    ['content-analytics', dateRange, selectedEntity],
    () => {
      const params = new URLSearchParams()
      if (selectedEntity !== 'all') params.append('entityType', selectedEntity)
      params.append('startDate', startDate.toISOString())
      params.append('endDate', endDate.toISOString())
      return api.get(`/analytics/content?${params.toString()}`).then((res) => res.data.data)
    },
    { enabled: !!stats }
  )

  if (isLoading) return <Loading fullScreen size="lg" text="Loading analytics..." />

  const timeSeriesData = contentAnalytics?.combinedTimeSeries || []
  const pieData = [
    { name: 'News', value: stats?.overview?.totalNews || 0, color: COLORS.news },
    { name: 'Blogs', value: stats?.overview?.totalBlogs || 0, color: COLORS.blogs },
    { name: 'Discussions', value: stats?.overview?.totalDiscussions || 0, color: COLORS.discussions }
  ].filter(item => item.value > 0)

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const statCards = [
    { label: 'Total News', value: stats?.overview?.totalNews || 0, icon: BarChart3 },
    { label: 'Total Blogs', value: stats?.overview?.totalBlogs || 0, icon: TrendingUp },
    { label: 'Active Users', value: stats?.overview?.totalUsers || 0, icon: Users },
    { label: 'Discussions', value: stats?.overview?.totalDiscussions || 0, icon: Eye },
  ]

  return (
    <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-700">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Analytics Dashboard</h1>
            <p className="text-slate-500 text-xs mt-0.5">Platform insights and metrics</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
            <select value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)} className="input-select text-sm py-2">
              <option value="all">All Content</option>
              <option value="news">News</option>
              <option value="blog">Blogs</option>
              <option value="discussion">Discussions</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="input-select text-sm py-2">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {statCards.map((stat, index) => (
          <motion.div key={stat.label} className="card group hover:shadow-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-700">
                <stat.icon size={20} className="text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Time Series Chart */}
      <motion.div variants={itemVariants} className="card">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Content Creation Over Time</h2>
        {isLoadingContent ? (
          <div className="h-64 flex items-center justify-center"><Loading size="md" /></div>
        ) : timeSeriesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate} 
                angle={-45} 
                textAnchor="end" 
                height={80} 
                stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} 
                tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} 
              />
              <YAxis 
                stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} 
                tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} 
              />
              <Tooltip 
                labelFormatter={(label) => `Date: ${formatDate(label)}`} 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#1e293b' : 'white', 
                  border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  color: theme === 'dark' ? '#e2e8f0' : '#1e293b' 
                }} 
              />
              <Legend wrapperStyle={{ color: theme === 'dark' ? '#e2e8f0' : '#1e293b' }} />
              <Line type="monotone" dataKey="news" stroke={COLORS.news} strokeWidth={2} name="News" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="blogs" stroke={COLORS.blogs} strokeWidth={2} name="Blogs" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="discussions" stroke={COLORS.discussions} strokeWidth={2} name="Discussions" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className={`h-64 flex items-center justify-center transition-colors ${
            theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
          }`}>No data for selected period</div>
        )}
      </motion.div>

      {/* Pie Chart */}
      <motion.div variants={itemVariants} className="card">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Content Distribution</h2>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#1e293b' : 'white', 
                  border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  color: theme === 'dark' ? '#e2e8f0' : '#1e293b' 
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className={`h-64 flex items-center justify-center transition-colors ${
            theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
          }`}>No content data available</div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default Analytics

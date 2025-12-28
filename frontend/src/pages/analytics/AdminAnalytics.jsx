import { useState } from 'react'
import { useQuery } from 'react-query'
import { motion } from 'framer-motion'
import api from '../../services/api'
import { useTheme } from '../../contexts/ThemeContext'
import { 
  BarChart3, TrendingUp, Users, Eye, Calendar, Filter, 
  Award, ClipboardList, BookOpen, MessageSquare, FileText,
  Activity, Target, Zap
} from 'lucide-react'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { GridSkeleton, DetailSkeleton } from '../../components/skeletons'
import EmptyState from '../../components/EmptyState'

const containerVariants = { 
  hidden: { opacity: 0 }, 
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } } 
}
const itemVariants = { 
  hidden: { opacity: 0, y: 20 }, 
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } 
}

const AdminAnalytics = () => {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState('overview')
  const [engagementRange, setEngagementRange] = useState('daily')

  // Fetch all analytics data
  const { data: overview, isLoading: overviewLoading } = useQuery(
    'admin-analytics-overview',
    () => api.get('/analytics/overview').then((res) => res.data.data)
  )

  const { data: engagement, isLoading: engagementLoading } = useQuery(
    ['admin-analytics-engagement', engagementRange],
    () => api.get(`/analytics/engagement?range=${engagementRange}`).then((res) => res.data.data)
  )

  const { data: surveyAnalytics, isLoading: surveyLoading } = useQuery(
    'admin-analytics-surveys',
    () => api.get('/analytics/surveys').then((res) => res.data.data)
  )

  const { data: recognitionAnalytics, isLoading: recognitionLoading } = useQuery(
    'admin-analytics-recognitions',
    () => api.get('/analytics/recognitions').then((res) => res.data.data)
  )

  const { data: blogAnalytics, isLoading: blogLoading } = useQuery(
    'admin-analytics-blogs',
    () => api.get('/analytics/blogs').then((res) => res.data.data)
  )

  const { data: mau, isLoading: mauLoading } = useQuery(
    'admin-analytics-mau',
    () => api.get('/analytics/mau').then((res) => res.data.data)
  )

  const { data: postsComments, isLoading: postsCommentsLoading } = useQuery(
    'admin-analytics-posts-comments',
    () => api.get('/analytics/posts-comments').then((res) => res.data.data)
  )

  const { data: sentiment, isLoading: sentimentLoading } = useQuery(
    'admin-analytics-sentiment',
    () => api.get('/analytics/sentiment').then((res) => res.data.data)
  )

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'engagement', label: 'Engagement', icon: Activity },
    { id: 'blogs', label: 'Blogs', icon: BookOpen },
    { id: 'surveys', label: 'Surveys', icon: ClipboardList },
    { id: 'recognitions', label: 'Recognitions', icon: Award },
    { id: 'posts-comments', label: 'Posts/Comments', icon: MessageSquare },
    { id: 'users', label: 'Users', icon: Users }
  ]

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#0a3a3c]">
          <BarChart3 size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Admin Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">Comprehensive platform insights and metrics</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants} className="flex gap-2 border-b pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#0a3a3c] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div variants={itemVariants} className="space-y-3">
          {overviewLoading ? (
            <GridSkeleton columns={4} rows={2} />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="text-blue-500" size={20} />
                    <span className="text-xs text-slate-500">Users</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{overview?.users?.total || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">Total active users</p>
                </div>
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Award className="text-purple-500" size={20} />
                    <span className="text-xs text-slate-500">Recognitions</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{overview?.recognitions?.total || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">Total recognitions</p>
                </div>
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <ClipboardList className="text-green-500" size={20} />
                    <span className="text-xs text-slate-500">Surveys</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{overview?.surveys?.total || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">{overview?.surveys?.active || 0} active</p>
                </div>
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <BookOpen className="text-orange-500" size={20} />
                    <span className="text-xs text-slate-500">Courses</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{overview?.courses?.total || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">{overview?.courses?.completed || 0} completed</p>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="text-yellow-500" size={20} />
                  <h3 className="font-semibold text-slate-800">Total Points Awarded</h3>
                </div>
                <p className="text-4xl font-bold text-yellow-600">{overview?.points?.totalAwarded?.toLocaleString() || 0}</p>
              </div>

              {/* Posts and Comments Analytics */}
              {postsCommentsLoading ? (
                <DetailSkeleton />
              ) : postsComments ? (
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="text-blue-500" size={20} />
                    <h3 className="font-semibold text-slate-800">Posts & Comments</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Total Posts</p>
                      <p className="text-2xl font-bold text-slate-800">{postsComments?.posts?.total || 0}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {postsComments?.posts?.groupPosts || 0} group posts, {postsComments?.posts?.discussions || 0} discussions
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {postsComments?.posts?.thisMonth || 0} this month
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Total Comments</p>
                      <p className="text-2xl font-bold text-slate-800">{postsComments?.comments?.total || 0}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {postsComments?.comments?.groupComments || 0} group, {postsComments?.comments?.discussionComments || 0} discussion, {postsComments?.comments?.blogComments || 0} blog
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {postsComments?.comments?.thisMonth || 0} this month
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Sentiment Analysis */}
              {sentimentLoading ? (
                <DetailSkeleton />
              ) : sentiment ? (
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="text-purple-500" size={20} />
                    <h3 className="font-semibold text-slate-800">Sentiment Analysis</h3>
                  </div>
                  {sentiment?.implementationStatus === 'NOT_IMPLEMENTED' ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">{sentiment?.message || 'Sentiment analysis is not yet implemented.'}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Overall Sentiment</p>
                        <p className="text-lg font-bold text-slate-800 capitalize">{sentiment?.overall?.sentiment?.toLowerCase() || 'Neutral'}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Score: {sentiment?.overall?.score || 0} (Confidence: {((sentiment?.overall?.confidence || 0) * 100).toFixed(0)}%)
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-green-50 rounded">
                          <p className="text-lg font-bold text-green-600">{sentiment?.distribution?.positive || 0}%</p>
                          <p className="text-xs text-slate-600">Positive</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-lg font-bold text-gray-600">{sentiment?.distribution?.neutral || 0}%</p>
                          <p className="text-xs text-slate-600">Neutral</p>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded">
                          <p className="text-lg font-bold text-red-600">{sentiment?.distribution?.negative || 0}%</p>
                          <p className="text-xs text-slate-600">Negative</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </motion.div>
      )}

      {/* Engagement Tab */}
      {activeTab === 'engagement' && (
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center gap-3 mb-3">
            <Filter size={16} />
            <select 
              value={engagementRange} 
              onChange={(e) => setEngagementRange(e.target.value)}
              className="input-select text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          {engagementLoading ? (
            <DetailSkeleton />
          ) : engagement?.timeSeries?.length > 0 ? (
            <div className="card p-4">
              <h3 className="font-semibold text-slate-800 mb-4">Engagement Over Time</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={engagement.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#052829' : '#e2e8f0'} />
                  <XAxis 
                    dataKey="date" 
                    stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} 
                    tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} 
                    tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1e293b' : 'white', 
                      border: theme === 'dark' ? '1px solid #052829' : '1px solid #e2e8f0'
                    }} 
                  />
                  <Legend />
                  <Area type="monotone" dataKey="count" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={Activity} title="No engagement data" message="Engagement data will appear here" compact />
          )}
        </motion.div>
      )}

      {/* Blogs Tab */}
      {activeTab === 'blogs' && (
        <motion.div variants={itemVariants} className="space-y-3">
          {blogLoading ? (
            <GridSkeleton columns={2} rows={2} />
          ) : blogAnalytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="text-blue-500" size={20} />
                    <span className="text-xs text-slate-500">Total Blogs</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{blogAnalytics?.totalBlogs || 0}</p>
                </div>
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Eye className="text-green-500" size={20} />
                    <span className="text-xs text-slate-500">Total Views</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{blogAnalytics?.totalViews?.toLocaleString() || 0}</p>
                </div>
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <MessageSquare className="text-purple-500" size={20} />
                    <span className="text-xs text-slate-500">Total Comments</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{blogAnalytics?.totalComments || 0}</p>
                </div>
              </div>
              <div className="card p-4">
                <h3 className="font-semibold text-slate-800 mb-4">Top Blogs by Views</h3>
                {blogAnalytics?.topBlogsByViews?.length > 0 ? (
                  <div className="space-y-2">
                    {blogAnalytics.topBlogsByViews.slice(0, 5).map((blog, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="text-sm text-slate-700">{blog.title}</span>
                        <span className="text-sm font-semibold text-slate-800">{blog.views || 0} views</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No blog data available</p>
                )}
              </div>
              <div className="card p-4">
                <h3 className="font-semibold text-slate-800 mb-4">Top Blogs by Comments</h3>
                {blogAnalytics?.topBlogsByComments?.length > 0 ? (
                  <div className="space-y-2">
                    {blogAnalytics.topBlogsByComments.slice(0, 5).map((blog, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="text-sm text-slate-700">{blog.title}</span>
                        <span className="text-sm font-semibold text-slate-800">{blog.commentCount || 0} comments</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No blog data available</p>
                )}
              </div>
            </>
          ) : (
            <EmptyState icon={BookOpen} title="No blog analytics" message="Blog analytics will appear here" compact />
          )}
        </motion.div>
      )}

      {/* Surveys Tab */}
      {activeTab === 'surveys' && (
        <motion.div variants={itemVariants} className="space-y-3">
          {surveyLoading ? (
            <GridSkeleton columns={2} rows={2} />
          ) : surveyAnalytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <ClipboardList className="text-blue-500" size={20} />
                    <span className="text-xs text-slate-500">Total Surveys</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{surveyAnalytics?.totalSurveys || 0}</p>
                </div>
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="text-green-500" size={20} />
                    <span className="text-xs text-slate-500">Total Responses</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{surveyAnalytics?.totalResponses || 0}</p>
                </div>
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="text-purple-500" size={20} />
                    <span className="text-xs text-slate-500">Avg. Response Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">
                    {surveyAnalytics?.averageResponseRate ? `${surveyAnalytics.averageResponseRate.toFixed(1)}%` : '0%'}
                  </p>
                </div>
              </div>
              {surveyAnalytics?.topSurveys?.length > 0 && (
                <div className="card p-4">
                  <h3 className="font-semibold text-slate-800 mb-4">Top Surveys by Responses</h3>
                  <div className="space-y-2">
                    {surveyAnalytics.topSurveys.slice(0, 5).map((survey, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="text-sm text-slate-700">{survey.title}</span>
                        <span className="text-sm font-semibold text-slate-800">{survey.responseCount || 0} responses</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState icon={ClipboardList} title="No survey analytics" message="Survey analytics will appear here" compact />
          )}
        </motion.div>
      )}

      {/* Recognitions Tab */}
      {activeTab === 'recognitions' && (
        <motion.div variants={itemVariants} className="space-y-3">
          {recognitionLoading ? (
            <GridSkeleton columns={2} rows={2} />
          ) : recognitionAnalytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Award className="text-yellow-500" size={20} />
                    <span className="text-xs text-slate-500">Total Recognitions</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{recognitionAnalytics?.totalRecognitions || 0}</p>
                </div>
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="text-orange-500" size={20} />
                    <span className="text-xs text-slate-500">Total Points</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{recognitionAnalytics?.totalPointsAwarded?.toLocaleString() || 0}</p>
                </div>
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="text-blue-500" size={20} />
                    <span className="text-xs text-slate-500">Top Receivers</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{recognitionAnalytics?.topReceivers?.length || 0}</p>
                </div>
              </div>
              {recognitionAnalytics?.topReceivers?.length > 0 && (
                <div className="card p-4">
                  <h3 className="font-semibold text-slate-800 mb-4">Top Recognition Receivers</h3>
                  <div className="space-y-2">
                    {recognitionAnalytics.topReceivers.slice(0, 5).map((receiver, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <div>
                          <span className="text-sm font-medium text-slate-700">
                            {receiver.user?.firstName} {receiver.user?.lastName}
                          </span>
                          <p className="text-xs text-slate-500">{receiver.recognitionCount} recognitions</p>
                        </div>
                        <span className="text-sm font-semibold text-yellow-600">{receiver.totalPoints || 0} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState icon={Award} title="No recognition analytics" message="Recognition analytics will appear here" compact />
          )}
        </motion.div>
      )}

      {/* Posts/Comments Tab */}
      {activeTab === 'posts-comments' && (
        <motion.div variants={itemVariants} className="space-y-3">
          {postsCommentsLoading ? (
            <GridSkeleton columns={2} rows={2} />
          ) : postsComments ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="text-blue-500" size={20} />
                    <span className="text-xs text-slate-500">Total Posts</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{postsComments?.totalPosts || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">Across all groups</p>
                </div>
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <MessageSquare className="text-green-500" size={20} />
                    <span className="text-xs text-slate-500">Total Comments</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{postsComments?.totalComments || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">On all posts</p>
                </div>
              </div>
              {postsComments?.timeSeries && postsComments.timeSeries.length > 0 && (
                <div className="card p-4">
                  <h3 className="font-semibold text-slate-800 mb-4">Posts and Comments Over Time</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={postsComments.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#052829' : '#e2e8f0'} />
                      <XAxis 
                        dataKey="date" 
                        stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} 
                        tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                      />
                      <YAxis 
                        stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} 
                        tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#1e293b' : 'white', 
                          border: theme === 'dark' ? '1px solid #052829' : '1px solid #e2e8f0'
                        }} 
                      />
                      <Legend />
                      <Area type="monotone" dataKey="posts" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Posts" />
                      <Area type="monotone" dataKey="comments" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Comments" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <EmptyState icon={MessageSquare} title="No posts/comments data" message="Posts and comments analytics will appear here" compact />
          )}
        </motion.div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <motion.div variants={itemVariants} className="space-y-3">
          {mauLoading ? (
            <DetailSkeleton />
          ) : mau ? (
            <div className="card p-4">
              <h3 className="font-semibold text-slate-800 mb-4">Monthly Active Users (MAU)</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <p className="text-4xl font-bold text-slate-800">{mau?.currentMonth || 0}</p>
                <p className="text-sm text-slate-500">users this month</p>
              </div>
              {mau?.previousMonth && (
                <p className="text-sm text-slate-600">
                  Previous month: {mau.previousMonth} users
                  {mau.currentMonth > mau.previousMonth && (
                    <span className="text-green-600 ml-2">
                      ↑ {((mau.currentMonth - mau.previousMonth) / mau.previousMonth * 100).toFixed(1)}% increase
                    </span>
                  )}
                </p>
              )}
            </div>
          ) : (
            <EmptyState icon={Users} title="No user data" message="User analytics will appear here" compact />
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

export default AdminAnalytics


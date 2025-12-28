import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { 
  Users, 
  MessageSquare, 
  Heart, 
  TrendingUp, 
  Calendar,
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DetailSkeleton } from '../../components/skeletons';
import EmptyState from '../../components/EmptyState';

const GroupAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState('30');

  // Fetch group analytics from backend
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery(
    ['group-analytics', id],
    () => api.get(`/groups/${id}/analytics`).then(res => res.data?.data || res.data),
    { enabled: !!id }
  );

  // Extract group and analytics from response
  const group = analyticsData?.group;
  const analytics = analyticsData?.metrics ? {
    totalPosts: analyticsData.metrics.totalPosts || 0,
    totalComments: analyticsData.metrics.totalComments || 0,
    totalLikes: analyticsData.metrics.totalLikes || 0,
    totalMembers: analyticsData.metrics.memberCount || 0,
    engagementRate: analyticsData.metrics.engagementRate || 0,
    topPosts: analyticsData.topPosts?.byLikes || [],
    trends: analyticsData.trends || {}
  } : null;

  // Check if user is group admin or member
  const isGroupAdmin = group?.createdBy?._id === user?._id || group?.createdBy === user?._id;
  const isMember = analyticsData?.group?.isPublic || isGroupAdmin;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statCards = [
    { 
      label: 'Total Members', 
      value: analytics?.totalMembers || 0, 
      icon: Users,
      color: 'bg-blue-500'
    },
    { 
      label: 'Total Posts', 
      value: analytics?.totalPosts || 0, 
      icon: MessageSquare,
      color: 'bg-green-500'
    },
    { 
      label: 'Total Engagement', 
      value: (analytics?.totalLikes || 0) + (analytics?.totalComments || 0), 
      icon: Heart,
      color: 'bg-red-500'
    },
    { 
      label: 'Avg. Engagement/Post', 
      value: analytics?.totalPosts > 0 
        ? Math.round(((analytics?.totalLikes || 0) + (analytics?.totalComments || 0)) / analytics.totalPosts)
        : 0, 
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
  ];

  if (isLoadingAnalytics) {
    return <DetailSkeleton />;
  }

  if (!analyticsData || !group) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <EmptyState
          icon={Users}
          title="Group not found"
          message="The group you're looking for doesn't exist"
          action={
            <button onClick={() => navigate('/groups')} className="btn-primary">
              Back to Groups
            </button>
          }
        />
      </div>
    );
  }

  if (!isGroupAdmin && !isMember) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <EmptyState
          icon={BarChart3}
          title="Access Denied"
          message="You must be a member or admin to view group analytics"
          action={
            <button onClick={() => navigate(-1)} className="btn-primary">
              Go Back
            </button>
          }
        />
      </div>
    );
  }

  return (
    <motion.div 
      className="max-w-6xl mx-auto px-4 py-8 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-h1 text-slate-800 dark:text-slate-200">
              Group Analytics
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {group.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-500" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-select text-caption py-2"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      {isLoadingAnalytics ? (
        <DetailSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-caption text-slate-600 dark:text-slate-400">{stat.label}</p>
                    <p className="text-h1 text-slate-800 dark:text-slate-200 mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color} text-white`}>
                    <stat.icon size={24} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Top Posts */}
          {analytics?.topPosts?.byLikes?.length > 0 && (
            <div className="card">
              <h2 className="text-xl text-h3 text-slate-800 dark:text-slate-200 mb-4">
                Top Posts by Likes
              </h2>
              <div className="space-y-3">
                {analytics.topPosts.byLikes.slice(0, 5).map((post, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {post.content?.substring(0, 50) || 'Untitled Post'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-caption text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Heart size={14} /> {post.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={14} /> {post.commentCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Engagement Chart */}
          {analytics?.trends?.postsOverTime?.length > 0 && (
            <div className="card">
              <h2 className="text-xl text-h3 text-slate-800 dark:text-slate-200 mb-4">
                Posts Over Time
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.trends.postsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#0a0e17' : '#e2e8f0'} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
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
                      border: theme === 'dark' ? '1px solid #0a0e17' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#e2e8f0' : '#1e293b'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Posts" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {!isLoadingAnalytics && (!analytics || analytics.totalPosts === 0) && (
        <EmptyState
          icon={MessageSquare}
          title="No posts yet"
          message="Group analytics will appear here once posts are created"
          compact
        />
      )}
    </motion.div>
  );
};

export default GroupAnalytics;


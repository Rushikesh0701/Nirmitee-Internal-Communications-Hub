import { useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import { discussionAPI } from '../../services/discussionApi';
import { 
  MessageSquare, 
  Eye, 
  Heart, 
  TrendingUp, 
  Calendar,
  BarChart3,
  Users
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DetailSkeleton } from '../../components/skeletons';
import EmptyState from '../../components/EmptyState';

const DiscussionAnalytics = () => {
  const { theme } = useTheme();
  const [dateRange, setDateRange] = useState('30');

  // Fetch analytics from backend
  const { data: analytics, isLoading } = useQuery(
    ['discussions-analytics', dateRange],
    () => discussionAPI.getAnalytics()
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statCards = [
    { 
      label: 'Total Discussions', 
      value: analytics?.overview?.totalDiscussions || 0, 
      icon: MessageSquare,
      color: 'bg-blue-500'
    },
    { 
      label: 'Total Views', 
      value: analytics?.overview?.totalViews || 0, 
      icon: Eye,
      color: 'bg-green-500'
    },
    { 
      label: 'Total Comments', 
      value: analytics?.overview?.totalComments || 0, 
      icon: MessageSquare,
      color: 'bg-purple-500'
    },
    { 
      label: 'Avg. Engagement', 
      value: analytics?.overview?.averageEngagement || 0, 
      icon: TrendingUp,
      color: 'bg-orange-500'
    },
  ];

  const pieData = analytics?.topDiscussions?.byViews?.slice(0, 5).map(d => ({
    name: d.title?.length > 20 ? d.title.substring(0, 20) + '...' : d.title || 'Untitled',
    value: d.views || 0
  })) || [];

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <motion.div 
      className="max-w-6xl mx-auto px-4 py-8 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-slate-800 dark:text-slate-200">
            Discussion Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Platform-wide discussion insights
          </p>
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
      {isLoading ? (
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

          {/* Top Discussions */}
          {analytics?.topDiscussions?.byViews?.length > 0 && (
            <div className="card">
              <h2 className="text-xl text-h3 text-slate-800 dark:text-slate-200 mb-4">
                Top Discussions by Views
              </h2>
              <div className="space-y-3">
                {analytics.topDiscussions.byViews.slice(0, 5).map((discussion, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {discussion.title || 'Untitled'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-caption text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Eye size={14} /> {discussion.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={14} /> {discussion.commentCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pie Chart */}
          {pieData.length > 0 && (
            <div className="card">
              <h2 className="text-xl text-h3 text-slate-800 dark:text-slate-200 mb-4">
                Top Discussions Distribution
              </h2>
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                      border: theme === 'dark' ? '1px solid #0a0e17' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#e2e8f0' : '#1e293b'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {!isLoading && (!analytics || analytics.totalDiscussions === 0) && (
        <EmptyState
          icon={MessageSquare}
          title="No discussions yet"
          message="Discussion analytics will appear here once discussions are created"
          compact
        />
      )}
    </motion.div>
  );
};

export default DiscussionAnalytics;


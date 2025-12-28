import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { blogAPI } from '../../services/blogApi';
import api from '../../services/api';
import { 
  ArrowLeft, 
  Eye, 
  Heart, 
  MessageCircle, 
  TrendingUp, 
  Calendar,
  BarChart3,
  BookOpen
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DetailSkeleton } from '../../components/skeletons';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';

const BlogAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState('30');

  // Fetch blog details
  const { data: blog, isLoading: isLoadingBlog } = useQuery(
    ['blog', id],
    () => blogAPI.getById(id).then(res => res.data?.data || res.data || res),
    { enabled: !!id }
  );

  // Check if user is the author
  const isAuthor = blog?.authorId?._id === user?._id || blog?.authorId === user?._id;

  // Fetch analytics data from backend
  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery(
    ['blog-analytics', id],
    () => blogAPI.getAnalytics(id),
    { enabled: !!id && !!blog && isAuthor }
  );

  if (isLoadingBlog) {
    return <DetailSkeleton />;
  }

  if (!blog) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <EmptyState
          icon={BookOpen}
          title="Blog not found"
          message="The blog you're looking for doesn't exist"
          action={
            <Link to="/blogs" className="btn-primary">
              Back to Blogs
            </Link>
          }
        />
      </div>
    );
  }

  if (!isAuthor) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <EmptyState
          icon={BarChart3}
          title="Access Denied"
          message="You can only view analytics for your own blogs"
          action={
            <button onClick={() => navigate(-1)} className="btn-primary">
              Go Back
            </button>
          }
        />
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statCards = [
    { 
      label: 'Total Views', 
      value: analytics?.metrics?.views || 0, 
      icon: Eye,
      color: 'bg-blue-500'
    },
    { 
      label: 'Total Likes', 
      value: analytics?.metrics?.likes || 0, 
      icon: Heart,
      color: 'bg-red-500'
    },
    { 
      label: 'Total Comments', 
      value: analytics?.metrics?.totalComments || 0, 
      icon: MessageCircle,
      color: 'bg-green-500'
    },
    { 
      label: 'Engagement Rate', 
      value: `${analytics?.metrics?.engagementRate || 0}%`, 
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
  ];

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
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              Blog Analytics
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {blog.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-500" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-select text-sm py-2"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
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
                <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
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

      {/* Charts */}
      {isLoadingAnalytics ? (
        <DetailSkeleton />
      ) : analytics?.engagement?.commentsOverTime?.length > 0 ? (
        <>
          {/* Engagement Over Time */}
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
              Comments Over Time
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.engagement.commentsOverTime}>
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
                  labelFormatter={(label) => `Date: ${formatDate(label)}`}
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                    border: theme === 'dark' ? '1px solid #0a0e17' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#e2e8f0' : '#1e293b'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} name="Comments" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Commenters */}
          {analytics?.engagement?.topCommenters?.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Top Commenters
              </h2>
              <div className="space-y-3">
                {analytics.engagement.topCommenters.map((commenter, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          {commenter.user?.firstName?.[0] || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {commenter.user?.firstName} {commenter.user?.lastName}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {commenter.commentCount || 0} comments
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={BarChart3}
          title="No analytics data"
          message="Analytics data will appear here once your blog receives engagement"
          compact
        />
      )}
    </motion.div>
  );
};

export default BlogAnalytics;


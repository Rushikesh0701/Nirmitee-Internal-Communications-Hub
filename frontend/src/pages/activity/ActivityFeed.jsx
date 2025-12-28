import { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import { 
  Activity, 
  BookOpen, 
  MessageSquare,
  Users,
  Award,
  Bell,
  Filter,
  Calendar
} from 'lucide-react';
import { DetailSkeleton } from '../../components/skeletons';
import EmptyState from '../../components/EmptyState';

const ActivityFeed = () => {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('all'); // all, blogs, discussions, recognitions, learning
  const [dateRange, setDateRange] = useState('7');

  // Fetch activity feed (combining multiple sources)
  const { data: activities, isLoading } = useQuery(
    ['activity-feed', filter, dateRange],
    async () => {
      const activities = [];

      // Fetch recent blogs
      if (filter === 'all' || filter === 'blogs') {
        try {
          const blogsRes = await api.get('/blogs', { params: { limit: 20, sort: '-createdAt' } });
          const blogs = blogsRes.data?.data || blogsRes.data || [];
          blogs.forEach(blog => {
            activities.push({
              id: blog._id,
              type: 'blog',
              title: blog.title,
              author: blog.authorId,
              createdAt: blog.createdAt,
              icon: BookOpen,
              link: `/blogs/${blog._id}`
            });
          });
        } catch (error) {
          console.error('Error fetching blogs:', error);
        }
      }

      // Fetch recent discussions
      if (filter === 'all' || filter === 'discussions') {
        try {
          const discussionsRes = await api.get('/discussions', { params: { limit: 20, sort: '-createdAt' } });
          const discussions = discussionsRes.data?.data || discussionsRes.data || [];
          discussions.forEach(discussion => {
            activities.push({
              id: discussion._id,
              type: 'discussion',
              title: discussion.title,
              author: discussion.authorId,
              createdAt: discussion.createdAt,
              icon: MessageSquare,
              link: `/discussions/${discussion._id}`
            });
          });
        } catch (error) {
          console.error('Error fetching discussions:', error);
        }
      }

      // Fetch recent recognitions
      if (filter === 'all' || filter === 'recognitions') {
        try {
          const recognitionsRes = await api.get('/recognitions', { params: { limit: 20 } });
          const recognitions = recognitionsRes.data?.data || recognitionsRes.data || [];
          recognitions.forEach(recognition => {
            activities.push({
              id: recognition._id,
              type: 'recognition',
              title: `Recognized ${recognition.receiverId?.firstName || 'someone'}`,
              author: recognition.senderId,
              receiver: recognition.receiverId,
              points: recognition.points,
              createdAt: recognition.createdAt,
              icon: Award,
              link: '/recognitions'
            });
          });
        } catch (error) {
          console.error('Error fetching recognitions:', error);
        }
      }

      // Sort by date
      activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Apply date range filter
      const days = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return activities.filter(activity => new Date(activity.createdAt) >= cutoffDate);
    }
  );

  const getActivityTypeLabel = (type) => {
    const labels = {
      blog: 'Published a blog',
      discussion: 'Started a discussion',
      recognition: 'Gave recognition',
      learning: 'Completed a course'
    };
    return labels[type] || 'Activity';
  };

  const getActivityColor = (type) => {
    const colors = {
      blog: 'bg-blue-500',
      discussion: 'bg-purple-500',
      recognition: 'bg-yellow-500',
      learning: 'bg-green-500'
    };
    return colors[type] || 'bg-slate-500';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto px-4 py-8 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-slate-800 dark:text-slate-200">
            Activity Feed
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Recent activity across the platform
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            <span className="text-caption text-slate-600 dark:text-slate-400">Type:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-select text-caption"
            >
              <option value="all">All Activities</option>
              <option value="blogs">Blogs</option>
              <option value="discussions">Discussions</option>
              <option value="recognitions">Recognitions</option>
              <option value="learning">Learning</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-500" />
            <span className="text-caption text-slate-600 dark:text-slate-400">Period:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-select text-caption"
            >
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity List */}
      {isLoading ? (
        <DetailSkeleton />
      ) : activities && activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            const author = activity.author;
            const authorName = author?.firstName 
              ? `${author.firstName} ${author.lastName || ''}` 
              : 'Unknown User';

            return (
              <motion.div
                key={activity.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={activity.link || '#'}
                  className="card hover:shadow-lg transition-shadow block"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg text-white ${getActivityColor(activity.type)}`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-h3 text-slate-800 dark:text-slate-200">
                          {authorName}
                        </span>
                        <span className="text-caption text-slate-600 dark:text-slate-400">
                          {getActivityTypeLabel(activity.type)}
                        </span>
                      </div>
                      <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-1">
                        {activity.title}
                      </h3>
                      {activity.points && (
                        <span className="inline-block px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-overline mb-2">
                          +{activity.points} points
                        </span>
                      )}
                      <p className="text-overline text-slate-500 dark:text-slate-400">
                        {formatTimeAgo(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Activity}
          title="No activity"
          message="No recent activity found for the selected filters"
          compact
        />
      )}
    </motion.div>
  );
};

export default ActivityFeed;


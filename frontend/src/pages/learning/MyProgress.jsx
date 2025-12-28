import { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { learningApi } from '../../services/learningApi';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Award,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DetailSkeleton } from '../../components/skeletons';
import EmptyState from '../../components/EmptyState';

const MyProgress = () => {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('all'); // all, completed, in-progress, not-started

  // Fetch user's enrolled courses
  const { data: courses, isLoading } = useQuery(
    'my-courses',
    () => learningApi.getUserCourses().then(res => res.data?.data || res.data || [])
  );

  // Calculate statistics
  const stats = courses ? {
    total: courses.length || 0,
    completed: courses.filter(c => c.progressPercentage >= 100).length,
    inProgress: courses.filter(c => c.progressPercentage > 0 && c.progressPercentage < 100).length,
    notStarted: courses.filter(c => c.progressPercentage === 0).length,
    avgProgress: courses.length > 0
      ? Math.round(courses.reduce((sum, c) => sum + (c.progressPercentage || 0), 0) / courses.length)
      : 0
  } : null;

  // Filter courses
  const filteredCourses = courses ? (() => {
    switch (filter) {
      case 'completed':
        return courses.filter(c => c.progressPercentage >= 100);
      case 'in-progress':
        return courses.filter(c => c.progressPercentage > 0 && c.progressPercentage < 100);
      case 'not-started':
        return courses.filter(c => c.progressPercentage === 0);
      default:
        return courses;
    }
  })() : [];

  // Generate progress chart data
  const progressData = courses ? courses
    .filter(c => c.progressPercentage > 0)
    .map(c => ({
      name: c.course?.title || c.title || 'Course',
      progress: c.progressPercentage || 0
    }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 10) : [];

  const statCards = [
    { 
      label: 'Total Courses', 
      value: stats?.total || 0, 
      icon: BookOpen,
      color: 'bg-blue-500'
    },
    { 
      label: 'Completed', 
      value: stats?.completed || 0, 
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    { 
      label: 'In Progress', 
      value: stats?.inProgress || 0, 
      icon: Clock,
      color: 'bg-yellow-500'
    },
    { 
      label: 'Avg. Progress', 
      value: `${stats?.avgProgress || 0}%`, 
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
        <div>
          <h1 className="text-h1 text-slate-800 dark:text-slate-200">
            My Learning Progress
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track your course progress and achievements
          </p>
        </div>
        <Link to="/learning/my-certificates" className="btn-secondary flex items-center gap-2">
          <Award size={16} />
          My Certificates
        </Link>
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

          {/* Filter */}
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-select"
            >
              <option value="all">All Courses</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="not-started">Not Started</option>
            </select>
          </div>

          {/* Courses List */}
          {filteredCourses.length > 0 ? (
            <div className="card">
              <h2 className="text-xl text-h3 text-slate-800 dark:text-slate-200 mb-4">
                {filter === 'all' ? 'All Courses' : 
                 filter === 'completed' ? 'Completed Courses' :
                 filter === 'in-progress' ? 'In Progress Courses' : 'Not Started Courses'}
              </h2>
              <div className="space-y-4">
                {filteredCourses.map((course) => {
                  const courseData = course.course || course;
                  const progress = course.progressPercentage || 0;
                  return (
                    <Link
                      key={course._id || course.id}
                      to={`/learning/${courseData._id || courseData.id}`}
                      className="block p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-h3 text-slate-800 dark:text-slate-200">
                            {courseData.title}
                          </h3>
                          {courseData.description && (
                            <p className="text-caption text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                              {courseData.description}
                            </p>
                          )}
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-caption text-slate-600 dark:text-slate-400">
                                Progress
                              </span>
                              <span className="text-button text-slate-800 dark:text-slate-200">
                                {progress}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        {progress >= 100 && (
                          <CheckCircle size={24} className="text-green-500 ml-4" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No courses found"
              message={`You don't have any ${filter === 'all' ? '' : filter.replace('-', ' ')} courses yet`}
              compact
            />
          )}

          {/* Progress Chart */}
          {progressData.length > 0 && (
            <div className="card">
              <h2 className="text-xl text-h3 text-slate-800 dark:text-slate-200 mb-4">
                Top Courses by Progress
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#0a0e17' : '#e2e8f0'} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                    stroke={theme === 'dark' ? '#64748b' : '#94a3b8'}
                    tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  />
                  <YAxis 
                    domain={[0, 100]}
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
                  <Line type="monotone" dataKey="progress" stroke="#3b82f6" strokeWidth={2} name="Progress %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default MyProgress;


import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { moderationApi } from '../../services/moderationApi'
import { Shield, FileText, Megaphone, AlertCircle, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { CardSkeleton } from '../../components/skeletons'
import EmptyState from '../../components/EmptyState'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

const ModerationDashboard = () => {
  const { data: stats, isLoading } = useQuery('moderation-stats', moderationApi.getStats)

  const statCards = [
    {
      label: 'Pending Blogs',
      value: stats?.blogs?.pending || 0,
      icon: FileText,
      color: 'bg-amber-500',
      link: '/moderation/blogs?status=PENDING',
      bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30',
      borderColor: 'border-amber-200 dark:border-amber-700'
    },
    {
      label: 'Pending Announcements',
      value: stats?.announcements?.pending || 0,
      icon: Megaphone,
      color: 'bg-blue-500',
      link: '/moderation/announcements?status=PENDING',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30',
      borderColor: 'border-blue-200 dark:border-blue-700'
    },
    {
      label: 'Total Pending',
      value: stats?.totalPending || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
      link: null,
      bgGradient: 'from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30',
      borderColor: 'border-red-200 dark:border-red-700'
    },
    {
      label: 'Approved Blogs',
      value: stats?.blogs?.approved || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      link: '/moderation/blogs?status=APPROVED',
      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30',
      borderColor: 'border-green-200 dark:border-green-700'
    },
    {
      label: 'Approved Announcements',
      value: stats?.announcements?.approved || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      link: '/moderation/announcements?status=APPROVED',
      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30',
      borderColor: 'border-green-200 dark:border-green-700'
    },
    {
      label: 'Rejected Blogs',
      value: stats?.blogs?.rejected || 0,
      icon: XCircle,
      color: 'bg-red-500',
      link: '/moderation/blogs?status=REJECTED',
      bgGradient: 'from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30',
      borderColor: 'border-red-200 dark:border-red-700'
    },
    {
      label: 'Rejected Announcements',
      value: stats?.announcements?.rejected || 0,
      icon: XCircle,
      color: 'bg-red-500',
      link: '/moderation/announcements?status=REJECTED',
      bgGradient: 'from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30',
      borderColor: 'border-red-200 dark:border-red-700'
    }
  ]

  if (isLoading) {
    return <CardSkeleton count={4} />
  }

  return (
    <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#151a28]">
          <Shield size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">Moderation Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Review and moderate content</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat, index) => {
          const CardContent = (
            <div className={`card p-4 border-2 ${stat.borderColor} bg-gradient-to-br ${stat.bgGradient} hover:shadow-lg transition-all ${stat.link ? 'cursor-pointer' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                  <stat.icon size={20} className={stat.color.replace('bg-', 'text-')} />
                </div>
                {stat.link && (
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    View →
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stat.value}</p>
              </div>
            </div>
          )

          return stat.link ? (
            <Link key={index} to={stat.link} className="block">
              {CardContent}
            </Link>
          ) : (
            <div key={index}>{CardContent}</div>
          )
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link to="/moderation/blogs?status=PENDING" className="card p-5 hover:shadow-lg transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 group-hover:scale-110 transition-transform">
              <FileText size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Moderate Blogs</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {stats?.blogs?.pending || 0} pending review
              </p>
            </div>
            <TrendingUp size={20} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
          </div>
        </Link>

        <Link to="/moderation/announcements?status=PENDING" className="card p-5 hover:shadow-lg transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 group-hover:scale-110 transition-transform">
              <Megaphone size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Moderate Announcements</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {stats?.announcements?.pending || 0} pending review
              </p>
            </div>
            <TrendingUp size={20} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
          </div>
        </Link>
      </motion.div>

      {/* Empty State */}
      {stats && stats.totalPending === 0 && (
        <motion.div variants={itemVariants}>
          <EmptyState
            icon={CheckCircle}
            title="All caught up!"
            message="There are no pending items to moderate"
          />
        </motion.div>
      )}
    </motion.div>
  )
}

export default ModerationDashboard


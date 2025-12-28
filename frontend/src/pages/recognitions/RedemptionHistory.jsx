import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { motion } from 'framer-motion'
import { recognitionRewardApi } from '../../services/recognitionRewardApi'
import { Gift, CheckCircle, XCircle, Clock, Calendar, Filter } from 'lucide-react'
import { CardSkeleton } from '../../components/skeletons'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import { format } from 'date-fns'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

const RedemptionHistory = () => {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [statusFilter, setStatusFilter] = useState('all')

  const { data, isLoading } = useQuery(
    ['user-redemptions', page, limit, statusFilter],
    () => recognitionRewardApi.getUserRedemptions({ page, limit, status: statusFilter !== 'all' ? statusFilter : undefined }),
    { keepPreviousData: true }
  )

  const redemptions = data?.data?.redemptions || []
  const pagination = data?.data?.pagination || { total: 0, page: 1, limit: 20, pages: 1 }

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
      APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
      FULFILLED: { label: 'Fulfilled', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle }
    }
    const badge = badges[status] || badges.PENDING
    const Icon = badge.icon
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${badge.color} flex items-center gap-1`}>
        <Icon size={12} />
        {badge.label}
      </span>
    )
  }

  return (
    <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#0a3a3c]">
          <Gift size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">My Redemption History</h1>
          <p className="text-slate-500 text-sm mt-0.5">View your reward redemption requests</p>
        </div>
      </motion.div>

      {/* Status Filter */}
      <motion.div variants={itemVariants} className="flex gap-2 border-b pb-2">
        {['all', 'PENDING', 'APPROVED', 'REJECTED', 'FULFILLED'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status)
              setPage(1)
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === status
                ? 'bg-[#0a3a3c] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {status === 'all' ? 'All' : status}
          </button>
        ))}
      </motion.div>

      {/* Redemptions List */}
      {isLoading ? (
        <CardSkeleton count={5} />
      ) : redemptions.length > 0 ? (
        <>
          <motion.div variants={itemVariants} className="space-y-3">
            {redemptions.map((redemption) => (
              <motion.div
                key={redemption._id}
                variants={itemVariants}
                className="card p-4 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {redemption.reward?.image && (
                        <img
                          src={redemption.reward.image}
                          alt={redemption.reward.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-slate-800">
                            {redemption.rewardId?.title || redemption.reward?.title || 'Reward'}
                          </h3>
                          {getStatusBadge(redemption.status)}
                        </div>
                        {(redemption.rewardId?.description || redemption.reward?.description) && (
                          <p className="text-sm text-slate-600">{redemption.rewardId?.description || redemption.reward?.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={16} />
                        <span>Requested: {format(new Date(redemption.requestedAt), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="text-sm text-slate-600">
                        <strong>Points Used:</strong> {redemption.pointsSpent || redemption.pointsRequired || redemption.rewardId?.points || redemption.reward?.points || 0}
                      </div>
                      {redemption.processedAt && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar size={16} />
                          <span>Processed: {format(new Date(redemption.processedAt), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                    </div>

                    {redemption.status === 'REJECTED' && redemption.rejectionReason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        <strong>Rejection Reason:</strong> {redemption.rejectionReason}
                      </div>
                    )}

                    {redemption.status === 'APPROVED' && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                        Your redemption request has been approved! You will receive your reward soon.
                      </div>
                    )}

                    {redemption.status === 'FULFILLED' && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                        Your reward has been fulfilled!
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {pagination.pages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.pages}
              onPageChange={setPage}
              limit={limit}
              onLimitChange={(newLimit) => {
                setLimit(newLimit)
                setPage(1)
              }}
              showLimitSelector={true}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={Gift}
          title={`No ${statusFilter === 'all' ? '' : statusFilter.toLowerCase() + ' '}redemptions found`}
          message={statusFilter === 'PENDING' ? 'You have no pending redemption requests' : 'You have not redeemed any rewards yet'}
        />
      )}
    </motion.div>
  )
}

export default RedemptionHistory


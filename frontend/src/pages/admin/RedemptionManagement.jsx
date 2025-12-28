import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Gift, CheckCircle, XCircle, User, Calendar, Filter, ArrowLeft } from 'lucide-react'
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

const RedemptionManagement = () => {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [statusFilter, setStatusFilter] = useState('all')
  const [rejectReason, setRejectReason] = useState('')
  const [selectedRedemption, setSelectedRedemption] = useState(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery(
    ['admin-redemptions', page, limit, statusFilter],
    () => {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      return api.get(`/admin/redemptions?${params.toString()}`).then((res) => res.data.data)
    },
    { keepPreviousData: true }
  )

  const approveMutation = useMutation(
    (id) => api.put(`/admin/redemptions/${id}/approve`),
    {
      onSuccess: () => {
        toast.success('Redemption approved successfully')
        queryClient.invalidateQueries('admin-redemptions')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve redemption')
      }
    }
  )

  const rejectMutation = useMutation(
    ({ id, reason }) => api.put(`/admin/redemptions/${id}/reject`, { reason }),
    {
      onSuccess: () => {
        toast.success('Redemption rejected')
        queryClient.invalidateQueries('admin-redemptions')
        setShowRejectDialog(false)
        setSelectedRedemption(null)
        setRejectReason('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reject redemption')
      }
    }
  )

  const handleApprove = (redemptionId) => {
    if (window.confirm('Are you sure you want to approve this redemption?')) {
      approveMutation.mutate(redemptionId)
    }
  }

  const handleReject = (redemption) => {
    setSelectedRedemption(redemption)
    setShowRejectDialog(true)
  }

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    rejectMutation.mutate({ id: selectedRedemption._id, reason: rejectReason })
  }

  const redemptions = data?.redemptions || []
  const pagination = data?.pagination || { total: 0, page: 1, limit: 20, pages: 1 }

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-200' },
      APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800 border-green-200' },
      REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
      FULFILLED: { label: 'Fulfilled', color: 'bg-blue-100 text-blue-800 border-blue-200' }
    }
    const badge = badges[status] || badges.PENDING
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded border ${badge.color}`}>
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Redemption Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage reward redemption requests</p>
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
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {redemption.rewardId?.title || redemption.reward?.title || 'Reward'}
                      </h3>
                      {getStatusBadge(redemption.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User size={16} />
                        <span>
                          {redemption.userId?.firstName || redemption.user?.firstName} {redemption.userId?.lastName || redemption.user?.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={16} />
                        <span>{format(new Date(redemption.requestedAt), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="text-sm text-slate-600">
                        <strong>Points:</strong> {redemption.pointsSpent || redemption.pointsRequired || redemption.rewardId?.points || redemption.reward?.points || 0}
                      </div>
                      {(redemption.rewardId?.description || redemption.reward?.description) && (
                        <div className="text-sm text-slate-600">
                          <strong>Description:</strong> {redemption.rewardId?.description || redemption.reward?.description}
                        </div>
                      )}
                    </div>

                    {redemption.status === 'REJECTED' && redemption.rejectionReason && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 mb-2">
                        <strong>Rejection Reason:</strong> {redemption.rejectionReason}
                      </div>
                    )}

                    {(redemption.approvedBy || redemption.processedBy) && (
                      <div className="text-xs text-slate-500">
                        Processed by {(redemption.approvedBy?.firstName || redemption.processedBy?.firstName)} {(redemption.approvedBy?.lastName || redemption.processedBy?.lastName)} on{' '}
                        {format(new Date(redemption.approvedAt || redemption.processedAt), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>

                  {redemption.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(redemption._id)}
                        disabled={approveMutation.isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(redemption)}
                        disabled={rejectMutation.isLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  )}
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
          message={statusFilter === 'PENDING' ? 'All redemption requests have been processed' : 'No redemption requests'}
        />
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-4">Reject Redemption</h3>
            <p className="text-sm text-slate-600 mb-4">
              Please provide a reason for rejecting this redemption request. The user will be notified.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectDialog(false)
                  setSelectedRedemption(null)
                  setRejectReason('')
                }}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={rejectMutation.isLoading || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejectMutation.isLoading ? 'Rejecting...' : 'Reject Redemption'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

export default RedemptionManagement


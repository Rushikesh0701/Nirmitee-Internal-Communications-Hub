import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { moderationApi } from '../../services/moderationApi'
import { Megaphone, CheckCircle, XCircle, User, Calendar, ArrowLeft } from 'lucide-react'
import { CardSkeleton } from '../../components/skeletons'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import toast from 'react-hot-toast'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

const AnnouncementModeration = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [status, setStatus] = useState(searchParams.get('status') || 'PENDING')
  const [rejectReason, setRejectReason] = useState('')
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [selectedAnnouncements, setSelectedAnnouncements] = useState(new Set())

  const queryClient = useQueryClient()

  useEffect(() => {
    const statusParam = searchParams.get('status')
    if (statusParam) {
      setStatus(statusParam)
    }
    setPage(1)
  }, [searchParams])

  const { data, isLoading } = useQuery(
    ['pending-announcements', page, limit, status],
    () => moderationApi.getPendingAnnouncements({ page, limit, status }),
    { keepPreviousData: true }
  )

  const approveMutation = useMutation(
    (id) => moderationApi.approveAnnouncement(id),
    {
      onSuccess: () => {
        toast.success('Announcement approved successfully')
        queryClient.invalidateQueries('pending-announcements')
        queryClient.invalidateQueries('moderation-stats')
        queryClient.invalidateQueries('announcements')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve announcement')
      }
    }
  )

  const rejectMutation = useMutation(
    ({ id, reason }) => moderationApi.rejectAnnouncement(id, reason),
    {
      onSuccess: () => {
        toast.success('Announcement rejected')
        queryClient.invalidateQueries('pending-announcements')
        queryClient.invalidateQueries('moderation-stats')
        queryClient.invalidateQueries('announcements')
        setShowRejectDialog(false)
        setSelectedAnnouncement(null)
        setRejectReason('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reject announcement')
      }
    }
  )

  const handleApprove = (announcementId) => {
    if (window.confirm('Are you sure you want to approve this announcement?')) {
      approveMutation.mutate(announcementId)
    }
  }

  const handleReject = (announcement) => {
    setSelectedAnnouncement(announcement)
    setShowRejectDialog(true)
  }

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    if (isBulkMode) {
      handleBulkReject()
    } else {
      rejectMutation.mutate({ id: selectedAnnouncement._id, reason: rejectReason })
    }
  }

  const handleBulkApprove = () => {
    if (selectedAnnouncements.size === 0) {
      toast.error('Please select at least one announcement')
      return
    }
    if (window.confirm(`Are you sure you want to approve ${selectedAnnouncements.size} announcement(s)?`)) {
      Promise.all(Array.from(selectedAnnouncements).map(id => approveMutation.mutateAsync(id)))
        .then(() => {
          toast.success(`${selectedAnnouncements.size} announcement(s) approved successfully`)
          setSelectedAnnouncements(new Set())
          setIsBulkMode(false)
        })
        .catch(() => {
          toast.error('Some announcements failed to approve')
        })
    }
  }

  const handleBulkReject = () => {
    if (selectedAnnouncements.size === 0) {
      toast.error('Please select at least one announcement')
      setShowRejectDialog(false)
      return
    }
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    if (window.confirm(`Are you sure you want to reject ${selectedAnnouncements.size} announcement(s)?`)) {
      Promise.all(Array.from(selectedAnnouncements).map(id => 
        rejectMutation.mutateAsync({ id, reason: rejectReason })
      ))
        .then(() => {
          toast.success(`${selectedAnnouncements.size} announcement(s) rejected`)
          setSelectedAnnouncements(new Set())
          setShowRejectDialog(false)
          setRejectReason('')
          setIsBulkMode(false)
        })
        .catch(() => {
          toast.error('Some announcements failed to reject')
        })
    }
  }

  const toggleAnnouncementSelection = (id) => {
    setSelectedAnnouncements(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const announcements = data?.announcements || []
  const pagination = data?.pagination || { total: 0, page: 1, limit: 20, pages: 1 }

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { label: 'Pending', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700' },
      APPROVED: { label: 'Approved', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700' },
      REJECTED: { label: 'Rejected', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700' }
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
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/moderation" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </Link>
          <div className="p-2 rounded-lg bg-[#151a28]">
            <Megaphone size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">Announcement Moderation</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Review and moderate announcements</p>
          </div>
        </div>
      </motion.div>

      {/* Status Filter and Bulk Actions */}
      <motion.div variants={itemVariants} className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-2 flex-wrap">
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s)
                setPage(1)
                setSearchParams({ status: s })
                setIsBulkMode(false)
                setSelectedAnnouncements(new Set())
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                status === s
                  ? 'bg-[#151a28] text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {status === 'PENDING' && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsBulkMode(!isBulkMode)
                setSelectedAnnouncements(new Set())
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              {isBulkMode ? 'Cancel Bulk' : 'Bulk Actions'}
            </button>
            {isBulkMode && selectedAnnouncements.size > 0 && (
              <>
                <button
                  onClick={handleBulkApprove}
                  disabled={approveMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Approve {selectedAnnouncements.size}
                </button>
                <button
                  onClick={() => setShowRejectDialog(true)}
                  disabled={rejectMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <XCircle size={16} />
                  Reject {selectedAnnouncements.size}
                </button>
              </>
            )}
          </div>
        )}
      </motion.div>

      {/* Announcements List */}
      {isLoading ? (
        <CardSkeleton count={5} />
      ) : announcements.length > 0 ? (
        <>
          <motion.div variants={itemVariants} className="space-y-3">
            {announcements.map((announcement) => (
              <motion.div
                key={announcement._id}
                variants={itemVariants}
                className={`card p-4 hover:shadow-lg transition-all ${
                  isBulkMode && selectedAnnouncements.has(announcement._id) ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {isBulkMode && announcement.moderationStatus === 'PENDING' && (
                    <input
                      type="checkbox"
                      checked={selectedAnnouncements.has(announcement._id)}
                      onChange={() => toggleAnnouncementSelection(announcement._id)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{announcement.title}</h3>
                      {getStatusBadge(announcement.moderationStatus)}
                    </div>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">{announcement.content?.substring(0, 150)}...</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>
                          {announcement.createdBy?.firstName} {announcement.createdBy?.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                      </div>
                      {announcement.scheduledAt && (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>Scheduled: {new Date(announcement.scheduledAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {announcement.moderationStatus === 'REJECTED' && (
                      <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-sm text-red-700 dark:text-red-300 mb-2">
                        <strong>Status:</strong> This announcement has been rejected
                        {announcement.rejectionReason && (
                          <span> - {announcement.rejectionReason}</span>
                        )}
                      </div>
                    )}

                    {announcement.moderatedBy && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Moderated by {announcement.moderatedBy?.firstName} {announcement.moderatedBy?.lastName} on{' '}
                        {new Date(announcement.moderatedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {announcement.moderationStatus === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(announcement._id)}
                        disabled={approveMutation.isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(announcement)}
                        disabled={rejectMutation.isLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  )}

                  {announcement.moderationStatus !== 'PENDING' && (
                    <Link
                      to={`/announcements/${announcement._id}`}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
                    >
                      View Announcement
                    </Link>
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
          icon={Megaphone}
          title={`No ${status.toLowerCase()} announcements found`}
          message={status === 'PENDING' ? 'All announcements have been reviewed' : `No ${status.toLowerCase()} announcements`}
        />
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-[#0a0e17] rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-[#151a28]"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
              {isBulkMode ? `Reject ${selectedAnnouncements.size} Announcement(s)` : 'Reject Announcement'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Please provide a reason for rejecting {isBulkMode ? 'these announcements' : 'this announcement'}. The creator(s) will be notified.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full p-3 border border-slate-300 dark:border-[#151a28] dark:bg-[#151a28] dark:text-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectDialog(false)
                  setSelectedAnnouncement(null)
                  setRejectReason('')
                }}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={rejectMutation.isLoading || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejectMutation.isLoading ? 'Rejecting...' : isBulkMode ? `Reject ${selectedAnnouncements.size} Announcement(s)` : 'Reject Announcement'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

export default AnnouncementModeration


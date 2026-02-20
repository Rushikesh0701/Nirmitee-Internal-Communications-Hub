import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { feedbackApi } from '../../services/feedbackApi'
import {
  MessageSquare, Inbox, Eye, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Filter, AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { CardSkeleton } from '../../components/skeletons'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'

const STATUS_CONFIG = {
  received: { label: 'Received', color: 'bg-blue-100 text-blue-700', icon: Inbox },
  under_review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700', icon: Eye },
  implemented: { label: 'Implemented', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  dismissed: { label: 'Dismissed', color: 'bg-gray-100 text-gray-600', icon: XCircle }
}

const CATEGORY_LABELS = {
  suggestion: '💡 Suggestion',
  issue: '🐛 Issue',
  feedback: '💬 Feedback',
  other: '📝 Other'
}

const FeedbackDashboard = () => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(12)
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const { data: stats } = useQuery(
    ['feedback-stats'],
    () => feedbackApi.getFeedbackStats().then(res => res.data.data),
    { staleTime: 30000 }
  )

  const { data, isLoading } = useQuery(
    ['feedback-list', page, limit, statusFilter, categoryFilter],
    () => feedbackApi.getFeedbackList({
      page, limit,
      ...(statusFilter && { status: statusFilter }),
      ...(categoryFilter && { category: categoryFilter })
    }).then(res => res.data.data),
    { keepPreviousData: true, refetchOnMount: true }
  )

  const updateMutation = useMutation(
    ({ id, data }) => feedbackApi.updateFeedbackStatus(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['feedback-list'])
        queryClient.invalidateQueries(['feedback-stats'])
        setExpandedId(null)
      }
    }
  )

  const toggleExpand = (feedback) => {
    if (expandedId === feedback._id) {
      setExpandedId(null)
    } else {
      setExpandedId(feedback._id)
      setEditStatus(feedback.status)
      setEditNotes(feedback.adminNotes || '')
    }
  }

  const handleUpdate = (id) => {
    updateMutation.mutate({
      id,
      data: { status: editStatus, adminNotes: editNotes }
    })
  }

  const feedbacks = data?.feedbacks || []
  const pagination = data?.pagination || { total: 0, page: 1, limit: 12, pages: 1 }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 text-gray-900">Feedback Dashboard</h1>
        <p className="text-gray-600 mt-1">Review and manage employee feedback</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const Icon = config.icon
            const count = stats.byStatus?.[key] || 0
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
                className={`card text-left transition-all ${
                  statusFilter === key ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500">{config.label}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter size={16} className="text-gray-400" />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        {(statusFilter || categoryFilter) && (
          <button
            onClick={() => { setStatusFilter(''); setCategoryFilter(''); setPage(1) }}
            className="text-xs text-indigo-600 hover:text-indigo-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Feedback List */}
      {isLoading && !data ? (
        <CardSkeleton count={4} />
      ) : feedbacks.length > 0 ? (
        <div className="space-y-3">
          {feedbacks.map((fb) => {
            const statusConf = STATUS_CONFIG[fb.status] || STATUS_CONFIG.received
            const StatusIcon = statusConf.icon
            const isExpanded = expandedId === fb._id

            return (
              <div key={fb._id} className="card">
                <button
                  onClick={() => toggleExpand(fb)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {CATEGORY_LABELS[fb.category] || fb.category}
                        </span>
                      </div>
                      <h3 className="text-h2 text-gray-900">{fb.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>
                          {fb.isAnonymous
                            ? '🕵️ Anonymous'
                            : fb.submittedBy
                              ? `${fb.submittedBy.firstName} ${fb.submittedBy.lastName}`
                              : 'Unknown'}
                        </span>
                        <span>{format(new Date(fb.createdAt), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Message</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{fb.message}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Admin Notes</label>
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          rows={2}
                          placeholder="Internal notes..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                      </div>
                    </div>

                    {fb.adminReviewedBy && (
                      <p className="text-xs text-gray-400">
                        Last reviewed by {fb.adminReviewedBy.firstName} {fb.adminReviewedBy.lastName}
                        {fb.reviewedAt && ` on ${format(new Date(fb.reviewedAt), 'MMM d, yyyy')}`}
                      </p>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => handleUpdate(fb._id)}
                        disabled={updateMutation.isLoading}
                        className="btn-add text-sm"
                      >
                        <CheckCircle size={14} />
                        {updateMutation.isLoading ? 'Saving...' : 'Update Status'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {pagination.pages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.pages}
              onPageChange={setPage}
              limit={limit}
              onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1) }}
              showLimitSelector={true}
            />
          )}
        </div>
      ) : (
        !isLoading && (
          <EmptyState
            icon={MessageSquare}
            title="No feedback yet"
            message={statusFilter || categoryFilter ? 'No feedback matches the current filters' : 'No feedback has been submitted yet'}
          />
        )
      )}
    </div>
  )
}

export default FeedbackDashboard

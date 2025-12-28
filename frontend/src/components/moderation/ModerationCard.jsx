import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, Eye, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'

const ModerationCard = ({ 
  item, 
  type = 'blog', 
  onApprove, 
  onReject, 
  onView,
  isBulkMode = false,
  isSelected = false,
  onSelect = null
}) => {
  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { 
        label: 'Pending', 
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: Clock
      },
      APPROVED: { 
        label: 'Approved', 
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
      },
      REJECTED: { 
        label: 'Rejected', 
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle
      }
    }
    const badge = badges[status] || badges.PENDING
    const Icon = badge.icon
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded border ${badge.color} flex items-center gap-1`}>
        <Icon size={12} />
        {badge.label}
      </span>
    )
  }

  const title = type === 'blog' 
    ? item.title 
    : item.subject || item.title

  const author = item.author || item.createdBy || item.user
  const authorName = author 
    ? `${author.firstName || ''} ${author.lastName || ''}`.trim() 
    : 'Unknown'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-4 hover:shadow-lg transition-all ${
        isSelected ? 'ring-2 ring-[#ff4701]' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {isBulkMode && item.moderationStatus === 'PENDING' && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect && onSelect(item._id, e.target.checked)}
            className="mt-1 w-4 h-4 text-[#ff4701] border-slate-300 rounded focus:ring-[#ff4701]"
          />
        )}

        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800 mb-1">
                {title}
              </h3>
              {getStatusBadge(item.moderationStatus)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
            <div className="flex items-center gap-2">
              <User size={14} />
              <span>{authorName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} />
              <span>{format(new Date(item.createdAt || item.created), 'MMM dd, yyyy')}</span>
            </div>
          </div>

          {item.moderationStatus === 'REJECTED' && item.rejectionReason && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 mb-2">
              <strong>Rejection Reason:</strong> {item.rejectionReason}
            </div>
          )}

          {item.moderationStatus === 'APPROVED' && item.approvedBy && (
            <div className="text-xs text-slate-500 mb-2">
              Approved by {item.approvedBy.firstName} {item.approvedBy.lastName} on{' '}
              {format(new Date(item.approvedAt), 'MMM dd, yyyy')}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            {onView && (
              <button
                onClick={() => onView(item)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm"
              >
                <Eye size={14} />
                View
              </button>
            )}
            {item.moderationStatus === 'PENDING' && (
              <>
                <button
                  onClick={() => onApprove && onApprove(item._id)}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <CheckCircle size={14} />
                  Approve
                </button>
                <button
                  onClick={() => onReject && onReject(item)}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <XCircle size={14} />
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ModerationCard


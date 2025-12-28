import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { moderationApi } from '../../services/moderationApi'
import { FileText, CheckCircle, XCircle, User, Calendar, Eye, MessageSquare, ArrowLeft, CheckSquare, Square } from 'lucide-react'
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

const BlogModeration = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [status, setStatus] = useState(searchParams.get('status') || 'PENDING')
  const [rejectReason, setRejectReason] = useState('')
  const [selectedBlog, setSelectedBlog] = useState(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedBlogs, setSelectedBlogs] = useState(new Set())
  const [isBulkMode, setIsBulkMode] = useState(false)

  const queryClient = useQueryClient()

  useEffect(() => {
    const statusParam = searchParams.get('status')
    if (statusParam) {
      setStatus(statusParam)
    }
    setPage(1)
  }, [searchParams])

  const { data, isLoading } = useQuery(
    ['pending-blogs', page, limit, status],
    () => moderationApi.getPendingBlogs({ page, limit, status }),
    { keepPreviousData: true }
  )

  const approveMutation = useMutation(
    (id) => moderationApi.approveBlog(id),
    {
      onSuccess: () => {
        toast.success('Blog approved successfully')
        queryClient.invalidateQueries('pending-blogs')
        queryClient.invalidateQueries('moderation-stats')
        queryClient.invalidateQueries('blogs')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve blog')
      }
    }
  )

  const rejectMutation = useMutation(
    ({ id, reason }) => moderationApi.rejectBlog(id, reason),
    {
      onSuccess: () => {
        toast.success('Blog rejected')
        queryClient.invalidateQueries('pending-blogs')
        queryClient.invalidateQueries('moderation-stats')
        queryClient.invalidateQueries('blogs')
        setShowRejectDialog(false)
        setSelectedBlog(null)
        setRejectReason('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reject blog')
      }
    }
  )

  const handleApprove = (blogId) => {
    if (window.confirm('Are you sure you want to approve this blog?')) {
      approveMutation.mutate(blogId)
    }
  }

  const handleReject = (blog) => {
    setSelectedBlog(blog)
    setShowRejectDialog(true)
  }

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    rejectMutation.mutate({ id: selectedBlog._id, reason: rejectReason })
  }

  const handleToggleSelect = (blogId) => {
    setSelectedBlogs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(blogId)) {
        newSet.delete(blogId)
      } else {
        newSet.add(blogId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedBlogs.size === blogs.length) {
      setSelectedBlogs(new Set())
    } else {
      setSelectedBlogs(new Set(blogs.map(b => b._id)))
    }
  }

  const handleBulkApprove = () => {
    if (selectedBlogs.size === 0) {
      toast.error('Please select at least one blog')
      return
    }
    if (window.confirm(`Are you sure you want to approve ${selectedBlogs.size} blog(s)?`)) {
      Promise.all(Array.from(selectedBlogs).map(id => approveMutation.mutateAsync(id)))
        .then(() => {
          toast.success(`${selectedBlogs.size} blog(s) approved successfully`)
          setSelectedBlogs(new Set())
          setIsBulkMode(false)
        })
        .catch(() => {
          toast.error('Some blogs failed to approve')
        })
    }
  }

  const handleBulkReject = () => {
    if (selectedBlogs.size === 0) {
      toast.error('Please select at least one blog')
      setShowRejectDialog(false)
      return
    }
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    if (window.confirm(`Are you sure you want to reject ${selectedBlogs.size} blog(s)?`)) {
      Promise.all(Array.from(selectedBlogs).map(id => 
        rejectMutation.mutateAsync({ id, reason: rejectReason })
      ))
        .then(() => {
          toast.success(`${selectedBlogs.size} blog(s) rejected`)
          setSelectedBlogs(new Set())
          setShowRejectDialog(false)
          setRejectReason('')
          setIsBulkMode(false)
        })
        .catch(() => {
          toast.error('Some blogs failed to reject')
        })
    }
  }

  const blogs = data?.blogs || []
  const pagination = data?.pagination || { total: 0, page: 1, limit: 20, pages: 1 }

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-200' },
      APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800 border-green-200' },
      REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' }
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
          <Link to="/moderation" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div className="p-2 rounded-lg bg-[#0a3a3c]">
            <FileText size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Blog Moderation</h1>
            <p className="text-slate-500 text-sm mt-0.5">Review and moderate blog posts</p>
          </div>
        </div>
      </motion.div>

      {/* Status Filter and Bulk Actions */}
      <motion.div variants={itemVariants} className="flex items-center justify-between gap-4 border-b pb-2 flex-wrap">
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s)
                setPage(1)
                setSearchParams({ status: s })
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                status === s
                  ? 'bg-[#0a3a3c] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {status === 'PENDING' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsBulkMode(!isBulkMode)
                setSelectedBlogs(new Set())
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              {isBulkMode ? 'Cancel Bulk' : 'Bulk Actions'}
            </button>
            {isBulkMode && selectedBlogs.size > 0 && (
              <>
                <button
                  onClick={handleBulkApprove}
                  disabled={approveMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Approve ({selectedBlogs.size})
                </button>
                <button
                  onClick={() => {
                    if (selectedBlogs.size === 0) {
                      toast.error('Please select at least one blog')
                      return
                    }
                    setShowRejectDialog(true)
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <XCircle size={16} />
                  Reject ({selectedBlogs.size})
                </button>
              </>
            )}
          </div>
        )}
      </motion.div>

      {/* Blogs List */}
      {isLoading ? (
        <CardSkeleton count={5} />
      ) : blogs.length > 0 ? (
        <>
          {isBulkMode && (
            <motion.div variants={itemVariants} className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-800"
              >
                {selectedBlogs.size === blogs.length ? (
                  <CheckSquare size={18} />
                ) : (
                  <Square size={18} />
                )}
                Select All ({selectedBlogs.size}/{blogs.length})
              </button>
            </motion.div>
          )}
          <motion.div variants={itemVariants} className="space-y-3">
            {blogs.map((blog) => (
              <motion.div
                key={blog._id}
                variants={itemVariants}
                className={`card p-4 hover:shadow-lg transition-all ${
                  isBulkMode && selectedBlogs.has(blog._id) ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {isBulkMode && (
                    <button
                      onClick={() => handleToggleSelect(blog._id)}
                      className="mt-1"
                    >
                      {selectedBlogs.has(blog._id) ? (
                        <CheckSquare size={20} className="text-blue-500" />
                      ) : (
                        <Square size={20} className="text-slate-400" />
                      )}
                    </button>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">{blog.title}</h3>
                      {getStatusBadge(blog.moderationStatus)}
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{blog.excerpt || blog.content?.substring(0, 150)}...</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-3">
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>
                          {blog.authorId?.firstName} {blog.authorId?.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                      </div>
                      {blog.views > 0 && (
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          <span>{blog.views} views</span>
                        </div>
                      )}
                      {blog.commentCount > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare size={14} />
                          <span>{blog.commentCount} comments</span>
                        </div>
                      )}
                    </div>

                    {blog.moderationStatus === 'REJECTED' && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 mb-2">
                        <strong>Status:</strong> This blog has been rejected
                        {blog.rejectionReason && (
                          <span> - {blog.rejectionReason}</span>
                        )}
                      </div>
                    )}

                    {blog.moderatedBy && (
                      <div className="text-xs text-slate-500">
                        Moderated by {blog.moderatedBy?.firstName} {blog.moderatedBy?.lastName} on{' '}
                        {new Date(blog.moderatedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {blog.moderationStatus === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(blog._id)}
                        disabled={approveMutation.isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(blog)}
                        disabled={rejectMutation.isLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  )}

                  {blog.moderationStatus !== 'PENDING' && (
                    <Link
                      to={`/blogs/${blog._id}`}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                    >
                      View Blog
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
          icon={FileText}
          title={`No ${status.toLowerCase()} blogs found`}
          message={status === 'PENDING' ? 'All blogs have been reviewed' : `No ${status.toLowerCase()} blogs`}
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
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {isBulkMode ? `Reject ${selectedBlogs.size} Blog(s)` : 'Reject Blog'}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Please provide a reason for rejecting {isBulkMode ? 'these blogs' : 'this blog'}. The author(s) will be notified.
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
                  setSelectedBlog(null)
                  setRejectReason('')
                  if (isBulkMode) {
                    setSelectedBlogs(new Set())
                  }
                }}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={isBulkMode ? handleBulkReject : handleConfirmReject}
                disabled={rejectMutation.isLoading || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejectMutation.isLoading ? 'Rejecting...' : isBulkMode ? `Reject ${selectedBlogs.size} Blog(s)` : 'Reject Blog'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

export default BlogModeration


import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from 'react-query';
import { discussionAPI } from '../../services/discussionApi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { isAdmin } from '../../utils/userHelpers';
import { useCreationStore } from '../../store/creationStore';

// Recursive component to render comments with nested replies
// Defined outside to prevent recreation on every render
const CommentItem = memo(({ comment, depth = 0, isReplying, replyContent, onReplyChange, onToggleReply, onAddReply, isAuthenticated, user, showReplyForm, replyContentState, expandedReplies, onToggleExpandReplies }) => {
  const commentId = comment._id || comment.id;
  const INITIAL_REPLIES_LIMIT = 3;

  return (
    <div className={`${depth > 0 ? 'ml-4 sm:ml-6 md:ml-8 mt-3 sm:mt-4' : ''}`}>
      <div className="border-l-2 sm:border-l-4 border-purple-500 pl-3 sm:pl-4 py-2">
        {/* Comment Header - Responsive */}
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm sm:text-base">
              {(() => {
                const author = comment.authorId || comment.Author || comment.author;
                if (author) {
                  if (typeof author === 'object') {
                    if (author.firstName || author.lastName) {
                      return `${author.firstName || ''} ${author.lastName || ''}`.trim();
                    }
                    if (author.displayName) return author.displayName;
                    if (author.name) return author.name;
                    if (author.email) return author.email.split('@')[0];
                  } else if (typeof author === 'string') {
                    return author;
                  }
                }
                if (comment.authorEmail) {
                  return comment.authorEmail.split('@')[0];
                }
                return 'Unknown User';
              })()}
            </span>
            <span className="text-xs sm:text-sm text-gray-500">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Comment Content - Responsive */}
        <p className="text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base leading-relaxed">
          {comment.content}
        </p>

        {/* Reply Button - Responsive */}
        {isAuthenticated && user && (
          <div className="mb-2 sm:mb-3">
            <button
              onClick={() => onToggleReply(commentId)}
              className="text-xs sm:text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              {isReplying ? 'Cancel' : 'Reply'}
            </button>
          </div>
        )}

        {/* Reply Form - Responsive */}
        {isReplying && isAuthenticated && user && (
          <form
            onSubmit={(e) => onAddReply(commentId, e)}
            className="mb-3 sm:mb-4"
          >
            <textarea
              key={`textarea-${commentId}`}
              value={replyContent || ''}
              onChange={(e) => onReplyChange(commentId, e.target.value)}
              placeholder="Write a reply..."
              required
              rows="3"
              className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-purple-500 
                         text-xs sm:text-sm mb-2 resize-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg 
                           hover:bg-purple-700 transition-colors text-xs sm:text-sm"
              >
                Post Reply
              </button>
              <button
                type="button"
                onClick={() => onToggleReply(commentId)}
                className="px-3 py-1.5 bg-gray-500 text-white rounded-lg 
                           hover:bg-gray-600 transition-colors text-xs sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Nested Replies - Responsive */}
      {comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0 && (
        <div className="mt-2">
          {(() => {
            const isExpanded = expandedReplies && expandedReplies[commentId];
            const repliesToShow = isExpanded ? comment.replies : comment.replies.slice(0, INITIAL_REPLIES_LIMIT);
            
            return repliesToShow.map((reply) => {
              const replyId = reply._id || reply.id;
              if (!replyId) return null;
              return (
                <CommentItem
                  key={`reply-${replyId}`}
                  comment={reply}
                  depth={depth + 1}
                  isReplying={showReplyForm[replyId]}
                  replyContent={replyContentState[replyId]}
                  onReplyChange={onReplyChange}
                  onToggleReply={onToggleReply}
                  onAddReply={onAddReply}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  showReplyForm={showReplyForm}
                  replyContentState={replyContentState}
                  expandedReplies={expandedReplies || {}}
                  onToggleExpandReplies={onToggleExpandReplies || (() => {})}
                />
              );
            });
          })()}
          
          {/* View More/Less Button - Works at all nesting levels (reply to reply to reply...) */}
          {(() => {
            const hasReplies = comment.replies && Array.isArray(comment.replies);
            const replyCount = hasReplies ? comment.replies.length : 0;
            const shouldShowButton = replyCount > INITIAL_REPLIES_LIMIT;
            
            if (!shouldShowButton) return null;
            
            const isExpanded = expandedReplies && expandedReplies[commentId];
            const hiddenCount = replyCount - INITIAL_REPLIES_LIMIT;
            
            return (
              <div className={`mt-3 ${depth > 0 ? 'ml-2' : 'ml-4'}`} style={{ minHeight: '40px' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onToggleExpandReplies) {
                      onToggleExpandReplies(commentId);
                    }
                  }}
                  className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm font-semibold flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-purple-50 active:bg-purple-100 transition-all border-2 border-purple-500 bg-white shadow-lg hover:shadow-xl z-10 relative cursor-pointer"
                  style={{ 
                    minWidth: '150px',
                    display: 'inline-flex'
                  }}
                  aria-label={isExpanded ? "View less replies" : "View more replies"}
                >
                  {isExpanded ? (
                    <>
                      <span className="text-lg sm:text-xl font-bold">▲</span> 
                      <span>View less</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg sm:text-xl font-bold">▼</span> 
                      <span>View {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render), false if different (re-render)
  const prevId = String(prevProps.comment._id || prevProps.comment.id);
  const nextId = String(nextProps.comment._id || nextProps.comment.id);

  // If comment ID changed, re-render
  if (prevId !== nextId) return false;

  // If depth changed, re-render
  if (prevProps.depth !== nextProps.depth) return false;

  // If reply form state changed, re-render
  if (prevProps.isReplying !== nextProps.isReplying) return false;

  // If reply content changed, re-render (this is important for typing)
  if (prevProps.replyContent !== nextProps.replyContent) return false;

  // If expanded replies state changed for this comment, re-render
  if (prevProps.expandedReplies !== nextProps.expandedReplies) return false;

  // If handlers changed (shouldn't happen with useCallback), re-render
  if (prevProps.onReplyChange !== nextProps.onReplyChange) return false;
  if (prevProps.onToggleReply !== nextProps.onToggleReply) return false;
  if (prevProps.onAddReply !== nextProps.onAddReply) return false;
  if (prevProps.onToggleExpandReplies !== nextProps.onToggleExpandReplies) return false;

  // All relevant props are equal, skip re-render
  return true;
});

CommentItem.displayName = 'CommentItem';

const DiscussionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [replyContent, setReplyContent] = useState({});
  const [showReplyForm, setShowReplyForm] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const { startCommentPosting, endCommentPosting, isAnyCommentPosting } = useCreationStore();

  // All hooks must be called before any early returns
  const fetchDiscussion = useCallback(async () => {
    if (!id || id === 'undefined' || id === 'null') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await discussionAPI.getById(id);
      // API returns { success: true, data: {...} }
      // axios wraps the response, so response.data is the actual API response
      const apiResponse = response.data;
      // If apiResponse has a 'data' property (from sendSuccess), use it; otherwise use apiResponse directly
      const discussionData = apiResponse.data || apiResponse;
      setDiscussion(discussionData);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch discussion');
      navigate('/discussions');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDiscussion();
  }, [fetchDiscussion]);

  // Delete mutation
  const deleteMutation = useMutation(
    () => discussionAPI.delete(id),
    {
      onSuccess: () => {
        toast.success('Discussion deleted successfully');
        queryClient.invalidateQueries('discussions');
        navigate('/discussions');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete discussion');
        setIsDeleting(false);
      }
    }
  );

  // Check if user can edit (owner or admin)
  const canEdit = useMemo(() => {
    if (!user || !discussion) return false;
    
    // Check if user is owner
    const discussionAuthorId = discussion.authorId?._id || discussion.authorId || discussion.authorId?.toString();
    const userId = user._id || user.id;
    const isOwner = discussionAuthorId && userId && discussionAuthorId.toString() === userId.toString();
    
    // Check if user is admin
    const userIsAdmin = isAdmin(user);
    
    return isOwner || userIsAdmin;
  }, [user, discussion]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this discussion? This action cannot be undone.')) {
      setIsDeleting(true);
      deleteMutation.mutate();
    }
  }, [deleteMutation]);

  // Organize comments into a tree structure
  const organizeComments = (comments) => {
    if (!comments || !Array.isArray(comments)) return [];

    const commentMap = new Map();
    const rootComments = [];

    // Helper function to get comment ID as string
    const getCommentId = (comment) => {
      if (!comment) return null;
      return String(comment._id || comment.id || comment);
    };

    // Helper function to get parent ID
    const getParentId = (comment) => {
      if (!comment.parentCommentId) return null;

      // Handle different formats
      if (typeof comment.parentCommentId === 'object') {
        return String(comment.parentCommentId._id || comment.parentCommentId.id || comment.parentCommentId);
      }
      return String(comment.parentCommentId);
    };

    // First pass: create map of all comments with empty replies array
    comments.forEach(comment => {
      const commentId = getCommentId(comment);
      if (commentId) {
        commentMap.set(commentId, { ...comment, replies: [] });
      }
    });

    // Second pass: organize into tree
    comments.forEach(comment => {
      const commentId = getCommentId(comment);
      const parentId = getParentId(comment);

      if (!commentId) return;

      if (parentId && commentMap.has(parentId)) {
        // This is a reply - add to parent's replies array
        const parentComment = commentMap.get(parentId);
        const replyComment = commentMap.get(commentId);

        // Check if reply already exists to avoid duplicates
        const replyExists = parentComment.replies.some(r => {
          const rId = getCommentId(r);
          return rId === commentId;
        });

        if (!replyExists) {
          parentComment.replies.push(replyComment);
        }
      } else if (!parentId) {
        // This is a root comment
        const rootComment = commentMap.get(commentId);
        if (rootComment && !rootComments.some(r => getCommentId(r) === commentId)) {
          rootComments.push(rootComment);
        }
      }
    });

    // Sort replies by creation date recursively
    const sortReplies = (comment) => {
      if (comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0) {
        comment.replies.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateA - dateB;
        });
        comment.replies.forEach(sortReplies);
      }
    };

    // Sort root comments and their replies
    rootComments.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateA - dateB;
    });
    rootComments.forEach(sortReplies);

    return rootComments;
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple submissions
    if (isAnyCommentPosting()) {
      toast.error('Please wait for the current comment to be posted');
      return;
    }
    
    // Start comment posting process
    if (!startCommentPosting('discussion')) {
      toast.error('Another comment is already being posted');
      return;
    }
    
    if (!commentContent.trim()) {
      endCommentPosting();
      return;
    }

    try {
      const response = await discussionAPI.addComment(id, {
        content: commentContent,
      });
      // API returns { success: true, data: comment }
      const apiResponse = response.data;
      const newComment = apiResponse.data || apiResponse;

      // Optimistically update the UI without fetching
      setDiscussion((prevDiscussion) => ({
        ...prevDiscussion,
        Comments: [...(prevDiscussion.Comments || []), newComment],
        commentCount: (prevDiscussion.commentCount || 0) + 1,
      }));
      
      setCommentContent('');
      endCommentPosting();
      toast.success('Comment added!');
    } catch (error) {
      endCommentPosting();
      toast.error(error.response?.data?.message || 'Failed to add comment');
      // Only fetch on error to restore correct state
      fetchDiscussion();
    }
  };

  const handleAddReply = async (parentCommentId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple submissions
    if (isAnyCommentPosting()) {
      toast.error('Please wait for the current comment to be posted');
      return;
    }
    
    // Start comment posting process
    if (!startCommentPosting('discussion')) {
      toast.error('Another comment is already being posted');
      return;
    }
    
    const replyText = replyContent[parentCommentId];
    if (!replyText || !replyText.trim()) {
      endCommentPosting();
      return;
    }

    try {
      // Ensure parentCommentId is a string
      const parentId = String(parentCommentId);

      const response = await discussionAPI.addComment(id, {
        content: replyText.trim(),
        parentCommentId: parentId,
      });
      // API returns { success: true, data: comment }
      const apiResponse = response.data;
      const newReply = apiResponse.data || apiResponse;

      // Optimistically update the UI without fetching
      setDiscussion((prevDiscussion) => ({
        ...prevDiscussion,
        Comments: [...(prevDiscussion.Comments || []), newReply],
        commentCount: (prevDiscussion.commentCount || 0) + 1,
      }));

      // Clear the reply form
      setReplyContent((prev) => {
        const newState = { ...prev };
        delete newState[parentCommentId];
        return newState;
      });
      setShowReplyForm((prev) => ({
        ...prev,
        [parentCommentId]: false
      }));

      endCommentPosting();
      toast.success('Reply added!');
    } catch (error) {
      endCommentPosting();
      toast.error(error.response?.data?.message || 'Failed to add reply');
      // Only fetch on error to restore correct state
      await fetchDiscussion();
    }
  };

  const toggleReplyForm = useCallback((commentId) => {
    setShowReplyForm(prev => {
      const wasOpen = prev[commentId];
      // Clear content when closing
      if (wasOpen) {
        setReplyContent(prevContent => {
          const newContent = { ...prevContent };
          delete newContent[commentId];
          return newContent;
        });
      }
      return {
        ...prev,
        [commentId]: !wasOpen
      };
    });
  }, []);

  const handleReplyContentChange = useCallback((commentId, value) => {
    setReplyContent(prev => ({
      ...prev,
      [commentId]: value
    }));
  }, []);

  const toggleExpandReplies = useCallback((commentId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  }, []);

  // Memoize organized comments to prevent unnecessary recalculations
  const organizedComments = useMemo(() => {
    return organizeComments(discussion?.Comments || []);
  }, [discussion?.Comments]);

  // Validate ID after all hooks
  if (!id || id === 'undefined' || id === 'null') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Discussion ID</h2>
          <p className="text-gray-600 mb-4">The discussion ID is missing or invalid.</p>
          <button
            onClick={() => navigate('/discussions')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Discussions
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!discussion) {
    return null;
  }

  const getAuthorName = (author) => {
    if (!author) return 'Unknown User';

    if (typeof author === 'object') {
      // Author is populated object
      if (author.firstName || author.lastName) {
        return `${author.firstName || ''} ${author.lastName || ''}`.trim();
      }
      if (author.displayName) {
        return author.displayName;
      }
      if (author.name) {
        return author.name;
      }
      if (author.email) {
        return author.email.split('@')[0];
      }
    } else if (typeof author === 'string') {
      return author;
    }
    return 'Unknown User';
  };

  const authorName = getAuthorName(discussion.authorId || discussion.Author || discussion.author);

  return (
    <div className="container-responsive animate-fade-in">
      {/* Back Button - Compact */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => navigate('/discussions')}
        className="mb-3 sm:mb-4 text-purple-600 hover:text-purple-700 
                   flex items-center gap-1 text-sm sm:text-base font-medium"
      >
        <span>←</span> Back to Discussions
      </motion.button>

      {/* Discussion Content - Responsive */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 
                   border border-gray-200"
      >
        {/* Header with Title and Actions */}
        <div className="flex items-start justify-between gap-4 mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex-1">
            {discussion.title}
          </h1>
          
          {/* Edit/Delete Buttons - For owners and admins */}
          {canEdit && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                to={`/discussions/${id}/edit`}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg 
                           hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium shadow-md"
                aria-label="Edit discussion"
              >
                ✏️ Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg 
                           hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium 
                           shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Delete discussion"
              >
                {isDeleting ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          )}
        </div>

        {/* Meta Info - Responsive */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-4 
                        text-xs sm:text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <span className="text-base">👤</span> {authorName}
          </span>
          <span className="flex items-center gap-1">
            <span className="text-base">📅</span>
            {new Date(discussion.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Tags - Responsive */}
        {discussion.tags && discussion.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
            {discussion.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 sm:px-3 py-1 bg-purple-50 text-purple-700 
                           rounded-full text-xs sm:text-sm font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Content - Responsive */}
        <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
          {discussion.content}
        </p>
      </motion.article>

      {/* Comments Section - Responsive */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8 border border-gray-200"
      >
        {/* Comments Header */}
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
          Comments ({discussion.Comments?.length || discussion.commentCount || 0})
        </h2>

        {/* Add Comment Form - Responsive */}
        {isAuthenticated && user && (
          <form onSubmit={handleAddComment} className="mb-6">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Write your comment..."
              required
              rows="4"
              disabled={isAnyCommentPosting()}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-purple-500 
                         text-sm sm:text-base mb-3 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isAnyCommentPosting()}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 
                         text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 
                         transition-all shadow-md hover:shadow-lg text-sm sm:text-base font-medium
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnyCommentPosting() ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        )}

        {/* Comments List - Responsive */}
        <div className="space-y-4 sm:space-y-6">
          {organizedComments.map((comment) => {
            const commentId = comment._id || comment.id;
            return (
              <CommentItem
                key={commentId}
                comment={comment}
                depth={0}
                isReplying={showReplyForm[commentId]}
                replyContent={replyContent[commentId]}
                onReplyChange={handleReplyContentChange}
                onToggleReply={toggleReplyForm}
                onAddReply={handleAddReply}
                isAuthenticated={isAuthenticated}
                user={user}
                showReplyForm={showReplyForm}
                replyContentState={replyContent}
                expandedReplies={expandedReplies}
                onToggleExpandReplies={toggleExpandReplies}
              />
            );
          })}
          {(!discussion.Comments || discussion.Comments.length === 0) && (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-5xl mb-3">💬</div>
              <p className="text-gray-500 text-sm sm:text-base">
                No comments yet. Be the first to comment!
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DiscussionDetail;

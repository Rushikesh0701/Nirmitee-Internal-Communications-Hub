import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { discussionAPI } from '../../services/discussionApi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { isAdmin } from '../../utils/userHelpers';
import { useCreationStore } from '../../store/creationStore';
import { DetailSkeleton } from '../../components/skeletons';
import { ArrowLeft, Edit, Trash2, MessageCircle, User, Calendar, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import EmptyState from '../../components/EmptyState';

const CommentItem = memo(({ comment, depth = 0, isReplying, replyContent, onReplyChange, onToggleReply, onAddReply, isAuthenticated, user, showReplyForm, replyContentState, expandedReplies, onToggleExpandReplies, isDummyDiscussion }) => {
  const commentId = comment._id || comment.id;
  const INITIAL_REPLIES_LIMIT = 3;

  const getAuthorName = () => {
    const author = comment.authorId || comment.Author || comment.author;
    if (author) {
      if (typeof author === 'object') {
        if (author.firstName || author.lastName) return `${author.firstName || ''} ${author.lastName || ''}`.trim();
        if (author.displayName) return author.displayName;
        if (author.name) return author.name;
        if (author.email) return author.email.split('@')[0];
      } else if (typeof author === 'string') return author;
    }
    if (comment.authorEmail) return comment.authorEmail.split('@')[0];
    return 'Unknown User';
  };

  return (
    <div className={`${depth > 0 ? 'ml-4 sm:ml-6 mt-3' : ''}`}>
      <div className="border-l-2 border-indigo-300 pl-4 py-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-slate-800 text-sm">{getAuthorName()}</span>
          <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
        </div>
        <p className="text-slate-600 mb-3 text-sm">{comment.content}</p>
        
        {isAuthenticated && user && !isDummyDiscussion && (
          <button onClick={() => onToggleReply(commentId)} className="text-xs text-indigo-600 hover:text-indigo-700">
            {isReplying ? 'Cancel' : 'Reply'}
          </button>
        )}

        {isReplying && isAuthenticated && user && !isDummyDiscussion && (
          <form onSubmit={(e) => onAddReply(commentId, e)} className="mt-3">
            <textarea value={replyContent || ''} onChange={(e) => onReplyChange(commentId, e.target.value)} placeholder="Write a reply..." required rows="2" className="textarea text-sm mb-2" />
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary text-xs py-1.5 px-3">Post Reply</button>
              <button type="button" onClick={() => onToggleReply(commentId)} className="btn btn-secondary text-xs py-1.5 px-3">Cancel</button>
            </div>
          </form>
        )}
      </div>

      {comment.replies?.length > 0 && (
        <div className="mt-2">
          {(() => {
            const isExpanded = expandedReplies?.[commentId];
            const repliesToShow = isExpanded ? comment.replies : comment.replies.slice(0, INITIAL_REPLIES_LIMIT);
            return repliesToShow.map((reply) => {
              const replyId = reply._id || reply.id;
              if (!replyId) return null;
              return <CommentItem key={`reply-${replyId}`} comment={reply} depth={depth + 1} isReplying={showReplyForm[replyId]} replyContent={replyContentState[replyId]} onReplyChange={onReplyChange} onToggleReply={onToggleReply} onAddReply={onAddReply} isAuthenticated={isAuthenticated} user={user} showReplyForm={showReplyForm} replyContentState={replyContentState} expandedReplies={expandedReplies || {}} onToggleExpandReplies={onToggleExpandReplies} isDummyDiscussion={isDummyDiscussion} />;
            });
          })()}
          
          {comment.replies.length > INITIAL_REPLIES_LIMIT && (
            <button onClick={() => onToggleExpandReplies(commentId)} className="mt-2 ml-4 text-indigo-600 hover:text-indigo-700 text-xs flex items-center gap-1">
              {expandedReplies?.[commentId] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expandedReplies?.[commentId] ? 'View less' : `View ${comment.replies.length - INITIAL_REPLIES_LIMIT} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
});

CommentItem.displayName = 'CommentItem';

const DiscussionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [commentContent, setCommentContent] = useState('');
  const [replyContent, setReplyContent] = useState({});
  const [showReplyForm, setShowReplyForm] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const { startCommentPosting, endCommentPosting, isAnyCommentPosting } = useCreationStore();

  // Use React Query for automatic cache management and refetching
  const { data: discussion, isLoading: loading, refetch } = useQuery(
    ['discussion', id],
    () => discussionAPI.getById(id).then((res) => {
      const apiResponse = res.data;
      return apiResponse.data || apiResponse;
    }),
    {
      enabled: !!id && id !== 'undefined' && id !== 'new',
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to fetch discussion');
        navigate('/discussions');
      },
      staleTime: 0, // Always refetch when invalidated
      cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    }
  );

  const deleteMutation = useMutation(() => discussionAPI.delete(id), {
    onSuccess: async () => { toast.success('Discussion deleted'); await queryClient.invalidateQueries(['discussions']); navigate('/discussions'); },
    onError: (error) => { toast.error(error.response?.data?.message || 'Failed to delete'); setIsDeleting(false); }
  });

  const isDummyDiscussion = useMemo(() => {
    return id && typeof id === 'string' && id.startsWith('dummy-discussion-');
  }, [id]);

  const canEdit = useMemo(() => {
    if (!user || !discussion || isDummyDiscussion) return false;
    const discussionAuthorId = discussion.authorId?._id || discussion.authorId;
    const userId = user._id || user.id;
    const isOwner = discussionAuthorId?.toString() === userId?.toString();
    return isOwner || isAdmin(user);
  }, [user, discussion, isDummyDiscussion]);

  const handleDelete = useCallback(() => { if (window.confirm('Delete this discussion?')) { setIsDeleting(true); deleteMutation.mutate(); } }, [deleteMutation]);

  const organizeComments = (comments) => {
    if (!comments || !Array.isArray(comments)) return [];
    const commentMap = new Map();
    const rootComments = [];
    comments.forEach(c => { const cId = String(c._id || c.id); if (cId) commentMap.set(cId, { ...c, replies: [] }); });
    comments.forEach(c => {
      const cId = String(c._id || c.id);
      const pId = c.parentCommentId ? String(c.parentCommentId._id || c.parentCommentId) : null;
      if (pId && commentMap.has(pId)) commentMap.get(pId).replies.push(commentMap.get(cId));
      else if (!pId) rootComments.push(commentMap.get(cId));
    });
    return rootComments;
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (isDummyDiscussion) {
      toast.error('Comments cannot be added to sample discussions. Please create a real discussion to enable commenting.');
      return;
    }
    if (isAnyCommentPosting() || !startCommentPosting('discussion')) return;
    if (!commentContent.trim()) { endCommentPosting(); return; }
    try {
      const response = await discussionAPI.addComment(id, { content: commentContent });
      const newComment = response.data.data || response.data;
      // Update the cache with the new comment
      queryClient.setQueryData(['discussion', id], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, Comments: [...(oldData.Comments || []), newComment] };
      });
      setCommentContent('');
      endCommentPosting();
      toast.success('Comment added!');
    } catch (error) {
      endCommentPosting();
      const errorMessage = error.response?.data?.message || 'Failed to add comment';
      toast.error(errorMessage);
      if (errorMessage.includes('dummy') || errorMessage.includes('sample')) {
        // Don't refetch if it's a dummy discussion error
        return;
      }
      // Refetch to get latest data
      refetch();
    }
  };

  const handleAddReply = async (parentCommentId, e) => {
    e.preventDefault();
    if (isDummyDiscussion) {
      toast.error('Replies cannot be added to sample discussions. Please create a real discussion to enable commenting.');
      return;
    }
    if (isAnyCommentPosting() || !startCommentPosting('discussion')) return;
    const replyText = replyContent[parentCommentId];
    if (!replyText?.trim()) { endCommentPosting(); return; }
    try {
      const response = await discussionAPI.addComment(id, { content: replyText.trim(), parentCommentId: String(parentCommentId) });
      const newReply = response.data.data || response.data;
      // Update the cache with the new reply
      queryClient.setQueryData(['discussion', id], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, Comments: [...(oldData.Comments || []), newReply] };
      });
      setReplyContent((prev) => { const n = { ...prev }; delete n[parentCommentId]; return n; });
      setShowReplyForm((prev) => ({ ...prev, [parentCommentId]: false }));
      endCommentPosting();
      toast.success('Reply added!');
    } catch (error) {
      endCommentPosting();
      const errorMessage = error.response?.data?.message || 'Failed to add reply';
      toast.error(errorMessage);
      if (errorMessage.includes('dummy') || errorMessage.includes('sample')) {
        // Don't refetch if it's a dummy discussion error
        return;
      }
      // Refetch to get latest data
      refetch();
    }
  };

  const toggleReplyForm = useCallback((commentId) => { setShowReplyForm(prev => ({ ...prev, [commentId]: !prev[commentId] })); }, []);
  const handleReplyContentChange = useCallback((commentId, value) => { setReplyContent(prev => ({ ...prev, [commentId]: value })); }, []);
  const toggleExpandReplies = useCallback((commentId) => { setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] })); }, []);

  const organizedComments = useMemo(() => organizeComments(discussion?.Comments || []), [discussion?.Comments]);

  if (!id || id === 'undefined') {
    return (
      <div className="empty-state">
        <MessageCircle size={56} className="empty-state-icon" />
        <h3 className="empty-state-title">Invalid Discussion ID</h3>
        <button onClick={() => navigate('/discussions')} className="btn btn-primary mt-4">Back to Discussions</button>
      </div>
    );
  }

  if (loading) return <DetailSkeleton />;
  if (!discussion) return null;

  const getAuthorName = (author) => {
    if (!author) return 'Unknown User';
    if (typeof author === 'object') {
      if (author.firstName || author.lastName) return `${author.firstName || ''} ${author.lastName || ''}`.trim();
      if (author.displayName) return author.displayName;
      if (author.name) return author.name;
    }
    return 'Unknown User';
  };

  return (
    <div className="w-full space-y-6">
      <button onClick={() => navigate('/discussions')} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-4">
        <ArrowLeft size={18} />
        <span className="font-medium">Back to Discussions</span>
      </button>

      <motion.article className="card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {isDummyDiscussion && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Sample Discussion:</strong> This is a sample discussion for demonstration purposes. You cannot add comments or edit it. Create a real discussion to enable full functionality.
            </p>
          </div>
        )}
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-slate-800">{discussion.title}</h1>
          {canEdit && !isDummyDiscussion && (
            <div className="flex gap-2">
              <Link to={`/discussions/${id}/edit`} className="btn btn-primary text-sm py-1.5 px-3 flex items-center gap-1"><Edit size={14} /> Edit</Link>
              <button onClick={handleDelete} disabled={isDeleting} className="btn btn-danger text-sm py-1.5 px-3 flex items-center gap-1"><Trash2 size={14} /> {isDeleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
          <span className="flex items-center gap-1"><User size={14} /> {getAuthorName(discussion.authorId)}</span>
          <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(discussion.createdAt).toLocaleDateString()}</span>
        </div>

        {discussion.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {discussion.tags.map((tag) => <span key={tag} className="badge badge-primary flex items-center gap-1"><Tag size={10} /> {tag}</span>)}
          </div>
        )}

        <p className="text-slate-600 whitespace-pre-wrap">{discussion.content}</p>
      </motion.article>

      <motion.div className="card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <MessageCircle size={20} /> Comments ({discussion.Comments?.length || 0})
        </h2>

        {isAuthenticated && user && !isDummyDiscussion && (
          <form onSubmit={handleAddComment} className="mb-6">
            <textarea value={commentContent} onChange={(e) => setCommentContent(e.target.value)} placeholder="Write your comment..." required rows="3" disabled={isAnyCommentPosting()} className="textarea mb-3" />
            <button type="submit" disabled={isAnyCommentPosting()} className="btn btn-primary">{isAnyCommentPosting() ? 'Posting...' : 'Post Comment'}</button>
          </form>
        )}
        {isAuthenticated && user && isDummyDiscussion && (
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-600">
              Comments are disabled for sample discussions. <Link to="/discussions/new" className="text-indigo-600 hover:text-indigo-700 underline">Create a real discussion</Link> to enable commenting.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {organizedComments.map((comment) => (
            <CommentItem key={comment._id || comment.id} comment={comment} depth={0} isReplying={showReplyForm[comment._id || comment.id]} replyContent={replyContent[comment._id || comment.id]} onReplyChange={handleReplyContentChange} onToggleReply={toggleReplyForm} onAddReply={handleAddReply} isAuthenticated={isAuthenticated} user={user} showReplyForm={showReplyForm} replyContentState={replyContent} expandedReplies={expandedReplies} onToggleExpandReplies={toggleExpandReplies} isDummyDiscussion={isDummyDiscussion} />
          ))}
          
          {(!discussion.Comments || discussion.Comments.length === 0) && (
            <EmptyState
              icon={MessageCircle}
              title="No comments yet"
              message="Be the first!"
              compact
            />
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default memo(DiscussionDetail);

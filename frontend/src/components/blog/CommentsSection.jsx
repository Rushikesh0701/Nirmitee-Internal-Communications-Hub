import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import { extractId } from '../../utils/blogHelpers';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import EmptyState from '../EmptyState';

const CommentsSection = ({ 
  comments = [], 
  user, 
  isAuthenticated,
  onAddComment, 
  onDeleteComment,
  isLoading 
}) => {
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const INITIAL_REPLIES_LIMIT = 3;

  const handleReply = (commentId) => setReplyingTo(commentId);
  const handleCancelReply = () => setReplyingTo(null);

  const handleSubmitReply = (content, parentCommentId, onComplete) => {
    onAddComment({ content, parentCommentId, onComplete });
    setReplyingTo(null);
  };

  const toggleExpandReplies = (commentId) => {
    setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card max-w-[680px] mx-auto">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <MessageCircle size={20} /> Comments ({comments.length})
      </h3>

      {/* Add Comment Form */}
      {isAuthenticated && user ? (
        <div className="mb-6">
          <CommentForm
            onSubmit={(content, onComplete) => onAddComment({ content, onComplete })}
            isLoading={isLoading}
            placeholder="Write a comment..."
            buttonText="Post Comment"
            commentType="blog"
          />
        </div>
      ) : (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-300 rounded-lg">
          <p className="text-gray-600">
            Please <Link to="/login" className="text-slate-700 hover:text-slate-700 underline">login</Link> to comment
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => {
            const commentId = extractId(comment);
            const replies = comment.replies || [];
            const isReplying = replyingTo === commentId;

            return (
              <div key={commentId} className="space-y-3">
                <CommentItem
                  comment={comment}
                  user={user}
                  onReply={() => handleReply(commentId)}
                  onDelete={() => onDeleteComment(commentId)}
                />

                {/* Reply Form */}
                {isReplying && isAuthenticated && user && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <CommentForm
                      onSubmit={(content, onComplete) => handleSubmitReply(content, commentId, onComplete)}
                      isLoading={isLoading}
                      placeholder="Write a reply..."
                      buttonText="Post Reply"
                      onCancel={handleCancelReply}
                      rows={2}
                      commentType="blog"
                    />
                  </div>
                )}

                {/* Replies */}
                {replies.length > 0 && (
                  <div className="ml-6 space-y-3 border-l-2 border-slate-400 pl-4">
                    {(() => {
                      const isExpanded = expandedReplies[commentId];
                      const repliesToShow = isExpanded ? replies : replies.slice(0, INITIAL_REPLIES_LIMIT);
                      
                      return repliesToShow.map((reply) => (
                        <CommentItem
                          key={extractId(reply)}
                          comment={reply}
                          user={user}
                          onDelete={() => onDeleteComment(extractId(reply))}
                          isReply={true}
                        />
                      ));
                    })()}
                    
                    {replies.length > INITIAL_REPLIES_LIMIT && (
                      <button
                        onClick={() => toggleExpandReplies(commentId)}
                        className="text-slate-700 hover:text-slate-700 text-sm flex items-center gap-1 mt-2"
                      >
                        {expandedReplies[commentId] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {expandedReplies[commentId] ? 'View less' : `View ${replies.length - INITIAL_REPLIES_LIMIT} more`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <EmptyState
            icon={MessageCircle}
            title="No comments yet"
            message="Be the first to comment!"
            compact
          />
        )}
      </div>
    </motion.div>
  );
};

export default CommentsSection;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import { extractId } from '../../utils/blogHelpers';

/**
 * Comments section component
 * Handles displaying and managing comments and replies
 */
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

  const handleReply = (commentId) => {
    setReplyingTo(commentId);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleSubmitReply = (content, parentCommentId) => {
    onAddComment({ content, parentCommentId });
    setReplyingTo(null);
  };

  const toggleExpandReplies = (commentId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-lg p-8 max-w-[680px] mx-auto"
    >
      <h3 className="text-2xl font-bold text-gray-800 mb-6">
        Comments ({comments.length})
      </h3>

      {/* Add Comment Form */}
      {isAuthenticated && user ? (
        <div className="mb-6">
          <CommentForm
            onSubmit={(content) => onAddComment({ content })}
            isLoading={isLoading}
            placeholder="Write a comment..."
            buttonText="Post Comment"
          />
        </div>
      ) : (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-gray-700">
            Please <Link to="/login" className="text-blue-600 hover:underline">login</Link> to comment
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
                {/* Main Comment */}
                <div>
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
                        onSubmit={(content) => handleSubmitReply(content, commentId)}
                        isLoading={isLoading}
                        placeholder="Write a reply..."
                        buttonText="Post Reply"
                        onCancel={handleCancelReply}
                        rows={2}
                      />
                    </div>
                  )}
                </div>

                {/* Replies */}
                {replies.length > 0 && (
                  <div className="ml-8 space-y-3 border-l-2 border-gray-200 pl-4">
                    {(() => {
                      const isExpanded = expandedReplies[commentId];
                      const repliesToShow = isExpanded ? replies : replies.slice(0, INITIAL_REPLIES_LIMIT);
                      
                      return repliesToShow.map((reply) => {
                        const replyId = extractId(reply);
                        return (
                          <CommentItem
                            key={replyId}
                            comment={reply}
                            user={user}
                            onDelete={() => onDeleteComment(replyId)}
                            isReply={true}
                          />
                        );
                      });
                    })()}
                    
                    {/* View More/Less Button - Always show if more than INITIAL_REPLIES_LIMIT replies */}
                    {replies.length > INITIAL_REPLIES_LIMIT && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleExpandReplies(commentId);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md hover:bg-blue-50 transition-colors border-2 border-blue-400 bg-white shadow-md hover:shadow-lg z-10 relative"
                          aria-label={expandedReplies[commentId] ? "View less replies" : "View more replies"}
                        >
                          {expandedReplies[commentId] ? (
                            <>
                              <span className="text-base sm:text-lg font-bold">▲</span> 
                              <span>View less</span>
                            </>
                          ) : (
                            <>
                              <span className="text-base sm:text-lg font-bold">▼</span> 
                              <span>View {replies.length - INITIAL_REPLIES_LIMIT} more {replies.length - INITIAL_REPLIES_LIMIT === 1 ? 'reply' : 'replies'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-gray-600 text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default CommentsSection;



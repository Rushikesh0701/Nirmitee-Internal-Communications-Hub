import React from 'react';
import { formatDate, getAuthorName, checkCanDeleteComment } from '../../utils/blogHelpers';

/**
 * Individual comment or reply component
 */
const CommentItem = ({ 
  comment, 
  user, 
  onReply, 
  onDelete, 
  isReply = false 
}) => {
  const authorName = getAuthorName(comment);
  const canDelete = checkCanDeleteComment(comment, user);
  const showReplyButton = !isReply && user;

  return (
    <div className={`border border-gray-200 rounded-lg p-${isReply ? '3' : '4'} ${isReply ? 'bg-gray-50' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className={`font-semibold text-gray-800 ${isReply ? 'text-sm' : ''}`}>
            {authorName}
          </span>
          <span className={`${isReply ? 'text-xs' : 'text-sm'} text-gray-500`}>
            {formatDate(comment.createdAt)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {showReplyButton && (
            <button
              onClick={onReply}
              className="text-blue-600 hover:text-blue-800 text-sm"
              aria-label="Reply to comment"
            >
              💬 Reply
            </button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              className={`text-red-600 hover:text-red-800 ${isReply ? 'text-xs' : 'text-sm'}`}
              aria-label="Delete comment"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>
      
      <p className={`text-gray-700 ${isReply ? 'text-sm' : ''} mb-3`}>
        {comment.content || comment.text}
      </p>
    </div>
  );
};

export default React.memo(CommentItem);



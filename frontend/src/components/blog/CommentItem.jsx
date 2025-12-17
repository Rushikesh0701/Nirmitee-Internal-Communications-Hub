import React from 'react';
import { formatDate, getAuthorName, checkCanDeleteComment } from '../../utils/blogHelpers';
import { MessageCircle, Trash2 } from 'lucide-react';

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
    <div className={`border border-gray-200 rounded-lg ${isReply ? 'p-3 bg-gray-50' : 'p-4 bg-gray-50'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-gray-800 ${isReply ? 'text-sm' : ''}`}>
            {authorName}
          </span>
          <span className={`${isReply ? 'text-xs' : 'text-sm'} text-gray-500`}>
            {formatDate(comment.createdAt)}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {showReplyButton && (
            <button
              onClick={onReply}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
            >
              <MessageCircle size={14} /> Reply
            </button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              className={`text-rose-500 hover:text-rose-600 flex items-center gap-1 ${isReply ? 'text-xs' : 'text-sm'}`}
            >
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      </div>
      
      <p className={`text-gray-600 ${isReply ? 'text-sm' : ''}`}>
        {comment.content || comment.text}
      </p>
    </div>
  );
};

export default React.memo(CommentItem);

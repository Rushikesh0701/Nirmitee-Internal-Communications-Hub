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
    <div className={`border border-white/10 rounded-lg ${isReply ? 'p-3 bg-white/5' : 'p-4 bg-white/5'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-white ${isReply ? 'text-sm' : ''}`}>
            {authorName}
          </span>
          <span className={`${isReply ? 'text-xs' : 'text-sm'} text-purple-300/40`}>
            {formatDate(comment.createdAt)}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {showReplyButton && (
            <button
              onClick={onReply}
              className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
            >
              <MessageCircle size={14} /> Reply
            </button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              className={`text-rose-400 hover:text-rose-300 flex items-center gap-1 ${isReply ? 'text-xs' : 'text-sm'}`}
            >
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      </div>
      
      <p className={`text-purple-200/70 ${isReply ? 'text-sm' : ''}`}>
        {comment.content || comment.text}
      </p>
    </div>
  );
};

export default React.memo(CommentItem);

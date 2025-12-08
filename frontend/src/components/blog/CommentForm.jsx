import { useState } from 'react';
import toast from 'react-hot-toast';
import { useCreationStore } from '../../store/creationStore';

/**
 * Reusable comment/reply form component
 */
const CommentForm = ({ 
  onSubmit, 
  isLoading, 
  placeholder = 'Write a comment...', 
  buttonText = 'Post Comment',
  onCancel = null,
  rows = 3,
  commentType = 'blog' // 'blog' | 'discussion' | 'group'
}) => {
  const [content, setContent] = useState('');
  const { startCommentPosting, endCommentPosting, isAnyCommentPosting } = useCreationStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple submissions
    if (isLoading) {
      return;
    }
    
    // Prevent if any other comment is being posted
    if (isAnyCommentPosting()) {
      toast.error('Please wait for the current comment to be posted');
      return;
    }
    
    // Start comment posting process
    if (!startCommentPosting(commentType)) {
      toast.error('Another comment is already being posted');
      return;
    }
    
    if (!content.trim()) {
      endCommentPosting();
      toast.error('Please enter some text');
      return;
    }
    
    // Call onSubmit with a callback to end posting
    onSubmit(content, () => {
      endCommentPosting();
      setContent('');
    });
  };

  const isPosting = isLoading || isAnyCommentPosting();

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        disabled={isPosting}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
        rows={rows}
        aria-label={placeholder}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPosting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPosting ? 'Posting...' : buttonText}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default CommentForm;



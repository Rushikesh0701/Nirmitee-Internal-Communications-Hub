import React, { useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Reusable comment/reply form component
 */
const CommentForm = ({ 
  onSubmit, 
  isLoading, 
  placeholder = 'Write a comment...', 
  buttonText = 'Post Comment',
  onCancel = null,
  rows = 3
}) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Please enter some text');
      return;
    }
    
    onSubmit(content);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 mb-2"
        rows={rows}
        aria-label={placeholder}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Posting...' : buttonText}
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



import { useState } from 'react';
import toast from 'react-hot-toast';
import { useCreationStore } from '../../store/creationStore';

const CommentForm = ({ 
  onSubmit, 
  isLoading, 
  placeholder = 'Write a comment...', 
  buttonText = 'Post Comment',
  onCancel = null,
  rows = 3,
  commentType = 'blog'
}) => {
  const [content, setContent] = useState('');
  const { startCommentPosting, endCommentPosting, isAnyCommentPosting } = useCreationStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading || isAnyCommentPosting()) return;
    if (!startCommentPosting(commentType)) {
      toast.error('Another comment is being posted');
      return;
    }
    
    if (!content.trim()) {
      endCommentPosting();
      toast.error('Please enter some text');
      return;
    }
    
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
        className="textarea mb-3"
        rows={rows}
      />
      <div className="flex gap-2">
        <button type="submit" disabled={isPosting} className="btn btn-primary">
          {isPosting ? 'Posting...' : buttonText}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default CommentForm;

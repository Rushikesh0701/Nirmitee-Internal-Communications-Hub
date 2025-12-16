import { useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { blogAPI } from '../services/blogApi';
import { useCreationStore } from '../store/creationStore';

/**
 * Custom hook for blog mutations
 * Centralizes all blog-related mutations with consistent error handling
 */
export const useBlogMutations = (blogId) => {
  const queryClient = useQueryClient();
  const { endCommentPosting } = useCreationStore();

  const likeMutation = useMutation(
    () => blogAPI.like(blogId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['blog', blogId]);
      },
      onError: () => {
        toast.error('Failed to update like');
      }
    }
  );

  const addCommentMutation = useMutation(
    ({ content, parentCommentId }) => {
      return blogAPI.addComment(blogId, content, parentCommentId);
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['blog', blogId]);
        toast.success(variables.parentCommentId ? 'Reply added!' : 'Comment added!');
        endCommentPosting();
        if (variables.onComplete) {
          variables.onComplete();
        }
      },
      onError: () => {
        endCommentPosting();
        toast.error('Failed to add comment');
      }
    }
  );

  const deleteCommentMutation = useMutation(
    (commentId) => blogAPI.deleteComment(blogId, commentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['blog', blogId]);
        toast.success('Comment deleted!');
      },
      onError: () => {
        toast.error('Failed to delete comment');
      }
    }
  );

  const deleteBlogMutation = useMutation(
    () => blogAPI.delete(blogId),
    {
      onError: () => {
        toast.error('Failed to delete blog');
      }
    }
  );

  const publishMutation = useMutation(
    (isPublished) => blogAPI.update(blogId, { isPublished }),
    {
      onSuccess: (_, isPublished) => {
        queryClient.invalidateQueries(['blog', blogId]);
        queryClient.invalidateQueries('blogs');
        toast.success(isPublished ? 'Blog published successfully!' : 'Blog unpublished and saved as draft');
      },
      onError: () => {
        toast.error('Failed to update blog status');
      }
    }
  );

  return {
    likeMutation,
    addCommentMutation,
    deleteCommentMutation,
    deleteBlogMutation,
    publishMutation
  };
};

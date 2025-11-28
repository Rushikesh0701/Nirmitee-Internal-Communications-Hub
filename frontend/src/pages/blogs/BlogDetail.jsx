import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { blogAPI } from '../../services/blogApi';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useBlogMutations } from '../../hooks/useBlogMutations';
import CommentsSection from '../../components/blog/CommentsSection';
import BlogActions from '../../components/blog/BlogActions';
import DraftBanner from '../../components/blog/DraftBanner';
import {
  isValidBlogId,
  checkIfLiked,
  checkIsOwner,
  checkCanEdit,
  isDraft as checkIsDraft,
  formatDate,
  getAuthorName,
  extractId
} from '../../utils/blogHelpers';
import { sanitizeHtml } from '../../utils/sanitize';
import '../../styles/blog-content.css';

/**
 * Blog Detail Page - Enterprise Grade Refactored
 * 
 * Features:
 * - Clean separation of concerns
 * - Proper React Query patterns (no local state duplication)
 * - Extracted reusable components
 * - Centralized business logic in utilities
 * - XSS protection with sanitization
 * - Consistent error handling
 * - Optimized performance with memoization
 */
const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, requireAuth } = useAuthGuard();
  const { toggleBookmark, isBookmarked } = useBookmarks();

  // Validate blog ID early
  if (!isValidBlogId(id)) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Blog ID</h2>
          <p className="text-gray-600 mb-4">The blog ID is missing or invalid.</p>
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            ← Back to Blogs
          </Link>
        </div>
      </div>
    );
  }

  // Fetch blog data
  const { data: blog, isLoading, error } = useQuery(
    ['blog', id],
    async () => {
      const response = await blogAPI.getById(id);
      return response.data?.data || response.data || response;
    },
    { 
      enabled: isValidBlogId(id),
      staleTime: 30000 // Cache for 30 seconds
    }
  );

  // Get all mutations
  const {
    likeMutation,
    addCommentMutation,
    deleteCommentMutation,
    deleteBlogMutation,
    publishMutation
  } = useBlogMutations(id);

  // Memoized computed values - expensive calculations only run when dependencies change
  const computedValues = useMemo(() => {
    if (!blog) return null;

    return {
      isLiked: checkIfLiked(blog, user),
      isOwner: checkIsOwner(blog, user),
      canEdit: checkCanEdit(blog, user),
      isDraft: checkIsDraft(blog),
      isBookmarked: isBookmarked(extractId(blog)),
      authorName: getAuthorName(blog),
      sanitizedContent: sanitizeHtml(blog.content)
    };
  }, [blog, user, isBookmarked]);

  // Event Handlers
  const handleLike = () => {
    if (!requireAuth('Please login to like posts')) return;
    likeMutation.mutate();
  };

  const handleBookmark = () => {
    if (!requireAuth('Please login to bookmark posts')) return;
    const isNowBookmarked = toggleBookmark(extractId(blog));
    toast.success(isNowBookmarked ? 'Bookmarked!' : 'Removed from bookmarks');
  };

  const handleAddComment = ({ content, parentCommentId }) => {
    if (!requireAuth('Please login to comment')) return;
    addCommentMutation.mutate({ content, parentCommentId });
  };

  const handleDeleteComment = (commentId) => {
    deleteCommentMutation.mutate(commentId);
  };

  const handlePublish = () => {
    if (!blog?.isPublished) {
      publishMutation.mutate(true);
    }
  };

  const handleUnpublish = () => {
    if (blog?.isPublished) {
      publishMutation.mutate(false);
    }
  };

  const handleDeleteBlog = () => {
    if (window.confirm('Are you sure you want to delete this blog?')) {
      deleteBlogMutation.mutate(undefined, {
        onSuccess: () => {
          toast.success('Blog deleted!');
          navigate('/blogs');
        }
      });
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  // Error State
  if (error || !blog) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Blog not found</h2>
          <p className="text-gray-600 mb-4">
            The blog you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            ← Back to Blogs
          </Link>
        </div>
      </div>
    );
  }

  const { isLiked, isOwner, canEdit, isDraft, isBookmarked: bookmarked, authorName, sanitizedContent } = computedValues;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl bg-gray-50 min-h-screen">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => navigate('/blogs')}
        className="mb-4 text-blue-600 hover:underline"
        aria-label="Back to blogs list"
      >
        ← Back to Blogs
      </motion.button>

      {/* Draft Banner */}
      {isAuthenticated && isDraft && isOwner && (
        <DraftBanner 
          onPublish={handlePublish} 
          isPublishing={publishMutation.isLoading} 
        />
      )}

      {/* Main Article */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white mb-6 rounded-lg"
      >
        {/* Content Container */}
        <div className="max-w-[680px] mx-auto px-4 md:px-0">
          {/* Meta Information */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
              <span>{blog.category || 'Uncategorized'}</span>
              <span>•</span>
              <span>{formatDate(blog.createdAt)}</span>
              {isDraft && (
                <>
                  <span>•</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                    Draft
              </span>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight tracking-tight">
            {blog.title}
          </h1>

          {/* Author & Stats */}
          <div className="flex items-center gap-4 mb-8 text-gray-600">
            <span className="font-medium">{authorName}</span>
            <span>•</span>
            <span>{blog.likes || 0} likes</span>
            <span>•</span>
            <span>{blog.comments?.length || 0} comments</span>
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Blog Content - Sanitized */}
          <div className="mb-12">
            <div
              className="blog-content-medium"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          </div>

          {/* Action Buttons */}
          <BlogActions
            blogId={id}
            isAuthenticated={isAuthenticated}
            isLiked={isLiked}
            isBookmarked={bookmarked}
            isDraft={isDraft}
            isOwner={isOwner}
            canEdit={canEdit}
            isPublished={blog.isPublished}
            likesCount={blog.likes || 0}
            onLike={handleLike}
            onBookmark={handleBookmark}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
            onDelete={handleDeleteBlog}
            isLiking={likeMutation.isLoading}
            isPublishing={publishMutation.isLoading}
            isDeleting={deleteBlogMutation.isLoading}
          />
        </div>
      </motion.article>

      {/* Comments Section */}
      <CommentsSection
        comments={blog.comments || []}
        user={user}
        isAuthenticated={isAuthenticated}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        isLoading={addCommentMutation.isLoading}
      />
    </div>
  );
};

export default BlogDetail;

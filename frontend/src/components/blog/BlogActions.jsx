import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Blog action buttons component
 */
const BlogActions = ({
  blogId,
  isAuthenticated,
  isLiked,
  isBookmarked,
  isDraft,
  isOwner,
  canEdit,
  isPublished,
  likesCount,
  onLike,
  onBookmark,
  onPublish,
  onUnpublish,
  onDelete,
  isLiking,
  isPublishing,
  isDeleting
}) => {
  return (
    <div className="flex items-center gap-4 mb-12 pb-8 border-b border-gray-200 flex-wrap">
      {/* Like Button */}
      {isAuthenticated && (
        <>
          <button
            onClick={onLike}
            disabled={isLiking}
            className={`px-4 py-2 rounded-full transition-colors text-sm font-medium ${
              isLiked
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isLiked ? 'Unlike blog' : 'Like blog'}
          >
            {isLiked ? '❤️ Liked' : '🤍 Like'} ({likesCount})
          </button>

          {/* Bookmark Button */}
          <button
            onClick={onBookmark}
            className={`px-4 py-2 rounded-full transition-colors text-sm font-medium ${
              isBookmarked
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark blog'}
          >
            {isBookmarked ? '🔖 Bookmarked' : '🔖 Bookmark'}
          </button>
        </>
      )}

      {/* Publish Button - Only for draft blogs by owner */}
      {isAuthenticated && isDraft && isOwner && (
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          aria-label="Publish blog"
        >
          {isPublishing ? 'Publishing...' : '📢 Publish Now'}
        </button>
      )}

      {/* Edit/Delete Buttons - For owners and admins */}
      {canEdit && (
        <>
          {/* Unpublish Button - Only for published blogs */}
          {isPublished && (
            <button
              onClick={onUnpublish}
              disabled={isPublishing}
              className="px-4 py-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              aria-label="Unpublish blog"
            >
              {isPublishing ? 'Unpublishing...' : '📝 Unpublish'}
            </button>
          )}

          <Link
            to={`/blogs/${blogId}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm font-medium shadow-md"
            aria-label="Edit blog"
          >
            ✏️ Edit
          </Link>

          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors text-sm font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Delete blog"
          >
            🗑️ Delete
          </button>
        </>
      )}
    </div>
  );
};

export default React.memo(BlogActions);



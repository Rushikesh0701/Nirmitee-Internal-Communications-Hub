/**
 * Utility functions for blog operations
 */

/**
 * Safely extract ID from object or string
 */
export const extractId = (entity) => {
  if (!entity) return null;
  return entity._id || entity.id || entity;
};

/**
 * Compare two IDs safely
 */
export const compareIds = (id1, id2) => {
  const extractedId1 = extractId(id1);
  const extractedId2 = extractId(id2);
  
  if (!extractedId1 || !extractedId2) return false;
  
  return extractedId1.toString() === extractedId2.toString();
};

/**
 * Extract author name from various author formats
 */
export const getAuthorName = (author) => {
  if (!author) return 'Unknown';
  
  // Direct firstName/lastName on object
  if (author.firstName && author.lastName) {
    return `${author.firstName} ${author.lastName}`;
  }
  
  // Nested Author object
  if (author.Author?.firstName && author.Author?.lastName) {
    return `${author.Author.firstName} ${author.Author.lastName}`;
  }
  
  // authorId object
  if (author.authorId?.firstName && author.authorId?.lastName) {
    return `${author.authorId.firstName} ${author.authorId.lastName}`;
  }
  
  // Fallback to author string
  return author.author || author.name || 'Unknown';
};

/**
 * Check if user has liked the blog
 */
export const checkIfLiked = (blog, user) => {
  if (!blog || !user || !blog.likedBy) return false;
  
  const userId = extractId(user);
  return blog.likedBy.some((likedUserId) => {
    const likedId = extractId(likedUserId);
    return compareIds(likedId, userId);
  });
};

/**
 * Check if user is the blog owner
 */
export const checkIsOwner = (blog, user) => {
  if (!blog || !user) return false;
  
  const blogAuthorId = extractId(blog.authorId);
  const userId = extractId(user);
  
  return compareIds(blogAuthorId, userId);
};

/**
 * Check if user can edit (owner or admin)
 */
export const checkCanEdit = (blog, user) => {
  if (!user) return false;
  
  const isOwner = checkIsOwner(blog, user);
  const isAdmin = user.roleId?.name === 'Admin' || user.role === 'ADMIN';
  
  return isOwner || isAdmin;
};

/**
 * Check if user can delete comment (comment author or admin)
 */
export const checkCanDeleteComment = (comment, user) => {
  if (!comment || !user) return false;
  
  const commentAuthorId = extractId(comment.authorId);
  const userId = extractId(user);
  const isCommentAuthor = compareIds(commentAuthorId, userId);
  const isAdmin = user.roleId?.name === 'Admin' || user.role === 'ADMIN';
  
  return isCommentAuthor || isAdmin;
};

/**
 * Check if blog is a draft
 */
export const isDraft = (blog) => {
  return blog && (!blog.isPublished || blog.isPublished === false);
};

/**
 * Format date for display
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Validate blog ID
 */
export const isValidBlogId = (id) => {
  return id && id !== 'undefined' && id !== 'null';
};



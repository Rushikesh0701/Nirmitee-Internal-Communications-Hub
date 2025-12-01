import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const BlogCard = ({ blog }) => {
  const blogId = blog._id || blog.id;

  if (!blogId) {
    return null;
  }

  return (
    <Link to={`/blogs/${blogId}`} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className={`bg-white rounded-xl shadow-md overflow-hidden cursor-pointer border 
                    flex flex-col h-full hover:shadow-2xl transition-all duration-300
                    ${blog.isPublished === false ? 'border-yellow-300 border-2 opacity-90' : 'border-gray-200'}`}
      >
        {/* Image Container - Responsive Height */}
        <div className="w-full h-48 sm:h-56 md:h-64 flex-shrink-0 overflow-hidden bg-gray-100">
          <img
            src={blog.coverImage || blog.image || 'https://via.placeholder.com/800x400'}
            alt={blog.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>

        {/* Content Container */}
        <div className="p-4 sm:p-5 md:p-6 flex flex-col flex-grow">
          {/* Category and Status */}
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <span className="text-xs sm:text-sm text-gray-500 font-medium">
              {blog.category || 'Uncategorized'}
            </span>
            {blog.isPublished === false && (
              <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                Draft
              </span>
            )}
          </div>

          {/* Title - Responsive Text Size */}
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 
                         hover:text-primary-600 transition-colors line-clamp-2">
            {blog.title}
          </h3>

          {/* Excerpt */}
          {blog.excerpt && (
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-3 flex-grow">
              {blog.excerpt}
            </p>
          )}

          {/* Footer Section */}
          <div className="mt-auto space-y-3">
            {/* Meta Information */}
            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 flex-wrap gap-2">
              <span className="flex items-center gap-1 truncate max-w-[60%]">
                <span className="text-base">👤</span>
                <span className="truncate">
                  {blog.Author ? `${blog.Author.firstName} ${blog.Author.lastName}` : blog.author || 'Unknown'}
                </span>
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span>❤️</span> {blog.likes || 0}
                </span>
                <span className="flex items-center gap-1">
                  <span>💬</span> {Array.isArray(blog.comments) ? blog.comments.length : (blog.comments || 0)}
                </span>
              </div>
            </div>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {blog.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded-full 
                               hover:bg-primary-100 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default BlogCard;

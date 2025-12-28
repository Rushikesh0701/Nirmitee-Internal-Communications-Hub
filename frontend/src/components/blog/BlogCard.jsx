import { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

const BlogCard = ({ blog }) => {
  const { theme } = useTheme();
  const blogId = blog._id || blog.id;
  const [imageError, setImageError] = useState(false);

  if (!blogId) {
    return null;
  }

  // SVG placeholder as data URI
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect width='800' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";

  return (
    <Link to={`/blogs/${blogId}`} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className={`rounded-xl overflow-hidden cursor-pointer border 
                    flex flex-col h-full transition-all duration-300
                    ${theme === 'dark' 
                      ? blog.isPublished === false 
                        ? 'bg-[#0a0e17]/50 border-yellow-500/50 border-2 opacity-90' 
                        : 'bg-[#0a0e17]/50 border-[#151a28]/50'
                      : blog.isPublished === false 
                        ? 'bg-white border-yellow-300 border-2 opacity-90' 
                        : 'bg-white border-gray-200'
                    }`}
      >
        {/* Image Container - Responsive Height */}
        <div className={`w-full h-24 sm:h-28 flex-shrink-0 overflow-hidden ${
          theme === 'dark' ? 'bg-[#0a0e17]/50' : 'bg-gray-100'
        }`}>
          <img
            src={imageError ? placeholderImage : (blog.coverImage || blog.image || placeholderImage)}
            alt={blog.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        </div>

        {/* Content Container */}
        <div className="p-2 flex flex-col flex-grow">
          {/* Category and Status */}
          <div className="flex items-center justify-between mb-0.5 flex-wrap gap-1">
            <span className={`text-xs sm:text-button ${
              theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {blog.category || 'Uncategorized'}
            </span>
            {blog.isPublished === false && (
              <span className={`px-2 py-1 text-overline rounded-full ${
                theme === 'dark' 
                  ? 'bg-yellow-500/20 text-yellow-400' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                Draft
              </span>
            )}
          </div>

          {/* Title - Responsive Text Size */}
          <h3 className={`text-base sm:text-h2 mb-1 
                         transition-colors line-clamp-2 ${
            theme === 'dark' 
              ? 'text-slate-200 hover:text-indigo-400' 
              : 'text-gray-800 hover:text-primary-600'
          }`}>
            {blog.title}
          </h3>

          {/* Excerpt */}
          {blog.excerpt && (
            <p className={`text-xs sm:text-sm mb-1.5 line-clamp-2 flex-grow ${
              theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
            }`}>
              {blog.excerpt}
            </p>
          )}

          {/* Footer Section */}
          <div className="mt-auto space-y-3">
            {/* Meta Information */}
            <div className={`flex items-center justify-between text-xs sm:text-sm flex-wrap gap-2 ${
              theme === 'dark' ? 'text-slate-500' : 'text-gray-500'
            }`}>
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
                  <span>💬</span> {blog.commentCount ?? (Array.isArray(blog.comments) ? blog.comments.length : 0)}
                </span>
              </div>
            </div>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {blog.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      theme === 'dark'
                        ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                        : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                    }`}
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

export default memo(BlogCard);

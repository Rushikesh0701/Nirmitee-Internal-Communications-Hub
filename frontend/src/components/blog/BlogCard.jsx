import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const BlogCard = ({ blog }) => {
  const blogId = blog._id || blog.id;
  
  if (!blogId) {
    return null; // Don't render if no ID
  }

  return (
    <Link to={`/blogs/${blogId}`} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer border flex flex-col h-full ${
          blog.isPublished === false ? 'border-yellow-300 border-2 opacity-90' : 'border-gray-200'
        }`}
        style={{ width: '100%', height: '500px' }}
      >
        <div className="w-full h-48 flex-shrink-0 overflow-hidden">
        <img
            src={blog.coverImage || blog.image || 'https://via.placeholder.com/800x400'}
          alt={blog.title}
            className="w-full h-full object-cover"
        />
        </div>
        <div className="p-6 flex flex-col flex-grow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {blog.category || 'Uncategorized'}
              </span>
              {blog.isPublished === false && (
                <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                  Draft
            </span>
              )}
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3 hover:text-blue-600 transition-colors line-clamp-2">
            {blog.title}
          </h3>
          {blog.excerpt && (
            <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">
              {blog.excerpt}
            </p>
          )}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>👤 {blog.Author ? `${blog.Author.firstName} ${blog.Author.lastName}` : blog.author || 'Unknown'}</span>
              <span>❤️ {blog.likes || 0}</span>
              <span>💬 {Array.isArray(blog.comments) ? blog.comments.length : (blog.comments || 0)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {blog.tags?.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default BlogCard;

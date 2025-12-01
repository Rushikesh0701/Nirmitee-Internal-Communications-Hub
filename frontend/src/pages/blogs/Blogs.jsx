import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { blogAPI } from '../../services/blogApi';
import BlogCard from '../../components/blog/BlogCard';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useBookmarks } from '../../hooks/useBookmarks';

const Blogs = () => {
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { user, isAuthenticated } = useAuthStore();
  const { bookmarks } = useBookmarks();

  const { data, isLoading, error } = useQuery(
    ['blogs', filter, categoryFilter],
    async () => {
      const params = {};
      
      // Handle published/unpublished filter logic
      if (filter === 'all') {
        // "All Blogs" - only show published blogs
        params.published = true;
      } else if (filter === 'my-blogs' && user) {
        // "My Blogs" - show all user's blogs (published and unpublished)
        params.authorId = user._id || user.id;
        // Don't set published param - show all
      } else if (filter === 'drafts' && user) {
        // "Drafts" - show only unpublished blogs by current user
        params.authorId = user._id || user.id;
        params.published = false;
      }
      
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      
      const response = await blogAPI.getAll(params);
      // API returns { success: true, data: { blogs: [...], pagination: {...} } }
      // axios wraps the response, so response.data is the actual API response
      const apiResponse = response.data;
      // If apiResponse has a 'data' property (from sendSuccess), use it; otherwise use apiResponse directly
      const blogsData = apiResponse.data || apiResponse;
      return blogsData;
    },
    {
      onError: () => {
        toast.error('Failed to fetch blogs');
      }
    }
  );

  const categories = ['all', 'Frontend', 'Backend', 'Full Stack', 'DevOps', 'Other'];

  const filteredBlogs = (data?.blogs || []).filter((blog) => {
    const matchesSearch = 
      blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || blog.category === categoryFilter;
    
    // Filter by bookmarks if the bookmarked filter is selected
    const blogId = (blog._id || blog.id)?.toString();
    const matchesBookmark = filter !== 'bookmarked' || bookmarks.includes(blogId);
    
    return matchesSearch && matchesCategory && matchesBookmark;
  });

  // Skeleton loader component
  const BlogCardSkeleton = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex flex-col" style={{ width: '100%', height: '500px' }}>
      <Skeleton height={192} className="flex-shrink-0" />
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <Skeleton width={80} height={20} />
          <Skeleton width={60} height={20} />
        </div>
        <Skeleton height={24} className="mb-2" />
        <Skeleton count={3} className="mb-4 flex-grow" />
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-3">
            <Skeleton width={120} height={16} />
          </div>
          <Skeleton width={60} height={20} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Blogs & Articles
        </h1>
        {isAuthenticated && user && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/blogs/new"
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <span className="md:hidden">+ Create</span>
              <span className="hidden md:inline">+ Create Blog</span>
            </Link>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-col md:flex-row gap-4 mb-8"
      >
        <input
          type="text"
          placeholder="Search blogs by title, content, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 transition-all"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 transition-all"
          title={filter === 'drafts' ? 'View your unpublished blog drafts' : filter === 'my-blogs' ? 'View all your blogs (published and drafts)' : filter === 'bookmarked' ? 'View your bookmarked blogs' : 'View all published blogs'}
        >
          <option value="all">All Blogs (Published)</option>
          {isAuthenticated && user && <option value="my-blogs">My Blogs (All)</option>}
          {isAuthenticated && user && <option value="drafts">My Drafts (Unpublished)</option>}
          <option value="bookmarked"> Bookmarked Blogs</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 transition-all"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {filteredBlogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBlogs.map((blog, index) => (
                <motion.div
                  key={blog._id || blog.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <BlogCard blog={blog} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl mb-2">No blogs found</p>
              <p className="text-sm">
                {!isAuthenticated 
                  ? "Login to create your first blog!" 
                  : filter === 'drafts' 
                    ? "You don't have any draft blogs. Create a blog without publishing it to see it here."
                    : filter === 'my-blogs'
                      ? "You haven't created any blogs yet. Click 'Create Blog' to get started!"
                      : filter === 'bookmarked'
                        ? "You haven't bookmarked any blogs yet. Click the bookmark icon on any blog to save it here!"
                        : "Try adjusting your filters"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Blogs;

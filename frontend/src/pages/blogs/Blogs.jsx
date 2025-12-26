import { useState, useEffect, memo } from 'react';
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
import { useTheme } from '../../contexts/ThemeContext';
import Pagination from '../../components/Pagination';
import { Plus, BookOpen } from 'lucide-react';
import EmptyState from '../../components/EmptyState';

const Blogs = () => {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const { user, isAuthenticated } = useAuthStore();
  const { bookmarks } = useBookmarks();

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filter, categoryFilter, searchTerm]);

  const { data, isLoading } = useQuery(
    ['blogs', filter, categoryFilter, page, limit, searchTerm],
    async () => {
      const params = {
        page,
        limit
      };
      
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

      // Add search term if provided (client-side search for bookmarked filter)
      if (searchTerm && filter !== 'bookmarked') {
        // Note: Backend search would need to be implemented
        // For now, we'll do client-side filtering for search
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
      keepPreviousData: true,
      onError: () => {
        toast.error('Failed to fetch blogs');
      }
    }
  );

  const categories = ['all', 'Frontend', 'Backend', 'Full Stack', 'DevOps', 'Other'];

  // Client-side filtering for search and bookmarks (since backend doesn't support these)
  const blogs = data?.blogs || [];
  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch = !searchTerm || 
      blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by bookmarks if the bookmarked filter is selected
    const blogId = (blog._id || blog.id)?.toString();
    const matchesBookmark = filter !== 'bookmarked' || bookmarks.includes(blogId);
    
    return matchesSearch && matchesBookmark;
  });

  const pagination = data?.pagination || { total: 0, page: 1, limit: 12, pages: 1 };

  // Skeleton loader component
  const BlogCardSkeleton = () => (
    <div className={`rounded-lg overflow-hidden border flex flex-col ${
      theme === 'dark'
        ? 'bg-[#052829]/50 border-[#0a3a3c]/50'
        : 'bg-white border-gray-200'
    }`} style={{ width: '100%', height: '280px' }}>
      <Skeleton height={96} className="flex-shrink-0" baseColor={theme === 'dark' ? '#1e293b' : undefined} highlightColor={theme === 'dark' ? '#052829' : undefined} />
      <div className="p-2 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <Skeleton width={80} height={20} baseColor={theme === 'dark' ? '#1e293b' : undefined} highlightColor={theme === 'dark' ? '#052829' : undefined} />
          <Skeleton width={60} height={20} baseColor={theme === 'dark' ? '#1e293b' : undefined} highlightColor={theme === 'dark' ? '#052829' : undefined} />
        </div>
        <Skeleton height={24} className="mb-2" baseColor={theme === 'dark' ? '#1e293b' : undefined} highlightColor={theme === 'dark' ? '#052829' : undefined} />
        <Skeleton count={3} className="mb-4 flex-grow" baseColor={theme === 'dark' ? '#1e293b' : undefined} highlightColor={theme === 'dark' ? '#052829' : undefined} />
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-3">
            <Skeleton width={120} height={16} baseColor={theme === 'dark' ? '#1e293b' : undefined} highlightColor={theme === 'dark' ? '#052829' : undefined} />
          </div>
          <Skeleton width={60} height={20} baseColor={theme === 'dark' ? '#1e293b' : undefined} highlightColor={theme === 'dark' ? '#052829' : undefined} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-3 py-2">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3"
      >
        <h1 className={`text-xl sm:text-2xl font-bold ${
          theme === 'dark' ? 'text-slate-100' : 'text-gray-800'
        }`}>
          Blogs & Articles
        </h1>
        {isAuthenticated && user && (
          <Link
            to="/blogs/new"
            className="btn-add"
          >
            <Plus size={16} />
            <span className="md:hidden">Create</span>
            <span className="hidden md:inline">Create Blog</span>
          </Link>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-col md:flex-row gap-2 mb-3"
      >
        <input
          type="text"
          placeholder="Search blogs by title, content, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all ${
            theme === 'dark'
              ? 'border-[#ff4701] bg-[#052829]/50 text-slate-200 placeholder-slate-500'
              : 'border-gray-300 bg-white text-gray-900'
          }`}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
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
          className="filter-select"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {filteredBlogs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
              {pagination.pages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={pagination.pages}
                  onPageChange={setPage}
                  limit={limit}
                  onLimitChange={(newLimit) => {
                    setLimit(newLimit);
                    setPage(1);
                  }}
                  showLimitSelector={true}
                />
              )}
            </>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No blogs found"
              message={
                !isAuthenticated 
                  ? "Login to create your first blog!" 
                  : filter === 'drafts' 
                    ? "You don't have any draft blogs. Create a blog without publishing it to see it here."
                    : filter === 'my-blogs'
                      ? "You haven't created any blogs yet. Click 'Create Blog' to get started!"
                      : filter === 'bookmarked'
                        ? "You haven't bookmarked any blogs yet. Click the bookmark icon on any blog to save it here!"
                        : "Try adjusting your filters"}
            />
          )}
        </>
      )}
    </div>
  );
};

export default memo(Blogs);

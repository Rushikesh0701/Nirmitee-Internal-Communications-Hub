import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { discussionAPI } from '../../services/discussionApi';
import DiscussionCard from '../../components/discussion/DiscussionCard';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const Discussions = () => {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const { user, isAuthenticated } = useAuthStore();

  const fetchDiscussions = useCallback(async () => {
    try {
      setLoading(true);
      const params = selectedTag ? { tag: selectedTag } : {};
      const response = await discussionAPI.getAll(params);
      const apiResponse = response.data;
      const discussionsData = apiResponse.data || apiResponse;
      const discussionsList = discussionsData.discussions || discussionsData || [];
      setDiscussions(Array.isArray(discussionsList) ? discussionsList : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch discussions');
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTag]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  const filteredDiscussions = discussions.filter(
    (discussion) =>
      discussion.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discussion.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allTags = [
    ...new Set(discussions.flatMap((d) => d.tags || [])),
  ].sort();

  // Skeleton loader component
  const DiscussionCardSkeleton = () => (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-200">
      <Skeleton height={28} className="mb-2" />
      <Skeleton count={2} className="mb-4" />
      <div className="flex items-center justify-between">
        <Skeleton width={200} height={16} />
        <Skeleton width={100} height={20} />
      </div>
    </div>
  );

  return (
    <div className="container-responsive responsive-padding animate-fade-in">
      {/* Header - Fully Responsive */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8"
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
          Technical Discussions
        </h1>
        {isAuthenticated && user && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/discussions/create"
              className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 
                         bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg 
                         hover:from-purple-700 hover:to-indigo-700 transition-all duration-300
                         shadow-md hover:shadow-lg text-sm sm:text-base font-medium w-full sm:w-auto"
            >
              <span className="md:hidden">+ Create</span>
              <span className="hidden md:inline">+ Start Discussion</span>
            </Link>
          </motion.div>
        )}
      </motion.div>

      {/* Search & Filter - Responsive */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8"
      >
        <input
          type="text"
          placeholder="Search discussions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-purple-500 
                     transition-all text-sm sm:text-base"
        />
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-purple-500 
                     transition-all text-sm sm:text-base min-w-[140px]"
        >
          <option value="">All Tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Discussion List - Responsive */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <DiscussionCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {filteredDiscussions.length > 0 ? (
            <div className="space-y-4">
              {filteredDiscussions.map((discussion, index) => {
                const discussionId = discussion._id || discussion.id;
                if (!discussionId) return null;

                return (
                  <motion.div
                    key={discussionId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <DiscussionCard discussion={discussion} />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <div className="text-4xl sm:text-6xl mb-4">💬</div>
              <p className="text-gray-500 text-base sm:text-lg mb-2">
                No discussions found
              </p>
              <p className="text-gray-400 text-sm sm:text-base">
                {!isAuthenticated || !user
                  ? "Login to start a discussion!"
                  : "Try adjusting your search or create a new discussion"}
              </p>
              {isAuthenticated && user && (
                <Link
                  to="/discussions/create"
                  className="inline-block mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg 
                             hover:bg-purple-700 transition-colors text-sm sm:text-base"
                >
                  Start First Discussion
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Discussions;

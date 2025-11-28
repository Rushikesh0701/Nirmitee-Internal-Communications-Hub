import React, { useState, useEffect, useCallback } from 'react';
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
      // API returns { success: true, data: { discussions: [...], total, page, limit } }
      // axios wraps the response, so response.data is the actual API response
      const apiResponse = response.data;
      // If apiResponse has a 'data' property (from sendSuccess), use it; otherwise use apiResponse directly
      const discussionsData = apiResponse.data || apiResponse;
      // Extract discussions array from the data object
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
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <Skeleton height={28} className="mb-2" />
      <Skeleton count={3} className="mb-4" />
      <div className="flex items-center justify-between">
        <Skeleton width={200} height={16} />
        <Skeleton width={100} height={20} />
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
          Technical Discussions
        </h1>
        {isAuthenticated && user && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/discussions/create"
              className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <span className="md:hidden">+ Create</span>
              <span className="hidden md:inline">+ Start Discussion</span>
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
          placeholder="Search discussions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        >
          <option value="">All Tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </motion.div>

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
                if (!discussionId) return null; // Skip discussions without ID
                
                return (
                  <motion.div
                    key={discussionId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <DiscussionCard discussion={discussion} />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-2">
                No discussions found
              </p>
              <p className="text-gray-400 text-sm">
                {!isAuthenticated || !user ? "Login to start a discussion!" : "Try adjusting your search"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Discussions;


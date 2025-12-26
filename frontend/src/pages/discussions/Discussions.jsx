import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { discussionAPI } from '../../services/discussionApi';
import DiscussionCard from '../../components/discussion/DiscussionCard';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { MessageSquare, Search, Plus } from 'lucide-react';
import { ListSkeleton } from '../../components/SkeletonLoader';
import Pagination from '../../components/Pagination';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const Discussions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const { user, isAuthenticated } = useAuthStore();

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedTag, searchTerm]);

  const { data, isLoading } = useQuery(
    ['discussions', selectedTag, page, limit],
    async () => {
      const params = {
        page,
        limit
      };
      if (selectedTag) params.tag = selectedTag;
      const response = await discussionAPI.getAll(params);
      const apiResponse = response.data;
      const discussionsData = apiResponse.data || apiResponse;
      return discussionsData;
    },
    {
      keepPreviousData: true,
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to fetch discussions');
      }
    }
  );

  const discussions = data?.discussions || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 12, pages: 1 };

  // Client-side search filtering
  const filteredDiscussions = discussions.filter(
    (discussion) =>
      !searchTerm ||
      discussion.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discussion.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get all tags from all discussions (for tag filter dropdown)
  // Note: This might need to be fetched separately or from first page only
  const allTags = [...new Set(discussions.flatMap((d) => d.tags || []))].sort();

  return (
    <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#0a3a3c]">
            <MessageSquare size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Technical Discussions</h1>
            <p className="text-slate-500 text-xs mt-0.5">Share ideas and solve problems together</p>
          </div>
        </div>
        {isAuthenticated && user && (
          <Link to="/discussions/create" className="btn-add">
            <Plus size={16} />
            <span className="hidden md:inline">Start Discussion</span>
            <span className="md:hidden">Create</span>
          </Link>
        )}
      </motion.div>

      {/* Search & Filter */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors" size={16} />
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-11"
          />
        </div>
        <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} className="filter-select min-w-[150px]">
          <option value="">All Tags</option>
          {allTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
        </select>
      </motion.div>

      {/* Discussion List */}
      {isLoading && !data ? (
        <ListSkeleton count={5} />
      ) : filteredDiscussions.length > 0 ? (
        <>
          <motion.div className="space-y-4" variants={containerVariants}>
            {filteredDiscussions.map((discussion, index) => {
              const discussionId = discussion._id || discussion.id;
              if (!discussionId) return null;
              return (
                <motion.div key={discussionId} variants={itemVariants} custom={index}>
                  <DiscussionCard discussion={discussion} />
                </motion.div>
              );
            })}
          </motion.div>
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
        !isLoading && (
          <motion.div variants={itemVariants} className="empty-state">
          <MessageSquare size={56} className="empty-state-icon" />
          <h3 className="empty-state-title">No discussions found</h3>
          <p className="empty-state-text mb-4">
            {!isAuthenticated || !user ? 'Login to start a discussion!' : 'Try adjusting your search or create a new discussion'}
          </p>
          {isAuthenticated && user && (
            <Link to="/discussions/create" className="btn-add">
              <Plus size={16} /> Start First Discussion
            </Link>
          )}
          </motion.div>
        )
      )}
    </motion.div>
  );
};

export default Discussions;

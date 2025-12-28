import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { discussionAPI } from '../../services/discussionApi';
import DiscussionCard from '../../components/discussion/DiscussionCard';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { MessageSquare, Search, Plus } from 'lucide-react';
import { ListSkeleton } from '../../components/skeletons';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';

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
    ['discussions', selectedTag, page, limit, searchTerm],
    async () => {
      const params = {
        page,
        limit
      };
      if (selectedTag) params.tag = selectedTag;
      if (searchTerm && searchTerm.trim()) params.search = searchTerm.trim();
      const response = await discussionAPI.getAll(params);
      const apiResponse = response.data;
      const discussionsData = apiResponse.data || apiResponse;
      return discussionsData;
    },
    {
      keepPreviousData: true,
      staleTime: 0, // Always refetch when invalidated
      cacheTime: 5 * 60 * 1000, // 5 minutes - keep in cache
      refetchOnMount: true, // Refetch when component mounts
      refetchOnWindowFocus: false,
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to fetch discussions');
      }
    }
  );

  const discussions = data?.discussions || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 12, pages: 1 };

  // Fetch all tags from API
  const { data: tagsData } = useQuery(
    ['discussion-tags'],
    async () => {
      const response = await discussionAPI.getAllTags();
      const apiResponse = response.data;
      const tagsResponse = apiResponse.data || apiResponse;
      return tagsResponse;
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes - tags don't change often
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnMount: false,
      refetchOnWindowFocus: false
    }
  );

  const allTags = tagsData?.tags || [];

  return (
    <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#151a28]">
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
      ) : discussions.length > 0 ? (
        <>
          <motion.div className="space-y-4" variants={containerVariants}>
            {discussions.map((discussion, index) => {
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
          <EmptyState
            icon={MessageSquare}
            title="No discussions found"
            message={!isAuthenticated || !user ? 'Login to start a discussion!' : 'Try adjusting your search or create a new discussion'}
            action={isAuthenticated && user && (
              <Link to="/discussions/create" className="btn-add">
                <Plus size={16} /> Start First Discussion
              </Link>
            )}
          />
        )
      )}
    </motion.div>
  );
};

export default memo(Discussions);

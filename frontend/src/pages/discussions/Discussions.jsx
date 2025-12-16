import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { discussionAPI } from '../../services/discussionApi';
import DiscussionCard from '../../components/discussion/DiscussionCard';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { MessageSquare, Search, Plus } from 'lucide-react';
import Loading from '../../components/Loading';

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
  const { user, isAuthenticated } = useAuthStore();

  const { data, isLoading } = useQuery(
    ['discussions', selectedTag],
    async () => {
      const params = selectedTag ? { tag: selectedTag } : {};
      const response = await discussionAPI.getAll(params);
      const apiResponse = response.data;
      const discussionsData = apiResponse.data || apiResponse;
      const discussionsList = discussionsData.discussions || discussionsData || [];
      return Array.isArray(discussionsList) ? discussionsList : [];
    },
    {
      refetchOnMount: 'always',
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to fetch discussions');
      }
    }
  );

  const discussions = data || [];

  const filteredDiscussions = discussions.filter(
    (discussion) =>
      discussion.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discussion.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allTags = [...new Set(discussions.flatMap((d) => d.tags || []))].sort();

  if (isLoading) return <Loading fullScreen size="lg" text="Loading discussions..." />;

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/25">
            <MessageSquare size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Technical Discussions</h1>
            <p className="text-slate-500 text-sm mt-0.5">Share ideas and solve problems together</p>
          </div>
        </div>
        {isAuthenticated && user && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link to="/discussions/create" className="btn btn-primary flex items-center gap-2">
              <Plus size={18} />
              <span className="hidden md:inline">Start Discussion</span>
              <span className="md:hidden">Create</span>
            </Link>
          </motion.div>
        )}
      </motion.div>

      {/* Search & Filter */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-11"
          />
        </div>
        <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} className="input-select min-w-[150px]">
          <option value="">All Tags</option>
          {allTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
        </select>
      </motion.div>

      {/* Discussion List */}
      {filteredDiscussions.length > 0 ? (
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
      ) : (
        <motion.div variants={itemVariants} className="empty-state">
          <MessageSquare size={56} className="empty-state-icon" />
          <h3 className="empty-state-title">No discussions found</h3>
          <p className="empty-state-text mb-4">
            {!isAuthenticated || !user ? 'Login to start a discussion!' : 'Try adjusting your search or create a new discussion'}
          </p>
          {isAuthenticated && user && (
            <Link to="/discussions/create" className="btn btn-primary inline-flex items-center gap-2">
              <Plus size={18} /> Start First Discussion
            </Link>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Discussions;

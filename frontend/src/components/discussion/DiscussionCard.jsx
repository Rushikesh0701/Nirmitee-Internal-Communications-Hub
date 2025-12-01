import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const DiscussionCard = ({ discussion }) => {
  const discussionId = discussion._id || discussion.id;

  if (!discussionId) {
    return null;
  }

  return (
    <Link to={`/discussions/${discussionId}`} className="block">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white rounded-xl shadow-md p-4 sm:p-6 cursor-pointer border border-gray-200
                   hover:shadow-xl hover:border-purple-100 transition-all duration-300"
      >
        {/* Title - Responsive */}
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 
                       hover:text-purple-600 transition-colors line-clamp-2">
          {discussion.title}
        </h3>

        {/* Meta Information - Responsive Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Stats - Responsive */}
          <div className="flex items-center flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="text-base">👤</span>
              <span className="truncate max-w-[120px] sm:max-w-none">
                {(() => {
                  const author = discussion.authorId || discussion.Author || discussion.author;
                  if (author) {
                    if (typeof author === 'object') {
                      if (author.firstName || author.lastName) {
                        return `${author.firstName || ''} ${author.lastName || ''}`.trim();
                      }
                      if (author.displayName) return author.displayName;
                      if (author.name) return author.name;
                      if (author.email) return author.email.split('@')[0];
                    } else if (typeof author === 'string') {
                      return author;
                    }
                  }
                  if (discussion.authorEmail) {
                    return discussion.authorEmail.split('@')[0];
                  }
                  return 'Unknown User';
                })()}
              </span>
            </span>

            <span className="flex items-center gap-1">
              <span>⬆️</span> {discussion.Agrees || discussion.agrees || 0}
            </span>

            <span className="flex items-center gap-1">
              <span>⬇️</span> {discussion.Disagrees || discussion.disagrees || 0}
            </span>

            <span className="flex items-center gap-1">
              <span>💬</span>
              <span className="hidden xs:inline">
                {discussion.answers?.length || discussion.Comments?.length || 0} answers
              </span>
              <span className="xs:hidden">
                {discussion.answers?.length || discussion.Comments?.length || 0}
              </span>
            </span>
          </div>

          {/* Tags - Responsive */}
          <div className="flex flex-wrap gap-2">
            {discussion.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded-full
                           hover:bg-purple-100 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default React.memo(DiscussionCard);

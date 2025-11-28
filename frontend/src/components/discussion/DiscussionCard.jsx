import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const DiscussionCard = ({ discussion }) => {
  const discussionId = discussion._id || discussion.id;
  
  if (!discussionId) {
    return null; // Don't render if no ID
  }

  return (
    <Link to={`/discussions/${discussionId}`} className="block">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white rounded-lg shadow-md p-6 cursor-pointer border border-gray-200"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4 hover:text-purple-600 transition-colors">
          {discussion.title}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>👤 {(() => {
              const author = discussion.authorId || discussion.Author || discussion.author;
              if (author) {
                if (typeof author === 'object') {
                  // Author is populated object
                  if (author.firstName || author.lastName) {
                    return `${author.firstName || ''} ${author.lastName || ''}`.trim();
                  }
                  if (author.displayName) {
                    return author.displayName;
                  }
                  if (author.name) {
                    return author.name;
                  }
                  if (author.email) {
                    return author.email.split('@')[0];
                  }
                } else if (typeof author === 'string') {
                  return author;
                }
              }
              // Fallback to email if available
              if (discussion.authorEmail) {
                return discussion.authorEmail.split('@')[0];
              }
              return 'Unknown User';
            })()}</span>
            <span>⬆️ {discussion.Agrees || discussion.agrees || 0}</span>
            <span>⬇️ {discussion.Disagrees || discussion.disagrees || 0}</span>
            <span>💬 {discussion.answers?.length || discussion.Comments?.length || 0} answers</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {discussion.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default React.memo(DiscussionCard);


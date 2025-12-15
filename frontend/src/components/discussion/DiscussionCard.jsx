import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, ThumbsUp, ThumbsDown, MessageCircle, Tag } from 'lucide-react';

const DiscussionCard = ({ discussion }) => {
  const discussionId = discussion._id || discussion.id;
  if (!discussionId) return null;

  const getAuthorName = () => {
    const author = discussion.authorId || discussion.Author || discussion.author;
    if (author) {
      if (typeof author === 'object') {
        if (author.firstName || author.lastName) return `${author.firstName || ''} ${author.lastName || ''}`.trim();
        if (author.displayName) return author.displayName;
        if (author.name) return author.name;
        if (author.email) return author.email.split('@')[0];
      } else if (typeof author === 'string') return author;
    }
    if (discussion.authorEmail) return discussion.authorEmail.split('@')[0];
    return 'Unknown User';
  };

  return (
    <Link to={`/discussions/${discussionId}`} className="block">
      <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }} whileTap={{ scale: 0.99 }} className="card-hover cursor-pointer group">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {discussion.title}
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center flex-wrap gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <User size={14} className="text-slate-400" />
              <span className="truncate max-w-[120px] sm:max-w-none">{getAuthorName()}</span>
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp size={14} className="text-emerald-500" />
              {discussion.Agrees || discussion.agrees || 0}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsDown size={14} className="text-rose-500" />
              {discussion.Disagrees || discussion.disagrees || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={14} className="text-blue-500" />
              <span className="hidden xs:inline">{discussion.answers?.length || discussion.Comments?.length || 0} answers</span>
              <span className="xs:hidden">{discussion.answers?.length || discussion.Comments?.length || 0}</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {discussion.tags?.slice(0, 3).map((tag) => (
              <span key={tag} className="badge badge-primary text-xs flex items-center gap-1">
                <Tag size={10} /> {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default React.memo(DiscussionCard);

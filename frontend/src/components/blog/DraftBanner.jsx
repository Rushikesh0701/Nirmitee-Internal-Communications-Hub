import React from 'react';
import { motion } from 'framer-motion';

/**
 * Draft blog banner component
 */
const DraftBanner = ({ onPublish, isPublishing }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-yellow-800 font-semibold mb-1">
            📝 This blog is saved as a draft
          </p>
          <p className="text-yellow-700 text-sm">
            It's only visible to you. Publish it to make it visible to everyone.
          </p>
        </div>
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md whitespace-nowrap"
          aria-label="Publish blog"
        >
          {isPublishing ? 'Publishing...' : '📢 Publish Now'}
        </button>
      </div>
    </motion.div>
  );
};

export default DraftBanner;



import React from 'react';

const LottieEmptyState = ({ message = 'No items found', subMessage = '' }) => {
  return (
    <div className="text-center py-12">
      <div className="mb-4">
        <svg
          className="mx-auto h-24 w-24 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {message}
      </h3>
      {subMessage && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {subMessage}
        </p>
      )}
    </div>
  );
};

export default LottieEmptyState;


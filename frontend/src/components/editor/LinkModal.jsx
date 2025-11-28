import React, { useState, useCallback } from 'react';

const LinkModal = ({ 
  isOpen, 
  onClose, 
  editor 
}) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const handleLinkInsert = useCallback(() => {
    if (linkUrl.trim() && editor) {
      if (linkText.trim()) {
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run();
      } else {
        editor.chain().focus().setLink({ href: linkUrl }).run();
      }
      setLinkUrl('');
      setLinkText('');
      onClose();
    }
  }, [editor, linkUrl, linkText, onClose]);

  const handleClose = useCallback(() => {
    setLinkUrl('');
    setLinkText('');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Insert Link</h3>
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="Enter URL"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 mb-2"
        />
        <input
          type="text"
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
          placeholder="Enter link text (optional)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 mb-4"
          onKeyPress={(e) => e.key === 'Enter' && handleLinkInsert()}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleLinkInsert}
            disabled={!linkUrl.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkModal;


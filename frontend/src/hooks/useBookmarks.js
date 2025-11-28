import { useState, useEffect } from 'react';

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    // Load bookmarks from localStorage
    const saved = localStorage.getItem('bookmarks');
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (e) {
        setBookmarks([]);
      }
    }
  }, []);

  const toggleBookmark = (id) => {
    const bookmarkId = id?.toString();
    setBookmarks(prev => {
      const isBookmarked = prev.includes(bookmarkId);
      const newBookmarks = isBookmarked
        ? prev.filter(b => b !== bookmarkId)
        : [...prev, bookmarkId];
      
      // Save to localStorage
      localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
      return newBookmarks;
    });
    
    const isBookmarked = bookmarks.includes(bookmarkId);
    return !isBookmarked;
  };

  const isBookmarked = (id) => {
    const bookmarkId = id?.toString();
    return bookmarks.includes(bookmarkId);
  };

  return { toggleBookmark, isBookmarked, bookmarks };
};


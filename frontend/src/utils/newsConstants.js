/**
 * News constants and configuration
 */

export const TECH_CATEGORIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'ai', label: 'AI & Machine Learning' },
  { value: 'software', label: 'Software Development' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'gadgets', label: 'Gadgets & Hardware' },
  { value: 'startups', label: 'Startups' },
  { value: 'business', label: 'Business Tech' },
  { value: 'science', label: 'Science & Research' },
  { value: 'HealthcareIT', label: 'Healthcare IT' },
];

export const DATE_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'date', label: 'Newest First' },
  { value: 'popularity', label: 'Most Popular' },
];

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'hi', label: 'Hindi' },
  { value: 'mr', label: 'Marathi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'ur', label: 'Urdu' },
  { value: 'bn', label: 'Bengali' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'kn', label: 'Kannada' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'or', label: 'Oriya' },
  { value: 'sd', label: 'Sindhi' },
];

export const getDateRangeParams = (dateRange, minDate, maxDate) => {
  if (dateRange === 'custom' && minDate && maxDate) {
    return { from: minDate, to: maxDate };
  }
  
  const now = new Date();
  let from = null;
  
  switch (dateRange) {
    case 'today':
      from = new Date(now.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
      break;
    case 'week':
      from = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
      break;
    case 'month':
      from = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
      break;
    case 'year':
      from = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
      break;
    default:
      return null;
  }
  
  return from ? { from } : null;
};

export const buildSearchQuery = (query, exactPhrase, searchType) => {
  let searchQuery = query.trim();
  
  if (exactPhrase && searchQuery && !searchQuery.startsWith('"') && !searchQuery.endsWith('"')) {
    searchQuery = `"${searchQuery}"`;
  }
  
  if (searchType === 'title' && searchQuery) {
    searchQuery = `title:${searchQuery}`;
  } else if (searchType === 'content' && searchQuery) {
    searchQuery = `content:${searchQuery}`;
  }
  
  return searchQuery;
};


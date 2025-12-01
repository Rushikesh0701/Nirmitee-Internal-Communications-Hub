/**
 * Helper functions for NewsData.io API integration
 */

/**
 * Maps frontend categories to NewsData.io category values
 */
const mapCategoryToNewsData = (category) => {
  const categoryMap = {
    technology: 'technology',
    ai: 'technology',
    software: 'technology',
    cybersecurity: 'technology',
    gadgets: 'technology',
    startups: 'business',
    business: 'business',
    science: 'science',
    HealthcareIT: 'technology' // HealthcareIT maps to technology for NewsData.io
  };
  return categoryMap[category] || category;
};

/**
 * Maps sort values to NewsData.io format
 */
const mapSortToNewsData = (sort) => {
  const sortMap = {
    relevance: 'relevancy',
    date: 'date',
    popularity: 'popularity'
  };
  return sortMap[sort] || sort;
};

/**
 * Validates date format (YYYY-MM-DD)
 */
const isValidDateFormat = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date);
};

/**
 * Transforms NewsData.io articles to consistent format
 */
const transformNewsDataArticles = (articles, category) => {
  return articles.map((article, index) => ({
    article_id: article.article_id || `newsdata-${Date.now()}-${index}`,
    title: article.title || 'Untitled',
    description: article.description || article.content || '',
    link: article.link || article.url || '',
    image_url: article.image_url || article.image || null,
    pubDate: article.pubDate || article.publishedAt || new Date().toISOString(),
    source_id: article.source_id || 'newsdata',
    source_name: article.source_name || 'NewsData.io',
    category: article.category?.[0] || category || 'technology',
    creator: article.creator || [],
    content: article.content || article.description || ''
  }));
};

/**
 * Filters articles by source name (client-side filtering)
 */
const filterArticlesBySource = (articles, source) => {
  if (!source || articles.length === 0) return articles;
  return articles.filter(article =>
    article.source_name && article.source_name.toLowerCase().includes(source.toLowerCase())
  );
};

/**
 * Sorts articles by date (newest first)
 */
const sortArticlesByDate = (articles) => {
  return articles.sort((a, b) => {
    try {
      const dateA = new Date(a.pubDate || 0);
      const dateB = new Date(b.pubDate || 0);
      return dateB - dateA;
    } catch (e) {
      return 0;
    }
  });
};

/**
 * Determines if a request should use NewsData.io API
 */
const isNewsDataRequest = (query) => {
  const { q, category } = query;
  const newsDataCategories = [
    'technology', 'ai', 'software', 'cybersecurity',
    'gadgets', 'startups', 'business', 'science', 'HealthcareIT'
  ];
  return !!(q || (category && newsDataCategories.includes(category)));
};

/**
 * Gets user-friendly error message from NewsData.io error
 */
const getNewsDataErrorMessage = (error) => {
  const errorMsg = error.message || '';
  
  if (errorMsg.includes('API key') || errorMsg.includes('not configured')) {
    return 'NewsData.io API key not configured. Showing sample data. Please add NEWSDATA_API_KEY to your .env file to enable live news.';
  }
  if (errorMsg.includes('Invalid')) {
    return 'Invalid NewsData.io API key. Showing sample data. Please check your NEWSDATA_API_KEY in .env file and ensure it\'s a valid key from https://newsdata.io/';
  }
  if (errorMsg.includes('rate limit')) {
    return 'NewsData.io API rate limit exceeded. Showing sample data. Please try again later.';
  }
  if (errorMsg.includes('Unable to connect') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('timeout')) {
    return 'Unable to connect to NewsData.io API. Showing sample data. Please check your internet connection.';
  }
  if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
    return 'Invalid NewsData.io API key (401 Unauthorized). Please verify your API key is correct in the .env file.';
  }
  return `NewsData.io API error: ${errorMsg}. Showing sample data. Check backend logs for details.`;
};

module.exports = {
  mapCategoryToNewsData,
  mapSortToNewsData,
  isValidDateFormat,
  transformNewsDataArticles,
  filterArticlesBySource,
  sortArticlesByDate,
  isNewsDataRequest,
  getNewsDataErrorMessage
};


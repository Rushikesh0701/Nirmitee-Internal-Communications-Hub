/**
 * Maps frontend categories to NewsData.io category values
 * Database categories: AI, Cloud, DevOps, Programming, Cybersecurity, HealthcareIT
 */
const mapCategoryToNewsData = (category) => {
  const categoryMap = {
    AI: 'technology',
    Cloud: 'technology',
    DevOps: 'technology',
    Programming: 'technology',
    Cybersecurity: 'technology',
    HealthcareIT: 'health'
  };
  return categoryMap[category] || 'technology';
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
    id: article.article_id || `newsdata-${Date.now()}-${index}`,
    title: article.title || 'Untitled',
    description: article.description || article.content || '',
    link: article.link || article.url || '',
    url: article.link || article.url || '',
    image_url: article.image_url || article.image || null,
    image: article.image_url || article.image || null,
    pubDate: article.pubDate || article.publishedAt || new Date().toISOString(),
    publishedAt: article.pubDate || article.publishedAt || new Date().toISOString(),
    source_id: article.source_id || 'newsdata',
    source_name: article.source_name || 'NewsData.io',
    source: article.source_name || 'NewsData.io',
    category: article.category?.[0] || category || 'technology',
    creator: article.creator || [],
    content: article.content || article.description || ''
  }));
};

/**
 * Transform RSS article to unified format
 */
const transformRSSArticle = (item, feedUrl, category = 'HealthcareIT') => {
  // Extract source name from feed URL
  let sourceName = 'RSS Feed';
  try {
    const url = new URL(feedUrl);
    sourceName = url.hostname.replace('www.', '').split('.')[0];
    sourceName = sourceName.charAt(0).toUpperCase() + sourceName.slice(1);
  } catch (e) {
    // Keep default
  }

  const articleId = item.guid || item.link || `rss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const pubDate = item.pubDate || item.isoDate || new Date().toISOString();

  return {
    article_id: articleId,
    id: articleId,
    title: item.title || 'Untitled',
    description: item.contentSnippet || item.content || item.summary || '',
    link: item.link || '',
    url: item.link || '',
    image_url: item.enclosure?.url || extractImageFromContent(item.content) || null,
    image: item.enclosure?.url || extractImageFromContent(item.content) || null,
    pubDate: pubDate,
    publishedAt: pubDate,
    source_id: 'rss',
    source_name: sourceName,
    source: sourceName,
    category: category,
    creator: item.creator ? [item.creator] : (item.author ? [item.author] : []),
    content: item.content || item.contentSnippet || item.summary || '',
    feedUrl: feedUrl
  };
};

/**
 * Extract image URL from HTML content
 */
const extractImageFromContent = (content) => {
  if (!content) return null;
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : null;
};

/**
 * Deduplicate articles by title or URL
 */
const deduplicateArticles = (articles) => {
  const seen = new Map();
  const deduplicated = [];

  for (const article of articles) {
    // Create keys for deduplication
    const titleKey = (article.title || '').toLowerCase().trim();
    const urlKey = (article.link || article.url || '').toLowerCase().trim();

    // Skip if we've seen this title or URL
    if (titleKey && seen.has(`title:${titleKey}`)) continue;
    if (urlKey && seen.has(`url:${urlKey}`)) continue;

    // Mark as seen
    if (titleKey) seen.set(`title:${titleKey}`, true);
    if (urlKey) seen.set(`url:${urlKey}`, true);

    deduplicated.push(article);
  }

  return deduplicated;
};

/**
 * Apply filters to articles
 */
const applyFilters = (articles, filters) => {
  const { q, category, source, from, to } = filters;
  let filtered = [...articles];

  // Filter by search query
  if (q && q.trim()) {
    const searchTerm = q.toLowerCase().trim();
    filtered = filtered.filter(article => {
      const title = (article.title || '').toLowerCase();
      const description = (article.description || '').toLowerCase();
      const content = (article.content || '').toLowerCase();
      return title.includes(searchTerm) || description.includes(searchTerm) || content.includes(searchTerm);
    });
  }

  // Filter by category
  if (category && category.trim()) {
    const cat = category.toLowerCase().trim();
    filtered = filtered.filter(article => {
      const articleCategory = (article.category || '').toLowerCase();
      return articleCategory.includes(cat) || cat.includes(articleCategory);
    });
  }

  // Filter by source
  if (source && source.trim()) {
    const src = source.toLowerCase().trim();
    filtered = filtered.filter(article => {
      const sourceName = (article.source_name || article.source || '').toLowerCase();
      return sourceName.includes(src);
    });
  }

  // Filter by date range
  if (from && isValidDateFormat(from)) {
    const fromDate = new Date(from);
    filtered = filtered.filter(article => {
      const articleDate = new Date(article.pubDate || article.publishedAt);
      return articleDate >= fromDate;
    });
  }

  if (to && isValidDateFormat(to)) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999); // End of day
    filtered = filtered.filter(article => {
      const articleDate = new Date(article.pubDate || article.publishedAt);
      return articleDate <= toDate;
    });
  }

  return filtered;
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
  return [...articles].sort((a, b) => {
    try {
      const dateA = new Date(a.pubDate || a.publishedAt || 0);
      const dateB = new Date(b.pubDate || b.publishedAt || 0);
      return dateB - dateA;
    } catch (e) {
      return 0;
    }
  });
};

/**
 * Sorts articles by relevance (search query match quality)
 * Prioritizes title matches over description/content matches
 */
const sortArticlesByRelevance = (articles, searchQuery) => {
  if (!searchQuery || !searchQuery.trim()) {
    // No search query - fall back to date sorting
    return sortArticlesByDate(articles);
  }

  const query = searchQuery.toLowerCase().trim();

  return [...articles].sort((a, b) => {
    // Calculate relevance score for each article
    const scoreA = calculateRelevanceScore(a, query);
    const scoreB = calculateRelevanceScore(b, query);

    // Higher score = more relevant = should come first
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // Tie-breaker: sort by date (newest first)
    const dateA = new Date(a.pubDate || a.publishedAt || 0);
    const dateB = new Date(b.pubDate || b.publishedAt || 0);
    return dateB - dateA;
  });
};

/**
 * Calculate relevance score for an article based on search query
 */
const calculateRelevanceScore = (article, query) => {
  let score = 0;
  const title = (article.title || '').toLowerCase();
  const description = (article.description || '').toLowerCase();
  const content = (article.content || '').toLowerCase();

  // Title exact match = highest score
  if (title === query) score += 100;
  // Title starts with query
  else if (title.startsWith(query)) score += 80;
  // Title contains query
  else if (title.includes(query)) score += 60;

  // Description contains query
  if (description.includes(query)) score += 30;

  // Content contains query
  if (content.includes(query)) score += 10;

  // Count occurrences of query words
  const queryWords = query.split(/\s+/);
  queryWords.forEach(word => {
    if (word.length > 2) {
      if (title.includes(word)) score += 5;
      if (description.includes(word)) score += 2;
    }
  });

  return score;
};

/**
 * Sorts articles by popularity (approximated)
 * Since we don't have actual view/share counts, we use article freshness + source reliability as proxies
 */
const sortArticlesByPopularity = (articles) => {
  return [...articles].sort((a, b) => {
    // Calculate popularity score
    const scoreA = calculatePopularityScore(a);
    const scoreB = calculatePopularityScore(b);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // Tie-breaker: sort by date
    const dateA = new Date(a.pubDate || a.publishedAt || 0);
    const dateB = new Date(b.pubDate || b.publishedAt || 0);
    return dateB - dateA;
  });
};

/**
 * Calculate popularity score for an article
 */
const calculatePopularityScore = (article) => {
  let score = 0;

  // Has image = more engaging = higher score
  if (article.image_url || article.image) score += 20;

  // Longer content = more detailed = potentially more popular
  const contentLength = (article.content || article.description || '').length;
  score += Math.min(contentLength / 100, 30); // Max 30 points for content

  // Recency bonus (newer articles tend to be more popular)
  const articleDate = new Date(article.pubDate || article.publishedAt || 0);
  const now = new Date();
  const hoursAgo = (now - articleDate) / (1000 * 60 * 60);
  if (hoursAgo < 24) score += 20; // Last 24 hours
  else if (hoursAgo < 72) score += 10; // Last 3 days
  else if (hoursAgo < 168) score += 5; // Last week

  // Prefer known sources
  const source = (article.source_name || article.source || '').toLowerCase();
  const knownSources = ['newsdata', 'healthcareitnews', 'healthtechmagazine', 'healthitoutcomes'];
  if (knownSources.some(s => source.includes(s))) score += 10;

  return score;
};

/**
 * Master sort function that handles all sort types
 */
const sortArticles = (articles, sortBy, searchQuery = '') => {
  if (!articles || articles.length === 0) return articles;

  switch (sortBy) {
    case 'date':
      return sortArticlesByDate(articles);
    case 'relevance':
      return sortArticlesByRelevance(articles, searchQuery);
    case 'popularity':
      return sortArticlesByPopularity(articles);
    default:
      return sortArticlesByDate(articles); // Default to date
  }
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
  transformRSSArticle,
  extractImageFromContent,
  deduplicateArticles,
  applyFilters,
  filterArticlesBySource,
  sortArticlesByDate,
  sortArticles,
  getNewsDataErrorMessage
};

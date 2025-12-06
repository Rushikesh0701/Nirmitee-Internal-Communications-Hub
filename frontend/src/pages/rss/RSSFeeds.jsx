import { useState } from 'react'
import { useQuery } from 'react-query'
import api from '../../services/api'
import { Rss, ExternalLink, Settings, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import RSSSubscriptionManager from '../../components/RSSSubscriptionManager'

const RSSFeeds = () => {
  const [showSubscriptions, setShowSubscriptions] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState({})

  // Fetch articles grouped by category
  const { data: articlesGrouped, isLoading } = useQuery(
    'rss-articles-grouped',
    () => api.get('/rss/articles/grouped').then((res) => res.data.data),
    {
      refetchInterval: 300000, // Refetch every 5 minutes
    }
  )

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const categories = articlesGrouped ? Object.keys(articlesGrouped) : []
  const hasArticles = categories.length > 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">Loading RSS articles...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">RSS Tech News</h1>
          <p className="text-gray-600 mt-1">
            Stay updated with the latest tech news from your subscribed categories
          </p>
        </div>
        <button
          onClick={() => setShowSubscriptions(!showSubscriptions)}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Settings size={18} />
          Manage Subscriptions
        </button>
      </div>

      {/* Subscription Manager */}
      {showSubscriptions && (
        <div className="mb-6">
          <RSSSubscriptionManager />
        </div>
      )}

      {/* Articles Grouped by Category */}
      {hasArticles ? (
        <div className="space-y-6">
          {categories.map((category) => {
            const articles = articlesGrouped[category] || []
            const isExpanded = expandedCategories[category] !== false // Default to expanded
            const displayArticles = isExpanded ? articles : articles.slice(0, 5)

            return (
              <div key={category} className="card">
                {/* Category Header */}
                <div
                  className="flex items-center justify-between cursor-pointer mb-4"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Rss className="text-primary-600" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{category}</h2>
                      <p className="text-sm text-gray-600">
                        {articles.length} article{articles.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    {isExpanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                </div>

                {/* Articles List */}
                <div className="space-y-4">
                  {displayArticles.length > 0 ? (
                    displayArticles.map((article) => (
                      <div
                        key={article._id || article.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              <a
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary-600 transition-colors"
                              >
                                {article.title}
                              </a>
                            </h3>
                            {article.description && (
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {article.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                {formatDate(article.publishedAt)}
                              </div>
                              {article.feedId?.feedUrl && (
                                <span className="text-gray-400">
                                  {new URL(article.feedId.feedUrl).hostname}
                                </span>
                              )}
                            </div>
                          </div>
                          <a
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 flex-shrink-0"
                          >
                            <ExternalLink size={20} />
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No articles available in this category
                    </div>
                  )}
                </div>

                {/* Show More/Less */}
                {articles.length > 5 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      {isExpanded
                        ? `Show Less (${articles.length - 5} more hidden)`
                        : `Show All ${articles.length} Articles`}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-12">
            <Rss className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Articles Available
            </h3>
            <p className="text-gray-600 mb-6">
              {showSubscriptions
                ? 'Articles will appear here once you subscribe to categories and feeds are fetched.'
                : 'Please manage your subscriptions to see articles from your preferred categories.'}
            </p>
            {!showSubscriptions && (
              <button
                onClick={() => setShowSubscriptions(true)}
                className="btn btn-primary"
              >
                Manage Subscriptions
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default RSSFeeds

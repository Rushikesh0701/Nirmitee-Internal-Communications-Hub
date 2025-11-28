import { useState, useEffect } from 'react'
import { useInfiniteQuery } from 'react-query'
import api from '../../services/api'
import AnnouncementCard from '../../components/feed/AnnouncementCard'
import BlogCard from '../../components/feed/BlogCard'
import RecognitionCard from '../../components/feed/RecognitionCard'
import GroupPostCard from '../../components/feed/GroupPostCard'
import Loading from '../../components/Loading'
import { Filter } from 'lucide-react'

const Feed = () => {
  const [filter, setFilter] = useState('all') // 'all', 'announcement', 'blog', 'recognition', 'groupPost'

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery(
    ['feed', filter],
    ({ pageParam = 1 }) =>
      api
        .get(`/feed?page=${pageParam}&limit=20&type=${filter}`)
        .then((res) => res.data.data),
    {
      getNextPageParam: (lastPage) => {
        if (lastPage.pagination.hasMore) {
          return lastPage.pagination.page + 1
        }
        return undefined
      },
      refetchOnWindowFocus: false
    }
  )

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Refetch when filter changes
  useEffect(() => {
    refetch()
  }, [filter, refetch])

  const feedItems = data?.pages?.flatMap((page) => page.feed) || []

  const renderFeedItem = (item) => {
    switch (item.type) {
      case 'announcement':
        return <AnnouncementCard key={item.id} item={item} />
      case 'blog':
        return <BlogCard key={item.id} item={item} />
      case 'recognition':
        return <RecognitionCard key={item.id} item={item} />
      case 'groupPost':
        return <GroupPostCard key={item.id} item={item} />
      default:
        return null
    }
  }

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Global Feed</h1>
          <p className="text-gray-600 mt-1">All updates in one place</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <Filter size={18} className="text-gray-500" />
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('announcement')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'announcement'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Announcements
        </button>
        <button
          onClick={() => setFilter('blog')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'blog'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Blogs
        </button>
        <button
          onClick={() => setFilter('recognition')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'recognition'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Recognitions
        </button>
        <button
          onClick={() => setFilter('groupPost')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'groupPost'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Discussions
        </button>
      </div>

      {/* Feed Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {feedItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500 col-span-full">
            No items in feed yet
          </div>
        ) : (
          feedItems.map(renderFeedItem)
        )}

        {/* Loading indicator for infinite scroll */}
        {isFetchingNextPage && (
          <div className="text-center py-8 col-span-full">
            <Loading />
          </div>
        )}
      </div>

      {/* End of feed message */}
      {!hasNextPage && feedItems.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          You've reached the end of the feed
        </div>
      )}
    </div>
  )
}

export default Feed


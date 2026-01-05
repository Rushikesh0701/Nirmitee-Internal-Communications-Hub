import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import { blogAPI } from '../../services/blogApi';
import { discussionAPI } from '../../services/discussionApi';
import { 
  Search, 
  BookOpen, 
  MessageSquare,
  Users,
  FileText,
  Filter,
  X
} from 'lucide-react';
import { DetailSkeleton } from '../../components/skeletons';
import EmptyState from '../../components/EmptyState';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme } = useTheme();
  const query = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(query);
  const [selectedTypes, setSelectedTypes] = useState(['blogs', 'discussions', 'groups', 'users']);
  const [activeFilter, setActiveFilter] = useState('all');

  // Fetch search results
  const { data: results, isLoading } = useQuery(
    ['search', query, activeFilter],
    async () => {
      if (!query) return { blogs: [], discussions: [], groups: [], users: [] };

      const searchPromises = [];

      if (selectedTypes.includes('blogs')) {
        searchPromises.push(
          blogAPI.getAll({ search: query, limit: 20 })
            .then(res => ({ type: 'blogs', data: res.data?.data || res.data || [] }))
            .catch(() => ({ type: 'blogs', data: [] }))
        );
      }

      if (selectedTypes.includes('discussions')) {
        searchPromises.push(
          discussionAPI.getAll({ search: query, limit: 20 })
            .then(res => ({ type: 'discussions', data: res.data?.data || res.data || [] }))
            .catch(() => ({ type: 'discussions', data: [] }))
        );
      }

      if (selectedTypes.includes('groups')) {
        searchPromises.push(
          api.get('/groups', { params: { search: query, limit: 20 } })
            .then(res => ({ type: 'groups', data: res.data?.data || res.data || [] }))
            .catch(() => ({ type: 'groups', data: [] }))
        );
      }

      if (selectedTypes.includes('users')) {
        searchPromises.push(
          api.get('/users', { params: { search: query, limit: 20 } })
            .then(res => ({ type: 'users', data: res.data?.data || res.data || [] }))
            .catch(() => ({ type: 'users', data: [] }))
        );
      }

      const results = await Promise.all(searchPromises);
      return {
        blogs: results.find(r => r.type === 'blogs')?.data || [],
        discussions: results.find(r => r.type === 'discussions')?.data || [],
        groups: results.find(r => r.type === 'groups')?.data || [],
        users: results.find(r => r.type === 'users')?.data || []
      };
    },
    { enabled: !!query }
  );

  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() });
    }
  };

  const toggleType = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getFilteredResults = () => {
    if (!results) return [];
    if (activeFilter === 'all') {
      return [
        ...results.blogs.map(item => ({ ...item, _type: 'blog' })),
        ...results.discussions.map(item => ({ ...item, _type: 'discussion' })),
        ...results.groups.map(item => ({ ...item, _type: 'group' })),
        ...results.users.map(item => ({ ...item, _type: 'user' }))
      ];
    }
    return results[activeFilter]?.map(item => ({ ...item, _type: activeFilter.slice(0, -1) })) || [];
  };

  const filteredResults = getFilteredResults();
  const totalResults = (results?.blogs?.length || 0) + 
                      (results?.discussions?.length || 0) + 
                      (results?.groups?.length || 0) + 
                      (results?.users?.length || 0);

  const getResultIcon = (type) => {
    const icons = {
      blog: BookOpen,
      discussion: MessageSquare,
      group: Users,
      user: Users
    };
    return icons[type] || FileText;
  };

  const getResultLink = (item, type) => {
    const id = item._id || item.id;
    const links = {
      blog: `/blogs/${id}`,
      discussion: `/discussions/${id}`,
      group: `/groups/${id}`,
      user: `/profile/${id}`
    };
    return links[type] || '#';
  };

  return (
    <motion.div 
      className="max-w-6xl mx-auto px-4 py-8 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div>
        <h1 className="text-h1 text-slate-800 dark:text-slate-200">
          Search
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Search across all content types
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="card">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search blogs, discussions, groups, users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </div>

        {/* Type Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-caption text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Filter size={16} />
            Filter by type:
          </span>
          {['blogs', 'discussions', 'groups', 'users'].map(type => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedTypes.includes(type)
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </form>

      {/* Results Count */}
      {query && (
        <div className="flex items-center justify-between">
          <p className="text-slate-600 dark:text-slate-400">
            {isLoading ? 'Searching...' : `Found ${totalResults} result${totalResults !== 1 ? 's' : ''}`}
          </p>
          {query && (
            <div className="flex gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded text-sm ${
                  activeFilter === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                All
              </button>
              {['blogs', 'discussions', 'groups', 'users'].map(type => {
                const count = results?.[type]?.length || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(type)}
                    className={`px-3 py-1 rounded text-sm ${
                      activeFilter === type 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <DetailSkeleton />
      ) : query && filteredResults.length > 0 ? (
        <div className="space-y-4">
          {filteredResults.map((item) => {
            const Icon = getResultIcon(item._type);
            const link = getResultLink(item, item._type);
            return (
              <Link
                key={item._id || item.id}
                to={link}
                className="card hover:shadow-lg transition-shadow block"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500 rounded-lg text-white">
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-h3 text-slate-800 dark:text-slate-200">
                        {item.title || item.name || `${item.firstName} ${item.lastName}`}
                      </h3>
                      <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-overline text-slate-600 dark:text-slate-400">
                        {item._type}
                      </span>
                    </div>
                    {item.content && (
                      <p className="text-caption text-slate-600 dark:text-slate-400 line-clamp-2">
                        {item.content.replace(/<[^>]*>/g, '').substring(0, 200)}
                      </p>
                    )}
                    {item.description && (
                      <p className="text-caption text-slate-600 dark:text-slate-400 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-overline text-slate-500">
                      {item.createdAt && (
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      )}
                      {item.views !== undefined && (
                        <span>{item.views} views</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : query ? (
        <EmptyState
          icon={Search}
          title="No results found"
          message={`No results found for "${query}". Try different keywords or adjust your filters.`}
          compact
        />
      ) : (
        <EmptyState
          icon={Search}
          title="Start searching"
          message="Enter a search term to find blogs, discussions, groups, and users"
          compact
        />
      )}
    </motion.div>
  );
};

export default SearchResults;


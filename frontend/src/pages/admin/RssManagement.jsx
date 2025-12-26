import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Save, X, ToggleLeft, ToggleRight, Link as LinkIcon, Tag, Globe, MoreVertical } from 'lucide-react'
import Loading from '../../components/Loading'
import Pagination from '../../components/Pagination'
import { useTheme } from '../../contexts/ThemeContext'

const RssManagement = () => {
  const queryClient = useQueryClient()
  const { theme } = useTheme()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    category: '',
    isActive: true
  })

  // State for mobile menu/actions
  const [activeMenuId, setActiveMenuId] = useState(null);

  const techCategories = [
    { value: 'AI', label: 'AI & Machine Learning' },
    { value: 'Cloud', label: 'Cloud Computing' },
    { value: 'DevOps', label: 'DevOps' },
    { value: 'Programming', label: 'Programming' },
    { value: 'Cybersecurity', label: 'Cybersecurity' },
    { value: 'HealthcareIT', label: 'Healthcare IT' },
    { value: 'Technology', label: 'General Tech' }
  ];

  const { data, isLoading, error } = useQuery(
    ['adminRssSources', page, limit],
    async () => {
      try {
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('limit', limit.toString())
        const response = await api.get(`/admin/rss?${params.toString()}`)
        
        // Debug: Log the response structure
        console.log('RSS API Response:', response.data)
        
        // Handle different response structures
        const responseData = response.data?.data || response.data
        
        // If data is an array, backend returned all items - need frontend pagination
        if (Array.isArray(responseData)) {
          console.log('Response data is an array, applying frontend pagination. Count:', responseData.length)
          const currentLimit = limit || 15
          const startIndex = (page - 1) * currentLimit
          const endIndex = startIndex + currentLimit
          const paginatedSources = responseData.slice(startIndex, endIndex)
          
          return {
            sources: paginatedSources,
            pagination: {
              page: page,
              limit: currentLimit,
              total: responseData.length,
              pages: Math.ceil(responseData.length / currentLimit)
            }
          }
        }
        
        // If data has sources and pagination, check if backend paginated correctly
        if (responseData?.sources && responseData?.pagination) {
          console.log('Response data has sources and pagination. Sources count:', responseData.sources.length, 'Limit:', responseData.pagination.limit)
          // If backend returned more items than the limit, it didn't paginate - do frontend pagination
          const expectedLimit = limit || 15
          if (responseData.sources.length > expectedLimit) {
            console.log('Backend returned more items than limit, applying frontend pagination')
            const startIndex = (page - 1) * expectedLimit
            const endIndex = startIndex + expectedLimit
            return {
              sources: responseData.sources.slice(startIndex, endIndex),
              pagination: responseData.pagination
            }
          }
          return responseData
        }
        
        // Fallback: treat data as sources array
        console.log('Using fallback structure')
        const currentLimit = limit || 15
        return {
          sources: Array.isArray(responseData) ? responseData : [],
          pagination: responseData?.pagination || {
            page: page,
            limit: currentLimit,
            total: Array.isArray(responseData) ? responseData.length : 0,
            pages: Math.ceil((Array.isArray(responseData) ? responseData.length : 0) / currentLimit) || 1
          }
        }
      } catch (err) {
        console.error('Error fetching RSS sources:', err)
        console.error('Error response:', err.response?.data)
        toast.error(err.response?.data?.message || 'Failed to fetch RSS sources')
        throw err
      }
    },
    { 
      keepPreviousData: true,
      retry: 1,
      onError: (err) => {
        console.error('RSS sources query error:', err)
      }
    }
  )

  const createMutation = useMutation(
    (data) => api.post('/admin/rss', data),
    {
      onSuccess: () => {
        toast.success('RSS Source added successfully')
        queryClient.invalidateQueries(['adminRssSources', page, limit])
        setIsCreating(false)
        resetForm()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add RSS source')
      }
    }
  )

  const updateMutation = useMutation(
    ({ id, data }) => api.put(`/admin/rss/${id}`, data),
    {
      onSuccess: () => {
        toast.success('RSS Source updated successfully')
        queryClient.invalidateQueries(['adminRssSources', page, limit])
        setEditingId(null)
        resetForm()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update RSS source')
      }
    }
  )

  const toggleMutation = useMutation(
    (id) => api.patch(`/admin/rss/${id}/toggle`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminRssSources', page, limit])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to toggle source')
      }
    }
  )

  const deleteMutation = useMutation(
    (id) => api.delete(`/admin/rss/${id}`),
    {
      onSuccess: () => {
        toast.success('RSS Source deleted successfully')
        queryClient.invalidateQueries(['adminRssSources', page, limit])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete RSS source')
      }
    }
  )

  const resetForm = () => {
    setFormData({ name: '', url: '', category: '', isActive: true })
  }

  const handleCreate = () => {
    if (!formData.name || !formData.url || !formData.category) {
      toast.error('All fields are required')
      return
    }
    createMutation.mutate(formData)
  }

  const handleUpdate = (id) => {
    if (!formData.name || !formData.url || !formData.category) {
      toast.error('All fields are required')
      return
    }
    updateMutation.mutate({ id, data: formData })
  }

  const handleEdit = (source) => {
    setEditingId(source._id)
    setFormData({
      name: source.name,
      url: source.url,
      category: source.category,
      isActive: source.isActive
    })
    setActiveMenuId(null);
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    resetForm()
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this RSS source?')) {
      deleteMutation.mutate(id)
    }
    setActiveMenuId(null);
  }

  if (isLoading) {
    return <Loading fullScreen />
  }

  // Handle error state
  if (error) {
    return (
      <div className="space-y-6 pb-20 md:pb-6">
        <div className={`p-6 rounded-2xl border transition-colors ${
          theme === 'dark' 
            ? 'bg-[#052829] border-[#0a3a3c]' 
            : 'bg-white border-slate-200'
        }`}>
          <h2 className={`text-xl font-bold mb-2 transition-colors ${
            theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
          }`}>
            Error Loading RSS Sources
          </h2>
          <p className={`text-sm transition-colors ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {error.response?.data?.message || error.message || 'Failed to load RSS sources. Please try again.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Extract sources and pagination (pagination is handled in the query)
  const sources = Array.isArray(data?.sources) 
    ? data.sources 
    : Array.isArray(data) 
      ? data 
      : []
  
  const pagination = data?.pagination || {
    page: page,
    limit: limit || 15,
    total: sources.length,
    pages: Math.ceil(sources.length / (limit || 15)) || 1
  }
  
  // Safety check: ensure we never show more than the limit per page
  const currentLimit = pagination.limit || limit || 15
  const displayedSources = sources.length > currentLimit 
    ? sources.slice(0, currentLimit) 
    : sources

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold transition-colors ${
            theme === 'dark' ? 'text-slate-100' : 'text-gray-900'
          }`}>RSS Sources</h1>
          <p className={`mt-1 text-sm md:text-base transition-colors ${
            theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
          }`}>Manage external news feeds</p>
        </div>
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="btn-add"
          >
            <Plus size={16} />
            Add RSS Source
          </button>
        )}
      </div>

      {isCreating && (
        <div className={`p-5 md:p-6 rounded-2xl border animate-in fade-in slide-in-from-top-4 duration-300 transition-colors ${
          theme === 'dark' 
            ? 'bg-[#052829] border-[#0a3a3c]' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-bold transition-colors ${
              theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
            }`}>New RSS Source</h2>
            <button onClick={handleCancel} className={`transition-colors ${
              theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'
            }`}>
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div className="space-y-1.5">
              <label className={`text-sm font-semibold ml-1 transition-colors ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Source Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Tag className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                  theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                }`} size={18} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${
                    theme === 'dark'
                      ? 'bg-[#052829] border-[#ff4701] text-slate-200 placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                  placeholder="e.g., TechCrunch Tech"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={`text-sm font-semibold ml-1 transition-colors ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm appearance-none cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#052829] border-[#ff4701] text-slate-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="">Select Category</option>
                {techCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className={`text-sm font-semibold ml-1 transition-colors ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                RSS Feed URL <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <LinkIcon className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                  theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                }`} size={18} />
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${
                    theme === 'dark'
                      ? 'bg-[#052829] border-[#ff4701] text-slate-200 placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                  placeholder="https://example.com/feed"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              onClick={handleCreate}
              disabled={createMutation.isLoading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 sm:flex-1 md:flex-none"
            >
              <Save size={18} />
              {createMutation.isLoading ? 'Adding...' : 'Add Source'}
            </button>
            <button 
              onClick={handleCancel} 
              className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all sm:flex-1 md:flex-none text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Desktop view: Table */}
      <div className={`hidden md:block rounded-2xl border overflow-hidden transition-colors ${
        theme === 'dark' 
          ? 'bg-[#052829] border-[#0a3a3c]' 
          : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b transition-colors ${
                theme === 'dark' 
                  ? 'bg-[#052829]/50 border-[#ff4701]' 
                  : 'bg-slate-50/50 border-slate-200'
              }`}>
                <th className={`px-3 py-2 text-xs font-bold uppercase tracking-wider text-center transition-colors ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>#</th>
                <th className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>Source</th>
                <th className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>Category</th>
                <th className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>URL</th>
                <th className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>Status</th>
                <th className={`px-4 py-2 text-xs font-bold uppercase tracking-wider text-right transition-colors ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y transition-colors ${
              theme === 'dark' ? 'divide-slate-700' : 'divide-slate-100'
            }`}>
              {sources.map((source, index) => {
                const serialNo = (page - 1) * limit + index + 1
                return (
                <tr key={source._id} className={`group transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-[#052829]/50' 
                    : 'hover:bg-slate-50/50'
                }`}>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-xs font-semibold transition-colors ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {serialNo}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {editingId === source._id ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${
                          theme === 'dark'
                            ? 'bg-[#052829] border-[#ff4701] text-slate-200'
                            : 'bg-white border-slate-200'
                        }`}
                      />
                    ) : (
                      <span className={`text-sm font-medium transition-colors ${
                        theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                      }`}>{source.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingId === source._id ? (
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className={`w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${
                          theme === 'dark'
                            ? 'bg-[#052829] border-[#ff4701] text-slate-200'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        {techCategories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full transition-colors ${
                        theme === 'dark'
                          ? 'bg-indigo-900/50 text-indigo-300'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {source.category}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 max-w-xs">
                    {editingId === source._id ? (
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className={`w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${
                          theme === 'dark'
                            ? 'bg-[#052829] border-[#ff4701] text-slate-200'
                            : 'bg-white border-slate-200'
                        }`}
                      />
                    ) : (
                      <span className={`text-xs truncate block transition-colors ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`} title={source.url}>
                        {source.url}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => toggleMutation.mutate(source._id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        source.isActive 
                          ? 'text-emerald-600' 
                          : theme === 'dark' 
                            ? 'text-slate-500' 
                            : 'text-slate-400'
                      }`}
                    >
                      {source.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      <span className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                        theme === 'dark' && !source.isActive ? 'text-slate-500' : ''
                      }`}>
                        {source.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      {editingId === source._id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(source._id)}
                            disabled={updateMutation.isLoading}
                            className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all active:scale-95"
                            title="Save"
                          >
                            <Save size={14} />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(source)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(source._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        {pagination.pages > 1 && (
          <div className={`border-t transition-colors ${
            theme === 'dark' ? 'border-[#0a3a3c]' : 'border-slate-200'
          }`}>
            <Pagination
              currentPage={page}
              totalPages={pagination.pages}
              onPageChange={setPage}
              limit={limit}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
              showLimitSelector={true}
            />
          </div>
        )}
      </div>

      {/* Mobile/Tablet view: Card Grid */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {displayedSources.map((source, index) => {
          const serialNo = (page - 1) * (limit || 15) + index + 1
          return (
          <div 
            key={source._id} 
            className={`p-4 rounded-2xl border transition-colors ${
              editingId === source._id 
                ? 'border-indigo-500 ring-1 ring-indigo-500' 
                : theme === 'dark'
                  ? 'bg-[#052829] border-[#0a3a3c]'
                  : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0 pr-4">
                {editingId === source._id ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-400'
                      }`}>Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-colors ${
                          theme === 'dark'
                            ? 'bg-[#052829] border-[#ff4701] text-slate-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-400'
                      }`}>Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-colors ${
                          theme === 'dark'
                            ? 'bg-[#052829] border-[#ff4701] text-slate-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        {techCategories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-400'
                      }`}>RSS URL</label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-colors ${
                          theme === 'dark'
                            ? 'bg-[#052829] border-[#ff4701] text-slate-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleUpdate(source._id)}
                        disabled={updateMutation.isLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold"
                      >
                        <Save size={16} /> Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${
                          theme === 'dark'
                            ? 'bg-[#052829] text-slate-200 hover:bg-[#0a3a3c]'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <X size={16} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className={`font-bold text-lg leading-tight mb-1 transition-colors ${
                      theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                    }`}>{source.name}</h3>
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase mb-3 transition-colors ${
                      theme === 'dark'
                        ? 'bg-indigo-900/50 text-indigo-300'
                        : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {source.category}
                    </span>
                    <div className={`flex items-center gap-2 text-xs transition-colors ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-400'
                    }`}>
                      <Globe size={14} className="shrink-0" />
                      <span className="truncate">{source.url}</span>
                    </div>
                  </>
                )}
              </div>
              
              {!editingId && (
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenuId(activeMenuId === source._id ? null : source._id)}
                    className={`p-2 transition-colors ${
                      theme === 'dark'
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  {activeMenuId === source._id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setActiveMenuId(null)}
                      />
                      <div className={`absolute right-0 top-10 w-36 rounded-xl border py-1.5 z-20 animate-in fade-in zoom-in duration-200 origin-top-right transition-colors ${
                        theme === 'dark'
                          ? 'bg-[#052829] border-[#0a3a3c]'
                          : 'bg-white border-slate-100'
                      }`}>
                        <button
                          onClick={() => handleEdit(source)}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                            theme === 'dark'
                              ? 'text-slate-300 hover:bg-[#052829]'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Edit2 size={16} className="text-indigo-500" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            toggleMutation.mutate(source._id);
                            setActiveMenuId(null);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                            theme === 'dark'
                              ? 'text-slate-300 hover:bg-[#052829]'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {source.isActive ? (
                            <>
                              <ToggleRight size={16} className="text-emerald-500" />
                              Disable
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={16} className="text-slate-300" />
                              Enable
                            </>
                          )}
                        </button>
                        <hr className={`my-1.5 transition-colors ${
                          theme === 'dark' ? 'border-[#0a3a3c]' : 'border-slate-100'
                        }`} />
                        <button
                          onClick={() => handleDelete(source._id)}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                            theme === 'dark'
                              ? 'text-rose-400 hover:bg-[#052829]'
                              : 'text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {!editingId && (
              <div className={`flex items-center justify-between pt-4 border-t transition-colors ${
                theme === 'dark' ? 'border-[#0a3a3c]' : 'border-slate-50'
              }`}>
                <div className={`flex items-center gap-2 text-xs font-bold uppercase ${
                  source.isActive ? 'text-emerald-500' : theme === 'dark' ? 'text-slate-400' : 'text-slate-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${source.isActive ? 'bg-emerald-500' : theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'}`} />
                  {source.isActive ? 'Live' : 'Hidden'}
                </div>
                <button
                  onClick={() => toggleMutation.mutate(source._id)}
                  className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all active:scale-95 ${
                    source.isActive 
                      ? theme === 'dark'
                        ? 'border-emerald-700 bg-emerald-900/30 text-emerald-400'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : theme === 'dark'
                        ? 'border-[#0a3a3c] bg-[#052829] text-slate-300'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  {source.isActive ? 'Pause' : 'Resume'}
                </button>
              </div>
            )}
          </div>
        )})}
      </div>

      {sources.length === 0 && !isLoading && (
        <div className={`p-12 text-center rounded-2xl border transition-colors ${
          theme === 'dark'
            ? 'bg-[#052829] border-[#0a3a3c]'
            : 'bg-white border-slate-200'
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${
            theme === 'dark' ? 'bg-[#052829]' : 'bg-slate-50'
          }`}>
            <LinkIcon className={theme === 'dark' ? 'text-slate-500' : 'text-slate-300'} size={24} />
          </div>
          <h3 className={`text-lg font-bold transition-colors ${
            theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
          }`}>No RSS sources yet</h3>
          <p className={`max-w-xs mx-auto mt-1 transition-colors ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Start by adding your first RSS feed to aggregate news articles.
          </p>
        </div>
      )}
      
      {/* Mobile Pagination */}
      {sources.length > 0 && pagination.pages > 1 && (
        <div className="md:hidden">
          <Pagination
            currentPage={page}
            totalPages={pagination.pages}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            showLimitSelector={true}
          />
        </div>
      )}
    </div>
  )
}

export default RssManagement

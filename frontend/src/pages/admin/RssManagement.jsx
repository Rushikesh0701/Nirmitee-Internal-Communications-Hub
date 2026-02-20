import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Save, X, ToggleLeft, ToggleRight, Link as LinkIcon, Tag, Globe, MoreVertical, Rss, Settings } from 'lucide-react'
import { CardSkeleton } from '../../components/skeletons'
import Pagination from '../../components/Pagination'
import { useTheme } from '../../contexts/ThemeContext'
import EmptyState from '../../components/EmptyState'

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

  // Category management state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', value: '' });

  // Default categories (fallback if no categories in DB)
  const defaultCategories = [
    { value: 'AI', name: 'AI & Machine Learning' },
    { value: 'Cloud', name: 'Cloud Computing' },
    { value: 'DevOps', name: 'DevOps' },
    { value: 'Programming', name: 'Programming' },
    { value: 'Cybersecurity', name: 'Cybersecurity' },
    { value: 'HealthcareIT', name: 'Healthcare IT' },
    { value: 'Technology', name: 'General Tech' }
  ];

  // Fetch categories from API
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery(
    ['rssCategories'],
    async () => {
      const response = await api.get('/admin/rss-categories')
      return response.data?.data || []
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (err) => {
        console.error('Error fetching categories:', err)
      }
    }
  )

  // Use fetched categories or defaults
  const techCategories = (categoriesData && categoriesData.length > 0)
    ? categoriesData.map(cat => ({ value: cat.value, label: cat.name, _id: cat._id, isActive: cat.isActive }))
    : defaultCategories.map(cat => ({ value: cat.value, label: cat.name }));

  // Category mutations
  const createCategoryMutation = useMutation(
    (data) => api.post('/admin/rss-categories', data),
    {
      onSuccess: () => {
        toast.success('Category added successfully')
        queryClient.invalidateQueries(['rssCategories'])
        setIsCreatingCategory(false)
        setCategoryFormData({ name: '', value: '' })
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add category')
      }
    }
  )

  const updateCategoryMutation = useMutation(
    ({ id, data }) => api.put(`/admin/rss-categories/${id}`, data),
    {
      onSuccess: () => {
        toast.success('Category updated successfully')
        queryClient.invalidateQueries(['rssCategories'])
        queryClient.invalidateQueries(['adminRssSources'])
        setEditingCategoryId(null)
        setCategoryFormData({ name: '', value: '' })
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update category')
      }
    }
  )

  const deleteCategoryMutation = useMutation(
    (id) => api.delete(`/admin/rss-categories/${id}`),
    {
      onSuccess: () => {
        toast.success('Category deleted successfully')
        queryClient.invalidateQueries(['rssCategories'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete category')
      }
    }
  )

  const handleCreateCategory = () => {
    if (!categoryFormData.name || !categoryFormData.value) {
      toast.error('Name and value are required')
      return
    }
    createCategoryMutation.mutate(categoryFormData)
  }

  const handleUpdateCategory = (id) => {
    if (!categoryFormData.name || !categoryFormData.value) {
      toast.error('Name and value are required')
      return
    }
    updateCategoryMutation.mutate({ id, data: categoryFormData })
  }

  const handleEditCategory = (category) => {
    setEditingCategoryId(category._id)
    setCategoryFormData({ name: category.label || category.name, value: category.value })
  }

  const handleDeleteCategory = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id)
    }
  }

  const handleCancelCategoryEdit = () => {
    setIsCreatingCategory(false)
    setEditingCategoryId(null)
    setCategoryFormData({ name: '', value: '' })
  }

  const { data, isLoading, error } = useQuery(
    ['adminRssSources', page, limit],
    async () => {
      try {
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('limit', limit.toString())
        const response = await api.get(`/admin/rss?${params.toString()}`)
        
        
        // Handle different response structures
        const responseData = response.data?.data || response.data
        
        // If data is an array, backend returned all items - need frontend pagination
        if (Array.isArray(responseData)) {
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
          // If backend returned more items than the limit, it didn't paginate - do frontend pagination
          const expectedLimit = limit || 15
          if (responseData.sources.length > expectedLimit) {
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

  if (isLoading && !data) {
    return <CardSkeleton count={6} />
  }

  // Handle error state
  if (error) {
    return (
      <div className="space-y-6 pb-20 md:pb-6">
        <div className={`p-6 rounded-2xl border transition-colors ${
          theme === 'dark' 
            ? 'bg-[#0a0e17] border-[#151a28]' 
            : 'bg-white border-slate-200'
        }`}>
          <h2 className={`text-h1 mb-2 transition-colors ${
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
          <div className="flex gap-2">
            <button
              onClick={() => setShowCategoryModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Settings size={16} />
              Manage Categories
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="btn-add"
            >
              <Plus size={16} />
              Add RSS Source
            </button>
          </div>
        )}
      </div>

      {isCreating && (
        <div className={`p-5 md:p-6 rounded-2xl border animate-in fade-in slide-in-from-top-4 duration-300 transition-colors ${
          theme === 'dark' 
            ? 'bg-[#0a0e17] border-[#151a28]' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-h1 transition-colors ${
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
              <label className={`text-caption ml-1 transition-colors ${
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
                      ? 'bg-[#0a0e17] border-[#ff4701] text-slate-200 placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                  placeholder="e.g., TechCrunch Tech"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={`text-caption ml-1 transition-colors ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm appearance-none cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#0a0e17] border-[#ff4701] text-slate-200'
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
              <label className={`text-caption ml-1 transition-colors ${
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
                      ? 'bg-[#0a0e17] border-[#ff4701] text-slate-200 placeholder-slate-500'
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
              className="btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50 sm:flex-1 md:flex-none"
            >
              <Save size={18} />
              {createMutation.isLoading ? 'Adding...' : 'Add Source'}
            </button>
            <button 
              onClick={handleCancel} 
              className="btn btn-secondary sm:flex-1 md:flex-none text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Desktop view: Table */}
      <div className={`hidden md:block rounded-2xl border overflow-hidden transition-colors ${
        theme === 'dark' 
          ? 'bg-[#0a0e17] border-[#151a28]' 
          : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b transition-colors ${
                theme === 'dark' 
                  ? 'bg-[#0a0e17]/50 border-[#ff4701]' 
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
                    ? 'hover:bg-[#0a0e17]/50' 
                    : 'hover:bg-slate-50/50'
                }`}>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-overline transition-colors ${
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
                            ? 'bg-[#0a0e17] border-[#ff4701] text-slate-200'
                            : 'bg-white border-slate-200'
                        }`}
                      />
                    ) : (
                      <span className={`text-button transition-colors ${
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
                            ? 'bg-[#0a0e17] border-[#ff4701] text-slate-200'
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
                      <span className={`px-2 py-0.5 text-overline rounded-full transition-colors ${
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
                            ? 'bg-[#0a0e17] border-[#ff4701] text-slate-200'
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
                      <span className={`text-overline uppercase tracking-wider transition-colors ${
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
            theme === 'dark' ? 'border-[#151a28]' : 'border-slate-200'
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
                  ? 'bg-[#0a0e17] border-[#151a28]'
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
                            ? 'bg-[#0a0e17] border-[#ff4701] text-slate-200'
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
                            ? 'bg-[#0a0e17] border-[#ff4701] text-slate-200'
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
                            ? 'bg-[#0a0e17] border-[#ff4701] text-slate-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleUpdate(source._id)}
                        disabled={updateMutation.isLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-lg text-caption font-bold"
                      >
                        <Save size={16} /> Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${
                          theme === 'dark'
                            ? 'bg-[#0a0e17] text-slate-200 hover:bg-[#151a28]'
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
                          ? 'bg-[#0a0e17] border-[#151a28]'
                          : 'bg-white border-slate-100'
                      }`}>
                        <button
                          onClick={() => handleEdit(source)}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                            theme === 'dark'
                              ? 'text-slate-300 hover:bg-[#0a0e17]'
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
                              ? 'text-slate-300 hover:bg-[#0a0e17]'
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
                          theme === 'dark' ? 'border-[#151a28]' : 'border-slate-100'
                        }`} />
                        <button
                          onClick={() => handleDelete(source._id)}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                            theme === 'dark'
                              ? 'text-rose-400 hover:bg-[#0a0e17]'
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
                theme === 'dark' ? 'border-[#151a28]' : 'border-slate-50'
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
                        ? 'border-[#151a28] bg-[#0a0e17] text-slate-300'
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
        <EmptyState
          icon={Rss}
          title="No RSS sources yet"
          message="Start by adding your first RSS feed to aggregate news articles"
        />
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

      {/* Category Management Modal */}
      {showCategoryModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => {
              setShowCategoryModal(false)
              handleCancelCategoryEdit()
            }}
          />
          <div className={`fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[500px] max-h-[80vh] overflow-hidden rounded-2xl z-50 ${
            theme === 'dark' ? 'bg-[#0a0e17]' : 'bg-white'
          }`}>
            <div className={`flex justify-between items-center p-5 border-b ${
              theme === 'dark' ? 'border-[#151a28]' : 'border-slate-200'
            }`}>
              <h2 className={`text-xl font-bold ${
                theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
              }`}>Manage Categories</h2>
              <button 
                onClick={() => {
                  setShowCategoryModal(false)
                  handleCancelCategoryEdit()
                }}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 max-h-[calc(80vh-140px)] overflow-y-auto">
              {/* Add New Category */}
              {!isCreatingCategory && !editingCategoryId && (
                <button
                  onClick={() => setIsCreatingCategory(true)}
                  className={`w-full flex items-center justify-center gap-2 py-3 mb-4 border-2 border-dashed rounded-xl font-medium transition-all ${
                    theme === 'dark'
                      ? 'border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-400'
                      : 'border-slate-200 text-slate-500 hover:border-indigo-500 hover:text-indigo-600'
                  }`}
                >
                  <Plus size={18} />
                  Add New Category
                </button>
              )}

              {/* Create Category Form */}
              {isCreatingCategory && (
                <div className={`p-4 mb-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-900/50 border-indigo-500' : 'bg-slate-50 border-indigo-500'
                }`}>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className={`text-xs font-medium mb-1 block ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                      }`}>Display Name</label>
                      <input
                        type="text"
                        value={categoryFormData.name}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${
                          theme === 'dark'
                            ? 'bg-[#0a0e17] border-slate-700 text-slate-200'
                            : 'bg-white border-slate-200'
                        }`}
                        placeholder="AI & Machine Learning"
                      />
                    </div>
                    <div>
                      <label className={`text-xs font-medium mb-1 block ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                      }`}>Value (ID)</label>
                      <input
                        type="text"
                        value={categoryFormData.value}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, value: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${
                          theme === 'dark'
                            ? 'bg-[#0a0e17] border-slate-700 text-slate-200'
                            : 'bg-white border-slate-200'
                        }`}
                        placeholder="AI"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateCategory}
                      disabled={createCategoryMutation.isLoading}
                      className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {createCategoryMutation.isLoading ? 'Adding...' : 'Add Category'}
                    </button>
                    <button
                      onClick={handleCancelCategoryEdit}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        theme === 'dark'
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Categories List */}
              <div className="space-y-2">
                {categoriesLoading ? (
                  <div className={`text-center py-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Loading categories...
                  </div>
                ) : techCategories.length === 0 ? (
                  <div className={`text-center py-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    No categories yet. Add your first category above.
                  </div>
                ) : (
                  techCategories.map((category) => (
                    <div 
                      key={category._id || category.value}
                      className={`p-3 rounded-xl border transition-colors ${
                        editingCategoryId === category._id
                          ? 'border-indigo-500 ring-1 ring-indigo-500'
                          : theme === 'dark'
                            ? 'border-slate-800 hover:border-slate-700'
                            : 'border-slate-100 hover:border-slate-200'
                      } ${theme === 'dark' ? 'bg-slate-900/30' : 'bg-slate-50/50'}`}
                    >
                      {editingCategoryId === category._id ? (
                        <div>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <input
                              type="text"
                              value={categoryFormData.name}
                              onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${
                                theme === 'dark'
                                  ? 'bg-[#0a0e17] border-slate-700 text-slate-200'
                                  : 'bg-white border-slate-200'
                              }`}
                            />
                            <input
                              type="text"
                              value={categoryFormData.value}
                              onChange={(e) => setCategoryFormData({ ...categoryFormData, value: e.target.value })}
                              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${
                                theme === 'dark'
                                  ? 'bg-[#0a0e17] border-slate-700 text-slate-200'
                                  : 'bg-white border-slate-200'
                              }`}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateCategory(category._id)}
                              disabled={updateCategoryMutation.isLoading}
                              className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                              {updateCategoryMutation.isLoading ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancelCategoryEdit}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                theme === 'dark'
                                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <span className={`font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                              {category.label}
                            </span>
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                              theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-500'
                            }`}>
                              {category.value}
                            </span>
                          </div>
                          {category._id && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditCategory(category)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  theme === 'dark'
                                    ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
                                    : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                                }`}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category._id)}
                                disabled={deleteCategoryMutation.isLoading}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  theme === 'dark'
                                    ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={`p-4 border-t ${
              theme === 'dark' ? 'border-[#151a28]' : 'border-slate-200'
            }`}>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                Categories without IDs are defaults and cannot be edited. Add custom categories to manage them.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default RssManagement

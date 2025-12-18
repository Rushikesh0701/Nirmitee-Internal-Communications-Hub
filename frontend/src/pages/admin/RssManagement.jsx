import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Save, X, ToggleLeft, ToggleRight, Link as LinkIcon, Tag, Globe, MoreVertical } from 'lucide-react'
import Loading from '../../components/Loading'

const RssManagement = () => {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
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

  const { data, isLoading } = useQuery(
    'adminRssSources',
    () => api.get('/admin/rss').then((res) => res.data.data)
  )

  const createMutation = useMutation(
    (data) => api.post('/admin/rss', data),
    {
      onSuccess: () => {
        toast.success('RSS Source added successfully')
        queryClient.invalidateQueries('adminRssSources')
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
        queryClient.invalidateQueries('adminRssSources')
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
        queryClient.invalidateQueries('adminRssSources')
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
        queryClient.invalidateQueries('adminRssSources')
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

  const sources = data || []

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">RSS Sources</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Manage external news feeds</p>
        </div>
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 w-full sm:w-auto"
          >
            <Plus size={18} />
            Add RSS Source
          </button>
        )}
      </div>

      {isCreating && (
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">New RSS Source</h2>
            <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Source Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                  placeholder="e.g., TechCrunch Tech"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm appearance-none cursor-pointer"
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
              <label className="text-sm font-semibold text-slate-700 ml-1">
                RSS Feed URL <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                  placeholder="https://example.com/feed"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              onClick={handleCreate}
              disabled={createMutation.isLoading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50 sm:flex-1 md:flex-none"
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
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-bold text-slate-600">Source</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">Category</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">URL</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">Status</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map((source) => (
                <tr key={source._id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {editingId === source._id ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <span className="font-semibold text-slate-700">{source.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === source._id ? (
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {techCategories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                        {source.category}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    {editingId === source._id ? (
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <span className="text-slate-500 text-sm truncate block" title={source.url}>
                        {source.url}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleMutation.mutate(source._id)}
                      className={`flex items-center gap-2 transition-colors ${
                        source.isActive ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {source.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {source.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {editingId === source._id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(source._id)}
                            disabled={updateMutation.isLoading}
                            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(source)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(source._id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet view: Card Grid */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {sources.map((source) => (
          <div 
            key={source._id} 
            className={`bg-white p-4 rounded-2xl shadow-sm border ${
              editingId === source._id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0 pr-4">
                {editingId === source._id ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      >
                        {techCategories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RSS URL</label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleUpdate(source._id)}
                        disabled={updateMutation.isLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm"
                      >
                        <Save size={16} /> Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold"
                      >
                        <X size={16} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{source.name}</h3>
                    <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full uppercase mb-3">
                      {source.category}
                    </span>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
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
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  {activeMenuId === source._id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setActiveMenuId(null)}
                      />
                      <div className="absolute right-0 top-10 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20 animate-in fade-in zoom-in duration-200 origin-top-right">
                        <button
                          onClick={() => handleEdit(source)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Edit2 size={16} className="text-indigo-500" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            toggleMutation.mutate(source._id);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
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
                        <hr className="my-1.5 border-slate-100" />
                        <button
                          onClick={() => handleDelete(source._id)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
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
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className={`flex items-center gap-2 text-xs font-bold uppercase ${
                  source.isActive ? 'text-emerald-500' : 'text-slate-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${source.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  {source.isActive ? 'Live' : 'Hidden'}
                </div>
                <button
                  onClick={() => toggleMutation.mutate(source._id)}
                  className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all active:scale-95 ${
                    source.isActive 
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700' 
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  {source.isActive ? 'Pause' : 'Resume'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {sources.length === 0 && !isLoading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <LinkIcon size={24} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No RSS sources yet</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-1">
            Start by adding your first RSS feed to aggregate news articles.
          </p>
        </div>
      )}
    </div>
  )
}

export default RssManagement

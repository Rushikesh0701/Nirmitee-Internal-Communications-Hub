import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Save } from 'lucide-react'
import { CardSkeleton } from '../../components/SkeletonLoader'

const AdminRewardsManagement = () => {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: '',
    image: '',
    isActive: true
  })

  const { data, isLoading } = useQuery(
    'adminRewards',
    () => api.get('/admin/rewards').then((res) => res.data.data)
  )

  const createMutation = useMutation(
    (data) => api.post('/admin/rewards', data),
    {
      onSuccess: () => {
        toast.success('Reward created successfully')
        queryClient.invalidateQueries('adminRewards')
        queryClient.invalidateQueries('rewardsCatalog')
        setIsCreating(false)
        setFormData({ title: '', description: '', points: '', image: '', isActive: true })
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create reward')
      }
    }
  )

  const updateMutation = useMutation(
    ({ id, data }) => api.put(`/admin/rewards/${id}`, data),
    {
      onSuccess: () => {
        toast.success('Reward updated successfully')
        queryClient.invalidateQueries('adminRewards')
        queryClient.invalidateQueries('rewardsCatalog')
        setEditingId(null)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update reward')
      }
    }
  )

  const deleteMutation = useMutation(
    (id) => api.delete(`/admin/rewards/${id}`),
    {
      onSuccess: () => {
        toast.success('Reward deleted successfully')
        queryClient.invalidateQueries('adminRewards')
        queryClient.invalidateQueries('rewardsCatalog')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete reward')
      }
    }
  )

  const handleCreate = () => {
    if (!formData.title || !formData.points) {
      toast.error('Title and points are required')
      return
    }
    createMutation.mutate(formData)
  }

  const handleUpdate = (id) => {
    if (!formData.title || !formData.points) {
      toast.error('Title and points are required')
      return
    }
    updateMutation.mutate({ id, data: formData })
  }

  const handleEdit = (reward) => {
    setEditingId(reward.id)
    setFormData({
      title: reward.title,
      description: reward.description || '',
      points: reward.points.toString(),
      image: reward.image || '',
      isActive: reward.isActive !== false
    })
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    setFormData({ title: '', description: '', points: '', image: '', isActive: true })
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this reward?')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading && !data) {
    return <CardSkeleton count={6} />
  }

  const rewards = data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rewards Management</h1>
          <p className="text-gray-600 mt-1">Manage the rewards catalog</p>
        </div>
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="btn-add"
          >
            <Plus size={16} />
            Add Reward
          </button>
        )}
      </div>

      {isCreating && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Create New Reward</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                placeholder="Reward title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={3}
                placeholder="Reward description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points Required <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                className="input"
                placeholder="e.g., 100"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="input"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleCreate}
                disabled={createMutation.isLoading}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save size={18} />
                {createMutation.isLoading ? 'Creating...' : 'Create Reward'}
              </button>
              <button onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map((reward) => (
          <div key={reward.id} className="card">
            {editingId === reward.id ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Edit Reward</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                    className="input"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Active</label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(reward.id)}
                    disabled={updateMutation.isLoading}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <Save size={16} />
                    Save
                  </button>
                  <button onClick={handleCancel} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {reward.image && (
                  <img
                    src={reward.image}
                    alt={reward.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{reward.title}</h3>
                {reward.description && (
                  <p className="text-gray-600 text-sm mb-4">{reward.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary-600">
                    {reward.points} points
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      reward.isActive !== false
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {reward.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(reward)}
                    className="btn btn-secondary flex items-center gap-2 flex-1"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(reward.id)}
                    disabled={deleteMutation.isLoading}
                    className="btn btn-danger flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {rewards.length === 0 && !isCreating && (
        <div className="text-center py-12 text-gray-500">
          No rewards found. Create your first reward to get started.
        </div>
      )}
    </div>
  )
}

export default AdminRewardsManagement


import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import { ArrowLeft, Save } from 'lucide-react'
import { useCreationStore } from '../../store/creationStore'
import Loading from '../../components/Loading'

const GroupForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { startCreation, endCreation, isAnyCreationInProgress } = useCreationStore()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
    coverImage: ''
  })

  // Fetch group data if editing
  const { data: group, isLoading: groupLoading } = useQuery(
    ['group', id],
    () => api.get(`/groups/${id}`).then((res) => res.data.data),
    { enabled: isEdit }
  )

  useEffect(() => {
    if (group && isEdit) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        isPublic: group.isPublic !== undefined ? group.isPublic : true,
        coverImage: group.coverImage || ''
      })
    }
  }, [group, isEdit])

  const createMutation = useMutation(
    (data) => api.post('/groups', data),
    {
      onSuccess: (response) => {
        toast.success('Group created successfully')
        const groupId = response.data.data.id || response.data.data._id
        queryClient.invalidateQueries(['groups'])
        endCreation()
        navigate(`/groups/${groupId}`)
      },
      onError: (error) => {
        endCreation()
        toast.error(error.response?.data?.message || 'Failed to create group')
      }
    }
  )

  const updateMutation = useMutation(
    (data) => api.put(`/groups/${id}`, data),
    {
      onSuccess: () => {
        toast.success('Group updated successfully')
        queryClient.invalidateQueries(['groups'])
        queryClient.invalidateQueries(['group', id])
        navigate(`/groups/${id}`)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update group')
      }
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Prevent if any other creation is in progress (only for create, not edit)
    if (!isEdit) {
      if (isAnyCreationInProgress()) {
        toast.error('Please wait for the current creation to complete')
        return
      }
      
      // Start creation process
      if (!startCreation('group')) {
        toast.error('Another creation is already in progress')
        return
      }
    }
    
    if (!formData.name.trim()) {
      if (!isEdit) {
        endCreation()
      }
      toast.error('Group name is required')
      return
    }

    if (isEdit) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, coverImage: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  if (isEdit && groupLoading) {
    return <Loading fullScreen />
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Group' : 'Create New Group'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image (Optional)
          </label>
          {formData.coverImage && (
            <img
              src={formData.coverImage}
              alt="Cover preview"
              className="w-full h-48 object-cover rounded-lg mb-2"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Group Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Group Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter group name"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={4}
            placeholder="Describe what this group is about..."
          />
        </div>

        {/* Privacy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Privacy
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={formData.isPublic === true}
                onChange={() => setFormData({ ...formData, isPublic: true })}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span>Public - Anyone can join and see posts</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={formData.isPublic === false}
                onChange={() => setFormData({ ...formData, isPublic: false })}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span>Private - Only members can see posts</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isLoading || updateMutation.isLoading || (!isEdit && isAnyCreationInProgress())}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            {createMutation.isLoading || updateMutation.isLoading
              ? 'Saving...'
              : isEdit
              ? 'Update Group'
              : 'Create Group'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default GroupForm


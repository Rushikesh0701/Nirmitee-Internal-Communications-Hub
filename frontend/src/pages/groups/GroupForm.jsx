import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import { ArrowLeft, Save } from 'lucide-react'
import { useCreationStore } from '../../store/creationStore'
import { DetailSkeleton } from '../../components/skeletons'

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
      onSuccess: async (response) => {
        toast.success('Group created successfully')
        const groupId = response.data.data.id || response.data.data._id
        await queryClient.invalidateQueries(['groups'])
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
      onSuccess: async () => {
        toast.success('Group updated successfully')
        await queryClient.invalidateQueries(['groups'])
        await queryClient.invalidateQueries(['group', id])
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
    return <DetailSkeleton />
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">
          {isEdit ? 'Edit Group' : 'Create New Group'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-4 space-y-4">
        {/* Cover Image */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1.5">
            Cover Image (Optional)
          </label>
          {formData.coverImage && (
            <img
              src={formData.coverImage}
              alt="Cover preview"
              className="w-full h-48 object-cover rounded-lg mb-3 border border-slate-200"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="input text-sm py-2"
          />
        </div>

        {/* Group Name */}
        <div>
          <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1.5">
            Group Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input text-sm py-2"
            placeholder="Enter group name"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1.5">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input text-sm py-2 resize-y"
            rows={4}
            placeholder="Describe what this group is about..."
          />
        </div>

        {/* Privacy */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-2">
            Privacy
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                checked={formData.isPublic === true}
                onChange={() => setFormData({ ...formData, isPublic: true })}
                className="w-4 h-4 text-slate-700 focus:ring-slate-600"
              />
              <span className="text-sm text-gray-700">Public - Anyone can join and see posts</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                checked={formData.isPublic === false}
                onChange={() => setFormData({ ...formData, isPublic: false })}
                className="w-4 h-4 text-slate-700 focus:ring-slate-600"
              />
              <span className="text-sm text-gray-700">Private - Only members can see posts</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#0a3a3c]">
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
            <Save size={20} />
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


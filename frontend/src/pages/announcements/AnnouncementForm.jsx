import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import Editor from '../../components/blog/Editor'
import { useCreationStore } from '../../store/creationStore'
import Loading from '../../components/Loading'

const AnnouncementForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { startCreation, endCreation, isAnyCreationInProgress } = useCreationStore()
  const isEdit = !!id

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      title: '',
      content: '',
      tags: '',
      scheduledAt: ''
    }
  })

  const scheduledAt = watch('scheduledAt')

  // Load existing announcement if editing
  const { data: announcement, isLoading } = useQuery(
    ['announcement', id],
    () => api.get(`/announcements/${id}`).then((res) => res.data.data),
    { enabled: isEdit }
  )

  useEffect(() => {
    if (announcement) {
      setValue('title', announcement.title)
      setValue('content', announcement.content)
      setValue('tags', announcement.tags?.join(', ') || '')
      setValue('scheduledAt', announcement.scheduledAt ? new Date(announcement.scheduledAt).toISOString().slice(0, 16) : '')
    }
  }, [announcement, setValue])

  const createMutation = useMutation(
    (data) => api.post('/announcements', data),
    {
      onSuccess: () => {
        toast.success('Announcement created successfully')
        queryClient.invalidateQueries('announcements')
        endCreation()
        navigate('/announcements')
      },
      onError: (error) => {
        endCreation()
        toast.error(error.response?.data?.message || 'Failed to create announcement')
      }
    }
  )

  const updateMutation = useMutation(
    (data) => api.put(`/announcements/${id}`, data),
    {
      onSuccess: () => {
        toast.success('Announcement updated successfully')
        queryClient.invalidateQueries('announcements')
        queryClient.invalidateQueries(['announcement', id])
        navigate('/announcements')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update announcement')
      }
    }
  )

  const onSubmit = (data) => {
    // Prevent if any other creation is in progress (only for create, not edit)
    if (!isEdit) {
      if (isAnyCreationInProgress()) {
        toast.error('Please wait for the current creation to complete')
        return
      }
      
      // Start creation process
      if (!startCreation('announcement')) {
        toast.error('Another creation is already in progress')
        return
      }
    }
    
    const payload = {
      title: data.title,
      content: data.content,
      tags: data.tags
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [],
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : undefined
    }

    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleContentChange = (data) => {
    // Editor onChange returns {html, json}, we only need html
    setValue('content', data.html || '')
  }

  if (isLoading) {
    return <Loading fullScreen />
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/announcements"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
      >
        <ArrowLeft size={18} />
        Back to Announcements
      </Link>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit Announcement' : 'Create New Announcement'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="input"
              placeholder="Enter announcement title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <Editor
              content={watch('content')}
              onChange={handleContentChange}
              placeholder="Start writing your announcement..."
              editable={true}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              {...register('tags')}
              className="input"
              placeholder="tag1, tag2, tag3"
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate multiple tags with commas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="inline mr-1" />
              Schedule Publication (Optional)
            </label>
            <input
              type="datetime-local"
              {...register('scheduledAt')}
              className="input"
            />
            {scheduledAt && (
              <p className="mt-1 text-sm text-blue-600">
                This announcement will be published on{' '}
                {new Date(scheduledAt).toLocaleString()}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to publish immediately
            </p>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading || (!isEdit && isAnyCreationInProgress())}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              {createMutation.isLoading || updateMutation.isLoading
                ? 'Saving...'
                : isEdit
                ? 'Update Announcement'
                : 'Create Announcement'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/announcements')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AnnouncementForm

